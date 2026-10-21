class_name UiStyle
extends RefCounted
## Estilo visual común de la interfaz: colores, tipografía, botones y paneles.
## Todas las pantallas lo usan para mantener una identidad coherente.

const FONT := preload("res://assets/fonts/Fredoka-SemiBold.ttf")
const INK := Color("#3b1f4a")
const ACCENT := Color("#ff4f8b")
const ACCENT_DARK := Color("#c2306f")
const MINT := Color("#36d1a0")
const PANEL := Color(1, 1, 1, 0.9)


static func box(color: Color, radius := 22, border := 3, shadow := 6) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = color
	sb.set_corner_radius_all(radius)
	sb.set_border_width_all(border)
	sb.border_color = Color.WHITE
	sb.content_margin_left = 18
	sb.content_margin_right = 18
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	sb.shadow_color = Color(0.23, 0.12, 0.29, 0.25)
	sb.shadow_size = shadow
	sb.shadow_offset = Vector2(0, 4)
	return sb


static func label(text: String, size := 22, color := INK) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", FONT)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


static func title(text: String, size := 56) -> Label:
	var l := label(text, size, Color.WHITE)
	l.add_theme_color_override("font_outline_color", ACCENT)
	l.add_theme_constant_override("outline_size", 18)
	l.add_theme_color_override("font_shadow_color", Color(0.23, 0.12, 0.29, 0.5))
	l.add_theme_constant_override("shadow_offset_y", 6)
	return l


static func button(text: String, color := ACCENT, size := 26) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_ALL
	b.add_theme_font_override("font", FONT)
	b.add_theme_font_size_override("font_size", size)
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(state, Color.WHITE)
	b.add_theme_color_override("font_disabled_color", Color(1, 1, 1, 0.6))
	b.add_theme_stylebox_override("normal", box(color))
	b.add_theme_stylebox_override("hover", box(color.lightened(0.12)))
	b.add_theme_stylebox_override("focus", box(color.lightened(0.12)))
	b.add_theme_stylebox_override("pressed", box(color.darkened(0.12), 22, 3, 2))
	b.add_theme_stylebox_override("disabled", box(color.lerp(Color("#b8a9c0"), 0.7)))
	b.pivot_offset = Vector2(120, 30)
	b.mouse_entered.connect(func() -> void: _wiggle(b))
	b.focus_entered.connect(func() -> void: _wiggle(b))
	return b


## Botón de selección (chip) con estado activo.
static func chip(text: String, active: bool) -> Button:
	var b := button(text, ACCENT if active else Color("#ffffff"), 20)
	if not active:
		for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
			b.add_theme_color_override(state, INK)
		b.add_theme_stylebox_override("hover", box(Color("#ffe3f0")))
		b.add_theme_stylebox_override("focus", box(Color("#ffe3f0")))
	return b


static func _wiggle(c: Control) -> void:
	if not c.is_inside_tree():
		return
	c.pivot_offset = c.size * 0.5
	var t := c.create_tween()
	t.tween_property(c, "scale", Vector2.ONE * 1.05, 0.08)
	t.tween_property(c, "scale", Vector2.ONE, 0.12)
