# Animaciones de Sevora. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# El brazo derecho apunta al enemigo mientras el juego estira la planta desde la mano.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, -2)], 'arm.R': [(X, -4)], 'arm.L': [(X, 4)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(X, 3), (Z, 2)], 'arm.R': [(X, 4)], 'arm.L': [(X, -4)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, -2)], 'arm.R': [(X, -4)], 'arm.L': [(X, 4)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.L': [(X, -20)], 'arm.R': [(X, 20)], 'hips': [(Y, 6)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 28)], 'leg.L': [(X, -28)], 'arm.L': [(X, 20)], 'arm.R': [(X, -20)], 'hips': [(Y, -6)], 'head': [(Z, -3)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.L': [(X, -20)], 'arm.R': [(X, 20)], 'hips': [(Y, 6)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
 ],
 # mordida de raíz: estira el brazo hacia delante y lo mantiene mientras la planta sale y vuelve
 'attack': [
   (0.0,  {}),
   (0.07, {'arm.R': [(X, 20)], 'chest': [(Y, -14)], 'head': [(Y, 6)], 'loc': (0, 0, -0.015)}),
   (0.16, {'arm.R': [(X, -78), (Z, 8)], 'hand.R': [(X, -8)], 'chest': [(Y, 18), (X, 6)], 'head': [(Y, -6)], 'arm.L': [(X, 14)], 'loc': (0, -0.01, 0.035)}),
   (0.42, {'arm.R': [(X, -74), (Z, 8)], 'hand.R': [(X, -6)], 'chest': [(Y, 15), (X, 5)], 'head': [(Y, -5)], 'arm.L': [(X, 12)], 'loc': (0, -0.01, 0.03)}),
   (0.6,  {}),
 ],
 # mordida radiante: se encoge cargando energía y se estira de golpe (las raíces se iluminan en el juego)
 'super': [
   (0.0,  {}),
   (0.15, {'arm.R': [(X, 25), (Z, 15)], 'arm.L': [(X, 25), (Z, -15)], 'chest': [(X, 14)], 'head': [(X, 12)], 'leg.R': [(X, -10)], 'leg.L': [(X, 10)], 'loc': (0, -0.05, 0)}),
   (0.32, {'arm.R': [(Z, -55), (X, -20)], 'arm.L': [(Z, 55), (X, -20)], 'chest': [(X, -8)], 'head': [(X, -14)], 'loc': (0, 0.06, 0)}),
   (0.55, {'arm.R': [(Z, -50), (X, -18)], 'arm.L': [(Z, 50), (X, -18)], 'chest': [(X, -6)], 'head': [(X, -10)], 'loc': (0, 0.04, 0)}),
   (0.8,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -70), (Z, -20)], 'arm.L': [(X, -70), (Z, 20)], 'head': [(X, -12)], 'loc': (0, 0.08, 0)}),
   (0.45, {'arm.R': [(X, -55), (Z, -15)], 'arm.L': [(X, -55), (Z, 15)], 'head': [(X, -6)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
