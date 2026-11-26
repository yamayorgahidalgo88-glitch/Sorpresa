# Esqueleto de Rogue (guerrero enmascarado con escudo y puño de piedra). glTF: y arriba, frente +z, altura 1.
# arm.R (x<0) = brazo del puño de piedra; arm.L (x>0) = brazo del escudo (el escudo va con él).
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':  ((0.0, 0.22, 0.0), (0.0, 0.30, 0.0), None),
 'chest': ((0.0, 0.30, 0.0), (0.0, 0.52, 0.0), 'hips'),
 'head':  ((0.0, 0.52, 0.0), (0.0, 0.97, 0.0), 'chest'),
 'arm.R': ((-0.20, 0.50, 0.0), (-0.32, 0.30, 0.03), 'chest'),
 'arm.L': ((0.20, 0.50, 0.0), (0.30, 0.32, 0.05), 'chest'),
 'leg.R': ((-0.10, 0.20, 0.0), (-0.11, 0.0, 0.01), 'hips'),
 'leg.L': ((0.10, 0.20, 0.0), (0.11, 0.0, 0.01), 'hips'),
}
def sig(x): return 1 / (1 + np.exp(-x))
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    W = np.zeros((len(P), len(names))) + 1e-9
    armR = sig((-x - 0.17) / 0.05) * sig((0.60 - y) / 0.03)
    armL = sig((x - 0.19) / 0.025) * sig((0.60 - y) / 0.03)
    W[:, I('arm.R')] += armR; W[:, I('arm.L')] += armL
    rest = (1 - armR) * (1 - armL)
    head = sig((y - 0.55) / 0.025)
    low = sig((0.20 - y) / 0.02)
    W[:, I('head')] += rest * head
    W[:, I('leg.R')] += rest * (1 - head) * low * (x < 0)
    W[:, I('leg.L')] += rest * (1 - head) * low * (x >= 0)
    mid = rest * (1 - head) * (1 - low)
    ch = sig((y - 0.31) / 0.02)
    W[:, I('chest')] += mid * ch
    W[:, I('hips')] += mid * (1 - ch)
    W /= W.sum(1, keepdims=True)
    return names, W
