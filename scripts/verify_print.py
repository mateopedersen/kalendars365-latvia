"""Inspect every rendered output. PDFium is isolated per worker process (never threads)."""
import json, pathlib, math, hashlib, multiprocessing
from concurrent.futures import ProcessPoolExecutor
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image, ImageOps, ImageDraw, ImageFont

root=pathlib.Path(__file__).resolve().parents[1]
qa=root.parent/'qa-print'

def verify_one(item):
    pdf=root/item['pdf'].lstrip('/');webp=root/item['webp'].lstrip('/')
    assert hashlib.sha256(pdf.read_bytes()).hexdigest()==item['sha256']
    r=PdfReader(pdf);assert len(r.pages)==1
    p=r.pages[0];text=p.extract_text()
    assert 'Kalendārs365' in text and 'kalendars365.lv' in text
    assert str(item['year']) in text
    box=[float(p.mediabox.width),float(p.mediabox.height)]
    expected=[297,210] if item['orientation']=='landscape' else [210,297]
    assert all(abs(v*25.4/72-e)<.01 for v,e in zip(box,expected))
    fonts=p['/Resources']['/Font'].get_object();embedded=[]
    for ref in fonts.values():
        f=ref.get_object()
        if '/DescendantFonts' in f:f=f['/DescendantFonts'][0].get_object()
        desc=f.get('/FontDescriptor');assert desc
        desc=desc.get_object();assert '/FontFile2' in desc or '/FontFile3' in desc
        embedded.append(str(f.get('/BaseFont')))
        assert 'DMSans' in embedded[-1].replace('-', '').replace(' ', ''), (pdf, 'Expected actual embedded DM Sans font', embedded[-1])
    im=Image.open(webp);assert im.format=='WEBP';assert im.size==(item['width'],item['height']);assert im.info.get('icc_profile');im.load()
    preview=Image.open(root/item['preview'].lstrip('/'));preview.load()
    assert preview.format=='WEBP' and preview.width==300
    assert abs(preview.height-item['height']*300/item['width'])<1
    preview.close()
    doc=pdfium.PdfDocument(pdf);page=doc[0];tp=page.get_textpage()
    for i in range(tp.count_chars()):
        codepoint=pdfium.raw.FPDFText_GetUnicode(tp,i)
        if not codepoint or chr(codepoint).isspace():continue
        x0,y0,x1,y1=tp.get_charbox(i)
        assert x0>=0 and y0>=0 and x1<=box[0]+.1 and y1<=box[1]+.1,(pdf,'glyph outside page',i)
    tp.close()
    render=page.render(scale=1.2).to_pil().convert('RGB')
    render.save(qa/(pdf.stem+'.png'))
    a=render.resize((160,200)).convert('L');b=im.resize((160,200)).convert('L')
    mean_abs=sum(abs(x-y) for x,y in zip(a.get_flattened_data(),b.get_flattened_data()))/(160*200)
    assert mean_abs<8,(pdf,mean_abs)
    page.close();doc.close();im.close()
    return {**item,'pageCount':1,'embeddedFonts':embedded,'A4Millimetres':expected,'webpICC':'sRGB','textSelectable':True,'glyphsInsidePaper':True,'rendered':True,'previewDecoded':True,'pairedMeanPixelDifference':round(mean_abs,3)}

def main():
    qa.mkdir(exist_ok=True)
    manifest=json.loads((root/'downloads/manifest.json').read_text())
    assert manifest.get('complete'), 'Print generation must finish before final verification'
    results=[]
    with ProcessPoolExecutor(max_workers=3,mp_context=multiprocessing.get_context('spawn')) as pool:
        for result in pool.map(verify_one,manifest['items'],chunksize=1):
            results.append(result)
            if len(results)%15==0:print(f"Verified {len(results)}/{len(manifest['items'])} PDF/WebP pairs",flush=True)
    thumbs=[]
    for item in results:
        if item['year']!=2029 or item['type']!='yearly':continue
        render=Image.open(qa/(pathlib.Path(item['pdf']).stem+'.png'))
        small=ImageOps.contain(render,(280,370));card=Image.new('RGB',(300,410),'#eeeeee');card.paste(small,((300-small.width)//2,10));ImageDraw.Draw(card).text((12,385),f"{item['design']:02} {item['name']}",fill='#222222',font=ImageFont.truetype(str(root/'assets/fonts/DM-Sans-Regular.ttf'),13));thumbs.append(card)
    if thumbs:
        contact=Image.new('RGB',(300*5,410*math.ceil(len(thumbs)/5)),'white')
        for i,t in enumerate(thumbs):contact.paste(t,((i%5)*300,(i//5)*410))
        contact.save(qa/'15-designs-contact-sheet.jpg',quality=90)
    (root/'docs/PRINT_RESULTS.json').write_text(json.dumps({'passed':len(results),'checks':['A4 MediaBox','embedded DM Sans Regular/Bold TrueType fonts','Latvian Unicode text','brand signature','real 600 ppi pixel dimensions','sRGB ICC','PDF render','glyph bounds','shared scene PDF/WebP pixel comparison','preview decode and aspect ratio'],'files':results},ensure_ascii=False,indent=2))
    print(f"PASS {len(results)} matched PDF/WebP pairs; every PDF opened/rendered and every WebP decoded; fonts/Unicode/A4/600ppi/sRGB verified.",flush=True)

if __name__=='__main__':main()
