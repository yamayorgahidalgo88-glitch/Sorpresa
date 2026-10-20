class_name RaceHud
extends CanvasLayer
## HUD de carrera: vuelta, tiempo, velocidad, medidor de mini-turbo y mensajes centrales.
## Estilo: píldoras redondeadas con borde blanco y tipografía Fredoka (OFL).

const FONT := preload("res://assets/fonts/Fredoka-SemiBold.ttf")
const INK := Color("#3b1f4a")
const ACCENT := Color("#ff4f8b")
const DRIFT_COLORS := [Color("#5fc8ff"), Color("#ff9a2a")]

var lap_label: Label
var time_label: Label
var speed_label: Label
var center_label: Label
var drift_bar: ProgressBar
var _drift_fill := StyleBoxFlat.new()
var _center_tween: Tween


func _ready() -> void:
	var lap_pill := _pill(Vector2(24, 20), Color("#ffffff"))
	lap_label = _label(lap_pill, 30, INK)
	var time_pill := _pill(Vector2(24, 82), Color(1, 1, 1, 0.85))
	time_label = _label(time_pill, 22, INK)
	var speed_pill := _pill(Vector2.ZERO, ACCENT)
	speed_pill.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	speed_pill.offset_left = -190
	speed_pill.offset_top = -86
	speed_pill.offset_right = -24
	speed_pill.offset_bottom = -24
	speed_label = _label(speed_pill, 28, Color.WHITE)
	speed_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	drift_bar = ProgressBar.new()
	drift_bar.show_percentage = false
	drift_bar.max_value = 2.0
	drift_bar.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	drift_bar.offset_left = -110
	drift_bar.offset_right = 110
	drift_bar.offset_top = -46
	drift_bar.offset_bottom = -30
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(1, 1, 1, 0.35)
	bg.set_corner_radius_all(8)
	bg.set_border_width_all(2)
	bg.border_color = Color.WHITE
	_drift_fill.set_corner_radius_all(8)
	drift_bar.add_theme_stylebox_override("background", bg)
	drift_bar.add_theme_stylebox_override("fill", _drift_fill)
	drift_bar.visible = false
	add_child(drift_bar)
	center_label = Label.new()
	center_label.add_theme_font_override("font", FONT)
	center_label.add_theme_font_size_override("font_size", 96)
	center_label.add_theme_color_override("font_color", Color.WHITE)
	center_label.add_theme_color_override("font_outline_color", ACCENT)
	center_label.add_theme_constant_override("outline_size", 24)
	center_label.add_theme_color_override("font_shadow_color", Color(0.23, 0.12, 0.29, 0.6))
	center_label.add_theme_constant_override("shadow_offset_y", 8)
	center_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	center_label.offset_left = -500
	center_label.offset_right = 500
	center_label.offset_top = -200
	center_label.offset_bottom = -60
	center_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	center_label.pivot_offset = Vector2(500, 70)
	add_child(center_label)


func _pill(pos: Vector2, color: Color) -> PanelContainer:
	var p := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = color
	sb.set_corner_radius_all(22)
	sb.set_border_width_all(3)
	sb.border_color = Color.WHITE
	sb.content_margin_left = 18
	sb.content_margin_right = 18
	sb.content_margin_top = 2
	sb.content_margin_bottom = 2
	sb.shadow_color = Color(0.23, 0.12, 0.29, 0.25)
	sb.shadow_size = 6
	sb.shadow_offset = Vector2(0, 4)
	p.add_theme_stylebox_override("panel", sb)
	p.position = pos
	add_child(p)
	return p


func _label(parent: Control, size: int, color: Color) -> Label:
	var l := Label.new()
	l.add_theme_font_override("font", FONT)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	parent.add_child(l)
	return l


## Muestra un mensaje grande con una animación breve de entrada.
func show_message(text: String, seconds := 1.5) -> void:
	center_label.text = text
	if _center_tween:
		_center_tween.kill()
	center_label.scale = Vector2.ONE * 1.8
	center_label.modulate.a = 0.0
	_center_tween = create_tween()
	_center_tween.tween_property(center_label, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_center_tween.parallel().tween_property(center_label, "modulate:a", 1.0, 0.12)
	_center_tween.tween_interval(maxf(seconds - 0.45, 0.0))
	_center_tween.tween_property(center_label, "modulate:a", 0.0, 0.2)


func set_values(lap: int, laps: int, time: float, speed_ms: float) -> void:
	lap_label.text = "VUELTA %d/%d" % [clampi(lap, 1, laps), laps]
	time_label.text = format_time(time)
	speed_label.text = "%d km/h" % roundi(absf(speed_ms) * 3.6)


func set_drift(kart: KartBody) -> void:
	drift_bar.visible = kart.drifting
	if not kart.drifting:
		return
	drift_bar.value = minf(kart.drift_time / kart.tuning.drift_tier_times[0], 1.0) + (minf((kart.drift_time - kart.tuning.drift_tier_times[0]) / (kart.tuning.drift_tier_times[1] - kart.tuning.drift_tier_times[0]), 1.0) if kart.drift_tier >= 1 else 0.0)
	_drift_fill.bg_color = DRIFT_COLORS[clampi(kart.drift_tier - 1, 0, 1)] if kart.drift_tier > 0 else Color(1, 1, 1, 0.8)


static func format_time(t: float) -> String:
	return "%d:%05.2f" % [int(t) / 60, fmod(t, 60.0)]
