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
