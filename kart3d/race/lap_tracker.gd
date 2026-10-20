class_name LapTracker
extends RefCounted
## Cuenta vueltas exigiendo pasar los checkpoints en orden.
## El circuito se divide en `checkpoint_count` tramos iguales según el progreso (0..1).
## Cruzar la meta al revés, ir y volver sobre ella o atajar saltándose tramos no suma vueltas.

enum Event { NONE, CHECKPOINT, STARTED, LAP_COMPLETED }

var checkpoint_count := 12
var next_checkpoint := 0
var laps_completed := 0
var started := false
var last_checkpoint := 0


func _init(count := 12) -> void:
	checkpoint_count = count


func segment_of(progress: float) -> int:
	return clampi(int(fposmod(progress, 1.0) * checkpoint_count), 0, checkpoint_count - 1)


## Llamar cada tick con el progreso actual (0..1) sobre la línea central.
func update(progress: float) -> Event:
	if segment_of(progress) != next_checkpoint:
		return Event.NONE
	last_checkpoint = next_checkpoint
	next_checkpoint = (next_checkpoint + 1) % checkpoint_count
	if last_checkpoint != 0:
		return Event.CHECKPOINT
	if not started:
		started = true
		return Event.STARTED
	laps_completed += 1
	return Event.LAP_COMPLETED


## Progreso total para ordenar la clasificación: vueltas + fracción de la actual.
func race_progress(progress: float) -> float:
	if not started:
		return progress - 1.0
	var frac := fposmod(progress, 1.0)
	# Si aún no ha cruzado la meta de esta vuelta, frac cerca de 1 pertenece a la vuelta anterior.
	if next_checkpoint == 1 and frac > 0.5:
		frac -= 1.0
	return laps_completed + frac
