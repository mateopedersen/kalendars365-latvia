"""Raw HTML and bounded loopback HTTP audit. Does not execute JavaScript."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote,urljoin,quote
from urllib.request import Request,urlopen,build_opener,HTTPRedirectHandler
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor
import argparse,csv,json,re,hashlib,xml.etree.ElementTree as ET,collections

class Document(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.title='';self.h1=[];self.headings=[];self.meta={};self.links=[];self.images=[];self.ld=[];self.main=[];self.scripts=[];self._head=False;self._title=False;self._h1=None;self._json=None;self._main=False;self._skip=0;self.tables=0;self.date_cells=[];self.ids=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.append(a['id'])
  if tag=='head':self._head=True
  if tag=='title' and self._head:self._title=True
  if tag=='br' and self._h1 is not None:self._h1+=' '
  if tag=='main':self._main=True
  if tag=='h1':self._h1=''
  if tag=='meta':self.meta[a.get('name',a.get('property',''))]=a.get('content','')
  if tag in ('a','link'):self.links.append({'tag':tag,**a})
  if tag=='img':self.images.append(a)
  if tag=='table' and self._main:self.tables+=1
  if a.get('data-date') and self._main:self.date_cells.append(a['data-date'])
  if tag=='script':
   self._skip+=1
   if a.get('src'):self.scripts.append(a['src'])
   if a.get('type')=='application/ld+json':self._json=''
  if tag in ('style','noscript'):self._skip+=1
 def handle_endtag(self,tag):
  if tag=='title':self._title=False
  if tag=='head':self._head=False
  if tag=='main':self._main=False
  if tag=='h1' and self._h1 is not None:self.h1.append(' '.join(self._h1.split()));self._h1=None
  if tag=='script' and self._json is not None:
   try:self.ld.append(json.loads(self._json))
   except ValueError:self.ld.append({'INVALID_JSON':True})
   self._json=None
  if tag in ('script','style','noscript'):self._skip=max(0,self._skip-1)
  if tag=='br' and self._h1 is not None:self._h1+=' '
 def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
 def handle_data(self,text):
  if self._title:self.title+=text
  if self._h1 is not None:self._h1+=text
  if self._json is not None:self._json+=text
  if self._main and not self._skip:self.main.append(text)

class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*args):return None

def http_state(base,url):
 try:
  req=Request(base+quote(url,safe='/?=&%'),headers={'User-Agent':'Kalendars365-Local-SEO-Audit/1.0'})
  with build_opener(NoRedirect).open(req,timeout=15) as r:
   return {'httpStatus':r.status,'redirectTo':r.headers.get('Location',''),'xRobotsTag':r.headers.get('X-Robots-Tag',''),'contentType':r.headers.get('Content-Type',''),'cacheControl':r.headers.get('Cache-Control',''),'httpSimulation':r.headers.get('X-Local-Simulation','')}
 except HTTPError as e:return {'httpStatus':e.code,'redirectTo':e.headers.get('Location',''),'xRobotsTag':e.headers.get('X-Robots-Tag',''),'contentType':e.headers.get('Content-Type',''),'cacheControl':e.headers.get('Cache-Control',''),'httpSimulation':e.headers.get('X-Local-Simulation','')}
 except Exception as e:return {'httpStatus':'UNVERIFIED','httpError':type(e).__name__}

def nodes(value):
 if isinstance(value,dict):
  yield value
  for v in value.values():yield from nodes(v)
 elif isinstance(value,list):
  for v in value:yield from nodes(v)

def audit(site,output,base=None):
 site=Path(site);out=Path(output);out.mkdir(parents=True,exist_ok=True)
 manifest={r['url']:r for r in json.loads(Path('docs/route-manifest.json').read_text())}
 ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
 sitemap={unquote(urlsplit(u.find('s:loc',ns).text).path):u.findtext('s:lastmod',default='',namespaces=ns) for u in ET.parse(site/'sitemap.xml').getroot()}
 rows=[];problems=[];targets=set();docs={}
 for file in sorted(site.rglob('*.html')):
  rel=str(file.relative_to(site));url='/' if rel=='index.html' else '/'+rel[:-10] if rel.endswith('index.html') else '/'+rel
  raw=file.read_text();doc=Document();doc.feed(raw);docs[url]=doc;record=manifest.get(url,{})
  canonical=next((x.get('href','') for x in doc.links if x.get('rel')=='canonical'),'')
  ld_nodes=list(nodes(doc.ld));types=sorted({str(t) for n in ld_nodes for t in (n.get('@type',[]) if isinstance(n.get('@type',[]),list) else [n.get('@type')]) if t})
  anchors=[x.get('href','') for x in doc.links if x['tag']=='a'];pdf=[x for x in anchors if urlsplit(x).path.lower().endswith('.pdf')];ics=[x for x in anchors if urlsplit(x).path.lower().endswith('.ics')]
  for href in anchors:
   u=urlsplit(urljoin('https://kalendars365.lv'+url,href))
   if u.netloc=='kalendars365.lv' and not Path(u.path).suffix:targets.add(unquote(u.path))
  text=' '.join(' '.join(doc.main).split())
  row={'url':url,'family':record.get('family','error_document'),'source':('index.html' if url=='/' else 'generated'+url+'index.html') if url in manifest and record.get('family')!='blog_article' else 'route manifest / Jekyll document','httpStatus':'NOT_MEASURED','redirectTo':'','title':doc.title,'description':doc.meta.get('description',''),'h1':' | '.join(doc.h1),'h1Count':len(doc.h1),'canonical':canonical,'robots':doc.meta.get('robots',''),'xRobotsTag':'NOT_MEASURED','lang':re.search(r'<html\s[^>]*lang="([^"]+)"',raw)[1],'sitemap':url in sitemap,'lastmod':sitemap.get(url,''),'schemaTypes':' | '.join(types),'mainImage':doc.meta.get('og:image',''),'mainImageAlt':doc.meta.get('og:image:alt',''),'pdfCount':len(pdf),'icsCount':len(ics),'pdfLinks':json.dumps(pdf,ensure_ascii=False),'icsLinks':json.dumps(ics,ensure_ascii=False),'rawHtmlBytes':len(raw.encode()),'gzipBytes':__import__('gzip').compress(raw.encode()).__len__(),'mainTextCharacters':len(text),'mainTables':doc.tables,'rawCalendarDateCells':len(doc.date_cells),'scriptCount':len(doc.scripts),'scripts':json.dumps(doc.scripts),'imageCount':len(doc.images),'missingAlt':sum('alt' not in im for im in doc.images),'missingImageDimensions':sum(not im.get('width') or not im.get('height') for im in doc.images),'criticalCssBytes':sum(len(s.encode()) for s in re.findall(r'<style\b[^>]*>([\s\S]*?)</style>',raw)),'metaSha256':hashlib.sha256(json.dumps([doc.title,doc.meta.get('description'),canonical,doc.meta.get('robots')]).encode()).hexdigest()}
  rows.append(row)
  def fail(code,detail):problems.append({'classification':'DOĞRULANDI','url':url,'code':code,'detail':detail})
  if len(doc.h1)!=1:fail('h1-count',len(doc.h1))
  if not doc.title or not row['description']:fail('missing-metadata','title or description')
  if unquote(canonical)!='https://kalendars365.lv'+url:fail('canonical-mismatch',canonical)
  if row['lang']!='lv':fail('language',row['lang'])
  if ('noindex' not in row['robots'])!=(url in sitemap):fail('sitemap-policy','robots and sitemap disagree')
  if any(n.get('INVALID_JSON') for n in ld_nodes):fail('invalid-jsonld','JSON parse error')
  if row['missingAlt']:fail('missing-image-alt',row['missingAlt'])
  if row['missingImageDimensions']:fail('missing-image-dimensions',row['missingImageDimensions'])
  if re.search(r'https?://(?:localhost|127\.0\.0\.1|[^/\s"<>]+\.pages\.dev)',canonical+row['mainImage']):fail('preview-leak','public metadata')
  if record.get('family') in ('calendar_month','iso_week') or url=='/':
   if not doc.date_cells:fail('calendar-csr-only','No calendar date cells in first HTML')
 for field in ['title','description']:
  grouped=collections.defaultdict(list)
  for r in rows:grouped[r[field]].append(r['url'])
  for value,urls in grouped.items():
   if len(urls)>1:problems.append({'classification':'DOĞRULANDI','url':' | '.join(urls),'code':'duplicate-'+field,'detail':value})
 if base:
  if urlsplit(base).hostname not in ['127.0.0.1','localhost','::1']:raise ValueError('Comprehensive HTTP audit is loopback only')
  with ThreadPoolExecutor(max_workers=6) as pool:
   states=list(pool.map(lambda r:http_state(base,r['url']),rows))
  for r,h in zip(rows,states):r.update(h)
 known={r['url'] for r in rows}
 missing=sorted((set(manifest)|set(sitemap)|targets)-known)
 for u in missing:problems.append({'classification':'DOĞRULANDI','url':u,'code':'missing-route','detail':'Referenced canonical-style route absent from output'})
 keys=sorted({k for r in rows for k in r})
 with (out/'URL-INVENTORY.csv').open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(rows)
 (out/'inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(out/'findings.json').write_text(json.dumps(problems,ensure_ascii=False,indent=2))
 summary={'html':len(rows),'manifest':len(manifest),'sitemap':len(sitemap),'families':dict(collections.Counter(r['family'] for r in rows)),'http':dict(collections.Counter(str(r['httpStatus']) for r in rows)),'findings':dict(collections.Counter(p['code'] for p in problems)),'missingRoutes':missing,'htmlBytes':sum(r['rawHtmlBytes'] for r in rows),'criticalCssBytes':sum(r['criticalCssBytes'] for r in rows),'jsExecuted':False,'httpOrigin':base,'scope':'raw HTML; HTTP headers are local simulation, not CDN verification'}
 (out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False))
 return rows,problems

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--site',default='_site');parser.add_argument('--output',required=True);parser.add_argument('--base');a=parser.parse_args();audit(a.site,a.output,a.base)
