"""Verify supplied print containers without rewriting or recompressing them."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,csv,argparse,collections

SLUGS=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris']
MANIFESTS=['downloads/gada-a3/manifest.json','downloads/menesa-a3/manifest.json','downloads/meness/manifest.json','downloads/manifest.json']
FAMILIES={'weekly':'/nedelas-kalendars/','family':'/gimenes-kalendars/','shift':'/mainu-grafiks/','timetable':'/stundu-saraksts/','daily':'/dienas-kalendars/','blank':'/tukss-kalendars/','named':'/kalendars-ar-vardu/'}
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
def verify(output,site='_site'):
 routes={x['url'] for x in json.loads(Path('docs/route-manifest.json').read_text())}; records=[];errors=[];archive=0
 for source in MANIFESTS:
  for item in json.loads(Path(source).read_text())['items']:
   y=item.get('year');m=item.get('month')
   if y not in range(2027,2031):archive+=1;continue
   if 'gada-a3' in source:landing=f'/kalendars/{y}/'
   elif 'menesa-a3' in source:landing=f'/kalendars/{y}/{SLUGS[m-1]}/'
   elif 'meness' in source:landing=f'/meness-kalendars/{y}/'+(SLUGS[m-1]+'/' if m else '')
   else:landing=FAMILIES.get(item.get('type'),'/pdf-kalendari/')
   if landing not in routes:errors.append({'file':source,'problem':'missing landing','landing':landing})
   for field,kind,checksum in [('pdf','pdf',item.get('pdfSha256') or item.get('sha256')),('image' if 'image' in item else 'webp','webp',item.get('imageSha256')),('preview','preview',item.get('previewSha256'))]:
    if not item.get(field):continue
    records.append({'sourceManifest':source,'year':y,'month':m,'design':item.get('design'),'title':item.get('title',item.get('name','')),'format':kind,'url':item[field],'landingPage':landing,'orientation':item.get('orientation',''),'printImageWidth':item.get('width'),'printImageHeight':item.get('height'),'paper':item.get('paper','A3' if '-a3/' in source else 'A4'),'dpi':item.get('dpi',item.get('ppi','')),'expectedSha256':checksum or ''})
 def check(row):
  file=Path(row['url'].lstrip('/'));built=Path(site)/file
  if not file.is_file() or not built.is_file():return row,[{'file':row['url'],'problem':'missing container'}]
  sha=digest(file);built_sha=digest(built);issues=[]
  with file.open('rb') as f:header=f.read(40)
  if row['expectedSha256'] and row['expectedSha256']!=sha:issues.append({'file':row['url'],'problem':'manifest checksum differs'})
  if sha!=built_sha:issues.append({'file':row['url'],'problem':'built bytes differ'})
  if row['format']=='pdf' and not header.startswith(b'%PDF-'):issues.append({'file':row['url'],'problem':'not PDF'})
  if row['format'] in ['webp','preview'] and not (header[:4]==b'RIFF' and header[8:12]==b'WEBP'):issues.append({'file':row['url'],'problem':'not WebP'})
  dimensions={}
  if row['format'] in ['webp','preview'] and len(header)>=30:
   if header[12:16]==b'VP8X':w,h=int.from_bytes(header[24:27],'little')+1,int.from_bytes(header[27:30],'little')+1
   elif header[12:16]==b'VP8L':n=int.from_bytes(header[21:25],'little');w,h=(n&16383)+1,((n>>14)&16383)+1
   else:w,h=int.from_bytes(header[26:28],'little')&16383,int.from_bytes(header[28:30],'little')&16383
   dimensions={'width':w,'height':h}
  return {**row,**dimensions,'bytes':file.stat().st_size,'sha256':sha,'builtSha256':built_sha,'validation':'pass' if not issues else 'fail'},issues
 with ThreadPoolExecutor(max_workers=4) as pool:
  checked=[]
  for row,issues in pool.map(check,records):checked.append(row);errors.extend(issues)
 out=Path(output);out.mkdir(parents=True,exist_ok=True)
 keys=sorted({k for r in checked for k in r})
 with (out/'DOWNLOAD-MANIFEST.csv').open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(checked)
 result={'verifiedCurrentFiles':len(checked),'formats':dict(collections.Counter(r['format'] for r in checked)),'currentDesigns':sum(1 for r in checked if r['format']=='pdf'),'archivalItemsOutsideCurrentScope':archive,'allFilesByteIdenticalToSource':not any(e['problem']=='built bytes differ' for e in errors),'rewrittenOriginals':0,'errors':errors,'scope':'manifest identities, format signatures, expected checksums when supplied, source/build bytes; not a new visual certification of every printed day'}
 (out/'downloads-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False));return result
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--site',default='_site');a=p.parse_args();r=verify(a.output,a.site);raise SystemExit(bool(r['errors']))
