# Animaciones de Ogul. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# Brazo colgando: -X lo lleva hacia delante; Z negativo en el brazo derecho (x<0) lo abre hacia fuera.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'head': [(X, -2), (Z, -2)], 'arm.R': [(Z, -3)], 'arm.L': [(Z, 3)], 'hips': [(Z, 1)], 'loc': (0, 0.004, 0)}),
   (1.0, {'head': [(X, 3), (Z, 2)], 'arm.R': [(Z, 3)], 'arm.L': [(Z, -3)], 'hips': [(Z, -1)], 'loc': (0, 0.022, 0)}),
   (2.0, {'head': [(X, -2), (Z, -2)], 'arm.R': [(Z, -3)], 'arm.L': [(Z, 3)], 'hips': [(Z, 1)], 'loc': (0, 0.004, 0)}),
 ],
 # levita: sin piernas ni pasos. Se inclina hacia delante para impulsarse con la energía que le sale de abajo (cada impulso lo empuja un poco más)
 'walk': [
   (0.0,  {'hips': [(X, 9)], 'head': [(X, -4)], 'arm.R': [(X, 14), (Z, -4)], 'arm.L': [(X, 14), (Z, 4)], 'loc': (0, 0.03, 0.01)}),
   (0.15, {'hips': [(X, 13)], 'head': [(X, -6)], 'arm.R': [(X, 20), (Z, -6)], 'arm.L': [(X, 20), (Z, 6)], 'loc': (0, 0.05, 0.02)}),
   (0.3,  {'hips': [(X, 9)], 'head': [(X, -4)], 'arm.R': [(X, 14), (Z, -4)], 'arm.L': [(X, 14), (Z, 4)], 'loc': (0, 0.03, 0.01)}),
   (0.45, {'hips': [(X, 12)], 'head': [(X, -5)], 'arm.R': [(X, 18), (Z, -5)], 'arm.L': [(X, 18), (Z, 5)], 'loc': (0, 0.045, 0.02)}),
   (0.6,  {'hips': [(X, 9)], 'head': [(X, -4)], 'arm.R': [(X, 14), (Z, -4)], 'arm.L': [(X, 14), (Z, 4)], 'loc': (0, 0.03, 0.01)}),
 ],
 # hechizo: levanta las dos mangas y las lanza hacia delante
 'attack': [
   (0.0,  {}),
   (0.12, {'arm.R': [(X, 25), (Z, -20)], 'arm.L': [(X, 25), (Z, 20)], 'head': [(X, -8)], 'hips': [(X, -4)], 'loc': (0, 0.01, -0.02)}),
   (0.24, {'arm.R': [(X, -70), (Z, -6)], 'arm.L': [(X, -70), (Z, 6)], 'head': [(X, 10)], 'hips': [(X, 3)], 'loc': (0, 0, 0.04)}),
   (0.45, {'arm.R': [(X, -60)], 'arm.L': [(X, -60)], 'head': [(X, 7)], 'hips': [(X, 2)], 'loc': (0, 0, 0.03)}),
   (0.6,  {}),
 ],
 'super': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(Z, -55), (X, -30)], 'arm.L': [(Z, 55), (X, -30)], 'head': [(X, -14)], 'hips': [(X, -5)], 'loc': (0, 0.07, 0)}),
   (0.45, {'arm.R': [(Z, -75), (X, -40)], 'arm.L': [(Z, 75), (X, -40)], 'head': [(X, -18)], 'hips': [(X, -7)], 'loc': (0, 0.11, 0)}),
   (0.62, {'arm.R': [(X, -85), (Z, 0)], 'arm.L': [(X, -85), (Z, 0)], 'head': [(X, 14)], 'hips': [(X, 9)], 'loc': (0, -0.02, 0.05)}),
   (0.9,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(Z, -80), (X, -30)], 'arm.L': [(Z, 80), (X, -30)], 'head': [(X, -10)], 'loc': (0, 0.1, 0)}),
   (0.45, {'arm.R': [(Z, -60), (X, -20)], 'arm.L': [(Z, 60), (X, -20)], 'head': [(X, -4)], 'loc': (0, 0.02, 0)}),
   (0.9,  {}),
 ],
}
INTERP = {}
