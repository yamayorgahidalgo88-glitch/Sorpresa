# Animaciones de Peipo. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# Cuchillo en la mano derecha; postre-bomba en la izquierda.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(Z, -2), (X, -2)], 'arm.R': [(X, -4)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(Z, 2), (X, 3)], 'arm.R': [(X, 4)], 'arm.L': [(X, -3)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(Z, -2), (X, -2)], 'arm.R': [(X, -4)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -26)], 'leg.L': [(X, 26)], 'arm.L': [(X, -15)], 'arm.R': [(X, 18)], 'hips': [(Y, 6)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 26)], 'leg.L': [(X, -26)], 'arm.L': [(X, 15)], 'arm.R': [(X, -18)], 'hips': [(Y, -6)], 'head': [(Z, -3)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -26)], 'leg.L': [(X, 26)], 'arm.L': [(X, -15)], 'arm.R': [(X, 18)], 'hips': [(Y, 6)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
 ],
 # golpes cruzados muy rápidos: el cuerpo gira y la muñeca baja el cuchillo en diagonal a un lado y al otro (impactos ~0,11 y ~0,23 s)
 'attack': [
   (0.0,  {}),
   (0.05, {'arm.R': [(X, -22), (Z, -10)], 'hand.R': [(X, -45), (Y, 15)], 'chest': [(Y, -16)], 'head': [(Y, 6)], 'loc': (0, 0, -0.01)}),
   (0.11, {'arm.R': [(X, -12), (Z, 8)], 'hand.R': [(X, 50), (Y, -25)], 'chest': [(Y, 18), (X, 4)], 'head': [(Y, -6)], 'loc': (0, 0, 0.03)}),
   (0.17, {'arm.R': [(X, -24), (Z, 12)], 'hand.R': [(X, -40), (Y, -20)], 'chest': [(Y, 12)], 'loc': (0, 0, 0.02)}),
   (0.23, {'arm.R': [(X, -12), (Z, -8)], 'hand.R': [(X, 50), (Y, 30)], 'chest': [(Y, -16), (X, 4)], 'head': [(Y, 6)], 'loc': (0, 0, 0.03)}),
   (0.38, {}),
 ],
 # postre estrella: echa la bomba atrás girando el cuerpo y la lanza en bombeo (suelta ~0,24 s)
 'super': [
   (0.0,  {}),
   (0.14, { 'chest': [(Y, 26), (X, -6)], 'head': [(Y, -10)], 'arm.R': [(X, -10)], 'loc': (0, 0, -0.03)}),
   (0.24, { 'chest': [(Y, -24), (X, 8)], 'head': [(Y, 8)], 'arm.R': [(X, 10)], 'loc': (0, -0.01, 0.05)}),
   (0.38, { 'chest': [(Y, -16), (X, 6)], 'loc': (0, -0.01, 0.04)}),
   (0.7,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -30)], 'hand.R': [(X, -50)], 'arm.L': [(X, -25)], 'hand.L': [(X, -30)], 'head': [(X, -10)], 'loc': (0, 0.09, 0)}),
   (0.45, {'arm.R': [(X, -20)], 'hand.R': [(X, -40)], 'arm.L': [(X, -15)], 'hand.L': [(X, -20)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {'attack': 'LINEAR'}
