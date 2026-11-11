"""Render the actual vector PDF masters to matching A4 600 ppi images."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'downloads' / 'mainas'
TEMP = ROOT.parent / 'reports' / 'shift-planners-2026-11-11' / 'rendered'
TEMP.mkdir(parents=True, exist_ok=True)
manifest = json.loads((OUT / 'manifest.json').read_text())
for item in manifest['items']:
    if len(sys.argv) > 1 and str(item['design']) != sys.argv[1]:
        continue
    stem = TEMP / f"{item['design']:02d}"
    subprocess.run(['pdftoppm', '-r', '600', '-singlefile', '-png', str(ROOT / item['pdf'].lstrip('/')), str(stem)], check=True, stdout=subprocess.DEVNULL)
    with Image.open(str(stem) + '.png') as original:
        image = original.convert('RGB')
        if image.size != (7016, 4961):
            raise ValueError(f"Unexpected A4 dimensions: {image.size}")
        image.save(ROOT / item['image'].lstrip('/'), 'WEBP', quality=96, method=4)
        image.thumbnail((900, 636), Image.Resampling.LANCZOS)
        image.save(ROOT / item['preview'].lstrip('/'), 'WEBP', quality=88, method=5)
    for key in ['image', 'preview']:
        item[key + 'Sha256'] = hashlib.sha256((ROOT / item[key].lstrip('/')).read_bytes()).hexdigest()
    print(f"Verified shift Image {item['design']} / 15", flush=True)
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
