"""Read each non-calendar page's actual built content; retain a per-URL ledger."""
import json, re, hashlib, collections
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parent.parent
EXCLUDED_FAMILIES=set('year calendar_month month_index lunar_year lunar_month week_index iso_week print_index print_month name_calendar name_day_month work_year work_month holiday_year holiday_month memorial_year garden_month school_academic school_year_calendar'.split())
EXCLUDED_ROOTS=set('/ /kalendars/ /menesa-kalendars/ /nedelas-kalendars/ /meness-kalendars/ /pdf-kalendari/ /kalendars-ar-vardu/ /tukss-kalendars/ /dzimsanas-dienu-kalendars/ /dienas-kalendars/ /dienas-planotajs/ /skolas-kalendars/ /izveidot-kalendaru/'.split())
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.main=False;self.skip=0;self.text=[];self.forms=0;self.buttons=0;self.links=[];self.h1=0;self.config=None;self.capture=False;self.config_text=''
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='main':self.main=True
  if not self.main:return
  if tag in ['script','style']:self.skip+=1
  if tag=='script' and 'data-useful-config' in a:self.capture=True
  self.forms+=tag=='form';self.buttons+=tag=='button';self.h1+=tag=='h1'
  if tag=='a' and a.get('href','').startswith('https://'):self.links.append(a['href'])
 def handle_endtag(self,tag):
  if tag=='main':self.main=False
  if self.main and tag in ['script','style']:self.skip=max(0,self.skip-1);self.capture=False
 def handle_data(self,data):
  if self.capture:self.config_text+=data
  if self.main and not self.skip and data.strip():self.text.append(data.strip())
 def result(self):
  if self.config_text:self.config=json.loads(self.config_text)
  text=re.sub(r'\s+',' ',' '.join(self.text))
  return dict(contentSha256=hashlib.sha256(text.encode()).hexdigest(),words=len(text.split()),forms=self.forms,buttons=self.buttons,sourceLinks=len(set(self.links)),h1=self.h1,kind=(self.config or {}).get('kind'),content=text)

routes=json.loads((ROOT/'_data/routes.json').read_text())
records=[];excluded=[];errors=[]
for route in routes:
 url=route['URL path'];family=route['Page family']
 if family in EXCLUDED_FAMILIES or url in EXCLUDED_ROOTS:excluded.append(url);continue
 path=ROOT/'_site'/url.strip('/')/'index.html'
 if not path.exists():errors.append(url+' missing');continue
 page=Page();page.feed(path.read_text());r=page.result();r.update(url=url,family=family,title=route['Latvian title/topic'])
 if r['h1']!=1:errors.append(url+' expected one H1')
 if not r['kind']:errors.append(url+' missing useful module')
 if r['words']<30:errors.append(url+' unusually empty content')
 if re.search(r'\b(undefined|NaN|Lorem ipsum)\b',r['content']):errors.append(url+' invalid placeholder')
 records.append(r)
# The manually authored licensing page is included as well.
page=Page();page.feed((ROOT/'_site/pilsetas-un-fotografijas/index.html').read_text());r=page.result();r.update(url='/pilsetas-un-fotografijas/',family='city_photos',title='Fotogrāfijas un licences');records.append(r)
if not r['kind']:errors.append('Licensing page missing useful module')
out=dict(scope='Non-calendar information and tools; calendar grids/year/month/week/download pages excluded',pages=len(records),excluded=len(excluded),kinds=dict(collections.Counter(r['kind'] for r in records)),errors=errors,records=records,excludedUrls=excluded)
(ROOT/'docs/useful-pages-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k not in ['records','excludedUrls']},ensure_ascii=False))
if errors:raise SystemExit(1)
