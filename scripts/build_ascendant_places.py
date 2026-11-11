"""Build private, country-split birthplace search from attributed GeoNames data.

Download source snapshots to docs/sources/ascendant first. No network at build time.
Latvia uses the site's reviewed, complete city catalogue rather than a population cut.
"""
import hashlib
import json
import pathlib
import subprocess
import unicodedata
import zipfile
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'docs/sources/ascendant'
DEST = ROOT / 'assets/ascendant-places'


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


def normalized(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', value.casefold()) if not unicodedata.combining(c))


def main():
    receipt = json.loads((SOURCE / 'geonames-receipt.json').read_text())
    for name, info in receipt['files'].items():
        assert hashlib.sha256((SOURCE / name).read_bytes()).hexdigest() == info['sha256'], f'Changed source: {name}'
    regions = {}
    for line in (SOURCE / 'admin1CodesASCII.txt').read_text().splitlines():
        fields = line.split('\t')
        if len(fields) >= 2:
            regions[fields[0]] = fields[1]
    countries = defaultdict(list)
    with zipfile.ZipFile(SOURCE / 'cities15000.zip') as archive:
        for line in archive.read('cities15000.txt').decode('utf-8').splitlines():
            fields = line.split('\t')
            if len(fields) != 19 or len(fields[8]) != 2 or fields[8] == 'LV' or not fields[17]:
                continue
            # Keep transliterations and aliases for search, not for unsupported display claims.
            aliases = list(dict.fromkeys(normalized(v) for v in [fields[1], fields[2]] + fields[3].split(',') if v))
            countries[fields[8]].append({'id': fields[0], 'name': fields[1],
                'region': regions.get(fields[8] + '.' + fields[10], ''), 'lat': float(fields[4]),
                'lon': float(fields[5]), 'zone': fields[17], 'aliases': aliases, 'population': int(fields[14] or 0)})
    lv = json.loads((ROOT / '_data/cities.json').read_text())
    countries['LV'] = [{'id': c['id'], 'name': c['name'], 'region': '', 'lat': c['lat'], 'lon': c['lon'],
        'zone': c['timeZone'], 'aliases': [normalized(c['name']), normalized(c['id'])], 'population': 0} for c in lv['cities']]
    names = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
        'let d=new Intl.DisplayNames(["lv"],{type:"region"});console.log(JSON.stringify(Object.fromEntries(JSON.parse(process.argv[1]).map(c=>[c,d.of(c)]))))',
        json.dumps(list(countries))], text=True))
    DEST.mkdir(parents=True, exist_ok=True)
    for code, cities in countries.items():
        cities.sort(key=lambda c: (-c['population'], c['name']))
        for city in cities:
            del city['population']
        write(DEST / f'{code}.json', cities)
    manifest = {'version': '2026-11-11', 'source': 'https://download.geonames.org/export/dump/',
        'license': 'CC BY 4.0', 'latitudeSource': lv['coordinateSource'],
        'countries': sorted([{'code': code, 'name': names[code], 'count': len(cities)} for code, cities in countries.items()], key=lambda c: c['name']),
        'count': sum(map(len, countries.values()))}
    write(DEST / 'countries.json', manifest)
    # Tiny boot catalogue: country labels and all Latvian cities, no photos or private fields.
    write(ROOT / '_data/ascendant-places.json', {'countries': manifest['countries'], 'latvia': countries['LV'], 'version': manifest['version']})
    print(json.dumps({'countries': len(countries), 'cities': manifest['count'], 'Latvia': len(countries['LV']),
        'bytes': sum(p.stat().st_size for p in DEST.glob('*.json'))}))


if __name__ == '__main__':
    main()
