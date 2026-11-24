# Esqueleto de Paira (el demonio de la chaqueta). El bate va aparte, en la mano derecha (x negativa).
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from humanoide import make
ROOT = (0.0, 0.0, 0.0)
BONES, weights = make(sh_x=0.14, sh_y=0.49, hand_x=0.22, hand_y=0.27, fist=(0.22, 0.29, 0.001), neck_y=0.55, head_y=0.57, leg_x=0.1, hip_y=0.15, torso_w=0.13, sigma=0.09)

# los puños se cortan y van enteros con su mano; la mano no arrastra nada más
import numpy as _np
FISTS = {'R': ((-0.27, 0.235, -0.2), (-0.145, 0.395, -0.04)), 'L': ((0.13, 0.225, -0.06), (0.28, 0.395, 0.15))}
def _in(C, box):
    (a, b, c), (d, e, f) = box; x, y, z = C[:, 0], C[:, 1], C[:, 2]
    return (x > a) & (x < d) & (y > b) & (y < e) & (z > c) & (z < f)
_base = weights
def weights(P):
    names, W = _base(P); I = names.index
    for side in 'RL':
        g = _in(P, FISTS[side]); h, a = I('hand.' + side), I('arm.' + side)
        W[~g, h] = 0
        low = (P[:, 1] < 0.36) & ~g & ((P[:, 0] < 0) == (side == 'R'))
        W[low, a] *= 0.15
        W[g] = 0; W[g, h] = 1
    z = W.sum(1) < 1e-6; W[z, I('chest')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
SPLITS = [('hand.R', 'arm.R', lambda C: _in(C, FISTS['R'])), ('hand.L', 'arm.L', lambda C: _in(C, FISTS['L']))]
