# Blender (modo consola): monta esqueleto + animaciones sobre un modelo de Meshy y exporta un .glb para el juego.
# uso: blender -b -P animar.py -- entrada.glb salida.glb definicion_rig.py animaciones.py [caras] [textura_px]
import bpy, sys, math, importlib.util
import numpy as np
from mathutils import Vector, Quaternion, Matrix
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT, RIGDEF, ANIMDEF = argv[:4]
NF = int(argv[4]) if len(argv) > 4 else 40000; TEX = int(argv[5]) if len(argv) > 5 else 2048
def load(p, n):
    sp = importlib.util.spec_from_file_location(n, p); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
R = load(RIGDEF, 'rigdef'); A = load(ANIMDEF, 'animdef')
B = lambda g: Vector((g[0], -g[2], g[1]))            # glTF (y arriba) -> Blender (z arriba)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in bpy.context.scene.objects: o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
if len(meshes) > 1: bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
for o in list(bpy.context.scene.objects):
    if o != ob: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# normalizar: pies en z=0, centrado en x/y, altura 1
co = np.zeros(len(ob.data.vertices) * 3); ob.data.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
lo, hi = co.min(0), co.max(0); co -= [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]]; co /= (hi[2] - lo[2])
ob.data.vertices.foreach_set('co', co.ravel()); ob.data.update()
# aligerar
nt = sum(len(p.vertices) - 2 for p in ob.data.polygons)
if nt > NF:
    md = ob.modifiers.new('dec', 'DECIMATE'); md.ratio = NF / nt; bpy.ops.object.modifier_apply(modifier='dec')
# material: solo el color (el juego lo pinta sin luces); textura reducida
for mat in ob.data.materials:
    nodes = mat.node_tree.nodes; bsdf = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf: continue
    for inp in ('Metallic', 'Roughness', 'Normal'):
        for l in list(bsdf.inputs[inp].links): mat.node_tree.links.remove(l)
    bsdf.inputs['Metallic'].default_value = 0; bsdf.inputs['Roughness'].default_value = 1
    for n in list(nodes):
        if n.type == 'TEX_IMAGE' and not any(l.to_node == bsdf and l.to_socket.name == 'Base Color' for l in n.outputs[0].links): nodes.remove(n)
        elif n.type == 'NORMAL_MAP' or n.type == 'SEPARATE_COLOR': nodes.remove(n)
    for n in nodes:
        if n.type == 'TEX_IMAGE' and n.image and max(n.image.size) > TEX: n.image.scale(TEX, TEX)
print('caras', len(ob.data.polygons), 'vertices', len(ob.data.vertices))

# esqueleto
ad = bpy.data.armatures.new('rig'); arm = bpy.data.objects.new('rig', ad); bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
rb = ad.edit_bones.new('root'); rb.head = B(R.ROOT); rb.tail = B((R.ROOT[0], R.ROOT[1] + 0.08, R.ROOT[2]))
for name, (h, t, par) in R.BONES.items():
    eb = ad.edit_bones.new(name); eb.head = B(h); eb.tail = B(t)
for name, (h, t, par) in R.BONES.items():
    ad.edit_bones[name].parent = ad.edit_bones[par or 'root']
bpy.ops.object.mode_set(mode='OBJECT')
# pesos
# pieza que debe separarse limpia (p. ej. la plantita de Sevora): se corta de la malla para que al moverla no arrastre la piel
SPLIT = None
if hasattr(R, 'split_faces'):
    import bmesh
    bm = bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table()
    cen = np.array([[f.calc_center_median()[0], f.calc_center_median()[2], -f.calc_center_median()[1]] for f in bm.faces])
    mask = R.split_faces(cen); sel = [f for f, m_ in zip(bm.faces, mask) if m_]
    bmesh.ops.split(bm, geom=sel + list({e for f in sel for e in f.edges}) + list({v for f in sel for v in f.verts}))
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bm = bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table()
    cen = np.array([[f.calc_center_median()[0], f.calc_center_median()[2], -f.calc_center_median()[1]] for f in bm.faces])
    mask = R.split_faces(cen); SPLIT = np.zeros(len(ob.data.vertices), bool); other = np.zeros(len(ob.data.vertices), bool)
    for f, m_ in zip(bm.faces, mask):
        for v in f.verts: (SPLIT if m_ else other)[v.index] = True
    bm.free(); print('pieza separada: vertices', int(SPLIT.sum()), 'compartidos', int((SPLIT & other).sum()))
co = np.zeros(len(ob.data.vertices) * 3); ob.data.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
G = np.stack([co[:, 0], co[:, 2], -co[:, 1]], 1)
names, W = R.weights(G)
if SPLIT is not None:
    j = names.index(R.SPLIT_BONE)
    W[SPLIT] = 0; W[SPLIT, j] = 1
    W[~SPLIT, j] = 0; z = W[~SPLIT].sum(1) < 1e-6; idx = np.where(~SPLIT)[0][z]; W[idx, names.index(R.SPLIT_PARENT)] = 1
    W /= W.sum(1, keepdims=True)
for j, n in enumerate(names):
    vg = ob.vertex_groups.new(name=n); idx = np.where(W[:, j] > 0.01)[0]
    for i in idx: vg.add([int(i)], float(W[i, j]), 'REPLACE')
ob.parent = arm; md = ob.modifiers.new('arm', 'ARMATURE'); md.object = arm

# animaciones: rotaciones dadas en ejes del mundo glTF (x: izquierda del personaje, y: arriba, z: delante)
FPS = 30; bpy.context.scene.render.fps = FPS
arm.animation_data_create()
def qworld(rots):
    q = Quaternion()
    for ax, deg in rots: q = Quaternion(B(ax).normalized(), math.radians(deg)) @ q
    return q
for clip, keys in A.CLIPS.items():
    act = bpy.data.actions.new(clip); act.use_fake_user = True; arm.animation_data.action = act
    bones = set(['root']) | {b for _, pose in keys for b in pose if b != 'loc'}
    for t, pose in keys:
        f = round(t * FPS) + 1
        for bn in bones:
            pb = arm.pose.bones[bn]; pb.rotation_mode = 'QUATERNION'
            M = pb.bone.matrix_local.to_3x3()
            qw = qworld(pose.get(bn, []))
            pb.rotation_quaternion = (M.inverted() @ qw.to_matrix() @ M).to_quaternion()
            pb.keyframe_insert('rotation_quaternion', frame=f)
            if bn == 'root':
                pb.location = M.inverted() @ B(pose.get('loc', (0, 0, 0))); pb.keyframe_insert('location', frame=f)
    for fc in act.fcurves:
        for k in fc.keyframe_points: k.interpolation = A.INTERP.get(clip, 'BEZIER')
arm.animation_data.action = None
for o in bpy.context.scene.objects: o.select_set(True)
kw = dict(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True,
          export_image_format='JPEG', export_apply=False, export_yup=True, export_morph=False, export_skins=True)
try: bpy.ops.export_scene.gltf(**kw, export_jpeg_quality=85)
except TypeError: bpy.ops.export_scene.gltf(**kw)
print('OK', OUT)
