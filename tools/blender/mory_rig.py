# Esqueleto de Mory (pingüino soldado en su tanque). glTF: y arriba, frente +z, altura 1.
# 'hips' = casco y orugas, 'turret' = torreta con el cañón (+z), 'chest' = cuerpo del pingüino y mochila, 'head' = cabeza con casco.
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':   ((0.0, 0.12, -0.05), (0.0, 0.28, -0.05), None),
 'turret': ((0.0, 0.43, -0.04), (0.0, 0.46, 0.40), 'hips'),
 'chest':  ((0.0, 0.50, -0.10), (0.0, 0.70, -0.10), 'hips'),
 'head':   ((0.0, 0.70, -0.10), (0.0, 0.98, -0.10), 'chest'),
}
# Las 6 ruedas de las orugas (3 por lado) son piezas sueltas que giran sobre el eje X.
WHEEL_Z = (0.14, -0.06, -0.23); WHEEL_Y = 0.122; WHEEL_X = 0.215
WHEELS = {}
for _side, _sx in (('R', -1), ('L', 1)):
    for _i, _z in enumerate(WHEEL_Z):
        WHEELS[f'wheel{_side}{_i + 1}'] = (_sx * WHEEL_X, WHEEL_Y, _z, _sx)
for _n, (_x, _y, _z, _sx) in WHEELS.items():
    BONES[_n] = ((_x, _y, _z), (_x + _sx * 0.05, _y, _z), 'hips')
def _wheel_faces(w):
    cx, cy, cz, sx = WHEELS[w]
    def fn(C, lum):   # cara exterior de la rueda (gris), sin la oruga negra
        return (C[:, 0] * sx > 0.255) & (((C[:, 1] - cy) ** 2 + (C[:, 2] - cz) ** 2) < 0.074 ** 2)
    return fn
KEEP_LARGEST = False
SPLITS = [(w, 'hips', _wheel_faces(w)) for w in WHEELS]
def sig(x): return 1 / (1 + np.exp(-x))
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    W = np.zeros((len(P), len(names))) + 1e-9
    # casco y orugas: todo lo bajo
    W[:, I('hips')] += sig((0.31 - y) / 0.015)
    # torreta y cañón: por encima del casco y por delante del pingüino
    tur = sig((y - 0.29) / 0.015) * sig((0.585 - y) / 0.015) * sig((z + 0.12) / 0.03)
    W[:, I('turret')] += tur
    # cabeza (casco) por encima del cuello
    W[:, I('head')] += sig((y - 0.69) / 0.02)
    # cuerpo del pingüino y mochila: lo que queda entre la torreta y la cabeza
    body = sig((y - 0.29) / 0.015) * sig((0.70 - y) / 0.02) * (1 - tur)
    W[:, I('chest')] += body
    W /= W.sum(1, keepdims=True)
    return names, W
