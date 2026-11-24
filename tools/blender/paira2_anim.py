# Animaciones del modelo nuevo de Paira (bate al hombro). Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# El bate no está en el modelo: el juego lo pone en el puño derecho y lo gira; aquí se mueven brazo y cuerpo.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, 2)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(X, 3), (Z, -2)], 'arm.L': [(X, -3)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, 2)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -26)], 'leg.L': [(X, 26)], 'arm.L': [(X, -18)], 'hips': [(Y, 5)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 26)], 'leg.L': [(X, -26)], 'arm.L': [(X, 18)], 'hips': [(Y, -5)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -26)], 'leg.L': [(X, 26)], 'arm.L': [(X, -18)], 'hips': [(Y, 5)], 'loc': (0, 0, 0)}),
 ],
 # batazo de derecha (del hombro hacia su derecha): el brazo baja y barre, el cuerpo gira (golpe ~0,15 s)
 'attack': [
   (0.0,  {}),
   (0.07, {'chest': [(Y, 22)], 'hips': [(Y, 10)], 'arm.R': [(X, -10)], 'head': [(Y, -8)], 'loc': (0, 0, -0.01)}),
   (0.16, {'chest': [(Y, -30)], 'hips': [(Y, -14)], 'arm.R': [(Y, -30), (X, 10)], 'head': [(Y, 10)], 'loc': (0, -0.01, 0.03)}),
   (0.26, {'chest': [(Y, -36)], 'hips': [(Y, -16)], 'arm.R': [(Y, -38), (X, 12)], 'loc': (0, -0.01, 0.02)}),
   (0.45, {}),
 ],
 # revés: barre hacia su izquierda
 'attack2': [
   (0.0,  {}),
   (0.07, {'chest': [(Y, -28)], 'hips': [(Y, -12)], 'arm.R': [(Y, -30), (X, 10)], 'head': [(Y, 10)], 'loc': (0, 0, -0.01)}),
   (0.16, {'chest': [(Y, 28)], 'hips': [(Y, 14)], 'arm.R': [(Y, 18), (X, 6)], 'head': [(Y, -10)], 'loc': (0, -0.01, 0.03)}),
   (0.26, {'chest': [(Y, 34)], 'hips': [(Y, 16)], 'arm.R': [(Y, 22), (X, 6)], 'loc': (0, -0.01, 0.02)}),
   (0.45, {}),
 ],
 # deslizamiento de rodillas: se deja caer de rodillas (piernas hacia atrás), el cuerpo echado atrás y los brazos abiertos
 'slide': [
   (0.0,  {}),
   (0.12, {'leg.L': [(X, 42)], 'leg.R': [(X, 42)], 'hips': [(X, -8)], 'chest': [(X, -14)], 'head': [(X, -10)], 'loc': (0, -0.09, 0)}),
   (0.9,  {'leg.L': [(X, 42)], 'leg.R': [(X, 42)], 'hips': [(X, -8)], 'chest': [(X, -14)], 'head': [(X, -10)], 'loc': (0, -0.09, 0)}),
   (1.1,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.L': [(X, -15)], 'hand.L': [(X, -60)], 'head': [(X, -10)], 'loc': (0, 0.09, 0)}),
   (0.45, {'arm.L': [(X, -10)], 'hand.L': [(X, -45)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
