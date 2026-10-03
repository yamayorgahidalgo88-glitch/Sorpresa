"""Descarga las caras de las cartas FC 26 (futbin) para los jugadores de faces_needed.txt.
Uso: python3 tools/fetch_faces.py faces_needed.txt cache_dir/"""
import os, sys, time, urllib.request, concurrent.futures as cf
ids = [l.strip() for l in open(sys.argv[1]) if l.strip()]
out = sys.argv[2]; os.makedirs(out, exist_ok=True)
URL = 'https://cdn.futbin.com/content/fifa26/img/players/{}.png'
def get(pid):
    p = os.path.join(out, pid + '.png'); miss = p + '.404'
    if os.path.exists(p) or os.path.exists(miss): return 'cached'
    for t in range(4):
        try:
            req = urllib.request.Request(URL.format(pid), headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=20) as r:
                data = r.read()
                if r.headers.get('content-type', '').startswith('image/'):
                    open(p, 'wb').write(data); return 'ok'
                open(miss, 'w').close(); return 'miss'
        except urllib.error.HTTPError as e:
            if e.code == 404: open(miss, 'w').close(); return 'miss'
            time.sleep(2 * (t + 1))
        except Exception:
            time.sleep(2 * (t + 1))
    return 'error'
stats = {}
with cf.ThreadPoolExecutor(6) as ex:
    for i, r in enumerate(ex.map(get, ids)):
        stats[r] = stats.get(r, 0) + 1
        if i % 500 == 0: print(i, stats, flush=True)
print('fin', stats, flush=True)
