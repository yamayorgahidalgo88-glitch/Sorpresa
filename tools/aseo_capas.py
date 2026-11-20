"""Capas del Aseo (planta baja). Uso: python3 tools/aseo_capas.py [preview.png]"""
import sys, numpy as np, cv2
sys.path.insert(0, __import__('os').path.dirname(__file__))
from capas_lib import Room

A = Room('aseo'); base, alt, H, W = A.base, A.alt, A.H, A.W
r, g, b = base[..., 0], base[..., 1], base[..., 2]
yy, xx = np.mgrid[0:H, 0:W]
WALL = (r > 150) & (r - b > 20) & (r - b < 175) & (g > 85) & (r - g < 95) & (g - b > 5)
GREEN = (g > r * 0.9) & (g > b * 1.15) & (g > 35)
ROWS = [10, 77, 147, 216, 286, 346]                 # tile grout (main wall)
COLS = [750, 813, 877, 940, 1005, 1068]

CLEAN = np.zeros((H, W), bool)
for rc in [(762, 0, 810, 118), (806, 234, 1012, 296), (692, 240, 782, 398), (1026, 472, 1116, 694),
           (702, 472, 782, 760), (1080, 0, 1116, 52)]:
    CLEAN |= A.rect(*rc)
CLEAN &= WALL | A.shrink(A.grow(WALL, 5), 5)
def tiles(img, m, rows=(), cols=(), seed=1):
    out = A.harmonic(img, m, WALL & ~m)
    out[m] += A.noise((H, W), 1.8, seed=seed)[m][:, None]
    for y in rows:
        for k, f in ((0, .88), (1, .88), (2, 1.05)):
            sel = m & (yy == y + k); out[sel] *= f
    for x in cols:
        for k, f in ((0, .88), (1, .88), (2, 1.05)):
            sel = m & (xx == x + k); out[sel] *= f
    return out
def _unused(img, m, rows=ROWS, cols=COLS):
    out = A.harmonic(img, m, WALL & ~m)
    out[m] += A.noise((H, W), 1.6)[m][:, None]
    for y in rows:
        for k, f in ((0, .9), (1, .92), (3, 1.04)):
            sel = m & (yy == y + k); out[sel] *= f
    for x in cols:
        for k, f in ((0, .9), (1, .92), (3, 1.04)):
            sel = m & (xx == x + k); out[sel] *= f
    return out

# ---------- cuadro: the picture disappears (candles and plant stay) ----------
pic = A.poly([(806, 16), (956, 16), (956, 198), (806, 198)])
for c in [(782,150,835,203),(836,143,869,203)]: pic &= ~A.rect(*c)   # candles in front
flame = (r > 200) & (g > 150) & (b < 170) & (r - b > 60)
flame = A.grow(A.clean(flame & A.rect(790, 110, 860, 152), 3, 0), 3)
pic &= ~flame
pic &= ~(GREEN & A.rect(940, 0, 960, 200))            # plant leaves in front
shelf_top = A.rect(812, 186, 952, 200)
keep = shelf_top & ~((r < 120) & (g < 80))            # berries garland on the shelf stays
pic &= ~keep
out = tiles(base, pic, rows=(75, 140), cols=(832, 894))
A.save('cuadro', out, pic, [[812, 22, 138, 100]], label='cuadro', feather=0.8)

# ---------- botes: the two bottles in the shower disappear ----------
bot = A.rect(1300, 272, 1398, 369)
bot &= ~WALL | A.grow(~WALL & A.rect(1305, 278, 1395, 369), 3)
bot = A.grow(A.clean(bot, 7, 3), 5) & A.rect(1298, 268, 1400, 370)
shelf_rows = A.rect(1290, 366, 1410, 390)
bot &= ~shelf_rows
bot |= A.rect(1310, 356, 1399, 368)
out = tiles(base, bot, rows=(288, 347), cols=(1313, 1386), seed=2)
rest = A.rect(1310, 366, 1399, 374) & (GREEN | ((r > 110) & (g < 70) & (r > 1.8 * g)))
for y, x in zip(*np.where(rest)): out[y, x] = base[y, 1306]
bot |= rest
A.save('botes', out, bot, [[1300, 270, 100, 100]], label='botes de la ducha', feather=0.8)

# ---------- toalla: the towel disappears (the ring stays) ----------
def fy_towel(x, y):
    return np.interp(y, [0, 290, 405, 462, 640, H], [0, 290, 400, 452, 632, H - 8])
src = A.remap(alt, lambda x, y: x, fy_towel)
tw = A.rect(197, 366, 302, 634)
gold = (r > 150) & (g > 100) & (b < 110) & (r - b > 80) & (yy < 374)
tw &= ~A.grow(gold & A.rect(200, 280, 290, 374), 3)
srcm = A.pixelize(src, 3, 0.6)
out = A.seamless(srcm, tw)
A.save('toalla', out, tw, [[200, 372, 98, 258]], label='toalla', feather=2.0)

