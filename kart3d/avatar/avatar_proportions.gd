class_name AvatarProportions
extends SkeletonModifier3D
## Escala el hueso de la cabeza después de que la animación haya fijado la pose,
## para que el tamaño de cabeza elegido en el editor se mantenga en cualquier animación.

@export var head_scale := 1.0


func _process_modification() -> void:
	var skel := get_skeleton()
	if skel == null or is_equal_approx(head_scale, 1.0):
		return
	var bone := skel.find_bone("head")
	if bone >= 0:
		skel.set_bone_pose_scale(bone, Vector3.ONE * head_scale)
