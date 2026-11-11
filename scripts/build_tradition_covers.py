"""Build small, immutable photographic covers from reviewed local source copies."""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/tradition-covers'


def build():
    catalog = json.loads((ROOT / '_data/tradition-photos.json').read_text())
    photos = {p['id']: p for p in catalog['photos']}
    overrides = ROOT / '_data/occasion-photo-overrides.json'
    if overrides.exists():
        photos.update({p['id']: p for p in json.loads(overrides.read_text())['photos']})
    for occasion in json.loads((ROOT / '_data/occasions.json').read_text()):
        photo = occasion['photo']
        photos.setdefault(photo['id'], photo)
    OUT.mkdir(exist_ok=True)
    previous = json.loads((ROOT / '_data/tradition-covers.json').read_text()) if (ROOT / '_data/tradition-covers.json').exists() else {}
    covers = {}
    for photo_id, photo in photos.items():
        source = ROOT / photo.get('sourceCopy', photo.get('src', '').lstrip('/'))
        raw = source.read_bytes()
        checksum = hashlib.sha256(raw).hexdigest()
        if photo.get('sourceCopy') and (checksum != photo['sourceSha256'] or
                                        checksum != photo['visualReview']['sourceSha256']):
            raise ValueError('Source changed; review again: ' + photo_id)
        im = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
        files = []
        # Never enlarge the downloaded source. Width descriptors match actual pixels.
        widths = sorted(set(min(w, im.width) for w in [320, 640, 960, 1280]))
        for width in widths:
            size = (width, round(width * 9 / 16))
            if photo.get('coverMode') == 'contain':
                frame = Image.new('RGB', size, '#080b11')
                fitted = ImageOps.contain(im, size, Image.Resampling.LANCZOS)
                frame.paste(fitted, ((width-fitted.width)//2, (size[1]-fitted.height)//2))
            else:
                frame = ImageOps.fit(im, size, Image.Resampling.LANCZOS,
                                     centering=tuple(photo.get('coverCenter', [.5, .5])))
            import io
            budget = 30000 if width <= 320 else 90000 if width <= 640 else 180000 if width <= 960 else 260000
            for quality in [80, 72, 64, 56, 50]:
                stream = io.BytesIO()
                frame.save(stream, format='WEBP', quality=quality, method=6)
                if stream.tell() <= budget:
                    break
            data = stream.getvalue()
            sha = hashlib.sha256(data).hexdigest()
            name = f'{photo_id}-{sha[:12]}-{width}.webp'
            (OUT / name).write_bytes(data)
            files.append({'src': '/assets/tradition-covers/' + name,
                          'width': width, 'height': size[1], 'bytes': len(data), 'sha256': sha, 'quality': quality})
        default = min(files, key=lambda item: abs(item['width']-640))
        covers[photo_id] = {**default,
            'srcset': ', '.join(f"{f['src']} {f['width']}w" for f in files),
            'files': files, 'sourceSha256': checksum,
            'transform': '16:9 kadrējums; samazināts WebP attēls' if photo.get('coverMode') != 'contain'
                         else 'Samazināts attēls uz tumša fona; proporcijas saglabātas'}
    current = {f['src'] for p in covers.values() for f in p['files']}
    for p in previous.values():
        for f in p['files']:
            if f['src'] not in current:
                obsolete = ROOT / f['src'].lstrip('/')
                if obsolete.parent == OUT and obsolete.exists():
                    obsolete.unlink()
    (ROOT / '_data/tradition-covers.json').write_text(json.dumps(covers, ensure_ascii=False, indent=2)+'\n')
    print(f'{len(covers)} photographs; {sum(len(p["files"]) for p in covers.values())} responsive covers')


if __name__ == '__main__':
    build()
