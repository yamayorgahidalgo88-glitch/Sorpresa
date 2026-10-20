class_name RaceCamera
extends Camera3D
## Cámara de carrera en tercera persona: sigue la dirección de avance con suavizado,
## mantiene el horizonte nivelado y abre el FOV con la velocidad y el turbo.
## Pendiente (Fase 2): evitar que el escenario tape al kart.

@export var distance := 4.6
@export var height := 2.0
@export var look_ahead := 4.0
@export var follow_sharpness := 16.0
@export var yaw_sharpness := 4.5
@export var base_fov := 70.0
@export var max_fov := 86.0

var target: KartBody
var _yaw := 0.0
var _intro_total := 0.0
var _intro_left := 0.0
var _finish_orbit := false
var _orbit_angle := 0.0


func snap() -> void:
	_yaw = target.heading
	global_position = _desired()
	_aim()


func _physics_process(delta: float) -> void:
	if target == null:
		return
	if _intro_left > 0.0:
		_intro_left -= delta
		var t := smoothstep(0.0, 1.0, 1.0 - _intro_left / _intro_total)
		_shot(target.heading + lerpf(PI * 0.85, 0.0, t), lerpf(4.0, distance, t), lerpf(1.0, height, t))
		return
	if _finish_orbit:
		_orbit_angle += delta * 0.35
		_shot(target.heading + PI * 0.6 + _orbit_angle, 5.5, 1.8)
		return
	var travel := target.heading
	if target.drifting:
		travel += target.drift_dir * target.tuning.drift_slide_angle * 0.6
	_yaw = lerp_angle(_yaw, travel, 1.0 - exp(-yaw_sharpness * delta))
	global_position = global_position.lerp(_desired(), 1.0 - exp(-follow_sharpness * delta))
	_aim()
	var sp := absf(target.speed) / target.tuning.max_speed
	var want := base_fov + (max_fov - base_fov) * clampf((sp - 0.3) / 1.0, 0.0, 1.0)
	fov = lerpf(fov, want, 1.0 - exp(-3.0 * delta))


func _back() -> Vector3:
	return Vector3(sin(_yaw), 0.0, cos(_yaw))


func _desired() -> Vector3:
	return target.global_position + _back() * distance + Vector3.UP * height


func _aim() -> void:
	look_at(target.global_position - _back() * look_ahead + Vector3.UP, Vector3.UP)


## Barrido de presentación: empieza delante del kart y termina en la posición de seguimiento.
func start_intro(seconds: float) -> void:
	_intro_total = seconds
	_intro_left = seconds


## Órbita lenta alrededor del kart al cruzar la meta.
func start_finish_orbit() -> void:
	_finish_orbit = true


func _shot(yaw: float, dist: float, h: float) -> void:
	_yaw = yaw
	global_position = target.global_position + Vector3(sin(yaw), 0.0, cos(yaw)) * dist + Vector3.UP * h
	look_at(target.global_position + Vector3.UP * 0.9, Vector3.UP)
