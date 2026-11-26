# Animaciones de Wyrex. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(X, -3), (Z, -2)], 'arm.R': [(X, -4)], 'arm.L': [(X, 4)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(X, 4), (Z, 2)], 'arm.R': [(X, 4)], 'arm.L': [(X, -4)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(X, -3), (Z, -2)], 'arm.R': [(X, -4)], 'arm.L': [(X, 4)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -30)], 'leg.L': [(X, 30)], 'arm.L': [(X, -25)], 'arm.R': [(X, 25)], 'hips': [(Y, 6)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.035, 0)}),
   (0.3,  {'leg.R': [(X, 30)], 'leg.L': [(X, -30)], 'arm.L': [(X, 25)], 'arm.R': [(X, -25)], 'hips': [(Y, -6)], 'head': [(Z, -3)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.035, 0)}),
   (0.6,  {'leg.R': [(X, -30)], 'leg.L': [(X, 30)], 'arm.L': [(X, -25)], 'arm.R': [(X, 25)], 'hips': [(Y, 6)], 'head': [(Z, 3)], 'loc': (0, 0, 0)}),
 ],
 # lanza el hueso con la mano derecha: brazo atrás y por encima, suelta hacia delante (~0,15 s)
 'attack': [
   (0.0,  {}),
   (0.09, {'arm.R': [(X, 70), (Z, -25)], 'hand.R': [(X, 30)], 'chest': [(Y, -24), (X, -6)], 'head': [(Y, 10)], 'arm.L': [(X, -20)], 'loc': (0, 0, -0.02)}),
   (0.16, {'arm.R': [(X, -105), (Z, -10)], 'hand.R': [(X, -25)], 'chest': [(Y, 26), (X, 10)], 'head': [(Y, -8), (X, 5)], 'arm.L': [(X, 25)], 'loc': (0, -0.01, 0.05)}),
   (0.26, {'arm.R': [(X, -80), (Z, -8)], 'hand.R': [(X, -15)], 'chest': [(Y, 20), (X, 8)], 'arm.L': [(X, 15)], 'loc': (0, -0.01, 0.04)}),
   (0.5,  {}),
 ],
 # invoca el reno: se agacha, alza los brazos hacia delante y ruge mirando arriba
 'super': [
   (0.0,  {}),
   (0.12, {'arm.R': [(X, 15)], 'arm.L': [(X, 15)], 'chest': [(X, 12)], 'head': [(X, 10)], 'leg.R': [(X, -12)], 'leg.L': [(X, 12)], 'loc': (0, -0.04, 0)}),
   (0.28, {'arm.R': [(X, -75), (Z, -22)], 'hand.R': [(X, -20)], 'arm.L': [(X, -75), (Z, 22)], 'hand.L': [(X, -20)], 'chest': [(X, -8)], 'head': [(X, -20)], 'loc': (0, 0.05, 0)}),
   (0.55, {'arm.R': [(X, -70), (Z, -20)], 'hand.R': [(X, -15)], 'arm.L': [(X, -70), (Z, 20)], 'hand.L': [(X, -15)], 'chest': [(X, -6)], 'head': [(X, -16)], 'loc': (0, 0.04, 0)}),
   (0.8,  {}),
 ],
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(X, -80), (Z, -20)], 'arm.L': [(X, -80), (Z, 20)], 'head': [(X, -14)], 'loc': (0, 0.09, 0)}),
   (0.45, {'arm.R': [(X, -65), (Z, -18)], 'arm.L': [(X, -65), (Z, 18)], 'head': [(X, -8)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {}
