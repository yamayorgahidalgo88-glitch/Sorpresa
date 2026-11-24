# Animaciones de Paira (el demonio del bate). Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# El bate va en la mano derecha.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, 2)], 'arm.R': [(X, -6)], 'hand.R': [(X, -20)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(X, 3), (Z, -2)], 'arm.R': [(X, -4)], 'hand.R': [(X, -20)], 'arm.L': [(X, -3)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, 2)], 'arm.R': [(X, -6)], 'hand.R': [(X, -20)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.L': [(X, -22)], 'arm.R': [(X, -4)], 'hips': [(Y, 5)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, -6)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 28)], 'leg.L': [(X, -28)], 'arm.L': [(X, 22)], 'arm.R': [(X, -8)], 'hips': [(Y, -5)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, -6)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.L': [(X, -22)], 'arm.R': [(X, -4)], 'hips': [(Y, 5)], 'loc': (0, 0, 0)}),
 ],
 # batazo hacia la izquierda: arma por la derecha y barre hacia la izquierda (golpe ~0,16 s)
 'attack': [
   (0.0,  {}),
   (0.08, {'hips': [(Y, -15)], 'arm.R': [(X, -25), (Z, -12)], 'hand.R': [(Y, -50), (X, -30)], 'chest': [(Y, -22)], 'head': [(Y, 15)], 'loc': (0, 0, -0.01)}),
   (0.17, {'hips': [(Y, 18)], 'arm.R': [(X, -28), (Z, 8)], 'hand.R': [(Y, 60), (X, -30)], 'chest': [(Y, 26)], 'head': [(Y, -15)], 'loc': (0, 0, 0.03)}),
   (0.24, {'arm.R': [(X, -22), (Z, 10)], 'hand.R': [(Y, 65), (X, -25)], 'chest': [(Y, 28)], 'loc': (0, 0, 0.02)}),
   (0.42, {}),
 ],
 # batazo hacia la derecha (revés)
 'attack2': [
   (0.0,  {}),
   (0.08, {'hips': [(Y, 15)], 'arm.R': [(X, -25), (Z, 10)], 'hand.R': [(Y, 55), (X, -30)], 'chest': [(Y, 22)], 'head': [(Y, -15)], 'loc': (0, 0, -0.01)}),
   (0.17, {'hips': [(Y, -18)], 'arm.R': [(X, -28), (Z, -10)], 'hand.R': [(Y, -55), (X, -30)], 'chest': [(Y, -26)], 'head': [(Y, 15)], 'loc': (0, 0, 0.03)}),
   (0.24, {'arm.R': [(X, -22), (Z, -12)], 'hand.R': [(Y, -60), (X, -25)], 'chest': [(Y, -28)], 'loc': (0, 0, 0.02)}),
   (0.42, {}),
 ],
 # deslizamiento de rodillas, como al llegar a una base: pierna izquierda estirada delante, la derecha doblada atrás
 'slide': [
   (0.0,  {}),
   (0.12, {'leg.L': [(X, -70)], 'leg.R': [(X, 55)], 'chest': [(X, -14)], 'head': [(X, 10)], 'arm.L': [(X, -22), (Z, 12)], 'arm.R': [(X, -14), (Z, -8)], 'loc': (0, -0.13, 0)}),
   (0.9,  {'leg.L': [(X, -70)], 'leg.R': [(X, 55)], 'chest': [(X, -14)], 'head': [(X, 10)], 'arm.L': [(X, -22), (Z, 12)], 'arm.R': [(X, -14), (Z, -8)], 'loc': (0, -0.13, 0)}),
   (1.05, {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -22)], 'hand.R': [(X, -90)], 'arm.L': [(X, -18)], 'hand.L': [(X, -70)], 'head': [(X, -10)], 'loc': (0, 0.09, 0)}),
   (0.45, {'arm.R': [(X, -18)], 'hand.R': [(X, -80)], 'arm.L': [(X, -14)], 'hand.L': [(X, -60)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
