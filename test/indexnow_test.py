import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/submit_indexnow.py"
spec = importlib.util.spec_from_file_location("submit_indexnow", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
KEY = "0123456789abcdef0123456789abcdef"
ORIGIN = "https://kalendars365.lv"


class Response:
    def __init__(self, code=200, body=b"", url=module.ENDPOINT):
        self.code, self.body, self.url = code, body, url

    def getcode(self):
        return self.code

    def geturl(self):
        return self.url

    def read(self, limit):
        return self.body[:limit]

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


class Opener:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.requests = []

    def open(self, request, timeout):
        self.requests.append(request)
        result = self.responses.pop(0)
        if isinstance(result, Exception):
            raise result
        return result


class IndexNowTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.repo = self.root / "repo"
        self.site = self.repo / "_site"
        self.config_path = self.repo / "_data/indexnow.json"
        self.config = {"host": module.HOST, "key": KEY, "keyLocation": f"{ORIGIN}/{KEY}.txt"}
        self.write(self.config_path, json.dumps(self.config))
        self.write(self.repo / f"{KEY}.txt", KEY)
        self.write(self.site / f"{KEY}.txt", KEY)
        self.write_page("/")
        self.write_page("/kalendars/")
        self.write_sitemap([ORIGIN + "/", ORIGIN + "/kalendars/"])

    def write(self, path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def write_page(self, path, robots="index,follow", canonical=None, extra=""):
        relative = path.lstrip("/") + ("index.html" if path.endswith("/") else "")
        self.write(self.site / relative,
                   '<html><head><link rel="canonical" href="' + (canonical or ORIGIN + path) + '">'
                   '<meta name="robots" content="' + robots + '">' + extra + '</head><body>Fixture</body></html>')

    def write_sitemap(self, urls):
        self.write(self.site / "sitemap.xml", f'<urlset xmlns="{module.NS}">' + "".join(
            f"<url><loc>{url}</loc></url>" for url in urls) + "</urlset>")

    def prepare(self):
        return module.prepare(self.site, self.config_path)

    def live_key(self, code=200, body=None, url=None):
        return Response(code, KEY.encode() if body is None else body, url or self.config["keyLocation"])

    def test_import_and_default_dry_run_do_not_open_network(self):
        with patch("urllib.request.OpenerDirector.open", side_effect=AssertionError("Unexpected network")) as network:
            imported = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(imported)
            with patch.object(imported, "build_opener", side_effect=AssertionError("Unexpected network client")):
                output = io.StringIO()
                receipt = self.root / "receipt.json"
                with contextlib.redirect_stdout(output):
                    code = imported.main(["--site-dir", str(self.site), "--config", str(self.config_path),
                                          "--report", str(receipt)])
            network.assert_not_called()
        summary = json.loads(output.getvalue())
        report = json.loads(receipt.read_text())
        self.assertEqual(code, 0)
        self.assertEqual(summary["status"], "dry_run")
        self.assertFalse(summary["network_attempted"])
        self.assertIsNone(summary["http_status"])
        self.assertEqual(report["urls"], [ORIGIN + "/", ORIGIN + "/kalendars/"])
        self.assertNotIn("urls", summary)
        self.assertEqual(summary["url_count"], 2)

    def test_duplicate_urls_are_not_submitted_twice_and_payload_is_exact(self):
        self.write_sitemap([ORIGIN + "/", ORIGIN + "/", ORIGIN + "/kalendars/"])
        payload, body, report = self.prepare()
        self.assertEqual(payload, dict(self.config, urlList=[ORIGIN + "/", ORIGIN + "/kalendars/"]))
        self.assertEqual(json.loads(body), payload)
        self.assertEqual(report["payload_sha256"], module.sha256(body))
        self.assertEqual(report["duplicates_removed"], 1)
        self.assertEqual(report["sitemap_entries"], 3)
        self.assertEqual(report["url_count"], 2)

    def test_wrong_host_scheme_queries_fragments_and_path_aliases_fail(self):
        for url in ("https://other.example/", "http://kalendars365.lv/", "https://www.kalendars365.lv/",
                    "https://kalendars365.lv:443/", "https://user@kalendars365.lv/", ORIGIN + "/?",
                    ORIGIN + "/#", ORIGIN + "/?private=value", ORIGIN + "/#fragment", ORIGIN + "/../",
                    ORIGIN + "//", ORIGIN + "/%2e%2e/", ORIGIN + "/%252E%252E/", ORIGIN + "/a%2Fb/",
                    ORIGIN + "/%00/", ORIGIN + "/%ZZ/", ORIGIN + "/%C3%28/", ORIGIN + "/lietošanas/",
                    " " + ORIGIN + "/", ORIGIN + "/\n"):
            with self.subTest(url=url):
                self.write_sitemap([url])
                with self.assertRaises(module.ValidationError):
                    self.prepare()

    def test_encoded_unicode_page_is_valid(self):
        self.write_page("/lietošanas/", canonical=ORIGIN + "/lieto%C5%A1anas/")
        self.write_sitemap([ORIGIN + "/lieto%C5%A1anas/"])
        self.assertEqual(self.prepare()[0]["urlList"], [ORIGIN + "/lieto%C5%A1anas/"])

    def test_html_unicode_canonical_matches_encoded_sitemap_location(self):
        self.write_page("/lietošanas-noteikumi/")
        url = ORIGIN + "/lieto%C5%A1anas-noteikumi/"
        self.write_sitemap([url])
        self.assertEqual(self.prepare()[0]["urlList"], [url])

    def test_noindex_and_none_pages_are_excluded(self):
        for directive in ("noindex,follow", "NOINDEX, FOLLOW", "none", "max-image-preview:large, noindex"):
            with self.subTest(directive=directive):
                self.write_page("/kalendars/", robots=directive)
                payload, _, report = self.prepare()
                self.assertEqual(payload["urlList"], [ORIGIN + "/"])
                self.assertEqual(report["excluded_noindex_urls"], [ORIGIN + "/kalendars/"])
        for bot in ("googlebot", "bingbot"):
            with self.subTest(bot=bot):
                self.write_page("/kalendars/", extra=f'<meta content="noindex" name="{bot}">')
                self.assertEqual(self.prepare()[0]["urlList"], [ORIGIN + "/"])

    def test_response_noindex_rule_is_excluded(self):
        self.write(self.site / "_headers", "/kalendars/*\n  X-Robots-Tag: noindex, follow\n")
        self.assertEqual(self.prepare()[0]["urlList"], [ORIGIN + "/"])

    def test_missing_noncanonical_or_redirecting_built_page_fails(self):
        self.write_sitemap([ORIGIN + "/absent/"])
        with self.assertRaisesRegex(module.ValidationError, "no built HTML"):
            self.prepare()
        self.write_sitemap([ORIGIN + "/"])
        self.write_page("/", canonical=ORIGIN + "/kalendars/")
        with self.assertRaisesRegex(module.ValidationError, "self-canonical"):
            self.prepare()
        self.write_page("/", extra='<meta http-equiv="refresh" content="0;url=/kalendars/">')
        with self.assertRaisesRegex(module.ValidationError, "refresh redirect"):
            self.prepare()

    def test_symlink_escape_is_rejected(self):
        outside = self.root / "outside.html"
        self.write(outside, '<html><head><link rel="canonical" href="' + ORIGIN + '/escape.html"></head></html>')
        (self.site / "escape.html").symlink_to(outside)
        self.write_sitemap([ORIGIN + "/escape.html"])
        with self.assertRaisesRegex(module.ValidationError, "outside the build"):
            self.prepare()

    def test_local_key_and_config_mismatches_fail(self):
        for file in (self.repo / f"{KEY}.txt", self.site / f"{KEY}.txt"):
            self.write(file, KEY + "\n")
            with self.assertRaises(module.ValidationError):
                self.prepare()
            self.write(file, KEY)
        for changed in ({"host": "other.example"}, {"keyLocation": ORIGIN + "/folder/key.txt"},
                        {"key": "not-a-hexadecimal-verification-key"}):
            with self.subTest(changed=changed):
                self.write(self.config_path, json.dumps(dict(self.config, **changed)))
                with self.assertRaises(module.ValidationError):
                    self.prepare()

    def test_empty_excessive_and_unsupported_sitemap_fail(self):
        with patch.object(module, "MAX_URLS", 1):
            with self.assertRaisesRegex(module.ValidationError, "between 1 and 1"):
                self.prepare()
        self.write_sitemap([])
        with self.assertRaisesRegex(module.ValidationError, "between 1 and"):
            self.prepare()
        for content in ('<!DOCTYPE urlset><urlset/>', '<sitemapindex xmlns="' + module.NS + '"/>',
                        '<urlset xmlns="' + module.NS + '"><url><loc>' + ORIGIN + '/</loc><loc>' + ORIGIN + '/</loc></url></urlset>'):
            self.write(self.site / "sitemap.xml", content)
            with self.assertRaises(module.ValidationError):
                self.prepare()

    def test_live_key_mismatch_non200_and_foreign_redirect_prevent_post(self):
        for response in (self.live_key(body=b"wrong"), self.live_key(body=KEY.encode() + b"\n"),
                         self.live_key(code=202), self.live_key(code=404),
                         self.live_key(url="https://other.example/key.txt"),
                         self.live_key(code=302, url=self.config["keyLocation"])):
            with self.subTest(code=response.code, url=response.url, body=response.body):
                payload, body, report = self.prepare()
                opener = Opener(response)
                self.assertFalse(module.submit(payload, body, report, opener=opener))
                self.assertEqual(len(opener.requests), 1)
                self.assertFalse(report["submitted"])
                self.assertEqual(report["status"], "key_verification_failed")
                self.assertIsNone(report["http_status"])

    def test_200_receipt_and_202_pending_are_reported_distinctly(self):
        for code, status in ((200, "accepted"), (202, "key_validation_pending")):
            with self.subTest(code=code):
                payload, body, report = self.prepare()
                opener = Opener(self.live_key(), Response(code))
                self.assertTrue(module.submit(payload, body, report, opener=opener))
                self.assertEqual(report["status"], status)
                self.assertEqual(report["http_status"], code)
                self.assertIn("not guaranteed", report["message"])
                self.assertEqual(len(opener.requests), 2)
                get, post = opener.requests
                self.assertEqual((get.get_method(), post.get_method()), ("GET", "POST"))
                self.assertEqual(post.full_url, "https://api.indexnow.org/indexnow")
                self.assertEqual(post.data, body)
                self.assertEqual(post.get_header("Content-type"), "application/json; charset=utf-8")
                self.assertEqual(post.get_header("User-agent"), module.USER_AGENT)
                self.assertEqual(get.get_header("User-agent"), module.USER_AGENT)

    def test_api_errors_never_retry_and_preserve_http_code(self):
        for code in (301, 400, 403, 422, 429, 500):
            with self.subTest(code=code):
                payload, body, report = self.prepare()
                opener = Opener(self.live_key(), Response(code, b"error"))
                self.assertFalse(module.submit(payload, body, report, opener=opener))
                self.assertEqual(report["status"], "http_error")
                self.assertEqual(report["http_status"], code)
                self.assertEqual(report["response_body"], "error")
                self.assertEqual(len(opener.requests), 2)

    def test_real_urllib_http_error_is_recorded(self):
        payload, body, report = self.prepare()
        error = HTTPError(module.ENDPOINT, 429, "Too Many Requests", {}, io.BytesIO(b"slow down"))
        opener = Opener(self.live_key(), error)
        self.assertFalse(module.submit(payload, body, report, opener=opener))
        self.assertEqual(report["http_status"], 429)
        self.assertEqual(report["response_body"], "slow down")
        self.assertEqual(len(opener.requests), 2)

    def test_network_errors_describe_possible_delivery_without_retry(self):
        for responses, uncertain, attempts in (([URLError("key unavailable")], False, 1),
                                               ([self.live_key(), URLError("connection lost")], True, 2)):
            payload, body, report = self.prepare()
            opener = Opener(*responses)
            self.assertFalse(module.submit(payload, body, report, opener=opener))
            self.assertEqual(report["status"], "network_error")
            self.assertEqual(report["delivery_uncertain"], uncertain)
            self.assertEqual(len(opener.requests), attempts)

    def test_redirect_handler_never_follows_a_redirect(self):
        self.assertIsNone(module.NoRedirects().redirect_request(None, None, 302, "Found", {}, "https://other.example/"))

    def test_submit_cli_writes_actual_receipt_outside_repository(self):
        receipt = self.root / "receipts/indexnow.json"
        opener = Opener(self.live_key(), Response(202))
        with patch.object(module, "build_opener", return_value=opener), contextlib.redirect_stdout(io.StringIO()):
            code = module.main(["--site-dir", str(self.site), "--config", str(self.config_path),
                                "--submit", "--report", str(receipt)])
        self.assertEqual(code, 0)
        report = json.loads(receipt.read_text())
        self.assertEqual(report["http_status"], 202)
        self.assertEqual(report["status"], "key_validation_pending")
        self.assertEqual(report["url_count"], len(report["urls"]))
        self.assertEqual(len(opener.requests), 2)

    def test_repository_receipt_destination_fails_before_network(self):
        with patch.object(module, "build_opener", side_effect=AssertionError("Unexpected network")), \
                contextlib.redirect_stderr(io.StringIO()):
            code = module.main(["--site-dir", str(self.site), "--config", str(self.config_path),
                                "--submit", "--report", str(ROOT / "docs/indexnow-receipt.json")])
        self.assertEqual(code, 2)
        self.assertFalse((ROOT / "docs/indexnow-receipt.json").exists())


if __name__ == "__main__":
    unittest.main()
