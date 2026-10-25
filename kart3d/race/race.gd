extends Node3D
## Escena de carrera del prototipo (Fase 1): monta pista, kart, cámara y HUD,
## y aplica las reglas de la carrera (cuenta atrás → carrera → meta).

signal race_finished(time: float)

enum State { INTRO, COUNTDOWN, RACING, FINISHED }

const LAPS := 3
const COUNTDOWN_TIME := 3.0
const INTRO_TIME := 2.5
const CHECKPOINTS := 12
## Circuito greybox provisional (plano XZ, metros). Sentido: hacia -Z desde la meta.
const TRACK_POINTS := [
	Vector3(0, 0, 0), Vector3(0, 0, -120), Vector3(30, 0, -190), Vector3(100, 0, -205),
	Vector3(155, 0, -160), Vector3(140, 0, -90), Vector3(100, 0, -55), Vector3(115, 0, 10),
	Vector3(175, 0, 45), Vector3(175, 0, 115), Vector3(110, 0, 155), Vector3(30, 0, 145),
	Vector3(-20, 0, 90),
]

## Si es true, el kart lo conduce la IA (lo usan los tests automáticos).
@export var autopilot := false

var state := State.INTRO
var intro := INTRO_TIME
var countdown := COUNTDOWN_TIME
var race_time := 0.0
var track: TrackBuilder
var kart: KartBody
var laps := LapTracker.new(CHECKPOINTS)
var camera := RaceCamera.new()
var hud := RaceHud.new()
var _last_count := 4


func _ready() -> void:
	PlayerInput.ensure_actions()
	track = TrackBuilder.new()
	track.control_points = PackedVector3Array(TRACK_POINTS)
	var gs := get_node_or_null("/root/GameState")
	track.theme = gs.style if gs else "dulce"
	add_child(track)
	track.build()
	_build_environment()
	var state_node := get_node_or_null("/root/GameState")
	kart = KartBody.create(state_node.kart if state_node else KartConfig.new(), state_node.avatar if state_node else null)
	kart.input = AIInput.new(track) if autopilot else PlayerInput.new()
	kart.surface_query = track.surface_at
	add_child(kart)
	kart.place(track.transform_at(-8.0))
	kart.drift_boost.connect(func(tier: int) -> void: hud.show_message("¡TURBO!" if tier == 1 else "¡SUPERTURBO!", 0.8))
	add_child(camera)
	camera.target = kart
	camera.current = true
	camera.snap()
	camera.reset_physics_interpolation()
	camera.start_intro(INTRO_TIME)
	add_child(hud)
	hud.show_message("¡PREPARADOS!", INTRO_TIME)


func _physics_process(delta: float) -> void:
	match state:
		State.INTRO:
			intro -= delta
			if intro <= 0.0:
				state = State.COUNTDOWN
		State.COUNTDOWN:
			countdown -= delta
			var c := ceili(countdown)
			if c != _last_count:
				_last_count = c
				hud.show_message(str(c) if c > 0 else "¡YA!", 0.9)
			if countdown <= 0.0:
				state = State.RACING
				kart.controls_enabled = true
		State.RACING:
			race_time += delta
			_update_laps()
	if kart.global_position.y < -10.0 or (not autopilot and Input.is_action_just_pressed("respawn")):
		respawn()
	hud.set_values(laps.laps_completed + 1, LAPS, race_time, kart.speed)
	hud.set_drift(kart)


func _update_laps() -> void:
	var event := laps.update(track.get_progress(kart.global_position))
	if event != LapTracker.Event.LAP_COMPLETED:
		return
	if laps.laps_completed >= LAPS:
		state = State.FINISHED
		kart.controls_enabled = false
		kart.get_node("KartVisuals").play_driver("emote-yes")
		camera.start_finish_orbit()
		hud.show_message("¡META!  " + RaceHud.format_time(race_time), 4.0)
		get_tree().create_timer(4.0).timeout.connect(func() -> void:
			if not autopilot:
				hud.show_message("Pulsa Intro para volver al menú", 600.0))
		race_finished.emit(race_time)
	else:
		hud.show_message("¡ÚLTIMA VUELTA!" if laps.laps_completed == LAPS - 1 else "VUELTA %d" % (laps.laps_completed + 1))


## Devuelve el kart al centro de la pista en el último checkpoint válido.
func respawn() -> void:
	var offset := float(laps.last_checkpoint) / CHECKPOINTS * track.length + 2.0
	kart.place(track.transform_at(offset))
	camera.snap()


func _build_environment() -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	var candy := track.theme == "dulce"
	sky_mat.sky_top_color = Color("#c79bff") if candy else Color("#5fb8ff")
	sky_mat.sky_horizon_color = Color("#ffd6ec")
	sky_mat.ground_horizon_color = Color("#ffd6ec")
	sky_mat.ground_bottom_color = Color("#ffc4dd") if candy else Color("#7ecf8a")
	var sky := Sky.new()
	sky.sky_material = sky_mat
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 0.7
	env.ambient_light_energy = 1.1
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.tonemap_exposure = 1.05
	env.glow_enabled = true
	env.glow_intensity = 0.5
	env.glow_bloom = 0.05
	# SSAO desactivado: es caro en gráficas integradas y aportaba poco en exteriores.
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.15
	env.fog_enabled = true
	env.fog_light_color = Color("#ffd6ec")
	env.fog_density = 0.0008
	env.fog_sky_affect = 0.0
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-42, -35, 0)
	sun.light_color = Color("#fff1dc")
	sun.light_energy = 1.25
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 120.0
	add_child(sun)


func _unhandled_input(event: InputEvent) -> void:
	if autopilot:
		return
	if event.is_action_pressed("ui_cancel") or (state == State.FINISHED and event.is_action_pressed("ui_accept")):
		SceneRouter.go("res://scenes/main_menu.tscn")
