# Fotos de perfil: recorta la cara de cada personaje de su imagen <tipo>_pose.webp -> assets/ava/<tipo>.webp (256x256)
# AJUSTE[tipo] = (centro x, centro y, lado del cuadrado) en fracciones del recuadro del personaje (sin el fondo transparente)
import sys
from PIL import Image
AJUSTE = {
 'bushi': (.56, .33, .70), 'bolab': (.50, .42, .82), 'ogul': (.50, .42, .72), 'rogue': (.48, .22, .56),
 'osko': (.60, .24, .58), 'gloop': (.50, .30, .74), 'tanko': (.40, .24, .52), 'denton': (.46, .24, .64),
 'pomona': (.40, .22, .56), 'jess': (.44, .28, .58), 'ayew': (.48, .29, .52), 'paira': (.50, .36, .58),
 'jaspe': (.50, .29, .64), 'peipo': (.46, .33, .62), 'orion': (.55, .20, .52), 'sevora': (.56, .29, .60),
}
base = sys.argv[1] if len(sys.argv) > 1 else 'bestiario/assets'
for t, (cx, cy, sd) in AJUSTE.items():
    im = Image.open(f'{base}/{t}_pose.webp').convert('RGBA'); x0, y0, x1, y1 = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    w, h = x1 - x0, y1 - y0; s = sd * w; X = x0 + cx * w; Y = y0 + cy * h
    box = (round(X - s / 2), round(Y - s / 2), round(X + s / 2), round(Y + s / 2))
    out = Image.new('RGBA', (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0)); out.paste(im.crop(box), (0, 0))
    out.resize((256, 256), Image.LANCZOS).save(f'{base}/ava/{t}.webp', quality=90, method=6)
print('ok', len(AJUSTE))
