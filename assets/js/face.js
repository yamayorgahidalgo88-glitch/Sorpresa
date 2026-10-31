// Análisis de la forma del rostro en el navegador con MediaPipe Face Landmarker.
// La foto no sale del dispositivo en este paso.

const MP_VERSION = '0.10.14';
const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let landmarkerPromise = null;

export function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import(/* @vite-ignore */ `${MP_BASE}/vision_bundle.mjs`);
      const fileset = await vision.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
      const make = (delegate) =>
        vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'IMAGE',
          numFaces: 2,
        });
      try {
        return await make('GPU');
      } catch {
        return await make('CPU');
      }
    })().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

// Índices de la malla de 468 puntos
export const IDX = {
  top: 10,
  chin: 152,
  cheekL: 234,
  cheekR: 454,
  jawL: 172,
  jawR: 397,
  browL: 54,
  browR: 284,
  nose: 1,
};

const PAIRS = [
  [33, 263], [133, 362], [61, 291], [234, 454], [172, 397], [54, 284], [70, 300], [93, 323], [132, 361], [58, 288],
];

export async function analyze(source) {
  const lm = await loadLandmarker();
  const result = lm.detect(source);
  const faces = result.faceLandmarks || [];
  if (faces.length === 0) return { error: 'no-face' };
  if (faces.length > 1) return { error: 'many-faces' };

  const w = source.naturalWidth || source.width;
  const h = source.naturalHeight || source.height;
  const pts = faces[0].map((p) => ({ x: p.x * w, y: p.y * h, z: p.z * w }));
  return { points: pts, ...measure(pts) };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function measure(pts) {
  const P = (i) => pts[i];
  // Enderezar: rotamos alrededor del centro para que el eje frente-barbilla sea vertical
  const top = P(IDX.top), chin = P(IDX.chin);
  const angle = Math.atan2(chin.x - top.x, chin.y - top.y);
  const cx = (top.x + chin.x) / 2, cy = (top.y + chin.y) / 2;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const R = (p) => ({
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
  });

  // La malla acaba en el nacimiento de la frente, no en el pelo: corregimos el largo
  // con una extensión fija para aproximar la altura real de la cara.
  const length = dist(top, chin) * 1.12;
  const cheek = dist(P(IDX.cheekL), P(IDX.cheekR));
  const jaw = dist(P(IDX.jawL), P(IDX.jawR));
  const forehead = dist(P(IDX.browL), P(IDX.browR));

  const ratios = {
    length: length / cheek,
    jaw: jaw / cheek,
    forehead: forehead / cheek,
  };

  // Simetría: reflejamos cada par sobre el eje medio y medimos el desajuste
  const axisX = (R(top).x + R(chin).x) / 2;
  let err = 0;
  for (const [a, b] of PAIRS) {
    const pa = R(P(a)), pb = R(P(b));
    err += Math.hypot(axisX - pa.x - (pb.x - axisX), pa.y - pb.y);
  }
  err /= PAIRS.length * cheek;
  const symmetry = Math.max(0, Math.min(100, Math.round(100 - err * 260)));

  // Giro de la cabeza: nariz desplazada respecto al centro de los pómulos
  const midCheek = (R(P(IDX.cheekL)).x + R(P(IDX.cheekR)).x) / 2;
  const yaw = (R(P(IDX.nose)).x - midCheek) / cheek;

  const scores = shapeScores(ratios);
  const shape = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

  return {
    ratios,
    symmetry,
    turned: Math.abs(yaw) > 0.07,
    tilted: Math.abs(angle) > 0.18,
    shape,
    scores,
  };
}

// Cada forma tiene un perfil ideal de proporciones; gana la más cercana.
const PROFILES = {
  ovalada: { length: 1.36, jaw: 0.78, forehead: 0.82 },
  redonda: { length: 1.19, jaw: 0.81, forehead: 0.81 },
  cuadrada: { length: 1.25, jaw: 0.91, forehead: 0.87 },
  alargada: { length: 1.54, jaw: 0.82, forehead: 0.83 },
  corazon: { length: 1.36, jaw: 0.70, forehead: 0.91 },
  diamante: { length: 1.38, jaw: 0.71, forehead: 0.72 },
};
const WEIGHTS = { length: 1.4, jaw: 2.2, forehead: 1.8 };

function shapeScores(r) {
  const out = {};
  for (const [name, p] of Object.entries(PROFILES)) {
    let d = 0;
    for (const k of Object.keys(WEIGHTS)) d += WEIGHTS[k] * ((r[k] - p[k]) / p[k]) ** 2;
    out[name] = Math.exp(-d * 40);
  }
  const sum = Object.values(out).reduce((a, b) => a + b, 0) || 1;
  for (const k in out) out[k] /= sum;
  return out;
}
