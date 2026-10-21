extends SceneTree
## Tests automáticos sin interfaz. Ejecutar con:
##   godot --headless --path kart3d --fixed-fps 60 -s res://tests/run_tests.gd
## Devuelve código de salida 1 si algún test falla.

var _failures := 0
var _passes := 0


func _initialize() -> void:
	_run()


func _check(cond: bool, name: String) -> void:
	if cond:
		_passes += 1
		print("  OK    ", name)
	else:
		_failures += 1
		print("  FALLO ", name)


func _feed(t: LapTracker, from: float, to: float, steps := 400) -> void:
	for i in steps + 1:
		t.update(lerpf(from, to, float(i) / steps))


func _run() -> void:
	await process_frame
	print("== LapTracker")
	var t := LapTracker.new(12)
	_feed(t, 0.98, 1.0)
	t.update(0.0)
	_check(t.started and t.laps_completed == 0, "cruzar la salida inicia la carrera sin sumar vuelta")
	_feed(t, 0.0, 0.999)
	t.update(0.001)
	_check(t.laps_completed == 1, "una vuelta completa en orden suma 1")

	t = LapTracker.new(12)
	t.update(0.99)
	t.update(0.01)
	for i in 10:
		t.update(0.99)
		t.update(0.01)
	_check(t.laps_completed == 0, "ir y volver sobre la meta no suma vueltas")

	t = LapTracker.new(12)
	t.update(0.0)
	_feed(t, 0.0, -0.95)
	t.update(0.01)
	_check(t.laps_completed == 0, "dar la vuelta en sentido contrario no suma vueltas")

	t = LapTracker.new(12)
	t.update(0.0)
	_feed(t, 0.0, 0.2)
	t.update(0.7)
	_feed(t, 0.7, 0.999)
	t.update(0.0)
	_check(t.laps_completed == 0, "atajar saltándose checkpoints no suma vuelta")

	print("== Garaje y guardado")
	_test_tradeoffs()
	_test_save_roundtrip()

	print("== KartBody")
	await _test_drift_boost()

	print("== Carrera completa con piloto automático")
	await _test_full_race()

	print("Resultado: %d OK, %d fallos" % [_passes, _failures])
	quit(1 if _failures > 0 else 0)


func _test_tradeoffs() -> void:
	var keys := ["velocidad", "aceleracion", "manejo", "derrape", "todoterreno"]
	var configs: Array[KartConfig] = []
	for b in KartCatalog.BODIES:
		for w in KartCatalog.WHEELS:
			var c := KartConfig.new()
			c.body = b
			c.wheels = w
			configs.append(c)
	var dominated := 0
	for a in configs:
		for b in configs:
			if a == b:
				continue
			var sa := a.stats()
			var sb := b.stats()
			var all_ge := keys.all(func(k: String) -> bool: return sa[k] >= sb[k])
			var some_gt := keys.any(func(k: String) -> bool: return sa[k] > sb[k])
			if all_ge and some_gt and a.body != b.body:
				dominated += 1
	_check(dominated == 0, "ninguna carrocería supera a otra en todas las estadísticas")
	var fast := KartConfig.new()
	fast.body = "drag"
	var agile := KartConfig.new()
	agile.body = "vintage"
	_check(fast.make_tuning().max_speed > agile.make_tuning().max_speed and agile.make_tuning().turn_speed > fast.make_tuning().turn_speed, "las estadísticas cambian la conducción (punta frente a giro)")


func _test_save_roundtrip() -> void:
	var c := KartConfig.new()
	c.body = "drag"
	c.wheels = "large"
	c.paint = "b"
	var back := KartConfig.from_dict(JSON.parse_string(JSON.stringify(c.to_dict())))
	_check(back.body == "drag" and back.wheels == "large" and back.paint == "b", "guardar y cargar conserva las piezas")
	var broken := KartConfig.from_dict({"body": "no-existe", "wheels": 42})
	_check(broken.body == "speedster" and broken.wheels == "medium", "piezas desconocidas en el guardado se sustituyen por las de serie")
	var old: Dictionary = root.get_node("/root/GameState").migrate({"kart": {"body": "vintage"}})
	_check(old["version"] == 1 and old["kart"]["body"] == "vintage", "migra partidas sin número de versión")


func _test_drift_boost() -> void:
	var kart := KartBody.create()
	var input := KartInput.new()
	kart.input = input
	root.add_child(kart)
	var floor_body := StaticBody3D.new()
	var shape := CollisionShape3D.new()
	shape.shape = WorldBoundaryShape3D.new()
	floor_body.add_child(shape)
	root.add_child(floor_body)
	kart.place(Transform3D(Basis(), Vector3(0, 0.3, 0)))
	kart.controls_enabled = true
	input.throttle = 1.0
	for i in 180:
		await physics_frame
	_check(kart.speed > kart.tuning.max_speed * 0.9, "acelera hasta cerca de la velocidad máxima")
	input.steer = 1.0
	input.drift = true
	for i in 150:
		await physics_frame
	_check(kart.drifting and kart.drift_tier == 2, "mantener el derrape carga el mini-turbo hasta el nivel 2")
	input.drift = false
	await physics_frame
	await physics_frame
	_check(kart.boost_time > 0.0 and not kart.drifting, "soltar el derrape concede turbo")
	kart.queue_free()
	floor_body.queue_free()


func _test_full_race() -> void:
	var scene: Node = load("res://scenes/race.tscn").instantiate()
	scene.autopilot = true
	root.add_child(scene)
	var max_ticks := 60 * 300
	var ticks := 0
	while scene.state != scene.State.FINISHED and ticks < max_ticks:
		await physics_frame
		ticks += 1
	_check(scene.state == scene.State.FINISHED, "la IA completa %d vueltas (%.1f s simulados)" % [scene.LAPS, ticks / 60.0])
	_check(scene.laps.laps_completed == scene.LAPS, "el contador marca exactamente %d vueltas" % scene.LAPS)
	print("        tiempo de carrera: ", RaceHud.format_time(scene.race_time))
	scene.queue_free()
