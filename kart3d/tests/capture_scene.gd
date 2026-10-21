extends Node
## Captura una escena en modo de juego normal (con autoloads), para revisión visual:
##   xvfb-run godot --path kart3d --rendering-method gl_compatibility res://tests/capture_scene.tscn -- <escena> <salida.png> <segundos>


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	get_tree().root.add_child.call_deferred(load(args[0]).instantiate())
	await get_tree().create_timer(float(args[2])).timeout
	get_viewport().get_texture().get_image().save_png(args[1])
	get_tree().quit()
