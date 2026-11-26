# Animaciones de Rogue. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# Brazo colgando: -X lo lleva hacia delante.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.2)], 'head': [(X, -2), (Z, -2)], 'arm.R': [(X, -4)], 'arm.L': [(X, 2)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.2)], 'head': [(X, 3), (Z, 2)], 'arm.R': [(X, 4)], 'arm.L': [(X, -2)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.2)], 'head': [(X, -2), (Z, -2)], 'arm.R': [(X, -4)], 'arm.L': [(X, 2)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.R': [(X, 20)], 'arm.L': [(X, -6)], 'hips': [(Y, 6)], 'chest': [(Y, -4)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.R': [(X, 0)], 'arm.L': [(X, 0)], 'hips': [(Y, 0)], 'chest': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 28)], 'leg.L': [(X, -28)], 'arm.R': [(X, -20)], 'arm.L': [(X, 6)], 'hips': [(Y, -6)], 'chest': [(Y, 4)], 'head': [(Z, -3)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.R': [(X, 0)], 'arm.L': [(X, 0)], 'hips': [(Y, 0)], 'chest': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.R': [(X, 20)], 'arm.L': [(X, -6)], 'hips': [(Y, 6)], 'chest': [(Y, -4)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
 ],
 # puñetazo de piedra con el brazo derecho; el escudo se adelanta un poco
 'attack': [
   (0.0,  {}),
   (0.1,  {'arm.R': [(X, 45), (Z, -8)], 'arm.L': [(X, -10)], 'chest': [(Y, 14)], 'head': [(Y, -5)], 'loc': (0, 0, -0.02)}),
   (0.2,  {'arm.R': [(X, -75), (Z, 5)], 'arm.L': [(X, -22)], 'chest': [(Y, -16), (X, 8)], 'head': [(Y, 6)], 'leg.R': [(X, 8)], 'leg.L': [(X, -12)], 'loc': (0, -0.01, 0.05)}),
   (0.38, {'arm.R': [(X, -65)], 'arm.L': [(X, -15)], 'chest': [(Y, -12), (X, 6)], 'loc': (0, 0, 0.03)}),
   (0.55, {}),
 ],
 # truco: se cubre con el escudo y arremete
 'super': [
   (0.0,  {}),
   (0.2,  {'arm.L': [(X, -80), (Z, -12)], 'arm.R': [(X, 30)], 'chest': [(X, 10)], 'head': [(X, 6)], 'leg.R': [(X, -12)], 'leg.L': [(X, -12)], 'loc': (0, -0.04, 0)}),
   (0.4,  {'arm.L': [(X, -85), (Z, -12)], 'arm.R': [(X, 35)], 'chest': [(X, 12)], 'loc': (0, -0.045, 0.01)}),
   (0.55, {'arm.L': [(X, -95)], 'arm.R': [(X, -100)], 'chest': [(X, 16)], 'head': [(X, 10)], 'leg.R': [(X, 14)], 'leg.L': [(X, -8)], 'loc': (0, 0.0, 0.08)}),
   (0.85, {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -150), (Z, -10)], 'arm.L': [(X, -20)], 'head': [(X, -10)], 'loc': (0, 0.08, 0)}),
   (0.45, {'arm.R': [(X, -120)], 'head': [(X, -4)], 'loc': (0, 0, 0)}),
   (0.9,  {}),
 ],
}
INTERP = {}
