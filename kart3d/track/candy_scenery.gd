class_name CandyScenery
extends RefCounted
## Decorado del tema dulce: arco de meta de caramelo, piruletas gigantes, bastones,
## gominolas, gradas de chocolate, montañas de chocolate con nata y nubes de algodón.
## Sin colisión. Los elementos repetidos usan MultiMesh (una llamada de dibujo por tipo).

const SEED := 11
const LOLLI_COLORS := [[Color("#ff4f8b"), Color.WHITE], [Color("#3cc9a5"), Color("#fff6c2")], [Color("#ffb020"), Color("#ff4f8b")], [Color("#8f6bff"), Color.WHITE]]
const GUM_COLORS := [Color("#ff4f8b"), Color("#3fbf6f"), Color("#ffd23f"), Color("#5fc8ff"), Color("#b07bff")]

var track: TrackBuilder
var rng := RandomNumberGenerator.new()
var _batches := {}


func _init(t: TrackBuilder) -> void:
	track = t
	rng.seed = SEED


func build() -> void:
	_start_gate()
	_props()
	_grandstand()
	_backdrop()
	_flush()


func _clearance(p: Vector3) -> float:
	var c := track.curve.get_closest_point(track.to_local(p))
	return Vector2(p.x - c.x, p.z - c.z).length()


## Acumula instancias por (malla, material) y las vuelca como MultiMesh al final.
func _instance(key: String, mesh: Mesh, material: Material, xf: Transform3D) -> void:
	if not key in _batches:
		_batches[key] = {"mesh": mesh, "mat": material, "xforms": []}
	_batches[key]["xforms"].append(xf)


func _flush() -> void:
	for key in _batches:
		var b: Dictionary = _batches[key]
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = b["mesh"]
		mm.instance_count = b["xforms"].size()
		for i in b["xforms"].size():
			mm.set_instance_transform(i, b["xforms"][i])
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		mmi.material_override = b["mat"]
		track.add_child(mmi)


func _start_gate() -> void:
	var F := CandyFactory
	var root := Node3D.new()
	var xf := track.transform_at(0.0)
	xf.origin.y = 0.0
	root.transform = xf
	track.add_child(root)
	var half := track.road_width * 0.5 + 1.6
	var cane := F.mat(Color.WHITE, F.Pattern.STRIPES, Color("#e8243c"), 1.2, 0.9, Vector3.UP)
	for s in [-1.0, 1.0]:
		F.add(root, F.cylinder(0.55, 0.55, 9.0, 24), cane, Vector3(s * half, 4.5, 0))
		F.lollipop(root, Vector3(s * half, 9.0, 0), 1.3, LOLLI_COLORS[0][0], Color.WHITE, 0.0)
	var bar := F.mat(Color.WHITE, F.Pattern.STRIPES, Color("#e8243c"), 1.2, 0.9, Vector3.RIGHT)
	F.add(root, F.cylinder(0.5, 0.5, half * 2.0, 24), bar, Vector3(0, 8.0, 0), Vector3(0, 0, PI / 2))
	# Pancarta a cuadros
	var img := Image.create(16, 2, false, Image.FORMAT_RGB8)
	for x in 16:
		for y in 2:
			img.set_pixel(x, y, Color.WHITE if (x + y) % 2 == 0 else Color("#2a1a2a"))
	var flag := StandardMaterial3D.new()
	flag.albedo_texture = ImageTexture.create_from_image(img)
	flag.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	F.add(root, F.box(Vector3(half * 2.0 - 1.2, 1.4, 0.2)), flag, Vector3(0, 6.8, 0))


