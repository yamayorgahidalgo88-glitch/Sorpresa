class_name CandyKart
extends RefCounted
## Kart de golosina generado por código. Medidas aproximadas: 1,4 m de ancho,
## 2,4 m de largo. Devuelve la raíz y las ruedas (para girarlas en carrera).
## Piezas:
##   body:    "barquillo" (galleta de barquillo con crema), "fresa" (bizcocho rosa con
##            glaseado y fideos), "chocolate" (tableta)
##   wheels:  "donut", "galleta", "menta" (caramelo de menta en espiral)
##   spoiler: "piruleta", "barquillo", "bastones", "ninguno"

const BODIES := {"barquillo": "Barquillo", "fresa": "Bizcocho de fresa", "chocolate": "Tableta de chocolate"}
const WHEELS := {"donut": "Donuts", "galleta": "Galletas", "menta": "Caramelos de menta"}
const SPOILERS := {"piruleta": "Piruleta", "barquillo": "Barquillo", "bastones": "Bastones", "ninguno": "Ninguno"}

const SEAT := Vector3(0.0, 0.62, 0.25)

var root := Node3D.new()
var wheels_front: Array[Node3D] = []
var wheels_all: Array[Node3D] = []
var wheel_radius := 0.36


static func build(body := "fresa", wheels := "donut", spoiler := "piruleta", accent := Color("#ff4f8b")) -> CandyKart:
	var k := CandyKart.new()
	k._body(body, accent)
	k._wheels(wheels)
	k._spoiler(spoiler, accent)
	return k


