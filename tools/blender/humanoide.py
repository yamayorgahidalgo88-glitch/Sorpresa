# Esqueleto genérico de muñeco humanoide (glTF: y arriba, frente +z, altura 1).
# Cada personaje da sus medidas: hombro, mano, cadera, cuello y zona de los puños.
import numpy as np
def make(sh_x, sh_y, hand_x, hand_y, fist, neck_y, leg_x, hip_y=0.14, torso_w=0.15, head_y=None, sigma=0.06):
    head_y = head_y or neck_y + 0.02
    el_x, el_y = (sh_x + hand_x) / 2 + 0.02, (sh_y + hand_y) / 2 + 0.03
    BONES = {
     'hips':   ((0.0, hip_y - 0.02, 0.0), (0.0, hip_y + 0.16, 0.0), None),
     'chest':  ((0.0, hip_y + 0.16, 0.0), (0.0, neck_y, 0.0), 'hips'),
     'head':   ((0.0, neck_y, 0.0), (0.0, 1.0, 0.0), 'chest'),
     'arm.R':  ((-sh_x, sh_y, 0.0), (-el_x, el_y, 0.02), 'chest'),
     'hand.R': ((-el_x, el_y, 0.02), (-hand_x, hand_y, 0.04), 'arm.R'),
     'arm.L':  ((sh_x, sh_y, 0.0), (el_x, el_y, 0.02), 'chest'),
     'hand.L': ((el_x, el_y, 0.02), (hand_x, hand_y, 0.04), 'arm.L'),
     'leg.R':  ((-leg_x, hip_y, 0.0), (-leg_x - 0.01, 0.0, 0.02), 'hips'),
     'leg.L':  ((leg_x, hip_y, 0.0), (leg_x + 0.01, 0.0, 0.02), 'hips'),
    }
    def seg(P, a, b):
        a = np.array(a); b = np.array(b); d = b - a; t = np.clip(((P - a) @ d) / (d @ d), 0, 1); return np.linalg.norm(P - (a + t[:, None] * d), axis=1)
    def weights(P):
        names = list(BONES); x, y, z = P[:, 0], P[:, 1], P[:, 2]; I = names.index
        W = np.exp(-(np.stack([seg(P, *BONES[n][:2]) for n in names], 1) / sigma) ** 2) + 1e-9
        if len(fist) == 3 and fist[2] < 0.3:   # esfera (x, y, radio) alrededor de cada puño
            fx, fy, fr = fist
            fR = np.sqrt((x + fx) ** 2 + (y - fy) ** 2 + (z * 0.8) ** 2) < fr; fL = np.sqrt((x - fx) ** 2 + (y - fy) ** 2 + (z * 0.8) ** 2) < fr
        else:
            fx0, fy0, fy1 = fist
            fR = (x < -fx0) & (y > fy0) & (y < fy1); fL = (x > fx0) & (y > fy0) & (y < fy1)
        head = (y > head_y) & ~fR & ~fL
        torso = (np.abs(x) < torso_w) & (y > hip_y) & (y <= head_y)
        for n in ('arm.R', 'hand.R', 'arm.L', 'hand.L'): W[torso, I(n)] *= 0.04
        low = (np.abs(x) < torso_w + 0.04) & (y < hip_y + 0.12)
        for n in ('arm.R', 'hand.R', 'arm.L', 'hand.L'): W[low & ~fR & ~fL, I(n)] = 0
        legs = (y < hip_y) & ~fR & ~fL
        for n in names:
            if not n.startswith('leg') and n != 'hips': W[legs, I(n)] *= 0.04
        W[legs & (x > 0), I('leg.R')] = 0; W[legs & (x <= 0), I('leg.L')] = 0
        W[head] = 0; W[head, I('head')] = 1
        W[fR] = 0; W[fR, I('hand.R')] = 1; W[fL] = 0; W[fL, I('hand.L')] = 1
        W /= W.sum(1, keepdims=True)
        return names, W
    return BONES, weights