# ---------- mueble: both doors of the sink cabinet open (inside from the new picture) ----------
OPEN_Q = [(346, 595), (650, 595), (650, 808), (346, 808)]
ALT_Q = [(398, 566), (646, 566), (646, 796), (398, 796)]
inside = A.quadwarp(alt, ALT_Q, OPEN_Q)
om = A.poly(OPEN_Q)
wood = A.rect(346, 595, 650, 808)
inside = A.match(inside, wood, om, strength=0.8) * 0.82        # same wood tones, a bit darker inside
inside = A.pixelize(inside, 3, 0.6)
out = base.copy(); out[om] = inside[om]
edge = om & ~A.shrink(om, 5); out[edge] *= 0.55              # shadow along the opening
pl = A.door_panel(out, [(346, 595), (498, 595), (498, 808), (346, 808)], 'l', openness=0.36)
pr = A.door_panel(out, [(499, 595), (650, 595), (650, 808), (499, 808)], 'r', openness=0.36)
A.save('mueble', out, om | pl | pr, [[346, 595, 304, 213]], label='mueble del lavabo', feather=0)

# ---------- tapa: the toilet lid opens (lid + seat from the new picture, fitted to this toilet) ----------
def fx_t(x, y): return 920 + (x - 907.5) / 1.236
def fy_t(x, y): return np.where(y < 628, 625 - (628 - y) / 0.78, 625 + (y - 628) / 0.90)
src = A.remap(alt, fx_t, fy_t)
cover = A.grow(A.clean(A.rect(795, 618, 1022, 708) & ((r > 110) & (r > 1.5 * g) | (base.mean(2) < 70)), 5, 3), 3)
lid = A.ellipse(896, 572, 92, 70) & (yy >= 503)
seat = A.ellipse(907, 670, 110, 44)
tm = cover | lid | seat
porc = A.rect(822, 716, 1000, 792)
src = A.match(src, porc, porc, strength=0.9)
src = A.pixelize(src, 3, 0.55)
out = A.seamless(src, tm, known=~A.rect(780, 495, 1030, 520))     # keep the tank top crisp
A.save('tapa', out, tm, [[800, 625, 215, 85]], label='tapa del váter', feather=1.0)

# ---------- papelera: the bin lid opens ----------
SX, SY = 1.17, 0.87
def fx_b(x, y): return 1083 + (x - 1071) / SX
def fy_b(x, y): return 655 + (y - 708) / SY
src = A.remap(alt, fx_b, fy_b)
ALID = [(1046,664),(1049,612),(1060,578),(1085,562),(1110,570),(1123,600),(1124,664)]
blid = A.poly([(1071 + (ax - 1083) * SX, 708 + (ay - 655) * SY) for ax, ay in ALID])
btop = A.rect(1026, 694, 1117, 730)
bm = blid | btop
metal = A.rect(1040, 735, 1105, 815)
src = A.match(src, metal, metal, strength=0.9)
src = A.pixelize(src, 3, 0.55)
out = A.seamless(src, bm)
A.save('papelera', out, bm, [[1028, 696, 88, 132]], label='papelera', feather=1.0)

# ---------- flor: the poinsettia leaves the sink and appears on the floor ----------
FPOLY = [(392,298),(412,300),(445,312),(468,333),(486,372),(482,392),(458,410),(452,432),(450,512),
         (356,512),(352,432),(332,420),(312,392),(318,345),(345,322),(375,305)]
