"""Rasterize the final embedded-font PDFs, so Image and PDF match exactly."""
import hashlib
import json
import sys
from pathlib import Path
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'downloads' / 'nedelas'
TEMP = ROOT.parent / 'reports' / 'weekly-planners-2026-11-11' / 'rendered'
TEMP.mkdir(parents=True, exist_ok=True)
manifest = json.loads((OUT / 'manifest.json').read_text())
for item in manifest['items']:
    if len(sys.argv) > 1 and str(item['design']) != sys.argv[1]:
        continue
    pdf = ROOT / item['pdf'].lstrip('/')
    stem = TEMP / f"{item['design']:02d}"
    subprocess.run(['pdftoppm', '-r', '600', '-singlefile', '-png', str(pdf), str(stem)], check=True, stdout=subprocess.DEVNULL)
    with Image.open(str(stem) + '.png') as image:
        image = image.convert('RGB')
        if image.size != (7016, 4961):
            raise ValueError(f"Unexpected A4 dimensions: {image.size}")
        image.save(ROOT / item['image'].lstrip('/'), 'WEBP', quality=96, method=4)
        image.thumbnail((900, 636), Image.Resampling.LANCZOS)
        image.save(ROOT / item['preview'].lstrip('/'), 'WEBP', quality=88, method=5)
    for key in ['image', 'preview']:
        target = ROOT / item[key].lstrip('/')
        item[key + 'Sha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
    print(f"Verified 600 ppi Image {item['design']} / 15", flush=True)
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
