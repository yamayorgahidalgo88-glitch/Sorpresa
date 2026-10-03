"""Descarga los retratos de Transfermarkt de los jugadores sin carta en FC 26 (portraits_needed.json).
Uso: python3 tools/fetch_portraits.py tools/portraits_needed.json cache_dir/"""
import json, os, sys, time, urllib.request, concurrent.futures as cf
need = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
def get(item):
    key, url = item; p = os.path.join(out, key + '.jpg')
    if os.path.exists(p) or os.path.exists(p + '.404') or not url: return 'cached'
    for t in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=25) as r:
                open(p, 'wb').write(r.read()); return 'ok'
        except urllib.error.HTTPError as e:
            if e.code in (403, 404): open(p + '.404', 'w').close(); return 'miss'
            time.sleep(2 * (t + 1))
        except Exception: time.sleep(2 * (t + 1))
    return 'error'
st = {}
with cf.ThreadPoolExecutor(6) as ex:
    for i, r in enumerate(ex.map(get, need.items())):
        st[r] = st.get(r, 0) + 1
        if i % 300 == 0: print(i, st, flush=True)
print('fin', st)
