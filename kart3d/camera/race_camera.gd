class_name RaceCamera
extends Camera3D
## Cámara de carrera en tercera persona: sigue la dirección de avance con suavizado,
## mantiene el horizonte nivelado y abre el FOV con la velocidad y el turbo.
## Pendiente (Fase 2): evitar que el escenario tape al kart.

@export var distance := 6.5
@export var height := 2.6
@export var look_ahead := 5.0
@export var follow_sharpness := 9.0
@export var yaw_sharpness := 4.5
@export var base_fov := 70.0
@export var max_fov := 86.0

var target: KartBody
var _yaw := 0.0


func snap() -> void:
	_yaw = target.heading
	global_position = _desired()
	_aim()


func _physics_process(delta: float) -> void:
	if target == null:
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
