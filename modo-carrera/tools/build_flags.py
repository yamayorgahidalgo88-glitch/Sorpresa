"""Hoja de banderas (assets/flags.webp) para todas las nacionalidades de NATION en game.js.
Las banderas salen de flagcdn.com. El orden es el de los códigos ordenados, igual que FLAG_CODES en game.js.
Uso: python3 tools/build_flags.py [carpeta_cache]"""
import io, os, re, sys, time, urllib.request
from PIL import Image
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
cache = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'tools', 'flags_cache')
os.makedirs(cache, exist_ok=True)
src = open(os.path.join(root, 'game.js'), encoding='utf-8').read()
block = src[src.index('const NATION={'):src.index('};', src.index('const NATION={'))]
codes = sorted({c for c in re.findall(r"\[\s*'([A-Z]{2,3})'\s*,", block)})
SUB = {'ENG': 'gb-eng', 'SCT': 'gb-sct', 'WLS': 'gb-wls', 'NIR': 'gb-nir'}
W, H, COLS = 48, 32, 16
sheet = Image.new('RGBA', (W * COLS, H * ((len(codes) + COLS - 1) // COLS)), (0, 0, 0, 0))
for i, c in enumerate(codes):
    slug = SUB.get(c, c.lower()); path = os.path.join(cache, slug + '.png')
    if not os.path.exists(path):
        req = urllib.request.Request(f'https://flagcdn.com/w160/{slug}.png', headers={'User-Agent': 'Mozilla/5.0'})
        open(path, 'wb').write(urllib.request.urlopen(req, timeout=20).read()); time.sleep(0.15)
    im = Image.open(path).convert('RGBA')
    # encaja la bandera en 3:2 recortando el centro (como una bandera de carta)
    w, h = im.size; r = W / H
    if w / h > r: nw = int(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = int(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    sheet.paste(im.resize((W, H), Image.LANCZOS), ((i % COLS) * W, (i // COLS) * H))
sheet.save(os.path.join(root, 'assets', 'flags.webp'), 'WEBP', quality=90, method=6)
print('banderas', len(codes), os.path.getsize(os.path.join(root, 'assets', 'flags.webp')) // 1024, 'KB')
