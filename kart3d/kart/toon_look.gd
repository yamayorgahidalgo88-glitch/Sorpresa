class_name ToonLook
extends RefCounted
## Ajuste común de materiales para el estilo de animación: luz de borde (rim) que separa
## a los personajes y vehículos del fondo, y rugosidad suave.
## Duplica los materiales para no modificar los recursos importados compartidos.


static func apply(root: Node, texture_override: Texture2D = null, rim := 0.55) -> void:
	for mi: MeshInstance3D in root.find_children("*", "MeshInstance3D", true, false):
		for i in mi.mesh.get_surface_count():
			var src := mi.get_active_material(i)
			if not src is StandardMaterial3D:
				continue
			var m := (src as StandardMaterial3D).duplicate() as StandardMaterial3D
			if texture_override and m.albedo_texture:
				m.albedo_texture = texture_override
			m.roughness = 0.55
			m.rim_enabled = true
			m.rim = rim
			m.rim_tint = 0.6
			mi.set_surface_override_material(i, m)
