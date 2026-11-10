"""Verify all delivered PDFs/images, without assuming that a successful render is enough."""
import hashlib,json,math,sys
from pathlib import Path
from PIL import Image
from pypdf import PdfReader
from pypdf.generic import ContentStream

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'downloads/meness/manifest.json').read_text())
assert data['complete'] and len(data['items'])==260
min_dpi=10000;total_moons=0;results=[]
def multiply(a,b):
    a0,a1,a2,a3,a4,a5=a;b0,b1,b2,b3,b4,b5=b
    return [a0*b0+a2*b1,a1*b0+a3*b1,a0*b2+a2*b3,a1*b2+a3*b3,a0*b4+a2*b5+a4,a1*b4+a3*b5+a5]
for index,item in enumerate(data['items']):
    pdf=root/item['pdf'].lstrip('/');image=root/item['image'].lstrip('/')
    reader=PdfReader(pdf);assert not reader.is_encrypted;assert len(reader.pages)==1
    page=reader.pages[0];w,h=float(page.mediabox.width),float(page.mediabox.height)
    size=[210,297] if item['paper']=='A4' else [297,420]
    if item['orientation']=='landscape':size.reverse()
    assert all(abs(x*72/25.4-y)<.01 for x,y in zip(size,[w,h]))
    text=page.extract_text();assert 'kalendars365.lv' in text and 'Kalendārs' in text and '365' in text
    assert 'MĒNESS KALENDĀRS' in text and 'Latvijas laiks' in text and str(item['year']) in text
    assert not any(s in text for s in ['WebP','Sloven','Sloveni','Koledar365','\ufffd'])
    fonts=page['/Resources']['/Font'].get_object()
    embedded=0
    for f in fonts.values():
        f=f.get_object()
        if '/FontDescriptor' in f:
            desc=f['/FontDescriptor'].get_object();assert '/FontFile2' in desc;embedded+=1
    assert embedded==2
    objects=page['/Resources']['/XObject'].get_object();count=0;stack=[];ctm=[1,0,0,1,0,0]
    for operands,operation in ContentStream(page.get_contents(),reader).operations:
        if operation==b'q':stack.append(ctm.copy())
        elif operation==b'Q':ctm=stack.pop()
        elif operation==b'cm':ctm=multiply(ctm,list(map(float,operands)))
        elif operation==b'Do':
            obj=objects[operands[0]].get_object()
            if obj.get('/Subtype')=='/Image':
                count+=1;dx=int(obj['/Width'])*72/math.hypot(ctm[0],ctm[1]);dy=int(obj['/Height'])*72/math.hypot(ctm[2],ctm[3]);min_dpi=min(min_dpi,dx,dy)
                assert min(dx,dy)>=599.99,(pdf,dx,dy)
                assert ctm[4]>=0 and ctm[5]>=0 and ctm[4]+math.hypot(ctm[0],ctm[1])<=w+.01 and ctm[5]+math.hypot(ctm[2],ctm[3])<=h+.01
    assert count==item['dates'],(pdf,count,item['dates']);total_moons+=count
    with Image.open(image) as im:
        assert im.format=='WEBP' and im.size==(item['width'],item['height'])
        exif=im.getexif();assert exif[282]==600 and exif[283]==600 and exif[296]==2
        im.load()
    for kind,hash_key in [('pdf','pdfSha256'),('image','imageSha256')]:assert hashlib.sha256((root/item[kind].lstrip('/')).read_bytes()).hexdigest()==item[hash_key]
    results.append({'stem':item['stem'],'pages':1,'moons':count,'embeddedFonts':embedded,'imagePixels':[item['width'],item['height']],'exifDpi':600})
    if index%20==0:print(f'Verified {index+1}/260',flush=True)
report={'pdfs':260,'images':260,'pages':260,'moonDiscs':total_moons,'minimumEmbeddedMoonDpi':round(min_dpi,2),'results':results}
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'docs/LUNAR_PRINT_RESULTS.json'
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='results'}))
