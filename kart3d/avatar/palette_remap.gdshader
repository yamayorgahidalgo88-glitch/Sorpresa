shader_type spatial;
// Recoloreado por paleta: los modelos de Kenney toman su color de una paleta 16x4
// (colormap.png). Cada entrada de `remaps` redirige una celda de la paleta (xy = columna,
// fila de origen) a otra (zw = destino), conservando el degradado dentro de la celda.
// Así se cambia piel, pelo, ojos o ropa sin texturas nuevas.

uniform sampler2D palette : source_color, filter_linear, repeat_disable;
uniform int remap_count = 0;
uniform vec4 remaps[12];
uniform float rim_amount = 0.55;

varying vec2 remapped_uv;

void vertex() {
	vec2 grid = vec2(16.0, 4.0);
	vec2 cell = floor(UV * grid);
	vec2 uv = UV;
	for (int i = 0; i < remap_count; i++) {
		if (cell.x == remaps[i].x && cell.y == remaps[i].y) {
			uv += (remaps[i].zw - remaps[i].xy) / grid;
			break;
		}
	}
	remapped_uv = uv;
}

void fragment() {
	ALBEDO = texture(palette, remapped_uv).rgb;
	ROUGHNESS = 0.55;
	RIM = rim_amount;
	RIM_TINT = 0.6;
}
