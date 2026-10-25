class_name Chibi
extends RefCounted
## Piloto de cabeza grande generado por código. La cara se dibuja con un shader, así que
## ojos, cejas y boca son opciones independientes (estilo editor de avatares).
## Medidas: ~1,25 m de pie; la cabeza ocupa casi la mitad de la altura.

const FACE := preload("res://art/face.gdshader")
const HAIR := preload("res://art/hair.gdshader")

const HAIR_STYLES := {"coleta": "Coleta alta", "coletas": "Coletas", "melena": "Media melena", "moño": "Moño", "corto": "Corto"}
const HATS := {"ninguno": "Ninguno", "cupcake": "Gorro cupcake", "fresa": "Gorro de fresa", "nata": "Boina de nata", "cereza": "Horquilla de cereza"}
const MOUTHS := {0: "Sonrisa", 1: "¡Yuju!", 2: "Pícara", 3: "¡Oh!"}

var root := Node3D.new()
var head := Node3D.new()
var arm_l := Node3D.new()
var arm_r := Node3D.new()

## Opciones con valores por defecto (todas editables).
var opt := {
	# Aspecto propio por defecto (evitamos combinaciones que imiten personajes existentes).
	"skin": Color("#ffd9c2"), "hair_color": Color("#c47a3a"), "hair": "coletas", "hat": "cupcake",
	"iris": Color("#2f7fd1"), "eye_size": 0.2, "eye_squash": 1.2, "lashes": true, "brow_tilt": 0.0, "mouth": 1,
	"hoodie": Color("#ff8a3c"), "skirt": Color("#6b3a22"), "legs_a": Color("#ffd23f"), "legs_b": Color("#ffffff"),
	"boots": Color("#5a2f1c"), "sprinkles": false,
}


static func build(options := {}, seated := false) -> Chibi:
	var c := Chibi.new()
	c.opt.merge(options, true)
	c._build(seated)
	return c


func _build(seated: bool) -> void:
	var F := CandyFactory
	var o := opt
	var cloth := func(col: Color, pattern := F.Pattern.PLAIN, col_b := Color.WHITE) -> ShaderMaterial:
		return F.mat(col, pattern, col_b, 7.0, 0.15)
	# Piernas con medias de rayas y botas
	var hip_y := 0.42
	for s in [-1.0, 1.0]:
		var leg := Node3D.new()
		leg.position = Vector3(s * 0.11, hip_y, 0)
		if seated:
			leg.rotation.x = -PI / 2.2
		root.add_child(leg)
		F.add(leg, F.capsule(0.075, 0.42), cloth.call(o["legs_a"], F.Pattern.STRIPES, o["legs_b"]), Vector3(0, -0.2, 0))
		F.add(leg, F.capsule(0.1, 0.24), cloth.call(o["boots"]), Vector3(0, -0.4, -0.04), Vector3(PI / 2, 0, 0), Vector3(1, 1, 0.8))
	# Falda con volante y sudadera
	F.add(root, F.cylinder(0.17, 0.28, 0.2, 20), cloth.call(o["skirt"]), Vector3(0, hip_y + 0.02, 0))
	F.add(root, F.capsule(0.2, 0.46), cloth.call(o["hoodie"]), Vector3(0, hip_y + 0.24, 0), Vector3.ZERO, Vector3(1.05, 1, 0.85))
	F.add(root, F.torus(0.12, 0.2), cloth.call((o["hoodie"] as Color).darkened(0.15)), Vector3(0, hip_y + 0.43, 0.02), Vector3(0.25, 0, 0), Vector3(1, 0.6, 1))
	for s in [-1.0, 1.0]:
		var cord := F.add(root, F.cylinder(0.008, 0.008, 0.12), cloth.call(Color("#ff8fc8")), Vector3(s * 0.05, hip_y + 0.33, 0.17))
		cord.rotation.z = s * 0.1
	# Brazos (pivote en el hombro para animarlos: volante, saludo)
	for pair in [[arm_l, -1.0], [arm_r, 1.0]]:
		var arm: Node3D = pair[0]
		var s: float = pair[1]
		arm.position = Vector3(s * 0.22, hip_y + 0.38, 0)
		arm.rotation = Vector3(-0.9 if seated else 0.0, 0, s * 0.35)
		root.add_child(arm)
		F.add(arm, F.capsule(0.065, 0.32), cloth.call(o["hoodie"]), Vector3(0, -0.14, 0))
		F.add(arm, F.sphere(0.06), _skin_mat(), Vector3(0, -0.3, 0))
	# Cabeza grande con cara dibujada
	head.position = Vector3(0, hip_y + 0.78, 0)
	root.add_child(head)
	var face := ShaderMaterial.new()
	face.shader = FACE
	face.set_shader_parameter("skin", o["skin"])
	face.set_shader_parameter("iris", o["iris"])
	face.set_shader_parameter("brow_color", (o["hair_color"] as Color).darkened(0.2))
	face.set_shader_parameter("eye_size", o["eye_size"])
	face.set_shader_parameter("eye_squash", o["eye_squash"])
	face.set_shader_parameter("lashes", 1.0 if o["lashes"] else 0.0)
	face.set_shader_parameter("brow_tilt", o["brow_tilt"])
	face.set_shader_parameter("mouth", o["mouth"])
	F.add(head, F.sphere(1.0, 48), face, Vector3.ZERO, Vector3.ZERO, Vector3(0.36, 0.34, 0.33))
	for s in [-1.0, 1.0]:
		F.add(head, F.sphere(0.07), _skin_mat(), Vector3(s * 0.35, -0.03, -0.02), Vector3.ZERO, Vector3(0.6, 1, 1))
	_hair()
	_hat()


