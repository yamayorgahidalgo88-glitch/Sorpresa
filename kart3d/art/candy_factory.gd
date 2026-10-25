class_name CandyFactory
extends RefCounted
## Utilidades para construir piezas de golosina con primitivas y los shaders de art/.
## Todo el arte del estilo dulce sale de aquí: no depende de modelos externos.

const CANDY := preload("res://art/candy.gdshader")

enum Pattern { PLAIN, SWIRL, STRIPES, CHIPS, WAFER, SPRINKLES }


static func mat(a: Color, pattern := Pattern.PLAIN, b := Color.WHITE, scale := 6.0, gloss := 0.7, axis := Vector3.UP) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = CANDY
	m.set_shader_parameter("color_a", a)
	m.set_shader_parameter("color_b", b)
	m.set_shader_parameter("pattern", pattern)
	m.set_shader_parameter("scale", scale)
	m.set_shader_parameter("gloss", gloss)
	m.set_shader_parameter("axis", axis)
	return m


static func add(parent: Node3D, mesh: Mesh, material: Material, pos := Vector3.ZERO, rot := Vector3.ZERO, scl := Vector3.ONE) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = material
	mi.position = pos
	mi.rotation = rot
	mi.scale = scl
	parent.add_child(mi)
	return mi


static func sphere(r: float, segments := 24) -> SphereMesh:
	var s := SphereMesh.new()
	s.radius = r
	s.height = r * 2.0
	s.radial_segments = segments
	s.rings = segments / 2
	return s


static func capsule(r: float, h: float) -> CapsuleMesh:
	var c := CapsuleMesh.new()
	c.radius = r
	c.height = h
	return c


static func cylinder(r_top: float, r_bottom: float, h: float, segments := 24) -> CylinderMesh:
	var c := CylinderMesh.new()
	c.top_radius = r_top
	c.bottom_radius = r_bottom
	c.height = h
	c.radial_segments = segments
	return c


static func torus(inner: float, outer: float) -> TorusMesh:
	var t := TorusMesh.new()
	t.inner_radius = inner
	t.outer_radius = outer
	t.rings = 32
	t.ring_segments = 16
	return t


static func box(size: Vector3) -> BoxMesh:
	var b := BoxMesh.new()
	b.size = size
	return b


## Piruleta: palo y disco con espiral.
static func lollipop(parent: Node3D, pos: Vector3, radius: float, c1: Color, c2: Color, stick := 1.0) -> Node3D:
	var root := Node3D.new()
	root.position = pos
	parent.add_child(root)
	add(root, cylinder(radius * 0.08, radius * 0.08, stick), mat(Color("#f6f0e6"), Pattern.PLAIN, Color.WHITE, 1.0, 0.3), Vector3(0, stick * 0.5, 0))
	add(root, cylinder(radius, radius, radius * 0.3, 32), mat(c1, Pattern.SWIRL, c2, 2.5 / radius, 0.9, Vector3.FORWARD), Vector3(0, stick + radius, 0), Vector3(PI / 2, 0, 0))
	return root
