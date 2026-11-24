# Esqueleto del modelo nuevo de Paira (bate al hombro). El bate original se quita del cuerpo y en el juego
# se pone el modelo del bate agarrado por el puño derecho (x negativa), que sigue levantado.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as _np
from humanoide import make
ROOT = (0.0, 0.0, 0.0)
BONES, _w = make(sh_x=0.14, sh_y=0.5, hand_x=0.19, hand_y=0.27, fist=(0.2, 0.25, 0.001), neck_y=0.56, head_y=0.58, leg_x=0.1, hip_y=0.15, torso_w=0.13, sigma=0.08)
BONES['arm.R'] = ((-0.15, 0.5, 0.0), (-0.25, 0.44, 0.04), 'chest')
BONES['hand.R'] = ((-0.25, 0.44, 0.04), (-0.28, 0.58, 0.06), 'arm.R')
FISTS = {'R': ((-0.40, 0.46, -0.06), (-0.15, 0.69, 0.17)), 'L': ((0.06, 0.185, -0.03), (0.26, 0.345, 0.33))}
def _in(C, box):
    (a, b, c), (d, e, f) = box; x, y, z = C[:, 0], C[:, 1], C[:, 2]
    return (x > a) & (x < d) & (y > b) & (y < e) & (z > c) & (z < f)
def weights(P):
    names, W = _w(P); I = names.index
    for side in 'RL':
        g = _in(P, FISTS[side]); h = I('hand.' + side)
        W[~g, h] = 0; W[g] = 0; W[g, h] = 1
    z = W.sum(1) < 1e-6; W[z, I('chest')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
SPLITS = [('hand.R', 'arm.R', lambda C: _in(C, FISTS['R'])), ('hand.L', 'arm.L', lambda C: _in(C, FISTS['L']))]
