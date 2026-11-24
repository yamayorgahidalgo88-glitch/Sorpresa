# Esqueleto del modelo de Paira con el bate levantado en la mano derecha (x negativa).
# El puño derecho y el bate van juntos en una pieza que gira desde la muñeca: los batazos salen del propio modelo.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as _np
from humanoide import make
ROOT = (0.0, 0.0, 0.0)
BONES, _w = make(sh_x=0.13, sh_y=0.5, hand_x=0.25, hand_y=0.28, fist=(0.2, 0.25, 0.001), neck_y=0.55, head_y=0.57, leg_x=0.1, hip_y=0.16, torso_w=0.13, sigma=0.08)
BONES['arm.R'] = ((-0.13, 0.5, 0.0), (-0.2, 0.46, -0.02), 'chest')
BONES['hand.R'] = ((-0.2, 0.46, -0.02), (-0.25, 0.62, -0.06), 'arm.R')
BONES['arm.L'] = ((0.13, 0.5, 0.0), (0.22, 0.36, 0.01), 'chest')
BONES['hand.L'] = ((0.22, 0.36, 0.01), (0.26, 0.27, 0.02), 'arm.L')
_REF = _np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'paira3_puno.npz'))
LBOX = ((0.16, 0.18, -0.18), (0.345, 0.38, 0.21))
def _bat(C):   # puño derecho + bate (lo que sobresale a su derecha por fuera del puño de la chaqueta)
    x, y = C[:, 0], C[:, 1]
    return (y > 0.26) & (y < 1.02) & ((x < -0.185) | ((x < -0.14) & (y > 0.54)))
def _fistL(C):
    (a, b, c), (d, e, f) = LBOX; x, y, z = C[:, 0], C[:, 1], C[:, 2]
    m = (x > a) & (x < d) & (y > b) & (y < e) & (z > c) & (z < f); idx = _np.where(m)[0]
    G, O = _REF['Lg'], _REF['Lo']; P = _np.vstack([G, O]); isg = _np.r_[_np.ones(len(G), bool), _np.zeros(len(O), bool)]
    for k in range(0, len(idx), 2000):
        q = C[idx[k:k + 2000]]; d2 = ((q[:, None, :] - P[None]) ** 2).sum(-1); m[idx[k:k + 2000]] = isg[d2.argmin(1)]
    return m
def weights(P):
    names, W = _w(P); I = names.index
    for side, g in (('R', _bat(P)), ('L', _fistL(P))):
        h = I('hand.' + side); W[~g, h] = 0; W[g] = 0; W[g, h] = 1
    z = W.sum(1) < 1e-6; W[z, I('chest')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
SPLITS = [('hand.R', 'arm.R', _bat), ('hand.L', 'arm.L', _fistL)]
