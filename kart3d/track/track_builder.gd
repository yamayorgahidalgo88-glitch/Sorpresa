class_name TrackBuilder
extends Node3D
## Genera un circuito *greybox* a partir de puntos de control: suelo, carretera, pianos,
## muros, línea de meta y consultas de progreso (offset sobre la línea central).
## PROVISIONAL en lo visual: la geometría definitiva vendrá de un kit modular de circuito.

@export var control_points: PackedVector3Array
@export var road_width := 14.0
@export var wall_margin := 7.0
@export var sample_step := 2.0

var curve := Curve3D.new()
var length := 0.0


func build() -> void:
	_build_curve()
	_build_ground()
	_build_road()
	_build_walls()
	_build_start_line()


## Distancia recorrida sobre la línea central más cercana a `world_pos` (0..length).
func get_offset(world_pos: Vector3) -> float:
	return curve.get_closest_offset(to_local(world_pos))


func get_progress(world_pos: Vector3) -> float:
	return get_offset(world_pos) / length


func point_at(offset: float, lateral := 0.0) -> Vector3:
	var d := fposmod(offset, length)
	return to_global(curve.sample_baked(d) + _right_at(d) * lateral)


func transform_at(offset: float, lateral := 0.0) -> Transform3D:
	var d := fposmod(offset, length)
	var fwd := _forward_at(d)
	return Transform3D(Basis(Vector3.UP, atan2(-fwd.x, -fwd.z)), point_at(d, lateral) + Vector3.UP * 0.3)


func surface_at(world_pos: Vector3) -> StringName:
	var local := to_local(world_pos)
	var center := curve.sample_baked(curve.get_closest_offset(local))
	var lateral := Vector2(local.x - center.x, local.z - center.z).length()
	return &"road" if lateral <= road_width * 0.5 + 0.5 else &"offroad"


func _forward_at(d: float) -> Vector3:
	var a := curve.sample_baked(fposmod(d - 1.0, length))
	var b := curve.sample_baked(fposmod(d + 1.0, length))
	var f := b - a
	f.y = 0.0
	return f.normalized()


func _right_at(d: float) -> Vector3:
	return _forward_at(d).cross(Vector3.UP).normalized()


func _build_curve() -> void:
	# Catmull-Rom cerrada convertida a tangentes Bézier.
	curve.clear_points()
	curve.bake_interval = 1.0
	var n := control_points.size()
	for i in n + 1:
		var p1 := control_points[i % n]
		var tan := (control_points[(i + 1) % n] - control_points[(i - 1 + n) % n]) / 6.0
		curve.add_point(p1, -tan, tan)
	length = curve.get_baked_length()


func _mat(color: Color, roughness := 0.8) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = roughness
	return m


func _build_ground() -> void:
	var body := StaticBody3D.new()
	var shape := CollisionShape3D.new()
	shape.shape = WorldBoundaryShape3D.new()
	body.add_child(shape)
	add_child(body)
	var plane := PlaneMesh.new()
	plane.size = Vector2(900, 900)
	var mi := MeshInstance3D.new()
	mi.mesh = plane
	mi.material_override = _mat(Color("#7ecf8a"), 0.95)
	add_child(mi)


func _strip(st: SurfaceTool, inner: float, outer: float, y: float, colors: Array) -> void:
	var steps := int(ceil(length / sample_step))
	for i in steps:
		var d0 := i * sample_step
		var d1 := minf((i + 1) * sample_step, length)
		var c: Color = colors[(i / 2) % colors.size()]
		var p0 := curve.sample_baked(d0)
		var p1 := curve.sample_baked(fposmod(d1, length))
		var r0 := _right_at(d0)
		var r1 := _right_at(d1)
		var up := Vector3.UP * y
		var a := p0 + r0 * inner + up
		var b := p0 + r0 * outer + up
		var cc := p1 + r1 * inner + up
		var dd := p1 + r1 * outer + up
		for v in [a, cc, b, b, cc, dd]:
			st.set_color(c)
			st.set_normal(Vector3.UP)
			st.add_vertex(v)


func _build_road() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var half := road_width * 0.5
	_strip(st, -half, half, 0.03, [Color("#5b5168"), Color("#564c63")])
	_strip(st, -half - 1.2, -half, 0.04, [Color("#ff4f8b"), Color("#ffffff")])
	_strip(st, half, half + 1.2, 0.04, [Color("#ffffff"), Color("#ff4f8b")])
	var m := _mat(Color.WHITE, 0.85)
	m.vertex_color_use_as_albedo = true
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	var mi := MeshInstance3D.new()
	mi.mesh = st.commit()
	mi.material_override = m
	add_child(mi)


func _build_walls() -> void:
	var body := StaticBody3D.new()
	add_child(body)
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var offset := road_width * 0.5 + wall_margin
	var step := 4.0
	var steps := int(ceil(length / step))
	for side: float in [-1.0, 1.0]:
		for i in steps:
			var d0 := i * step
			var d1 := minf((i + 1) * step, length)
			var a: Vector3 = curve.sample_baked(d0) + _right_at(d0) * offset * side
			var b: Vector3 = curve.sample_baked(fposmod(d1, length)) + _right_at(d1) * offset * side
			var seg := b - a
			var seg_len := seg.length()
			if seg_len < 0.01:
				continue
			var shape := CollisionShape3D.new()
			var box := BoxShape3D.new()
			box.size = Vector3(0.6, 1.6, seg_len + 0.6)
			shape.shape = box
			shape.transform = Transform3D(Basis(Vector3.UP, atan2(-seg.x, -seg.z)), (a + b) * 0.5 + Vector3.UP * 0.8)
			body.add_child(shape)
			var c := Color("#ffd23f") if i % 2 == 0 else Color("#ffffff")
			for v in [a, b, a + Vector3.UP * 1.2, a + Vector3.UP * 1.2, b, b + Vector3.UP * 1.2]:
				st.set_color(c)
				st.add_vertex(v)
	st.generate_normals()
	var m := _mat(Color.WHITE, 0.6)
	m.vertex_color_use_as_albedo = true
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	var mi := MeshInstance3D.new()
	mi.mesh = st.commit()
	mi.material_override = m
	add_child(mi)


func _build_start_line() -> void:
	var img := Image.create(8, 2, false, Image.FORMAT_RGB8)
	for x in 8:
		for y in 2:
			img.set_pixel(x, y, Color.WHITE if (x + y) % 2 == 0 else Color("#1d1a20"))
	var m := StandardMaterial3D.new()
	m.albedo_texture = ImageTexture.create_from_image(img)
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	var plane := PlaneMesh.new()
	plane.size = Vector2(road_width, 2.0)
	var mi := MeshInstance3D.new()
	mi.mesh = plane
	mi.material_override = m
	mi.transform = transform_at(0.0)
	mi.position.y = 0.06
	add_child(mi)
