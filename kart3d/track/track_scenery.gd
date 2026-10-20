class_name TrackScenery
extends RefCounted
## Decorado del circuito: arco de meta, árboles, conos, gradas, colinas y nubes de fondo.
## Nada de esto tiene colisión: solo los muros y el suelo de TrackBuilder interactúan con
## los karts. Los elementos repetidos usan MultiMesh para limitar las llamadas de dibujo.

const KIT := "res://assets/kenney/toy-car-kit/"
const SEED := 7

var track: TrackBuilder
var rng := RandomNumberGenerator.new()


func _init(t: TrackBuilder) -> void:
	track = t
	rng.seed = SEED


func build() -> void:
	_start_gate()
	_trees()
	_cones()
	_grandstand()
	_backdrop()


func _mesh_of(path: String) -> Mesh:
	var n := (load(path) as PackedScene).instantiate()
	var mi := n.find_children("*", "MeshInstance3D", true, false)[0] as MeshInstance3D
	var mesh := mi.mesh
	n.free()
	return mesh


func _place(path: String, xform: Transform3D) -> Node3D:
	var n := (load(path) as PackedScene).instantiate() as Node3D
	n.transform = xform
	track.add_child(n)
	ToonLook.apply(n, null, 0.25)
	return n


## Distancia horizontal de un punto a la línea central.
func _clearance(p: Vector3) -> float:
	var c := track.curve.get_closest_point(track.to_local(p))
	return Vector2(p.x - c.x, p.z - c.z).length()


func _start_gate() -> void:
	var xf := track.transform_at(0.0)
	xf.origin.y = 0.0
	xf = xf.scaled_local(Vector3((track.road_width + 4.0) / 1.55, 8.0, 8.0))
	_place(KIT + "gate-finish.glb", xf)


func _trees() -> void:
	var meshes := [_mesh_of(KIT + "tree.glb"), _mesh_of(KIT + "tree-pine.glb")]
	var xforms := [[], []]
	var min_clear := track.road_width * 0.5 + track.wall_margin + 3.0
	var d := 0.0
	while d < track.length:
		for side in [-1.0, 1.0]:
			if rng.randf() < 0.35:
				continue
			var lateral: float = side * rng.randf_range(min_clear, min_clear + 45.0)
			var p := track.point_at(d + rng.randf_range(-4.0, 4.0), lateral)
			if _clearance(p) < min_clear:
				continue
			var s := rng.randf_range(7.0, 12.0)
			var b := Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * s)
			xforms[rng.randi() % 2].append(Transform3D(b, Vector3(p.x, 0.0, p.z)))
		d += 9.0
	for i in 2:
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = meshes[i]
		mm.instance_count = xforms[i].size()
		for j in xforms[i].size():
			mm.set_instance_transform(j, xforms[i][j])
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		track.add_child(mmi)


func _cones() -> void:
	var mesh := _mesh_of(KIT + "item-cone.glb")
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	var xforms: Array[Transform3D] = []
	var outside := track.road_width * 0.5 + track.wall_margin + 1.2
	var d := 0.0
	while d < track.length:
		for side in [-1.0, 1.0]:
			var p := track.point_at(d, side * outside)
			if _clearance(p) >= outside - 0.5:
				xforms.append(Transform3D(Basis().scaled(Vector3.ONE * 4.0), Vector3(p.x, 0.0, p.z)))
		d += 24.0
	mm.instance_count = xforms.size()
	for j in xforms.size():
		mm.set_instance_transform(j, xforms[j])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	track.add_child(mmi)


## Gradas de estilo juguete junto a la recta de meta (geometría propia, coherente con el kit).
func _grandstand() -> void:
	var root := Node3D.new()
	var side := -1.0
	var base := track.transform_at(-30.0, side * (track.road_width * 0.5 + track.wall_margin + 7.0))
	base.origin.y = 0.0
	root.transform = base
	track.add_child(root)
	var colors := [Color("#ffffff"), Color("#ff4f6e")]
	for row in 5:
		var step := BoxMesh.new()
		step.size = Vector3(4.0, 1.0 + row * 1.0, 40.0)
		var mi := MeshInstance3D.new()
		mi.mesh = step
		mi.position = Vector3(side * row * 3.0, (1.0 + row) * 0.5, 0.0)
		var m := StandardMaterial3D.new()
		m.albedo_color = colors[row % 2]
		m.roughness = 0.6
		mi.material_override = m
		root.add_child(mi)
	var roof := BoxMesh.new()
	roof.size = Vector3(17.0, 0.5, 42.0)
	var r := MeshInstance3D.new()
	r.mesh = roof
	r.position = Vector3(side * 6.0, 9.0, 0.0)
	var rm := StandardMaterial3D.new()
	rm.albedo_color = Color("#5fc8ff")
	r.material_override = rm
	root.add_child(r)
	for z in [-19.0, 19.0]:
		var post := CylinderMesh.new()
		post.top_radius = 0.3
		post.bottom_radius = 0.3
		post.height = 9.0
		var pm := MeshInstance3D.new()
		pm.mesh = post
		pm.position = Vector3(side * 13.5, 4.5, z)
		pm.material_override = rm
		root.add_child(pm)


## Colinas y nubes lejanas en colores pastel para dar profundidad al horizonte.
func _backdrop() -> void:
	var palette := [Color("#ffb3d1"), Color("#b7a6ff"), Color("#8fdcc0"), Color("#ffd59a")]
	var center := Vector3(80.0, 0.0, -30.0)
	for i in 26:
		var a := TAU * i / 26.0 + rng.randf_range(-0.08, 0.08)
		var dist := rng.randf_range(420.0, 560.0)
		var hill := SphereMesh.new()
		hill.radius = rng.randf_range(60.0, 110.0)
		hill.height = hill.radius * rng.randf_range(1.0, 1.6)
		hill.radial_segments = 12
		hill.rings = 6
		var mi := MeshInstance3D.new()
		mi.mesh = hill
		mi.position = center + Vector3(cos(a), 0.0, sin(a)) * dist
		var m := StandardMaterial3D.new()
		m.albedo_color = palette[i % palette.size()]
		m.roughness = 1.0
		mi.material_override = m
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		track.add_child(mi)
	var cloud_m := StandardMaterial3D.new()
	cloud_m.albedo_color = Color.WHITE
	cloud_m.roughness = 1.0
	cloud_m.rim_enabled = true
	cloud_m.rim = 0.6
	for i in 14:
		var a := rng.randf() * TAU
		var pos := center + Vector3(cos(a), 0.0, sin(a)) * rng.randf_range(250.0, 450.0) + Vector3.UP * rng.randf_range(90.0, 150.0)
		for k in 4:
			var puff := SphereMesh.new()
			puff.radius = rng.randf_range(10.0, 18.0)
			puff.height = puff.radius * 1.3
			puff.radial_segments = 10
			puff.rings = 5
			var c := MeshInstance3D.new()
			c.mesh = puff
			c.position = pos + Vector3((k - 1.5) * 14.0, rng.randf_range(-3.0, 5.0), rng.randf_range(-6.0, 6.0))
			c.material_override = cloud_m
			c.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			track.add_child(c)
