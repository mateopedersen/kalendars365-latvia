"""Original lunar print collection. Vector type, NASA LROC surface, 600 dpi files.

Run lunar_print_data.mjs first. Inputs and cache live outside the published site.
Each PDF and its image are rendered from the exact same single-page PDF.
"""
import argparse, calendar, datetime as dt, hashlib, io, json, math, os, subprocess
from pathlib import Path
import numpy as np
from PIL import Image
from reportlab import rl_config
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
rl_config.useA85=0
MM=72/25.4
MONTHS=['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris']
SLUGS=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris']
WEEKDAYS=['P.','O.','T.','C.','Pk.','S.','Sv.']
PHASES={'New Moon':'Jaunmēness','First Quarter':'1. ceturksnis','Full Moon':'Pilnmēness','Last Quarter':'Pēd. ceturksnis'}
MONTH_DESIGNS=[('nakts','Nakts atlants','A4','portrait'),('gaisma','Gaišais kalendārs','A4','portrait'),('piezimes','Novērojumu piezīmes','A4','landscape'),('nedelas','Nedēļu ritms','A4','landscape')]
YEAR_DESIGNS=[('atlants','Gada atlants','A3','landscape'),('menesi','Divpadsmit mēneši','A3','portrait'),('nakts','Nakts panorāma','A3','landscape'),('cikli','Mēness ciklu karte','A3','portrait')]

def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()

class Sheet:
    def __init__(self,path,w,h,dark=False):
        self.w,self.h,self.dark=w,h,dark
        self.c=canvas.Canvas(str(path),pagesize=(w*MM,h*MM),pageCompression=1)
        self.c.setTitle('Mēness kalendārs | Kalendārs365')
        self.c.setAuthor('Kalendārs365')
        self.c.setCreator('Kalendārs365 lunar print studio')
        self.ink='#f9f5ef' if dark else '#252733'
        self.muted='#b6bdcc' if dark else '#626575'
        self.accent='#efb4b3' if dark else '#8c233e'
        self.line_color='#344052' if dark else '#dedbd7'
        self.bg='#121d2d' if dark else '#ffffff'
        self.rect(0,0,w,h,self.bg)
        self.bounds=[]
    def rect(self,x,y,w,h,color,stroke=None,r=0):
        c=self.c;c.setFillColor(HexColor(color)); c.setStrokeColor(HexColor(stroke or color));c.setLineWidth(.25*MM)
        if r:c.roundRect(x*MM,(self.h-y-h)*MM,w*MM,h*MM,r*MM,stroke=bool(stroke),fill=1)
        else:c.rect(x*MM,(self.h-y-h)*MM,w*MM,h*MM,stroke=bool(stroke),fill=1)
    def line(self,x1,y1,x2,y2,color=None,width=.2):
        self.c.setStrokeColor(HexColor(color or self.line_color));self.c.setLineWidth(width*MM)
        self.c.line(x1*MM,(self.h-y1)*MM,x2*MM,(self.h-y2)*MM)
    def text(self,x,y,s,size=9,bold=False,color=None,align='left',limit=None):
        font='DM-Bold' if bold else 'DM'
        width=pdfmetrics.stringWidth(str(s),font,size)/MM
        if limit and width>limit+0.01: raise ValueError(f'Text overflow: {s!r} {width:.2f}>{limit}')
        left=x if align=='left' else x-width if align=='right' else x-width/2
        if left<5-1e-4 or left+width>self.w-5+1e-4 or y<4 or y>self.h-4:raise ValueError(f'Page bounds: {s!r}, {left} {y}')
        self.bounds.append([round(left,2),round(y-size/MM,2),round(width,2),round(size/MM,2),str(s)])
        self.c.setFillColor(HexColor(color or self.ink));self.c.setFont(font,size)
        self.c.drawString(left*MM,(self.h-y)*MM,str(s))
    def moon(self,date,x,y,d):
        size=256 if d<=10.8 else 640
        # Every embedded Moon is at least 600 source pixels per printed inch.
        assert size/(d/25.4)>=600
        self.c.saveState()
        clip=self.c.beginPath();clip.circle((x+d/2)*MM,(self.h-y-d/2)*MM,d*MM*(.5-1/size))
        self.c.clipPath(clip,stroke=0,fill=0)
        self.c.drawImage(str(CACHE/f'{date}-{size}.jpg'),x*MM,(self.h-y-d)*MM,d*MM,d*MM)
        self.c.restoreState()
    def finish(self):self.c.showPage();self.c.save()

