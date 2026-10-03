"""Descarga escudos de TheSportsDB para los clubes sin escudo en football-logos.
Uso: python3 tools/fetch_badges.py tools/crest_missing.json cache_dir/ salida.json"""
import json, os, sys, time, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from names import norm, core
items, out_dir, out_json = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]
os.makedirs(out_dir, exist_ok=True)
result = json.load(open(out_json)) if os.path.exists(out_json) else {}
CO = {'Eslovaquia':'Slovakia','Azerbaiyán':'Azerbaijan','Eslovenia':'Slovenia','Noruega':'Norway','Grecia':'Greece','Chipre':'Cyprus','Chequia':'Czech Republic',
      'Kazajistán':'Kazakhstan','Finlandia':'Finland','Bosnia':'Bosnia-Herzegovina','Letonia':'Latvia','Lituania':'Lithuania'}
def api(q):
    url = 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=' + urllib.parse.quote(q)
    for t in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=25) as r:
                return (json.load(r) or {}).get('teams') or []
        except Exception as e:
            time.sleep(5 * (t + 1))
    return []
def variants(src, disp):
    v = []
    for n in (src, disp):
        for x in (n, unicodedata_strip(n), core(n).title()):
            if x and x not in v: v.append(x)
    return v
import unicodedata
def unicodedata_strip(s): return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode()
items.sort(key=lambda x: not x[3])
for src, disp, country, prio in items:
    if src in result: continue
    country = CO.get(country, country)
    found = None
    for q in variants(src.replace('GEN:', ''), disp):
        time.sleep(2.2)
        teams = [t for t in api(q) if t.get('strSport') == 'Soccer' and t.get('strBadge') and (not country or t.get('strCountry') == country)]
        keys = {norm(src.replace('GEN:', '')), norm(disp), core(src), core(disp)}
        exact = [t for t in teams if {norm(t['strTeam']), core(t['strTeam'])} & keys or
                 any(core(a) in keys for a in (t.get('strTeamAlternate') or '').split(',') if a.strip())]
        pickt = exact[0] if exact else (teams[0] if len(teams) == 1 and country else None)
        if pickt: found = pickt; break
    if found:
        path = os.path.join(out_dir, norm(src).replace(' ', '_') + '.png')
        try:
            urllib.request.urlretrieve(found['strBadge'] + '/small', path)
            result[src] = path; print('OK', src, '->', found['strTeam'], found.get('strCountry'), flush=True)
        except Exception as e:
            print('ERR', src, e, flush=True)
    else:
        result[src] = None; print('--', src, flush=True)
    json.dump(result, open(out_json, 'w'), ensure_ascii=False, indent=0)
print('fin', sum(1 for v in result.values() if v), '/', len(result))
