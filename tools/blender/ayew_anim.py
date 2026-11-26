# Animaciones de Ayew (jugador de vóley). Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
WALK = [
   (0.0,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.L': [(X, -12)], 'arm.R': [(X, 12)], 'hips': [(Y, 5)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 28)], 'leg.L': [(X, -28)], 'arm.L': [(X, 12)], 'arm.R': [(X, -12)], 'hips': [(Y, -5)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.L': [(X, -12)], 'arm.R': [(X, 12)], 'hips': [(Y, 5)], 'loc': (0, 0, 0)}),
]
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(X, -2)], 'arm.R': [(X, -3)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(X, 3)], 'arm.R': [(X, 3)], 'arm.L': [(X, -3)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(X, -2)], 'arm.R': [(X, -3)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
 ],
 'walk': WALK,
 # toque de dedos: flexiona, sube un poco los brazos y lleva los guantes por encima de la frente
 'set': [
   (0.0,  {}),
   (0.14, {'arm.R': [(X, -12)], 'hand.R': [(X, -75)], 'arm.L': [(X, -12)], 'hand.L': [(X, -75)], 'head': [(X, -14)], 'leg.R': [(X, -10)], 'leg.L': [(X, -10)], 'loc': (0, -0.03, 0)}),
   (0.3,  {'arm.R': [(X, -18)], 'hand.R': [(X, -105)], 'arm.L': [(X, -18)], 'hand.L': [(X, -105)], 'head': [(X, -18)], 'chest': [(X, -6)], 'loc': (0, 0.05, 0)}),
   (0.45, {'arm.R': [(X, -16)], 'hand.R': [(X, -100)], 'arm.L': [(X, -16)], 'hand.L': [(X, -100)], 'head': [(X, -16)], 'loc': (0, 0.02, 0)}),
   (0.65, {}),
 ],
 # remate: salta, gira el cuerpo y descarga el guante derecho hacia delante (golpe ~0,26 s)
 'attack': [
   (0.0,  {}),
   (0.1,  {'leg.R': [(X, -6)], 'leg.L': [(X, -6)], 'chest': [(X, 8)], 'loc': (0, -0.03, 0)}),
   (0.2,  {'arm.R': [(X, -18)], 'hand.R': [(X, -100)], 'arm.L': [(X, -10)], 'hand.L': [(X, -40)], 'chest': [(Y, 18), (X, -8)], 'head': [(X, -10)], 'leg.R': [(X, -8)], 'leg.L': [(X, 6)], 'loc': (0, 0.12, -0.02)}),
   (0.26, {'arm.R': [(X, -20)], 'hand.R': [(X, 20)], 'chest': [(Y, -16), (X, 10)], 'head': [(X, 6)], 'loc': (0, 0.1, 0.04)}),
   (0.4,  {'arm.R': [(X, -10)], 'hand.R': [(X, 15)], 'chest': [(Y, -12), (X, 10)], 'loc': (0, 0, 0.03)}),
   (0.6,  {}),
 ],
 # saque bombeado de inicio de ronda: balancea el guante desde abajo hacia arriba
 'super': [
   (0.0,  {}),
   (0.15, {'arm.R': [(X, 15)], 'hand.R': [(X, 35)], 'chest': [(X, 10), (Y, 15)], 'leg.R': [(X, -15)], 'loc': (0, -0.03, 0)}),
   (0.3,  {'arm.R': [(X, -15)], 'hand.R': [(X, -70)], 'chest': [(X, -6), (Y, -10)], 'head': [(X, -10)], 'loc': (0, 0.03, 0.02)}),
   (0.6,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -15)], 'hand.R': [(X, -100)], 'arm.L': [(X, -15)], 'hand.L': [(X, -100)], 'head': [(X, -10)], 'loc': (0, 0.09, 0)}),
   (0.45, {'arm.R': [(X, -12)], 'hand.R': [(X, -85)], 'arm.L': [(X, -12)], 'hand.L': [(X, -85)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
