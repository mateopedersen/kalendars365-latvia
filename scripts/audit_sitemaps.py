"""Read-only sitemap verification. Standard library only; no external requests."""
import argparse
import collections
import datetime as dt
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
from urllib.robotparser import RobotFileParser
from zoneinfo import ZoneInfo

ORIGIN = 'https://kalendars365.lv'
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1'
S = '{' + NS + '}'
I = '{' + IMAGE_NS + '}'
MAX_BYTES = 50 * 1024 * 1024
MAX_URLS = 50_000
IMAGE = re.compile(r'\.(avif|bmp|gif|jpe?g|png|svg|webp)$', re.I)
EXCLUDED = {'/pilsetas-un-fotografijas/', '/404.html', '/500.html'}


def public_url(path):
    return ORIGIN + quote(path, safe='/')


def path_from_url(value):
    parsed = urlsplit(value)
    if (not value.isascii() or parsed.scheme != 'https' or parsed.netloc != 'kalendars365.lv'
            or parsed.query or parsed.fragment or len(value) >= 2048):
        raise ValueError('Expected an encoded, absolute canonical HTTPS URL without parameters')
    path = unquote(parsed.path, errors='strict')
    if (not path.startswith('/') or path.startswith('//') or re.search(r'[\s\x00-\x1f\\]', path)
            or any(part in ('.', '..') for part in path.split('/')) or '%' in path):
        raise ValueError('Unsafe or aliased public path')
    if public_url(path) != value:
        raise ValueError('Noncanonical URL escaping')
    return path


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.canonicals, self.robots, self.image_candidates = [], [], []
        self.main = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'main':
            self.main = True
        if tag == 'link' and 'canonical' in a.get('rel', '').lower().split():
            self.canonicals.append(a.get('href', ''))
        if tag == 'meta':
            if a.get('name', '').lower() in ('robots', 'googlebot', 'googlebot-image'):
                self.robots.extend(re.split(r'[,\s]+', a.get('content', '').lower()))
            if (a.get('property') or a.get('name')) in ('og:image', 'twitter:image'):
                self.image_candidates.append(a.get('content', ''))
        if not self.main or tag == 'use' or (tag == 'img' and a.get('alt') == ''):
            return
        for key in ('src', 'href', 'xlink:href', 'poster', 'data-src'):
            if a.get(key):
                self.image_candidates.append(a[key])
        if a.get('srcset') and not a['srcset'].strip().startswith('data:'):
            self.image_candidates.extend(part.strip().split()[0] for part in a['srcset'].split(',') if part.strip())
        self.css_images(a.get('style', ''))

    def handle_endtag(self, tag):
        if tag == 'main':
            self.main = False

    def handle_data(self, data):
        if self.main:
            self.css_images(data)

    def css_images(self, text):
        self.image_candidates.extend(re.findall(r'url\(\s*[\'"]?([^\s)\'";]+)', text, re.I))


def content_images(candidates):
    images = set()
    for raw in candidates:
        if not raw.startswith('/') and not raw.startswith(ORIGIN + '/'):
            continue
        if raw.startswith('//'):
            continue
        path = unquote(re.split(r'[?#]', raw.removeprefix(ORIGIN), maxsplit=1)[0])
        if IMAGE.search(path):
            images.add(public_url(path))
    return images


def rule_regex(rule):
    return re.compile('^' + ''.join('.*' if p == '*' else '[^/]+' if p.startswith(':') else re.escape(p)
                                  for p in re.split(r'(\*|:[A-Za-z]\w*)', rule)) + '$')


