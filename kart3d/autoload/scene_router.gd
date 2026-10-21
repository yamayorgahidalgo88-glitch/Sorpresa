extends CanvasLayer
## Cambio de pantalla con fundido (autoload "SceneRouter"). Ignora peticiones mientras hay
## una transición en curso para que los clics repetidos no rompan el flujo.
## También muestra el contador de FPS (tecla F3) para diagnosticar rendimiento.

var _fade := ColorRect.new()
var _fps := Label.new()
var _busy := false


func _ready() -> void:
	layer = 100
	process_mode = Node.PROCESS_MODE_ALWAYS
	_fade.color = Color("#ffc9e3")
	_fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade.modulate.a = 0.0
	add_child(_fade)
	_fps.position = Vector2(12, 690)
	_fps.add_theme_color_override("font_outline_color", Color.BLACK)
	_fps.add_theme_constant_override("outline_size", 4)
	_fps.visible = false
	add_child(_fps)


func go(scene: String) -> void:
	if _busy:
		return
	_busy = true
	_fade.mouse_filter = Control.MOUSE_FILTER_STOP
	var t := create_tween()
	t.tween_property(_fade, "modulate:a", 1.0, 0.2)
	await t.finished
	get_tree().change_scene_to_file(scene)
	await get_tree().process_frame
	var t2 := create_tween()
	t2.tween_property(_fade, "modulate:a", 0.0, 0.25)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_busy = false


func _process(_delta: float) -> void:
	if _fps.visible:
		_fps.text = "%d FPS" % Engine.get_frames_per_second()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_F3:
		_fps.visible = not _fps.visible
