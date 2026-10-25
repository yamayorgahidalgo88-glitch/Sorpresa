shader_type spatial;
// Material de golosina con patrones procedurales en espacio de objeto:
// 0 liso brillante · 1 espiral (caramelo de menta, piruleta) · 2 rayas en diagonal
// (bastón de caramelo, medias) · 3 pepitas (galleta, chocolate con trocitos)
// · 4 barquillo (rejilla) · 5 glaseado con fideos de colores.

uniform vec3 color_a : source_color = vec3(1.0, 0.4, 0.6);
uniform vec3 color_b : source_color = vec3(1.0);
uniform int pattern = 0;
uniform float scale = 6.0;
uniform float gloss = 0.7;
uniform vec3 axis = vec3(0.0, 1.0, 0.0);

varying vec3 lp;

void vertex() {
	lp = VERTEX;
}

float hash(vec3 p) {
	return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// Mezcla con borde suavizado a la resolución de pantalla.
float band(float v) {
	float w = fwidth(v) * 1.2;
	return smoothstep(-w, w, v);
}

void fragment() {
	vec3 col = color_a;
	float rough = mix(0.65, 0.12, gloss);
	vec3 a = normalize(axis);
	// Base ortonormal perpendicular al eje del patrón.
	vec3 t1 = normalize(abs(a.y) < 0.9 ? cross(a, vec3(0.0, 1.0, 0.0)) : cross(a, vec3(1.0, 0.0, 0.0)));
	vec3 t2 = cross(a, t1);
	vec2 plane = vec2(dot(lp, t1), dot(lp, t2));
	float along = dot(lp, a);
	if (pattern == 1) {
		float ang = atan(plane.y, plane.x);
		float s = sin(ang * 4.0 + length(plane) * scale * 2.0);
		col = mix(color_a, color_b, band(s));
	} else if (pattern == 2) {
		float ang = atan(plane.y, plane.x);
		float s = sin((along * scale + ang * 0.6) * 3.14159);
		col = mix(color_a, color_b, band(s));
	} else if (pattern == 3) {
		vec3 cell = floor(lp * scale);
		vec3 f = fract(lp * scale) - 0.5;
		float h = hash(cell);
		float d = length(f) - 0.18 - 0.1 * h;
		col = mix(color_b, color_a, band(d));
		if (h > 0.5) col = mix(color_b, col, band(d + 0.05));
	} else if (pattern == 4) {
		vec2 g = abs(fract(plane * scale) - 0.5);
		float line = min(g.x, g.y) - 0.08;
		col = mix(color_b, color_a, band(line));
	} else if (pattern == 5) {
		vec3 cell = floor(lp * scale);
		vec3 f = fract(lp * scale) - 0.5;
		float h = hash(cell);
		// Fideos: cápsulas cortas con orientación y color aleatorios.
		vec2 dir = vec2(cos(h * 6.28), sin(h * 6.28));
		vec2 q = f.xz;
		float t = clamp(dot(q, dir), -0.22, 0.22);
		float d = length(q - dir * t) - 0.07;
		vec3 sprinkle = 0.5 + 0.5 * cos(6.28 * (h * 3.0 + vec3(0.0, 0.33, 0.67)));
		col = h > 0.35 ? mix(sprinkle, color_a, band(d)) : color_a;
	}
	ALBEDO = col;
	ROUGHNESS = rough;
	SPECULAR = 0.6;
	RIM = 0.35;
	RIM_TINT = 0.5;
}
