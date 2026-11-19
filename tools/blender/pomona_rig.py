# Esqueleto de Pomona (glTF: y arriba, frente +z, altura 1). La manzana está en la mano izquierda (x positiva).
# La túnica tapa las piernas: no lleva huesos de piernas, al andar se balancea entera.
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':   ((0.0, 0.04, 0.0), (0.0, 0.30, 0.0), None),
 'chest':  ((0.0, 0.30, 0.0), (0.0, 0.56, 0.0), 'hips'),
 'head':   ((0.0, 0.56, 0.0), (0.0, 0.95, 0.0), 'chest'),
 'arm.R':  ((-0.16, 0.50, 0.02), (-0.22, 0.37, 0.05), 'chest'),
 'hand.R': ((-0.22, 0.37, 0.05), (-0.25, 0.26, 0.06), 'arm.R'),
 'arm.L':  ((0.15, 0.50, 0.02), (0.20, 0.42, 0.13), 'chest'),
 'hand.L': ((0.20, 0.42, 0.13), (0.24, 0.62, 0.20), 'arm.L'),
}
def seg_dist(P, a, b):
    a = np.array(a); b = np.array(b); d = b - a; t = np.clip(((P - a) @ d) / (d @ d), 0, 1); return np.linalg.norm(P - (a + t[:, None] * d), axis=1)
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]
    D = np.stack([seg_dist(P, BONES[n][0], BONES[n][1]) for n in names], 1)
    W = np.exp(-(D / 0.05) ** 2) + 1e-9
    I = names.index
    apple = (x > 0.09) & (y > 0.44) & (y < 0.84) & (z > 0.1)              # mano y manzana
    armR = (x < -0.13) & (y > 0.2) & (y < 0.53) & (z > -0.06)              # brazo caído (delante del pelo)
    hair_side = ((x < -0.2) | (x > 0.22)) & (z <= -0.06) & (y < 0.6)       # melena que cae por los lados
    head = (y > 0.58) & ~apple
    body = ~apple & ~armR & ~head
    for n in ('arm.R', 'hand.R', 'arm.L', 'hand.L'): W[body & (y < 0.47), I(n)] *= 0.02
    W[hair_side] = 0; W[hair_side, I('chest')] = .6; W[hair_side, I('head')] = .4
    W[head] = 0; W[head, I('head')] = 1
    W[apple] = 0; W[apple, I('hand.L')] = 1
    W[armR, I('hips')] *= .02; W[armR, I('chest')] *= .2
    W /= W.sum(1, keepdims=True)
    return names, W
