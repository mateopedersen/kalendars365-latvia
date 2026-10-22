"""Parse the vendored official PDF text extraction, preserving its 2018 edition.
The latest 2026 CSV files were not retrievable. This historical import must not
be presented as a current or complete 2026 VVC dataset.
"""
from pathlib import Path
import re,json,datetime
ROOT=Path(__file__).resolve().parents[1]
text=(ROOT/'_data/vvc-traditional-2018-extract.txt').read_text()
text=text.replace(' Vardadienu_saraksts_2018.doc','')
# The PDF extractor joins the last row of one page with the first of the next.
text=re.sub(r'(?<=[^\d\n])(\d{1,2}\. )',r'\n\1',text)
months='JANVĀRIS FEBRUĀRIS MARTS APRĪLIS MAIJS JŪNIJS JŪLIJS AUGUSTS SEPTEMBRIS OKTOBRIS NOVEMBRIS DECEMBRIS'.split()
names=[];dates=[];month=None
for line in text.splitlines():
    line=line.strip()
    if line in months: month=months.index(line)+1;continue
    row=re.fullmatch(r'(\d+)\. (.+)',line)
    if not row: continue
    day=int(row[1]);datetime.date(2000,month,day);dates.append((month,day))
    # Source also includes a descriptive note on the shared day for unlisted names.
    value='Emīlija' if (month,day)==(5,22) else row[2]
    for name in value.split(','):
        name=name.strip()
        if name=='–': continue
        if not re.fullmatch(r'[^\d.]+',name): raise ValueError(name)
        names.append(dict(name=name,month=month,day=day,kind='traditional',source='https://www.vvc.gov.lv/lv/media/164/download?attachment=',edition='2018',checked='2026-10-22',status='snapshot_verified',currentEditionVerified=False))
assert len(dates)==len(set(dates))==366
assert len(names)==1013
assert len({(r['name'],r['month'],r['day']) for r in names})==1013
(ROOT/'_data/vvc-traditional-2018.json').write_text(json.dumps(names,ensure_ascii=False,indent=2))
print(json.dumps({'calendarDates':len(dates),'nameDatePairs':len(names),'edition':'2018'}))