def footer(s,compact=False):
    s.line(14,s.h-23,s.w-14,s.h-23)
    first=pdfmetrics.stringWidth('Kalendārs','DM-Bold',11)/MM
    last=pdfmetrics.stringWidth('365','DM-Bold',11)/MM
    left=(s.w-first-last)/2
    s.text(left,s.h-17,'Kalendārs',11,True)
    s.text(left+first,s.h-17,'365',11,True,color=s.accent)
    s.text(s.w/2,s.h-12,'kalendars365.lv',7,align='center',color=s.muted)
    s.text(s.w/2,s.h-6,'Virsma: NASA SVS / LRO / LROC · Aprēķini: Astronomy Engine · Fāžu brīži: USNO',5.2,align='center',color=s.muted)

def header(s,year,month=None,subtitle=None):
    s.text(14,18,'MĒNESS KALENDĀRS',8,True,color=s.accent)
    title=MONTHS[month-1] if month else str(year)
    s.text(14,34,title,30,True)
    if month:s.text(s.w-14,33,str(year),23,True,align='right')
    s.text(14,43,subtitle or 'Latvijas laiks · plkst. 12.00 · Debess ziemeļi augšā',8,color=s.muted)
    s.line(14,48,s.w-14,48,color=s.accent,width=.5)

def events(year,month=None):
    key=f'{year}-{month:02d}' if month else str(year)
    return [p for p in PHASE_DATA if p['date'].startswith(key)]

def event_strip(s,year,month,x,y,w):
    data=events(year,month);n=len(data);cw=w/n
    for i,e in enumerate(data):
        xx=x+cw*i
        if i:s.line(xx-2,y-2,xx-2,y+12)
        s.text(xx,y,PHASES[e['phaseKey']],7,True,color=s.accent,limit=cw-3)
        d=int(e['date'][-2:])
        s.text(xx,y+6,f'{d:02d}.{month:02d}. · {e["time"]}',7,color=s.muted,limit=cw-3)

def percent(date):return f'{DAYS[date]["fraction"]*100:.1f}'.replace('.',',')+' %'

def month_grid(s,year,month,x,y,w,h,variant='light',mini=False):
    weeks=calendar.monthcalendar(year,month);cw=w/7
    heading=6 if mini else 9
    rh=(h-heading)/len(weeks)
    for i,label in enumerate(WEEKDAYS):
        s.text(x+cw*(i+.5),y+(3 if mini else 4),label,5.8 if mini else 8,True,color=s.accent if i>=5 else s.muted,align='center')
    for row,week in enumerate(weeks):
      for col,day in enumerate(week):
        if not day:continue
        xx=x+col*cw;yy=y+heading+row*rh;date=f'{year}-{month:02d}-{day:02d}'
        if mini:
            d=min(9.5,cw-3.5,rh-1.7)
            s.text(xx+.5,yy+2.3,str(day),5,True,color=s.accent if col>=5 else s.ink)
            s.moon(date,xx+cw-d-.3,yy+1.1,d)
        else:
            gap=1.0
            if variant=='dark':s.rect(xx+.4,yy+.4,cw-.8,rh-.8,'#1a2739',r=1.5)
            elif variant=='light':s.rect(xx+.4,yy+.4,cw-.8,rh-.8,'#faf8f5',r=1.5)
            else:s.line(xx,yy,xx+cw-1,yy)
            d=min(25,cw-4,rh-11.5)
            s.text(xx+2,yy+4,str(day),8,True,color=s.accent if col>=5 else s.ink)
            s.moon(date,xx+(cw-d)/2,yy+5,d)
            s.text(xx+cw/2,yy+rh-1.7,percent(date),6.2,align='center',color=s.muted)

