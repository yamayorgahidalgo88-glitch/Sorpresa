# Esqueleto de Lodon (el tiburón musculoso sobre su carrito-pecera). glTF: y arriba, frente +z, altura 1.
# 'hips' = carrito y pecera, 'tail' = aleta de atrás, 'chest' = torso, 'head' = cabeza con aletas, 'arm.R/L' = brazos y puños.
import numpy as np
ROOT = (0.0, 0.0, 0.0)
BONES = {
 'hips':  ((0.0, 0.12, 0.0), (0.0, 0.40, 0.0), None),
 'tail':  ((0.0, 0.30, -0.28), (0.0, 0.32, -0.42), 'hips'),
 'chest': ((0.0, 0.47, -0.04), (0.0, 0.68, -0.04), 'hips'),
 'head':  ((0.0, 0.68, 0.0), (0.0, 0.95, -0.05), 'chest'),
 'arm.R': ((-0.17, 0.60, 0.0), (-0.30, 0.52, 0.05), 'chest'),
 'arm.L': ((0.17, 0.60, 0.0), (0.30, 0.52, 0.05), 'chest'),
}
# Las 5 ruedas del carrito (redondo) vienen soldadas al cuerpo en el modelo: se probó a separarlas para girarlas y se rompe la malla.
# Por eso el carrito rueda deslizándose (sin patas ni pasos).
def sig(x): return 1 / (1 + np.exp(-x))
def weights(P):
    names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
    W = np.zeros((len(P), len(names))) + 1e-9
    up = sig((y - 0.455) / 0.015)                     # por encima del carrito
    tail = (1 - up) * sig((-z - 0.27) / 0.03) * sig((y - 0.18) / 0.03)
    W[:, I('tail')] += tail
    W[:, I('hips')] += (1 - up) * (1 - tail)
    armR = up * sig((-x - 0.17) / 0.03) * sig((0.74 - y) / 0.03)
    armL = up * sig((x - 0.17) / 0.03) * sig((0.74 - y) / 0.03)
    W[:, I('arm.R')] += armR; W[:, I('arm.L')] += armL
    rest = up * (1 - armR) * (1 - armL)
    head = sig((y - 0.69) / 0.03)
    W[:, I('head')] += rest * head
    W[:, I('chest')] += rest * (1 - head)
    W /= W.sum(1, keepdims=True)
    return names, W
