from PIL import Image,ImageDraw,ImageFont
import json,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parents[1]
routes=json.loads((root/'docs/route-manifest.json').read_text())
fonts=list((root/'assets').rglob('*.ttf'))
font=str(fonts[0]) if fonts else '/System/Library/Fonts/Supplemental/Arial.ttf'
for r in routes:
 family=r['family']
 im=Image.new('RGB',(1200,630),'#f8f6f2');d=ImageDraw.Draw(im);d.rectangle((0,0,1200,22),fill='#751d2d');d.rectangle((900,22,1200,630),fill='#751d2d')
 d.text((65,65),'Kalendārs365',font=ImageFont.truetype(font,44),fill='#751d2d')
 labels={'hub':'Tava diena. Tavi plāni.','calendar_month':'Tavs mēnesis. Tavs ritms.','iso_week':'Viena nedēļa. Skaidrs plāns.','year':'Latvijas kalendāri 2027–2030','lunar_year':'Mēness kalendārs','lunar_month':'Mēness fāzes Latvijā','work_year':'Darba dienu kalendārs','work_month':'Darba dienas un brīvdienas','holiday_year':'Latvijas svētku dienas','holiday_month':'Svētki un atzīmējamās dienas','print_index':'Kalendāri drukai','print_month':'15 dizaini. PDF un WebP.','horoscope':'Dienas pārdomas','name_calendar':'Kalendārs ar tavu vārdu'}
 text=r['title'];words=text.split();lines=[];line='';ft=ImageFont.truetype(font,48)
 for w in words:
  if d.textlength(line+' '+w,font=ft)>770:lines.append(line);line=w
  else:line=(line+' '+w).strip()
 lines.append(line)
 for n,l in enumerate(lines):d.text((65,235+n*75),l,font=ft,fill='#49232b')
 d.text((65,545),'LATVIJA · kalendars365.lv',font=ImageFont.truetype(font,24),fill='#66545a')
 for row in range(5):
  for col in range(3):d.rounded_rectangle((940+col*70,190+row*65,983+col*70,228+row*65),radius=3,outline='#edc5ce',width=2)
 im.save(root/'assets/og'/(hashlib.sha1(r['url'].encode()).hexdigest()[:16]+'.webp'),quality=90)
print('Social image families:',len(routes))
