# Saca una pieza suelta de un .glb de Meshy que trae varias (p. ej. el ciervo o el hueso).
# uso: python3 extraer_pieza.py entrada.glb salida.glb xmin xmax ymin ymax   (coordenadas normalizadas: altura total = 1, centrado en x)
import sys, numpy as np, trimesh
src, dst = sys.argv[1], sys.argv[2]; box = list(map(float, sys.argv[3:7]))
m = trimesh.load(src, force='mesh'); v = np.asarray(m.vertices)
lo, hi = v.min(0), v.max(0); sc = max(np.ptp(v[:, 1]), np.ptp(v[:, 0]) / 1.1, np.ptp(v[:, 2]) / 1.1)
n = (v - [(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2]) / sc
c = n[m.faces].mean(1)
keep = (c[:, 0] > box[0]) & (c[:, 0] < box[1]) & (c[:, 1] > box[2]) & (c[:, 1] < box[3])
out = m.submesh([np.where(keep)[0]], append=True)
out.remove_unreferenced_vertices()
out.export(dst); print(dst, len(out.faces), 'caras', out.bounds.round(3).tolist())
