class_name KartVisuals
extends Node3D
## Presentación del kart: modelo, ruedas, inclinaciones y efectos.
## PROVISIONAL: geometría primitiva hasta tener modelos 3D definitivos. Para sustituirla,
## reemplazar _build_model() por la instancia de un .glb que exponga los mismos nodos
## (ruedas delanteras con pivote de dirección, ruedas con nodo de giro, puntos de escape).

const DRIFT_COLORS := [Color("#4fb7ff"), Color("#ff9a2a")]

@export var paint := Color("#ff5fa2")
@export var outfit := Color("#5fd3b0")
@export var skin := Color("#f7cba6")

var kart: KartBody
var model := Node3D.new()
var _spinners: Array[Node3D] = []
var _steer_pivots: Array[Node3D] = []
var _flames: Array[MeshInstance3D] = []
var _sparks: Array[MeshInstance3D] = []
var _spark_mat := StandardMaterial3D.new()


func _ready() -> void:
	kart = get_parent() as KartBody
	add_child(model)
	_build_model()


func _process(delta: float) -> void:
	if kart == null:
		return
	var k := 1.0 - exp(-10.0 * delta)
	var speed_frac := clampf(absf(kart.speed) / kart.tuning.max_speed, 0.0, 1.0)
	var yaw := -kart.drift_dir * 0.45 if kart.drifting else 0.0
	model.rotation.y = lerp_angle(model.rotation.y, yaw, k)
	var roll := kart.steer_smoothed * 0.07 * speed_frac + (kart.drift_dir * 0.06 if kart.drifting else 0.0)
	model.rotation.z = lerpf(model.rotation.z, roll, k)
	for s in _spinners:
		s.rotation.x -= kart.speed * delta / 0.33
	for p in _steer_pivots:
		p.rotation.y = -kart.steer_smoothed * 0.45
	var boosting := kart.boost_time > 0.0
	for f in _flames:
		f.visible = boosting
		f.scale = Vector3.ONE * randf_range(0.8, 1.25)
	var show_sparks := kart.drifting and kart.drift_tier > 0
	for s in _sparks:
		s.visible = show_sparks
		s.scale = Vector3.ONE * randf_range(0.7, 1.3)
	if show_sparks:
		var c: Color = DRIFT_COLORS[kart.drift_tier - 1]
		_spark_mat.albedo_color = c
		_spark_mat.emission = c


func _mat(color: Color, roughness := 0.5, metallic := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = roughness
	m.metallic = metallic
	return m


func _add(mesh: Mesh, pos: Vector3, mat: Material, parent: Node3D = model, rot := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position = pos
	mi.rotation = rot
	mi.material_override = mat
	parent.add_child(mi)
	return mi


func _box(size: Vector3) -> BoxMesh:
	var b := BoxMesh.new()
	b.size = size
	return b


func _build_model() -> void:
	var paint_m := _mat(paint, 0.22, 0.15)
	paint_m.clearcoat_enabled = true
	var dark := _mat(Color("#2b2233"), 0.7)
	var metal := _mat(Color("#c9ccd6"), 0.3, 0.9)
	var rubber := _mat(Color("#1d1a20"), 0.95)
	# Carrocería
	_add(_box(Vector3(1.25, 0.32, 1.9)), Vector3(0, 0.42, 0), paint_m)
	_add(_box(Vector3(0.85, 0.24, 0.55)), Vector3(0, 0.4, -1.15), paint_m)
	_add(_box(Vector3(1.5, 0.12, 0.3)), Vector3(0, 0.36, -1.35), dark)
	_add(_box(Vector3(0.7, 0.55, 0.14)), Vector3(0, 0.78, 0.5), dark)
	_add(_box(Vector3(1.45, 0.08, 0.36)), Vector3(0, 1.02, 0.95), paint_m)
	for x in [-0.45, 0.45]:
		_add(_box(Vector3(0.06, 0.4, 0.06)), Vector3(x, 0.8, 0.95), metal)
		_add(_box(Vector3(0.14, 0.14, 0.4)), Vector3(x * 0.6, 0.42, 1.08), metal)
	# Ruedas: pivote de dirección (delanteras) -> nodo de giro -> malla
	var wheel_specs := [[-0.78, 0.3, -0.72, 0.3, true], [0.78, 0.3, -0.72, 0.3, true], [-0.8, 0.36, 0.7, 0.36, false], [0.8, 0.36, 0.7, 0.36, false]]
	for w in wheel_specs:
		var pivot := Node3D.new()
		pivot.position = Vector3(w[0], w[1], w[2])
		model.add_child(pivot)
		if w[4]:
			_steer_pivots.append(pivot)
		var spin := Node3D.new()
		pivot.add_child(spin)
		_spinners.append(spin)
		var tire := CylinderMesh.new()
		tire.top_radius = w[3]
		tire.bottom_radius = w[3]
		tire.height = 0.32
		_add(tire, Vector3.ZERO, rubber, spin, Vector3(0, 0, PI / 2))
		var rim := CylinderMesh.new()
		rim.top_radius = w[3] * 0.55
		rim.bottom_radius = w[3] * 0.55
		rim.height = 0.34
		_add(rim, Vector3.ZERO, paint_m, spin, Vector3(0, 0, PI / 2))
		_add(_box(Vector3(0.36, 0.08, w[3] * 1.2)), Vector3(0, 0, 0), metal, spin)
	# Piloto (visto sobre todo de espaldas)
	var torso := CapsuleMesh.new()
	torso.radius = 0.27
	torso.height = 0.75
	_add(torso, Vector3(0, 0.95, 0.25), _mat(outfit, 0.8))
	var head := SphereMesh.new()
	head.radius = 0.3
	head.height = 0.6
	_add(head, Vector3(0, 1.45, 0.18), _mat(skin, 0.6))
	var helmet := SphereMesh.new()
	helmet.radius = 0.33
	helmet.height = 0.5
	helmet.is_hemisphere = true
	_add(helmet, Vector3(0, 1.5, 0.2), paint_m)
	# Escapes: llamas del turbo
	var flame_m := _mat(Color("#ffb020"))
	flame_m.emission_enabled = true
	flame_m.emission = Color("#ff7a1a")
	flame_m.emission_energy_multiplier = 3.0
	flame_m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	for x in [-0.27, 0.27]:
		var cone := CylinderMesh.new()
		cone.top_radius = 0.0
		cone.bottom_radius = 0.12
		cone.height = 0.55
		var f := _add(cone, Vector3(x, 0.42, 1.5), flame_m, model, Vector3(PI / 2, 0, 0))
		f.visible = false
		_flames.append(f)
	# Chispas del derrape (color según el nivel de mini-turbo)
	_spark_mat.emission_enabled = true
	_spark_mat.emission_energy_multiplier = 4.0
	_spark_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	for x in [-0.8, 0.8]:
		var sp := SphereMesh.new()
		sp.radius = 0.13
		sp.height = 0.26
		var s := _add(sp, Vector3(x, 0.08, 0.95), _spark_mat)
		s.visible = false
		_sparks.append(s)
