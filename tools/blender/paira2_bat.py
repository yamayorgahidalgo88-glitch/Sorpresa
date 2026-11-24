# Bate pegado del modelo nuevo de Paira: qué caras son bate (para quitarlas del cuerpo) según forma + color.
import numpy as np
A = np.array([-0.44, 0.475, 0.07]); B = np.array([0.42, 0.92, -0.2])
FIST = np.array([-0.28, 0.58, 0.06])
def bat_mask(C, col):
    d = B - A; L = np.linalg.norm(d); d = d / L
    t = (C - A) @ d / L; foot = A + np.outer(t * L, d); dist = np.linalg.norm(C - foot, axis=1)
    r = np.where(t < 0.42, 0.07, np.where(t < 0.55, 0.175, 0.23))
    caps = (t > -0.04) & (t < 1.06) & (dist < r)
    R, G, Bc = col[:, 0], col[:, 1], col[:, 2]
    orange = (R > 150) & (G > 45) & (G < 150) & (Bc < 110) & (R - G > 55)
    gray = (np.abs(R - G) < 35) & (np.abs(G - Bc) < 40) & (R > 110) & (R - Bc < 35)
    brown = (R > 70) & (R < 200) & (G > 40) & (G < 140) & (Bc < 100) & (R - Bc > 30) & (R - G < 75)
    batcol = orange | gray | brown
    nearhead = (np.abs(C[:, 0]) < 0.2) & (C[:, 1] > 0.55)
    fist = np.linalg.norm(C - FIST, axis=1) < 0.1
    return caps & ~fist & (batcol | ~nearhead)
