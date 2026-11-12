"""Check generated public image markup without guessing visual descriptions."""
import argparse
import json
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ORIGIN = 'https://kalendars365.lv'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.images = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        hidden = 'hidden' in values or values.get('aria-hidden') == 'true' or any(row[1] for row in self.stack)
        if tag == 'img':
            self.images.append((values, hidden))
        if tag not in VOID:
            self.stack.append((tag, hidden))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break


def audit(site):
    counts = Counter()
    errors = []
    files = {}

    def check_url(raw, page):
        if raw.startswith(('data:', 'blob:')):
            return
        url = urlsplit(raw)
        if url.netloc and url.netloc != urlsplit(ORIGIN).netloc:
            errors.append([page, 'unexpected-remote-image', raw])
            return
        if not url.path.startswith('/') or '..' in unquote(url.path).split('/'):
            errors.append([page, 'invalid-image-path', raw])
            return
        path = unquote(url.path)
        if path in files:
            return
        image = site / path.lstrip('/')
        if not image.is_file():
            errors.append([page, 'missing-image-file', raw])
            return
        with image.open('rb') as stream:
            header = stream.read(256).lstrip()
        suffix = image.suffix.lower()
        valid = {
            '.webp': header[:4] == b'RIFF' and header[8:12] == b'WEBP',
            '.jpg': header[:3] == b'\xff\xd8\xff',
            '.jpeg': header[:3] == b'\xff\xd8\xff',
            '.png': header.startswith(b'\x89PNG\r\n\x1a\n'),
            '.svg': b'<svg' in header or header.startswith(b'<?xml'),
            '.gif': header.startswith((b'GIF87a', b'GIF89a')),
            '.avif': b'ftypavif' in header or b'ftypavis' in header,
        }.get(suffix, False)
        if not valid:
            errors.append([page, 'extension-format-mismatch', raw])
        files[path] = image.stat().st_size

    for html in sorted(site.rglob('*.html')):
        page = str(html.relative_to(site))
        parser = Images()
        parser.feed(html.read_text())
        counts['pages'] += 1
        for image, hidden in parser.images:
            counts['imageElements'] += 1
            if 'alt' not in image:
                errors.append([page, 'missing-alt', image.get('src')])
            alt = image.get('alt', '')
            if alt and alt.strip().lower() in {'', 'image', 'photo', 'picture', 'img', 'foto', 'attēls', 'illustration'}:
                errors.append([page, 'generic-alt', image.get('src')])
            if alt.strip().startswith(('/assets/', 'http://', 'https://')):
                errors.append([page, 'filename-instead-of-description', image.get('src')])
            counts['descriptiveImages' if alt else 'decorativeImages'] += 1
            if not all(str(image.get(key, '')).isdigit() and int(image[key]) > 0 for key in ('width', 'height')):
                errors.append([page, 'missing-dimensions', image.get('src')])
            src = image.get('src', '')
            # A private upload slot intentionally has no public source until the
            # user chooses a photo. It must remain hidden in the initial HTML.
            if not src:
                if hidden and image.get('id') == 'studio-photo-thumb':
                    counts['hiddenPrivateUploadSlots'] += 1
                    continue
                errors.append([page, 'missing-src', image.get('id')])
            else:
                check_url(src, page)
            srcset = image.get('srcset', '')
            if srcset and not srcset.startswith('data:'):
                counts['responsiveImages'] += 1
                if not image.get('sizes'):
                    errors.append([page, 'missing-sizes', src])
                for candidate in srcset.split(','):
                    check_url(candidate.strip().split()[0], page)
            if image.get('loading') == 'lazy':
                counts['lazyImages'] += 1
                if image.get('fetchpriority') == 'high':
                    errors.append([page, 'lazy-high-priority-conflict', src])
            if image.get('fetchpriority') == 'high':
                counts['highPriorityImages'] += 1
    return {'schemaVersion': 1, 'site': str(site), 'totals': dict(counts), 'uniqueImageFiles': len(files), 'errors': errors}


if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--site', default='_site')
    args.add_argument('--output', default='docs/image-seo-audit.json')
    options = args.parse_args()
    result = audit(Path(options.site))
    output = Path(options.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in result.items() if key != 'site'}, ensure_ascii=False))
    sys.exit(bool(result['errors']))
