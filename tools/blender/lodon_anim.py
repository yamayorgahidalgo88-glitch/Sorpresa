# Animaciones de Lodon. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# Giro +X = lo de arriba va hacia delante; en un brazo colgando, -X lo lleva hacia delante.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, -2)], 'arm.R': [(X, -3)], 'arm.L': [(X, 3)], 'tail': [(Y, 10)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(X, 3), (Z, 2)], 'arm.R': [(X, 3)], 'arm.L': [(X, -3)], 'tail': [(Y, -10)], 'loc': (0, 0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(X, -2), (Z, -2)], 'arm.R': [(X, -3)], 'arm.L': [(X, 3)], 'tail': [(Y, 10)], 'loc': (0, 0, 0)}),
 ],
 # el carrito traquetea y el tiburón se bambolea con los brazos
 'walk': [
   (0.0,  {'hips': [(Z, 2)], 'chest': [(Z, -2.5)], 'head': [(Z, 2)], 'arm.R': [(X, 14)], 'arm.L': [(X, -14)], 'tail': [(Y, 18)], 'loc': (0, 0, 0)}),
   (0.15, {'hips': [(Z, 0)], 'chest': [(Z, 0)], 'arm.R': [(X, 0)], 'arm.L': [(X, 0)], 'tail': [(Y, 0)], 'loc': (0, 0.02, 0)}),
   (0.3,  {'hips': [(Z, -2)], 'chest': [(Z, 2.5)], 'head': [(Z, -2)], 'arm.R': [(X, -14)], 'arm.L': [(X, 14)], 'tail': [(Y, -18)], 'loc': (0, 0, 0)}),
   (0.45, {'hips': [(Z, 0)], 'chest': [(Z, 0)], 'arm.R': [(X, 0)], 'arm.L': [(X, 0)], 'tail': [(Y, 0)], 'loc': (0, 0.02, 0)}),
   (0.6,  {'hips': [(Z, 2)], 'chest': [(Z, -2.5)], 'head': [(Z, 2)], 'arm.R': [(X, 14)], 'arm.L': [(X, -14)], 'tail': [(Y, 18)], 'loc': (0, 0, 0)}),
 ],
 # golpe doble con los dos puños hacia delante
 'attack': [
   (0.0,  {}),
   (0.1,  {'arm.R': [(X, 30), (Z, -10)], 'arm.L': [(X, 30), (Z, 10)], 'chest': [(X, -8)], 'head': [(X, -5)], 'tail': [(Y, -12)], 'loc': (0, 0, -0.025)}),
   (0.2,  {'arm.R': [(X, -75), (Z, 6)], 'arm.L': [(X, -75), (Z, -6)], 'chest': [(X, 14)], 'head': [(X, 10)], 'tail': [(Y, 14)], 'loc': (0, -0.01, 0.05)}),
   (0.42, {'arm.R': [(X, -60)], 'arm.L': [(X, -60)], 'chest': [(X, 10)], 'head': [(X, 7)], 'loc': (0, 0, 0.03)}),
   (0.62, {}),
 ],
 # truco: se hincha, golpea el suelo con los dos puños
 'super': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -150), (Z, -25)], 'arm.L': [(X, -150), (Z, 25)], 'chest': [(X, -12)], 'head': [(X, -14)], 'tail': [(Y, -20)], 'loc': (0, 0.04, -0.03)}),
   (0.4,  {'arm.R': [(X, -165), (Z, -25)], 'arm.L': [(X, -165), (Z, 25)], 'chest': [(X, -16)], 'head': [(X, -18)], 'loc': (0, 0.06, -0.04)}),
   (0.55, {'arm.R': [(X, -20)], 'arm.L': [(X, -20)], 'chest': [(X, 20)], 'head': [(X, 16)], 'tail': [(Y, 22)], 'loc': (0, -0.03, 0.05)}),
   (0.8,  {'arm.R': [(X, -10)], 'arm.L': [(X, -10)], 'chest': [(X, 6)], 'loc': (0, 0, 0.01)}),
   (0.95, {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -150), (Z, -30)], 'arm.L': [(X, -150), (Z, 30)], 'head': [(X, -12)], 'loc': (0, 0.07, 0)}),
   (0.45, {'arm.R': [(X, -120), (Z, -20)], 'arm.L': [(X, -120), (Z, 20)], 'head': [(X, -5)], 'loc': (0, 0, 0)}),
   (0.9,  {}),
 ],
}
INTERP = {}
