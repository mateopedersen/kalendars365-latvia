"""Rebuild checked public data from vendored primary-source snapshots.
No network and no inferred school/name-day dates. Run after calendar.rb changes.
"""
import csv
import hashlib
import json
import pathlib
import subprocess
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHECKED = '2026-10-22'
SCHOOL_URL = 'https://likumi.lv/ta/id/365210-noteikumi-par-20262027-macibu-gada-un-macibu-semestru-sakuma-un-beigu-laiku-un-brivdienu-laiku'
NAME_URL = 'https://www.vvc.gov.lv/lv/kalendarvardu-ekspertu-komisija'
PHASES = {'New Moon': 'Jaunmēness', 'First Quarter': 'Pirmais ceturksnis', 'Full Moon': 'Pilnmēness', 'Last Quarter': 'Pēdējais ceturksnis'}

holidays = json.loads(subprocess.check_output(['ruby', '-I'+str(ROOT/'lib'), '-rcalendar', '-rjson', '-e', 'puts JSON.generate((2026..2031).flat_map { |y| Calendar365.holidays(y) })'], text=True))
moon = []
for year in range(2027, 2031):
    data = json.loads((ROOT/'_data'/f'usno-{year}.json').read_text())
    assert data['numphases'] == len(data['phasedata'])
    for phase in data['phasedata']:
        utc = datetime.fromisoformat(f"{phase['year']:04}-{phase['month']:02}-{phase['day']:02}T{phase['time']}:00+00:00")
        riga = utc.astimezone(ZoneInfo('Europe/Riga'))
        moon.append({'date':riga.date().isoformat(),'time':riga.strftime('%H:%M'),'phase':PHASES[phase['phase']],'phaseKey':phase['phase'],'utc':utc.isoformat().replace('+00:00','Z'),'timezone':'Europe/Riga','offset':riga.strftime('%z'),'source':f'https://aa.usno.navy.mil/api/moon/phases/year?year={year}'})
seasons = []
for year in range(2027,2031):
    season_data=json.loads((ROOT/'_data'/f'usno-seasons-{year}.json').read_text())
    assert season_data['tz']==0 and not season_data['dst']
    for event in season_data['data']:
        utc=datetime.fromisoformat(f"{event['year']:04}-{event['month']:02}-{event['day']:02}T{event['time']}:00+00:00")
        riga=utc.astimezone(ZoneInfo('Europe/Riga'))
        title={1:'Perihēlijs',3:'Pavasara ekvinokcija',6:'Vasaras saulgrieži',7:'Afēlijs',9:'Rudens ekvinokcija',12:'Ziemas saulgrieži'}[event['month']]
        seasons.append({'date':riga.date().isoformat(),'time':riga.strftime('%H:%M'),'title':title,'phenomenon':event['phenom'],'utc':utc.isoformat().replace('+00:00','Z'),'timezone':'Europe/Riga','source':f'https://aa.usno.navy.mil/api/seasons?year={year}'})
school = [
    {'academicYear':'2026-2027','start':'2026-10-19','end':'2026-10-23','title':'Rudens brīvdienas','grades':'1.–12. klase','status':'verified','source':SCHOOL_URL},
    {'academicYear':'2026-2027','start':'2026-12-21','end':'2027-01-01','title':'Ziemas brīvdienas','grades':'1.–12. klase','status':'verified','source':SCHOOL_URL},
    {'academicYear':'2026-2027','start':'2027-03-08','end':'2027-03-12','title':'Pavasara brīvdienas','grades':'1.–12. klase','status':'verified','source':SCHOOL_URL},
    {'academicYear':'2026-2027','start':'2027-06-01','end':'2027-08-31','title':'Vasaras brīvdienas','grades':'1.–8. un 10.–11. klase','status':'verified','source':SCHOOL_URL},
]
school_years = [{'academicYear':'2026-2027','status':'verified','start':'2026-09-01','endByGrade':{'1-8,10-11':'2027-05-31','9':'2027-06-11','12':'2027-06-18'},'note':'1. klasei skola otrajā semestrī nosaka vienu papildu brīvdienu nedēļu. Datumi katrā skolā var atšķirties.','source':SCHOOL_URL}]
school_years += [{'academicYear':f'{y}-{y+1}','status':'pending','note':'Šī mācību gada brīvdienu datumi vēl nav pārbaudīti oficiālajā avotā.'} for y in range(2027,2031)]

names = []
latest_name_files = all((ROOT/'_data'/f'vvc-{kind}.csv').exists() for kind in ['traditional','extended'])
for kind in ['traditional','extended']:
    path = ROOT/'_data'/f'vvc-{kind}.csv'
    if not path.exists(): continue
    text = path.read_text(encoding='utf-8-sig')
    dialect = csv.Sniffer().sniff(text[:4000],delimiters=',;\t')
    for row in csv.DictReader(text.splitlines(),dialect=dialect):
        key = next((k for k in row if k.lower().strip()=='datums'),None)
        if not key: raise ValueError('Unknown VVC date schema')
        date = row[key].strip().strip('.')
        import re
        numbers = [int(n) for n in re.findall(r'\d+',date)]
        if len(numbers)!=2: raise ValueError('Unexpected VVC date: '+date)
        day,month = numbers
        datetime(2000,month,day)
        value = next((v for k,v in row.items() if 'vardadienas'==k.lower().strip()),'')
        for name in re.split(r',\s*',value):
            name=name.strip()
            if name: names.append({'name':name,'month':month,'day':day,'kind':kind,'source':NAME_URL,'status':'verified','checked':CHECKED,'currentEditionVerified':True})
