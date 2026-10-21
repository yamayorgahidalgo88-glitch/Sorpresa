extends Node
## Estado global del juego (autoload "GameState"): configuración del jugador y guardado.
## El archivo lleva número de versión para poder migrar partidas de versiones anteriores.

const SAVE_PATH := "user://save.json"
const SAVE_VERSION := 1

var kart := KartConfig.new()
var show_fps := false


func _ready() -> void:
	load_game()


func save_game() -> void:
	var data := {"version": SAVE_VERSION, "kart": kart.to_dict()}
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		push_warning("No se pudo guardar la partida: %s" % FileAccess.get_open_error())
		return
	f.store_string(JSON.stringify(data, "\t"))


func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if not parsed is Dictionary:
		push_warning("Partida guardada ilegible; se usan los valores por defecto.")
		return
	var data := migrate(parsed)
	kart = KartConfig.from_dict(data.get("kart", {}))


## Actualiza datos guardados con versiones anteriores al formato actual.
static func migrate(data: Dictionary) -> Dictionary:
	var v := int(data.get("version", 0))
	if v < 1:
		data = {"version": 1, "kart": data.get("kart", {})}
	return data
