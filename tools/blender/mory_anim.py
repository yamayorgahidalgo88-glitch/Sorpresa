# Animaciones de Mory. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante (el cañón apunta a +Z).
# Giro +X = lo de arriba va hacia delante / el cañón baja; -X = el cañón sube.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'hips': [(Z, 0.6)], 'turret': [(X, -0.8)], 'chest': [(Z, -0.8)], 'head': [(X, -1.5), (Z, 1.5)], 'loc': (0, 0, 0)}),
   (1.0, {'hips': [(Z, -0.6)], 'turret': [(X, 0.8)], 'chest': [(Z, 0.8)], 'head': [(X, 1.5), (Z, -1.5)], 'loc': (0, 0.006, 0)}),
   (2.0, {'hips': [(Z, 0.6)], 'turret': [(X, -0.8)], 'chest': [(Z, -0.8)], 'head': [(X, -1.5), (Z, 1.5)], 'loc': (0, 0, 0)}),
 ],
 # traqueteo del tanque: cabecea adelante y atrás y se bambolea de lado a lado
 'walk': [
   (0.0,  {'hips': [(X, 2.5), (Z, 2)], 'turret': [(X, -2)], 'chest': [(Z, -2)], 'head': [(X, -3), (Z, 2)], 'loc': (0, 0.0, 0)}),
   (0.15, {'hips': [(X, 0), (Z, 0)], 'turret': [(X, 0)], 'chest': [(Z, 0)], 'head': [(X, 2)], 'loc': (0, 0.018, 0)}),
   (0.3,  {'hips': [(X, -2.5), (Z, -2)], 'turret': [(X, 2)], 'chest': [(Z, 2)], 'head': [(X, -3), (Z, -2)], 'loc': (0, 0.0, 0)}),
   (0.45, {'hips': [(X, 0), (Z, 0)], 'turret': [(X, 0)], 'chest': [(Z, 0)], 'head': [(X, 2)], 'loc': (0, 0.018, 0)}),
   (0.6,  {'hips': [(X, 2.5), (Z, 2)], 'turret': [(X, -2)], 'chest': [(Z, -2)], 'head': [(X, -3), (Z, 2)], 'loc': (0, 0.0, 0)}),
 ],
 # disparo: el cañón sube de golpe, el tanque retrocede y el pingüino se echa atrás
 'attack': [
   (0.0,  {}),
   (0.08, {'turret': [(X, 4)], 'chest': [(X, 4)], 'head': [(X, 5)], 'loc': (0, -0.006, 0.02)}),
   (0.16, {'turret': [(X, -12)], 'hips': [(X, -3)], 'chest': [(X, -6)], 'head': [(X, -9)], 'loc': (0, 0.012, -0.06)}),
   (0.34, {'turret': [(X, -5)], 'hips': [(X, -1)], 'chest': [(X, -2)], 'head': [(X, -3)], 'loc': (0, 0.003, -0.025)}),
   (0.55, {}),
 ],
 # truco: se agacha cargando, levanta el cañón al cielo y suelta el golpe
 'super': [
   (0.0,  {}),
   (0.2,  {'hips': [(X, 3)], 'turret': [(X, 6)], 'chest': [(X, 6)], 'head': [(X, 8)], 'loc': (0, -0.03, 0.02)}),
   (0.4,  {'hips': [(X, 3), (Z, 2)], 'turret': [(X, 5), (Z, -2)], 'chest': [(X, 6), (Z, 2)], 'head': [(X, 8), (Z, -2)], 'loc': (0, -0.035, 0.025)}),
   (0.55, {'hips': [(X, -5)], 'turret': [(X, -22)], 'chest': [(X, -8)], 'head': [(X, -12)], 'loc': (0, 0.05, -0.07)}),
   (0.75, {'hips': [(X, -2)], 'turret': [(X, -8)], 'chest': [(X, -3)], 'head': [(X, -5)], 'loc': (0, 0.01, -0.03)}),
   (0.95, {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'turret': [(X, -18)], 'head': [(X, -10)], 'chest': [(X, -4)], 'loc': (0, 0.07, 0)}),
   (0.4,  {'turret': [(X, -8)], 'head': [(X, -4)], 'loc': (0, 0.0, 0)}),
   (0.6,  {'turret': [(X, -18)], 'head': [(X, -10)], 'chest': [(X, -4)], 'loc': (0, 0.07, 0)}),
   (0.9,  {}),
 ],
}
INTERP = {}
