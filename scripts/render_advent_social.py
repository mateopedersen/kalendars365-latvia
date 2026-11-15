"""Original carmine and ivory Advent cabinet, bound to the 24-day content."""
import social_images as s
import render_tax_social
import render_fishing_social
base=s.render_panel
def advent_panel(r):
 if not r['url'].startswith('/adventes-kalendars/'):return base(r)
 year=r.get('year') or (int(r['url'].strip('/').split('/')[-1]) if r['url'].strip('/').split('/')[-1].isdigit() else None)
 im=s.panel(color='#56172b')
 s.text(im,(24,12),'ADVENTE '+str(year or '24'),14,'#fff4df',True)
 for n in range(24):
  col=n%4;row=n//4;x=22+col*117;y=37+row*77
  light=n%5==4 or n==23
  s.rr(im,(x+3,y+5,x+106,y+67),4,'#331220')
  s.rr(im,(x,y,x+103,y+62),4,'#fff4de' if light else '#912943','#c38b94')
  s.text(im,(x+51,y+15),str(n+1).zfill(2),24,'#782239' if light else '#fff4df',True,anchor='mt')
 return im,{'kind':'culture','kicker':'LATVIJAS ZIEMAS MAZIE PRIEKI','subtitle':'24 lodziņi · Latviskas idejas · Tavs decembris','badge':'ADVENTE','assets':['/_data/advent-calendar.json','/scripts/render_advent_social.py','/assets/tools-art/advent.svg'],'photos':[],'year':year,'month':None}
s.render_panel=advent_panel
s.main()
