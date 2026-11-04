"""Descarga fotos candidatas (miniaturas) de Wikimedia Commons por miembro y año, con sus créditos.
Se ejecuta en GitHub Actions. Sólo guarda archivos con licencia libre (CC BY / CC BY-SA / CC0 / dominio público)."""
import json, os, time, urllib.parse, urllib.request

UA = 'SuperstarArmyGift/1.0 (https://github.com/yamayorgahidalgo88-glitch/Sorpresa; personal non-commercial)'
API = 'https://commons.wikimedia.org/w/api.php'
MEMBERS = {'rm': 'RM', 'jin': 'Jin (vocalist)', 'suga': 'Suga', 'jh': 'J-Hope', 'jm': 'Jimin', 'v': 'V (vocalist)', 'jk': 'Jung Kook'}
YEARS = ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2025', '2026']
PER = int(os.environ.get('PER', '10'))
OUT = 'tools/photo-candidates'

def get(url, tries=6):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r: return r.read()
        except Exception as e:
            print('retry', i, e); time.sleep(5 * (i + 1))
    raise RuntimeError(url)

def api(**p):
    p.update(format='json', formatversion=2)
    return json.loads(get(API + '?' + urllib.parse.urlencode(p)))

meta = json.load(open(f'{OUT}/meta.json')) if os.path.exists(f'{OUT}/meta.json') else {}
have = {v['file'] for v in meta.values()}
def cat_files(cat):
    files, cont = [], {}
    while True:
        d = api(action='query', list='categorymembers', cmtitle=cat, cmtype='file', cmlimit=500, **cont)
        files += [m['title'] for m in d.get('query', {}).get('categorymembers', [])]
        if 'continue' not in d: break
        cont = {'cmcontinue': d['continue']['cmcontinue']}
    time.sleep(1); return files
def search_files(q):
    d = api(action='query', list='search', srnamespace=6, srsearch=q, srlimit=50); time.sleep(1)
    return [m['title'] for m in d.get('query', {}).get('search', [])]
# segunda pasada: huecos concretos (miembro, año, fuente)
JOBS = json.loads(os.environ.get('JOBS', 'null')) or [[mid, y, 'cat:' + f'Category:{c} in {y}'] for mid, c in MEMBERS.items() for y in YEARS]
for mid, y, src in JOBS:
        files = cat_files(src[4:]) if src.startswith('cat:') else search_files(src[7:])
        files = [f for f in files if f[5:] not in have and f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not files: continue
        # repartir la selección a lo largo del año
        step = max(1, len(files) / PER)
        pick = [files[int(i * step)] for i in range(min(PER, len(files)))]
        for k in range(0, len(pick), 20):
            d = api(action='query', prop='imageinfo', titles='|'.join(pick[k:k + 20]), iiprop='url|extmetadata|size', iiurlwidth=420)
            time.sleep(1)
            for pg in d['query']['pages']:
                ii = (pg.get('imageinfo') or [{}])[0]
                em = ii.get('extmetadata', {})
                lic = em.get('LicenseShortName', {}).get('value', '')
                if not any(x in lic.lower() for x in ['cc by', 'cc-by', 'cc0', 'public domain', 'dominio']): continue
                if 'thumburl' not in ii: continue
                if pg['title'][5:] in have: continue
                have.add(pg['title'][5:])
                n = len([1 for v in meta.values() if v['member'] == mid and v['year'] == y]) + 1
                name = f'{mid}-{y}-{n:02d}.jpg'
                os.makedirs(f'{OUT}/{mid}', exist_ok=True)
                with open(f'{OUT}/{mid}/{name}', 'wb') as f: f.write(get(ii['thumburl']))
                time.sleep(1.5)
                meta[name] = dict(member=mid, year=y, file=pg['title'][5:], license=lic,
                                  author=em.get('Artist', {}).get('value', ''), date=em.get('DateTimeOriginal', {}).get('value', ''),
                                  url=ii.get('descriptionurl', ''), w=ii.get('width'), h=ii.get('height'))
                print(name, pg['title'])
with open(f'{OUT}/meta.json', 'w') as f: json.dump(meta, f, ensure_ascii=False, indent=1)
print('total', len(meta))
