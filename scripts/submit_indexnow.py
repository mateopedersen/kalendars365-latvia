#!/usr/bin/env python3
"""Prepare one initial IndexNow notification; no network unless --submit is given.

Uses only the Python standard library. The root verification key is public website
ownership evidence, not an account/API credential. Ongoing change notifications
are handled separately by Cloudflare Crawler Hints; this is a manual bootstrap.

Protocol: https://www.indexnow.org/documentation
The documented 200 response acknowledges receipt; 202 means key validation is
pending. Neither response guarantees crawling or indexing. There are no retries.
"""

import argparse
from datetime import datetime, timezone
import fnmatch
import hashlib
from html.parser import HTMLParser
from http.client import HTTPException
import json
from pathlib import Path
import re
import sys
import tempfile
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import build_opener, HTTPRedirectHandler, Request
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
HOST = "kalendars365.lv"
ORIGIN = "https://" + HOST
ENDPOINT = "https://api.indexnow.org/indexnow"
USER_AGENT = "Kalendars365-IndexNow/1.0 (+https://kalendars365.lv/)"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
MAX_URLS = 10_000
MAX_XML_BYTES = 50 * 1024 * 1024
MAX_RESPONSE_BYTES = 8192
NOINDEX = re.compile(r"(?:^|[\s,:])(?:noindex|none)(?:$|[\s,;])", re.I)


class ValidationError(ValueError):
    pass


