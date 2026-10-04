"""Quita de data.js las caras que se ven mal: siluetas de relleno de Transfermarkt y retratos recortados de canteranos.
Uso: python3 tools/prune_faces.py   (desde modo-carrera/)"""
import json, os
from PIL import Image
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
s = open(os.path.join(root, 'data.js')).read()
d = json.loads(s[len('window.DB='):].rstrip().rstrip(';'))
sheets = {}
def cell(face):
    k, c = divmod(face, 256)
    if k not in sheets: sheets[k] = Image.open(os.path.join(root, 'assets', f'faces-{k}.webp')).convert('RGB')
    x, y = (c % 16) * 80, (c // 16) * 80
    return sheets[k].crop((x, y, x + 80, y + 80))
def placeholder(im):
    px = list(im.getdata()); n = len(px)
    blue = sum(1 for r, g, b in px if b > r + 35 and b > g + 15 and max(r, g, b) < 150)
    white = sum(1 for r, g, b in px if min(r, g, b) > 225)
    return blue > 0.30 * n and white > 0.07 * n
sil = young = 0
for p in d['players']:
    if p[16] < 0 or not p[19]: continue          # solo retratos de Transfermarkt
    if placeholder(cell(p[16])): p[16] = -1; p[19] = 0; sil += 1
    elif p[6] <= 20: p[16] = -1; p[19] = 0; young += 1
open(os.path.join(root, 'data.js'), 'w').write('window.DB=' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';')
print('siluetas quitadas', sil, '· canteranos quitados', young, '· caras que quedan', sum(1 for p in d['players'] if p[16] >= 0))
