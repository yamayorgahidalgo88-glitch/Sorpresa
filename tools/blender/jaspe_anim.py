# Animaciones de Jaspe. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(X, 2)], 'head': [(X, -2)], 'arm.R': [(Z, 2)], 'arm.L': [(Z, -2)], 'loc': (0, 0, 0)}),
   (1.2, {'chest': [(X, -2)], 'head': [(X, 2)], 'arm.R': [(Z, -2)], 'arm.L': [(Z, 2)], 'loc': (0, -0.01, 0)}),
   (2.4, {'chest': [(X, 2)], 'head': [(X, -2)], 'arm.R': [(Z, 2)], 'arm.L': [(Z, -2)], 'loc': (0, 0, 0)}),
 ],
 # paso pesado de gólem
 'walk': [
   (0.0,  {'leg.R': [(X, -22)], 'leg.L': [(X, 22)], 'arm.R': [(X, 14)], 'arm.L': [(X, -14)], 'hips': [(Z, 5)], 'chest': [(Z, -3)], 'loc': (0, 0, 0)}),
   (0.2,  {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.R': [(X, 0)], 'arm.L': [(X, 0)], 'hips': [(Z, 0)], 'loc': (0, 0.025, 0)}),
   (0.4,  {'leg.R': [(X, 22)], 'leg.L': [(X, -22)], 'arm.R': [(X, -14)], 'arm.L': [(X, 14)], 'hips': [(Z, -5)], 'chest': [(Z, 3)], 'loc': (0, 0, 0)}),
   (0.6,  {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.R': [(X, 0)], 'arm.L': [(X, 0)], 'hips': [(Z, 0)], 'loc': (0, 0.025, 0)}),
   (0.8,  {'leg.R': [(X, -22)], 'leg.L': [(X, 22)], 'arm.R': [(X, 14)], 'arm.L': [(X, -14)], 'hips': [(Z, 5)], 'chest': [(Z, -3)], 'loc': (0, 0, 0)}),
 ],
 # levanta los dos puños y los baja al suelo (golpe ~0,26 s)
 'attack': [
   (0.0,  {}),
   (0.16, {'arm.R': [(X, -62)], 'hand.R': [(X, -48)], 'arm.L': [(X, -62)], 'hand.L': [(X, -48)], 'chest': [(X, -10)], 'head': [(X, -8)], 'loc': (0, 0.03, -0.02)}),
   (0.26, {'arm.R': [(X, -10)], 'hand.R': [(X, -10)], 'arm.L': [(X, -10)], 'hand.L': [(X, -10)], 'chest': [(X, 22)], 'head': [(X, 6)], 'hips': [(X, 6)], 'loc': (0, -0.04, 0.04)}),
   (0.4,  {'arm.R': [(X, -6)], 'arm.L': [(X, -6)], 'chest': [(X, 18)], 'hips': [(X, 5)], 'loc': (0, -0.035, 0.035)}),
   (0.65, {}),
 ],
 # el mismo golpe pero con salto y más fuerza
 'super': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -70)], 'hand.R': [(X, -55)], 'arm.L': [(X, -70)], 'hand.L': [(X, -55)], 'chest': [(X, -14)], 'head': [(X, -12)], 'leg.R': [(X, -12)], 'leg.L': [(X, -12)], 'loc': (0, 0.12, 0)}),
   (0.32, {'arm.R': [(X, -5)], 'hand.R': [(X, -10)], 'arm.L': [(X, -5)], 'hand.L': [(X, -10)], 'chest': [(X, 26)], 'head': [(X, 8)], 'hips': [(X, 8)], 'loc': (0, -0.05, 0.05)}),
   (0.5,  {'arm.R': [(X, -4)], 'arm.L': [(X, -4)], 'chest': [(X, 22)], 'hips': [(X, 6)], 'loc': (0, -0.045, 0.04)}),
   (0.8,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -45), (Z, -15)], 'hand.R': [(X, -35)], 'arm.L': [(X, -45), (Z, 15)], 'hand.L': [(X, -35)], 'chest': [(X, -8)], 'head': [(X, -10)], 'loc': (0, 0.06, 0)}),
   (0.45, {'arm.R': [(X, -38), (Z, -12)], 'hand.R': [(X, -28)], 'arm.L': [(X, -38), (Z, 12)], 'hand.L': [(X, -28)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
