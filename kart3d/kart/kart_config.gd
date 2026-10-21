class_name KartConfig
extends RefCounted
## Configuración del kart elegida por el jugador: piezas, estadísticas resultantes
## y traducción de esas estadísticas a parámetros de conducción (KartTuning).

var body := "speedster"
var wheels := "medium"
var paint := "original"


func duplicate_config() -> KartConfig:
	var c := KartConfig.new()
	c.body = body
	c.wheels = wheels
	c.paint = paint
	return c


func to_dict() -> Dictionary:
	return {"body": body, "wheels": wheels, "paint": paint}


## Carga desde un diccionario guardado. Las piezas desconocidas (de versiones
## antiguas o eliminadas) se sustituyen por las de serie en lugar de fallar.
static func from_dict(d: Dictionary) -> KartConfig:
	var c := KartConfig.new()
	if d.get("body") in KartCatalog.BODIES:
		c.body = d["body"]
	if d.get("wheels") in KartCatalog.WHEELS:
		c.wheels = d["wheels"]
	if d.get("paint") in KartCatalog.PAINTS:
		c.paint = d["paint"]
	return c


func stats() -> Dictionary:
	var s: Dictionary = KartCatalog.BODIES[body]["stats"].duplicate()
	var mods: Dictionary = KartCatalog.WHEELS[wheels]["stats"]
	for k in mods:
		s[k] = s[k] + mods[k]
	for k in s:
		s[k] = clampf(s[k], 1.0, 5.0)
	return s


## Convierte las estadísticas (1..5, 3 = neutro) en parámetros de conducción.
## Aquí es donde las diferencias entre piezas se notan al conducir.
func make_tuning() -> KartTuning:
	var s := stats()
	var d := {}
	for k: String in s:
		d[k] = float(s[k]) - 3.0
	var t := KartTuning.new()
	t.max_speed += d["velocidad"] * 1.6
	t.acceleration += d["aceleracion"] * 2.5 - d["peso"] * 0.6
	t.turn_speed += d["manejo"] * 0.18
	t.high_speed_turn_falloff = clampf(t.high_speed_turn_falloff - d["manejo"] * 0.04, 0.05, 0.5)
	t.drift_turn_max += d["derrape"] * 0.12
	var charge: float = 1.0 - d["derrape"] * 0.08
	t.drift_tier_times = PackedFloat32Array([t.drift_tier_times[0] * charge, t.drift_tier_times[1] * charge])
	t.wall_speed_retention = clampf(t.wall_speed_retention + d["peso"] * 0.06, 0.3, 0.75)
	t.offroad_speed_mult = clampf(t.offroad_speed_mult + d["todoterreno"] * 0.07, 0.25, 0.75)
	return t
