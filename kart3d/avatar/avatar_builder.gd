class_name AvatarBuilder
extends RefCounted
## Construye un avatar a partir de un AvatarConfig: toma el cuerpo de un modelo y la cabeza
## de otro, ambos sobre el mismo esqueleto de 7 huesos, aplica el recoloreado por paleta,
## las proporciones y los accesorios. No crea un modelo distinto por combinación.

const SHADER := preload("res://avatar/palette_remap.gdshader")
const PALETTE := preload("res://assets/kenney/mini-characters/Textures/colormap.png")


## Devuelve la raíz del avatar (con su AnimationPlayer dentro).
static func build(cfg: AvatarConfig) -> Node3D:
	var root := (load(AvatarCatalog.DIR + AvatarCatalog.BODIES[cfg.body]["file"]) as PackedScene).instantiate() as Node3D
	var skel := root.find_child("Skeleton3D", true, false) as Skeleton3D
	var body_mesh := skel.get_node("body-mesh") as MeshInstance3D
	# Sustituye la cabeza del modelo base por la elegida.
	skel.get_node("head-mesh").free()
	var head_src := (load(AvatarCatalog.DIR + AvatarCatalog.HEADS[cfg.head]["file"]) as PackedScene).instantiate()
	var head_mesh := head_src.find_child("head-mesh", true, false) as MeshInstance3D
	head_mesh.get_parent().remove_child(head_mesh)
	head_mesh.owner = null
	skel.add_child(head_mesh)
	head_mesh.skeleton = NodePath("..")
	head_src.free()
	body_mesh.material_override = _material(cfg.body_remaps())
	head_mesh.material_override = _material(cfg.head_remaps())
	# Proporciones: altura global y tamaño de la cabeza (aplicado tras la animación).
	root.scale = Vector3.ONE * cfg.height
	var prop := AvatarProportions.new()
	prop.head_scale = cfg.head_scale
	skel.add_child(prop)
	_attach_accessory(skel, cfg)
	return root


static func _material(remaps: Array[Vector4]) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = SHADER
	m.set_shader_parameter("palette", PALETTE)
	m.set_shader_parameter("remap_count", remaps.size())
	var padded := remaps.duplicate()
	padded.resize(12)
	for i in range(remaps.size(), 12):
		padded[i] = Vector4(-1, -1, -1, -1)
	m.set_shader_parameter("remaps", PackedVector4Array(padded))
	return m


static func _attach_accessory(skel: Skeleton3D, cfg: AvatarConfig) -> void:
	var file: String = AvatarCatalog.ACCESSORIES[cfg.accessory]["file"]
	if file == "":
		return
	var attach := BoneAttachment3D.new()
	attach.bone_name = "head"
	skel.add_child(attach)
	var acc := (load(AvatarCatalog.DIR + file) as PackedScene).instantiate() as Node3D
	# Posición relativa al hueso de la cabeza, ajustada a ojo sobre los modelos de Kenney.
	acc.position = Vector3(0.0, 0.1, 0.175)
	attach.add_child(acc)
	ToonLook.apply(acc)
