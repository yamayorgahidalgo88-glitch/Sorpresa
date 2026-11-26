# Animaciones de Bolab. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(X, 1)], 'head': [(X, -2)], 'jaw': [(X, 0)], 'tail': [(Y, 6)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(X, -2)], 'head': [(X, 3)], 'jaw': [(X, 4)], 'tail': [(Y, -6)], 'loc': (0, -0.01, 0)}),
   (2.0, {'chest': [(X, 1)], 'head': [(X, -2)], 'jaw': [(X, 0)], 'tail': [(Y, 6)], 'loc': (0, 0, 0)}),
 ],
 # anda dando saltitos de rana
 'walk': [
   (0.0,  {'hips': [(X, 0)], 'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'tail': [(X, 0)], 'loc': (0, 0, 0)}),
   (0.1,  {'hips': [(X, 10)], 'leg.R': [(X, -25)], 'leg.L': [(X, -25)], 'head': [(X, -6)], 'tail': [(X, 15)], 'loc': (0, 0.08, 0.02)}),
   (0.22, {'hips': [(X, 4)], 'leg.R': [(X, 10)], 'leg.L': [(X, 10)], 'head': [(X, 3)], 'tail': [(X, -8)], 'loc': (0, 0.03, 0.03)}),
   (0.3,  {'hips': [(X, -3)], 'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'head': [(X, 4)], 'jaw': [(X, 5)], 'loc': (0, -0.015, 0)}),
   (0.4,  {}),
 ],
 # cabezazo / lametazo: se echa atrás, abre la boca y se lanza hacia delante (impacto ~0,19 s)
 'attack': [
   (0.0,  {}),
   (0.09, {'hips': [(X, -14)], 'head': [(X, -8)], 'jaw': [(X, 8)], 'tail': [(X, 12)], 'loc': (0, -0.02, -0.04)}),
   (0.19, {'hips': [(X, 16)], 'head': [(X, -6)], 'jaw': [(X, 45)], 'tail': [(X, -10)], 'loc': (0, 0.02, 0.09)}),
   (0.36, {'hips': [(X, 12)], 'head': [(X, -5)], 'jaw': [(X, 42)], 'loc': (0, 0.01, 0.06)}),
   (0.55, {}),
 ],
 'super': [
   (0.0,  {}),
   (0.12, {'hips': [(X, -16)], 'head': [(X, -10)], 'jaw': [(X, 10)], 'loc': (0, -0.03, -0.05)}),
   (0.25, {'hips': [(X, 22)], 'head': [(X, 8)], 'jaw': [(X, 32)], 'leg.R': [(X, -30)], 'leg.L': [(X, -30)], 'loc': (0, 0.06, 0.14)}),
   (0.45, {'hips': [(X, 8)], 'jaw': [(X, 10)], 'loc': (0, 0, 0.05)}),
   (0.7,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.15, {'hips': [(X, -6)], 'head': [(X, -10)], 'jaw': [(X, 30)], 'leg.R': [(X, -20)], 'leg.L': [(X, -20)], 'tail': [(Y, 20)], 'loc': (0, 0.12, 0)}),
   (0.3,  {'jaw': [(X, 10)], 'tail': [(Y, -20)], 'loc': (0, 0, 0)}),
   (0.45, {'hips': [(X, -6)], 'head': [(X, -10)], 'jaw': [(X, 30)], 'leg.R': [(X, -20)], 'leg.L': [(X, -20)], 'tail': [(Y, 20)], 'loc': (0, 0.1, 0)}),
   (0.6,  {'jaw': [(X, 5)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
