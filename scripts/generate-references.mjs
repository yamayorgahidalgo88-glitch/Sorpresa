// Genera las fotos de referencia de cada corte (mismo modelo, 8 ángulos) con
// Nano Banana (Google) a través de fal.ai. Se ejecuta una vez:
//
//   FAL_KEY=... node scripts/generate-references.mjs            (todos los cortes)
//   FAL_KEY=... node scripts/generate-references.mjs buzz tupe  (solo esos)
//
// Guarda las imágenes originales en scripts/.cache (para no pagar dos veces si
// se corta) y las publicables en assets/img/cortes/<corte>/<ángulo>.webp, más
// una miniatura y el manifest.json que lee la web. Coste aproximado: 0,04 $
// por imagen, unas 100 imágenes en total.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const CACHE = join(ROOT, 'scripts/.cache');
const OUT = join(ROOT, 'assets/img/cortes');
const KEY = process.env.FAL_KEY;
if (!KEY) {
  console.error('Falta FAL_KEY en el entorno.');
  process.exit(1);
}

const ANGLES = [
  'from the front, looking straight at the camera',
  'three-quarter view, head turned 45 degrees to his left (we see the right side of his face)',
  'right profile, head turned 90 degrees to his left',
  'three-quarter rear view from behind his right shoulder',
  'directly from behind, showing the back of his head and the nape',
  'three-quarter rear view from behind his left shoulder',
  'left profile, head turned 90 degrees to his right',
  'three-quarter view, head turned 45 degrees to his right (we see the left side of his face)',
];

const BASE_PROMPT =
  'Photorealistic studio portrait of a 26-year-old Mediterranean man with very short buzzed hair (2 mm), light stubble, neutral relaxed expression, wearing a plain black crew-neck t-shirt. Head and shoulders, centered, eye level, 85mm lens, sharp focus on the hair. Background: deep black with a soft warm golden glow behind him and a gold rim light from behind. Barbershop lookbook photography, natural skin texture, no retouching.';

// Descripciones con el vocabulario de barbería de cada corte
const CUTS = {
  'crop-alto': 'a textured crop: top about 3–4 cm, choppy point-cut texture pushed slightly forward, a short blunt textured fringe; sides and back with a HIGH SKIN FADE: bare skin at the bottom, the fade rising above the temples to the top of the head',
  'french-crop': 'a French crop: top 3–5 cm brushed forward into a short straight blunt fringe across the forehead; sides and back with a LOW FADE starting just above the ears down to skin at the neckline',
  buzz: 'a buzz cut: the same clipper length of about 6 mm (#2 guard) all over the head, rounded natural hairline, no fade, even density',
  tupe: 'a quiff: top 7–10 cm, the front swept up and back with volume and a matte finish; sides and back with a MID FADE from skin at the bottom up to the temples',
  pompadour: 'a classic pompadour: long top 10–12 cm combed up and back into a high rounded roll at the front, light shine; sides tapered short with a MID FADE, clean neckline',
  'raya-lado': 'a classic side part: scissor cut, top 6–8 cm combed neatly to his right from a clean side part on the left, sides short and scissor tapered (no skin showing), tidy natural finish',
  'slick-back': 'slicked-back hair: top 8–10 cm combed straight back with medium shine, sides scissor cut shorter and also combed back, no fade, tidy neckline',
  'rizos-taper': 'a curly top: natural tight curls 5–7 cm with volume on top; a LOW TAPER FADE only at the temples (sideburns) and at the nape, the rest of the sides kept short but not skin',
  mullet: 'a modern mullet: short textured top and front with a light fringe; a BURST FADE around the ears (skin curving around each ear); the hair at the back left longer, 8–10 cm, falling over the nape',
  melena: "medium-length men's hair down to the jawline, middle part, soft layers, tucked naturally behind the ears on one side",
  crew: 'a crew cut: short top 1.5–2.5 cm, slightly longer at the front and brushed up; sides and back with a LOW FADE, tidy outline',
  flequillo: 'a messy textured fringe: top 6–8 cm with choppy texture falling forward onto the forehead in separated pieces; sides scissor cut 2–3 cm, no fade',
};