func _props() -> void:
	var F := CandyFactory
	var stick := F.cylinder(0.12, 0.12, 1.0, 10)
	var stick_mat := F.mat(Color("#f6f0e6"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.3)
	var disc := F.cylinder(1.0, 1.0, 0.3, 32)
	var cane_mesh := F.cylinder(0.25, 0.25, 1.0, 14)
	var cane_mat := F.mat(Color.WHITE, F.Pattern.STRIPES, Color("#e8243c"), 1.4, 0.9, Vector3.UP)
	var hook := F.torus(0.3, 0.8)
	var gum := F.sphere(1.0, 16)
	var min_clear := track.road_width * 0.5 + track.wall_margin + 3.0
	var d := 0.0
	while d < track.length:
		for side in [-1.0, 1.0]:
			if rng.randf() < 0.3:
				continue
			var lateral: float = side * rng.randf_range(min_clear, min_clear + 40.0)
			var p := track.point_at(d + rng.randf_range(-4.0, 4.0), lateral)
			if _clearance(p) < min_clear:
				continue
			var base := Vector3(p.x, 0.0, p.z)
			var yaw := rng.randf() * TAU
			var kind := rng.randi() % 3
			if kind == 0:
				var h := rng.randf_range(6.0, 11.0)
				var r := rng.randf_range(2.0, 3.4)
				var ci := rng.randi() % LOLLI_COLORS.size()
				_instance("stick", stick, stick_mat, Transform3D(Basis().scaled(Vector3(1.5, h, 1.5)), base + Vector3.UP * h * 0.5))
				var disc_basis := Basis(Vector3.UP, yaw) * Basis(Vector3.RIGHT, PI / 2)
				_instance("disc%d" % ci, disc, F.mat(LOLLI_COLORS[ci][0], F.Pattern.SWIRL, LOLLI_COLORS[ci][1], 2.5, 0.9, Vector3.UP), Transform3D(disc_basis.scaled(Vector3(r, 1.0, r)), base + Vector3.UP * (h + r * 0.8)))
			elif kind == 1:
				var h := rng.randf_range(5.0, 9.0)
				_instance("cane", cane_mesh, cane_mat, Transform3D(Basis(Vector3.UP, yaw).scaled(Vector3(1, h, 1)), base + Vector3.UP * h * 0.5))
				var hb := Basis(Vector3.UP, yaw) * Basis(Vector3.FORWARD, PI / 2)
				_instance("hook", hook, cane_mat, Transform3D(hb.scaled(Vector3.ONE * 1.0), base + Vector3.UP * h + Basis(Vector3.UP, yaw) * Vector3(0.55, 0, 0)))
			else:
				var r := rng.randf_range(1.5, 3.2)
				var gi := rng.randi() % GUM_COLORS.size()
				_instance("gum%d" % gi, gum, F.mat(GUM_COLORS[gi], F.Pattern.PLAIN, Color.WHITE, 1.0, 0.85), Transform3D(Basis().scaled(Vector3(r, r * 0.9, r)), base))
		d += 9.0
	# Gominolas pequeñas a lo largo de los muros, en lugar de conos.
	var outside := track.road_width * 0.5 + track.wall_margin + 1.3
	d = 0.0
	var i := 0
	while d < track.length:
		for side in [-1.0, 1.0]:
			var p := track.point_at(d, side * outside)
			if _clearance(p) >= outside - 0.5:
				var gi := i % GUM_COLORS.size()
				_instance("gum%d" % gi, gum, F.mat(GUM_COLORS[gi], F.Pattern.PLAIN, Color.WHITE, 1.0, 0.85), Transform3D(Basis().scaled(Vector3(0.8, 0.75, 0.8)), Vector3(p.x, 0.0, p.z)))
				i += 1
		d += 20.0


func _grandstand() -> void:
	var F := CandyFactory
	var root := Node3D.new()
	var side := -1.0
	var base := track.transform_at(-30.0, side * (track.road_width * 0.5 + track.wall_margin + 7.0))
	base.origin.y = 0.0
	root.transform = base
	track.add_child(root)
	var mats := [F.mat(Color("#6b3a22"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.7), F.mat(Color("#ff8fc8"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.5)]
	for row in 5:
		F.add(root, F.box(Vector3(4.0, 1.0 + row, 40.0)), mats[row % 2], Vector3(side * row * 3.0, (1.0 + row) * 0.5, 0))
	F.add(root, F.box(Vector3(17.0, 0.6, 42.0)), F.mat(Color("#fff3f8"), F.Pattern.SPRINKLES, Color.WHITE, 2.0, 0.6), Vector3(side * 6.0, 9.0, 0))
	for z in [-19.0, 19.0]:
		F.add(root, F.cylinder(0.35, 0.35, 9.0), F.mat(Color.WHITE, F.Pattern.STRIPES, Color("#e8243c"), 1.5, 0.9, Vector3.UP), Vector3(side * 13.5, 4.5, z))


## Montañas de chocolate con nata y nubes de algodón de azúcar en el horizonte.
func _backdrop() -> void:
	var F := CandyFactory
	var browns := [Color("#6b3a22"), Color("#8a5030"), Color("#a8683e"), Color("#5a2f1c")]
	var cream := F.mat(Color("#fff3e0"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.4)
	var center := Vector3(80.0, 0.0, -30.0)
	for i in 28:
		var a := TAU * i / 28.0 + rng.randf_range(-0.08, 0.08)
		var dist := rng.randf_range(400.0, 560.0)
		var r := rng.randf_range(55.0, 105.0)
		var h := r * rng.randf_range(1.1, 1.8)
		var pos := center + Vector3(cos(a), 0.0, sin(a)) * dist
		var hill := F.add(track, F.sphere(1.0, 16), F.mat(browns[i % browns.size()], F.Pattern.PLAIN, Color.WHITE, 1.0, 0.55), pos, Vector3.ZERO, Vector3(r, h * 0.5, r))
		hill.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var cap := F.add(track, F.sphere(1.0, 16), cream, pos + Vector3.UP * h * 0.43, Vector3.ZERO, Vector3(r * 0.55, h * 0.12, r * 0.55))
		cap.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var cloud := F.mat(Color("#fff0f8"), F.Pattern.PLAIN, Color.WHITE, 1.0, 0.1)
	var puff := F.sphere(1.0, 12)
	for i in 16:
		var a := rng.randf() * TAU
		var pos := center + Vector3(cos(a), 0.0, sin(a)) * rng.randf_range(250.0, 450.0) + Vector3.UP * rng.randf_range(90.0, 150.0)
		for k in 4:
			var pr := rng.randf_range(10.0, 18.0)
			_instance("cloud", puff, cloud, Transform3D(Basis().scaled(Vector3(pr, pr * 0.75, pr)), pos + Vector3((k - 1.5) * 14.0, rng.randf_range(-3.0, 5.0), rng.randf_range(-6.0, 6.0))))