class NoRedirects(HTTPRedirectHandler):
    """Do not turn the single request into extra requests or follow other hosts."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_head = False
        self.has_html = False
        self.canonicals = []
        self.noindex = False
        self.refresh = False

    def handle_starttag(self, tag, attrs):
        values = {name.lower(): value or "" for name, value in attrs}
        if tag == "html":
            self.has_html = True
        if tag == "head":
            self.in_head = True
        if not self.in_head:
            return
        if tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonicals.append(values.get("href", ""))
        if tag == "meta":
            bot = values.get("name", "").lower()
            if bot in {"robots", "googlebot", "bingbot"}:
                self.noindex |= bool(NOINDEX.search(values.get("content", "")))
            self.refresh |= values.get("http-equiv", "").lower() == "refresh"

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def checked_path(url):
    """Accept exactly this HTTPS host and one canonical, encoded absolute path."""
    # urlsplit normalizes away some whitespace/control characters; reject those
    # in the original input before parsing so that no invalid URL is submitted.
    if url != url.strip() or any(ord(char) < 32 or ord(char) == 127 for char in url):
        raise ValidationError(f"Whitespace or control bytes in URL: {url!r}")
    try:
        parts = urlsplit(url)
    except ValueError as exc:
        raise ValidationError(f"Invalid URL: {url!r}") from exc
    if (parts.scheme != "https" or parts.netloc != HOST or "?" in url or "#" in url
            or not parts.path.startswith("/")):
        raise ValidationError(f"URL must use {ORIGIN} without query or fragment: {url!r}")
    path = parts.path
    if re.search(r"%(?![0-9A-Fa-f]{2})", path):
        raise ValidationError(f"Malformed URL escape: {url!r}")
    try:
        decoded = unquote(path, encoding="utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        raise ValidationError(f"Invalid UTF-8 URL path: {url!r}") from exc
    # Reject traversal, path aliases, escaped separators, control bytes and double
    # encoding instead of letting URL/file normalization silently change identity.
    if ("\\" in decoded or "%" in decoded or "//" in decoded
            or any(ord(char) < 32 or ord(char) == 127 for char in decoded)
            or any(segment in {".", ".."} for segment in decoded.split("/"))
            or re.search(r"%(?:2[fF]|5[cC])", path)
            or quote(decoded, safe="/:@-._~!$&'()*+,;=") != path):
        raise ValidationError(f"Noncanonical or unsafe URL path: {url!r}")
    return decoded


def read_config(config_path):
    config = json.loads(config_path.read_text(encoding="utf-8"))
    if not isinstance(config, dict) or set(config) != {"host", "key", "keyLocation"}:
        raise ValidationError("Config must contain only host, key and keyLocation")
    key = config["key"]
    if config["host"] != HOST or not isinstance(key, str) or not re.fullmatch(r"[0-9a-f]{32}", key):
        raise ValidationError("Config must use kalendars365.lv and its 32-character hexadecimal key")
    if config["keyLocation"] != f"{ORIGIN}/{key}.txt":
        raise ValidationError("keyLocation must be the configured root key file")
    source_key = config_path.parent.parent / (key + ".txt")
    if source_key.read_bytes() != key.encode("utf-8"):
        raise ValidationError("Source verification key file must contain exactly the configured key")
    return config


def blocked_by_headers(site_dir, path):
    headers_file = site_dir / "_headers"
    if not headers_file.is_file():
        return False
    patterns = []
    for line in headers_file.read_text(encoding="utf-8").splitlines():
        if line and not line[0].isspace() and not line.startswith("#"):
            patterns = [line.strip()]
        elif line[:1].isspace() and ":" in line:
            name, value = line.strip().split(":", 1)
            if name.lower() == "x-robots-tag" and NOINDEX.search(value):
                for pattern in patterns:
                    # Cloudflare Pages supports wildcard splats and named segments.
                    pattern = re.sub(r":[A-Za-z_][A-Za-z0-9_]*", "*", pattern)
                    if fnmatch.fnmatchcase(path, pattern):
                        return True
    return False


def prepare(site_dir, config_path):
    site_dir = site_dir.resolve()
    config = read_config(config_path.resolve())
    if (site_dir / (config["key"] + ".txt")).read_bytes() != config["key"].encode("utf-8"):
        raise ValidationError("Built verification key does not match; rebuild before submission")
    sitemap = (site_dir / "sitemap.xml").read_bytes()
    if len(sitemap) > MAX_XML_BYTES or b"<!DOCTYPE" in sitemap.upper() or b"<!ENTITY" in sitemap.upper():
        raise ValidationError("Sitemap is too large or contains unsupported XML declarations")
    tree = ET.fromstring(sitemap)
    if tree.tag != f"{{{NS}}}urlset":
        raise ValidationError("Expected a standard sitemap urlset, not an index or other XML")
    urls, excluded, seen = [], [], set()
    entries = duplicates = 0
    for element in tree:
        locations = element.findall(f"{{{NS}}}loc")
        if element.tag != f"{{{NS}}}url" or len(locations) != 1 or not locations[0].text:
            raise ValidationError("Every sitemap entry must contain exactly one URL location")
        url = locations[0].text
        path = checked_path(url)
        entries += 1
        if url in seen:
            duplicates += 1
            continue
        seen.add(url)
        relative = path.lstrip("/") + ("index.html" if path.endswith("/") else "")
        document_path = (site_dir / relative).resolve()
        try:
            document_path.relative_to(site_dir)
        except ValueError as exc:
            raise ValidationError(f"Page resolves outside the build directory: {url}") from exc
        if document_path.suffix.lower() != ".html" or not document_path.is_file():
            raise ValidationError(f"Sitemap URL has no built HTML page: {url}")
        document = Document()
        document.feed(document_path.read_text(encoding="utf-8"))
        if document.noindex or blocked_by_headers(site_dir, path):
            excluded.append(url)
            continue
        # HTML permits a Unicode IRI. Compare its UTF-8 URL spelling with the
        # sitemap without normalizing hosts, delimiters or existing escapes.
        canonical_urls = ["".join(char if char.isascii() else quote(char, safe="")
                                  for char in href) for href in document.canonicals]
        if not document.has_html or canonical_urls != [url] or document.refresh:
            raise ValidationError(f"Page must be HTML, self-canonical and not a refresh redirect: {url}")
        urls.append(url)
    if not urls or len(urls) > MAX_URLS:
        raise ValidationError(f"One submission must contain between 1 and {MAX_URLS} indexable URLs")
    payload = dict(config, urlList=urls)
    body = json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
    report = {
        "mode": "dry-run", "status": "dry_run", "endpoint": ENDPOINT,
        "user_agent": USER_AGENT, "host": HOST, "key_location": config["keyLocation"],
        "sitemap_sha256": sha256(sitemap), "payload_sha256": sha256(body),
        "url_count": len(urls), "urls": urls, "sitemap_entries": entries,
        "duplicates_removed": duplicates, "excluded_noindex_urls": excluded,
        "network_attempted": False, "submitted": False, "http_status": None,
        "message": "Validated locally. No network requests made; crawling and indexing are not guaranteed.",
    }
    return payload, body, report


def request_once(opener, request, timeout):
    try:
        response = opener.open(request, timeout=timeout)
    except HTTPError as exc:
        response = exc
    with response:
        return response.getcode(), response.geturl(), response.read(MAX_RESPONSE_BYTES + 1)


def submit(payload, body, report, timeout=30, opener=None):
    """One key GET, then at most one POST. Never follow redirects or retry."""
    opener = opener or build_opener(NoRedirects())
    report.update(mode="submit", network_attempted=True)
    headers = {"User-Agent": USER_AGENT, "Accept": "text/plain"}
    try:
        code, final_url, key_body = request_once(
            opener, Request(payload["keyLocation"], headers=headers, method="GET"), timeout)
        report["key_verification"] = {"http_status": code, "url": final_url,
                                      "body_sha256": sha256(key_body)}
        if code != 200 or final_url != payload["keyLocation"] or key_body != payload["key"].encode("utf-8"):
            report.update(status="key_verification_failed",
                          message="Live key must return HTTP 200 and the exact configured text at its original URL. No POST sent.")
            return False
        request = Request(ENDPOINT, data=body, method="POST", headers={
            "User-Agent": USER_AGENT, "Content-Type": "application/json; charset=utf-8", "Accept": "application/json"})
        # Record the attempt before opening: a network error can occur after the
        # server receives the body, so that case must not trigger an automatic retry.
        report["submitted"] = True
        code, final_url, response_body = request_once(opener, request, timeout)
        report.update(http_status=code, response_url=final_url,
                      response_body=response_body[:MAX_RESPONSE_BYTES].decode("utf-8", errors="replace"),
                      response_body_truncated=len(response_body) > MAX_RESPONSE_BYTES,
                      received_at=datetime.now(timezone.utc).isoformat())
        if final_url == ENDPOINT and code == 200:
            report.update(status="accepted", message="IndexNow acknowledged receipt. Crawling and indexing are not guaranteed.")
            return True
        if final_url == ENDPOINT and code == 202:
            report.update(status="key_validation_pending", message="IndexNow received the URLs; key validation is pending. Crawling and indexing are not guaranteed.")
            return True
        report.update(status="http_error", message="IndexNow did not acknowledge this submission as accepted. No automatic retry was made.")
    except (OSError, URLError, HTTPException) as exc:
        report.update(status="network_error", message=str(exc),
                      delivery_uncertain=report["submitted"])
    return False


def write_report(path, report):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False) as file:
        json.dump(report, file, indent=2, ensure_ascii=False)
        file.write("\n")
        temporary = Path(file.name)
    temporary.replace(path)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site-dir", type=Path, default=ROOT / "_site", help="Built site directory (default: repository _site)")
    parser.add_argument("--config", type=Path, default=ROOT / "_data/indexnow.json")
    parser.add_argument("--submit", action="store_true", help="Verify the live key and make ONE notification POST; no retries")
    parser.add_argument("--report", type=Path, help="Write a JSON receipt and full URL list outside the repository")
    parser.add_argument("--timeout", type=float, default=30, help="Seconds per network request (default: 30)")
    args = parser.parse_args(argv)
    try:
        if not 0 < args.timeout <= 120:
            raise ValidationError("timeout must be greater than 0 and at most 120 seconds")
        report_path = args.report.resolve() if args.report else None
        if report_path:
            try:
                report_path.relative_to(ROOT)
            except ValueError:
                pass
            else:
                raise ValidationError("Save the report outside the repository so receipts and URL lists are not deployed")
        payload, body, report = prepare(args.site_dir, args.config)
        # Make sure the selected receipt destination works before a network call.
        if report_path:
            write_report(report_path, report)
        success = submit(payload, body, report, timeout=args.timeout) if args.submit else True
        if report_path:
            write_report(report_path, report)
        summary = {key: value for key, value in report.items() if key not in {"urls", "excluded_noindex_urls"}}
        summary["excluded_noindex_count"] = len(report["excluded_noindex_urls"])
        if report_path:
            summary["report_path"] = str(report_path)
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        return 0 if success else 1
    except (ValidationError, OSError, ValueError, ET.ParseError) as exc:
        print(json.dumps({"status": "validation_failed", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
