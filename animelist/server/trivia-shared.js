// Quiz tipo Kahoot: piezas comunes al servidor y a la vista previa (sin imports; build-preview lo incrusta tal cual).
// - Elegir qué animes vistos salen en la partida
// - Datos e imágenes de AniList (personajes, banner de la serie)
// - Preguntas «de reserva» sin IA (se usan si no hay IA o si falla)

export const TRIVIA_COUNT = 10;
export const TRIVIA_SECONDS = 20;

export const triviaShuffle = (arr, rnd = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const plainText = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const simpleKey = (s) => plainText(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Animes vistos sin repetir (el mismo anime puede estar en varias tablas). */
export function dedupeSeen(rows) {
  const out = new Map();
  for (const r of rows) {
    const key = r.jw_id || 'title:' + simpleKey(r.title);
    if (!out.has(key)) out.set(key, r);
  }
  return [...out.values()];
}

/** Hasta 10 animes al azar y un reparto de las 10 preguntas entre ellos (todos salen al menos una vez). */
export function planTrivia(seen, rnd = Math.random) {
  const animes = triviaShuffle(seen, rnd).slice(0, TRIVIA_COUNT);
  const plan = Array.from({ length: TRIVIA_COUNT }, (_, i) => i % animes.length);
  return { animes, plan: triviaShuffle(plan, rnd) };
}

// ───────────── AniList ─────────────
const ANILIST_FIELDS = `title{romaji english} format startDate{year} episodes bannerImage coverImage{extraLarge large}
  studios(isMain:true){nodes{name}}
  characters(sort:[ROLE,RELEVANCE,FAVOURITES_DESC], perPage:10){edges{role node{name{full} image{large}}}}`;

/** Busca cada anime en AniList (una sola petición). Devuelve un array paralelo con sus datos o null. */
export async function fetchAniList(animes, fetchFn = fetch, timeoutMs = 8000) {
  if (!animes.length) return [];
  const fields = animes.map((a, k) => `a${k}: Page(perPage:3){ media(search:${JSON.stringify(plainText(a.search || a.title))}, type:ANIME){ ${ANILIST_FIELDS} } }`);
  let data = null;
  try {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl && setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetchFn('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query: `query{${fields.join('\n')}}` }),
      signal: ctrl?.signal,
    });
    clearTimeout(timer);
    data = (await res.json())?.data || null;
  } catch { data = null; }
  return animes.map((a, k) => {
    const media = data?.[`a${k}`]?.media || [];
    const want = a.kind === 'movie' ? 'MOVIE' : null;
    const best = media.find((m) => a.year && m.startDate?.year && Math.abs(m.startDate.year - a.year) <= 1 && (!want || m.format === want)) ||
      media.find((m) => a.year && m.startDate?.year && Math.abs(m.startDate.year - a.year) <= 1) ||
      media.find((m) => !want || m.format === want) || media[0];
    if (!best) return null;
    return {
      romaji: best.title?.romaji || null,
      english: best.title?.english || null,
      year: best.startDate?.year || null,
      episodes: best.episodes || null,
      banner: best.bannerImage || null,
      cover: best.coverImage?.extraLarge || best.coverImage?.large || null,
      studio: best.studios?.nodes?.[0]?.name || null,
      characters: (best.characters?.edges || [])
        .filter((e) => e.node?.name?.full && e.node?.image?.large && !/default\.jpg$/.test(e.node.image.large))
        .map((e) => ({ name: e.node.name.full, image: e.node.image.large, main: e.role === 'MAIN' })),
    };
  });
}

/** Imagen de la serie para una pregunta (banner ancho; si no hay, la carátula o el póster). */
export const animeImage = (anime, info) => info?.banner || info?.cover || anime.poster || null;

// ───────────── Preguntas sin IA ─────────────
const STUDIOS = ['MAPPA', 'ufotable', 'Wit Studio', 'Madhouse', 'Bones', 'Production I.G', 'Kyoto Animation', 'A-1 Pictures', 'CloverWorks',
  'Toei Animation', 'Pierrot', 'Sunrise', 'Trigger', 'David Production', 'Shaft', 'J.C.Staff', 'Studio Ghibli', 'CoMix Wave Films', 'Science SARU', 'TMS Entertainment'];

// ¿Se parecen demasiado? («Kimetsu no Yaiba» y «Guardianes de la noche: Kimetsu no Yaiba»)
const words = (s) => new Set(simpleKey(s).split(' ').filter((w) => w.length >= 5));
const tooSimilar = (a, b) => { const wa = words(a); return [...words(b)].some((w) => wa.has(w)); };

// pool: opciones incorrectas preferidas (p. ej. personajes del mismo anime); backup: para completar si faltan
function options4(correct, pool, rnd, backup = [], similarCheck = false) {
  const seen = new Set([simpleKey(correct)]);
  const wrong = [];
  for (const p of [...triviaShuffle(pool, rnd), ...triviaShuffle(backup, rnd)]) {
    const k = simpleKey(p);
    if (!p || seen.has(k) || (similarCheck && (tooSimilar(correct, p) || wrong.some((w) => tooSimilar(w, p))))) continue;
    seen.add(k);
    wrong.push(p);
    if (wrong.length === 3) break;
  }
  if (wrong.length < 3) return null;
  const options = triviaShuffle([correct, ...wrong], rnd);
  return { options, correct: options.indexOf(correct) };
}

/**
 * Genera preguntas con los datos de AniList: personajes (con su foto), estudio y año.
 * extraTitles: títulos populares del catálogo para tener opciones aunque hayas visto pocos animes.
 */
export function localTrivia(animes, infos, plan, { extraTitles = [], rnd = Math.random, count = TRIVIA_COUNT } = {}) {
  const used = new Set();
  const makers = [
    (a, info) => { // ¿Cómo se llama este personaje?
      const chars = info?.characters || [];
      const c = triviaShuffle(chars.filter((x) => x.main), rnd).concat(triviaShuffle(chars, rnd)).find((x) => !used.has(x.name));
      if (!c) return null;
      const others = infos.filter((i) => i !== info).flatMap((i) => (i?.characters || []).map((x) => x.name));
      const o = options4(c.name, chars.map((x) => x.name), rnd, others);
      if (!o) return null;
      used.add(c.name);
      return { question: `¿Cómo se llama este personaje de «${a.title}»?`, image: c.image, ...o, fact: '' };
    },
    (a, info) => { // ¿De qué anime es este personaje?
      const c = triviaShuffle(info?.characters || [], rnd).find((x) => !used.has(x.name));
      if (!c) return null;
      const o = options4(a.title, animes.map((x) => x.title), rnd, extraTitles, true);
      if (!o) return null;
      used.add(c.name);
      return { question: `¿De qué anime es ${c.name}?`, image: c.image, ...o, fact: '' };
    },
    (a, info) => { // Estudio de animación
      if (!info?.studio || used.has('studio:' + a.title)) return null;
      const o = options4(info.studio, STUDIOS, rnd);
      if (!o) return null;
      used.add('studio:' + a.title);
      return { question: `¿Qué estudio animó «${a.title}»?`, image: animeImage(a, info), ...o, fact: '' };
    },
    (a, info) => { // Año de estreno
      const y = info?.year || a.year;
      if (!y || used.has('year:' + a.title)) return null;
      const thisYear = new Date().getFullYear();
      const deltas = triviaShuffle([-4, -3, -2, -1, 1, 2, 3].filter((d) => y + d <= thisYear), rnd).slice(0, 3);
      const o = options4(String(y), deltas.map((d) => String(y + d)), rnd);
      used.add('year:' + a.title);
      return { question: `¿En qué año se estrenó «${a.title}»?`, image: animeImage(a, info), ...o, fact: '' };
    },
  ];
  const out = [];
  for (const idx of plan) {
    if (out.length >= count) break;
    const a = animes[idx], info = infos[idx];
    for (const make of triviaShuffle(makers, rnd)) {
      const q = make(a, info);
      if (q) { out.push({ anime: a.title, ...q }); break; }
    }
  }
  // Si algún anime no tenía datos suficientes, se rellenan con los demás
  for (let tries = 0; out.length < count && tries < 40; tries++) {
    const idx = Math.floor(rnd() * animes.length);
    const q = makers[tries % makers.length](animes[idx], infos[idx]);
    if (q) out.push({ anime: animes[idx].title, ...q });
  }
  return out.slice(0, count);
}

/**
 * Prepara una partida: elige animes, trae AniList y pide las preguntas a la IA (si hay);
 * lo que falte hasta 10 se completa con preguntas locales.
 */
export async function buildTrivia(seen, { fetchFn = fetch, ai = null, extraTitles = [], rnd = Math.random } = {}) {
  const { animes, plan } = planTrivia(seen, rnd);
  const infos = await fetchAniList(animes, fetchFn);
  let questions = [];
  if (ai) { try { questions = await ai(animes, infos, plan); } catch { questions = []; } }
  const fromAi = questions.length;
  if (questions.length < TRIVIA_COUNT) {
    const missing = plan.slice(questions.length);
    questions = questions.concat(localTrivia(animes, infos, missing, { extraTitles, rnd, count: TRIVIA_COUNT - questions.length }));
  }
  questions = questions.filter(validQuestion).slice(0, TRIVIA_COUNT);
  return { questions, source: fromAi ? 'ai' : 'local' };
}

/** Comprueba una pregunta (de la IA o local) antes de usarla. */
export function validQuestion(q) {
  if (!q || typeof q.question !== 'string' || !q.question.trim() || q.question.length > 300) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (q.options.some((o) => typeof o !== 'string' || !o.trim() || o.length > 120)) return false;
  if (new Set(q.options.map(simpleKey)).size !== 4) return false;
  return Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4;
}

/** Lo que ve el móvil antes de responder: sin la respuesta correcta. */
export const publicQuestion = ({ anime, question, options, image }) => ({ anime, question, options, image: image || null });

/** Mejores partidas: más aciertos, luego menos tiempo, luego la más reciente. */
export const sortBest = (games) => [...games].sort((a, b) => b.score - a.score || a.total_ms - b.total_ms || b.finished_at - a.finished_at);
