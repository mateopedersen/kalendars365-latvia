"""Build web derivatives from the 16 pixel-reviewed, source-bound photos."""
import hashlib,json,shutil
from pathlib import Path
from PIL import Image,ImageOps
REVIEW=Path('../reports/local-garden-2026-11-10/photo-review')
OUT=Path('assets/garden/photos');(OUT/'sources').mkdir(parents=True,exist_ok=True)
ALTS={'burkani':'Burkānu saišķis ar zaļiem lakstiem','galda-bietes':'Sarkanas galda bietes ar lapu kātiem','redisi':'Balti un sārti redīsi ar lapām','saknu-selerijas':'Pārgriezta sakņu selerija uz dēlīša','sipoli':'Dzelteni un sarkani sīpoli, arī pārgriezti','kiploki':'Ķiploku galviņas un atdalītas daiviņas','puravi':'Purava augs ar garām zaļām lapām','zirni':'Zaļas zirņu pākstis uz auga','pupinas':'Svaigas zaļo pupiņu pākstis','gurki':'Gurķu augļi un auga lapas','salati':'Zaļas salātu galviņas dobē','dilles':'Dilles ar dzeltenām ziedkopām','spinati':'Svaigas zaļas spinātu lapas','kartupeli':'Dažādu krāsu kartupeļu bumbuļi','kaposti':'Pārgriezta baltā galviņkāposta galviņa','tomati':'Nogatavojušies sarkani tomāti ar kātiņiem'}
photos=[]
accepted=Path('_data/garden-photos.json')
items=json.loads(accepted.read_text())['photos'] if accepted.exists() else json.loads((REVIEW/'selected-candidates.json').read_text())
for item in items:
    ident=item['cropId'];source=Path(item['sourceFile'].lstrip('/')) if item['sourceFile'].startswith('/assets/') else Path(item['sourceFile']);body=source.read_bytes()
    if hashlib.sha256(body).hexdigest()!=item['sourceSha256']:raise ValueError('Changed reviewed source: '+ident)
    with Image.open(source) as image:
        ext='.png' if image.format=='PNG' else '.jpg';original=OUT/'sources'/(ident+ext);
        if source.resolve()!=original.resolve():shutil.copyfile(source,original)
        raw=ImageOps.exif_transpose(image)
        rgb=Image.new('RGB',raw.size,'white')
        if raw.mode=='RGBA':rgb.paste(raw,mask=raw.getchannel('A'))
        else:rgb.paste(raw.convert('RGB'))
        files=[]
        for width,height in [(320,240),(960,720)]:
            scaled=ImageOps.contain(rgb,(width,height));canvas=Image.new('RGB',(width,height),'white');canvas.paste(scaled,((width-scaled.width)//2,(height-scaled.height)//2))
            path=OUT/(ident+f'-{width}.webp');canvas.save(path,'WEBP',quality=87,method=6)
            files.append({'src':'/'+str(path),'width':width,'height':height,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    photos.append({**item,'sourceFile':'/'+str(original),'alt':ALTS[ident],'src':files[0]['src'],'large':files[1]['src'],'srcset':', '.join(f"{f['src']} {f['width']}w" for f in files),'files':files,'changes':'Samazināts izmērs, balts ietvars un WebP formāts.','visualReview':{'date':'2026-11-10','sourceSha256':item['sourceSha256'],'observation':ALTS[ident]}})
if len(photos)!=16:raise ValueError('Expected 16 reviewed photos')
Path('_data/garden-photos.json').write_text(json.dumps({'photos':photos},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'photos':len(photos),'thumbnailBytes':sum(p['files'][0]['bytes'] for p in photos),'largeBytes':sum(p['files'][1]['bytes'] for p in photos)}))
