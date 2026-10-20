class_name KartVisuals
extends Node3D
## Presentación del kart: modelo, piloto animado, ruedas, inclinaciones y efectos.
## Solo lee el estado de KartBody; nunca modifica la física.
## Modelos: Kenney Toy Car Kit y Mini Characters (CC0), ver assets/ASSETS.md.

const CAR_SCALE := 2.6
const DRIVER_SCALE := 2.0
const DRIVER_SEAT := Vector3(0.0, 0.42, 0.2)
const WHEEL_RADIUS := 0.125 * CAR_SCALE
const DRIFT_COLORS := [Color("#5fc8ff"), Color("#ff9a2a")]

@export var car_scene: PackedScene = preload("res://assets/kenney/toy-car-kit/vehicle-speedster.glb")
@export var driver_scene: PackedScene = preload("res://assets/kenney/mini-characters/character-female-a.glb")
## Textura alternativa de pintura (null = la original del modelo).
@export var paint_texture: Texture2D

var kart: KartBody
var model := Node3D.new()
var driver: Node3D
var driver_anim: AnimationPlayer
var _wheels_front: Array[Node3D] = []
var _wheels_all: Array[Node3D] = []
var _wheel_spin := 0.0
var _sparks: Array[CPUParticles3D] = []
var _smoke: Array[CPUParticles3D] = []
var _flames: Array[CPUParticles3D] = []
var _bob := 0.0


func _ready() -> void:
	kart = get_parent() as KartBody
	add_child(model)
	var car := car_scene.instantiate() as Node3D
	car.scale = Vector3.ONE * CAR_SCALE
	model.add_child(car)
	for w in car.find_children("wheel-*", "Node3D", true, false):
		_wheels_all.append(w)
		if w.name.begins_with("wheel-f"):
			_wheels_front.append(w)
	driver = driver_scene.instantiate() as Node3D
	driver.position = DRIVER_SEAT
	driver.scale = Vector3.ONE * DRIVER_SCALE
	driver.rotation.y = PI
	model.add_child(driver)
	driver_anim = driver.find_child("AnimationPlayer", true, false)
	play_driver("drive")
	ToonLook.apply(self, paint_texture)
	_build_effects()


func play_driver(anim: String) -> void:
	if driver_anim and driver_anim.has_animation(anim):
		driver_anim.get_animation(anim).loop_mode = Animation.LOOP_LINEAR if anim in ["drive", "idle"] else Animation.LOOP_NONE
		driver_anim.play(anim, 0.2)


func _process(delta: float) -> void:
	if kart == null:
		return
	var k := 1.0 - exp(-10.0 * delta)
	var speed_frac := clampf(absf(kart.speed) / kart.tuning.max_speed, 0.0, 1.2)
	# Orientación visual: el morro mira hacia dentro de la curva al derrapar.
	var yaw := -kart.drift_dir * 0.42 if kart.drifting else -kart.steer_smoothed * 0.06 * speed_frac
	model.rotation.y = lerp_angle(model.rotation.y, yaw, k)
	var roll := kart.steer_smoothed * 0.06 * speed_frac + (kart.drift_dir * 0.07 if kart.drifting else 0.0)
	model.rotation.z = lerpf(model.rotation.z, roll, k)
	# Suspensión: leve cabeceo al acelerar o frenar y vibración fuera de pista.
	var pitch := -0.04 if kart.boost_time > 0.0 else (0.03 if kart.controls_enabled and kart.input.brake > 0.0 and kart.speed > 1.0 else 0.0)
	model.rotation.x = lerpf(model.rotation.x, pitch, k * 0.5)
	_bob += delta * (8.0 + speed_frac * 20.0)
	var rough := 0.04 if kart.surface == &"offroad" and absf(kart.speed) > 2.0 else 0.008 * speed_frac
	model.position.y = sin(_bob) * rough
	# Ruedas
	_wheel_spin -= kart.speed * delta / WHEEL_RADIUS
	for w in _wheels_all:
		w.rotation = Vector3(_wheel_spin, -kart.steer_smoothed * 0.45 if w in _wheels_front else 0.0, 0.0)
	# Efectos
	var tier := kart.drift_tier if kart.drifting else 0
	for s in _sparks:
		s.emitting = tier > 0
		if tier > 0:
			s.color = DRIFT_COLORS[tier - 1]
	var dusty := (kart.drifting or kart.surface == &"offroad") and absf(kart.speed) > 6.0
	for s in _smoke:
		s.emitting = dusty
	for f in _flames:
		f.emitting = kart.boost_time > 0.0


func _particles(pos: Vector3, mesh: Mesh, amount: int, lifetime: float) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.mesh = mesh
	p.amount = amount
	p.lifetime = lifetime
	p.position = pos
	p.emitting = false
	p.local_coords = false
	model.add_child(p)
	return p


func _unshaded(color: Color, alpha := false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.vertex_color_use_as_albedo = true
	m.albedo_color = color
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	if alpha:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	return m


func _build_effects() -> void:
	var quad := QuadMesh.new()
	quad.size = Vector2(0.12, 0.12)
	quad.material = _unshaded(Color.WHITE)
	var puff := SphereMesh.new()
	puff.radius = 0.25
	puff.height = 0.5
	puff.radial_segments = 8
	puff.rings = 4
	var smoke_mat := StandardMaterial3D.new()
	smoke_mat.albedo_color = Color(1, 1, 1, 0.55)
	smoke_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	smoke_mat.vertex_color_use_as_albedo = true
	puff.material = smoke_mat
	var fade := Gradient.new()
	fade.set_color(0, Color(1, 1, 1, 0.7))
	fade.set_color(1, Color(1, 1, 1, 0.0))
	var shrink := Curve.new()
	shrink.add_point(Vector2(0, 0.4))
	shrink.add_point(Vector2(1, 1.4))
	for x in [-0.55, 0.55]:
		var s := _particles(Vector3(x, 0.15, 0.85), quad, 24, 0.35)
		s.direction = Vector3(0, 1, 1)
		s.spread = 40.0
		s.initial_velocity_min = 3.0
		s.initial_velocity_max = 6.0
		s.gravity = Vector3(0, -12, 0)
		_sparks.append(s)
		var d := _particles(Vector3(x, 0.2, 0.9), puff, 14, 0.7)
		d.direction = Vector3(0, 0.6, 1)
		d.initial_velocity_min = 0.5
		d.initial_velocity_max = 1.5
		d.gravity = Vector3(0, 0.5, 0)
		d.scale_amount_curve = shrink
		d.color_ramp = fade
		_smoke.append(d)
	var flame := SphereMesh.new()
	flame.radius = 0.12
	flame.height = 0.24
	flame.radial_segments = 8
	flame.rings = 4
	var flame_mat := StandardMaterial3D.new()
	flame_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	flame_mat.vertex_color_use_as_albedo = true
	flame.material = flame_mat
	var heat := Gradient.new()
	heat.set_color(0, Color("#fff3a0"))
	heat.set_color(1, Color(1.0, 0.35, 0.1, 0.0))
	for x in [-0.22, 0.22]:
		var f := _particles(Vector3(x, 0.45, 1.15), flame, 20, 0.25)
		f.direction = Vector3(0, 0.2, 1)
		f.spread = 10.0
		f.initial_velocity_min = 4.0
		f.initial_velocity_max = 6.0
		f.gravity = Vector3.ZERO
		f.color_ramp = heat
		_flames.append(f)
