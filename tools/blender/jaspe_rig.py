# Esqueleto de Jaspe, gólem de amatista (glTF: y arriba, frente +z, altura 1). Puños enormes a los lados.
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':   ((0.0, 0.16, 0.0), (0.0, 0.32, 0.0), None),
 'chest':  ((0.0, 0.32, 0.0), (0.0, 0.58, 0.0), 'hips'),
 'head':   ((0.0, 0.60, 0.0), (0.0, 1.0, 0.0), 'chest'),
 'arm.R':  ((-0.19, 0.58, 0.0), (-0.28, 0.46, 0.02), 'chest'),
 'hand.R': ((-0.28, 0.46, 0.02), (-0.32, 0.30, 0.03), 'arm.R'),
 'arm.L':  ((0.19, 0.58, 0.0), (0.28, 0.46, 0.02), 'chest'),
 'hand.L': ((0.28, 0.46, 0.02), (0.32, 0.30, 0.03), 'arm.L'),
 'leg.R':  ((-0.1, 0.18, 0.0), (-0.12, 0.0, 0.02), 'hips'),
 'leg.L':  ((0.1, 0.18, 0.0), (0.12, 0.0, 0.02), 'hips'),
}
def seg_dist(P, a, b):
    a = np.array(a); b = np.array(b); d = b - a; t = np.clip(((P - a) @ d) / (d @ d), 0, 1); return np.linalg.norm(P - (a + t[:, None] * d), axis=1)
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    D = np.stack([seg_dist(P, BONES[n][0], BONES[n][1]) for n in names], 1)
    W = np.exp(-(D / 0.07) ** 2) + 1e-9
    fistR = (x < -0.22) & (y < 0.5) & (y > 0.15); fistL = (x > 0.22) & (y < 0.5) & (y > 0.15)
    head = (y > 0.63) & ~fistR & ~fistL
    torso = (np.abs(x) < 0.17) & (y > 0.18) & (y <= 0.63)
    for n in ('arm.R', 'hand.R', 'arm.L', 'hand.L'): W[torso, I(n)] *= 0.05
    legs = (y < 0.18) & (np.abs(x) < 0.24)
    for n in names:
        if not n.startswith('leg') and n != 'hips': W[legs, I(n)] *= 0.05
    W[legs & (x > 0), I('leg.R')] = 0; W[legs & (x <= 0), I('leg.L')] = 0
    W[head] = 0; W[head, I('head')] = 1
    W[fistR] = 0; W[fistR, I('hand.R')] = 1; W[fistL] = 0; W[fistL, I('hand.L')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
