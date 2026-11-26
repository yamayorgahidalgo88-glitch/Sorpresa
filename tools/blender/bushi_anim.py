# Animaciones de Bushi. Ejes glTF: X = izquierda del personaje, Y = arriba, Z = delante.
# Cada clave: (segundo, {hueso: [(eje, grados), ...], 'loc': desplazamiento del cuerpo})
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
CLIPS = {
 'idle': [
   (0.0, {'chest': [(Z, 1.5)], 'head': [(X, -2)], 'arm.R': [(X, -3)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
   (1.0, {'chest': [(Z, -1.5)], 'head': [(X, 3)], 'arm.R': [(X, 3)], 'arm.L': [(X, -3)], 'loc': (0, -0.008, 0)}),
   (2.0, {'chest': [(Z, 1.5)], 'head': [(X, -2)], 'arm.R': [(X, -3)], 'arm.L': [(X, 3)], 'loc': (0, 0, 0)}),
 ],
 'walk': [
   (0.0,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.L': [(X, 22)], 'arm.R': [(X, -8)], 'hips': [(Y, 6)], 'head': [(Z, 2)], 'loc': (0, 0, 0)}),
   (0.15, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.3,  {'leg.R': [(X, 28)], 'leg.L': [(X, -28)], 'arm.L': [(X, -22)], 'arm.R': [(X, 8)], 'hips': [(Y, -6)], 'head': [(Z, -2)], 'loc': (0, 0, 0)}),
   (0.45, {'leg.R': [(X, 0)], 'leg.L': [(X, 0)], 'arm.L': [(X, 0)], 'arm.R': [(X, 0)], 'hips': [(Y, 0)], 'loc': (0, 0.03, 0)}),
   (0.6,  {'leg.R': [(X, -28)], 'leg.L': [(X, 28)], 'arm.L': [(X, 22)], 'arm.R': [(X, -8)], 'hips': [(Y, 6)], 'head': [(Z, 2)], 'loc': (0, 0, 0)}),
 ],
 # tajo: carga la espada atrás por encima del hombro, golpe en diagonal hacia delante (impacto ~0,2 s) y vuelve
 'attack': [
   (0.0,  {}),
   (0.12, {'arm.R': [(X, -45), (Z, -30)], 'hand.R': [(X, -60)], 'chest': [(Y, -22), (X, -5)], 'head': [(Y, 8)], 'arm.L': [(X, 15)], 'loc': (0, -0.01, -0.02)}),
   (0.2,  {'arm.R': [(X, -35), (Z, 10)], 'hand.R': [(X, 95), (Y, 30)], 'chest': [(Y, 28), (X, 8)], 'head': [(Y, -10)], 'arm.L': [(X, -20)], 'loc': (0, -0.02, 0.05)}),
   (0.3,  {'arm.R': [(X, -20), (Z, 20), (Y, 25)], 'hand.R': [(X, 110), (Y, 40)], 'chest': [(Y, 32), (X, 8)], 'head': [(Y, -10)], 'arm.L': [(X, -15)], 'loc': (0, -0.015, 0.04)}),
   (0.5,  {}),
 ],
 # giro de jade: se agacha, abre el brazo con la espada en horizontal, da una vuelta entera y remata
 'super': [
   (0.0,  {}),
   (0.12, {'arm.R': [(Z, -28)], 'hand.R': [(Z, 95), (X, 15)], 'chest': [(Y, -25)], 'leg.R': [(X, -15)], 'leg.L': [(X, 15)], 'loc': (0, -0.04, 0)}),
   (0.2,  {'root': [(Y, 0)], 'arm.R': [(Z, -30)], 'hand.R': [(Z, 118), (X, 10)], 'chest': [(Y, -20)], 'loc': (0, -0.02, 0)}),
   (0.28, {'root': [(Y, -90)], 'arm.R': [(Z, -30)], 'hand.R': [(Z, 118), (X, 10)], 'chest': [(Y, -15)], 'loc': (0, 0.03, 0)}),
   (0.36, {'root': [(Y, -180)], 'arm.R': [(Z, -30)], 'hand.R': [(Z, 118), (X, 10)], 'chest': [(Y, -15)], 'loc': (0, 0.05, 0)}),
   (0.44, {'root': [(Y, -270)], 'arm.R': [(Z, -30)], 'hand.R': [(Z, 118), (X, 10)], 'chest': [(Y, -15)], 'loc': (0, 0.03, 0)}),
   (0.52, {'root': [(Y, -360)], 'arm.R': [(Z, -28)], 'hand.R': [(Z, 100)], 'chest': [(Y, -10)], 'loc': (0, -0.02, 0)}),
   (0.7,  {}),
 ],
 # celebración: salta y levanta la espada bien alta
 'cheer': [
   (0.0,  {}),
   (0.2,  {'arm.R': [(Z, -110)], 'hand.R': [(Z, 110)], 'arm.L': [(Z, 45)], 'head': [(X, -10)], 'loc': (0, 0.08, 0)}),
   (0.45, {'arm.R': [(Z, -100)], 'hand.R': [(Z, 100)], 'arm.L': [(Z, 35)], 'loc': (0, 0, 0)}),
   (0.8,  {}),
 ],
}
INTERP = {'super': 'LINEAR'}
