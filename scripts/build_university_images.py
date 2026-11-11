"""Make small campus-card derivatives without replacing licensed originals."""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib, json
import xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / '_data/university-calendars.json').read_text())
photos = {item['photo']['src']: item['photo'] for item in data['calendars'] + data['stateUniversities'] if item.get('photo')}
folder = ROOT / 'assets/university-cards'
folder.mkdir(exist_ok=True)
items = []
for source_path, photo in photos.items():
    source = ROOT / source_path.lstrip('/')
    variants = []
    if source.suffix.lower() == '.svg':
        svg = ET.fromstring(source.read_bytes())
        _, _, width, height = map(float, svg.attrib['viewBox'].split())
        width, height = int(width), int(height)
        variants.append({'src': source_path, 'width': width, 'height': height,
                         'bytes': source.stat().st_size, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    else:
        image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
        for width in (480, 800):
            width = min(width, image.width)
            height = round(image.height * width / image.width)
            output = folder / f'{source.stem}-{width}.webp'
            image.resize((width, height), Image.Resampling.LANCZOS).save(output, 'WEBP', quality=76, method=6)
            variants.append({'src': '/' + str(output.relative_to(ROOT)), 'width': width, 'height': height,
                             'bytes': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()})
    items.append({'source': source_path, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                  'src': variants[0]['src'], 'srcset': ', '.join(f"{v['src']} {v['width']}w" for v in variants),
                  'width': variants[-1]['width'], 'height': variants[-1]['height'], 'files': variants})
(ROOT / '_data/university-card-images.json').write_text(json.dumps({'photos': items}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'campuses': len(items), 'originalBytes': sum((ROOT / source.lstrip('/')).stat().st_size for source in photos), 'card800Bytes': sum(item['files'][-1]['bytes'] for item in items)}))
