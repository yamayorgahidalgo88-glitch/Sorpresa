class_name AvatarCatalog
extends RefCounted
## Catálogo de piezas del avatar, definido por datos.
## Las celdas son [columna, fila] de la paleta 16x4 de Kenney Mini Characters.
## Las cabezas se preprocesaron con tools/split_hair_uv.py para que el pelo no comparta
## celda con los ojos. Para añadir una pieza: añadir su entrada y, si es un modelo nuevo,
## identificar qué celdas usa para piel, pelo, ojos o ropa.

const DIR := "res://assets/kenney/mini-characters/"
## Los ojos y la boca comparten celda en estos modelos: no se ofrece color de ojos
## porque recolorearía también la boca.

const HEADS := {
	"moño": {"name": "Moño alto", "file": "character-female-a.glb", "skin": [12, 13], "hair": [[0, 3]]},
	"coletas": {"name": "Coletas", "file": "character-female-b.glb", "skin": [14, 15], "hair": [[11, 3]]},
	"diadema": {"name": "Diadema", "file": "character-female-c.glb", "skin": [10, 11], "hair": [[3, 3]]},
	"recogido": {"name": "Recogido", "file": "character-female-d.glb", "skin": [14, 15], "hair": [[11, 3]]},
	"melena": {"name": "Melena lisa", "file": "character-female-e.glb", "skin": [14, 15], "hair": [[0, 3]]},
	"coleta": {"name": "Coleta lateral", "file": "character-female-f.glb", "skin": [14, 15], "hair": [[11, 3], [13, 3]]},
	"rizos": {"name": "Rizos con gafas", "file": "character-male-a.glb", "skin": [12, 13], "hair": [[0, 3]], "glasses": true},
	"barba": {"name": "Barba", "file": "character-male-b.glb", "skin": [14, 15], "hair": [[11, 3], [13, 3]]},
	"gorra": {"name": "Gorra de agente", "file": "character-male-c.glb", "skin": [14, 15], "hair": [[11, 3]], "hat": true},
	"punta": {"name": "De punta", "file": "character-male-d.glb", "skin": [14, 15], "hair": [[11, 3]]},
	"flequillo": {"name": "Flequillo con gafas", "file": "character-male-e.glb", "skin": [14, 15], "hair": [[13, 3]], "glasses": true},
	"rapado": {"name": "Rapado", "file": "character-male-f.glb", "skin": [10, 11], "hair": [[0, 3]]},
}

## El cuerpo de character-female-a no se usa: incluye un bastón que no encaja al volante.
const BODIES := {
	"camiseta": {"name": "Camiseta", "file": "character-female-b.glb", "skin": [14, 15], "outfit": [5, 2]},
	"blusa": {"name": "Blusa", "file": "character-female-c.glb", "skin": [10, 11], "outfit": [11, 2]},
	"chaqueta": {"name": "Chaqueta", "file": "character-female-d.glb", "skin": [14, 15], "outfit": [3, 3]},
	"bata": {"name": "Bata", "file": "character-female-e.glb", "skin": [14, 15], "outfit": [9, 3]},
	"tirantes": {"name": "Tirantes", "file": "character-female-f.glb", "skin": [14, 15], "outfit": [1, 3]},
	"polo": {"name": "Polo", "file": "character-male-a.glb", "skin": [12, 13], "outfit": [3, 2]},
	"deportiva": {"name": "Deportiva", "file": "character-male-b.glb", "skin": [14, 15], "outfit": [9, 2]},
	"uniforme": {"name": "Uniforme", "file": "character-male-c.glb", "skin": [14, 15], "outfit": [11, 2]},
	"traje": {"name": "Traje", "file": "character-male-d.glb", "skin": [14, 15], "outfit": [1, 3]},
	"camisa": {"name": "Camisa", "file": "character-male-e.glb", "skin": [14, 15], "outfit": [9, 3]},
	"verano": {"name": "Verano", "file": "character-male-f.glb", "skin": [10, 11], "outfit": [3, 2]},
}

## Tonos de piel: par de celdas (claro, oscuro) que sustituye al par original.
const SKINS := {
	"muy_clara": {"name": "Muy clara", "cells": [[0, 2], [1, 2]], "swatch": Color("#fde3c4")},
	"clara": {"name": "Clara", "cells": [[14, 3], [15, 3]], "swatch": Color("#f2bf99")},
	"media": {"name": "Media", "cells": [[10, 3], [11, 3]], "swatch": Color("#cf7a55")},
	"oscura": {"name": "Oscura", "cells": [[12, 3], [13, 3]], "swatch": Color("#985941")},
}

const HAIR_COLORS := {
	"original": {"name": "Original", "cell": null, "swatch": Color("#ffffff")},
	"negro": {"name": "Negro", "cell": [0, 3], "swatch": Color("#3f3f46")},
	"castaño": {"name": "Castaño", "cell": [13, 3], "swatch": Color("#985941")},
	"pelirrojo": {"name": "Pelirrojo", "cell": [11, 3], "swatch": Color("#cf7a55")},
	"rubio": {"name": "Rubio", "cell": [5, 2], "swatch": Color("#ffb54a")},
	"gris": {"name": "Gris", "cell": [3, 3], "swatch": Color("#6d738a")},
	"rosa": {"name": "Rosa", "cell": [0, 1], "swatch": Color("#f377e9")},
	"azul": {"name": "Azul", "cell": [11, 2], "swatch": Color("#5f74cb")},
	"blanco": {"name": "Blanco", "cell": [9, 3], "swatch": Color("#dedeea")},
}

const OUTFIT_COLORS := {
	"original": {"name": "Original", "cell": null, "swatch": Color("#ffffff")},
	"rojo": {"name": "Rojo", "cell": [9, 2], "swatch": Color("#eb6246")},
	"naranja": {"name": "Naranja", "cell": [7, 2], "swatch": Color("#ff7a3c")},
	"amarillo": {"name": "Amarillo", "cell": [5, 2], "swatch": Color("#ffb54a")},
	"verde": {"name": "Verde", "cell": [3, 2], "swatch": Color("#3fa87a")},
	"azul": {"name": "Azul", "cell": [11, 2], "swatch": Color("#5f74cb")},
	"morado": {"name": "Morado", "cell": [15, 2], "swatch": Color("#7e56ce")},
	"rosa": {"name": "Rosa", "cell": [0, 1], "swatch": Color("#f377e9")},
	"blanco": {"name": "Blanco", "cell": [9, 3], "swatch": Color("#dedeea")},
	"negro": {"name": "Negro", "cell": [1, 3], "swatch": Color("#3f3f46")},
}

const ACCESSORIES := {
	"ninguno": {"name": "Ninguno", "file": ""},
	"gafas": {"name": "Gafas", "file": "aid-glasses.glb", "glasses": true},
	"gafas_sol": {"name": "Gafas de sol", "file": "aid-sunglasses.glb", "glasses": true},
}