def monthly(path,year,month,design):
    landscape=design>=2;w,h=(297,210) if landscape else (210,297)
    s=Sheet(path,w,h,design==0);header(s,year,month)
    if design<2:
        # Two distinct page rhythms: dark atlas has a generous sky field;
        # the light sheet gives the calendar a fine ruled editorial frame.
        if design==1:
            s.line(14,54,196,54);s.text(14,61,'Diena · Mēness izskats · apgaismotā diska daļa',7,color=s.muted)
        month_grid(s,year,month,14,66 if design==1 else 57,182,177 if design==1 else 185,'dark' if design==0 else 'light')
        s.line(14,252,196,252);event_strip(s,year,month,14,261,182)
    elif design==2:
        month_grid(s,year,month,14,54,188,126,'ruled')
        s.line(211,54,211,180)
        s.text(219,59,'GALVENĀS FĀZES',7,True,color=s.accent)
        for i,e in enumerate(events(year,month)):
            yy=69+i*12
            s.text(219,yy,PHASES[e['phaseKey']],8,True,limit=62)
            s.text(219,yy+4.5,f'{int(e["date"][-2:])}. {month:02d}. · {e["time"]}',7,color=s.muted)
        notes_y=78+len(events(year,month))*12
        s.text(219,notes_y,'Novērojumu piezīmes',8,True,limit=62)
        for yy in np.arange(notes_y+8,180,7):s.line(219,float(yy),283,float(yy))
    else:
        weeks=calendar.monthcalendar(year,month);rh=109/len(weeks);cw=247/7
        s.text(14,57,'NED.',6,True,color=s.muted)
        for col,label in enumerate(WEEKDAYS):s.text(36+cw*(col+.5),57,label,7,True,color=s.accent if col>=5 else s.muted,align='center')
        for row,week in enumerate(weeks):
            yy=62+row*rh;s.rect(14,yy,269,rh-1,'#f7f4ef',r=1.5)
            nonzero=next(d for d in week if d);weekno=dt.date(year,month,nonzero).isocalendar().week
            s.text(23,yy+rh/2+1,str(weekno),9,True,align='center',color=s.accent)
            for col,day in enumerate(week):
                if not day:continue
                xx=36+col*cw;date=f'{year}-{month:02d}-{day:02d}';d=min(17,rh-5)
                s.text(xx+3,yy+5,str(day),9,True,color=s.accent if col>=5 else s.ink)
                s.moon(date,xx+cw-d-2,yy+(rh-d)/2-.5,d)
                s.text(xx+3,yy+rh-4,percent(date),5.8,color=s.muted)
        event_strip(s,year,month,14,178,269)
    footer(s);s.finish();return s

def annual(path,year,design):
    landscape=design in (0,2);w,h=(420,297) if landscape else (297,420)
    s=Sheet(path,w,h,design==2);header(s,year,subtitle='Latvijas laiks · katru dienu plkst. 12.00 · Debess ziemeļi augšā')
    if design==0:
        # A full-year atlas, twelve rows by 31 days. Dates share one clear axis.
        x=49;y=57;cw=(w-x-14)/31;rh=17.6
        for day in range(1,32):s.text(x+cw*(day-.5),y,str(day),6,True,align='center',color=s.muted)
        for month in range(1,13):
            yy=y+4+(month-1)*rh
            if month%2:s.rect(14,yy,392,rh,'#f7f4ef')
            s.text(17,yy+rh/2+1,MONTHS[month-1],8,True,limit=31)
            for day in range(1,calendar.monthrange(year,month)[1]+1):
                date=f'{year}-{month:02d}-{day:02d}';xx=x+cw*(day-1);d=8.8
                s.moon(date,xx+(cw-d)/2,yy+1.5,d)
                s.text(xx+cw/2,yy+14,f'{DAYS[date]["fraction"]*100:.0f}%',4.6,color=s.muted,align='center')
    elif design in (1,2):
        cols,rows=(3,4) if design==1 else (4,3)
        gap=5;left=14;top=55;cw=(w-28-gap*(cols-1))/cols;ch=(h-top-28-gap*(rows-1))/rows
        for month in range(1,13):
            col=(month-1)%cols;row=(month-1)//cols;xx=left+col*(cw+gap);yy=top+row*(ch+gap)
            if design==2:s.rect(xx,yy,cw,ch,'#1a2739',r=2)
            else:s.line(xx,yy,xx+cw,yy,color=s.accent)
            s.text(xx+2,yy+7,MONTHS[month-1],10,True,limit=cw-4)
            month_grid(s,year,month,xx+1,yy+10,cw-2,ch-12,mini=True)
    else:
        # Two columns of month strips, with a continuous daily phase rhythm.
        cw=(w-33)/2;ch=55.5
        for month in range(1,13):
            col=(month-1)%2;row=(month-1)//2;xx=14+col*(cw+5);yy=55+row*ch
            s.line(xx,yy,xx+cw,yy,color=s.accent,width=.35)
            s.text(xx+1,yy+6,MONTHS[month-1],10,True,limit=cw-2)
            # 16 + 15-day strips preserve readable Moon discs and all dates.
            cell=cw/16
            for day in range(1,calendar.monthrange(year,month)[1]+1):
                rr=(day-1)//16;cc=(day-1)%16;date=f'{year}-{month:02d}-{day:02d}';d=6.8
                x=xx+cc*cell;y=yy+11+rr*19
                s.text(x+cell/2,y,str(day),5.3,True,align='center')
                s.moon(date,x+(cell-d)/2,y+1.7,d)
                s.text(x+cell/2,y+11,f'{DAYS[date]["fraction"]*100:.0f}%',4.5,align='center',color=s.muted)
    footer(s);s.finish();return s

