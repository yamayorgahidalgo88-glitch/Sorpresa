# Esqueleto de Wyrex (glTF: y arriba, frente +z, altura 1). Esqueleto con cráneo de dragón y cuernos de llama.
# Lanza el hueso con la mano derecha (x negativa).
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':   ((0.0, 0.12, 0.0), (0.0, 0.26, 0.0), None),
 'chest':  ((0.0, 0.26, 0.0), (0.0, 0.52, 0.0), 'hips'),
 'head':   ((0.0, 0.54, 0.0), (0.0, 0.92, 0.0), 'chest'),
 'arm.R':  ((-0.16, 0.48, 0.0), (-0.24, 0.33, 0.02), 'chest'),
 'hand.R': ((-0.24, 0.33, 0.02), (-0.27, 0.22, 0.04), 'arm.R'),
 'arm.L':  ((0.16, 0.48, 0.0), (0.25, 0.33, 0.02), 'chest'),
 'hand.L': ((0.25, 0.33, 0.02), (0.28, 0.22, 0.04), 'arm.L'),
 'leg.R':  ((-0.07, 0.15, 0.0), (-0.08, 0.0, 0.02), 'hips'),
 'leg.L':  ((0.08, 0.15, 0.0), (0.09, 0.0, 0.02), 'hips'),
}
def seg_dist(P, a, b):
    a = np.array(a); b = np.array(b); d = b - a; t = np.clip(((P - a) @ d) / (d @ d), 0, 1); return np.linalg.norm(P - (a + t[:, None] * d), axis=1)
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    D = np.stack([seg_dist(P, BONES[n][0], BONES[n][1]) for n in names], 1)
    W = np.exp(-(D / 0.045) ** 2) + 1e-9
    head = y > 0.56
    torso = (np.abs(x) < 0.13) & (y > 0.16) & (y <= 0.56)
    for n in ('arm.R', 'hand.R', 'arm.L', 'hand.L'): W[torso, I(n)] *= 0.02
    low = (np.abs(x) < 0.18) & (y < 0.36)   # llamas de la cadera: no van con los brazos
    for n in ('arm.R', 'hand.R', 'arm.L', 'hand.L'): W[low, I(n)] = 0
    legs = y < 0.15
    for n in names:
        if not n.startswith('leg') and n != 'hips': W[legs, I(n)] *= 0.05
    W[legs & (x > 0), I('leg.R')] = 0; W[legs & (x <= 0), I('leg.L')] = 0
    W[head] = 0; W[head, I('head')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