def audit(site, source, today=None):
    site, source = Path(site).resolve(), Path(source).resolve()
    today = today or dt.datetime.now(ZoneInfo('Europe/Riga')).date()
    errors, files = [], {}

    def fail(code, url='', detail=''):
        errors.append({'code': code, 'url': url, 'detail': str(detail)})

    def parse_map(name, image_map=False):
        file = site / name
        try:
            data = file.read_bytes()
            files[name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
            if len(data) > MAX_BYTES:
                raise ValueError('Exceeds 50 MB uncompressed')
            text = data.decode('utf-8')
            if not text.startswith('<?xml version="1.0" encoding="UTF-8"?>') or re.search(r'<!DOCTYPE|<!ENTITY', text, re.I):
                raise ValueError('Missing UTF-8 declaration or forbidden document/entity declaration')
            root = ET.fromstring(text)
            if root.tag != S + 'urlset' or root.attrib or not 0 < len(root) <= MAX_URLS:
                raise ValueError('Invalid urlset namespace, attributes or URL count')
            rows = {}
            for node in root:
                if node.tag != S + 'url' or node.attrib:
                    raise ValueError('Unexpected XML element')
                locs = node.findall(S + 'loc')
                if len(locs) != 1 or node[0].tag != S + 'loc' or list(locs[0]):
                    raise ValueError('Expected one first-child loc')
                url = locs[0].text or ''
                try:
                    path = path_from_url(url)
                except (ValueError, UnicodeError) as error:
                    fail('invalid-url', url, error)
                    continue
                if path in rows:
                    fail('duplicate-url', url, name)
                images, lastmods = [], node.findall(S + 'lastmod')
                allowed = {S + 'loc', I + 'image'} if image_map else {S + 'loc', S + 'lastmod'}
                if any(child.tag not in allowed or child.attrib for child in node):
                    fail('unexpected-tags', url, name)
                if image_map:
                    for image in node.findall(I + 'image'):
                        if len(image) != 1 or image[0].tag != I + 'loc' or image[0].attrib or list(image[0]):
                            fail('image-structure', url)
                            continue
                        image_url = image[0].text or ''
                        try:
                            image_path = path_from_url(image_url)
                        except (ValueError, UnicodeError) as error:
                            fail('invalid-image-url', image_url, error)
                            continue
                        if not IMAGE.search(image_path) or not image_path.startswith(('/assets/', '/downloads/')):
                            fail('image-url', image_url)
                        images.append(image_url)
                    if not 0 < len(images) <= 1000 or len(set(images)) != len(images):
                        fail('image-count', url, len(images))
                elif len(lastmods) != 1 or list(lastmods[0]) or len(node) != 2:
                    fail('lastmod-structure', url)
                rows[path] = {'loc': url, 'lastmod': lastmods[0].text if lastmods else None, 'images': images}
            return rows
        except (OSError, ValueError, UnicodeError, ET.ParseError) as error:
            fail('invalid-xml', name, error)
            return {}

    manifest = json.loads((source / 'docs/route-manifest.json').read_text())
    records = {}
    for row in manifest:
        path = row['url']
        if path in records:
            fail('duplicate-registry-route', path)
        records[path] = row
        if row.get('canonicalPath') != path or type(row.get('indexable')) is not bool:
            fail('registry-identity', path)
        if row['indexable'] != (path not in EXCLUDED):
            fail('registry-indexability', path)
    expected = {url: row for url, row in records.items() if row['indexable']}
    pages, image_pages = parse_map('sitemap.xml'), parse_map('image-sitemap.xml', True)
    for name, rows in (('pages', pages), ('images', image_pages)):
        for path in sorted(expected.keys() - rows.keys()):
            fail('missing-' + name, path)
        for path in sorted(rows.keys() - expected.keys()):
            fail('unexpected-' + name, path)
    for path, row in pages.items():
        try:
            raw = row['lastmod'] or ''
            date = dt.date.fromisoformat(raw)
            if date.isoformat() != raw or date > today:
                raise ValueError('Impossible, non-ISO or future modification date')
            source_row = expected.get(path, {})
            if raw != source_row.get('significantModifiedAt') or raw != source_row.get('lastmod'):
                fail('revision-mismatch', path, raw)
        except ValueError as error:
            fail('invalid-lastmod', path, error)

    robots_text = (site / 'robots.txt').read_text()
    robots = RobotFileParser()
    robots.parse(robots_text.splitlines())
    declared = re.findall(r'^Sitemap:\s*(\S+)\s*$', robots_text, re.M | re.I)
    if sorted(declared) != sorted(ORIGIN + '/' + name for name in files):
        fail('robots-discovery', detail=declared)
    redirects = []
    for line in (site / '_redirects').read_text().splitlines():
        if line.startswith('/'):
            parts = line.split()
            redirects.append(rule_regex(parts[0]))
    header_rules, current = [], None
    for line in (site / '_headers').read_text().splitlines():
        if line.startswith('/'):
            current = {'regex': rule_regex(line.strip()), 'headers': {}}
            header_rules.append(current)
        elif current is not None and ':' in line and line[:1].isspace():
            key, value = line.strip().split(':', 1)
            current['headers'][key.lower()] = value.strip()

    def crawlable(path, image=False):
        url = public_url(path)
        for bot in ('Googlebot', 'Googlebot-Image') if image else ('Googlebot',):
            if not robots.can_fetch(bot, url):
                fail('robots-blocked', url, bot)
        if any(rule.match(path) for rule in redirects):
            fail('redirected-target', url)
        headers = {}
        for rule in header_rules:
            if rule['regex'].match(path):
                headers.update(rule['headers'])
        if re.search(r'\b(noindex|noimageindex|none)\b', headers.get('x-robots-tag', ''), re.I):
            fail('response-indexing-blocked', url)

    seen_html = set()
    for file in sorted(site.rglob('*.html')):
        relative = '/' + file.relative_to(site).as_posix()
        path = relative[:-10] if relative.endswith('/index.html') else relative
        seen_html.add(path)
        doc = Document()
        doc.feed(file.read_text())
        if len(doc.canonicals) != 1 or unquote(doc.canonicals[0]) != ORIGIN + path:
            fail('html-canonical', path, doc.canonicals)
        if path in EXCLUDED:
            if 'noindex' not in doc.robots or path in pages or path in image_pages:
                fail('excluded-document', path)
            continue
        if path not in expected:
            fail('unregistered-html', path)
        if set(doc.robots) & {'noindex', 'noimageindex', 'none'}:
            fail('html-indexing-blocked', path)
        actual_images = set(image_pages.get(path, {}).get('images', []))
        wanted_images = content_images(doc.image_candidates)
        if path == '/':
            # This independent source catalog also covers images selected by
            # the homepage's city control after initial rendering.
            cities = json.loads((source / '_data/cities.json').read_text())['cities']
            dynamic = [city[key]['src'] for city in cities for key in ('photo', 'nightPhoto') if city.get(key)]
            wanted_images.update(content_images(dynamic))
        if actual_images != wanted_images:
            fail('image-content-coverage', path, {'missing': sorted(wanted_images - actual_images), 'extra': sorted(actual_images - wanted_images)})
        crawlable(path)
    for path in sorted(expected.keys() - seen_html):
        fail('missing-html', path)

    unique_images = sorted({image for row in image_pages.values() for image in row['images']})
    for image in unique_images:
        path = path_from_url(image)
        file = (site / path.lstrip('/')).resolve()
        if not file.is_relative_to(site) or not file.is_file() or not file.stat().st_size:
            fail('missing-image-file', image)
        crawlable(path, True)
    for name in ('sitemap.xml', 'image-sitemap.xml'):
        crawlable('/' + name)
    return {'schemaVersion': 1, 'scope': 'local built files; no external requests', 'origin': ORIGIN,
            'pageUrls': len(pages), 'indexablePages': len(expected), 'htmlDocuments': len(seen_html),
            'imagePages': len(image_pages), 'uniqueImages': len(unique_images),
            'imageReferences': sum(len(r['images']) for r in image_pages.values()),
            'excluded': sorted(EXCLUDED), 'files': files,
            'families': dict(sorted(collections.Counter(r['family'] for r in expected.values()).items())),
            'errors': errors}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', default='_site')
    parser.add_argument('--source', default='.')
    parser.add_argument('--output')
    args = parser.parse_args()
    result = audit(args.site, args.source)
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))
    return 1 if result['errors'] else 0


if __name__ == '__main__':
    sys.exit(main())
