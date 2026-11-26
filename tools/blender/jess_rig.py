# Esqueleto de Jess (la pirata fantasma con su cañón). glTF: y arriba, frente +z, altura 1.
# El personaje está centrado en x≈0.08. El cañón y los dos brazos que lo sujetan forman una sola pieza ('gun').
import numpy as np
CX = 0.08
ROOT = (CX, 0.0, -0.05)
BONES = {
 'hips':  ((CX, 0.20, -0.08), (CX, 0.33, -0.08), None),
 'chest': ((CX, 0.33, -0.08), (CX, 0.54, -0.08), 'hips'),
 'head':  ((CX, 0.54, -0.08), (CX, 0.97, -0.10), 'chest'),
 'gun':   ((CX + 0.02, 0.47, -0.05), (CX + 0.04, 0.50, 0.46), 'chest'),
 'leg.R': ((CX - 0.055, 0.17, -0.06), (CX - 0.055, 0.0, -0.02), 'hips'),
 'leg.L': ((CX + 0.085, 0.17, -0.06), (CX + 0.085, 0.0, -0.02), 'hips'),
}
def sig(x): return 1 / (1 + np.exp(-x))
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    W = np.zeros((len(P), len(names))) + 1e-9
    # cañón + manos + antebrazos: por delante del torso a la altura del pecho
    gun = sig((z - 0.045) / 0.02) * sig((0.625 - y) / 0.02) * sig((y - 0.33) / 0.02)
    W[:, I('gun')] += gun
    rest = 1 - gun
    head = sig((y - 0.545) / 0.025)
    W[:, I('head')] += rest * head
    low = sig((0.215 - y) / 0.02)                           # botas y bajos del abrigo
    feet = sig((z + 0.20) / 0.03)                           # las llamas de atrás no siguen a las piernas, van con las caderas
    W[:, I('leg.R')] += rest * (1 - head) * low * feet * (x < CX + 0.01)
    W[:, I('leg.L')] += rest * (1 - head) * low * feet * (x >= CX + 0.01)
    W[:, I('hips')] += rest * (1 - head) * low * (1 - feet)
    mid = rest * (1 - head) * (1 - low)
    W[:, I('chest')] += mid * sig((y - 0.36) / 0.03)
    W[:, I('hips')] += mid * (1 - sig((y - 0.36) / 0.03))
    W /= W.sum(1, keepdims=True)
    return names, W
