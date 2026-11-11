"""Build self-contained photographic SVG category artwork from reviewed local sources.

Offline: python scripts/build_category_photos.py (requires Pillow).
Only crop/resize/encoding and explicitly described photo compositions are applied.
"""
from pathlib import Path
from io import BytesIO
import base64, hashlib, html, json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / '_data/category-photos.json'
OUT = ROOT / 'assets/category-photos'

def digest(data):
    return hashlib.sha256(data).hexdigest()

def safe(value):
    return html.escape(str(value), quote=True)

def crop_image(source, box=None, size=(384, 288)):
    with Image.open(ROOT / source['file'].lstrip('/')) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        if box:
            left, top, right, bottom = box
            im = im.crop((round(left*im.width), round(top*im.height), round(right*im.width), round(bottom*im.height)))
        return ImageOps.fit(im, size, method=Image.Resampling.LANCZOS)

def data_uri(image):
    buffer = BytesIO()
    image.save(buffer, 'JPEG', quality=80, optimize=True, subsampling=2)
    return 'data:image/jpeg;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii')

def photo_element(image, x, y, width, height, clip=''):
    return f'<image href="{data_uri(image)}" x="{x}" y="{y}" width="{width}" height="{height}"{clip}/>'

def clipped(prefix, part):
    return ' clip-path="url(#'+prefix+'-'+part+')"'

