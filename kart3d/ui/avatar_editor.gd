extends Node
## Editor de personaje: el avatar se muestra de pie en el plató y cada cambio se aplica
## al momento. Las combinaciones incompatibles se desactivan con su motivo.
## «Guardar» conserva el personaje; «Volver» descarta los cambios no guardados.

const TABS := [
	["head", "Cara y pelo"], ["skin", "Piel"], ["hair", "Color de pelo"],
	["body", "Ropa"], ["outfit", "Color de ropa"], ["extras", "Extras"],
]

var studio := Studio.new()
var draft: AvatarConfig
var tab := "head"
var ui := CanvasLayer.new()
var _tabs: HFlowContainer
var _content: VBoxContainer
var _notice: Label
var _name_edit: LineEdit
var _rebuild_pending := false


func _ready() -> void:
	draft = GameState.avatar.duplicate_config()
	add_child(studio)
	studio.show_avatar(draft)
	studio.frame_portrait(-1.4)
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
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layout.add_child(spacer)
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UiStyle.box(UiStyle.PANEL, 28))
	panel.custom_minimum_size = Vector2(520, 0)
	layout.add_child(panel)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 10)
	panel.add_child(col)
	col.add_child(UiStyle.label("TU PILOTO", 34, UiStyle.ACCENT))
	_name_edit = LineEdit.new()
	_name_edit.max_length = 14
	_name_edit.placeholder_text = "Nombre"
	_name_edit.text = draft.name
	_name_edit.add_theme_font_override("font", UiStyle.FONT)
	_name_edit.add_theme_font_size_override("font_size", 22)
	_name_edit.add_theme_stylebox_override("normal", UiStyle.box(Color("#fff4f9"), 16, 2, 0))
	_name_edit.add_theme_stylebox_override("focus", UiStyle.box(Color("#ffe3f0"), 16, 2, 0))
	_name_edit.add_theme_color_override("font_color", UiStyle.INK)
	_name_edit.text_changed.connect(func(t: String) -> void: draft.name = t.strip_edges() if t.strip_edges() != "" else "Piloto")
	col.add_child(_name_edit)
	_tabs = HFlowContainer.new()
	_tabs.add_theme_constant_override("h_separation", 6)
	_tabs.add_theme_constant_override("v_separation", 6)
	col.add_child(_tabs)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	_content = VBoxContainer.new()
	_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content.add_theme_constant_override("separation", 8)
	scroll.add_child(_content)
	_notice = UiStyle.label("", 17, Color("#c2306f"))
	_notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	col.add_child(_notice)
	var buttons := HBoxContainer.new()
	buttons.add_theme_constant_override("separation", 10)
	col.add_child(buttons)
	var back := UiStyle.button("◀ Volver", Color("#8a5a3c"), 22)
	back.pressed.connect(func() -> void: SceneRouter.go("res://scenes/main_menu.tscn"))
	buttons.add_child(back)
	var save := UiStyle.button("Guardar ✔", UiStyle.MINT, 22)
	save.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	save.pressed.connect(_save)
	buttons.add_child(save)


func _refresh() -> void:
	for c in _tabs.get_children():
		c.queue_free()
	for t in TABS:
		var b := UiStyle.chip(t[1], tab == t[0])
		b.pressed.connect(func() -> void:
			tab = t[0]
			_refresh())
		_tabs.add_child(b)
	for c in _content.get_children():
		c.queue_free()
	match tab:
		"head": _choice_list("head", AvatarCatalog.HEADS)
		"body": _choice_list("body", AvatarCatalog.BODIES)
		"skin": _swatches("skin", AvatarCatalog.SKINS)
		"hair": _swatches("hair_color", AvatarCatalog.HAIR_COLORS)
		"outfit": _swatches("outfit_color", AvatarCatalog.OUTFIT_COLORS)
		"extras": _extras()


func _choice_list(key: String, table: Dictionary) -> void:
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	_content.add_child(grid)
	for id: String in table:
		var b := UiStyle.chip(table[id]["name"], draft.get(key) == id)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(_apply.bind(key, id))
		grid.add_child(b)


func _swatches(key: String, table: Dictionary) -> void:
	var grid := GridContainer.new()
	grid.columns = 5
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	_content.add_child(grid)
	for id: String in table:
		var b := Button.new()
		b.custom_minimum_size = Vector2(64, 64)
		b.tooltip_text = table[id]["name"]
		var active: bool = draft.get(key) == id
		var sb := UiStyle.box(table[id]["swatch"], 32, 6 if active else 3, 4)
		sb.border_color = UiStyle.ACCENT if active else Color.WHITE
		for state in ["normal", "hover", "pressed", "focus"]:
			b.add_theme_stylebox_override(state, sb)
		if table[id].get("cell", 0) == null:
			b.text = "✕"
			b.add_theme_color_override("font_color", UiStyle.INK)
		b.pressed.connect(_apply.bind(key, id))
		grid.add_child(b)
	var current: String = draft.get(key)
	_content.add_child(UiStyle.label(table[current]["name"], 20))


func _extras() -> void:
	_content.add_child(UiStyle.label("Accesorio", 20, UiStyle.ACCENT))
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", 8)
	_content.add_child(row)
	for id: String in AvatarCatalog.ACCESSORIES:
		var b := UiStyle.chip(AvatarCatalog.ACCESSORIES[id]["name"], draft.accessory == id)
		var conflict := draft.accessory_conflict(id)
		b.disabled = conflict != ""
		b.tooltip_text = conflict
		b.pressed.connect(_apply.bind("accessory", id))
		row.add_child(b)
	_content.add_child(_slider("Tamaño de cabeza", "head_scale", AvatarConfig.HEAD_SCALE_RANGE))
	_content.add_child(_slider("Altura", "height", AvatarConfig.HEIGHT_RANGE))


func _slider(title: String, key: String, range_v: Vector2) -> Control:
	var box := VBoxContainer.new()
	box.add_child(UiStyle.label(title, 20, UiStyle.ACCENT))
	var s := HSlider.new()
	s.min_value = range_v.x
	s.max_value = range_v.y
	s.step = 0.01
	s.value = draft.get(key)
	s.custom_minimum_size = Vector2(0, 32)
	s.add_theme_stylebox_override("grabber_area", _track(UiStyle.ACCENT))
	s.add_theme_stylebox_override("grabber_area_highlight", _track(UiStyle.ACCENT))
	s.add_theme_stylebox_override("slider", _track(Color("#f3d9e6")))
	s.value_changed.connect(func(v: float) -> void:
		draft.set(key, v)
		_queue_rebuild())
	box.add_child(s)
	return box


func _track(color: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = color
	sb.set_corner_radius_all(6)
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	return sb


func _apply(key: String, value: String) -> void:
	draft.set(key, value)
	var notes := draft.validate()
	_notice.text = " ".join(notes)
	studio.show_avatar(draft)
	_refresh()


## Los deslizadores reconstruyen como mucho una vez por fotograma.
func _queue_rebuild() -> void:
	if _rebuild_pending:
		return
	_rebuild_pending = true
	await get_tree().process_frame
	_rebuild_pending = false
	studio.show_avatar(draft, false)


func _save() -> void:
	draft.validate()
	GameState.avatar = draft.duplicate_config()
	GameState.save_game()
	_notice.text = "¡Guardado! Tu piloto conducirá así en las carreras."
