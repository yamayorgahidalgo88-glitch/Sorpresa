extends Node
## Garaje: el kart se muestra en el plató 3D y el jugador elige carrocería, ruedas y pintura.
## Elegir una pieza la monta y la guarda al momento; las barras muestran las estadísticas
## resultantes, que se traducen en la conducción mediante KartConfig.make_tuning().

const TABS := [["body", "Carrocería"], ["wheels", "Ruedas"], ["paint", "Alerón y color"]]

var studio := Studio.new()
var draft: KartConfig
var tab := "body"
var ui := CanvasLayer.new()
var _list: VBoxContainer
var _tabs: HBoxContainer
var _stats_box: VBoxContainer
var _desc: Label


func _ready() -> void:
	draft = GameState.kart.duplicate_config()
	add_child(studio)
	studio.frame_camera(0.6)
	add_child(ui)
	_build_ui()
	_refresh()


func _build_ui() -> void:
	var root := MarginContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		root.add_theme_constant_override("margin_" + side, 24)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(root)
	var layout := HBoxContainer.new()
	layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(layout)
	# Columna izquierda: panel de selección.
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UiStyle.box(UiStyle.PANEL, 28))
	panel.custom_minimum_size = Vector2(430, 0)
	layout.add_child(panel)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 12)
	panel.add_child(col)
	col.add_child(UiStyle.label("GARAJE", 34, UiStyle.ACCENT))
	_tabs = HBoxContainer.new()
	_tabs.add_theme_constant_override("separation", 8)
	col.add_child(_tabs)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	_list = VBoxContainer.new()
	_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_list.add_theme_constant_override("separation", 8)
	scroll.add_child(_list)
	_desc = UiStyle.label("", 18)
	_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	col.add_child(_desc)
	var buttons := HBoxContainer.new()
	buttons.add_theme_constant_override("separation", 10)
	col.add_child(buttons)
	var back := UiStyle.button("◀ Menú", Color("#8a5a3c"), 22)
	back.pressed.connect(_go.bind("res://scenes/main_menu.tscn"))
	buttons.add_child(back)
	var race := UiStyle.button("¡A correr! ▶", UiStyle.MINT, 22)
	race.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	race.pressed.connect(_go.bind("res://scenes/race.tscn"))
	buttons.add_child(race)
	# Espacio central para el kart y estadísticas a la derecha, abajo.
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layout.add_child(spacer)
	var stats_panel := PanelContainer.new()
	stats_panel.add_theme_stylebox_override("panel", UiStyle.box(UiStyle.PANEL, 24))
	stats_panel.custom_minimum_size = Vector2(330, 0)
	stats_panel.size_flags_vertical = Control.SIZE_SHRINK_END
	layout.add_child(stats_panel)
	_stats_box = VBoxContainer.new()
	_stats_box.add_theme_constant_override("separation", 6)
	stats_panel.add_child(_stats_box)


func _refresh() -> void:
	for c in _tabs.get_children():
		c.queue_free()
	for t in TABS:
		var b := UiStyle.chip(t[1], tab == t[0])
		b.pressed.connect(func() -> void:
			tab = t[0]
			_refresh())
		_tabs.add_child(b)
	for c in _list.get_children():
		c.queue_free()
	var items: Dictionary = {"body": KartCatalog.BODIES, "wheels": KartCatalog.WHEELS, "paint": KartCatalog.PAINTS}[tab]
	var current: String = draft.get(tab)
	for id: String in items:
		var b := UiStyle.chip(items[id]["name"], id == current)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.pressed.connect(_select.bind(id))
		_list.add_child(b)
	_desc.text = items[current].get("desc", "")
	_refresh_stats()


func _select(id: String) -> void:
	if draft.get(tab) == id:
		return
	draft.set(tab, id)
	studio.show_config(draft)
	# Probar una pieza la monta directamente: el garaje no tiene economía (decisión pendiente).
	GameState.kart = draft.duplicate_config()
	GameState.save_game()
	_refresh()


func _refresh_stats() -> void:
	for c in _stats_box.get_children():
		c.queue_free()
	_stats_box.add_child(UiStyle.label("ESTADÍSTICAS", 22, UiStyle.ACCENT))
	var s := draft.stats()
	for key: String in KartCatalog.STATS:
		var row := HBoxContainer.new()
		var name_l := UiStyle.label(KartCatalog.STAT_NAMES[key], 17)
		name_l.custom_minimum_size = Vector2(120, 0)
		row.add_child(name_l)
		var bar := ProgressBar.new()
		bar.min_value = 0.0
		bar.max_value = 5.0
		bar.value = s[key]
		bar.show_percentage = false
		bar.custom_minimum_size = Vector2(170, 16)
		bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		var bg := StyleBoxFlat.new()
		bg.bg_color = Color("#f3d9e6")
		bg.set_corner_radius_all(8)
		var fill := StyleBoxFlat.new()
		fill.bg_color = UiStyle.ACCENT if key != "peso" else Color("#8a6fd6")
		fill.set_corner_radius_all(8)
		bar.add_theme_stylebox_override("background", bg)
		bar.add_theme_stylebox_override("fill", fill)
		row.add_child(bar)
		_stats_box.add_child(row)


func _go(scene: String) -> void:
	GameState.kart = draft.duplicate_config()
	GameState.save_game()
	SceneRouter.go(scene)
