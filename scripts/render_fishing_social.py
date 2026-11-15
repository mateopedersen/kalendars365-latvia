"""Render the fishing guide from its verified photo catalog with the shared compositor."""
import social_images as s
base=s.render_panel
def fishing_panel(r):
 if r['url']!='/copes-kalendars/':return base(r)
 data=s.read('_data/fishing-guide.json');photo=next(p for p in data['photos'] if p['id']=='usma');im=s.panel(color='#f1e5e9');s.paste_fit(im,s.load(photo['src']),(18,18,488,310));s.rr(im,(18,329,488,534),16,'#fffafb','#d9c2cc');s.text(im,(43,351),'PIRMS DODIES COPĒ',15,'#79243c',True)
 for y,k,v in [(397,'Līdakas','01.03.–30.04.'),(440,'Zandarti','16.04.–31.05.'),(483,'Laivu pamatliegums','01.03.–30.04.')]:s.text(im,(43,y),k,18,'#55454d');s.text(im,(465,y),v,18,'#79243c',True,anchor='rt')
 return im,{'kind':'work','kicker':'COPES KALENDĀRS LATVIJĀ','subtitle':'Liegumi · Zivju sugas · Licences un ezeri','badge':'COPE','assets':['/_data/fishing-guide.json','/scripts/render_fishing_social.py'],'photos':[photo],'year':None,'month':None}
s.render_panel=fishing_panel
if __name__=='__main__':s.main()
