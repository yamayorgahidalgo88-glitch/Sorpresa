# Esqueleto de Sevora (glTF: y arriba, frente +z, altura 1). La plantita carnívora de su diseño, en la mano derecha
# (x negativa), lleva su propio hueso 'plant': el juego lo estira hacia el enemigo para que muerda.
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':   ((0.0, 0.12, 0.0), (0.0, 0.26, 0.0), None),
 'chest':  ((0.0, 0.26, 0.0), (0.0, 0.44, 0.0), 'hips'),
 'head':   ((0.0, 0.44, 0.0), (0.0, 0.98, 0.0), 'chest'),
 'arm.R':  ((-0.14, 0.40, 0.02), (-0.22, 0.32, 0.05), 'chest'),
 'hand.R': ((-0.22, 0.32, 0.05), (-0.26, 0.26, 0.08), 'arm.R'),
 'arm.L':  ((0.14, 0.38, 0.0), (0.24, 0.30, 0.02), 'chest'),
 'hand.L': ((0.24, 0.30, 0.02), (0.27, 0.23, 0.04), 'arm.L'),
 'leg.R':  ((-0.07, 0.14, 0.0), (-0.09, 0.0, 0.02), 'hips'),
 'leg.L':  ((0.08, 0.14, 0.0), (0.10, 0.0, 0.02), 'hips'),
 'plant':  ((-0.24, 0.44, 0.2), (-0.24, 0.62, 0.22), 'hand.R'),
}
def seg_dist(P, a, b):
    a = np.array(a); b = np.array(b); d = b - a; t = np.clip(((P - a) @ d) / (d @ d), 0, 1); return np.linalg.norm(P - (a + t[:, None] * d), axis=1)
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    D = np.stack([seg_dist(P, BONES[n][0], BONES[n][1]) for n in names], 1)
    W = np.exp(-(D / 0.05) ** 2) + 1e-9
    head = y > 0.46
    torso = (np.abs(x) < 0.13) & (y > 0.12) & (y <= 0.46)
    for n in ('arm.R', 'hand.R', 'arm.L', 'hand.L'): W[torso, I(n)] *= 0.02
    legs = y < 0.14
    for n in names:
        if not n.startswith('leg') and n != 'hips': W[legs, I(n)] *= 0.05
    W[legs & (x > 0), I('leg.R')] = 0; W[legs & (x <= 0), I('leg.L')] = 0
    W[head] = 0; W[head, I('head')] = 1
    W[:, I('plant')] = 0
    W /= W.sum(1, keepdims=True)
    return names, W

# la plantita se corta de la malla: caras con el centro dentro de esta zona
SPLIT_BONE, SPLIT_PARENT = 'plant', 'hand.R'
def split_faces(C):
    x, y, z = C[:, 0], C[:, 1], C[:, 2]
    return (x < -0.14) & (y > 0.40) & (y < 0.645) & (z > 0.1)
