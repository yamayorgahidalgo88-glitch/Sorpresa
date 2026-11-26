# Esqueleto de Orión (fantasma encapuchado con manos moradas, cola flotante y dos rocas que orbitan).
import os, numpy as _np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':   ((0.0, 0.34, 0.0), (0.0, 0.5, 0.0), None),
 'chest':  ((0.0, 0.5, 0.0), (0.0, 0.62, 0.0), 'hips'),
 'head':   ((0.0, 0.62, 0.0), (0.0, 1.0, 0.0), 'chest'),
 'arm.R':  ((-0.13, 0.55, 0.02), (-0.24, 0.36, 0.25), 'chest'),
 'hand.R': ((-0.24, 0.36, 0.25), (-0.38, 0.38, 0.25), 'arm.R'),
 'arm.L':  ((0.13, 0.55, -0.02), (0.27, 0.36, 0.0), 'chest'),
 'hand.L': ((0.27, 0.36, 0.0), (0.4, 0.36, -0.01), 'arm.L'),
 'tail':   ((0.0, 0.36, 0.0), (0.0, 0.02, 0.0), 'hips'),
 'rocks':  ((0.0, 0.24, -0.08), (0.0, 0.32, -0.08), 'hips'),
}
_REF = _np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'orion_manos.npz'))
BX = {'L': ((0.2, 0.2, -0.16), (0.5, 0.56, 0.12)), 'R': ((-0.5, 0.22, 0.1), (-0.2, 0.56, 0.35))}
ROCKS = [((0.135, 0.16, -0.105), (0.24, 0.285, 0.004)), ((-0.205, 0.195, -0.155), (-0.11, 0.31, -0.056))]
def _box(C, box):
    (a, b, c), (d, e, f) = box; x, y, z = C[:, 0], C[:, 1], C[:, 2]
    return (x > a) & (x < d) & (y > b) & (y < e) & (z > c) & (z < f)
def _hand(C, side):
    m = _box(C, BX[side]); idx = _np.where(m)[0]
    G, O = _REF[side + 'g'], _REF[side + 'o']; P = _np.vstack([G, O]); isg = _np.r_[_np.ones(len(G), bool), _np.zeros(len(O), bool)]
    for k in range(0, len(idx), 2000):
        q = C[idx[k:k + 2000]]; d2 = ((q[:, None, :] - P[None]) ** 2).sum(-1); m[idx[k:k + 2000]] = isg[d2.argmin(1)]
    return m
def _rocks(C): return _box(C, ROCKS[0]) | _box(C, ROCKS[1])
def _seg(P, a, b):
    a = _np.array(a); b = _np.array(b); d = b - a; t = _np.clip(((P - a) @ d) / (d @ d), 0, 1); return _np.linalg.norm(P - (a + t[:, None] * d), axis=1)
def weights(P):
    names = list(BONES); I = names.index; y = P[:, 1]
    W = _np.exp(-(_np.stack([_seg(P, *BONES[n][:2]) for n in names], 1) / 0.08) ** 2) + 1e-9
    W[:, I('rocks')] = 0; W[:, I('hand.R')] = 0; W[:, I('hand.L')] = 0
    body = _np.abs(P[:, 0]) < 0.14
    for n in ('arm.R', 'arm.L'): W[body, I(n)] *= 0.05
    W[y > 0.4, I('tail')] = 0
    W[y > 0.64] = 0; W[y > 0.64, I('head')] = 1   # capucha y cara
    for side in 'RL':
        g = _hand(P, side); W[g] = 0; W[g, I('hand.' + side)] = 1
    r = _rocks(P); W[r] = 0; W[r, I('rocks')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
SPLITS = [('hand.R', 'arm.R', lambda C: _hand(C, 'R')), ('hand.L', 'arm.L', lambda C: _hand(C, 'L')), ('rocks', 'hips', _rocks)]