func _skin_mat() -> ShaderMaterial:
	return CandyFactory.mat(opt["skin"], CandyFactory.Pattern.PLAIN, Color.WHITE, 1.0, 0.2)


func _hair() -> void:
	var F := CandyFactory
	var style: String = opt["hair"]
	var hc: Color = opt["hair_color"]
	var cap := ShaderMaterial.new()
	cap.shader = HAIR
	cap.set_shader_parameter("color", hc)
	cap.set_shader_parameter("sprinkles", 1.0 if opt["sprinkles"] else 0.0)
	cap.set_shader_parameter("length_cut", {"melena": -0.55, "corto": 0.05}.get(style, -0.2))
	F.add(head, F.sphere(1.0, 48), cap, Vector3(0, 0.015, -0.01), Vector3.ZERO, Vector3(0.385, 0.365, 0.355))
	var strands := F.mat(hc, F.Pattern.PLAIN, Color.WHITE, 1.0, 0.55)
	var bow := F.mat(Color("#ff4f8b"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.6)
	match style:
		"coleta":
			var tail := F.add(head, F.capsule(0.12, 0.62), strands, Vector3(0, 0.3, -0.33), Vector3(-0.9, 0, 0), Vector3(1, 1, 0.8))
			tail.rotation.x = -2.2
			F.add(head, F.sphere(0.08), bow, Vector3(-0.07, 0.38, -0.25), Vector3.ZERO, Vector3(1.4, 0.8, 0.6))
			F.add(head, F.sphere(0.08), bow, Vector3(0.07, 0.38, -0.25), Vector3.ZERO, Vector3(1.4, 0.8, 0.6))
		"coletas":
			for s in [-1.0, 1.0]:
				F.add(head, F.capsule(0.1, 0.42), strands, Vector3(s * 0.38, -0.08, -0.08), Vector3(0, 0, s * 0.35))
				F.add(head, F.sphere(0.055), bow, Vector3(s * 0.34, 0.08, -0.06))
		"moño":
			F.add(head, F.sphere(0.16), strands, Vector3(0, 0.36, -0.08))
		"melena":
			F.add(head, F.sphere(1.0, 32), strands, Vector3(0, -0.12, -0.08), Vector3.ZERO, Vector3(0.36, 0.22, 0.28))


func _hat() -> void:
	var F := CandyFactory
	match opt["hat"]:
		"cupcake":
			F.add(head, F.cylinder(0.2, 0.17, 0.14, 20), F.mat(Color("#ffd23f"), F.Pattern.STRIPES, Color("#ffb020"), 9.0, 0.3), Vector3(0, 0.36, 0.0))
			for i in 3:
				F.add(head, F.torus(0.02, 0.19 - i * 0.05), F.mat(Color("#ff8fc8"), F.Pattern.SPRINKLES, Color.WHITE, 40.0, 0.7), Vector3(0, 0.46 + i * 0.06, 0), Vector3.ZERO, Vector3(1, 1.6, 1))
			F.add(head, F.sphere(0.06), F.mat(Color("#e8243c"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.95), Vector3(0, 0.66, 0))
		"fresa":
			F.add(head, F.sphere(0.3), F.mat(Color("#ef3b5d"), F.Pattern.CHIPS, Color("#ffe9a8"), 22.0, 0.6), Vector3(0, 0.22, -0.02), Vector3.ZERO, Vector3(1.25, 0.75, 1.25))
			for i in 5:
				var a := TAU * i / 5.0
				F.add(head, F.sphere(0.07), F.mat(Color("#3fbf6f")), Vector3(cos(a) * 0.08, 0.45, sin(a) * 0.08), Vector3.ZERO, Vector3(1.6, 0.4, 0.7))
		"nata":
			F.add(head, F.sphere(0.3, 24), F.mat(Color("#fffaf2"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.35), Vector3(0.05, 0.32, -0.02), Vector3(0, 0, -0.25), Vector3(1.2, 0.5, 1.15))
			F.add(head, F.sphere(0.05), F.mat(Color("#e8243c"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.95), Vector3(0.1, 0.48, 0))
		"cereza":
			for x in [0.22, 0.3]:
				F.add(head, F.sphere(0.055), F.mat(Color("#d11f3a"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.95), Vector3(x, 0.25, 0.22))
