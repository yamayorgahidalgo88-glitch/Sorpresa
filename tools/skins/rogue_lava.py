# Skin "Rogue de lava": recolorea la textura de rogue_anim.glb (ropa y piedra oscuras, brillos naranjas y grietas de lava)
# uso: python3 rogue_lava.py textura_original.png salida.jpg
import sys, numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); A = np.asarray(im).astype(np.float32); H, W = A.shape[:2]
hsv = np.asarray(im.convert('HSV')).astype(np.float32); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
blue = (h > 105) & (h < 185) & (s > 55)                       # ropa y escudo azules / turquesa
glow = (h > 105) & (h < 145) & (v > 175) & (s > 90)            # brillos turquesa -> lava
grey = (s < 38) & (v > 45) & (v < 175)                         # puño de piedra gris
hair = ((h < 14) | (h > 240)) & (v < 105) & (s > 60)            # pelo / cuero granate oscuro
dark = (blue | grey | hair) & ~glow
out = A.copy()
lum = A.mean(2, keepdims=True) / 255
base = np.array([62, 40, 38], np.float32)                      # carbón cálido
out[dark] = (base * (0.55 + 0.9 * lum[dark]))
out[hair] = (np.array([70, 34, 24], np.float32) * (0.6 + 0.8 * lum[hair]))
# brillos -> naranja/amarillo
g = np.clip((v[glow] - 150) / 105, 0, 1)[:, None]
out[glow] = np.array([255, 120, 20]) * (1 - g) + np.array([255, 230, 120]) * g
# grietas de lava (Voronoi) solo en las zonas oscuras
rng = np.random.default_rng(3); P = rng.uniform(0, [W, H], (1400, 2))
yy, xx = np.mgrid[0:H, 0:W]; d, _ = cKDTree(P).query(np.c_[xx.ravel(), yy.ravel()], k=2)
edge = (d[:, 1] - d[:, 0]).reshape(H, W)
wob = ndimage.gaussian_filter(rng.standard_normal((H, W)), 6) * 9
crack = np.clip(1 - (edge + wob * .25) / 2.4, 0, 1)
patch = ndimage.gaussian_filter(rng.standard_normal((H // 8, W // 8)), 4); patch = np.kron(patch, np.ones((8, 8)))[:H, :W]
crack *= (patch > -0.02)                                        # no todo agrietado
crack *= dark
halo = ndimage.gaussian_filter(crack, 5) * 1.8
lava_core = np.array([255, 215, 90], np.float32); lava = np.array([255, 110, 15], np.float32)
out = out * (1 - np.clip(halo, 0, .8)[..., None]) + lava * np.clip(halo, 0, .8)[..., None]
out = out * (1 - crack[..., None]) + lava_core * crack[..., None]
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst, quality=88)
print('ok', dst, 'oscuro %', round(dark.mean() * 100, 1), 'brillos %', round(glow.mean() * 100, 2))
