"""Empaqueta las caras descargadas en hojas WebP de 16x16 (256 caras por hoja, celdas de 80 px).
Uso: python3 tools/build_faces.py tools/faces_needed.txt cache_dir/ salida_assets/ faces_index.json"""
import json, os, sys
from PIL import Image
ids = [l.strip() for l in open(sys.argv[1]) if l.strip()]
cache, out, idx_path = sys.argv[2], sys.argv[3], sys.argv[4]
CELL, COLS, PER = 80, 16, 256
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.startswith('faces-') and f.endswith('.webp'): os.remove(os.path.join(out, f))
path = lambda i: os.path.join(cache, i + ('.jpg' if i.startswith('tm') else '.png'))
have = [i for i in dict.fromkeys(ids) if os.path.exists(path(i))]
index, sheet, n = {}, None, 0
def flush(sheet, k):
    sheet.save(os.path.join(out, f'faces-{k}.webp'), 'WEBP', quality=62, method=6)
for i, pid in enumerate(have):
    k, cell = divmod(i, PER)
    if cell == 0:
        if sheet is not None: flush(sheet, k - 1)
        rows = min(PER, len(have) - k * PER)
        sheet = Image.new('RGBA', (CELL * COLS, CELL * ((rows + COLS - 1) // COLS)), (0, 0, 0, 0))
    try:
        im = Image.open(path(pid)).convert('RGBA')
        if pid.startswith('tm'):  # retratos rectangulares: recorte cuadrado centrado en la cara
            w, h = im.size; sd = min(w, h); im = im.crop(((w - sd) // 2, 0, (w - sd) // 2 + sd, sd))
        im = im.resize((CELL, CELL), Image.LANCZOS)
    except Exception:
        continue
    sheet.alpha_composite(im, ((cell % COLS) * CELL, (cell // COLS) * CELL))
    index[pid] = i
if sheet is not None: flush(sheet, (len(have) - 1) // PER)
json.dump(index, open(idx_path, 'w'))
total = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out) if f.startswith('faces-'))
print(f'caras {len(index)} · hojas {(len(have) + PER - 1) // PER} · {total / 1e6:.1f} MB')