if not names:
    names = json.loads((ROOT/'_data/vvc-traditional-2018.json').read_text())
names = list({(n['name'],n['month'],n['day'],n['kind']):n for n in names}.values())
priority = list(csv.DictReader((ROOT/'_data/name-priority-candidates.csv').open(encoding='utf-8-sig')))
name_candidates = [{'name':r['Vārds'],'cohort':r['Priority cohort'],'gender':r['Population type'],'rank':int(r['2025 newborn position']) if r['2025 newborn position'].isdigit() else None,'url':r['Planned URL'],'status':'candidate','source':r['Source']} for r in priority]

sources = [
 {'id':'holidays','title':'Par svētku, atceres un atzīmējamām dienām','url':'https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam','edition':'2025-03-18','checked':CHECKED,'status':'verified','note':'Noteikumi ir spēkā pārbaudes datumā. Nākotnē iespējami grozījumi.'},
 {'id':'labor','title':'Darba likums, 131., 133. un 135. pants','url':'https://likumi.lv/ta/id/26019-darba-likums','checked':CHECKED,'status':'verified','note':'Pēc noklusējuma piecu dienu nedēļa, astoņas stundas dienā. Darbdienu pārcelšana nav pieņemta automātiski.'},
 {'id':'school','title':'2026./2027. mācību gada noteikumi Nr. 768','url':SCHOOL_URL,'checked':CHECKED,'status':'verified'},
 {'id':'names','title':'VVC tradicionālais un paplašinātais kalendārvārdu saraksts','url':NAME_URL,'checked':CHECKED,'status':'verified' if latest_name_files else 'latest_download_pending','license':'CC0-1.0','note':'Jaunākā tradicionālā saraksta metadati: 09.02.2026.; paplašinātā: 16.03.2026. Pilnu 2026. gada CSV datņu lejupielāde nav izdevusies. Pieejams VVC 2018. gada tradicionālā saraksta avota izraksts; tas nav pilns aktuālais saraksts.' if not latest_name_files else 'Dati importēti no oficiālajiem CSV.'},
 {'id':'names-snapshot','title':'VVC tradicionālo vārdadienu saraksts: 2018. gada avots','url':'https://www.vvc.gov.lv/lv/media/164/download?attachment=','edition':'2018','checked':CHECKED,'status':'snapshot_verified','note':'1013 vārdu un datumu pāri. PDF pilnais teksta izraksts saglabāts; 29. februārim avotā nav vārda. 22. maija kopējās vārdu dienas piezīme netiek importēta kā personvārds. 2026. gada aktualitāte nav pilnībā pārbaudīta.'},
 {'id':'moon','title':'U.S. Naval Observatory: Primary Moon Phases','url':'https://aa.usno.navy.mil/data/api','checked':CHECKED,'status':'verified','apiVersion':'4.0.1','note':'UTC notikumi pārveidoti Europe/Riga laikā ar IANA laika joslu. Nākotnes laika joslas noteikumi var mainīties.'},
 {'id':'seasons','title':'U.S. Naval Observatory: Earth’s Seasons','url':'https://aa.usno.navy.mil/data/api.html','checked':CHECKED,'status':'verified','apiVersion':'4.0.1','note':'24 notikumi 2027.–2030. gadā. UTC pārveidots Europe/Riga laikā; USNO ASV vasaras laika slēdzis izslēgts.'},
 {'id':'song-festival','title':'2028. gada Dziesmu un deju svētku norises laiks','url':'https://likumi.lv/ta/id/367734-par-xxviii-visparejo-latviesu-dziesmu-un-xviiideju-svetku-norises-laiku','checked':CHECKED,'status':'verified','note':'Apstiprināts norises laiks: 30.06.–09.07.2028. Noslēguma diena 09.07.; likumā noteiktā brīvdiena 10.07.2028.'},
 {'id':'moved-workdays','title':'Ministru kabineta 16.06.2026. sēdes protokols, 44. §','url':'https://www.vestnesis.lv/op/2026/121.4','checked':CHECKED,'status':'pending','note':'2027. gada darba dienu pārcelšanas jautājuma izskatīšana atlikta. Pārcelšanas netiek pieņemtas bez apstiprināta rīkojuma.'},
]
output = {'version':CHECKED,'timezone':'Europe/Riga','years':[2027,2028,2029,2030],'holidays':holidays,'names':names,'nameCandidates':name_candidates,'moon':moon,'school':school,'schoolYears':school_years,'sources':sources,'assumptions':{'workWeek':5,'dailyHours':8,'shortenHolidayEveBy':1,'movedWorkdays':{},'songFestivalFinalDay':'2028-07-09','namesComplete':latest_name_files,'nameEdition':'2026' if latest_name_files else '2018 snapshot','lunarYears':[2027,2028,2029,2030]}}
output['seasons']=seasons
(ROOT/'assets/calendar-data.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
(ROOT/'_data/calendar.json').write_text(json.dumps(output,ensure_ascii=False,indent=2))
manifest={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for pattern in ['usno-*.json','vvc-*.json','vvc-*.txt','vvc-*.csv','name-priority-candidates.csv'] for p in (ROOT/'_data').glob(pattern)}
(ROOT/'_data/source-checksums.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'holidays':len(holidays),'moon':len(moon),'names':len(names),'schoolPeriods':len(school),'candidateNames':len(name_candidates)},ensure_ascii=False))
