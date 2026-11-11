"""Create lighter school-card derivatives; retain the licensed source photos."""
from pathlib import Path
from PIL import Image
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
SIZES = '(max-width:520px) calc(100vw - 36px), (max-width:1100px) calc((100vw - 70px) / 2), (min-width:1450px) 328px, calc((100vw - 120px) / 4)'
SOURCES = [
    ('autumn', 'assets/cities/preili-960.webp'),
    ('winter', 'assets/occasions/winter-960.webp'),
    ('spring', 'assets/cities/iecava-960.webp'),
    ('summer', 'assets/occasions/summer-960.webp'),
]
target = ROOT / 'assets/school-breaks'
target.mkdir(exist_ok=True)
photos = []
for season, source_path in SOURCES:
    source = ROOT / source_path
    image = Image.open(source).convert('RGB')
    files = []
    for width in (480, 720):
        height = round(image.height * width / image.width)
        derivative = image.resize((width, height), Image.Resampling.LANCZOS)
        output = target / f'{season}-{width}.webp'
        derivative.save(output, 'WEBP', quality=74, method=6)
        files.append({'src': '/' + str(output.relative_to(ROOT)), 'width': width,
                      'height': height, 'bytes': output.stat().st_size,
                      'sha256': hashlib.sha256(output.read_bytes()).hexdigest()})
    photos.append({'season': season, 'source': '/' + source_path,
                   'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                   'src': files[0]['src'],
                   'srcset': ', '.join(f"{item['src']} {item['width']}w" for item in files),
                   'sizes': SIZES, 'width': files[-1]['width'], 'height': files[-1]['height'],
                   'files': files})
for season, _ in SOURCES:
    (target / f'{season}-960.webp').unlink(missing_ok=True)
(ROOT / '_data/school-break-images.json').write_text(
    json.dumps({'photos': photos}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'sourceBytes': sum((ROOT / source).stat().st_size for _, source in SOURCES),
                  'optimized720Bytes': sum(photo['files'][1]['bytes'] for photo in photos),
                  'optimized480Bytes': sum(photo['files'][0]['bytes'] for photo in photos)}))