fpoly = A.grow(A.poly(FPOLY), 7)
petal = (r > 120) & (g < 105) & (r > 1.55 * g)
leaf = GREEN & (g > 30)
core = (petal | leaf) & fpoly
core = A.clean(core, 5, 0)
outline = A.grow(core, 3) & (base.mean(2) < 70) & fpoly
pot = A.poly([(354,424),(452,424),(450,504),(356,504)])
yellow = (r > 180) & (g > 140) & (b < 90) & A.rect(380, 330, 420, 360)   # flower centre
flower = A.clean(core | outline | yellow, 7, 0) & fpoly
flower = (flower & ~(A.rect(300, 280, 382, 440) & ~A.clean(core, 3, 0))) | pot
flower = A.clean(flower, 3, 3)
from scipy import ndimage
flower = ndimage.binary_fill_holes(flower)
lab, n = ndimage.label(flower); sizes = ndimage.sum(flower, lab, range(1, n + 1))
flower = np.isin(lab, 1 + np.where(sizes >= 400)[0])
rm = A.grow(flower, 5)
out = base.copy()
# 1) left garland strip + mirror above the garland bottom: copied from the same columns 120 px higher
upper = rm & A.rect(300, 280, 500, 386)
src = A.affine(base, dy=120)
out = np.where(upper[..., None], src, out)
# 2) mirror bottom frame: each row copied from the clean frame on the right
frame = rm & A.rect(380, 384, 500, 392)
for y in range(384, 392): out[y, frame[y]] = base[y, 590:600].mean(0)
# 3) bottom garland: the vertical garland on the left, turned on its side
gar = rm & A.rect(380, 392, 500, 432)
strip = base[150:265, 325:380]                         # 115 x 55
rot = cv2.rotate(strip, cv2.ROTATE_90_COUNTERCLOCKWISE) # 55 x 115
rot = cv2.resize(rot, (125, 41), interpolation=cv2.INTER_NEAREST)
canvas = base.copy(); canvas[392:433, 378:503] = rot
out = np.where(gar[..., None], canvas, out)
# left vertical garland down to the corner
lgar = rm & A.rect(300, 386, 380, 432)
out = np.where(lgar[..., None], src, out)
# 4) backsplash tiles and the counter
splash = rm & A.rect(300, 432, 500, 497)
counter = rm & A.rect(300, 497, 500, 530)
lightwall = (base.mean(2) > 150) & ~rm
# horizontal things (wall under the garland, the counter): each row continues from the clean column x=462..468
rows_m = splash | counter
for y in range(432, 530):
    sel = rows_m[y]
    if sel.any(): out[y, sel] = base[y, 462:469].mean(0)
out[splash] += A.noise((H, W), 1.4, seed=4)[splash][:, None]
done = upper | frame | gar | lgar | rows_m
blend = A.seamless(out, done)                        # soften the copied parts' borders
out[done] = blend[done]
A.save('flor_lavabo', out, rm, [[318, 298, 168, 216]], group='flor', label='flor', feather=1.0)

# on the floor: the very same flower, moved down-left in front of the cabinet
DX, DY = -100, 352
mv = A.affine(base, dx=DX, dy=DY, interp=cv2.INTER_NEAREST)
fm = A.warp_mask(flower, dx=DX, dy=DY)
shadow = np.zeros((H, W), np.float32)
cv2.ellipse(shadow, (403 + DX, 514 + DY), (58, 10), 0, 0, 360, 1, -1)
shadow = cv2.GaussianBlur(shadow, (0, 0), 5) * 0.5
out = base * (1 - shadow[..., None]); out[fm] = mv[fm]
A.save('flor_suelo', out, np.maximum(fm.astype(np.float32), shadow), [[230, 660, 150, 210]], group='flor', label='flor', feather=0.6)

# ---------- planta: the hanging plant slides to the left along the shelf ----------
REG = A.rect(942, 0, 1120, 405)
shelf = A.rect(930, 196, 1082, 233)
bracket = A.rect(1010, 228, 1042, 295)
tree = A.rect(892, 293, 1004, 486) & ~WALL
picframe = A.rect(900, 18, 953, 198) & ~GREEN
plant = REG & ~WALL & ~(shelf | bracket | tree | picframe)
plant |= REG & GREEN & (shelf | bracket)
plant = A.clean(plant, 3, 0)
from scipy import ndimage
lab, n = ndimage.label(plant); sizes = ndimage.sum(plant, lab, range(1, n + 1))
plant = np.isin(lab, 1 + np.where(sizes >= 25)[0])
pm = A.grow(plant, 3) & REG & ~tree
# where the plant was: wall tiles, the shelf and its bracket come back
out = base.copy()
wallpart = pm & ~shelf & ~bracket
out = tiles(out, wallpart, rows=(77, 143, 286, 346), cols=(1004, 1066), seed=5)
for y in range(196, 233):
    sel = pm[y] & shelf[y]
    if sel.any():
        out[y, sel] = base[y, 918:930].mean(0)
        for x in np.where(sel)[0]:
            if x >= 1064: out[y, x] = base[y, 755 + (1079 - x)]     # shelf end, mirrored from the left end
brk = pm & bracket
src_b = A.affine(base, dx=230)                                       # the left bracket, same shape
srcwall = ~WALL
for y, x in zip(*np.where(brk)):
    out[y, x] = src_b[y, x] if srcwall[y, x - 230] else out[y, x]
# the plant itself, 85 px to the left; candles, tree and snowman stay in front of it
DX = -85
mv = A.affine(base, dx=DX, interp=cv2.INTER_NEAREST)
dm = A.warp_mask(plant, dx=DX)
front = A.rect(780, 140, 872, 205) | (A.rect(780, 290, 1010, 500) & ~WALL)
fl = (r > 200) & (g > 150) & (b < 170) & A.rect(790, 110, 860, 152)
dm &= ~front & ~A.grow(fl, 3)
out[dm] = mv[dm]
A.save('planta', out, pm | dm, [[945, 40, 175, 360]], label='planta', feather=0.8)

if len(sys.argv) > 1:
    A.preview(sys.argv[1])
A.write()
