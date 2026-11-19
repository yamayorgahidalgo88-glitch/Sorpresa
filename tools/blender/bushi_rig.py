# Esqueleto de Bushi en coordenadas normalizadas (glTF: y arriba, frente +z, altura 1).
# La mano de la espada es la derecha del personaje (x negativa).
import numpy as np
ROOT = (0.10, 0.0, 0.0)
BONES = {   # nombre: (cabeza, cola, padre)
 'hips':      ((0.10, 0.10, 0.0), (0.10, 0.24, 0.0), None),
 'chest':     ((0.10, 0.24, 0.0), (0.10, 0.44, 0.0), 'hips'),
 'head':      ((0.10, 0.44, 0.0), (0.10, 0.95, 0.0), 'chest'),
 'arm.R':     ((-0.06, 0.40, 0.02), (-0.19, 0.33, 0.06), 'chest'),
 'hand.R':    ((-0.19, 0.33, 0.06), (-0.28, 0.27, 0.10), 'arm.R'),
 'arm.L':     ((0.27, 0.40, 0.0), (0.32, 0.32, 0.0), 'chest'),
 'hand.L':    ((0.32, 0.32, 0.0), (0.34, 0.25, 0.02), 'arm.L'),
 'leg.R':     ((-0.02, 0.14, 0.0), (-0.07, 0.0, 0.02), 'hips'),
 'leg.L':     ((0.22, 0.14, 0.0), (0.25, 0.0, 0.02), 'hips'),
}
def seg_dist(P, a, b):
    a=np.array(a); b=np.array(b); d=b-a; t=np.clip(((P-a)@d)/(d@d),0,1); return np.linalg.norm(P-(a+t[:,None]*d),axis=1)
def weights(P):
    names=list(BONES); D=np.stack([seg_dist(P,BONES[n][0],BONES[n][1]) for n in names],1)
    x,y,z=P[:,0],P[:,1],P[:,2]
    # el casco y todo lo que está por encima del cuello va con la cabeza (salvo la espada)
    sword = ((x < -0.30) & (y > 0.40)) | ((x < -0.20) & (y > 0.18) & (y < 0.48) & (z > -0.02))
    D[:,names.index('head')] = np.where(y > 0.45, 0, D[:,names.index('head')] + np.clip(0.45 - y, 0, 1) * 2)
    W=np.exp(-(D/0.045)**2) + 1e-9
    # los brazos no se llevan el tronco: solo cuentan fuera del tronco
    tor = (x > -0.12) & (x < 0.27) & (y < 0.45)
    for n in ('arm.R','hand.R','arm.L','hand.L'): W[tor, names.index(n)] *= 0.02
    legs = y < 0.12
    for n in names:
        if not n.startswith('leg'): W[legs, names.index(n)] *= 0.05 if n != 'hips' else 1
    W[legs & (x < 0.1), names.index('leg.L')] = 0; W[legs & (x >= 0.1), names.index('leg.R')] = 0
    W[sword] = 0; W[sword, names.index('hand.R')] = 1
    hd = ((y > 0.47) | ((y > 0.41) & (x > -0.12) & (x < 0.32))) & ~sword   # casco + bigote
    W[hd] = 0; W[hd, names.index('head')] = 1
    W /= W.sum(1, keepdims=True)
    return names, W
