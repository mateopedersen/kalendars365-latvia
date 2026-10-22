"""Generate every social card with the same genuine Garet fonts as the site."""
from PIL import Image, ImageDraw, ImageFont
import json, pathlib, hashlib

root = pathlib.Path(__file__).resolve().parents[1]
routes = json.loads((root / 'docs/route-manifest.json').read_text())
book = root / 'assets/fonts/Garet-Book.ttf'
heavy = root / 'assets/fonts/Garet-Heavy.ttf'
assert book.is_file() and heavy.is_file(), 'The licensed Garet fonts are required.'
target = root / 'assets/og'
target.mkdir(exist_ok=True)
results = []

def wrap(text, draw, font, width):
    lines, line = [], ''
    for word in text.split():
        trial = (line + ' ' + word).strip()
        if line and draw.textlength(trial, font=font) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    return lines + [line]

def render(title, output, url):
    im = Image.new('RGB', (1200, 630), '#f8f6f2')
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, 1200, 22), fill='#751d2d')
    draw.rectangle((900, 22, 1200, 630), fill='#751d2d')
    draw.text((65, 65), 'Kalendārs365', font=ImageFont.truetype(str(heavy), 44), fill='#751d2d')
    for size in range(48, 23, -1):
        font = ImageFont.truetype(str(heavy), size)
        lines = wrap(title, draw, font, 770)
        if len(lines) <= 3 and all(draw.textlength(line, font=font) <= 770 for line in lines):
            break
    else:
        raise ValueError('Social title cannot fit: ' + title)
    bounds = []
    for index, line in enumerate(lines):
        position = (65, 235 + index * 75)
        bbox = draw.textbbox(position, line, font=font)
        assert bbox[0] >= 0 and bbox[2] < 900 and bbox[3] < 530, (title, bbox)
        bounds.append(bbox)
        draw.text(position, line, font=font, fill='#49232b')
    draw.text((65, 545), 'LATVIJA · kalendars365.lv', font=ImageFont.truetype(str(book), 24), fill='#66545a')
    for row in range(5):
        for col in range(3):
            draw.rounded_rectangle((940 + col * 70, 190 + row * 65, 983 + col * 70, 228 + row * 65), radius=3, outline='#edc5ce', width=2)
    im.save(output, quality=90)
    with Image.open(output) as check:
        check.load()
        assert check.size == (1200, 630)
    results.append({'url': url, 'path': str(output.relative_to(root)), 'title': title, 'font': 'Garet Heavy / Book', 'titleSize': size, 'titleBounds': bounds, 'width': 1200, 'height': 630, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()})

for route in routes:
    render(route['title'], target / (hashlib.sha1(route['url'].encode()).hexdigest()[:16] + '.webp'), route['url'])

# Error/support pages use home.png; refresh existing legacy family fallbacks too.
home = next(route for route in routes if route['url'] == '/')
fallbacks = set(target.glob('*.png')) | {target / 'home.png'}
for output in sorted(fallbacks):
    route = next((item for item in routes if item['family'] == output.stem), home)
    render(route['title'], output, route['url'])

report = {'routeCards': len(routes), 'fallbackCards': len(fallbacks), 'passed': len(results), 'fonts': {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in (book, heavy)}, 'checks': ['actual Garet input fonts', '1200x630 dimensions', 'full image decode', 'title bounds', 'SHA256'], 'files': results}
(root / 'docs/OG_RESULTS.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(f'PASS {len(routes)} Garet social route cards + {len(fallbacks)} fallbacks; dimensions, decode and title bounds checked.')
