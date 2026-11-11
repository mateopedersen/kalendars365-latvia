"""Verify the final HTML, image bytes, social metadata and structured-image assignment."""
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import hashlib,json
from urllib.parse import unquote
ROOT=Path(__file__).resolve().parents[2]
class Head(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.meta={};self.canonical=None;self.ld=[];self.inld=False;self.buf=''
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='meta':self.meta.setdefault(a.get('property') or a.get('name'),[]).append(a.get('content',''))
  if t=='link' and a.get('rel')=='canonical':self.canonical=a['href']
  if t=='script' and a.get('type')=='application/ld+json':self.inld=True;self.buf=''
 def handle_data(self,d):
  if self.inld:self.buf+=d
 def handle_endtag(self,t):
  if t=='script' and self.inld:self.ld.append(json.loads(self.buf));self.inld=False
catalog=json.loads((ROOT/'_data/social-images.json').read_text());rows=[];seen=set()
for url,r in catalog['pages'].items():
 path=ROOT/'_site'/((url.lstrip('/')+'index.html') if url.endswith('/') else url.lstrip('/'));p=Head();p.feed(path.read_text().split('</head>')[0]);expected='https://kalendars365.lv'+r['src']
 for name,want in [('og:image',expected),('og:image:secure_url',expected),('twitter:image',expected),('og:image:type','image/jpeg'),('og:image:width','1200'),('og:image:height','630'),('og:image:alt',r['alt']),('twitter:image:alt',r['alt']),('twitter:card','summary_large_image')]:assert p.meta.get(name)==[want],(url,name,p.meta.get(name),want)
 assert unquote(p.canonical)=='https://kalendars365.lv'+url,(url,p.canonical)
 assert expected not in seen;seen.add(expected)
 pages=[x for x in p.ld if x.get('@type')=='WebPage'];assert len(pages)==1;assert pages[0]['primaryImageOfPage']['url']==expected,url
 for node in p.ld:
  if node.get('@type')=='BlogPosting':assert node['image']==expected,url
 f=ROOT/'_site'/r['src'].lstrip('/');b=f.read_bytes();assert hashlib.sha256(b).hexdigest()==r['sha256'],url
 with Image.open(f) as im:im.load();assert im.format=='JPEG' and im.size==(1200,630),url
 rows.append({'url':url,'image':expected,'bytes':len(b),'width':1200,'height':630,'social':'pass','structuredImage':'pass','decode':'pass','sha256':r['sha256']})
assert len(rows)==900
summary={'pages':len(rows),'uniqueImages':len(seen),'uniqueSubjectPanels':len({r['panelSha256'] for r in catalog['pages'].values()}),'checks':['900 HTML head assignments','absolute HTTPS JPEG paths','single Open Graph and Twitter assignment','1200×630 real dimensions','Latvian alt text','structured primary image','complete built JPEG decode','built image SHA256'],'errors':[],'pagesChecked':rows}
(ROOT/'docs/SOCIAL_COVER_AUDIT.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items() if k!='pagesChecked'},ensure_ascii=False))
