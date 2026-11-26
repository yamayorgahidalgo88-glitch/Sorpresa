# Bolab con la boca abierta (modelo aparte): mismo esqueleto que bolab_rig, pero la boca ya viene abierta,
# así que la mandíbula no se mueve (sus pesos pasan al pecho).
import os, importlib.util, numpy as np
_sp = importlib.util.spec_from_file_location('bolab_rig', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bolab_rig.py'))
_b = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(_b)
ROOT, BONES = _b.ROOT, _b.BONES
def weights(P):
    names, W = _b.weights(P); j, c = names.index('jaw'), names.index('chest')
    W[:, c] += W[:, j]; W[:, j] = 0
    return names, W
