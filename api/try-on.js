// Función serverless (Vercel, Node 18+): genera la foto del cliente con el corte elegido.
//
// Variables de entorno:
//   TRYON_PROVIDER   "fal" (por defecto si hay FAL_KEY) o "nvidia"
//   FAL_KEY          clave de fal.ai  → FLUX.1 Kontext [pro], acepta fotos subidas
//   NVIDIA_API_KEY   clave de build.nvidia.com → FLUX.1 Kontext [dev]
//                    (ojo: la API alojada de prueba de NVIDIA solo acepta sus imágenes
//                    de ejemplo; para fotos reales hace falta un NIM propio: NVIDIA_ENDPOINT)
//   NVIDIA_ENDPOINT  opcional, URL de un NIM propio de flux.1-kontext-dev
//
// Las claves solo viven aquí, en el servidor. La foto no se guarda.

const PROMPTS = {
  'crop-alto': 'a short textured crop haircut with a high skin fade on the sides',
  'french-crop': 'a French crop haircut with a straight short fringe and a low fade on the sides',
  buzz: 'a very short even buzz cut, clipper length about 6 millimetres all over',
  tupe: 'a quiff haircut with volume swept up and back on top and a mid fade on the sides',
  pompadour: 'a pompadour haircut with tall volume at the front, combed back, and a mid fade on the sides',
  'raya-lado': 'a classic side part haircut, scissor cut, neat medium length on top with a defined part',
  'slick-back': 'a slicked back haircut, medium length on top combed straight back, scissor cut sides',
  'rizos-taper': 'curly hair on top kept natural with volume and a low taper fade at the temples and neckline',
  mullet: 'a modern mullet haircut, short on top and sides with a mid fade, longer at the back of the neck',
  melena: 'shoulder-length medium long hair with a centre part, falling to the jawline',
  crew: 'a crew cut, short on top slightly longer at the front, with a low fade on the sides',
  flequillo: 'a messy textured fringe haircut, medium length, strands falling forward onto the forehead, scissor cut sides',
};

const PRESERVE =
  'Change only the hair. Keep the exact same person: same face, identity, facial features, skin tone, age, expression, eyes, eyebrows, beard and facial hair, ears, glasses, clothing, pose, lighting, camera angle and background. Photorealistic result, as if photographed right after a professional barber haircut.';

const MAX_BYTES = 4.5 * 1024 * 1024;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 4;
const hits = new Map(); // límite básico por IP (por instancia)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const provider = (process.env.TRYON_PROVIDER || (process.env.FAL_KEY ? 'fal' : process.env.NVIDIA_API_KEY ? 'nvidia' : '')).toLowerCase();
  if (!provider || (provider === 'fal' && !process.env.FAL_KEY) || (provider === 'nvidia' && !process.env.NVIDIA_API_KEY && !process.env.NVIDIA_ENDPOINT)) {
    return res.status(501).json({ error: 'not_configured' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'anon';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return res.status(429).json({ error: 'rate_limited' });
  recent.push(now);
  hits.set(ip, recent);

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'bad_request' }); }
  }
  const { cutId, image } = body || {};
  const style = PROMPTS[cutId];
  if (!style) return res.status(400).json({ error: 'unknown_cut' });
  if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
    return res.status(400).json({ error: 'bad_image' });
  }
  if (image.length * 0.75 > MAX_BYTES) return res.status(413).json({ error: 'too_large' });

  const prompt = `Give this person ${style}. ${PRESERVE}`;

  try {
    const out = provider === 'nvidia' ? await viaNvidia(prompt, image) : await viaFal(prompt, image);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ image: out });
  } catch (err) {
    if (err.code === 'content_filtered') return res.status(422).json({ error: 'content_filtered' });
    console.error('[try-on]', provider, err.status || '', err.message);
    return res.status(502).json({ error: 'provider_error' });
  }
}

async function viaFal(prompt, image) {
  const r = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
    method: 'POST',
    headers: { Authorization: `Key ${process.env.FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      image_url: image,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: 'jpeg',
      safety_tolerance: '2',
    }),
  });
  if (!r.ok) throw Object.assign(new Error(await r.text()), { status: r.status });
  const data = await r.json();
  if (data.has_nsfw_concepts?.[0]) throw Object.assign(new Error('filtered'), { code: 'content_filtered' });
  const url = data.images?.[0]?.url;
  if (!url) throw new Error('fal: no image in response');
  return url;
}

async function viaNvidia(prompt, image) {
  const endpoint = process.env.NVIDIA_ENDPOINT || 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-kontext-dev';
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (process.env.NVIDIA_API_KEY) headers.Authorization = `Bearer ${process.env.NVIDIA_API_KEY}`;
  const r = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      image,
      aspect_ratio: 'match_input_image',
      steps: 30,
      cfg_scale: 3.5,
      seed: 0,
    }),
  });
  if (!r.ok) throw Object.assign(new Error(await r.text()), { status: r.status });
  const data = await r.json();
  const art = data.artifacts?.[0];
  if (!art) throw new Error('nvidia: no artifact');
  if (art.finishReason === 'CONTENT_FILTERED') throw Object.assign(new Error('filtered'), { code: 'content_filtered' });
  if (art.finishReason && art.finishReason !== 'SUCCESS') throw new Error(`nvidia: ${art.finishReason}`);
  return `data:image/jpeg;base64,${art.base64}`;
}
