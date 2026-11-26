# Animaciones de Paira con el bate levantado en la mano derecha. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# El puño derecho y el bate son una pieza (hand.R) que gira desde la muñeca: el batazo es parte del modelo.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, 2)], 'arm.L': [(X, 3)], 'hand.R': [(Z, 3)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(X, 3), (Z, -2)], 'arm.L': [(X, -3)], 'hand.R': [(Z, -3)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, 2)], 'arm.L': [(X, 3)], 'hand.R': [(Z, 3)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -26)], 'leg.L': [(X, 26)], 'arm.L': [(X, -18)], 'hips': [(Y, 5)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 26)], 'leg.L': [(X, -26)], 'arm.L': [(X, 18)], 'hips': [(Y, -5)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -26)], 'leg.L': [(X, 26)], 'arm.L': [(X, -18)], 'hips': [(Y, 5)], 'loc': (0, 0, 0)}),
 ],
 # batazo de derecha: arma el bate hacia atrás por su derecha y lo barre en horizontal por delante hacia su izquierda (golpe ~0,16 s)
 'attack': [
   (0.0,  {}),
   (0.07, {'chest': [(Y, -22)], 'hips': [(Y, -8)], 'hand.R': [(X, -15), (Z, 55)], 'head': [(Y, 10)], 'loc': (0, 0, -0.01)}),
   (0.16, {'chest': [(Y, 22)], 'hips': [(Y, 10)], 'arm.R': [(X, -18)], 'hand.R': [(X, 88), (Y, 35)], 'head': [(Y, -8)], 'loc': (0, -0.01, 0.03)}),
   (0.26, {'chest': [(Y, 32)], 'hips': [(Y, 14)], 'arm.R': [(X, -14)], 'hand.R': [(X, 85), (Y, 80)], 'loc': (0, -0.01, 0.02)}),
   (0.45, {}),
 ],
 # revés: el bate cruza por delante desde su izquierda y barre hacia su derecha
 'attack2': [
   (0.0,  {}),
   (0.07, {'chest': [(Y, 24)], 'hips': [(Y, 10)], 'hand.R': [(X, 45), (Y, 75)], 'head': [(Y, -8)], 'loc': (0, 0, -0.01)}),
   (0.16, {'chest': [(Y, -22)], 'hips': [(Y, -10)], 'arm.R': [(X, -18)], 'hand.R': [(X, 88), (Y, -25)], 'head': [(Y, 8)], 'loc': (0, -0.01, 0.03)}),
   (0.26, {'chest': [(Y, -30)], 'hips': [(Y, -14)], 'arm.R': [(X, -12)], 'hand.R': [(X, 85), (Y, -70)], 'loc': (0, -0.01, 0.02)}),
   (0.45, {}),
 ],
 'slide': [
   (0.0,  {}),
   (0.12, {'leg.L': [(X, 42)], 'leg.R': [(X, 42)], 'hips': [(X, -8)], 'chest': [(X, -14)], 'head': [(X, -10)], 'loc': (0, -0.09, 0)}),
   (0.9,  {'leg.L': [(X, 42)], 'leg.R': [(X, 42)], 'hips': [(X, -8)], 'chest': [(X, -14)], 'head': [(X, -10)], 'loc': (0, -0.09, 0)}),
   (1.1,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.L': [(X, -15)], 'hand.L': [(X, -60)], 'hand.R': [(Z, -12)], 'head': [(X, -10)], 'loc': (0, 0.09, 0)}),
   (0.45, {'arm.L': [(X, -10)], 'hand.L': [(X, -45)], 'hand.R': [(Z, 8)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
