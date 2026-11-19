# Esqueleto de Peipo (glTF: y arriba, frente +z, altura 1). Cuchillo en la mano derecha (x negativa) y
# postre-bomba en la izquierda (x positiva); la bomba se corta de la malla con su propio hueso para lanzarla.
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':   ((0.0, 0.10, 0.0), (0.0, 0.28, 0.0), None),
 'chest':  ((0.0, 0.28, 0.0), (0.0, 0.56, 0.0), 'hips'),
 'head':   ((0.0, 0.58, 0.0), (0.0, 1.0, 0.0), 'chest'),
 'arm.R':  ((-0.15, 0.50, 0.02), (-0.24, 0.40, 0.05), 'chest'),
 'hand.R': ((-0.24, 0.40, 0.05), (-0.26, 0.32, 0.08), 'arm.R'),
 'arm.L':  ((0.15, 0.50, 0.02), (0.24, 0.42, 0.04), 'chest'),
 'hand.L': ((0.24, 0.42, 0.04), (0.26, 0.36, 0.06), 'arm.L'),
 'bomb':   ((0.26, 0.46, 0.02), (0.26, 0.60, 0.02), 'hand.L'),
 'leg.R':  ((-0.08, 0.12, 0.0), (-0.09, 0.0, 0.02), 'hips'),
 'leg.L':  ((0.08, 0.12, 0.0), (0.09, 0.0, 0.02), 'hips'),
}
def seg_dist(P, a, b):
    a = np.array(a); b = np.array(b); d = b - a; t = np.clip(((P - a) @ d) / (d @ d), 0, 1); return np.linalg.norm(P - (a + t[:, None] * d), axis=1)
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    D = np.stack([seg_dist(P, BONES[n][0], BONES[n][1]) for n in names], 1)
    W = np.exp(-(D / 0.08) ** 2) + 1e-9
    W[:, I('bomb')] = 0
    knife = (x < -0.19) & (y > 0.40)
    head = (y > 0.60) & ~knife
    torso = (np.abs(x) < 0.14) & (y > 0.10) & (y <= 0.60)
    for n in ('arm.R', 'hand.R', 'arm.L', 'hand.L'): W[torso, I(n)] *= 0.15
    legs = y < 0.11
    for n in names:
        if not n.startswith('leg') and n != 'hips': W[legs, I(n)] *= 0.05
    W[legs & (x > 0), I('leg.R')] = 0; W[legs & (x <= 0), I('leg.L')] = 0
    W[head] = 0; W[head, I('head')] = 1
    W[(y > 0.47) & ~knife, I('hand.L')] = 0; W[(y > 0.47) & ~knife, I('hand.R')] = 0   # la muñeca no arrastra el hombro
    W[y > 0.53, I('arm.L')] *= 0.3; W[(y > 0.53) & ~knife, I('arm.R')] *= 0.3
    W[knife] = 0; W[knife, I('hand.R')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
SPLIT_BONE, SPLIT_PARENT = 'bomb', 'hand.L'
def split_faces(C):
    x, y, z = C[:, 0], C[:, 1], C[:, 2]
    return (x > 0.195) & (x < 0.36) & (y > 0.47) & (y < 0.61)
