"""Render the tax route using the unchanged shared social-card compositor."""
import social_images as s
base=s.render_panel
def tax_panel(r):
 if r['url']!='/nodoklu-kalkulators/':return base(r)
 im=s.panel(color='#eee3e5');s.rr(im,(28,28,478,527),18,'#fcfafa','#dac4c9');s.text(im,(53,57),'ALGAS APRĒĶINS · 2026',18,'#744650',True)
 for i,(label,value) in enumerate([('Bruto alga','1 500,00 €'),('Darbinieka VSAOI','157,50 €'),('IIN','202,09 €')]):
  y=118+i*76;s.text(im,(53,y),label,18,'#8b6f75');s.text(im,(450,y),value,23,'#643b44',True,anchor='rt');s.line(im,[(53,y+46),(450,y+46)],'#e5d7da')
 s.rr(im,(48,355,456,480),12,'#ead3d8');s.text(im,(70,374),'NETO · UZ ROKAS',16,'#825760',True);s.text(im,(70,410),'1 140,41 €',49,'#5c303a',True)
 return im,{'kind':'work','kicker':'NODOKĻI LATVIJĀ','subtitle':'Bruto un neto alga · PVN · Termiņi','badge':'2026','assets':['/_data/tax-guide.json','/scripts/render_tax_social.py'],'photos':[],'year':2026,'month':None}
s.render_panel=tax_panel
if __name__=='__main__':s.main()
