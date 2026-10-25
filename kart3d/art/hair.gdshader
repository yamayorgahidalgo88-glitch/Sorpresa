shader_type spatial;
// Casquete de pelo sobre la cabeza (esfera de radio 1 en espacio de objeto).
// Recorta la zona de la cara dejando un flequillo ondulado; `length_cut` controla hasta
// dónde baja el pelo por los lados y la nuca (media melena, corto…).

uniform vec3 color : source_color = vec3(0.12, 0.1, 0.2);
uniform float fringe = 0.32;
uniform float length_cut = -0.15;
uniform float sprinkles = 1.0;

varying vec3 lp;

void vertex() {
	lp = VERTEX;
}

float hash(vec3 p) {
	return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

void fragment() {
	vec3 n = normalize(lp);
	float wave = 0.05 * sin(n.x * 26.0) + 0.03 * sin(n.x * 11.0 + 1.3);
	bool face = n.z > 0.25 && n.y < fringe + wave && abs(n.x) < 0.78;
	bool below = n.y < length_cut && n.z > -0.2;
	if (face || below || n.y < -0.75) {
		discard;
	}
	// Mechones: bandas sutiles siguiendo la longitud.
	float strand = 0.5 + 0.5 * sin(atan(n.z, n.x) * 40.0);
	vec3 col = color * (0.88 + 0.18 * strand);
	// Brillo de pelo (anillo)
	col += vec3(0.12) * smoothstep(0.08, 0.0, abs(n.y - 0.55 - 0.05 * sin(n.x * 9.0)));
	if (sprinkles > 0.5) {
		vec3 cell = floor(lp * 9.0);
		vec3 f = fract(lp * 9.0) - 0.5;
		float h = hash(cell);
		if (h > 0.82 && length(f.xy) < 0.16) {
			col = 0.5 + 0.5 * cos(6.28 * (h * 5.0 + vec3(0.0, 0.33, 0.67)));
		}
	}
	ALBEDO = col;
	ROUGHNESS = 0.45;
	RIM = 0.5;
	RIM_TINT = 0.6;
}
