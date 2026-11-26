# Esqueleto de Ayew (chico de la sudadera con guantes azules).
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from humanoide import make
ROOT = (0.0, 0.0, 0.0)
BONES, weights = make(sh_x=0.15, sh_y=0.55, hand_x=0.27, hand_y=0.27, fist=(0.255, 0.335, 0.001), neck_y=0.6, head_y=0.62, leg_x=0.09, hip_y=0.15, torso_w=0.15, sigma=0.09)

# los guantes van enteros con su mano (cajas medidas sobre el modelo); el resto de la chaqueta no sigue a la mano
import numpy as _np
GLOVES = {'R': ((-0.30, 0.24, -0.06), (-0.175, 0.40, 0.17)), 'L': ((0.185, 0.24, -0.12), (0.305, 0.40, 0.05))}
def _in(C, box):
    (a, b, c), (d, e, f) = box; x, y, z = C[:, 0], C[:, 1], C[:, 2]
    return (x > a) & (x < d) & (y > b) & (y < e) & (z > c) & (z < f)
_base = weights
def weights(P):
    names, W = _base(P); I = names.index
    for side in 'RL':
        g = _in(P, GLOVES[side]); h, a = I('hand.' + side), I('arm.' + side)
        W[~g, h] = 0   # la mano solo mueve el guante
        low = (P[:, 1] < 0.42) & ~g & ((P[:, 0] < 0) == (side == 'R'))
        W[low, a] *= 0.15   # la chaqueta de abajo casi no sigue al brazo
        W[g] = 0; W[g, h] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
SPLITS = [('hand.R', 'arm.R', lambda C: _in(C, GLOVES['R'])), ('hand.L', 'arm.L', lambda C: _in(C, GLOVES['L']))]
