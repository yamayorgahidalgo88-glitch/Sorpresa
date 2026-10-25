extends Node3D
## Ficha visual del estilo dulce (herramienta de desarrollo).
func _ready() -> void:
	var e := Environment.new(); e.background_mode = Environment.BG_COLOR; e.background_color = Color("#ffd0e6"); e.ambient_light_color = Color("#fff0f7"); e.ambient_light_energy = 0.8; e.tonemap_mode = Environment.TONE_MAPPER_AGX
	var we := WorldEnvironment.new(); we.environment = e; add_child(we)
	var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-35, 30, 0); sun.light_energy = 1.2; add_child(sun)
	var mode: String = OS.get_cmdline_user_args()[1]
	if mode == "pilotos":
		var looks := [
			{},
			{"hair": "coletas", "hair_color": Color("#f5eedd"), "hat": "fresa", "iris": Color("#2f6fd1"), "hoodie": Color("#ff6fa8"), "legs_a": Color("#ff6fa8"), "skirt": Color("#ffffff"), "brow_tilt": 0.6, "mouth": 2},
			{"hair": "corto", "hair_color": Color("#e8b35a"), "hat": "nata", "iris": Color("#3c8c5a"), "hoodie": Color("#8a5a3c"), "legs_a": Color("#5a3a2a"), "legs_b": Color("#c9a27a"), "lashes": false, "eye_squash": 1.0, "mouth": 1, "skin": Color("#f2c39f")},
			{"hair": "melena", "hair_color": Color("#3fbf6f"), "hat": "cupcake", "iris": Color("#7b4bd6"), "hoodie": Color("#b07bff"), "legs_a": Color("#3a2a3a"), "skin": Color("#a8694a"), "mouth": 1},
			{"hair": "moño", "hair_color": Color("#d11f3a"), "hat": "cereza", "hoodie": Color("#ffd23f"), "legs_a": Color("#e8243c"), "eye_size": 0.17, "brow_tilt": -0.5, "mouth": 3},
		]
		for i in looks.size():
			var c := Chibi.build(looks[i])
			c.root.position = Vector3(i * 1.0 - 2.0, 0, 0)
			c.root.rotation.y = 0.15 * (i - 2)
			add_child(c.root)
		var cam := Camera3D.new(); add_child(cam); cam.position = Vector3(0, 1.0, 4.3); cam.look_at(Vector3(0, 0.75, 0)); cam.fov = 45; cam.current = true
	else:
		var combos := [["fresa", "donut", "piruleta", Color("#ff4f8b")], ["barquillo", "galleta", "barquillo", Color("#ffb020")], ["chocolate", "menta", "bastones", Color("#8a5a3c")]]
		for i in combos.size():
			var k := CandyKart.build(combos[i][0], combos[i][1], combos[i][2], combos[i][3])
			k.root.position = Vector3(i * 2.6 - 2.6, 0, 0)
			k.root.rotation.y = 0.7
			add_child(k.root)
			var d := Chibi.build({"hair": ["coleta", "coletas", "corto"][i], "hat": ["ninguno", "fresa", "nata"][i]}, true)
			d.root.position = CandyKart.SEAT + Vector3(0, -0.3, 0)
			k.root.add_child(d.root)
		var cam := Camera3D.new(); add_child(cam); cam.position = Vector3(0, 3.2, 6.8); cam.look_at(Vector3(0, 0.6, 0)); cam.fov = 45; cam.current = true
	await get_tree().create_timer(0.4).timeout
	get_viewport().get_texture().get_image().save_png(OS.get_cmdline_user_args()[0])
	get_tree().quit()