def moon_textures(texture_path,days):
    color=np.asarray(Image.open(texture_path).convert('RGB'),dtype=np.float32)
    H,W=color.shape[:2];size=640
    yy,xx=np.mgrid[0:size,0:size];sx=(xx+.5-size/2)/(size/2-1);sy=-(yy+.5-size/2)/(size/2-1)
    rr=sx*sx+sy*sy;mask=rr<=1;sz=np.sqrt(np.maximum(0,1-rr))
    screen=np.stack((sx,sy,sz),axis=0)
    CACHE.mkdir(parents=True,exist_ok=True)
    for index,data in enumerate(days):
        date=data['date'];target=CACHE/f'{date}-640.png';small=CACHE/f'{date}-256.png'
        if target.exists() and small.exists():
            for px in [640,256]:
                jpg=CACHE/f'{date}-{px}.jpg'
                if not jpg.exists():Image.open(CACHE/f'{date}-{px}.png').convert('RGB').save(jpg,quality=95,subsampling=0,optimize=True)
            continue
        b=np.asarray(data['basis']);body=np.einsum('ij,jkl->ikl',b,screen)
        lon=np.arctan2(body[1],body[0]);lat=np.arcsin(np.clip(body[2],-1,1))
        u=(lon/(2*np.pi)+.5)*W-.5;v=(.5-lat/np.pi)*H-.5
        x0=np.floor(u).astype(int)%W;y0=np.clip(np.floor(v).astype(int),0,H-1)
        xf=(u-np.floor(u))[...,None];yf=(v-np.floor(v))[...,None]
        sample=(color[y0,x0]*(1-xf)+color[y0,(x0+1)%W]*xf)*(1-yf)+(color[np.minimum(y0+1,H-1),x0]*(1-xf)+color[np.minimum(y0+1,H-1),(x0+1)%W]*xf)*yf
        light=np.asarray(data['light']);cosine=light[0]*sx+light[1]*sy+light[2]*sz
        # Soft solar limb, modest earthshine, and a lunar Lommel-Seeliger law.
        solar=np.clip((cosine+.003)/.006,0,1);solar=solar*solar*(3-2*solar)
        scatter=np.clip(2*np.maximum(cosine,0)/(np.maximum(cosine,0)+sz+.00001),0,1.4)
        brightness=.018+.982*solar*(.54+.46*np.minimum(scatter,1.2))
        rgb=np.clip(sample*brightness[...,None],0,255).astype(np.uint8)
        alpha=np.clip((1-np.sqrt(rr))*(size/2-1)+.5,0,1)*255
        result=np.dstack((rgb,alpha.astype(np.uint8)));result[~mask,3]=0
        img=Image.fromarray(result,'RGBA');img.save(target,optimize=True)
        img.resize((256,256),Image.Resampling.LANCZOS).save(small,optimize=True)
        img.convert('RGB').save(CACHE/f'{date}-640.jpg',quality=95,subsampling=0,optimize=True)
        img.resize((256,256),Image.Resampling.LANCZOS).convert('RGB').save(CACHE/f'{date}-256.jpg',quality=95,subsampling=0,optimize=True)
        if index%50==0:print(f'Moon surfaces {index+1}/{len(days)}',flush=True)

