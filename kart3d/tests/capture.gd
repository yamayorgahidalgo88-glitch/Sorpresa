extends SceneTree
## Captura de pantalla de la carrera para revisión visual (no es un test).
##   xvfb-run godot --path kart3d --rendering-method gl_compatibility -s res://tests/capture.gd -- <salida.png> <segundos>


func _initialize() -> void:
	_run()


func _run() -> void:
	var args := OS.get_cmdline_user_args()
	var out := args[0] if args.size() > 0 else "user://captura.png"
	var seconds := float(args[1]) if args.size() > 1 else 6.0
	var scene: Node = load("res://scenes/race.tscn").instantiate()
	scene.autopilot = true
	root.add_child(scene)
	for i in int(seconds * 60):
		await physics_frame
	await process_frame
	root.get_viewport().get_texture().get_image().save_png(out)
	quit()
