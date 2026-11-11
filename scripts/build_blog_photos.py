"""Optimize licensed real photographs without changing their subject or provenance."""
from pathlib import Path
from PIL import Image, ImageOps
import json
import hashlib

ROOT = Path(__file__).resolve().parents[1]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads((ROOT / p).read_text())
cat = {x['id']: x for x in load('_data/category-photos.json')['sources']}
garden = {x['cropId']: x for x in load('_data/garden-photos.json')['photos']}
occasions = {x['slug']: x for x in load('_data/occasions.json')}
cities = {x['id']: x for x in load('_data/cities.json')['cities']}
universities = {x['id']: x for x in load('_data/university-calendars.json')['calendars']}
photos = []

def add(key, local, record, alt, caption):
    source = ROOT / local.lstrip('/')
    image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    variants = []
    for width in sorted(set([min(640, image.width), min(1200, image.width)])):
        height = round(image.height * width / image.width)
        target = ROOT / f'assets/blog/{key}-{width}.webp'
        image.resize((width, height), Image.Resampling.LANCZOS).save(target, 'WEBP', quality=80, method=6)
        variants.append(dict(src='/'+str(target.relative_to(ROOT)), width=width, height=height, bytes=target.stat().st_size, sha256=sha(target)))
    largest = variants[-1]
    photos.append(dict(id=key, sourceFile=local, sourceSha256=sha(source), author=record['author'], license=record['license'], licenseUrl=record['licenseUrl'] or record.get('sourceUrl',record.get('pageUrl'))+'#Licensing', sourceUrl=record.get('sourceUrl',record.get('pageUrl')), originalUrl=record.get('originalUrl'), alt=alt, caption=caption, src=largest['src'], srcset=', '.join(f"{x['src']} {x['width']}w" for x in variants), width=largest['width'], height=largest['height'], files=variants, changes='Samazināts izmērs un pārveidots WebP; kartītēs iespējams attēla apgriezums.',visualReview=dict(date='2026-11-11',sourceSha256=sha(source),observation=alt,method='Actual-pixel contact-sheet review; no subject identity inferred from filename.')))

for key in ['flag','monthly','clock','ligo','flowers','school','family','calculator','jurmala','burgundy-planner','moon','summer','autumn','winter','ring-planner']:
    r=cat[key]
    alt=r['visualReview']['observation']
    if key=='moon': alt='Mēness virsma Apollo 17 misijas arhīva fotogrāfijā'
    caption=alt+' Arhīva fotogrāfija; tā nerāda pašreizējos apstākļus.'
    if key in ['clock','monthly','calculator','burgundy-planner','ring-planner','family','flowers']:
        caption=alt+' Ilustratīva fotogrāfija.'
    add(key,r['file'],r,alt,caption)
r=occasions['lieldienas']['photo'];add('easter',r['src'],r,r['alt'],'Lieldienu olu krāsošanai sagatavotas olas un materiāli. Ilustratīva arhīva fotogrāfija.')
r=universities['lu']['photo'];add('university',r['src'],r,r['alt'],r['caption']+'. Arhīva fotogrāfija, nevis konkrēta studiju gada attēls.')
r=cities['riga']['photo'];add('riga',r['src'],r,r['alt'],'Rīgas vecpilsēta un Daugava. Arhīva skats; fotogrāfija nav saullēkta laika mērījums.')
for key,crop in [('carrots','burkani'),('tomatoes','tomati')]:
    r=garden[crop];add(key,r['sourceFile'],r,r['alt'],r['alt']+'. Ilustratīvs kultūrauga attēls, nevis konkrētā Latvijas dārza raža.')
r=dict(author='NASA/Bill Ingalls',license='No known copyright restrictions (Flickr Commons)',licenseUrl='https://www.flickr.com/commons/usage/',sourceUrl='https://commons.wikimedia.org/wiki/File:Perseid_Meteor_Shower_(29386554635).jpg',originalUrl='https://upload.wikimedia.org/wikipedia/commons/4/41/Perseid_Meteor_Shower_%2829386554635%29.jpg')
add('perseids','/assets/blog/sources/perseids.jpg',r,'Meteora gaismas svītra zvaigžņotās debesīs virs tumšas kalnu un koku malas','30 sekunžu ekspozīcija Spruce Knob, Rietumvirdžīnijā, 2016. gada 12. augustā. NASA/Bill Ingalls. Tā nav Latvijā uzņemta fotogrāfija.')
(ROOT/'_data/blog-photos.json').write_text(json.dumps({'photos':photos},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'photos':len(photos),'derivativeBytes':sum(x['bytes'] for p in photos for x in p['files'])}))
