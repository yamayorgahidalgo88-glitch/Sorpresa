extends Node
## Menú principal: el kart del jugador gira en el plató y los botones llevan a cada modo.

var studio := Studio.new()


func _ready() -> void:
	add_child(studio)
	studio.frame_camera(-2.2)
	var ui := CanvasLayer.new()
	add_child(ui)
	var root := MarginContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		root.add_theme_constant_override("margin_" + side, 48)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(root)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_SHRINK_END
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_theme_constant_override("separation", 14)
	col.custom_minimum_size = Vector2(380, 0)
	root.add_child(col)
	# PROVISIONAL: el nombre del juego está pendiente de decidir.
	var logo := UiStyle.title("KART PARTY", 64)
	logo.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(logo)
	var sub := UiStyle.label("título provisional", 16, Color("#8f1d55"))
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(sub)
	var entries := [
		["🏁  Carrera", UiStyle.ACCENT, "res://scenes/race.tscn", true],
		["🔧  Garaje", Color("#8a6fd6"), "res://scenes/garage.tscn", true],
		["🙂  Personaje", Color("#ffb020"), "res://scenes/avatar_editor.tscn", true],
	]
	var first: Button
	for e in entries:
		var b := UiStyle.button(e[0], e[1], 28)
		b.disabled = not e[3]
		if e[3]:
			b.pressed.connect(SceneRouter.go.bind(e[2]))
		col.add_child(b)
		if first == null:
			first = b
	var style := UiStyle.button("Estilo: %s" % ("Dulce 🍭" if GameState.style == "dulce" else "Juguete 🧸"), Color("#8f6bff"), 20)
	style.tooltip_text = "Alterna entre el estilo dulce en prueba y el estilo anterior"
	style.pressed.connect(func() -> void:
		GameState.style = "juguete" if GameState.style == "dulce" else "dulce"
		SceneRouter.go("res://scenes/main_menu.tscn"))
	col.add_child(style)
	if not OS.has_feature("web"):
		var quit := UiStyle.button("Salir", Color("#8a5a3c"), 22)
		quit.pressed.connect(func() -> void: get_tree().quit())
		col.add_child(quit)
	first.grab_focus.call_deferred()
