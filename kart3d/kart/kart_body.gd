class_name KartBody
extends CharacterBody3D
## Física arcade del kart. Solo lógica: la presentación vive en KartVisuals.
## La dirección física (heading) es independiente de la orientación del modelo visual.

signal drift_boost(tier: int)
signal wall_hit(impact: float)

@export var tuning: KartTuning

var input: KartInput = KartInput.new()
var controls_enabled := false
## Callable(world_pos: Vector3) -> StringName con la superficie bajo el kart.
var surface_query: Callable

var speed := 0.0
var heading := 0.0
var steer_smoothed := 0.0
var surface: StringName = &"road"
var drifting := false
var drift_dir := 0
var drift_time := 0.0
var drift_tier := 0
var boost_time := 0.0


static func create(kart_tuning: KartTuning = null) -> KartBody:
	var kart := KartBody.new()
	kart.tuning = kart_tuning if kart_tuning else KartTuning.new()
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(1.4, 0.7, 2.0)
	shape.shape = box
	shape.position.y = 0.45
	kart.add_child(shape)
	kart.add_child(KartVisuals.new())
	return kart


func _ready() -> void:
	if tuning == null:
		tuning = KartTuning.new()
	heading = rotation.y
	floor_snap_length = 0.6


func forward() -> Vector3:
	return Vector3(-sin(heading), 0.0, -cos(heading))


func place(xform: Transform3D) -> void:
	global_position = xform.origin
	heading = xform.basis.get_euler().y
	rotation = Vector3(0.0, heading, 0.0)
	speed = 0.0
	velocity = Vector3.ZERO
	boost_time = 0.0
	_end_drift(false)


func _physics_process(delta: float) -> void:
	if controls_enabled:
		input.update(self, delta)
	var thr := input.throttle if controls_enabled else 0.0
	var brk := input.brake if controls_enabled else 0.0
	var st := input.steer if controls_enabled else 0.0
	steer_smoothed = move_toward(steer_smoothed, st, tuning.steer_response * delta)
	surface = surface_query.call(global_position) if surface_query.is_valid() else &"road"

	_update_speed(delta, thr, brk)
	_update_drift(delta, controls_enabled and input.drift)
	_update_heading(delta)

	var dir := forward()
	if drifting:
		dir = dir.rotated(Vector3.UP, drift_dir * tuning.drift_slide_angle)
	velocity.x = dir.x * speed
	velocity.z = dir.z * speed
	velocity.y = -0.5 if is_on_floor() else velocity.y - tuning.gravity * delta
	rotation = Vector3(0.0, heading, 0.0)
	move_and_slide()
	_handle_walls(dir)
	if boost_time > 0.0:
		boost_time -= delta


func _update_speed(delta: float, thr: float, brk: float) -> void:
	var top := tuning.max_speed
	var accel := tuning.acceleration
	var offroad := surface == &"offroad" and boost_time <= 0.0
	if boost_time > 0.0:
		top *= tuning.boost_speed_mult
		accel = tuning.boost_accel
		thr = 1.0
	if offroad:
		top *= tuning.offroad_speed_mult
	if brk > 0.0 and speed > 0.5:
		speed = move_toward(speed, 0.0, tuning.brake_deceleration * brk * delta)
	elif brk > 0.0 and thr <= 0.0:
		speed = move_toward(speed, -tuning.reverse_max_speed, tuning.acceleration * 0.6 * delta)
	elif thr > 0.0 and speed < top * thr:
		speed = move_toward(speed, top * thr, accel * delta)
	else:
		var drag := tuning.offroad_drag if offroad else tuning.coast_drag
		speed = move_toward(speed, top * thr, drag * delta)


func _update_drift(delta: float, held: bool) -> void:
	if not drifting:
		if held and absf(steer_smoothed) > 0.3 and speed > tuning.drift_min_speed and is_on_floor():
			drifting = true
			drift_dir = 1 if steer_smoothed > 0.0 else -1
			drift_time = 0.0
			drift_tier = 0
		return
	if not held or speed < tuning.drift_min_speed * 0.7:
		_end_drift(not held)
		return
	var closing := maxf(steer_smoothed * drift_dir, 0.0)
	drift_time += delta * (1.0 + closing)
	var tiers := tuning.drift_tier_times
	while drift_tier < tiers.size() and drift_time >= tiers[drift_tier]:
		drift_tier += 1


func _end_drift(release_boost: bool) -> void:
	if release_boost and drift_tier > 0:
		boost_time = maxf(boost_time, tuning.drift_boost_durations[drift_tier - 1])
		drift_boost.emit(drift_tier)
	drifting = false
	drift_dir = 0
	drift_tier = 0
	drift_time = 0.0


func _update_heading(delta: float) -> void:
	var spd := absf(speed)
	var rate: float
	if drifting:
		var closing := steer_smoothed * drift_dir
		rate = drift_dir * tuning.turn_speed * remap(closing, -1.0, 1.0, tuning.drift_turn_min, tuning.drift_turn_max)
	else:
		var low := clampf(spd / tuning.turn_speed_low_cut, 0.0, 1.0)
		var high := 1.0 - tuning.high_speed_turn_falloff * clampf(spd / tuning.max_speed, 0.0, 1.0)
		rate = steer_smoothed * tuning.turn_speed * low * high
		if speed < 0.0:
			rate = -rate
	heading = wrapf(heading - rate * delta, -PI, PI)


func _handle_walls(dir: Vector3) -> void:
	for i in get_slide_collision_count():
		var n := get_slide_collision(i).get_normal()
		if absf(n.y) > 0.5:
			continue
		var impact := clampf(-dir.dot(n), 0.0, 1.0)
		if impact < 0.05:
			continue
		speed *= lerpf(1.0, tuning.wall_speed_retention, impact)
		var tangent := (dir - n * dir.dot(n)).normalized()
		if tangent.length_squared() > 0.0:
			heading = lerp_angle(heading, atan2(-tangent.x, -tangent.z), 0.35 * impact)
		if impact > 0.5:
			_end_drift(false)
		wall_hit.emit(impact)
		break
