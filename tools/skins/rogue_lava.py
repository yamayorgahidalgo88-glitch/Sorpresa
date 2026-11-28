# Skin "Rogue de lava": recolorea la textura de rogue_anim.glb.
# Ropa, pelo y puño de piedra en carbón oscuro con grietas de lava roja-anaranjada (núcleo amarillo, halo rojo),
# máscara de piedra beige agrietada, ojos encendidos y brillos turquesa pasados a lava. Los adornos dorados se quedan.
# uso: python3 rogue_lava.py textura_original.png salida.jpg
import sys, numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); A = np.asarray(im).astype(np.float32); H, W = A.shape[:2]
hsv = np.asarray(im.convert('HSV')).astype(np.float32); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
lum = A.mean(2, keepdims=True) / 255
blue = (h > 105) & (h < 185) & (s > 55)                       # ropa y escudo azules / turquesa
glow = (h > 105) & (h < 145) & (v > 175) & (s > 90)            # brillos turquesa -> lava
grey = (s < 38) & (v > 45) & (v < 170)                         # puño de piedra gris
hair = ((h < 14) | (h > 240)) & (v < 105) & (s > 60)            # pelo / cuero granate oscuro
eyes = (s < 9) & (v > 243)                                     # ojos blancos
mask = (s >= 9) & (s < 60) & (v > 170) & ((h < 30) | (h > 235)) # máscara de piedra
dark = (blue | grey | hair) & ~glow
out = A.copy()
out[dark] = np.array([46, 32, 34], np.float32) * (0.6 + 0.9 * lum[dark])
out[hair] = np.array([58, 30, 24], np.float32) * (0.6 + 0.9 * lum[hair])
out[mask] = np.array([214, 184, 146], np.float32) * (0.55 + 0.5 * lum[mask])
out[eyes] = np.array([255, 214, 90], np.float32)
g = np.clip((v[glow] - 150) / 105, 0, 1)[:, None]
out[glow] = np.array([235, 60, 20]) * (1 - g) + np.array([255, 170, 50]) * g
# grietas (Voronoi), finas y bien definidas
rng = np.random.default_rng(3)
def cracks(n, width, seed):
    r = np.random.default_rng(seed); P = r.uniform(0, [W, H], (n, 2))
    yy, xx = np.mgrid[0:H, 0:W]; d, _ = cKDTree(P).query(np.c_[xx.ravel(), yy.ravel()], k=2)
    e = (d[:, 1] - d[:, 0]).reshape(H, W) + ndimage.gaussian_filter(r.standard_normal((H, W)), 5) * 2.2
    return np.clip(1 - e / width, 0, 1) ** 0.6
patch = ndimage.gaussian_filter(rng.standard_normal((H // 8, W // 8)), 4); patch = np.kron(patch, np.ones((8, 8)))[:H, :W]
lava = cracks(900, 2.2, 3) * (patch > -0.05) * dark
core = np.clip((lava - .55) / .45, 0, 1)
halo = np.clip(ndimage.gaussian_filter(lava, 2.5) * 2.2, 0, .85) * dark
out = out * (1 - halo[..., None]) + np.array([215, 40, 15], np.float32) * halo[..., None]          # halo rojo
out = out * (1 - lava[..., None]) + np.array([255, 105, 20], np.float32) * lava[..., None]          # lava naranja-roja
out = out * (1 - core[..., None]) + np.array([255, 215, 90], np.float32) * core[..., None]          # núcleo amarillo
# grietas de la máscara: líneas oscuras finas
mc = cracks(500, 1.4, 7) * (patch > .25) * mask
out = out * (1 - .75 * mc[..., None]) + np.array([70, 50, 40], np.float32) * (.75 * mc[..., None])
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst, quality=90)
print('ok', dst, 'oscuro %', round(dark.mean() * 100, 1), 'máscara %', round(mask.mean() * 100, 2), 'ojos %', round(eyes.mean() * 100, 2))
