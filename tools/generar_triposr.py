# Genera un modelo 3D con textura a partir de UNA imagen usando TripoSR (github.com/VAST-AI-Research/TripoSR)
# uso: python3 gen2.py nombre=imagen[:yaw] ...   -> bestiario/assets/models/nombre.glb
import sys, os, io, time, torch, numpy as np, trimesh, fast_simplification, xatlas
from scipy import ndimage
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'repo'))
from PIL import Image
from tsr.system import TSR
torch.set_num_threads(4)
OUT = os.environ.get('OUT', '/home/user/Sorpresa/bestiario/assets/models/'); RES = int(os.environ.get('RES', 320)); NF = 30000; T = 1024
model = TSR.from_pretrained('stabilityai/TripoSR', config_name='config.yaml', weight_name='model.ckpt'); model.renderer.set_chunk_size(131072); model.to('cpu')
for spec in sys.argv[1:]:
    name, path = spec.split('='); yaw = 0.0; back = None
    if '|' in path: path, back = path.split('|')
    if ':' in path: path, yaw = path.split(':'); yaw = float(yaw)
    def prep(path):
        im = Image.open(path).convert('RGBA'); s = 435 / max(im.size); im = im.resize((int(im.width*s), int(im.height*s)), Image.LANCZOS)
        c = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); c.alpha_composite(im, ((512-im.width)//2, (512-im.height)//2))
        a = np.asarray(c).astype(np.float32) / 255; rgb = a[..., :3] * a[..., 3:] + (1 - a[..., 3:]) * 0.5
        return Image.fromarray((rgb*255).astype(np.uint8))
    t0 = time.time()
    with torch.no_grad(): codes = model([prep(path)], device='cpu')
    m = model.extract_mesh(codes, False, resolution=RES)[0]
    m.merge_vertices(); m.update_faces(m.nondegenerate_faces()); m.update_faces(m.unique_faces()); m.remove_unreferenced_vertices()
    parts = sorted(m.split(only_watertight=False), key=lambda p: -len(p.faces)); m = trimesh.util.concatenate([p for p in parts if len(p.faces) > len(parts[0].faces)*0.02])
    trimesh.smoothing.filter_taubin(m, iterations=6)
    v, f = fast_simplification.simplify(np.asarray(m.vertices, np.float32), m.faces, target_reduction=max(0, 1-NF/len(m.faces)))
    sm = trimesh.Trimesh(v, f, process=True); sm.fix_normals()
    vm, F, UV = xatlas.parametrize(sm.vertices, sm.faces); V = np.asarray(sm.vertices)[vm]; N = np.asarray(sm.vertex_normals)[vm]
    P = np.zeros((T, T, 3), np.float32); NM = np.zeros((T, T, 3), np.float32); M = np.zeros((T, T), bool); uvp = UV*(T-1)
    for tri in F:
        A, B, C = uvp[tri]; x0, y0 = np.floor(np.minimum(np.minimum(A, B), C)).astype(int); x1, y1 = np.ceil(np.maximum(np.maximum(A, B), C)).astype(int)
        xs, ys = np.meshgrid(np.arange(max(x0-1, 0), min(x1+2, T)), np.arange(max(y0-1, 0), min(y1+2, T)))
        den = (B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1])
        if abs(den) < 1e-9: continue
        w0 = ((B[1]-C[1])*(xs-C[0])+(C[0]-B[0])*(ys-C[1]))/den; w1 = ((C[1]-A[1])*(xs-C[0])+(A[0]-C[0])*(ys-C[1]))/den; w2 = 1-w0-w1
        ins = (w0 >= -0.02) & (w1 >= -0.02) & (w2 >= -0.02)
        if ins.any(): W3 = np.stack([w0[ins], w1[ins], w2[ins]], 1); P[ys[ins], xs[ins]] = W3 @ V[tri]; NM[ys[ins], xs[ins]] = W3 @ N[tri]; M[ys[ins], xs[ins]] = True
    with torch.no_grad(): col = model.renderer.query_triplane(model.decoder, torch.from_numpy(P[M]), codes[0])['color'].numpy()
    if back:   # la espalda se pinta con un segundo modelo generado desde la vista trasera
        with torch.no_grad(): cb = model([prep(back)], device='cpu')
        mb = model.extract_mesh(cb, False, resolution=160)[0]; pb = sorted(mb.split(only_watertight=False), key=lambda p: -len(p.faces))[0]
        ba, bb = sm.bounds, pb.bounds; u = (P[M] - ba.mean(0)) / np.ptp(ba, axis=0) * [-1, -1, 1]
        with torch.no_grad(): colb = model.renderer.query_triplane(model.decoder, torch.from_numpy((bb.mean(0) + u * np.ptp(bb, axis=0)).astype(np.float32)), cb[0])['color'].numpy()
        nx = NM[M][:, 0] / (np.linalg.norm(NM[M], axis=1) + 1e-9); w = np.clip((-nx - 0.15) / 0.45, 0, 1); w = (w*w*(3-2*w))[:, None]; col = col*(1-w) + colb*w
    tex = np.zeros((T, T, 3), np.float32); tex[M] = col; _, ind = ndimage.distance_transform_edt(~M, return_indices=True); tex = tex[ind[0], ind[1]]
    img = Image.fromarray(np.clip(tex*255, 0, 255).astype(np.uint8)).transpose(Image.FLIP_TOP_BOTTOM)
    buf = io.BytesIO(); img.save(buf, 'JPEG', quality=92); jimg = Image.open(io.BytesIO(buf.getvalue()))
    # TripoSR: z arriba, frente +x -> y arriba, frente +z; luego giro 'yaw' para que mire al frente
    R0 = np.array([[0, 1, 0], [0, 0, 1], [1, 0, 0]], float); a = np.radians(yaw); Ry = np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]])
    R = Ry @ R0; V2 = V @ R.T; N2 = N @ R.T
    V2 -= [(V2[:, 0].min()+V2[:, 0].max())/2, V2[:, 1].min(), (V2[:, 2].min()+V2[:, 2].max())/2]; V2 /= np.ptp(V2[:, 1])
    mat = trimesh.visual.material.PBRMaterial(baseColorTexture=jimg, metallicFactor=0, roughnessFactor=1)
    out = trimesh.Trimesh(V2, F, vertex_normals=N2, visual=trimesh.visual.TextureVisuals(uv=UV, material=mat), process=False)
    out.export(OUT+name+'.glb'); print(name, len(V2), len(F), os.path.getsize(OUT+name+'.glb')//1024, 'KB', round(time.time()-t0), 's', flush=True)
