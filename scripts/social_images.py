"""Original, route-specific 1200×630 editorial social cards; no user data involved.
Render native brand typography, the site's verified dates and accepted licensed artwork.
Run tooling/social-cards/prepare.mjs first. Outputs are JPEG for broad social compatibility.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
from pathlib import Path
from functools import lru_cache
from datetime import date, timedelta
import argparse, calendar, hashlib, html, json, math, re, unicodedata
import numpy as np
ROOT=Path(__file__).resolve().parents[1]; S=2; W,H=1200,630
OUT=ROOT/'assets/social-cards/v2'; OUT.mkdir(parents=True,exist_ok=True)
CACHE=ROOT/'tooling/social-cards/cache'
def read(p):return json.loads((ROOT/p).read_text())
ROUTES=read('docs/route-manifest.json')
assert len({r['url'] for r in ROUTES})==len(ROUTES),'Duplicate page route in manifest'
for support in [
 {'url':'/404.html','family':'not_found','title':'Lapa nav atrasta','description':'Atrodi vajadzīgo kalendāru, datumu vai plānošanas rīku.'},
 {'url':'/500.html','family':'temporary_error','title':'Īslaicīga kļūda','description':'Kalendāri un plānošanas rīki Latvijas ikdienai.'},
 {'url':'/nedelas-kalendars/2031/01/','family':'iso_week','title':'2031. gada 1. nedēļa','description':'ISO nedēļa gadumijā.'}]:
 if not any(r['url']==support['url'] for r in ROUTES):ROUTES.append(support)
RAW={r['URL path']:r for r in read('_data/routes.json')}
DATA=read('assets/calendar-data.json'); HOLIDAYS=DATA['holidays']; NAMES=read('_data/name-days-current.json')['records']
CITIES={c['id']:c for c in read('_data/cities.json')['cities']}; BLOGS={p['url']:p for p in read('_data/blog.json')['posts']}
CROPS={c['id']:c for c in read('_data/garden-crops.json')['crops']}; CROP_PHOTOS={p['cropId']:p for p in read('_data/garden-photos.json')['photos']}
TRADITIONS=read('_data/tradition-covers.json'); PHOTO_USE=read('_data/tradition-photo-usage.json')
COVER_FOR={r['url']:key for key,rows in PHOTO_USE.items() for r in rows}
PHOTO_META={p['id']:p for p in read('_data/tradition-photos.json')['photos']}
PHOTO_META.update({p['id']:p for p in read('_data/occasion-photo-overrides.json')['photos']})
for occasion in read('_data/occasions.json'):PHOTO_META.setdefault(occasion['photo']['id'],occasion['photo'])
PROFILES={p['slug']:p for p in read('_data/horoscope/profiles.json')['profiles']}
MOONS=json.loads((CACHE/'moon-noon.json').read_text())['days']
ART_PHOTOS=read('_data/astronomy-photos.json')['photos']
MONTHS=['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris']
SLUGS=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris']
DAYS=['P.','O.','T.','C.','Pk.','S.','Sv.']; DAY_NAMES=['Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena','Svētdiena']
WINE='#79243c'; INK='#282c36'; MUTED='#72666b'; CREAM='#fffdf7'; GOLD='#d2aa62'; TEAL='#2d6965'
REG=ROOT/'assets/fonts/DM-Sans-Regular.ttf'; BOLD=ROOT/'assets/fonts/DM-Sans-Bold.ttf'; SERIF=ROOT/'assets/fonts/Literata-Display.ttf'
@lru_cache(80)
def font(size,bold=False,serif=False):return ImageFont.truetype(str(SERIF if serif else BOLD if bold else REG),round(size*S))
def box(v):return tuple(round(x*S) for x in v)
def rr(im,b,r=16,fill=CREAM,outline=None,width=1):ImageDraw.Draw(im).rounded_rectangle(box(b),round(r*S),fill=fill,outline=outline,width=round(width*S))
def line(im,pts,fill,width=1):ImageDraw.Draw(im).line([(round(x*S),round(y*S)) for x,y in pts],fill=fill,width=max(1,round(width*S)),joint='curve')
def ellipse(im,b,fill,outline=None,width=1):ImageDraw.Draw(im).ellipse(box(b),fill=fill,outline=outline,width=round(width*S))
def text(im,p,s,size=22,color=INK,bold=False,serif=False,anchor='lt'):
 d=ImageDraw.Draw(im);f=font(size,bold,serif);d.text((round(p[0]*S),round(p[1]*S)),str(s),font=f,fill=color,anchor=anchor)
 return tuple(x/S for x in d.textbbox((round(p[0]*S),round(p[1]*S)),str(s),font=f,anchor=anchor))
def measure(s,size=22,bold=False,serif=False):return ImageDraw.Draw(Image.new('RGB',(1,1))).textlength(str(s),font=font(size,bold,serif))/S
def wrap(s,size,width,bold=False,serif=False):
 result=[];row=''
 for word in str(s).split():
  trial=(row+' '+word).strip()
  if measure(trial,size,bold,serif)>width and row:result.append(row);row=word
  else:row=trial
 result.append(row);return result

def fitted(im,p,s,width,height,maxsize=58,minsize=30,maxlines=4,color=INK,bold=True,serif=False):
 for size in range(maxsize,minsize-1,-1):
  rows=wrap(s,size,width,bold,serif);lh=size*1.16
  if len(rows)<=maxlines and len(rows)*lh<=height and all(measure(v,size,bold,serif)<=width for v in rows):break
 else:raise ValueError('Text cannot fit: '+str(s))
 bounds=[]
 for i,row in enumerate(rows):bounds.append(text(im,(p[0],p[1]+lh*i),row,size,color,bold,serif))
 return {'text':str(s),'size':size,'lines':rows,'bounds':bounds,'region':[p[0],p[1],p[0]+width,p[1]+height]}

@lru_cache(96)
def load(src):
 p=ROOT/str(src).lstrip('/');return Image.open(p).convert('RGBA')
def art(src):
 p=CACHE/str(src).lstrip('/').replace('/','__').replace('.svg','.png')
 assert p.exists(),src
 return load('/'+str(p.relative_to(ROOT)))
def paste_fit(im,asset,b,cover=False,mask_radius=0):
 a=load(asset) if isinstance(asset,str) else asset
 w,h=round((b[2]-b[0])*S),round((b[3]-b[1])*S)
 if cover:a=ImageOps.fit(a,(w,h),Image.Resampling.LANCZOS)
 else:
  a=ImageOps.contain(a,(w,h),Image.Resampling.LANCZOS);pad=Image.new('RGBA',(w,h));pad.alpha_composite(a,((w-a.width)//2,(h-a.height)//2));a=pad
 if mask_radius:
  mask=Image.new('L',(w,h));ImageDraw.Draw(mask).rounded_rectangle((0,0,w,h),round(mask_radius*S),fill=255);a.putalpha(ImageChops_multiply(a.getchannel('A'),mask))
 im.alpha_composite(a,(round(b[0]*S),round(b[1]*S)))
def ImageChops_multiply(a,b):
 from PIL import ImageChops
 return ImageChops.multiply(a,b)
def shadow_paste(im,layer,xy=(0,0),blur=12,offset=(0,9),alpha=46):
 mask=layer.getchannel('A');shadow=Image.new('RGBA',im.size);a=Image.new('RGBA',layer.size,(29,22,31,0));a.putalpha(mask.point(lambda x:round(x*alpha/255)));shadow.alpha_composite(a,(round((xy[0]+offset[0])*S),round((xy[1]+offset[1])*S)));shadow=shadow.filter(ImageFilter.GaussianBlur(blur*S));im.alpha_composite(shadow);im.alpha_composite(layer,(round(xy[0]*S),round(xy[1]*S)))
def flag(im,x,y,w=27):
 rr(im,(x,y,x+w,y+w/2),2,'#981e37');ImageDraw.Draw(im).rectangle(box((x,y+w*.2,x+w,y+w*.3)),fill='#fffdf9')
@lru_cache(12)
def background(theme):
 colors={'paper':('#fbf7ee','#eee7dd'),'moon':('#121b2d','#303044'),'garden':('#f5f4e6','#dfe7d9'),'sun':('#fff8ea','#f0ded7'),'wine':('#6a1d36','#982f4a'),'blue':('#f5f8fa','#dfe7ea')}
 a,b=colors.get(theme,colors['paper']);a=np.array(ImageColor_rgb(a));b=np.array(ImageColor_rgb(b));xx=np.linspace(0,1,W)[None,:,None];yy=np.linspace(0,1,H)[:,None,None];t=np.clip(xx*.4+yy*.45,0,1);pixels=a*(1-t)+b*t
 im=Image.fromarray(np.uint8(pixels)).convert('RGBA').resize((W*S,H*S),Image.Resampling.BICUBIC)
 glow=Image.new('RGBA',im.size);ellipse(glow,(760,-110,1390,530),(255,255,255,12 if theme=='moon' else 80));ellipse(glow,(840,-30,1300,430),None if False else (255,255,255,6 if theme=='moon' else 36));im.alpha_composite(glow)
 return im

def ImageColor_rgb(v):
 from PIL import ImageColor
 return ImageColor.getrgb(v)
def panel(dark=False,color=None):
 im=Image.new('RGBA',(506*S,550*S));rr(im,(0,0,506,550),28,color or ('#172332' if dark else CREAM),('#40505b' if dark else '#e4d8ca'));return im

def mini_month(im,x,y,w,h,yval,m):
 text(im,(x+4,y),MONTHS[m-1],14,WINE,True);cells=calendar.Calendar(0).monthdayscalendar(yval,m);ch=(h-38)/6;cw=w/7
 for c,day in enumerate(DAYS):text(im,(x+cw*(c+.5),y+25),day,9,MUTED,anchor='mt')
 for ri,row in enumerate(cells):
  for ci,n in enumerate(row):
   if n:text(im,(x+cw*(ci+.5),y+40+ri*ch),n,11,WINE if ci>=5 else INK,bold=ci>=5,anchor='mt')

def month_card(y,m,work=False,holiday=False):
 im=panel();text(im,(26,24),MONTHS[m-1],32,WINE,True);text(im,(480,31),y,23,MUTED,anchor='rt');line(im,[(26,74),(480,74)],'#e4d8ca')
 cw=64;start=30;top=118;rows=calendar.Calendar(0).monthdayscalendar(y,m);ch=(405 if work else 445)-top;ch=ch/len(rows)
 for ci,day in enumerate(DAYS):text(im,(start+cw*(ci+.5),90),day,15,WINE if ci>=5 else MUTED,True,anchor='mt')
 for ri,row in enumerate(rows):
  for ci,n in enumerate(row):
   b=(start+ci*cw,top+ri*ch,start+(ci+1)*cw-5,top+(ri+1)*ch-5)
   if n:
    dt=date(y,m,n);hs=[q for q in HOLIDAYS if q['date']==dt.isoformat() and q.get('dayOff')]
    rr(im,b,9,'#f7e9e8' if hs else '#f6f1e8' if ci>=5 else '#fdfbf7')
    text(im,((b[0]+b[2])/2,b[1]+(ch-29)/2),n,23,WINE if hs or ci>=5 else INK,True,anchor='mt')
    if hs:ellipse(im,(b[0]+25,b[3]-9,b[0]+29,b[3]-5),WINE)
 if work:
  days=[date(y,m,n) for n in range(1,calendar.monthrange(y,m)[1]+1)];off={h['date'] for h in HOLIDAYS if h.get('dayOff')};count=sum(d.weekday()<5 and d.isoformat() not in off for d in days)
  rr(im,(28,435,478,519),15,'#eaf1eb');text(im,(46,448),count,46,TEAL,True);text(im,(132,456),'darba dienas',22,TEAL,True);text(im,(132,488),'5 dienu darba nedēļā',14,TEAL)
 else:
  rr(im,(28,474,478,522),12,'#f4eee6');text(im,(44,489),'Svētku brīvdienu nav' if holiday else 'Latvijas svētki',17,WINE,True);text(im,(461,489),f'{calendar.monthrange(y,m)[1]} dienas',17,MUTED,anchor='rt')
 return im

def year_card(y):
 im=panel();text(im,(27,24),y,48,WINE,True);text(im,(478,42),'GADA PĀRSKATS',13,MUTED,True,anchor='rt');line(im,[(26,90),(480,90)],'#dfd4c9')
 for m in range(1,13):mini_month(im,26+((m-1)%3)*154,112+((m-1)//3)*101,143,92,y,m)
 return im

def week_card(y,w):
 im=panel();start=date.fromisocalendar(y,w,1);text(im,(26,24),f'{w:02d}',55,WINE,True);text(im,(116,34),'ISO nedēļa',26,INK,True);text(im,(116,70),f'{start.day:02d}.{start.month:02d}. — {(start+timedelta(days=6)).day:02d}.{(start+timedelta(days=6)).month:02d}.',16,MUTED)
 for i in range(7):
  dt=start+timedelta(days=i);yy=119+i*57;rr(im,(26,yy,480,yy+48),10,'#f2e5e7' if i>=5 else '#f5f1e9');text(im,(42,yy+12),DAY_NAMES[i],17,WINE if i>=5 else INK,True);text(im,(462,yy+8),f'{dt.day:02d}.{dt.month:02d}.{dt.year}',22,WINE,True,anchor='rt')
 return im

@lru_cache(300)
def moon_img(size,phase):
 size=round(size*S);a=load('/assets/astronomy/moon-apollo17.webp');pixels=np.asarray(a);ys,xs=np.nonzero(np.mean(pixels[:,:,:3],axis=2)>55);a=a.crop((int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1));a=ImageOps.fit(a,(size,size),Image.Resampling.LANCZOS);arr=np.array(a).astype(float)
 yy,xx=np.mgrid[-1:1:complex(size),-1:1:complex(size)];inside=xx*xx+yy*yy<=1;z=np.sqrt(np.maximum(0,1-xx*xx-yy*yy));light=xx*math.sin(phase*2*math.pi)-z*math.cos(phase*2*math.pi);brightness=.035+.965*np.power(np.maximum(0,light),.45);arr[:,:,:3]*=brightness[:,:,None];arr[:,:,3]=inside*255
 return Image.fromarray(np.uint8(np.clip(arr,0,255)))
def lunar_card(y,m=None):
 im=panel(True);text(im,(26,24),f'{MONTHS[m-1]} {y}' if m else str(y),30,'#fff6de',True);text(im,(26,68),'MĒNESS APGAISMOJUMS',12,'#b4c4d0',True)
 if m:
  cw=65;rows=calendar.Calendar(0).monthdayscalendar(y,m);ch=350/len(rows);ms=min(43,ch-24)
  for ci,day in enumerate(DAYS):text(im,(30+cw*(ci+.5),102),day,14,'#c8ccd6',True,anchor='mt')
  for ri,row in enumerate(rows):
   for ci,n in enumerate(row):
    if not n:continue
    item=MOONS[f'{y}-{m:02d}-{n:02d}'];x=29+ci*cw;yy=135+ri*ch;text(im,(x+30,yy-5),n,12,'#b8c3cd',anchor='mt');paste_fit(im,moon_img(ms,round(item['phase'],6)),(x+30-ms/2,yy+14,x+30+ms/2,yy+14+ms));
 else:
  for mval in range(1,13):
   item=MOONS[f'{y}-{mval:02d}-01'];x=35+(mval-1)%3*152;yy=105+(mval-1)//3*97;paste_fit(im,moon_img(58,round(item['phase'],6)),(x+29,yy,x+87,yy+58));text(im,(x+58,yy+65),MONTHS[mval-1][:3]+'.',14,'#e0d9c8',True,anchor='mt')
 text(im,(26,510),'12.00 Latvijas laikā · NASA Apollo 17 faktūra' if m else 'Katra mēneša 1. diena · 12.00 Latvijā',12,'#b8c3cd');
 if not m:text(im,(26,532),'Aprēķināts apgaismojums · NASA Apollo 17',10,'#b8c3cd')
 return im

def work_year_card(y):
 im=panel();text(im,(26,24),y,48,TEAL,True);text(im,(26,90),'DARBA DIENAS PA MĒNEŠIEM',13,TEAL,True)
 off={h['date'] for h in HOLIDAYS if h.get('dayOff')};counts=[]
 for m in range(1,13):counts.append(sum(date(y,m,d).weekday()<5 and date(y,m,d).isoformat() not in off for d in range(1,calendar.monthrange(y,m)[1]+1)))
 for i,count in enumerate(counts):
  yy=124+i*29;text(im,(28,yy),MONTHS[i],14,MUTED);rr(im,(139,yy,139+count*12.2,yy+15),5,TEAL if i%2==0 else '#79a198');text(im,(475,yy-2),count,17,TEAL,True,anchor='rt')
 text(im,(28,508),f'{sum(counts)} darba dienas · 5 dienu nedēļa',18,TEAL,True);return im

@lru_cache(512)
def source_digest(src):return hashlib.sha256((ROOT/src.lstrip('/')).read_bytes()).hexdigest()

def source_photo(meta,src=None):
 p=dict(meta);p['src']=src or p.get('large') or p.get('src');p['author']=p.get('author') or p.get('credit','');p['license']=p.get('license') or ('NASA media usage guidelines' if p.get('rightsUrl') else '');p['licenseUrl']=p.get('licenseUrl') or p.get('rightsUrl','');p['sourceUrl']=p.get('sourceUrl') or p.get('source','');return p

def photo_panel(photo,eyebrow,label,foot='',night=False):
 im=panel(True if night else False);paste_fit(im,photo['src'],(0,0,506,550),True,28)
 overlay=Image.new('RGBA',im.size);arr=np.zeros((550*S,506*S,4),dtype=np.uint8);arr[:,:,:3]=[18,27,43] if night else [44,23,31]
 arr[:,:,3]=(np.linspace(0,230 if night else 208,550*S)**1)[:,None].astype(np.uint8);im.alpha_composite(Image.fromarray(arr))
 text(im,(28,32),eyebrow,13,'#fff5dd',True)
 fitted(im,(28,288),label,450,132,40,18,4,'#fffdf7')
 if foot:text(im,(28,433),foot,18,'#f3dfc3',True)
 author=photo.get('author') or photo.get('credit','');lic=photo.get('license','') or photo.get('rights','')
 credit=('Foto: '+author+' · '+lic) if author else lic
 fitted(im,(28,498),credit,450,35,13,9,2,'#e8d8d3',False)
 return im

TOOLS={
 '/':'year','/kalendars/':'year','/menesa-kalendars/':'month','/nedelas-kalendars/':'week','/dienas-kalendars/':'month','/dienas-planotajs/':'week','/izveidot-kalendaru/':'maker','/gimenes-kalendars/':'family','/atvalinajuma-planotajs/':'vacation','/mainu-grafiks/':'shift','/darba-dienu-kalendars/':'work','/darba-laika-kalendars/':'work','/datumu-kalkulators/':'calculator','/dienu-skaititajs/':'countdown','/nedelu-numuri/':'week','/svetku-dienas/':'holidays','/atceres-dienas/':'traditions','/svetki-un-tradicijas/':'traditions','/garas-brivdienas/':'vacation','/varda-dienas/':'names','/kalendars-ar-vardu/':'names','/dzimsanas-dienu-kalendars/':'family','/skolas-brivlaiki/':'school','/studiju-kalendars/':'study','/stundu-saraksts/':'timetable','/saullekts-saulriets/':'sunrise','/meness-lekts-un-riets/':'moon','/meness-kalendars/':'moon','/meness-fazes/':'phases','/pilnmeness/':'moon','/jaunmeness/':'phases','/astronomiskais-kalendars/':'astronomy','/gadalaiki/':'seasons','/sejas-kalendars/':'garden','/horoskops/':'horoscope','/zodiaka-zimes/':'horoscope','/horoskopa-zimes-kalkulators/':'horoscope','/pdf-kalendari/':'print','/tukss-kalendars/':'maker','/visi-riki/':'calculator','/blogs/':'study'}
TOOL_COPY={
 'year':['2027 · 2028 · 2029 · 2030','Gads vienā pārskatā'], 'month':['Mēnesis un tavi plāni','Latvijas svētku dienas'], 'week':['Septiņas dienas vienā plānā','Tavi notikumi un piezīmes'], 'maker':['Tavas krāsas. Tavs stils.','Personīgs kalendārs drukai'], 'family':['Ģimenei kopīgs plāns','Notikumi un ikdienas darbi'], 'vacation':['Ieplāno laiku atpūtai','Salīdzini brīvos datumus'], 'shift':['Tavs maiņu ritms','Dienas, naktis un brīvdienas'], 'work':['Darba dienas un datumi','Pielāgo savu darba nedēļu'], 'calculator':['Saskaiti dienas un laiku','Atrodi vajadzīgo datumu'], 'countdown':['Cik dienu vēl palicis?','Tavam nākamajam notikumam'], 'holidays':['Latvijas svētku dienas','Atrodi savu svarīgo datumu'], 'traditions':['Latvijas svētku stāsti','Datumi un tradīcijas'], 'names':['Vārdi Latvijas kalendārā','Atrodi vārda dienu'], 'school':['Mācību gads un brīvlaiki','Publicētie skolu termiņi'], 'study':['Studijas un ikdienas plāni','Skaidrs ceļš cauri gadam'], 'timetable':['Sakārto savu skolas nedēļu','Stundas un nodarbības'], 'sunrise':['Saule tavā pilsētā','Vietējie saullēkta laiki'], 'moon':['Tuvāk Mēnesim','Fāzes un apgaismojums'], 'phases':['Jaunmēness un pilnmēness','Precīzi fāžu brīži'], 'astronomy':['Debesu notikumi Latvijā','Mēness, Saule un gadalaiki'], 'seasons':['Četri gadalaiki Latvijā','Dabas ritms gada garumā'], 'garden':['Tavs dārzs pa mēnešiem','Sēja, kopšana un raža'], 'horoscope':['Divpadsmit zodiaka zīmes','Iedvesma katrai dienai'], 'print':['PDF un attēli drukāšanai','2027 · 2028 · 2029 · 2030']}

def topic_panel(asset,key,route,label=None):
 dark=key in ['moon','phases','astronomy','horoscope'];im=panel(dark);fg='#f4e9ce' if dark else WINE
 ellipse(im,(42,28,464,450),'#273548' if dark else '#f5ede0');ellipse(im,(90,80,417,410),None,'#465162' if dark else '#e4d5bb',1)
 paste_fit(im,art(asset),(48,42,458,394))
 copy=TOOL_COPY.get(key,['Latvijai. Katrai dienai.','Skaidri plāni vienuviet'])
 fitted(im,(30,400),label or copy[0],446,70,27,20,2,fg)
 text(im,(30,505),copy[1],17,'#adbdc8' if dark else MUTED)
 return im

def period(r):
 p=r['url'];raw=RAW.get(p,{})
 y=int(raw['Year']) if str(raw.get('Year','')).isdigit() else int(re.search(r'/(20\d\d)(?:/|[-])',p).group(1)) if re.search(r'/(20\d\d)(?:/|[-])',p) else 2027
 m=SLUGS.index(p.strip('/').split('/')[-1])+1 if p.strip('/').split('/')[-1] in SLUGS else int(raw['Month']) if str(raw.get('Month','')).isdigit() else None
 return y,m

def montage_panels(panels,rotations=(-8,7),bgs=None):
 im=panel();rr(im,(0,0,506,550),28,'#e9e2d6')
 for i,(p,angle) in enumerate(zip(panels,rotations)):
  a=p.resize((int(340*S),int(370*S)),Image.Resampling.LANCZOS).rotate(angle,Image.Resampling.BICUBIC,expand=True)
  shadow_paste(im,a,(-28+i*115,45+i*78),8,(0,8),50)
 return im

def stats_panel(y,m,memorial=False):
 hs=[h for h in HOLIDAYS if h['date'].startswith(str(y)) and (not m or int(h['date'][5:7])==m) and (not h.get('dayOff') if memorial else h.get('dayOff'))]
 im=panel();text(im,(28,24),MONTHS[m-1] if m else y,36,WINE,True);text(im,(477,35),str(y) if m else '',20,MUTED,True,anchor='rt');text(im,(28,80),'ATCERES UN ATZĪMĒJAMĀS DIENAS' if memorial else 'LATVIJAS SVĒTKU BRĪVDIENAS',11,MUTED,True)
 if not hs:
  return month_card(y,m or 1,holiday=True) if not memorial else im
 else:
  for i,h in enumerate(hs[:6]):
   dt=date.fromisoformat(h['date']);yy=117+i*66;rr(im,(28,yy,478,yy+57),10,'#f5eee5');text(im,(42,yy+14),f'{dt.day:02d}.{dt.month:02d}.',21,WINE,True);text(im,(42,yy+41),DAYS[dt.weekday()],10,MUTED);fitted(im,(132,yy+12),h['title'],328,40,17,13,2,INK)
  if len(hs)>6:text(im,(28,519),f'+ {len(hs)-6} citi datumi pārskatā',14,MUTED)
  elif m and len(hs)<=3:mini_month(im,35,136+len(hs)*66,436,390-len(hs)*66,y,m)
 return im

def name_panel(r,m=None):
 im=panel();text(im,(28,26),'VĀRDA DIENAS',13,WINE,True)
 if r['family']=='name_calendar':
  name=RAW[r['url']]['Latvian title/topic'];records=[n for n in NAMES if n['name']==name];assert records,name
  n=next((n for n in records if n['kind']=='traditional'),records[0]);paste_fit(im,art('/assets/category-vector/names.svg'),(82,60,425,320));fitted(im,(28,319),name,450,90,55,28,2,WINE,True,True);text(im,(30,435),f'{n["day"]}. {MONTHS[n["month"]-1].lower()}',30,INK,True);text(im,(30,504),'Vārda kalendārs Latvijai',16,MUTED)
 else:
  m=m or 1;rr(im,(28,72,478,143),14,'#f3e6e7');text(im,(47,92),MONTHS[m-1],31,WINE,True)
  grouped={}
  for n in NAMES:
   if n['month']==m and n['kind']=='traditional':grouped.setdefault(n['day'],[]).append(n['name'])
  for i,(day,names) in enumerate(list(sorted(grouped.items()))[:6]):
   yy=174+i*53;text(im,(30,yy),f'{day:02d}',25,WINE,True);fitted(im,(99,yy+2),', '.join(names),378,40,20,14,2,INK)
 return im

def week_index_card(y):
 im=panel();text(im,(28,24),y,48,WINE,True);text(im,(478,44),f'{date(y,12,28).isocalendar().week} ISO nedēļas',17,MUTED,True,anchor='rt')
 for i in range(12):
  x=28+(i%3)*154;yy=111+(i//3)*99;rr(im,(x,yy,x+142,yy+87),12,'#f4eee5');text(im,(x+12,yy+13),MONTHS[i],17,WINE,True);a=date(y,i+1,1).isocalendar().week;b=date(y,i+1,calendar.monthrange(y,i+1)[1]).isocalendar().week;text(im,(x+12,yy+46),f'{a:02d} → {b:02d}',24,INK,True)
 text(im,(28,520),'Nedēļas sākas pirmdienā',15,MUTED);return im

def rest_runs(y):
 off={h['date'] for h in HOLIDAYS if h.get('dayOff')};runs=[];d=date(y,1,1);start=None
 while d<=date(y,12,31):
  if d.weekday()>=5 or d.isoformat() in off:
   if start is None:start=d
  else:
   if start is not None and (d-start).days>=3:runs.append((start,d-timedelta(days=1)))
   start=None
  d+=timedelta(days=1)
 if start and (d-start).days>=3:runs.append((start,d-timedelta(days=1)))
 return runs

def rest_card(y,overview=False):
 im=panel();text(im,(28,26),'Garās brīvdienas' if overview else str(y),33,WINE,True)
 if overview:
  text(im,(28,82),'2027 · 2028 · 2029 · 2030',16,MUTED)
  for i,yr in enumerate(range(2027,2031)):
   runs=rest_runs(yr);yy=130+i*88;rr(im,(28,yy,478,yy+73),14,'#f4ede2');text(im,(45,yy+17),yr,32,WINE,True);text(im,(173,yy+14),f'{len(runs)} garās brīvdienas',20,INK,True);text(im,(173,yy+44),f'Līdz {max((b-a).days+1 for a,b in runs)} brīvām dienām pēc kārtas',14,MUTED)
 else:
  text(im,(28,82),'BRĪVIE DATUMI PĒC KĀRTAS',12,MUTED,True)
  for i,(a,b) in enumerate(rest_runs(y)[:5]):
   yy=119+i*73;rr(im,(28,yy,478,yy+62),12,'#eaf0e7');text(im,(44,yy+12),f'{a.day:02d}.{a.month:02d}. → {b.day:02d}.{b.month:02d}.',23,TEAL,True);text(im,(457,yy+19),f'{(b-a).days+1} d.',20,TEAL,True,anchor='rt')
 text(im,(28,520),'5 dienu nedēļa; bez pārceltām darba dienām',11,MUTED);return im

def day_card(planner=False):
 im=panel();text(im,(28,24),'Tava diena' if planner else 'Dienas skats',34,WINE,True)
 if not planner:
  rr(im,(28,94,478,246),20,'#f5e5e5');text(im,(51,111),'04',89,WINE,True);text(im,(228,136),'Pirmdiena',23,WINE,True);text(im,(228,181),'2027. gada janvāris',16,MUTED)
 else:paste_fit(im,art('/assets/category-vector/clock.svg'),(286,7,489,178))
 labels=['Notikumi','Piezīmes','Uzdevumi']
 for i,label in enumerate(labels):
  yy=(173 if planner else 276)+i*(109 if planner else 79);text(im,(30,yy),label,20,WINE,True);line(im,[(30,yy+39),(474,yy+39)],'#d9d0c3');line(im,[(30,yy+54),(440 if i%2 else 465,yy+54)],'#ece4d9')
 return im

def blank_card():
 im=panel();text(im,(28,26),'Vieta tavām piezīmēm',29,WINE,True)
 for c,d in enumerate(DAYS):text(im,(32+c*64+28,102),d,16,MUTED,True,anchor='mt')
 for r in range(6):
  for c in range(7):rr(im,(31+c*64,139+r*58,90+c*64,192+r*58),7,'#faf7f0', '#e5dbce')
 text(im,(29,518),'Tukšs kalendārs taviem plāniem',15,MUTED);return im

def tools_board():
 im=panel();text(im,(28,26),'24 rīki ikdienai',34,WINE,True)
 for i,(key,label) in enumerate([('year','Kalendāri'),('calculator','Aprēķini'),('school','Skola'),('garden','Dārzs')]):
  x=24+i%2*244;yy=115+i//2*201;rr(im,(x,yy,x+232,yy+184),17,'#f4efe7');paste_fit(im,art('/assets/tools-art/'+key+'.svg'),(x+43,yy+7,x+189,yy+134));text(im,(x+116,yy+148),label,20,WINE,True,anchor='mt')
 return im

def zodiac_board():
 im=panel(True);text(im,(28,25),'12 zodiaka zīmes',30,'#f0ddb3',True)
 for i,pr in enumerate(PROFILES.values()):
  x=25+i%3*159;yy=99+i//3*104;paste_fit(im,art('/assets/zodiac/'+pr['slug']+'.svg'),(x+43,yy,x+115,yy+72));text(im,(x+79,yy+76),pr['name'],13,'#e4dccd',True,anchor='mt')
 return im

def semantic_override(r,im,kind,assets,photos):
 p=r['url'];y,m=period(r)
 if r['family']=='week_index':return week_index_card(y),kind
 if r['family']=='long_weekends':return rest_card(y),kind
 if p=='/garas-brivdienas/':return rest_card(2027,True),'holiday'
 if p=='/atceres-dienas/':
  im=panel();text(im,(28,26),'Atceres dienas',33,WINE,True);paste_fit(im,art('/assets/category-vector/memorial.svg'),(109,80,398,314));assets.append('/assets/category-vector/memorial.svg')
  for i,month in enumerate(MONTHS):
   x=28+i%3*154;yy=324+i//3*45;rr(im,(x,yy,x+144,yy+34),8,'#eee9e2');text(im,(x+72,yy+10),month,14,MUTED,True,anchor='mt')
  return im,'holiday'
 if p=='/darba-laika-kalendars/':
  im=topic_panel('/assets/category-vector/clock.svg','work',r,'Darba laika aprēķins');assets.append('/assets/category-vector/clock.svg');rr(im,(46,278,460,379),17,'#e9f0e9');text(im,(253,301),'5 × 8 h = 40 h',39,TEAL,True,anchor='mt');text(im,(253,351),'PIEMĒRS',11,TEAL,True,anchor='mt');return im,'work'
 if p=='/pulkstena-pargriesana/':
  im=topic_panel('/assets/category-vector/shift.svg','work',r,'Vasaras un ziemas laiks');assets.append('/assets/category-vector/shift.svg');return im,'work'
 if p=='/visi-riki/':
  assets.extend('/assets/tools-art/'+k+'.svg' for k in ['year','calculator','school','garden']);return tools_board(),'studio'
 if p=='/dienas-kalendars/':return day_card(),'calendar'
 if p=='/dienas-planotajs/':assets.append('/assets/category-vector/clock.svg');return day_card(True),'calendar'
 if p=='/nedelu-numuri/':
  im=panel();text(im,(28,26),'ISO nedēļu numuri',30,WINE,True)
  for i in range(7):
   d=date(2027,1,1)+timedelta(days=i);iso=d.isocalendar();yy=115+i*56;rr(im,(28,yy,478,yy+46),10,'#f4ebe3');text(im,(43,yy+13),d.strftime('%d.%m.%Y'),18,INK,True);text(im,(462,yy+11),f'{iso.year} · {iso.week:02d}',22,WINE,True,anchor='rt')
  return im,'calendar'
 if p=='/dzimsanas-dienu-kalendars/':
  assets.append('/assets/category-vector/gift.svg');return topic_panel('/assets/category-vector/gift.svg','family',r,'Dzimšanas dienu plāns'),'names'
 if p=='/tukss-kalendars/':return blank_card(),'calendar'
 if p=='/kalendars-ar-vardu/':
  im=panel();text(im,(28,27),'Kalendārs ar vārdu',31,WINE,True)
  for i,name in enumerate(['Jānis','Anna','Māra']):
   n=next(n for n in NAMES if n['name']==name and n['kind']=='traditional');yy=122+i*122;rr(im,(28,yy,478,yy+108),16,'#f5ebe5');text(im,(46,yy+20),name,33,WINE,True,True);text(im,(48,yy+69),f'{n["day"]}. {MONTHS[n["month"]-1].lower()}',17,MUTED);paste_fit(im,art('/assets/category-vector/names.svg'),(337,yy+7,460,yy+102))
  return im,'names'
 if p=='/zodiaka-zimes/':
  assets.extend('/assets/zodiac/'+pr['slug']+'.svg' for pr in PROFILES.values());return zodiac_board(),'zodiac'
 if p=='/horoskops/':
  im=topic_panel('/assets/zodiac/atlas.svg','horoscope',r,'Tavas zīmes dienas lasījums');assets.append('/assets/zodiac/atlas.svg');rr(im,(28,405,478,479),14,'#f4e9d3');text(im,(51,424),'12 zīmes · Jauna dienas tēma',23,WINE,True);return im,'zodiac'
 if p=='/horoskopa-zimes-kalkulators/':
  im=topic_panel('/assets/zodiac/atlas.svg','horoscope',r,'Iepazīsti savu zīmi');assets.append('/assets/zodiac/atlas.svg');rr(im,(28,298,478,366),14,'#f4e9d3');text(im,(49,319),'Dzimšanas datums',20,WINE,True);text(im,(454,316),'→',26,WINE,True,anchor='rt');return im,'zodiac'
 if p=='/meness-lekts-un-riets/':
  photo=source_photo(CITIES['riga']['photo']);photos.append(photo);im=photo_panel(photo,'82 LATVIJAS PILSĒTAS','Mēness lēkts un riets','Rīga · Europe/Riga',True);paste_fit(im,moon_img(140,.72),(310,79,465,234));return im,'moon-city'
 if p=='/meness-kalendars/':
  im=panel(True);text(im,(28,25),'Mēness ritms',34,'#eee0c2',True)
  for i,phase in enumerate([.25,.5,.75]):paste_fit(im,moon_img(140,phase),(10+i*157,150,150+i*157,290))
  for i,year in enumerate(range(2027,2031)):rr(im,(30+i*116,376,136+i*116,427),12,'#293a4b');text(im,(83+i*116,392),year,23,'#f2dfb5',True,anchor='mt')
  text(im,(29,490),'48 mēneši · Katras dienas apgaismojums',16,'#c4c7d1');return im,'moon'
 for slug,artfile,label in [('meness-aptumsums','lunar-total','Mēness aptumsumi'),('saules-aptumsums','solar-total','Saules aptumsumi'),('perseidas','perseids','Perseīdu meteoru plūsma')]:
  if p==f'/{slug}/':
   a='/assets/astronomy-events/'+artfile+'.svg';assets.append(a);return topic_panel(a,'astronomy',r,label),'moon'
 return im,kind

def render_panel(r):
 p,f=r['url'],r['family'];y,m=period(r);assets=[];photos=[];key=TOOLS.get(p);kind='studio';kicker='PLĀNI LATVIJAI';subtitle='Laiks tam, kas tev svarīgs.';badge=None
 if f in ['calendar_month','print_month']:
  kind='calendar' if f=='calendar_month' else 'print';im=month_card(y,m);subtitle=f'{calendar.monthrange(y,m)[1]} dienas · Latvijas svētki';kicker='MĒNEŠA KALENDĀRS' if kind=='calendar' else 'KALENDĀRS DRUKĀŠANAI';badge=str(y)
  if f=='print_month':im=montage_panels([im,month_card(y,m)],(-9,6));rr(im,(239,470,478,524),12,WINE);text(im,(358,487),'15 dizaini · A3',21,'#fffdf7',True,anchor='mt')
 elif f in ['year','print_index','month_index','week_index']:
  kind='calendar';im=year_card(y);subtitle=f'{366 if calendar.isleap(y) else 365} dienas · 12 mēneši';badge=str(y);kicker='GADA KALENDĀRS'
  if f=='print_index':im=montage_panels([year_card(y),year_card(y)],(-9,6));kicker='GADA KALENDĀRS DRUKAI';subtitle='15 dizaini · PDF un attēli'
  elif f=='month_index':im=montage_panels([month_card(y,1),month_card(y,7)],(-7,6));kicker='VISI 12 MĒNEŠI'
  elif f=='week_index':im=week_card(y,1);kicker='ISO NEDĒĻU PĀRSKATS';subtitle=f'{date(y,12,28).isocalendar().week} nedēļas · No pirmdienas'
 elif f=='iso_week':
  kind='calendar';w=int(p.strip('/').split('/')[-1]);im=week_card(y,w);start=date.fromisocalendar(y,w,1);subtitle=f'{start.day:02d}.{start.month:02d}.{start.year} — {(start+timedelta(days=6)).day:02d}.{(start+timedelta(days=6)).month:02d}.{(start+timedelta(days=6)).year}';kicker='NEDĒĻAS KALENDĀRS';badge=f'ISO {w:02d}'
 elif f in ['work_month','work_year']:
  kind='work';im=month_card(y,m,True) if m else work_year_card(y);kicker='DARBA DIENU PLĀNS';subtitle='Latvijas svētki un darba nedēļa';badge=str(y)
 elif f in ['holiday_month','holiday_year','memorial_year','long_weekends'] or p.startswith('/atceres-dienas/'):
  kind='holiday';im=stats_panel(y,m,f=='memorial_year' or p.startswith('/atceres-dienas/'));kicker='LATVIJAS SVARĪGIE DATUMI';subtitle='Datumi, kuriem pievērst uzmanību';badge=str(y) if f!='latvia_special' else None
 elif f in ['lunar_month','lunar_year']:
  kind='moon';im=lunar_card(y,m);kicker='MĒNESS KALENDĀRS';subtitle='Katras dienas apgaismojums Latvijas laikā';badge=str(y);assets.append('/assets/astronomy/moon-apollo17.webp')
 elif f in ['sun_city','moon_city']:
  kind='moon-city' if f=='moon_city' else 'city';city=CITIES[p.strip('/').split('/')[-1]];photo=source_photo(city['photo']);photos.append(photo);im=photo_panel(photo,'LATVIJAS PILSĒTA',city['name'],f'{city["lat"]:.3f}° N · {city["lon"]:.3f}° E',f=='moon_city');kicker='MĒNESS LĒKTS UN RIETS' if f=='moon_city' else 'SAULLĒKTS UN SAULRIETS';subtitle=f'{city["name"]} · Europe/Riga'
  if f=='moon_city':paste_fit(im,moon_img(105,.5),(345,90,458,203))
  else:
   pts=[(45+i*13,245-95*math.sin(i/32*math.pi)) for i in range(33)];line(im,pts,'#f9dc9b',2);ellipse(im,(245,135,268,158),'#ffe1a0')
 elif f in ['occasion','latvia_cultural']:
  kind='occasion';cover={**PHOTO_META[COVER_FOR[p]],**TRADITIONS[COVER_FOR[p]]};photo=source_photo(cover,max(cover['files'],key=lambda x:x['width'])['src']);photos.append(photo);im=photo_panel(photo,'LATVIJAS DIENAS',r['title']);kicker='SVĒTKI UN TRADĪCIJAS';subtitle='Svētku stāsts un svarīgākie datumi'
 elif f=='blog_article':
  kind='article';post=BLOGS[p];photo=source_photo(post['photo']);photos.append(photo);im=photo_panel(photo,post['category'].upper(),'Silvis Balodis',f'{post["readingMinutes"]} min lasīšanai');kicker='KALENDĀRS365 BLOGS';subtitle=post['category']+' · Idejas ikdienai';badge='RAKSTS'
 elif f=='blog_index':
  kind='article';photo=source_photo(read('_data/blog-photos.json')['photos'][0]);photos.append(photo);im=photo_panel(photo,'KALENDĀRS365','Idejas, kas palīdz plānot','Svētki · Skola · Dārzs');kicker='LATVIJAS STĀSTI';subtitle='Raksti pārdomātai ikdienai'
 elif f=='garden' and p.strip('/').split('/')[-1] in CROPS:
  kind='garden';slug=p.strip('/').split('/')[-1];crop=CROPS[slug];photo=source_photo(CROP_PHOTOS[slug]);photos.append(photo);im=photo_panel(photo,'LATVIJAS DĀRZAM',crop['name'],'Sēja · Kopšana · Raža');kicker='SĒJAS UN STĀDĪŠANAS CEĻVEDIS';subtitle='Ievērojot augsni, šķirni un laikapstākļus'
 elif f=='garden_month':
  kind='garden';im=panel(color='#eaf0df');season=['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'][m-1];a=f'/assets/season-scenes/{season}.svg';assets.append(a);paste_fit(im,art(a),(0,30,506,403));text(im,(29,425),MONTHS[m-1],35,'#385744',True);text(im,(29,489),'Dārza darbi mēneša gaitā',18,'#385744');kicker='DĀRZS PA MĒNEŠIEM';subtitle='Sēja, stādīšana un sezonas darbi'
 elif f=='name_calendar' or f=='name_day_month':
  kind='names';im=name_panel(r,m);kicker='VĀRDI LATVIJAS KALENDĀRĀ';subtitle='Vārda diena un personīgs kalendārs';assets.append('/assets/category-vector/names.svg')
 elif f=='horoscope':
  kind='zodiac';profile=PROFILES[p.strip('/').split('/')[-1]];a=f'/assets/zodiac/{profile["slug"]}.svg';assets.append(a);im=topic_panel(a,'horoscope',r,profile['name']);kicker='ZODIAKA ZĪMES';subtitle=profile['element']['label']+' · '+profile['modality']['label']+' zīme'
 elif f in ['school_academic','school_year_calendar']:
  kind='school';end=y+1 if f=='school_academic' else y;im=topic_panel('/assets/tools-art/school.svg','school',r,f'{y}/{str(end)[-2:]} mācību gads' if f=='school_academic' else f'{y}. gada brīvlaiki');assets.append('/assets/tools-art/school.svg');kicker='SKOLAS KALENDĀRS';subtitle='Mācību gads un publicētie brīvlaiki';badge=str(y)
 elif p=='/':
  kind='home';im=panel(color='#e8ded0');photo=source_photo(CITIES['riga']['photo']);photos.append(photo);paste_fit(im,photo['src'],(0,0,506,320),True,28);a=year_card(2027).resize((280*S,305*S)).rotate(-7,Image.Resampling.BICUBIC,expand=True);shadow_paste(im,a,(147,205),10,(0,8),60);rr(im,(22,377,202,492),16,'#fffaf0');text(im,(38,397),'2027',35,WINE,True);text(im,(38,446),'2028 · 2029 · 2030',12,MUTED,True);text(im,(23,522),'Rīga · Foto: '+photo['author'],10,MUTED);kicker='LATVIJAI. KATRAI DIENAI.';subtitle='Kalendāri, svētki un laiks svarīgajam.'
 elif p=='/gadalaiki/':
  kind='seasons';im=panel();
  for i,sea in enumerate(['spring','summer','autumn','winter']):
   a=f'/assets/season-scenes/{sea}.svg';assets.append(a);x=12+(i%2)*245;yy=35+(i//2)*243;paste_fit(im,art(a),(x,yy,x+239,yy+206));text(im,(x+120,yy+209),['Pavasaris','Vasara','Rudens','Ziema'][i],18,WINE,True,anchor='mt')
  kicker='ČETRI GADALAIKI';subtitle='Latvijas dabas ritms gada garumā'
 elif p in {'/privatuma-politika/','/sikdatnu-politika/','/pieklustamiba/','/kontakti/','/par-projektu/','/biezak-uzdotie-jautajumi/'}:
  trust={'/privatuma-politika/':('privacy','Tavi dati','Personīgie plāni un ārējie pakalpojumi'),'/sikdatnu-politika/':('cookies','Tava pārlūka krātuve','Saprotami par saglabāšanu un izvēlēm'),'/pieklustamiba/':('accessibility','Pieejams ceļš uz datumu','Tastatūra, alternatīvi skati un palīdzība'),'/kontakti/':('contact','Skaidrs jautājums','Sazinies ar vietnes uzturētāju'),'/par-projektu/':('about','Kalendārs Latvijas ikdienai','Silvis Balodis un Kalendārs365'),'/biezak-uzdotie-jautajumi/':('faq','Atrodi savu atbildi','Kalendāri, druka, dati un vietnes rīki')}
  name,label,subtitle=trust[p];asset=f'/assets/trust/{name}.svg';assets.append(asset);kind='trust';im=panel(color='#fbf4e9');paste_fit(im,art(asset),(60,25,446,344));fitted(im,(32,349),label,444,111,35,25,2,WINE,True);rr(im,(32,485,474,541),12,'#f0e1e6');text(im,(253,505),'SKAIDRI PAR KALENDĀRU365',11,WINE,True,anchor='mt');kicker='SAPROTAMI PAR VIETNI'
 elif f in ['not_found','temporary_error']:
  kind='recovery';im=panel(color='#eee8dc');paper=Image.new('RGBA',(394*S,326*S));rr(paper,(0,0,394,326),20,CREAM,'#d5c6ba');text(paper,(27,28),'KALENDĀRS365',13,WINE,True);line(paper,[(27,66),(367,66)],'#e5dace');text(paper,(197,101),'404' if f=='not_found' else '500',115,WINE,True,anchor='mt');text(paper,(197,250),'Atrodi savu ceļu' if f=='not_found' else 'Atgriezies pie plāniem',22,INK,True,anchor='mt');paper=paper.rotate(7,Image.Resampling.BICUBIC,expand=True);shadow_paste(im,paper,(27,86),10,(0,9),54);paste_fit(im,art('/assets/category-vector/location.svg'),(335,335,490,504));assets.append('/assets/category-vector/location.svg');kicker='ATRODI SAVU CEĻU';subtitle='Kalendāri un plānošanas rīki tepat blakus'
 else:
  key=key or ('astronomy' if any(t in p for t in ['aptumsums','perseidas','saulgriezi','ekvinokcija','meness']) else 'calculator' if any(t in p for t in ['pulkstena','skait','kalkulator']) else 'study')
  asset='/assets/tools-art/'+key+'.svg';
  if not (ROOT/asset.lstrip('/')).exists():asset='/assets/category-vector/tools.svg'
  assets.append(asset);label=None
  if key=='study' and p not in TOOLS:label={'/kontakti/':'Sazinies ar mums','/par-projektu/':'Silvis Balodis','/avoti-un-metodika/':'Pārbaudāmi avoti','/pilsetas-un-fotografijas/':'82 Latvijas pilsētas','/privatuma-politika/':'Tavi plāni paliek pie tevis','/sikdatnu-politika/':'Tavas izvēles','/pieklustamiba/':'Ērti ikvienam','/labojumi/':'Palīdzi uzlabot','/lietošanas-noteikumi/':'Skaidri noteikumi','/meklesana/':'Atrodi vajadzīgo'}.get(p,r['title'])
  if p in ['/privatuma-politika/','/sikdatnu-politika/','/lietošanas-noteikumi/']:asset='/assets/category-vector/privacy.svg';assets.append(asset)
  im=topic_panel(asset,key,r,label);kicker={'moon':'MĒNESS UN TĀ RITMS','work':'DATUMI UN DARBA LAIKS','garden':'LATVIJAS DĀRZAM','school':'SKOLAS IKDIENAI','print':'TAVS PLĀNS UZ PAPĪRA','horoscope':'ZODIAKA SIMBOLIKA','sunrise':'SAULE LATVIJĀ'}.get(key,'NODERĪGI IKDIENAI');subtitle=TOOL_COPY.get(key,['','Kalendārs365 Latvijai'])[1]
  # Distinct subject label belongs to the actual page, including closely related tools.
  if p in ['/jaunmeness/','/pilnmeness/']:
   im=panel(True);phase=0 if p=='/jaunmeness/' else .5;paste_fit(im,moon_img(320,phase),(93,80,413,400));text(im,(253,458),'Jaunmēness' if phase==0 else 'Pilnmēness',32,'#f4e7cf',True,anchor='mt');assets.append('/assets/astronomy/moon-apollo17.webp')
 im,kind=semantic_override(r,im,kind,assets,photos)
 if kind in ['moon','moon-city']:
  ap=next(p for p in ART_PHOTOS if p['id']=='moon-apollo17');photos.append(source_photo(ap));assets.append('/assets/astronomy/moon-apollo17.webp')
 return im,{'kind':kind,'kicker':kicker,'subtitle':subtitle,'badge':badge,'assets':sorted(set(assets)),'photos':photos,'year':y,'month':m}

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--only',nargs='*');args=parser.parse_args();selected=[r for r in ROUTES if not args.only or r['url'] in args.only];results=[];titles=[];receipt=(ROOT/'../reports/social-cards-2026-11-11/render-receipts.jsonl').resolve();receipt.write_text('')
 for i,r in enumerate(selected):
  stage,spec=render_panel(r);edge=Image.new('L',stage.size);ImageDraw.Draw(edge).rounded_rectangle((0,0,stage.width-1,stage.height-1),28*S,fill=255);stage.putalpha(ImageChops_multiply(stage.getchannel('A'),edge));theme='moon' if spec['kind'] in ['moon','moon-city','zodiac'] else 'garden' if spec['kind']=='garden' else 'sun' if spec['kind'] in ['city','occasion','home'] else 'paper';dark=theme=='moon';fg='#fff9ed' if dark else WINE;muted='#b6becb' if dark else MUTED
  im=background(theme).copy();flag(im,61,59,28);text(im,(103,49),'Kalendārs365',37,fg,True);line(im,[(61,111),(575,111)],'#424557' if dark else '#d7c9be');text(im,(62,139),spec['kicker'],12,'#e4be78' if dark else '#915267',True)
  title=r['title'];title='Latvijas kalendārs.\nTavam laikam.' if r['url']=='/' else title
  title=title.replace(' — ',' · ').replace(' - ',' · ')
  bounds=fitted(im,(60,184),title,514,260,61 if r['url']=='/' else 55,32,4,fg)
  desc=fitted(im,(62,466),spec['subtitle'],512,46,20,16,2,muted,False)
  rr(im,(62,552,283,590),19,'#394052' if dark else '#f4e5e5');text(im,(80,562),'kalendars365.lv',18,fg,True);ellipse(im,(536,549,576,589),WINE if not dark else '#d6b579');line(im,[(549,568),(563,568),(558,563)],'#fffdf7' if not dark else '#152031',2);line(im,[(563,568),(558,573)],'#fffdf7' if not dark else '#152031',2)
  shadow_paste(im,stage,(635,40),13,(0,10),65 if dark else 42)
  final=im.convert('RGB').resize((W,H),Image.Resampling.LANCZOS)
  # Pixel signatures bind every cover and its subject panel to its actual route.
  pixelsha=hashlib.sha256(final.tobytes()).hexdigest();panelsha=hashlib.sha256(stage.tobytes()).hexdigest();file=OUT/(hashlib.sha1(r['url'].encode()).hexdigest()[:16]+'-'+pixelsha[:12]+'.jpg')
  credits=[]
  spec['photos']=list({p['src']:p for p in spec['photos']}.values())
  for p in spec['photos']:credits.append({k:p[k] for k in ['src','author','credit','license','licenseUrl','sourceUrl','sourceSha256','rights','rightsUrl'] if k in p})
  exif=Image.Exif();exif[315]='Kalendars365';exif[270]=(unicodedata.normalize('NFKD',r['title']).encode('ascii','ignore').decode()+' | '+r['url']+' | '+json.dumps(credits,ensure_ascii=True))[:5000];exif[40091]=(r['title']+'\0').encode('utf-16le');exif[40093]=('Kalendārs365\0').encode('utf-16le');exif[33432]='Kalendārs365 original layout; photograph attribution in ImageDescription and /pilsetas-un-fotografijas/#kopigosanas-vaki'
  final.save(file,'JPEG',quality=92,optimize=True,progressive=True,subsampling=0,exif=exif)
  with Image.open(file) as check:check.load();assert check.size==(W,H) and check.format=='JPEG'
  for field in [bounds,desc]:
   for b in field['bounds']:assert b[0]>=55 and b[2]<=585 and b[3]<=525,(r['url'],b)
  record={'url':r['url'],'title':r['title'],'family':r['family'],'src':'/'+str(file.relative_to(ROOT)),'width':W,'height':H,'type':'image/jpeg','alt':r['title']+' | Kalendārs365 Latvijai','design':spec['kind'],'kicker':spec['kicker'],'subtitle':spec['subtitle'],'year':spec['year'],'month':spec['month'],'titleLayout':bounds,'subtitleLayout':desc,'sources':credits,'artwork':spec['assets'],'inputs':{src:source_digest(src) for src in sorted(set(spec['assets']+[p['src'] for p in spec['photos']]+['/assets/fonts/DM-Sans-Regular.ttf','/assets/fonts/DM-Sans-Bold.ttf','/assets/calendar-data.json']))},'panelSha256':panelsha,'pixelSha256':pixelsha,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size}
  facts={}
  if r['family']=='iso_week':
   wy=int(r['url'].strip('/').split('/')[-1]);start=date.fromisocalendar(spec['year'],wy,1);facts={'isoYear':spec['year'],'week':wy,'dates':[(start+timedelta(days=n)).isoformat() for n in range(7)]}
  elif spec['month'] and r['family'] in ['calendar_month','print_month','work_month','lunar_month']:
   facts={'year':spec['year'],'month':spec['month'],'days':calendar.monthrange(spec['year'],spec['month'])[1],'firstWeekday':date(spec['year'],spec['month'],1).weekday()}
   if r['family']=='lunar_month':facts['noonSamples']={k:v for k,v in MOONS.items() if k.startswith(f"{spec['year']}-{spec['month']:02d}-")}
  record['semanticFacts']=facts
  results.append(record)
  with receipt.open('a') as log:log.write(json.dumps(record,ensure_ascii=False)+'\n')
  if (i+1)%100==0:print(f'{i+1}/{len(selected)} covers rendered',flush=True)
 if not args.only:
  assert len(results)==len(ROUTES)
  assert len({r['src'] for r in results})==len(ROUTES) and len({r['pixelSha256'] for r in results})==len(ROUTES)
  assert len({r['panelSha256'] for r in results})==len(ROUTES),'Repeated subject panel; give the page its own subject composition'
  catalog={'version':2,'dimensions':[W,H],'method':'Original code-native editorial composition using source-bound Latvian typography, verified calendar data and accepted licensed artworks. No inference API used.','pages':{r['url']:r for r in results}}
  catalog['rendererSha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest();catalog['prepareSha256']=hashlib.sha256((ROOT/'tooling/social-cards/prepare.mjs').read_bytes()).hexdigest()
  credit_rows={}
  for row in results:
   for photo in row['sources']:
    key=photo.get('sourceUrl') or photo['src'];entry=credit_rows.setdefault(key,{**photo,'covers':[]});entry['covers'].append({'url':row['url'],'image':row['src'],'title':row['title']})
  (ROOT/'assets/social-cards/credits.json').write_text(json.dumps({'version':2,'photos':list(credit_rows.values())},ensure_ascii=False,indent=2)+'\n')
  (ROOT/'_data/social-cover-credits.json').write_text(json.dumps({'photos':list(credit_rows.values())},ensure_ascii=False,indent=2)+'\n')
  (ROOT/'_data/social-images.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
  (ROOT/'docs/OG_RESULTS.json').write_text(json.dumps({'version':2,'routeCards':len(results),'dimensions':[W,H],'distinctPixelImages':len({r['pixelSha256'] for r in results}),'distinctSubjectPanels':len({r['panelSha256'] for r in results}),'totalBytes':sum(r['bytes'] for r in results),'checks':[f'{len(results)} unique page URLs',f'{len(results)} unique pixel images','complete Latvian title bounds','actual JPEG decode and dimensions','source-bound photography credits','calendar dates and local lunar noon'],'files':results},ensure_ascii=False,indent=2)+'\n')
 else:(ROOT/'../reports/social-cards-2026-11-11/preview.json').resolve().write_text(json.dumps(results,ensure_ascii=False,indent=2))
 print(json.dumps({'rendered':len(results),'bytes':sum(r['bytes'] for r in results),'uniquePanels':len({r['panelSha256'] for r in results})}))
if __name__=='__main__':main()
