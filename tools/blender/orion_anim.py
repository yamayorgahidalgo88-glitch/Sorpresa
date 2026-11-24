# Animaciones de Orión. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# Flota (no tiene piernas): sube y baja, la cola ondea y las dos rocas giran a su alrededor.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
def spin(T, n, extra):   # n vueltas de las rocas a lo largo del clip, con el resto de la pose de cada instante
    keys = []
    for i in range(n * 3 + 1):
        t = T * i / (n * 3); p = dict(extra(t / T)); p['rocks'] = [(Y, 120 * i)]; keys.append((round(t, 3), p))
    return keys
import math
def idle(k):
    s = math.sin(k * 2 * math.pi)
    return {'tail': [(Z, 8 * s), (X, 4 * s)], 'arm.R': [(X, 4 * s)], 'arm.L': [(X, -4 * s)], 'hand.R': [(X, 6 * s)], 'hand.L': [(X, -6 * s)], 'head': [(X, 2 * s)], 'loc': (0, 0.012 + 0.014 * s, 0)}
def walk(k):
    s = math.sin(k * 2 * math.pi)
    return {'chest': [(X, 8)], 'tail': [(X, 18), (Z, 10 * s)], 'arm.R': [(X, 10)], 'arm.L': [(X, 10)], 'loc': (0, 0.02 + 0.02 * s, 0)}
CLIPS = {
 'idle': spin(2.0, 1, idle),
 'walk': spin(0.8, 1, walk),
 # ráfaga de rocas: empuja con una mano y otra
 'attack': [
   (0.0,  {}),
   (0.06, {'arm.R': [(X, -28)], 'hand.R': [(X, -20)], 'chest': [(Y, 8)], 'rocks': [(Y, 60)], 'loc': (0, 0.01, 0.02)}),
   (0.14, {'arm.L': [(X, -28)], 'hand.L': [(X, -20)], 'chest': [(Y, -8)], 'rocks': [(Y, 120)], 'loc': (0, 0.01, 0.02)}),
   (0.22, {'arm.R': [(X, -28)], 'hand.R': [(X, -20)], 'chest': [(Y, 8)], 'rocks': [(Y, 180)], 'loc': (0, 0.01, 0.02)}),
   (0.30, {'arm.L': [(X, -28)], 'hand.L': [(X, -20)], 'chest': [(Y, -8)], 'rocks': [(Y, 240)], 'loc': (0, 0.01, 0.02)}),
   (0.38, {'arm.R': [(X, -24)], 'hand.R': [(X, -15)], 'rocks': [(Y, 300)], 'loc': (0, 0.01, 0.01)}),
   (0.5,  {'rocks': [(Y, 360)]}),
 ],
 # dardo: echa las dos manos atrás y las lanza juntas hacia delante
 'super': [
   (0.0,  {}),
   (0.15, {'arm.R': [(X, 18)], 'arm.L': [(X, 18)], 'hand.R': [(X, 20)], 'hand.L': [(X, 20)], 'chest': [(X, -10)], 'head': [(X, -6)], 'tail': [(X, -10)], 'loc': (0, 0.04, -0.03)}),
   (0.3,  {'arm.R': [(X, -40), (Y, -12)], 'arm.L': [(X, -40), (Y, 12)], 'hand.R': [(X, -30)], 'hand.L': [(X, -30)], 'chest': [(X, 12)], 'tail': [(X, 20)], 'loc': (0, 0.01, 0.05)}),
   (0.42, {'arm.R': [(X, -36), (Y, -10)], 'arm.L': [(X, -36), (Y, 10)], 'hand.R': [(X, -25)], 'hand.L': [(X, -25)], 'chest': [(X, 10)], 'tail': [(X, 15)], 'loc': (0, 0.01, 0.04)}),
   (0.65, {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -35), (Z, -25)], 'arm.L': [(X, -35), (Z, 25)], 'hand.R': [(X, -30)], 'hand.L': [(X, -30)], 'head': [(X, -10)], 'tail': [(Z, 15)], 'rocks': [(Y, 180)], 'loc': (0, 0.09, 0)}),
   (0.45, {'arm.R': [(X, -25), (Z, -15)], 'arm.L': [(X, -25), (Z, 15)], 'hand.R': [(X, -20)], 'hand.L': [(X, -20)], 'tail': [(Z, -15)], 'rocks': [(Y, 300)], 'loc': (0, 0.03, 0)}),
   (0.8,  {'rocks': [(Y, 360)]}),
 ],
}
INTERP = {'idle': 'LINEAR', 'walk': 'LINEAR'}
