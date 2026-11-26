# Esqueleto de Bolab (glTF: y arriba, frente +z, altura 1). La placa de roca de delante hace de mandíbula.
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':  ((0.0, 0.06, 0.0), (0.0, 0.30, 0.0), None),
 'chest': ((0.0, 0.30, 0.0), (0.0, 0.44, 0.0), 'hips'),
 'head':  ((0.0, 0.44, 0.0), (0.0, 1.00, 0.0), 'chest'),
 'jaw':   ((0.0, 0.42, 0.08), (0.0, 0.10, 0.30), 'chest'),
 'leg.R': ((-0.22, 0.14, 0.0), (-0.28, 0.0, 0.05), 'hips'),
 'leg.L': ((0.22, 0.14, 0.0), (0.28, 0.0, 0.05), 'hips'),
 'tail':  ((0.0, 0.14, -0.25), (0.0, 0.02, -0.48), 'hips'),
}
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    W = np.zeros((len(P), len(names)))
    # mezcla suave cuerpo -> pecho -> cabeza por la altura
    h = np.clip((y - 0.24) / 0.14, 0, 1); hd = np.clip((y - 0.44) / 0.08, 0, 1)
    W[:, I('hips')] = 1 - h; W[:, I('chest')] = h * (1 - hd); W[:, I('head')] = hd
    jaw = (z > 0.10) & (y < 0.45) & (y > 0.03) & (np.abs(x) < 0.34)
    jb = np.clip((z - 0.10) / 0.06, 0, 1) * np.clip((0.45 - y) / 0.04, 0, 1)
    W[jaw] *= (1 - jb[jaw])[:, None]; W[jaw, I('jaw')] = jb[jaw]
    feet = (y < 0.12) & ~jaw & (z > -0.3)
    s = feet & (x < -0.1); W[s] = 0; W[s, I('leg.R')] = 1
    s = feet & (x > 0.1); W[s] = 0; W[s, I('leg.L')] = 1
    tl = (z < -0.28) & (y < 0.2); W[tl] = 0; W[tl, I('tail')] = 1
    W += 1e-9; W /= W.sum(1, keepdims=True)
    return names, W
