class_name RaceHud
extends CanvasLayer
## HUD provisional de la Fase 1: vuelta, tiempo, velocidad y mensajes centrales.
## La identidad visual definitiva de la interfaz llega en la Fase 2.

var lap_label := Label.new()
var time_label := Label.new()
var speed_label := Label.new()
var center_label := Label.new()
var _center_time := 0.0


func _ready() -> void:
	for l: Label in [lap_label, time_label, speed_label, center_label]:
		l.add_theme_color_override("font_color", Color.WHITE)
		l.add_theme_color_override("font_outline_color", Color("#8f1d55"))
		l.add_theme_constant_override("outline_size", 8)
		add_child(l)
	lap_label.add_theme_font_size_override("font_size", 34)
	lap_label.position = Vector2(24, 16)
	time_label.add_theme_font_size_override("font_size", 26)
	time_label.position = Vector2(24, 60)
	speed_label.add_theme_font_size_override("font_size", 26)
	speed_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	speed_label.offset_left = -240
	speed_label.offset_top = -64
	speed_label.offset_right = -24
	speed_label.offset_bottom = -24
	speed_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	center_label.add_theme_font_size_override("font_size", 72)
	center_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	center_label.offset_left = -400
	center_label.offset_right = 400
	center_label.offset_top = 120
	center_label.offset_bottom = 220
	center_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER


func _process(delta: float) -> void:
	if _center_time > 0.0:
		_center_time -= delta
		if _center_time <= 0.0:
			center_label.text = ""


func show_message(text: String, seconds := 1.5) -> void:
	center_label.text = text
	_center_time = seconds


func set_values(lap: int, laps: int, time: float, speed_ms: float) -> void:
	lap_label.text = "VUELTA %d/%d" % [clampi(lap, 1, laps), laps]
	time_label.text = format_time(time)
	speed_label.text = "%d km/h" % roundi(absf(speed_ms) * 3.6)


static func format_time(t: float) -> String:
	return "%d:%05.2f" % [int(t) / 60, fmod(t, 60.0)]
