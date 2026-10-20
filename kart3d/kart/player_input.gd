class_name PlayerInput
extends KartInput
## Mando del jugador: teclado o mando de consola.


func update(_kart: KartBody, _delta: float) -> void:
	throttle = Input.get_action_strength("accelerate")
	brake = Input.get_action_strength("brake")
	steer = Input.get_action_strength("steer_right") - Input.get_action_strength("steer_left")
	drift = Input.is_action_pressed("drift")


## Registra las acciones de entrada si el proyecto aún no las define.
static func ensure_actions() -> void:
	var keys := {
		"accelerate": [KEY_W, KEY_UP],
		"brake": [KEY_S, KEY_DOWN],
		"steer_left": [KEY_A, KEY_LEFT],
		"steer_right": [KEY_D, KEY_RIGHT],
		"drift": [KEY_SPACE, KEY_SHIFT],
		"respawn": [KEY_R],
	}
	var buttons := {"accelerate": JOY_BUTTON_A, "brake": JOY_BUTTON_B, "drift": JOY_BUTTON_RIGHT_SHOULDER, "respawn": JOY_BUTTON_Y}
	var axes := {"steer_left": -1.0, "steer_right": 1.0}
	for action: String in keys:
		if InputMap.has_action(action):
			continue
		InputMap.add_action(action, 0.2)
		for key: Key in keys[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)
		if action in buttons:
			var jb := InputEventJoypadButton.new()
			jb.button_index = buttons[action]
			InputMap.action_add_event(action, jb)
		if action in axes:
			var jm := InputEventJoypadMotion.new()
			jm.axis = JOY_AXIS_LEFT_X
			jm.axis_value = axes[action]
			InputMap.action_add_event(action, jm)
