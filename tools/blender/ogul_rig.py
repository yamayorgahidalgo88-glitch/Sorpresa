# Esqueleto de Ogul (mago-ojo con túnica, capucha y mangas enormes). glTF: y arriba, frente +z, altura 1.
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':  ((0.0, 0.12, 0.0), (0.0, 0.40, 0.0), None),
 'head':  ((0.0, 0.52, 0.0), (0.0, 0.97, -0.05), 'hips'),
 'arm.R': ((-0.22, 0.42, 0.0), (-0.38, 0.28, 0.03), 'hips'),
 'arm.L': ((0.22, 0.42, 0.0), (0.38, 0.28, 0.03), 'hips'),
}
def sig(x): return 1 / (1 + np.exp(-x))
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    W = np.zeros((len(P), len(names))) + 1e-9
    armR = sig((-x - 0.20) / 0.03) * sig((0.52 - y) / 0.03) * sig((y - 0.08) / 0.03)
    armL = sig((x - 0.20) / 0.03) * sig((0.52 - y) / 0.03) * sig((y - 0.08) / 0.03)
    W[:, I('arm.R')] += armR; W[:, I('arm.L')] += armL
    rest = (1 - armR) * (1 - armL)
    head = sig((y - 0.54) / 0.03)
    W[:, I('head')] += rest * head
    W[:, I('hips')] += rest * (1 - head)
    W /= W.sum(1, keepdims=True)
    return names, W
