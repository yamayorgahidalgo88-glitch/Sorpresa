"""Genera los iconos de la app (PWA): escudo dorado con las letras CE sobre un campo de fútbol oscuro."""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
OUT = sys.argv[1] if len(sys.argv) > 1 else 'icons'
S = 2048
FONT = '/usr/share/fonts/truetype/freefont/FreeSansBoldOblique.ttf'

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gradient(size, top, bot):
    g = Image.new('RGB', (1, size))
    for y in range(size): g.putpixel((0, y), lerp(top, bot, y / (size - 1)))
    return g.resize((size, size))

def shield_mask(size, w, h, cx, top):
    m = Image.new('L', (size, size), 0); d = ImageDraw.Draw(m)
    L, R, T = cx - w / 2, cx + w / 2, top
    sh = h * 0.50
    n = 80
    right = [(R, T + sh * 0.0 + h * 0.05)] + [(R, T + sh)]
    for i in range(1, n + 1):
        t = i / n; right.append((cx + (w / 2) * (1 - t ** 1.8), T + sh + (h - sh) * t))
    left = [(2 * cx - x, y) for x, y in reversed(right)]
    pts = [(L, T + h * 0.05), (cx, T)] + [(R, T + h * 0.05)] + right[1:] + left[:-1]
    d.polygon(pts, fill=255)
    return m

def make(scale_shield):
    bg = gradient(S, (22, 30, 44), (9, 12, 18)).convert('RGBA')
    ov = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    # campo: franjas, círculo central y línea de medio campo, muy tenues
    for i in range(0, S, 256):
        if (i // 256) % 2 == 0: d.rectangle([0, i, S, i + 255], fill=(255, 255, 255, 9))
    lw = 14; col = (255, 255, 255, 40)
    d.ellipse([S / 2 - 760, S / 2 - 760, S / 2 + 760, S / 2 + 760], outline=col, width=lw)
    d.line([0, S / 2, S, S / 2], fill=col, width=lw)
    bg.alpha_composite(ov)
    # escudo
    w, h = 1080 * scale_shield, 1300 * scale_shield
    cx, top = S / 2, (S - h) / 2 + 20 * scale_shield
    m = shield_mask(S, w, h, cx, top)
    shadow = Image.new('RGBA', (S, S), (0, 0, 0, 0)); shadow.paste((0, 0, 0, 150), mask=m)
    shadow = shadow.filter(ImageFilter.GaussianBlur(40)).transform((S, S), Image.AFFINE, (1, 0, 0, 0, 1, -28))
    bg.alpha_composite(shadow)
    gold = gradient(S, (255, 226, 130), (196, 138, 30)).convert('RGBA')
    bg.paste(gold, mask=m)
    # borde interior oscuro y relleno azul noche
    inner = m.filter(ImageFilter.MinFilter(int(44 * scale_shield) // 2 * 2 + 1))
    inner2 = inner.filter(ImageFilter.MinFilter(int(30 * scale_shield) // 2 * 2 + 1))
    bg.paste(gradient(S, (16, 22, 34), (8, 11, 18)).convert('RGBA'), mask=inner)
    ring = ImageDraw.Draw(bg)
    bg.paste(gradient(S, (255, 226, 130), (200, 142, 34)).convert('RGBA'), mask=Image.eval(ImageChops_sub(inner, inner2), lambda v: v))
    # letras CE
    f = ImageFont.truetype(FONT, int(560 * scale_shield))
    txt = 'CE'
    tw = ring.textlength(txt, font=f)
    tx, ty = cx - tw / 2, top + h * 0.12
    tm = Image.new('L', (S, S), 0); ImageDraw.Draw(tm).text((tx, ty), txt, font=f, fill=255)
    sh2 = Image.new('RGBA', (S, S), (0, 0, 0, 0)); sh2.paste((0, 0, 0, 160), mask=tm)
    bg.alpha_composite(sh2.filter(ImageFilter.GaussianBlur(10)).transform((S, S), Image.AFFINE, (1, 0, 0, 0, 1, -10)))
    bg.paste(gradient(S, (255, 236, 160), (232, 160, 40)).convert('RGBA'), mask=tm)
    # pelota pequeña bajo las letras como detalle, más una línea fina de "pizarra táctica"
    y0 = top + h * 0.72
    ImageDraw.Draw(bg).line([cx - w * 0.22, y0, cx + w * 0.22, y0], fill=(242, 177, 52, 200), width=int(10 * scale_shield))
    r = 36 * scale_shield
    for dx in (-0.12, 0, 0.12):
        ImageDraw.Draw(bg).ellipse([cx + dx * w - r, y0 - r - 52 * scale_shield, cx + dx * w + r, y0 + r - 52 * scale_shield],
                                   fill=(242, 177, 52, 235) if dx == 0 else (242, 177, 52, 130))
    return bg.convert('RGB')

from PIL import ImageChops
def ImageChops_sub(a, b): return ImageChops.subtract(a, b)

os.makedirs(OUT, exist_ok=True)
full = make(1.0)
mask = make(0.74)   # versión "maskable": el escudo queda dentro de la zona segura (80 % central)
def save(im, name, px): im.resize((px, px), Image.LANCZOS).save(os.path.join(OUT, name), optimize=True)
save(full, 'icon-512.png', 512); save(full, 'icon-192.png', 192); save(full, 'apple-touch-icon.png', 180)
save(mask, 'maskable-512.png', 512); save(mask, 'maskable-192.png', 192); save(full, 'favicon-32.png', 32)
print('iconos listos en', OUT)
