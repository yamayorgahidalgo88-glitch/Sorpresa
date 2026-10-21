class_name AvatarConfig
extends RefCounted
## Apariencia del avatar del jugador: piezas, colores y proporciones.
## Serializable para el guardado y con validación de combinaciones incompatibles.

const HEAD_SCALE_RANGE := Vector2(0.85, 1.25)
const HEIGHT_RANGE := Vector2(0.9, 1.1)

var name := "Piloto"
var head := "moño"
var body := "camiseta"
var skin := "clara"
var hair_color := "original"
var outfit_color := "original"
var accessory := "ninguno"
var head_scale := 1.0
var height := 1.0


func duplicate_config() -> AvatarConfig:
	return AvatarConfig.from_dict(to_dict())


func to_dict() -> Dictionary:
	return {
		"name": name, "head": head, "body": body, "skin": skin, "hair_color": hair_color,
		"outfit_color": outfit_color, "accessory": accessory,
		"head_scale": head_scale, "height": height,
	}


## Carga desde datos guardados. Valores desconocidos o fuera de rango se corrigen.
static func from_dict(d: Dictionary) -> AvatarConfig:
	var c := AvatarConfig.new()
	var pick := func(key: String, table: Dictionary) -> void:
		if d.get(key) in table:
			c.set(key, d[key])
	pick.call("head", AvatarCatalog.HEADS)
	pick.call("body", AvatarCatalog.BODIES)
	pick.call("skin", AvatarCatalog.SKINS)
	pick.call("hair_color", AvatarCatalog.HAIR_COLORS)
	pick.call("outfit_color", AvatarCatalog.OUTFIT_COLORS)
	pick.call("accessory", AvatarCatalog.ACCESSORIES)
	if d.get("name") is String and not String(d["name"]).strip_edges().is_empty():
		c.name = String(d["name"]).strip_edges().left(14)
	c.head_scale = clampf(float(d.get("head_scale", 1.0)), HEAD_SCALE_RANGE.x, HEAD_SCALE_RANGE.y)
	c.height = clampf(float(d.get("height", 1.0)), HEIGHT_RANGE.x, HEIGHT_RANGE.y)
	c.validate()
	return c


## Indica si un accesorio es compatible con la cabeza elegida, y por qué no si no lo es.
func accessory_conflict(acc_id: String) -> String:
	if AvatarCatalog.ACCESSORIES[acc_id].get("glasses", false) and AvatarCatalog.HEADS[head].get("glasses", false):
		return "Esta cabeza ya lleva gafas"
	return ""


## Corrige combinaciones incompatibles. Devuelve los avisos de lo que ha cambiado.
func validate() -> PackedStringArray:
	var notes := PackedStringArray()
	var conflict := accessory_conflict(accessory)
	if conflict != "":
		notes.append("%s: se ha quitado «%s»." % [conflict, AvatarCatalog.ACCESSORIES[accessory]["name"]])
		accessory = "ninguno"
	return notes


## Tabla de recoloreado para la cabeza: [origen.x, origen.y, destino.x, destino.y].
func head_remaps() -> Array[Vector4]:
	var h: Dictionary = AvatarCatalog.HEADS[head]
	var out: Array[Vector4] = []
	_add_skin(out, h["skin"])
	var hair_cell: Variant = AvatarCatalog.HAIR_COLORS[hair_color]["cell"]
	if hair_cell != null:
		var cells: Array = h["hair"]
		for i in cells.size():
			# Pelo de dos tonos: el segundo usa la columna vecina para conservar el contraste.
			var dst := Vector2(hair_cell[0] + (i % 2) * (1 if int(hair_cell[0]) % 2 == 0 else -1), hair_cell[1])
			out.append(Vector4(cells[i][0], cells[i][1], dst.x, dst.y))
	return out


func body_remaps() -> Array[Vector4]:
	var b: Dictionary = AvatarCatalog.BODIES[body]
	var out: Array[Vector4] = []
	_add_skin(out, b["skin"])
	var cell: Variant = AvatarCatalog.OUTFIT_COLORS[outfit_color]["cell"]
	if cell != null:
		out.append(Vector4(b["outfit"][0], b["outfit"][1], cell[0], cell[1]))
	return out


func _add_skin(out: Array[Vector4], src_pair: Array) -> void:
	var dst: Array = AvatarCatalog.SKINS[skin]["cells"]
	for i in 2:
		out.append(Vector4(src_pair[i], 3, dst[i][0], dst[i][1]))
