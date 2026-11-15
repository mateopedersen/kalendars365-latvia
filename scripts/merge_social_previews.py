"""Merge separately rendered route cards after checking every retained byte/input.
The renderer itself must be unchanged. Changed existing inputs require rerendering.
"""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1]
def read(path):return json.loads((R/path).read_text())
def sha(path):return hashlib.sha256((R/str(path).lstrip('/')).read_bytes()).hexdigest()
catalog=read('_data/social-images.json');assert catalog['rendererSha256']==sha('scripts/social_images.py');assert catalog['prepareSha256']==sha('tooling/social-cards/prepare.mjs')
previews=json.loads((R/'../reports/social-cards-2026-11-11/preview.json').resolve().read_text())
routes={r['url']:r for r in read('docs/route-manifest.json')}
rows={**catalog['pages'],**{p['url']:p for p in previews}}
expected=set(routes)|{'/404.html','/500.html','/nedelas-kalendars/2031/01/'}
assert set(rows)==expected
for url,row in rows.items():
 assert row['url']==url and row['sha256']==sha(row['src'])
 assert all(sha(path)==digest for path,digest in row['inputs'].items()),url
 if url in routes:assert row['title']==routes[url]['title'],url
for field in ('src','panelSha256','pixelSha256'):assert len({p[field] for p in rows.values()})==len(rows),field
catalog['pages']=rows
credits={}
for row in rows.values():
 for photo in row['sources']:
  key=photo.get('sourceUrl') or photo['src'];entry=credits.setdefault(key,{**photo,'covers':[]});entry['covers'].append(dict(url=row['url'],image=row['src'],title=row['title']))
for file in ['assets/social-cards/credits.json','_data/social-cover-credits.json']:(R/file).write_text(json.dumps({'version':2,'photos':list(credits.values())},ensure_ascii=False,indent=2)+'\n')
(R/'_data/social-images.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
(R/'docs/OG_RESULTS.json').write_text(json.dumps({'version':2,'routeCards':len(rows),'dimensions':[1200,630],'distinctPixelImages':len(rows),'distinctSubjectPanels':len(rows),'totalBytes':sum(p['bytes'] for p in rows.values()),'checks':['new route cards rendered with unchanged source-bound renderer','retained image and all source-input checksums verified','all titles match current route registry','unique image and subject panel per route'],'files':list(rows.values())},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'merged':len(previews),'verifiedTotal':len(rows)}))