const KEEP = 'Keep exactly the same man: identical face, skin, stubble, expression, ears, t-shirt, lighting, black and gold background and framing. Change only what is asked. Photorealistic, natural hair texture with individual strands and correct barber detail.';

async function fal(model, input) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: { Authorization: `Key ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_images: 1, output_format: 'png', aspect_ratio: '4:5', ...input }),
    });
    if (r.ok) {
      const data = await r.json();
      const url = data.images?.[0]?.url;
      if (!url) throw new Error('sin imagen en la respuesta');
      const img = await fetch(url);
      return Buffer.from(await img.arrayBuffer());
    }
    const text = await r.text();
    console.warn(`  intento ${attempt} falló (${r.status}): ${text.slice(0, 200)}`);
    await new Promise((s) => setTimeout(s, 3000 * attempt));
  }
  throw new Error(`fal ${model} falló`);
}

const exists = (p) => access(p).then(() => true, () => false);
const dataUri = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

async function cached(name, make) {
  const p = join(CACHE, `${name}.png`);
  if (await exists(p)) return readFile(p);
  console.log(`· generando ${name}`);
  const buf = await make();
  await writeFile(p, buf);
  return buf;
}

function toWebp(src, dst, width, quality = 82) {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-vf', `scale=${width}:-2`, '-quality', String(quality), dst]);
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const ids = only.length ? only : Object.keys(CUTS);

  // 1. El modelo base, de frente y en los 8 ángulos
  const baseFront = await cached('base-0', () => fal('fal-ai/nano-banana', { prompt: BASE_PROMPT }));
  const base = [baseFront];
  for (let i = 1; i < ANGLES.length; i++) {
    base[i] = await cached(`base-${i}`, () =>
      fal('fal-ai/nano-banana/edit', {
        image_urls: [dataUri(baseFront)],
        prompt: `Show this same man photographed ${ANGLES[i]}. The camera orbits around him at the same height; he keeps the same neutral posture. ${KEEP}`,
      })
    );
  }

  // 2. Cada corte: primero de frente, luego el mismo corte en cada ángulo
  for (const id of ids) {
    const desc = CUTS[id];
    if (!desc) { console.warn(`corte desconocido: ${id}`); continue; }
    await mkdir(join(OUT, id), { recursive: true });
    const front = await cached(`${id}-0`, () =>
      fal('fal-ai/nano-banana/edit', {
        image_urls: [dataUri(base[0])],
        prompt: `Give this man ${desc}. ${KEEP}`,
      })
    );
    const frames = [front];
    for (let i = 1; i < ANGLES.length; i++) {
      frames[i] = await cached(`${id}-${i}`, () =>
        fal('fal-ai/nano-banana/edit', {
          image_urls: [dataUri(base[i]), dataUri(front)],
          prompt: `The first image shows a man photographed ${ANGLES[i]}. The second image shows the same man from the front with his new haircut: ${desc}. Give the man in the first image exactly that haircut as it would look from this angle, with correct fade height, length and direction. Keep the pose, angle, lighting, background, face and t-shirt of the first image.`,
        })
      );
    }
    frames.forEach((_, i) => toWebp(join(CACHE, `${id}-${i}.png`), join(OUT, id, `${i}.webp`), 800));
    toWebp(join(CACHE, `${id}-0.png`), join(OUT, id, 'thumb.webp'), 240, 80);
    console.log(`✓ ${id}`);
  }

  // 3. Manifest: los cortes que ya tienen todas sus fotos
  const ready = [];
  for (const id of Object.keys(CUTS)) {
    let ok = true;
    for (let i = 0; i < ANGLES.length; i++) if (!(await exists(join(OUT, id, `${i}.webp`)))) ok = false;
    if (ok) ready.push(id);
  }
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify({ angles: ANGLES.length, cuts: ready, model: 'fal-ai/nano-banana', generated: new Date().toISOString().slice(0, 10) }, null, 2));
  console.log(`manifest: ${ready.length} cortes listos`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
