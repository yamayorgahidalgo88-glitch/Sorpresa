class_name AIInput
extends KartInput
## IA básica: sigue la línea central con una mirada adelantada proporcional a la velocidad.
## Sirve de piloto automático en los tests y de base para los rivales (Fase 5).

var track: TrackBuilder
var lane := 0.0 ## desplazamiento lateral preferido (m)
var look_ahead := 10.0
var steer_gain := 2.4


func _init(track_ref: TrackBuilder = null) -> void:
	track = track_ref


func update(kart: KartBody, _delta: float) -> void:
	var off := track.get_offset(kart.global_position)
	var target := track.point_at(off + look_ahead + kart.speed * 0.45, lane)
	var to := target - kart.global_position
	to.y = 0.0
	var angle := kart.forward().signed_angle_to(to.normalized(), Vector3.UP)
	steer = clampf(-angle * steer_gain, -1.0, 1.0)
	throttle = 1.0
	brake = 1.0 if absf(angle) > 0.7 and kart.speed > 14.0 else 0.0
	drift = false
