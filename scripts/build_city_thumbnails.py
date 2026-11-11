"""Resize the existing reviewed city photographs; keep their source/license chain."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
catalog = json.loads((root / '_data/cities.json').read_text())
out = root / 'assets/city-thumbnails'
out.mkdir(exist_ok=True)
photos = []
for city in catalog['cities']:
    photo = city['photo']
    source = root / photo['src'].lstrip('/')
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert digest == photo['files']['960']['sha256'], city['id'] + ': changed source'
    assert digest == photo['reviewedDerivativeSha256'], city['id'] + ': stale source review'
    original = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    files = []
    for width in (96, 192):
        height = round(original.height * width / original.width)
        image = original.resize((width, height), Image.Resampling.LANCZOS)
        dest = out / (city['id'] + '-' + str(width) + '.webp')
        image.save(dest, 'WEBP', quality=85, method=6)
        raw = dest.read_bytes()
        files.append({'src': '/' + str(dest.relative_to(root)), 'width': width,
                      'height': height, 'bytes': len(raw),
                      'sha256': hashlib.sha256(raw).hexdigest()})
    photos.append({'id': city['id'], 'name': city['name'], 'alt': photo['alt'],
                   'source': photo['src'], 'sourceSha256': digest,
                   'author': photo['author'], 'license': photo['license'],
                   'sourceUrl': photo['sourceUrl'], 'licenseUrl': photo['licenseUrl'],
                   'operation': 'Proportional resize; square crop is applied only by display CSS.',
                   'files': files})
assert len(photos) == 82
(root / '_data/city-thumbnails.json').write_text(json.dumps({
    'generator': 'scripts/build_city_thumbnails.py', 'photos': photos
}, ensure_ascii=False, indent=2) + '\n')
print('82 reviewed city photos → 164 small WebP files; ' + str(sum(f['bytes'] for p in photos for f in p['files'])) + ' bytes total.')
