# Esqueleto del modelo nuevo de Ayew (balón sobre la mano izquierda, que se quita del cuerpo y en el juego va aparte).
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from humanoide import make
ROOT = (0.0, 0.0, 0.0)
BONES, _base = make(sh_x=0.15, sh_y=0.56, hand_x=0.22, hand_y=0.35, fist=(0.2, 0.3, 0.001), neck_y=0.62, head_y=0.64, leg_x=0.09, hip_y=0.15, torso_w=0.14, sigma=0.09)
BONES['arm.R'] = ((-0.15, 0.56, 0.0), (-0.19, 0.43, 0.05), 'chest')
BONES['hand.R'] = ((-0.19, 0.43, 0.05), (-0.2, 0.33, 0.1), 'arm.R')
BONES['arm.L'] = ((0.15, 0.56, 0.0), (0.18, 0.45, -0.02), 'chest')
BONES['hand.L'] = ((0.18, 0.45, -0.02), (0.27, 0.41, -0.03), 'arm.L')
# los guantes van enteros con su mano (cajas medidas sobre el modelo)
# dentro de cada caja, es guante lo que en el modelo original tiene color de guante (azul), no la chaqueta
GLOVES = {'R': ((-0.32, 0.215, -0.02), (-0.08, 0.455, 0.26)), 'L': ((0.14, 0.325, -0.155), (0.355, 0.485, 0.085))}
import numpy as _np
_REF = _np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ayew3_guantes.npz'))
def _box(C, box):
    (a, b, c), (d, e, f) = box; x, y, z = C[:, 0], C[:, 1], C[:, 2]
    return (x > a) & (x < d) & (y > b) & (y < e) & (z > c) & (z < f)
def _glove(C, side):
    m = _box(C, GLOVES[side]); idx = _np.where(m)[0]
    G, O = _REF[side + 'g'], _REF[side + 'o']; P = _np.vstack([G, O]); isg = _np.r_[_np.ones(len(G), bool), _np.zeros(len(O), bool)]
    for k in range(0, len(idx), 2000):
        c = C[idx[k:k + 2000]]; d = ((c[:, None, :] - P[None]) ** 2).sum(-1); m[idx[k:k + 2000]] = isg[d.argmin(1)]
    return m
def weights(P):
    names, W = _base(P); I = names.index
    for side in 'RL':
        g = _glove(P, side); h, a = I('hand.' + side), I('arm.' + side)
        W[~g, h] = 0
        low = (P[:, 1] < 0.42) & ~g & ((P[:, 0] < 0) == (side == 'R'))
        W[low, a] *= 0.15   # la chaqueta de abajo casi no sigue al brazo
        W[g] = 0; W[g, h] = 1
    z = W.sum(1) < 1e-6; W[z, I('chest')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
SPLITS = [('hand.R', 'arm.R', lambda C: _glove(C, 'R')), ('hand.L', 'arm.L', lambda C: _glove(C, 'L'))]
