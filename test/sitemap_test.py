import datetime as dt
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sitemap_audit', ROOT / 'scripts/audit_sitemaps.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
O, S, I = module.ORIGIN, module.NS, module.IMAGE_NS


class SitemapAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'docs').mkdir()
        (self.root / 'assets').mkdir()
        (self.root / 'assets/cover.webp').write_bytes(b'image-fixture')
        self.write('_data/cities.json', json.dumps({'cities': []}))
        self.paths = ['/', '/lietošanas-noteikumi/']
        self.records = [{'url': p, 'canonicalPath': p, 'family': 'fixture', 'indexable': True,
                         'lastmod': '2026-11-10', 'significantModifiedAt': '2026-11-10'} for p in self.paths]
        self.save_registry()
        self.page_xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="{S}">' + ''.join(
            f'<url><loc>{module.public_url(p)}</loc><lastmod>2026-11-10</lastmod></url>' for p in self.paths) + '</urlset>'
        self.image_xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="{S}" xmlns:image="{I}">' + ''.join(
            f'<url><loc>{module.public_url(p)}</loc><image:image><image:loc>{O}/assets/cover.webp</image:loc></image:image></url>' for p in self.paths) + '</urlset>'
        self.write('sitemap.xml', self.page_xml)
        self.write('image-sitemap.xml', self.image_xml)
        self.write('robots.txt', f'User-agent: *\nAllow: /\nSitemap: {O}/sitemap.xml\nSitemap: {O}/image-sitemap.xml\n')
        self.write('_headers', '/*\n  X-Content-Type-Options: nosniff\n')
        self.write('_redirects', '')
        for p in self.paths + sorted(module.EXCLUDED):
            self.write_html(p)

    def write(self, path, text):
        file = self.root / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(text)

    def write_html(self, path):
        file = path.lstrip('/') + ('index.html' if path.endswith('/') else '')
        robots = 'noindex,follow' if path in module.EXCLUDED else 'index,follow,max-image-preview:large'
        self.write(file, f'<html><head><link rel="canonical" href="{O}{path}"><meta name="robots" content="{robots}"></head>'
                   '<body><main><img src="/assets/cover.webp?v=abc" alt="Kalendārs"></main></body></html>')

    def save_registry(self):
        self.write('docs/route-manifest.json', json.dumps(self.records))

    def result(self):
        return module.audit(self.root, self.root, dt.date(2026, 11, 12))

    def codes(self):
        return {r['code'] for r in self.result()['errors']}

    def test_valid_fixture_and_unicode_url_identity(self):
        result = self.result()
        self.assertEqual(result['errors'], [])
        self.assertEqual((result['pageUrls'], result['htmlDocuments'], result['uniqueImages']), (2, 5, 1))

    def test_duplicate_urls_and_missing_pages_fail(self):
        self.write('sitemap.xml', self.page_xml.replace('</urlset>', f'<url><loc>{O}/</loc><lastmod>2026-11-10</lastmod></url></urlset>'))
        self.assertIn('duplicate-url', self.codes())
        self.write('sitemap.xml', self.page_xml.replace(f'<url><loc>{O}/</loc><lastmod>2026-11-10</lastmod></url>', ''))
        self.assertIn('missing-pages', self.codes())

    def test_foreign_private_parameterized_and_aliased_urls_fail(self):
        for value in ('http://kalendars365.lv/', 'https://other.example/', 'https://localhost/', O + '/?note=PRIVATE',
                      O + '/#PRIVATE', O + '//', O + '/x/../y/', O + '/%252E%252E/', O + '/lietošanas-noteikumi/',
                      O + '/lieto%c5%a1anas-noteikumi/', O + '/%00/'):
            with self.subTest(value=value):
                self.write('sitemap.xml', self.page_xml.replace(f'<loc>{O}/</loc>', f'<loc>{value}</loc>'))
                self.assertIn('invalid-url', self.codes())

    def test_noindex_and_redirect_targets_fail(self):
        file = self.root / 'index.html'
        file.write_text(file.read_text().replace('index,follow,max-image-preview:large', 'noindex,follow'))
        self.assertIn('html-indexing-blocked', self.codes())
        self.write_html('/')
        self.write('_redirects', '/ /lietošanas-noteikumi/ 301\n')
        self.assertIn('redirected-target', self.codes())

    def test_impossible_future_and_stale_modification_dates_fail(self):
        for value, code in [('2030-02-29', 'invalid-lastmod'), ('2030-01-01', 'invalid-lastmod'),
                            ('2026-1-01', 'invalid-lastmod'), ('2026-11-09', 'revision-mismatch')]:
            with self.subTest(value=value):
                self.write('sitemap.xml', self.page_xml.replace('2026-11-10', value))
                self.assertIn(code, self.codes())

    def test_malformed_xml_wrong_namespace_and_unsupported_tags_fail(self):
        for value in (self.page_xml[:-5], self.page_xml.replace(S, 'https://wrong.example/'),
                      self.page_xml.replace('<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE urlset>')):
            self.write('sitemap.xml', value)
            self.assertIn('invalid-xml', self.codes())
        self.write('sitemap.xml', self.page_xml.replace('</lastmod>', '</lastmod><priority>1.0</priority>'))
        self.assertIn('unexpected-tags', self.codes())

    def test_robots_discovery_and_bot_specific_blocks_fail(self):
        original = (self.root / 'robots.txt').read_text()
        self.write('robots.txt', original.replace('Sitemap: ' + O + '/image-sitemap.xml\n', ''))
        self.assertIn('robots-discovery', self.codes())
        self.write('robots.txt', original + 'User-agent: Googlebot-Image\nDisallow: /assets/\n')
        self.assertIn('robots-blocked', self.codes())
        self.write('robots.txt', original)
        self.write('_headers', '/assets/*\n  X-Robots-Tag: noimageindex\n')
        self.assertIn('response-indexing-blocked', self.codes())

    def test_missing_and_mismatched_images_fail(self):
        self.write('image-sitemap.xml', self.image_xml.replace('cover.webp', 'missing.webp'))
        self.assertTrue({'missing-image-file', 'image-content-coverage'} <= self.codes())
        self.write('image-sitemap.xml', self.image_xml.replace('/assets/cover.webp', '/private/cover.webp'))
        self.assertIn('image-url', self.codes())

    def test_dynamic_city_night_images_require_complete_sitemap_and_real_files(self):
        self.write('_data/cities.json', json.dumps({'cities': [{'photo': {'src': '/assets/cover.webp'},
                                                              'nightPhoto': {'src': '/assets/night.webp'}}]}))
        self.write('assets/night.webp', 'night-image-fixture')
        self.assertIn('image-content-coverage', self.codes())
        first = f'<url><loc>{O}/</loc>'
        night = f'<image:image><image:loc>{O}/assets/night.webp</image:loc></image:image>'
        self.write('image-sitemap.xml', self.image_xml.replace(first, first + night, 1))
        self.assertEqual(self.result()['errors'], [])
        (self.root / 'assets/night.webp').unlink()
        self.assertIn('missing-image-file', self.codes())

    def test_unregistered_html_duplicate_registry_and_excluded_urls_fail(self):
        self.write_html('/unknown/')
        self.assertIn('unregistered-html', self.codes())
        self.records.append(self.records[0].copy())
        self.save_registry()
        self.assertIn('duplicate-registry-route', self.codes())
        self.write('sitemap.xml', self.page_xml.replace('</urlset>', f'<url><loc>{O}/404.html</loc><lastmod>2026-11-10</lastmod></url></urlset>'))
        self.assertTrue({'unexpected-pages', 'excluded-document'} <= self.codes())

    def test_limits_and_excessive_image_lists_fail(self):
        url_limit = module.MAX_URLS
        try:
            module.MAX_URLS = 1
            self.assertIn('invalid-xml', self.codes())
        finally:
            module.MAX_URLS = url_limit
        original = module.MAX_BYTES
        try:
            module.MAX_BYTES = 10
            self.assertIn('invalid-xml', self.codes())
        finally:
            module.MAX_BYTES = original
        image = f'<image:image><image:loc>{O}/assets/cover.webp</image:loc></image:image>'
        self.write('image-sitemap.xml', self.image_xml.replace(image, image * 1001))
        self.assertIn('image-count', self.codes())

    def test_parser_tracks_responsive_images_and_skips_ui_decoration(self):
        document = module.Document()
        document.feed('<header><img src="/assets/navigation.svg" alt="Menu"></header>'
                      '<main><img src="/assets/a.webp?v=2" srcset="/assets/a.webp 320w, /assets/b.webp 640w" alt="Kalendārs">'
                      '<img src="/assets/decoration.svg" alt=""><svg><use href="/assets/symbols.svg#icon"></use></svg>'
                      '<a href="/downloads/att%C4%93ls.webp">Attēls</a><img src="blob:private"><img src="data:image/png;base64,aaaa">'
                      '</main><meta property="og:image" content="' + O + '/assets/social.jpg">')
        self.assertEqual(module.content_images(document.image_candidates),
                         {O + '/assets/a.webp', O + '/assets/b.webp', O + '/downloads/att%C4%93ls.webp', O + '/assets/social.jpg'})


if __name__ == '__main__':
    unittest.main()
