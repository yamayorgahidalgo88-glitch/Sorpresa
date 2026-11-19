# Animaciones de Pomona. Ejes glTF: X = izquierda del personaje (lado de la manzana), Y = arriba, Z = delante.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.2)], 'head': [(Z, -2), (X, 1)], 'hand.L': [(X, -3)], 'arm.R': [(X, 2)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.2)], 'head': [(Z, 2), (X, -2)], 'hand.L': [(X, 4)], 'arm.R': [(X, -2)], 'loc': (0, -0.006, 0)}),
   (2.0, {'chest': [(Z, 1.2)], 'head': [(Z, -2), (X, 1)], 'hand.L': [(X, -3)], 'arm.R': [(X, 2)], 'loc': (0, 0, 0)}),
 ],
 # la túnica tapa las piernas: anda balanceándose de lado a lado
 'walk': [
   (0.0,  {'hips': [(Z, 7)], 'chest': [(Z, -3)], 'head': [(Z, -2)], 'arm.R': [(X, 14)], 'hand.L': [(X, -6)], 'loc': (0, 0, 0)}),
   (0.15, {'hips': [(Z, 0)], 'chest': [(Z, 0)], 'arm.R': [(X, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'hips': [(Z, -7)], 'chest': [(Z, 3)], 'head': [(Z, 2)], 'arm.R': [(X, -14)], 'hand.L': [(X, 6)], 'loc': (0, 0, 0)}),
   (0.45, {'hips': [(Z, 0)], 'chest': [(Z, 0)], 'arm.R': [(X, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'hips': [(Z, 7)], 'chest': [(Z, -3)], 'head': [(Z, -2)], 'arm.R': [(X, 14)], 'hand.L': [(X, -6)], 'loc': (0, 0, 0)}),
 ],
 # lanza la manzana: gesto corto, con el brazo separado de la cara (suelta hacia delante ~0,17 s)
 'attack': [
   (0.0,  {}),
   (0.1,  {'arm.L': [(Z, -12), (X, 6)], 'hand.L': [(X, -18)], 'chest': [(Y, -10), (X, -3)], 'head': [(Y, 4), (Z, 4)], 'loc': (0, 0, -0.015)}),
   (0.18, {'arm.L': [(Z, -10), (X, -28)], 'hand.L': [(X, 22)], 'chest': [(Y, 12), (X, 5)], 'head': [(Y, -4)], 'loc': (0, -0.008, 0.03)}),
   (0.28, {'arm.L': [(Z, -10), (X, -24)], 'hand.L': [(X, 18)], 'chest': [(Y, 9), (X, 4)], 'loc': (0, -0.006, 0.02)}),
   (0.5,  {}),
 ],
 # escudo del jardín: alza la manzana hacia el cielo, mira arriba y se eleva un poco
 'super': [
   (0.0,  {}),
   (0.12, {'arm.L': [(X, 10)], 'hand.L': [(X, 10)], 'chest': [(X, 6)], 'head': [(X, 6)], 'loc': (0, -0.03, 0)}),
   (0.25, {'arm.L': [(X, -60), (Z, 22)], 'hand.L': [(X, 48)], 'chest': [(X, -8)], 'head': [(X, -14)], 'arm.R': [(Z, -12)], 'loc': (0, 0.05, 0)}),
   (0.5,  {'arm.L': [(X, -58), (Z, 22)], 'hand.L': [(X, 46)], 'chest': [(X, -7)], 'head': [(X, -12)], 'arm.R': [(Z, -10)], 'loc': (0, 0.04, 0)}),
   (0.75, {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.L': [(X, -65), (Z, 22)], 'hand.L': [(X, 50)], 'arm.R': [(Z, -12)], 'head': [(X, -10)], 'loc': (0, 0.08, 0)}),
   (0.45, {'arm.L': [(X, -55), (Z, 20)], 'hand.L': [(X, 42)], 'arm.R': [(Z, -8)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
