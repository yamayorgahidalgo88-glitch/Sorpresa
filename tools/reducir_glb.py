# Aligera un .glb pesado (p. ej. de Meshy/Tripo) para el juego: ~30k caras + una textura de 1024 px.
# uso: python3 reducir_glb.py entrada.glb salida.glb [caras] [yaw_grados]
import sys, io, os, numpy as np, trimesh, fast_simplification, xatlas
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
src, dst = sys.argv[1], sys.argv[2]; NF = int(sys.argv[3]) if len(sys.argv) > 3 else 30000; yaw = float(sys.argv[4]) if len(sys.argv) > 4 else 0; T = 1024
g = trimesh.load(src, force='mesh'); V0 = np.asarray(g.vertices); F0 = g.faces; UV0 = np.asarray(g.visual.uv)
tex0 = np.asarray(g.visual.material.baseColorTexture.convert('RGB')).astype(np.float32); H, W = tex0.shape[:2]
def colat(uv):
    x = np.clip(uv[:, 0] % 1 * (W-1), 0, W-1.001); y = np.clip((1 - uv[:, 1] % 1) * (H-1), 0, H-1.001); x0 = x.astype(int); y0 = y.astype(int); fx = (x-x0)[:, None]; fy = (y-y0)[:, None]
    return tex0[y0, x0]*(1-fx)*(1-fy) + tex0[y0, x0+1]*fx*(1-fy) + tex0[y0+1, x0]*(1-fx)*fy + tex0[y0+1, x0+1]*fx*fy
# nube de puntos coloreada del original (varias muestras por cara)
rng = np.random.default_rng(0); P = []; C = []
for _ in range(5):
    b = rng.dirichlet([1, 1, 1], len(F0)).astype(np.float32)
    P.append((V0[F0] * b[:, :, None]).sum(1)); C.append(colat((UV0[F0] * b[:, :, None]).sum(1)))
P = np.vstack(P); C = np.vstack(C); tree = cKDTree(P)
m = trimesh.Trimesh(V0, F0, process=False); m.merge_vertices(merge_tex=True, merge_norm=True); m.update_faces(m.nondegenerate_faces()); m.remove_unreferenced_vertices()
v, f = fast_simplification.simplify(np.asarray(m.vertices, np.float32), m.faces, target_reduction=1 - NF/len(m.faces))
s = trimesh.Trimesh(v, f, process=True); vm, F, UV = xatlas.parametrize(s.vertices, s.faces); V = np.asarray(s.vertices)[vm]; N = np.asarray(s.vertex_normals)[vm]
X = np.zeros((T, T, 3), np.float32); M = np.zeros((T, T), bool); uvp = UV*(T-1)
for tri in F:
    A, B, Cc = uvp[tri]; x0, y0 = np.floor(np.minimum(np.minimum(A, B), Cc)).astype(int); x1, y1 = np.ceil(np.maximum(np.maximum(A, B), Cc)).astype(int)
    xs, ys = np.meshgrid(np.arange(max(x0-1, 0), min(x1+2, T)), np.arange(max(y0-1, 0), min(y1+2, T)))
    den = (B[1]-Cc[1])*(A[0]-Cc[0])+(Cc[0]-B[0])*(A[1]-Cc[1])
    if abs(den) < 1e-12: continue
    w0 = ((B[1]-Cc[1])*(xs-Cc[0])+(Cc[0]-B[0])*(ys-Cc[1]))/den; w1 = ((Cc[1]-A[1])*(xs-Cc[0])+(A[0]-Cc[0])*(ys-Cc[1]))/den; w2 = 1-w0-w1
    ins = (w0 >= -0.02) & (w1 >= -0.02) & (w2 >= -0.02)
    if ins.any(): X[ys[ins], xs[ins]] = np.stack([w0[ins], w1[ins], w2[ins]], 1) @ V[tri]; M[ys[ins], xs[ins]] = True
d, idx = tree.query(X[M], k=4); w = 1/(d+1e-6)**2; col = (C[idx]*w[..., None]).sum(1)/w.sum(1, keepdims=True)
tex = np.zeros((T, T, 3), np.float32); tex[M] = col; _, ind = ndimage.distance_transform_edt(~M, return_indices=True); tex = tex[ind[0], ind[1]]
img = Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)).transpose(Image.FLIP_TOP_BOTTOM); buf = io.BytesIO(); img.save(buf, 'JPEG', quality=92); jimg = Image.open(io.BytesIO(buf.getvalue()))
a = np.radians(yaw); R = np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]]); V = V @ R.T; N = N @ R.T
V -= [(V[:, 0].min()+V[:, 0].max())/2, V[:, 1].min(), (V[:, 2].min()+V[:, 2].max())/2]; V /= np.ptp(V[:, 1])
out = trimesh.Trimesh(V, F, vertex_normals=N, visual=trimesh.visual.TextureVisuals(uv=UV, material=trimesh.visual.material.PBRMaterial(baseColorTexture=jimg, metallicFactor=0, roughnessFactor=1)), process=False)
out.export(dst); print(len(V), len(F), os.path.getsize(dst)//1024, 'KB', out.bounds.round(2).tolist())
