class_name Studio
extends Node3D
## Plató de presentación para el menú y el garaje: plataforma giratoria, fondo curvo,
## iluminación de tres puntos y cámara propia (independiente de la de carrera).
## El jugador puede girar el kart arrastrando con el ratón o el dedo.

signal pop_finished

var turntable := Node3D.new()
var visuals: KartVisuals
var camera := Camera3D.new()
var auto_spin := 0.35
var _drag_velocity := 0.0
var _dragging := false
var _flash: SpotLight3D
var _pop_tween: Tween


func _ready() -> void:
	_build_environment()
	_build_set()
	add_child(turntable)
	visuals = KartVisuals.new()
	visuals.config = GameState.kart
	visuals.avatar = GameState.avatar
	turntable.add_child(visuals)
	turntable.rotation.y = -0.6
	add_child(camera)
	camera.fov = 38.0
	frame_camera(0.0)
	camera.current = true


## Coloca la cámara mirando al kart. `screen_shift` > 0 desplaza el kart hacia la derecha
## de la pantalla (deja sitio a la interfaz de la izquierda), < 0 hacia la izquierda.
func frame_camera(screen_shift: float) -> void:
	camera.position = Vector3(-screen_shift, 2.3, 8.4)
	camera.look_at(Vector3(-screen_shift, 0.7, 0.0))


func show_config(cfg: KartConfig) -> void:
	visuals.rebuild(cfg)
	_pop()


## Modo editor de personaje: muestra solo el avatar, de pie y más cerca de la cámara.
func show_avatar(cfg: AvatarConfig, pop := true) -> void:
	if visuals:
		visuals.queue_free()
		visuals = null
	for c in turntable.get_children():
		c.queue_free()
	var a := AvatarBuilder.build(cfg)
	a.scale *= 2.2
	turntable.add_child(a)
	var anim := a.find_child("AnimationPlayer", true, false) as AnimationPlayer
	anim.get_animation("idle").loop_mode = Animation.LOOP_LINEAR
	anim.play("idle")
	if pop:
		_pop()


## Encuadre cercano para el editor de personaje.
func frame_portrait(screen_shift: float) -> void:
	camera.position = Vector3(-screen_shift, 1.6, 5.2)
	camera.look_at(Vector3(-screen_shift, 1.05, 0.0))


func _process(delta: float) -> void:
	if not _dragging:
		_drag_velocity = lerpf(_drag_velocity, 0.0, 1.0 - exp(-3.0 * delta))
		turntable.rotation.y += (auto_spin + _drag_velocity) * delta
	if _flash and _flash.light_energy > 0.0:
		_flash.light_energy = maxf(_flash.light_energy - delta * 12.0, 0.0)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		_dragging = event.pressed
	elif event is InputEventScreenTouch:
		_dragging = event.pressed
	elif _dragging and (event is InputEventMouseMotion or event is InputEventScreenDrag):
		var dx: float = event.relative.x * 0.01
		turntable.rotation.y += dx
		_drag_velocity = dx * 30.0


## Pequeño rebote y destello al cambiar una pieza.
func _pop() -> void:
	if _pop_tween:
		_pop_tween.kill()
	turntable.scale = Vector3.ONE * 0.85
	_pop_tween = create_tween()
	_pop_tween.tween_property(turntable, "scale", Vector3.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_pop_tween.finished.connect(func() -> void: pop_finished.emit())
	_flash.light_energy = 6.0


func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#ffc9e3")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#fff0f7")
	env.ambient_light_energy = 0.8
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.glow_enabled = true
	env.glow_intensity = 0.4
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.15
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	# Luz principal (cálida, con sombra), de relleno (fría) y de contorno por detrás.
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-38, 35, 0)
	key.light_color = Color("#fff1e0")
	key.light_energy = 1.3
	key.shadow_enabled = true
	add_child(key)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-20, -120, 0)
	fill.light_color = Color("#c9d8ff")
	fill.light_energy = 0.45
	add_child(fill)
	var rim := SpotLight3D.new()
	rim.position = Vector3(0, 4.5, -5.0)
	rim.look_at_from_position(rim.position, Vector3(0, 0.8, 0))
	rim.light_color = Color("#ffe6a8")
	rim.light_energy = 6.0
	rim.spot_range = 12.0
	rim.spot_angle = 35.0
	add_child(rim)
	_flash = SpotLight3D.new()
	_flash.position = Vector3(0, 6.0, 3.0)
	_flash.look_at_from_position(_flash.position, Vector3(0, 0.5, 0))
	_flash.light_color = Color("#ffffff")
	_flash.light_energy = 0.0
	_flash.spot_range = 12.0
	_flash.spot_angle = 30.0
	add_child(_flash)


func _build_set() -> void:
	# Fondo curvo (ciclorama) para que no se vea el horizonte.
	var cyc := CylinderMesh.new()
	cyc.top_radius = 14.0
	cyc.bottom_radius = 14.0
	cyc.height = 14.0
	cyc.radial_segments = 48
	var cm := StandardMaterial3D.new()
	cm.albedo_color = Color("#ffd0e6")
	cm.cull_mode = BaseMaterial3D.CULL_FRONT
	cm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	var bg := MeshInstance3D.new()
	bg.mesh = cyc
	bg.material_override = cm
	bg.position.y = 6.0
	add_child(bg)
	var floor_mesh := CylinderMesh.new()
	floor_mesh.top_radius = 14.0
	floor_mesh.bottom_radius = 14.0
	floor_mesh.height = 0.1
	floor_mesh.radial_segments = 48
	var fm := StandardMaterial3D.new()
	fm.albedo_color = Color("#ffe8f2")
	fm.roughness = 0.9
	var fl := MeshInstance3D.new()
	fl.mesh = floor_mesh
	fl.material_override = fm
	fl.position.y = -0.12
	add_child(fl)
	# Plataforma giratoria con anillo de luz.
	var plat := CylinderMesh.new()
	plat.top_radius = 2.4
	plat.bottom_radius = 2.5
	plat.height = 0.16
	plat.radial_segments = 48
	var pm := StandardMaterial3D.new()
	pm.albedo_color = Color("#ffffff")
	pm.roughness = 0.35
	pm.metallic = 0.1
	pm.clearcoat_enabled = true
	var p := MeshInstance3D.new()
	p.mesh = plat
	p.material_override = pm
	p.position.y = -0.08
	add_child(p)
	var ring := TorusMesh.new()
	ring.inner_radius = 2.45
	ring.outer_radius = 2.6
	ring.rings = 48
	var rm := StandardMaterial3D.new()
	rm.albedo_color = Color("#ff4f8b")
	rm.emission_enabled = true
	rm.emission = Color("#ff4f8b")
	rm.emission_energy_multiplier = 1.5
	var r := MeshInstance3D.new()
	r.mesh = ring
	r.material_override = rm
	r.position.y = -0.02
	add_child(r)
