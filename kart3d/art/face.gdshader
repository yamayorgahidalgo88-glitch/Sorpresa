shader_type spatial;
// Cara dibujada sobre la esfera de la cabeza (espacio de objeto, radio 1, mira a +Z).
// Ojos, cejas, boca, nariz y rubor son parámetros: el editor los cambia al momento
// sin modelos nuevos.

uniform vec3 skin : source_color = vec3(1.0, 0.84, 0.72);
uniform vec3 iris : source_color = vec3(0.45, 0.28, 0.12);
uniform vec3 brow_color : source_color = vec3(0.16, 0.1, 0.16);
uniform float eye_size = 0.2;
uniform float eye_spacing = 0.3;
uniform float eye_height = 0.0;
uniform float eye_squash = 1.2;
uniform float lashes = 1.0;
uniform float brow_tilt = 0.0;
uniform int mouth = 0;
uniform float blush = 0.6;

varying vec3 lp;

void vertex() {
	lp = VERTEX;
}

float aa(float d) {
	float w = fwidth(d) * 1.0;
	return 1.0 - smoothstep(-w, w, d);
}

float sd_segment(vec2 p, vec2 a, vec2 b) {
	vec2 pa = p - a, ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
	return length(pa - ba * h);
}

void fragment() {
	vec3 n = normalize(lp);
	vec3 col = skin;
	if (n.z > 0.1) {
		vec2 f = n.xy;
		// Rubor
		for (int s = -1; s <= 1; s += 2) {
			float b = length((f - vec2(float(s) * (eye_spacing + 0.08), eye_height - 0.2)) / vec2(0.13, 0.07));
			col = mix(col, vec3(1.0, 0.55, 0.6), blush * 0.55 * (1.0 - smoothstep(0.4, 1.0, b)));
		}
		// Nariz
		float nose = length((f - vec2(0.0, eye_height - 0.13)) / vec2(0.035, 0.025)) - 1.0;
		col = mix(col, vec3(1.0, 0.62, 0.58), aa(nose * 0.03));
		// Ojos
		for (int s = -1; s <= 1; s += 2) {
			float sf = float(s);
			vec2 e = f - vec2(sf * eye_spacing, eye_height);
			vec2 r = vec2(eye_size, eye_size * eye_squash);
			float d = (length(e / r) - 1.0) * eye_size;
			// Contorno fino: más marcado arriba (párpado) y casi invisible abajo.
			float outline = mix(0.003, 0.009, smoothstep(-r.y * 0.3, r.y * 0.5, e.y));
			col = mix(col, vec3(0.2, 0.1, 0.14), aa(d - outline));
			col = mix(col, vec3(1.0), aa(d));
			vec2 ic = vec2(-sf * eye_size * 0.08, -eye_size * 0.12);
			float di = length((e - ic) / vec2(0.66, 0.74)) - eye_size * 0.66;
			vec3 iris_col = mix(iris * 0.55, iris * 1.25, smoothstep(eye_size * 0.6, -eye_size * 0.3, (e - ic).y));
			col = mix(col, iris_col, aa(di) * aa(d));
			float dp = length(e - ic) - eye_size * 0.3;
			col = mix(col, vec3(0.05, 0.03, 0.05), aa(dp) * aa(d));
			float h1 = length(e - ic - vec2(-eye_size * 0.25, eye_size * 0.28)) - eye_size * 0.17;
			float h2 = length(e - ic - vec2(eye_size * 0.2, -eye_size * 0.22)) - eye_size * 0.07;
			col = mix(col, vec3(1.0), max(aa(h1), aa(h2)) * aa(d));
			// Párpado superior marcado y pestañas
			float rim = abs(d - 0.004) - 0.01;
			col = mix(col, vec3(0.1, 0.06, 0.1), aa(rim) * smoothstep(0.0, r.y * 0.6, e.y));
			if (lashes > 0.5) {
				for (int k = 0; k < 3; k++) {
					float ang = mix(0.35, 1.0, float(k) / 2.0);
					vec2 base = vec2(sf * cos(ang) * r.x, sin(ang) * r.y);
					vec2 tip = base + vec2(sf * 0.05, 0.035);
					float dl = sd_segment(e, base, tip) - 0.008;
					col = mix(col, vec3(0.1, 0.06, 0.1), aa(dl));
				}
			}
			// Cejas
			vec2 bc = vec2(sf * eye_spacing, eye_height + r.y + 0.08);
			vec2 bd = vec2(0.09, sf * brow_tilt * 0.05);
			float db = sd_segment(f, bc - bd, bc + bd) - 0.018;
			col = mix(col, brow_color, aa(db));
		}
		// Boca
		vec2 m = f - vec2(0.0, eye_height - 0.3);
		if (mouth == 0) {
			float dm = abs(length(m - vec2(0.0, 0.1)) - 0.12) - 0.014;
			col = mix(col, vec3(0.45, 0.12, 0.18), aa(dm) * step(m.y, 0.04));
		} else if (mouth == 1) {
			float dm = length((m - vec2(0.0, 0.02)) / vec2(1.0, 0.8)) - 0.12;
			float open = aa(dm) * step(m.y, 0.03);
			col = mix(col, vec3(0.45, 0.08, 0.15), open);
			float tongue = length(m - vec2(0.0, -0.07)) - 0.06;
			col = mix(col, vec3(1.0, 0.45, 0.5), aa(tongue) * open);
			float teeth = aa(-(m.y - 0.0)) * aa(abs(m.y - 0.012) - 0.012);
			col = mix(col, vec3(1.0), teeth * open);
		} else if (mouth == 2) {
			vec2 mm = vec2(m.x, m.y - m.x * 0.35);
			float dm = abs(length(mm - vec2(0.0, 0.1)) - 0.1) - 0.014;
			col = mix(col, vec3(0.45, 0.12, 0.18), aa(dm) * step(mm.y, 0.04));
		} else {
			float dm = length(m / vec2(0.7, 1.0)) - 0.045;
			col = mix(col, vec3(0.45, 0.08, 0.15), aa(dm));
		}
	}
	ALBEDO = col;
	ROUGHNESS = 0.55;
	SPECULAR = 0.3;
	RIM = 0.4;
	RIM_TINT = 0.7;
}
