class_name KartCatalog
extends RefCounted
## Catálogo de piezas del kart, definido por datos. Para añadir una pieza basta con añadir
## una entrada aquí (y su modelo en assets/). Las estadísticas van de 1 a 5.
## Diseño de compromisos: ninguna carrocería ni rueda mejora todas las estadísticas a la vez.

const KIT := "res://assets/kenney/toy-car-kit/"
const STATS := ["velocidad", "aceleracion", "manejo", "derrape", "peso", "todoterreno"]
const STAT_NAMES := {
	"velocidad": "Velocidad", "aceleracion": "Aceleración", "manejo": "Manejo",
	"derrape": "Derrape", "peso": "Peso", "todoterreno": "Todoterreno",
}

const BODIES := {
	"speedster": {
		"name": "Bizcocho de fresa", "desc": "Equilibrado para empezar.",
		"scene": KIT + "vehicle-speedster.glb", "seat": Vector3(0.0, 0.42, 0.2),
		"stats": {"velocidad": 3.0, "aceleracion": 3.5, "manejo": 3.5, "derrape": 3.5, "peso": 2.5, "todoterreno": 3.0},
	},
	"vintage": {
		"name": "Barquillo", "desc": "Ligero y ágil, pero de punta corta.",
		"scene": KIT + "vehicle-vintage-racer.glb", "seat": Vector3(0.0, 0.36, 0.15),
		"stats": {"velocidad": 2.5, "aceleracion": 4.0, "manejo": 4.5, "derrape": 3.0, "peso": 2.0, "todoterreno": 2.0},
	},
	"drag": {
		"name": "Tableta de chocolate", "desc": "Velocidad punta enorme; cuesta lanzarla y girarla.",
		"scene": KIT + "vehicle-drag-racer.glb", "seat": Vector3(0.0, 0.45, 0.25),
		"stats": {"velocidad": 4.5, "aceleracion": 2.0, "manejo": 2.0, "derrape": 2.5, "peso": 4.0, "todoterreno": 2.5},
	},
}

const WHEELS := {
	"small": {
		"name": "Caramelos de menta", "desc": "Más reprise y giro; menos punta.",
		"scene": KIT + "wheel-small.glb", "radius": 0.125,
		"stats": {"velocidad": -0.5, "aceleracion": 0.5, "manejo": 0.5, "todoterreno": -0.5},
	},
	"medium": {
		"name": "Donuts", "desc": "Sin ventajas ni penalizaciones.",
		"scene": KIT + "wheel-medium.glb", "radius": 0.15625,
		"stats": {},
	},
	"large": {
		"name": "Galletas", "desc": "Pisan fuerte fuera de pista; más pesadas en curva.",
		"scene": KIT + "wheel-large.glb", "radius": 0.1875,
		"stats": {"velocidad": 0.5, "manejo": -0.5, "peso": 0.5, "todoterreno": 1.5, "aceleracion": -0.5},
	},
}

## Pintura: textura de color del kit (null = la original).
const PAINTS := {
	"original": {"name": "Piruletas rosas", "texture": "", "swatch": Color("#ff7a3c")},
	"a": {"name": "Bastones de caramelo", "texture": KIT + "Textures/variation-a.png", "swatch": Color("#4f7cff")},
	"b": {"name": "Barquillo dorado", "texture": KIT + "Textures/variation-b.png", "swatch": Color("#ffb020")},
}
