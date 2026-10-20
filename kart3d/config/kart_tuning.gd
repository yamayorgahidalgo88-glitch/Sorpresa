class_name KartTuning
extends Resource
## Parámetros de conducción centralizados. Cualquier ajuste del manejo se hace aquí,
## no repartido por los scripts. Unidades: metros, segundos, radianes.

@export_group("Velocidad")
@export var max_speed: float = 28.0
@export var reverse_max_speed: float = 8.0
@export var acceleration: float = 14.0
@export var brake_deceleration: float = 32.0
@export var coast_drag: float = 4.0

@export_group("Dirección")
## Velocidad de giro en rad/s a media velocidad.
@export var turn_speed: float = 2.1
## Por debajo de esta velocidad (m/s) el giro se atenúa para que el kart no rote parado.
@export var turn_speed_low_cut: float = 4.0
## Cuánto se reduce el giro a velocidad máxima (0 = nada, 1 = todo).
@export var high_speed_turn_falloff: float = 0.25
## Rapidez con la que la dirección sigue al mando (unidades de mando por segundo).
@export var steer_response: float = 7.0

@export_group("Derrape")
@export var drift_min_speed: float = 10.0
## Multiplicadores de giro al derrapar: abriendo (mín.) y cerrando (máx.) la curva.
@export var drift_turn_min: float = 0.55
@export var drift_turn_max: float = 1.5
## Ángulo entre el morro y la dirección real de avance durante el derrape.
@export var drift_slide_angle: float = 0.28
## Segundos de derrape para alcanzar cada nivel de mini-turbo.
@export var drift_tier_times: PackedFloat32Array = PackedFloat32Array([0.8, 1.6])
## Duración del turbo concedido por cada nivel.
@export var drift_boost_durations: PackedFloat32Array = PackedFloat32Array([0.6, 1.1])

@export_group("Turbo")
@export var boost_speed_mult: float = 1.3
@export var boost_accel: float = 30.0

@export_group("Superficies")
@export var offroad_speed_mult: float = 0.45
@export var offroad_drag: float = 20.0

@export_group("Colisiones")
## Fracción de velocidad que se conserva en un choque frontal contra un muro.
@export var wall_speed_retention: float = 0.5
@export var gravity: float = 30.0
