# Animaciones de Jess. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante (el cañón apunta a +Z).
# Giro +X = lo de arriba va hacia delante / el cañón baja; -X = el cañón sube.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.2)], 'head': [(X, -2), (Z, -2)], 'gun': [(X, -1.5)], 'hips': [(Y, 1)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.2)], 'head': [(X, 2.5), (Z, 2)], 'gun': [(X, 1.5)], 'hips': [(Y, -1)], 'loc': (0, 0.008, 0)}),
   (2.0, {'chest': [(Z, 1.2)], 'head': [(X, -2), (Z, -2)], 'gun': [(X, -1.5)], 'hips': [(Y, 1)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'gun': [(X, 2), (Y, 3)], 'hips': [(Y, 6)], 'chest': [(Y, -4)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'gun': [(X, -2)], 'hips': [(Y, 0)], 'chest': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 28)], 'leg.L': [(X, -28)], 'gun': [(X, 2), (Y, -3)], 'hips': [(Y, -6)], 'chest': [(Y, 4)], 'head': [(Z, -3)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'gun': [(X, -2)], 'hips': [(Y, 0)], 'chest': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'gun': [(X, 2), (Y, 3)], 'hips': [(Y, 6)], 'chest': [(Y, -4)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
 ],
 # cañonazo: el cañón sube de golpe, ella se echa hacia atrás y vuelve a apuntar
 'attack': [
   (0.0,  {}),
   (0.08, {'gun': [(X, 4)], 'chest': [(X, 5)], 'head': [(X, 5)], 'loc': (0, -0.008, 0.02)}),
   (0.16, {'gun': [(X, -13)], 'chest': [(X, -8)], 'head': [(X, -9)], 'hips': [(X, -3)], 'leg.R': [(X, 6)], 'leg.L': [(X, 6)], 'loc': (0, 0.012, -0.05)}),
   (0.34, {'gun': [(X, -5)], 'chest': [(X, -3)], 'head': [(X, -4)], 'loc': (0, 0.003, -0.02)}),
   (0.5,  {}),
 ],
 # truco: se agacha cargando, apunta al cielo y dispara con retroceso fuerte
 'super': [
   (0.0,  {}),
   (0.2,  {'gun': [(X, 10)], 'chest': [(X, 10)], 'head': [(X, 8)], 'leg.R': [(X, -10)], 'leg.L': [(X, -10)], 'loc': (0, -0.04, 0.02)}),
   (0.4,  {'gun': [(X, 12), (Y, 2)], 'chest': [(X, 11)], 'head': [(X, 9)], 'leg.R': [(X, -11)], 'leg.L': [(X, -11)], 'loc': (0, -0.045, 0.025)}),
   (0.55, {'gun': [(X, -30)], 'chest': [(X, -14)], 'head': [(X, -14)], 'hips': [(X, -5)], 'leg.R': [(X, 8)], 'leg.L': [(X, 8)], 'loc': (0, 0.05, -0.07)}),
   (0.75, {'gun': [(X, -10)], 'chest': [(X, -5)], 'head': [(X, -5)], 'loc': (0, 0.01, -0.03)}),
   (0.9,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'gun': [(X, -45)], 'chest': [(X, -6)], 'head': [(X, -10)], 'loc': (0, 0.08, 0)}),
   (0.4,  {'gun': [(X, -32)], 'head': [(X, -5)], 'loc': (0, 0, 0)}),
   (0.6,  {'gun': [(X, -45)], 'chest': [(X, -6)], 'head': [(X, -10)], 'loc': (0, 0.08, 0)}),
   (0.9,  {}),
 ],
}
INTERP = {}
