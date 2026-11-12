"""Create small responsive copies; retain accepted photographs and provenance."""
import base64, hashlib, io, json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'_data/cities.json').read_text())['cities']
target=root/'assets/city-fast';target.mkdir(exist_ok=True)
manifest=root/'_data/city-photo-previews.json'
old=json.loads(manifest.read_text()).get('cities',{}) if manifest.exists() else {}
entries={}
for city in catalog:
    source=root/city['photo']['src'].lstrip('/')
    digest=hashlib.sha256(source.read_bytes()).hexdigest();previous=old.get(city['id'])
    if previous and previous['sourceSha256']==digest and all((root/f['src'].lstrip('/')).is_file() for f in previous['files']):
        entries[city['id']]=previous;continue
    from PIL import Image
    with Image.open(source) as opened:
        image=opened.convert('RGB');preview=image.copy();preview.thumbnail((64,64),Image.Resampling.LANCZOS)
        buf=io.BytesIO();preview.save(buf,'WEBP',quality=30,method=6)
        files=[]
        for width in [320,640]:
            height=round(image.height*width/image.width);scaled=image.resize((width,height),Image.Resampling.LANCZOS)
            path=target/f'{city["id"]}-{width}.webp';scaled.save(path,'WEBP',quality=78,method=6)
            files.append({'src':'/'+str(path.relative_to(root)),'width':width,'height':height,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        entries[city['id']]={'source':city['photo']['src'],'sourceSha256':digest,'preview':'data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode(),'files':files}
manifest.write_text(json.dumps({'version':1,'cities':entries},ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({'cities':len(entries),'inlinePreviewBytes':sum(len(e['preview']) for e in entries.values()),'fastImages':sum(len(e['files']) for e in entries.values())}))
