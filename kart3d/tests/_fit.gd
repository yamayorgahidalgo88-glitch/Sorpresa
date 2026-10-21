extends SceneTree
func _initialize():
	_run()
func _run():
	await process_frame
	var a := OS.get_cmdline_user_args()
	var env := WorldEnvironment.new(); var e := Environment.new(); e.background_mode = Environment.BG_COLOR; e.background_color = Color("#ffd6ec"); e.ambient_light_color = Color.WHITE; e.ambient_light_energy = 0.6; env.environment = e; root.add_child(env)
	var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-45, 30, 0); root.add_child(sun)
	var car: Node3D = load(a[0]).instantiate(); car.scale = Vector3.ONE * 2.6; root.add_child(car)
	var ch: Node3D = load("res://assets/kenney/mini-characters/character-female-a.glb").instantiate()
	ch.position = Vector3(0, float(a[1]), float(a[2])); ch.scale = Vector3.ONE * 2.0; ch.rotation.y = PI; root.add_child(ch)
	(ch.find_child("AnimationPlayer", true, false) as AnimationPlayer).play("drive")
	var cam := Camera3D.new(); root.add_child(cam); cam.position = Vector3(3.2, 1.4, 0.4); cam.look_at(Vector3(0, 0.7, 0.2)); cam.current = true
	for i in 20: await process_frame
	root.get_viewport().get_texture().get_image().save_png(a[3])
	quit()