def render_file(pdf,webp,preview,w,h):
    # Poppler output makes the downloadable image composition identical to PDF.
    pixels=(round(w/25.4*600),round(h/25.4*600))
    stem=str(CACHE/('render-'+pdf.stem))
    subprocess.run(['pdftoppm','-singlefile','-r','600','-scale-to-x',str(pixels[0]),'-scale-to-y',str(pixels[1]),str(pdf),stem],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    img=Image.open(stem+'.ppm').convert('RGB')
    assert img.size==pixels,(img.size,pixels)
    exif=Image.Exif();exif[282]=600;exif[283]=600;exif[296]=2
    img.save(webp,'WEBP',quality=96,method=2,icc_profile=SRGB,exif=exif)
    img.thumbnail((720,720),Image.Resampling.LANCZOS)
    img.save(preview,'WEBP',quality=88,method=4)
    Path(stem+'.ppm').unlink()
    return pixels

def build_artifact(task):
    year,month,design=task
    key,name,paper,orientation=(MONTH_DESIGNS if month else YEAR_DESIGNS)[design]
    stem=f'meness-kalendars-{year}'+(f'-{SLUGS[month-1]}' if month else '-gadam')+f'-{key}'
    pdf=OUT/(stem+'.pdf');image=OUT/(stem+'.webp');preview=OUT/(stem+'-preview.webp')
    prior=PREVIOUS.get(stem)
    if RESUME and prior and prior.get('fingerprint')==FINGERPRINT and all(x.exists() for x in [pdf,image,preview]):return prior
    sheet=monthly(pdf,year,month,design) if month else annual(pdf,year,design)
    width,height=render_file(pdf,image,preview,sheet.w,sheet.h)
    record={'stem':stem,'year':year,'month':month,'design':design+1,'name':name,'paper':paper,'orientation':orientation,'dpi':600,'width':width,'height':height,'pdf':'/downloads/meness/'+pdf.name,'image':'/downloads/meness/'+image.name,'preview':'/downloads/meness/'+preview.name,'pdfBytes':pdf.stat().st_size,'imageBytes':image.stat().st_size,'pdfSha256':digest(pdf),'imageSha256':digest(image),'fingerprint':FINGERPRINT,'pageCount':1,'dates':calendar.monthrange(year,month)[1] if month else 366 if calendar.isleap(year) else 365}
    if max(record['pdfBytes'],record['imageBytes'])>=25*1024*1024:raise ValueError('Cloudflare 25 MiB limit')
    return record

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--work',required=True);p.add_argument('--texture',required=True);p.add_argument('--sample',action='store_true');p.add_argument('--resume',action='store_true');p.add_argument('--skip-moons',action='store_true');p.add_argument('--workers',type=int,default=3)
    args=p.parse_args();work=Path(args.work);work.mkdir(parents=True,exist_ok=True);CACHE=work/'moon-cache'
    data=json.loads((work/'lunar-days.json').read_text());DAYS={d['date']:d for d in data['days']}
    PHASE_DATA=json.loads((ROOT/'assets/calendar-data.json').read_text())['moon']
    from PIL import ImageCms
    SRGB=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
    for name,file in [('DM','DM-Sans-Regular.ttf'),('DM-Bold','DM-Sans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,str(ROOT/'assets/fonts'/file)))
    OUT=ROOT/'downloads/meness';OUT.mkdir(parents=True,exist_ok=True)
    if not args.skip_moons:
        subset=[v for v in data['days'] if not args.sample or v['date'].startswith('2028-')]
        moon_textures(args.texture,subset)
    tasks=[(y,m,d) for y in range(2026,2031) for m in range(1,13) for d in range(4)]+[(y,None,d) for y in range(2026,2031) for d in range(4)]
    if args.sample:tasks=[(2028,1,d) for d in range(4)]+[(2028,None,d) for d in range(4)]
    manifest_path=OUT/'manifest.json';previous=json.loads(manifest_path.read_text()).get('items',[]) if manifest_path.exists() else []
    PREVIOUS={r['stem']:r for r in previous};records=[];RESUME=args.resume
    FINGERPRINT=hashlib.sha256(Path(__file__).read_bytes()+(work/'lunar-days.json').read_bytes()+Path(args.texture).read_bytes()+json.dumps(PHASE_DATA).encode()).hexdigest()
    from concurrent.futures import ProcessPoolExecutor
    from multiprocessing import get_context
    with ProcessPoolExecutor(max_workers=args.workers,mp_context=get_context('fork')) as pool:
      for index,record in enumerate(pool.map(build_artifact,tasks)):
        records.append(record)
        # A sample build never discards already generated production records.
        merged={r['stem']:r for r in previous};merged.update({r['stem']:r for r in records})
        manifest_path.write_text(json.dumps({'version':1,'complete':len(merged)==260,'dpi':600,'timeZone':'Europe/Riga','hour':12,'orientation':'Debess ziemeļi augšā','surfaceSource':'https://svs.gsfc.nasa.gov/4720/','items':list(merged.values())},ensure_ascii=False,indent=2)+'\n')
        print(f'{index+1}/{len(tasks)} {record["stem"]}: PDF {record["pdfBytes"]:,}, Image {record["width"]}×{record["height"]}',flush=True)
    print(f'Finished {len(records)} pairs.',flush=True)