func _body(kind: String, accent: Color) -> void:
	var F := CandyFactory
	var base_y := 0.5
	match kind:
		"barquillo":
			var wafer := F.mat(Color("#e8b56a"), F.Pattern.WAFER, Color("#b98236"), 6.0, 0.25, Vector3.UP)
			F.add(root, F.box(Vector3(1.15, 0.28, 2.0)), wafer, Vector3(0, base_y, 0))
			F.add(root, F.box(Vector3(1.17, 0.09, 2.02)), F.mat(Color("#fff4e2"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.4), Vector3(0, base_y + 0.17, 0))
			F.add(root, F.box(Vector3(1.15, 0.12, 2.0)), wafer, Vector3(0, base_y + 0.26, 0))
			F.add(root, F.capsule(0.3, 1.2), wafer, Vector3(0, base_y + 0.05, -1.05), Vector3(PI / 2, 0, 0), Vector3(1.4, 1, 0.8))
		"chocolate":
			var choc := F.mat(Color("#6b3a22"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.75)
			for x in [-0.3, 0.3]:
				for z in [-0.6, 0.0, 0.6]:
					F.add(root, F.box(Vector3(0.56, 0.3, 0.56)), choc, Vector3(x, base_y + 0.08, z))
			F.add(root, F.box(Vector3(1.2, 0.14, 1.85)), choc, Vector3(0, base_y - 0.1, 0))
			F.add(root, F.capsule(0.28, 1.1), F.mat(Color("#7a4428"), F.Pattern.CHIPS, Color("#f2e3c6"), 9.0, 0.6), Vector3(0, base_y, -1.05), Vector3(PI / 2, 0, 0), Vector3(1.5, 1, 0.8))
		_:
			var cake := F.mat(accent.lightened(0.25), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.45)
			F.add(root, F.capsule(0.55, 2.3), cake, Vector3(0, base_y, 0), Vector3(PI / 2, 0, 0), Vector3(1.05, 1, 0.55))
			var icing := F.mat(Color("#fff3f8"), F.Pattern.SPRINKLES, Color.WHITE, 14.0, 0.85)
			F.add(root, F.capsule(0.52, 2.1), icing, Vector3(0, base_y + 0.12, 0.05), Vector3(PI / 2, 0, 0), Vector3(1.0, 1, 0.42))
			F.add(root, F.sphere(0.12), F.mat(Color("#e8243c"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.95), Vector3(0, base_y + 0.36, -0.95))
	# Asiento y volante comunes
	F.add(root, F.box(Vector3(0.55, 0.28, 0.12)), F.mat(Color("#5a2f1c"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.5), Vector3(0, base_y + 0.3, 0.62))
	F.add(root, F.torus(0.13, 0.17), F.mat(Color("#ff6fa8"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.8), Vector3(0, base_y + 0.48, -0.25), Vector3(-1.1, 0, 0))
	for x in [-0.22, 0.22]:
		F.add(root, F.cylinder(0.06, 0.07, 0.22), F.mat(Color("#c9ccd6"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.9), Vector3(x, base_y - 0.02, 1.12), Vector3(PI / 2, 0, 0))


func _wheels(kind: String) -> void:
	var F := CandyFactory
	var specs := [[-0.78, -0.75, true], [0.78, -0.75, true], [-0.8, 0.75, false], [0.8, 0.75, false]]
	for s in specs:
		var front: bool = s[2]
		var r := 0.32 if front else 0.38
		var pivot := Node3D.new()
		pivot.position = Vector3(s[0], r, s[1])
		root.add_child(pivot)
		var spin := Node3D.new()
		pivot.add_child(spin)
		wheels_all.append(spin)
		if front:
			wheels_front.append(pivot)
		match kind:
			"galleta":
				F.add(spin, F.cylinder(r, r, 0.3, 28), F.mat(Color("#d99a54"), F.Pattern.CHIPS, Color("#4a2412"), 10.0, 0.15), Vector3.ZERO, Vector3(0, 0, PI / 2))
			"menta":
				F.add(spin, F.cylinder(r, r, 0.28, 32), F.mat(Color("#e8243c"), F.Pattern.SWIRL, Color.WHITE, 2.5 / r, 0.95, Vector3.RIGHT), Vector3.ZERO, Vector3(0, 0, PI / 2))
			_:
				F.add(spin, F.torus(r * 0.45, r), F.mat(Color("#c98a4b"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.25), Vector3.ZERO, Vector3(0, 0, PI / 2))
				F.add(spin, F.torus(r * 0.5, r * 0.98), F.mat(Color("#ff8fc8"), F.Pattern.SPRINKLES, Color.WHITE, 22.0, 0.85), Vector3(0.05 * signf(s[0]), 0, 0), Vector3(0, 0, PI / 2), Vector3(1.0, 0.6, 1.0))
	wheel_radius = 0.36


func _spoiler(kind: String, accent: Color) -> void:
	var F := CandyFactory
	match kind:
		"piruleta":
			for x in [-0.45, 0.45]:
				F.lollipop(root, Vector3(x, 0.75, 1.0), 0.28, accent, Color.WHITE, 0.5)
		"barquillo":
			for x in [-0.4, 0.4]:
				F.add(root, F.cylinder(0.05, 0.05, 0.45), F.mat(Color("#f6f0e6")), Vector3(x, 1.0, 1.0))
			F.add(root, F.cylinder(0.12, 0.12, 1.5), F.mat(Color("#e8b56a"), F.Pattern.STRIPES, Color("#a86f2c"), 4.0, 0.3, Vector3.RIGHT), Vector3(0, 1.25, 1.0), Vector3(0, 0, PI / 2))
		"bastones":
			for x in [-0.45, 0.45]:
				var cane := F.mat(Color.WHITE, F.Pattern.STRIPES, Color("#e8243c"), 6.0, 0.9, Vector3.UP)
				F.add(root, F.cylinder(0.06, 0.06, 0.7), cane, Vector3(x, 1.05, 1.05))
				F.add(root, F.torus(0.1, 0.22), cane, Vector3(x - 0.16 * signf(x), 1.4, 1.05), Vector3(PI / 2, 0, 0), Vector3(1, 1, 1))
