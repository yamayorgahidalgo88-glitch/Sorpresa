class_name KartInput
extends RefCounted
## Mando abstracto del kart. El jugador y la IA rellenan los mismos campos,
## así la física nunca sabe quién conduce.

var throttle := 0.0 ## 0..1
var brake := 0.0 ## 0..1 (frena; parado, da marcha atrás)
var steer := 0.0 ## -1 izquierda .. 1 derecha
var drift := false


func update(_kart: KartBody, _delta: float) -> void:
	pass
