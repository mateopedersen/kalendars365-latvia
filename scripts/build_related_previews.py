"""Small responsive page previews, bound to accepted source covers by checksum.

Public cover originals and their photograph/license records are preserved.
Cached builds verify without requiring Pillow; new renders use the image runtime.
"""
import hashlib
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / '_data/social-images.json'
MANIFEST = ROOT / '_data/related-previews.json'
OUTPUT = ROOT / 'assets/related-previews'
OUTPUT.mkdir(exist_ok=True)
VERSION = 1  # Bump when the thumbnail transform or encoding recipe changes.
previous_manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
old = previous_manifest.get('pages', {}) if previous_manifest.get('version') == VERSION else {}
pages = {}
created = 0
for url, cover in json.loads(CATALOG.read_text())['pages'].items():
    source = ROOT / cover['src'].lstrip('/')
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    previous = old.get(url)
    if previous and previous['sourceSha256'] == source_hash and len(previous['files']) == 2 and all(
        (ROOT / row['src'].lstrip('/')).is_file()
        and hashlib.sha256((ROOT / row['src'].lstrip('/')).read_bytes()).hexdigest() == row['sha256']
        for row in previous['files']
    ):
        pages[url] = previous
        continue
    from PIL import Image
    with Image.open(source) as opened:
        image = opened.convert('RGB')
        files = []
        for width in (240, 480):
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            resized.save(buffer, 'WEBP', quality=82, method=6)
            data = buffer.getvalue()
            digest = hashlib.sha256(data).hexdigest()
            name = f'{digest[:24]}-{width}.webp'
            target = OUTPUT / name
            if not target.exists():
                target.write_bytes(data)
                created += 1
            files.append({'src': '/assets/related-previews/' + name, 'width': width, 'height': height,
                          'bytes': len(data), 'sha256': digest})
        pages[url] = {'source': cover['src'], 'sourceSha256': source_hash,
                      'transform': 'Scaled page cover; original composition and credits retained.', 'files': files}
MANIFEST.write_text(json.dumps({'version': VERSION, 'pages': pages}, ensure_ascii=False, separators=(',', ':')) + '\n')
print(json.dumps({'pages': len(pages), 'createdFiles': created,
                  'bytes': sum(row['bytes'] for page in pages.values() for row in page['files'])}))
