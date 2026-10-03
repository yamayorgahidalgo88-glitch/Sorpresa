"""Descarga las plantillas 2026/27 de Transfermarkt (página 'Detailed squad') y las guarda en cache_dir/squads.json.
Uso: python3 tools/scrape_tm.py cache_dir/ [--extra]   (--extra: añade las ligas de los participantes europeos)"""
import html, json, os, re, sys, time, urllib.request
CACHE = sys.argv[1]; os.makedirs(CACHE, exist_ok=True)
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
LEAGUES = {'ES1': 'Spain', 'ES2': 'Spain', 'GB1': 'England', 'GB2': 'England', 'IT1': 'Italy', 'IT2': 'Italy',
           'L1': 'Germany', 'L2': 'Germany', 'FR1': 'France', 'FR2': 'France'}
EXTRA = {'PO1': 'Portugal', 'NL1': 'Netherlands', 'BE1': 'Belgium', 'TR1': 'Turkey', 'GR1': 'Greece', 'SC1': 'Scotland', 'DK1': 'Denmark',
         'A1': 'Austria', 'C1': 'Switzerland', 'TS1': 'Czechia', 'NO1': 'Norway', 'PL1': 'Poland', 'SE1': 'Sweden', 'KR1': 'Croatia',
         'RO1': 'Romania', 'UKR1': 'Ukraine', 'SER1': 'Serbia', 'BU1': 'Bulgaria', 'ZYP1': 'Cyprus', 'IS1': 'Israel'}
if '--extra' in sys.argv: LEAGUES.update(EXTRA)

def get(url, name):
    p = os.path.join(CACHE, name)
    if os.path.exists(p): return open(p, encoding='utf-8').read()
    for t in range(4):
        try:
            time.sleep(1.4)
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'en-GB,en;q=0.9'}), timeout=40) as r:
                s = r.read().decode('utf-8', 'ignore')
            if '<title>' in s and len(s) > 20000:
                open(p, 'w', encoding='utf-8').write(s); return s
        except Exception as e:
            time.sleep(4 * (t + 1))
    return ''

def clean(x): return html.unescape(re.sub(r'<[^>]+>', '', x)).strip()

def parse_squad(s):
    i = s.find('class="items"')
    if i < 0: return []
    out = []
    for row in re.split(r'(?=<tr class="(?:odd|even)">)', s[i:]):
        if not row.startswith('<tr class'): continue
        m = re.search(r'<a href="/([^"]+)/profil/spieler/(\d+)">\s*(.*?)(?:<span|</a>)', row, re.S)
        if not m: continue
        tds = re.findall(r'<td class="zentriert">(.*?)</td>', row, re.S)
        cells = [clean(t) for t in tds]
        nat = re.findall(r'title="([^"]+)" alt="[^"]*" class="flaggenrahmen"', tds[1]) if len(tds) > 1 else []
        d = re.match(r'(\d\d)/(\d\d)/(\d{4})', cells[0]) if cells else None
        num = re.search(r'rn_nummer>(\d+)<', row)
        pos = re.search(r'</table>|<td>\s*([A-Za-z\- ]+?)\s*</td>\s*</tr>\s*</table>', row)
        joined = re.search(r'title="Joined from ([^";]+?);\s*date:\s*(\d\d/\d\d/\d{4});\s*fee:\s*([^"]*)"', row)
        contract = cells[-1] if cells and re.match(r'\d\d/\d\d/\d{4}', cells[-1]) else ''
        val = re.search(r'marktwertverlauf/spieler/\d+">([^<]*)<', row)
        portrait = re.search(r'data-src="(https://img\.a\.transfermarkt\.technology/portrait/[^"]+)"', row)
        out.append({'id': int(m.group(2)), 'slug': m.group(1), 'name': clean(m.group(3)), 'pos': pos.group(1) if pos and pos.group(1) else '',
                    'dob': f'{d.group(3)}-{d.group(2)}-{d.group(1)}' if d else '', 'nat': nat, 'num': int(num.group(1)) if num else 0,
                    'foot': cells[3] if len(cells) > 3 else '', 'joined': joined.group(1) if joined else '', 'joinedDate': joined.group(2) if joined else '',
                    'fee': joined.group(3) if joined else '', 'contract': contract, 'value': val.group(1) if val else '',
                    'portrait': portrait.group(1) if portrait else '', 'injured': 'verletzt-table' in row})
    return out

res = json.load(open(os.path.join(CACHE, 'squads.json'))) if os.path.exists(os.path.join(CACHE, 'squads.json')) else {}
for comp, country in LEAGUES.items():
    s = get(f'https://www.transfermarkt.com/-/startseite/wettbewerb/{comp}/plus/?saison_id=2026', f'comp_{comp}.html')
    items = s[s.find('class="items"'):]
    clubs = {}
    for m in re.finditer(r'<td class="hauptlink no-border-links"><a title="([^"]+)" href="/([^"]+)/startseite/verein/(\d+)/saison_id/2026"', items):
        clubs[m.group(3)] = (html.unescape(m.group(1)), m.group(2))
    print(comp, len(clubs), flush=True)
    for cid, (name, slug) in clubs.items():
        if cid in res and res[cid]['players']: continue
        sq = parse_squad(get(f'https://www.transfermarkt.com/{slug}/kader/verein/{cid}/saison_id/2026/plus/1', f'club_{cid}.html'))
        res[cid] = {'name': name, 'slug': slug, 'comp': comp, 'country': country, 'players': sq}
        print('  ', name, len(sq), flush=True)
        json.dump(res, open(os.path.join(CACHE, 'squads.json'), 'w'), ensure_ascii=False)
print('fin', len(res), sum(len(v['players']) for v in res.values()))