def render(art, sources):
    ident=art['id']; prefix='cp-'+ident
    definitions=f'<filter id="{prefix}-shadow" x="-30%" y="-35%" width="170%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="8" flood-color="#492b34" flood-opacity=".20"/></filter>'
    content=''
    if art['kind']=='photo':
        photo=crop_image(sources[art['sources'][0]], art.get('crop'))
        definitions+=f'<clipPath id="{prefix}-photo"><rect x="16" y="20" width="288" height="216" rx="23"/></clipPath>'
        content=f'<g filter="url(#{prefix}-shadow)"><rect x="12" y="16" width="296" height="224" rx="27" fill="#fffbf4" stroke="#dbc7bc" stroke-width="1.5"/>{photo_element(photo,16,20,288,216,clipped(prefix,"photo"))}<rect x="16.5" y="20.5" width="287" height="215" rx="22.5" fill="none" stroke="#ffffff" stroke-opacity=".65"/></g>'
    elif art['kind']=='disc':
        photo=crop_image(sources[art['sources'][0]],art.get('crop'),(360,360))
        definitions+=f'<clipPath id="{prefix}-disc"><circle cx="160" cy="127" r="108"/></clipPath>'
        content=f'<ellipse cx="160" cy="239" rx="83" ry="9" fill="#573641" opacity=".12"/><g filter="url(#{prefix}-shadow)">{photo_element(photo,52,19,216,216,clipped(prefix,"disc"))}<circle cx="160" cy="127" r="108" fill="none" stroke="#c2b4a8" stroke-width="1" stroke-opacity=".45"/></g>'
    elif art['kind']=='phases':
        moon=crop_image(sources['moon'],size=(320,320))
        definitions+=f'<image id="{prefix}-surface" href="{data_uri(moon)}" x="-1" y="-1" width="2" height="2"/><clipPath id="{prefix}-circle"><circle r="1"/></clipPath>'
        discs=[]
        for index,(x,r) in enumerate([(43,28),(102,35),(165,42),(225,34),(281,26)]):
            shade=['<path d="M0-1A1 1 0 0 0 0 1Z" fill="#02040a" opacity=".97"/>','<ellipse cx="-.55" cy="0" rx=".72" ry="1.05" fill="#02040a" opacity=".96"/>','','<ellipse cx=".55" cy="0" rx=".72" ry="1.05" fill="#02040a" opacity=".96"/>','<path d="M0-1A1 1 0 0 1 0 1Z" fill="#02040a" opacity=".97"/>'][index]
            discs.append(f'<g transform="translate({x} 130) scale({r})" clip-path="url(#{prefix}-circle)"><use href="#{prefix}-surface"/>{shade}</g>')
        content='<rect x="12" y="23" width="296" height="214" rx="27" fill="#172333"/><path d="M33 77Q160 37 288 77M33 184Q160 224 288 184" stroke="#aeb6c4" stroke-width="1" stroke-opacity=".25" fill="none"/>'+''.join(discs)
    elif art['kind']=='earthmoon':
        definitions+=f'<clipPath id="{prefix}-earth"><circle cx="134" cy="118" r="106"/></clipPath><clipPath id="{prefix}-moon"><circle cx="252" cy="191" r="47"/></clipPath>'
        earth=crop_image(sources['earth'],size=(360,360));moon=crop_image(sources['moon'],size=(200,200))
        content=f'<ellipse cx="167" cy="238" rx="119" ry="8" fill="#374957" opacity=".12"/><g filter="url(#{prefix}-shadow)">{photo_element(earth,28,12,212,212,clipped(prefix,"earth"))}{photo_element(moon,205,144,94,94,clipped(prefix,"moon"))}<circle cx="134" cy="118" r="106" fill="none" stroke="#dbe6ec" stroke-width="1.4" stroke-opacity=".55"/><circle cx="252" cy="191" r="47" fill="none" stroke="#fffaf0" stroke-width="1" stroke-opacity=".4"/></g>'
    elif art['kind']=='seasons':
        positions=[(13,17),(164,17),(13,133),(164,133)]
        crops=[[.42,.24,1,.94],[.02,.18,1,1],[0,0,1,1],[.30,.13,1,.93]]
        tiles=[]
        for i,(source_id,(x,y),crop) in enumerate(zip(art['sources'],positions,crops)):
            definitions+=f'<clipPath id="{prefix}-{i}"><rect x="{x}" y="{y}" width="143" height="108" rx="17"/></clipPath>'
            im=crop_image(sources[source_id],crop,(240,180))
            tiles.append(photo_element(im,x,y,143,108,f' clip-path="url(#{prefix}-{i})"'))
        content=f'<g filter="url(#{prefix}-shadow)">{"".join(tiles)}</g>'
    else:
        raise ValueError('Unknown category composition: '+art['kind'])
    copyright_records=[{key:sources[source_id].get(key) for key in ['id','author','license','licenseUrl','sourceUrl']} for source_id in art['sources']]
    metadata=safe(json.dumps({'changes':art['changes'],'sources':copyright_records},ensure_ascii=False))
    return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 320 260" role="img" aria-labelledby="{prefix}-title {prefix}-desc"><title id="{prefix}-title">{safe(art["label"])}</title><desc id="{prefix}-desc">{safe(art["changes"])}</desc><metadata>{metadata}</metadata><defs>{definitions}</defs>{content}</svg>\n'

def main():
    data=json.loads(MANIFEST.read_text());sources={row['id']:row for row in data['sources']}
    for source in sources.values():
        raw=(ROOT/source['file'].lstrip('/')).read_bytes()
        if digest(raw)!=source['sourceSha256'] or source['visualReview']['sourceSha256']!=source['sourceSha256']:
            raise ValueError('Changed reviewed photo: '+source['id'])
    for art in data['artworks']:
        out=OUT/(art['id']+'.svg');out.write_text(render(art,sources))
        art['thumbnail']=art['svg']
        art['bytes']=out.stat().st_size;art['sha256']=digest(out.read_bytes())
        art['compositeLicense']='CC BY-SA 4.0' if any('BY-SA' in sources[s]['license'] for s in art['sources']) else 'Source terms apply; original composition by Kalendārs365'
    if len(data['artworks'])!=19 or len({a['sha256'] for a in data['artworks']})!=19:
        raise ValueError('Expected 19 distinct photographic artworks')
    MANIFEST.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'artworks':len(data['artworks']),'sources':len(sources),'svgBytes':sum(a['bytes'] for a in data['artworks'])}))

if __name__=='__main__':
    main()
