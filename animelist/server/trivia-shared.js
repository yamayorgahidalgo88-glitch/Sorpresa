// Quiz tipo Kahoot: piezas comunes al servidor y a la vista previa (sin imports; build-preview lo incrusta tal cual).
// - Elegir qué animes vistos salen en la partida
// - Datos e imágenes de AniList (personajes, banner de la serie)
// - Preguntas «de reserva» sin IA (se usan si no hay IA o si falla)

export const TRIVIA_COUNT = 10; // preguntas que se preparan de cada tanda
export const TRIVIA_MAX = 300; // tope de seguridad de una racha
export const TRIVIA_TOP = 5; // puntuaciones que salen en el ranking
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
  characters(sort:[ROLE,RELEVANCE,FAVOURITES_DESC], perPage:25){edges{role node{name{full} image{large} description(asHtml:false)}}}`;

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
        .map((e) => ({ name: e.node.name.full, image: e.node.image.large, main: e.role === 'MAIN', facts: characterFacts(e.node.description) })),
    };
  });
}

/** Imagen de la serie para una pregunta (banner ancho; si no hay, la carátula o el póster). */
export const animeImage = (anime, info) => info?.banner || info?.cover || anime.poster || null;

// ───────────── Datos de cada personaje (descripción de AniList) ─────────────
// Solo se leen datos con formato fijo («Position: Setter») y unas pocas frases muy concretas
// («the Wind Pillar»). Lo que AniList marca como spoiler (~! … !~) se quita siempre:
// suele ser del manga o de lo último que ha pasado.
const ELEMENTS = {
  water: ['Agua', 'del'], flame: ['Llama', 'de la'], fire: ['Llama', 'de la'], thunder: ['Trueno', 'del'], beast: ['Bestia', 'de la'],
  insect: ['Insecto', 'del'], sound: ['Sonido', 'del'], love: ['Amor', 'del'], mist: ['Niebla', 'de la'], serpent: ['Serpiente', 'de la'],
  snake: ['Serpiente', 'de la'], wind: ['Viento', 'del'], stone: ['Roca', 'de la'], flower: ['Flor', 'de la'], moon: ['Luna', 'de la'],
};
const BREATHINGS = [...new Set(Object.values(ELEMENTS).map(([n, a]) => `Respiración ${a} ${n}`))];
const POSITIONS = {
  setter: 'colocador', libero: 'líbero', 'middle blocker': 'central', 'wing spiker': 'atacante', 'outside hitter': 'atacante',
  'opposite hitter': 'opuesto', opposite: 'opuesto',
  forward: 'delantero', striker: 'delantero', 'center forward': 'delantero', midfielder: 'centrocampista', defender: 'defensa', goalkeeper: 'portero',
};
const SPORTS = [['colocador', 'líbero', 'central', 'atacante', 'opuesto'], ['delantero', 'centrocampista', 'defensa', 'portero']];
const ROLES = { captain: 'capitán', 'vice captain': 'vicecapitán', 'vice-captain': 'vicecapitán', ace: 'as', setter: 'colocador', libero: 'líbero', coach: 'entrenador' };
const NUMBERS = { one: 'Uno', two: 'Dos', three: 'Tres', four: 'Cuatro', five: 'Cinco', six: 'Seis' };
const GRADES = ['Grado especial', 'Grado 1', 'Grado 2', 'Grado 3', 'Grado 4'];
// Puestos en la tripulación (One Piece)
const CREW = { navigator: 'Navegante', doctor: 'Médico', sniper: 'Tirador', musician: 'Músico', swordsman: 'Espadachín', cook: 'Cocinero',
  archaeologist: 'Arqueólogo', shipwright: 'Carpintero', helmsman: 'Timonel' };
// Dones (My Hero Academia), con el nombre que usan en España
const QUIRKS = { 'one for all': 'One For All', 'all for one': 'All For One', explosion: 'Explosión', 'zero gravity': 'Gravedad cero',
  'half-cold half-hot': 'Medio frío, medio caliente', engine: 'Motor', frog: 'Rana', erasure: 'Borrado', decay: 'Desintegración',
  creation: 'Creación', hardening: 'Endurecimiento', 'pop off': 'Pelotas pegajosas', acid: 'Ácido', electrification: 'Electrificación',
  tape: 'Cinta adhesiva', tail: 'Cola', 'earphone jack': 'Clavija auricular', 'dark shadow': 'Dark Shadow', 'dupli-arms': 'Brazos duplicados',
  invisibility: 'Invisibilidad', anivoice: 'Voz animal', 'sugar rush': 'Subidón de azúcar', gigantification: 'Gigantismo' };
// Lo que hay justo antes de la frase no puede ser «hermano del…», «antiguo…», «no es…»
const NOT_SELF = /(brother|sister|son|daughter|father|mother|apprentice|student|disciple|former|previous|formerly|title|not|n't|wants|dream|become|replace|succe)\W*(\w+\W+){0,4}$/i;
const teamName = (s) => {
  const parts = String(s).split(/[;,]/).map((x) => x.trim()).filter(Boolean);
  const cur = parts.find((x) => /current/i.test(x)) || parts.find((x) => !/former|junior/i.test(x)) || '';
  const t = cur.replace(/\(.*?\)/g, '').replace(/\b(High School|High|Academy|Junior|Volleyball Club|volleyball club|School)\b.*$/i, '').trim();
  return /^[A-Z][\w.]+( [A-Z][\w.]+)?$/.test(t) ? t : null;
};

export function characterFacts(description) {
  const raw = String(description || '');
  const clean = raw.replace(/~![\s\S]*?!~/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, ' ');
  const fields = {};
  for (const m of clean.matchAll(/(?:__|\*\*)\s*([A-Za-z][A-Za-z ]{1,24}?)\s*:\s*(?:__|\*\*)\s*([^\n]*)/g)) {
    fields[m[1].toLowerCase()] = m[2].replace(/(__|\*\*)[\s\S]*$/, '').replace(/[&,;/\s]+$/, '').trim();
  }
  const text = clean.replace(/__|\*\*/g, '');
  const facts = [];
  const team = fields.team ? teamName(fields.team) : null;
  // Respiración (Kimetsu): solo si usa una
  const style = fields['combat style'] || '';
  const sm = style.match(/^(\w+) Breathing$/i);
  const rawStyle = (raw.match(/Combat Style\s*:\s*(?:__|\*\*)([^\n]*)/i) || [])[1] || '';
  if (sm && ELEMENTS[sm[1].toLowerCase()] && (rawStyle.match(/Breathing/gi) || []).length === 1) {
    const [n, a] = ELEMENTS[sm[1].toLowerCase()];
    facts.push({ key: 'breathing', value: `Respiración ${a} ${n}` });
  }
  // Posición (deportes)
  const pos = POSITIONS[(fields.position || '').toLowerCase()];
  if (pos) facts.push({ key: 'position', value: pos, team });
  // Grado de hechicero (Jujutsu Kaisen)
  const gm = (fields.grade || '').match(/^(Special Grade|Grade ([1-4]))\b/i);
  if (gm) facts.push({ key: 'grade', value: gm[2] ? `Grado ${gm[2]}` : 'Grado especial' });
  const ok = (m) => !NOT_SELF.test(text.slice(Math.max(0, m.index - 40), m.index));
  // Pilares
  for (const m of text.matchAll(/\b([A-Z][a-z]+) (?:[Pp]illar|Hashira)\b/g)) {
    const el = ELEMENTS[m[1].toLowerCase()];
    if (el && ok(m)) { facts.push({ key: 'pillar', value: `el Pilar ${el[1]} ${el[0]}` }); break; }
  }
  // Lunas demoníacas
  for (const m of text.matchAll(/\b(Upper|Lower) (?:Moon|Rank) (One|Two|Three|Four|Five|Six)\b/g)) {
    if (ok(m)) { facts.push({ key: 'moon', value: `la Luna ${m[1] === 'Upper' ? 'Superior' : 'Inferior'} ${NUMBERS[m[2].toLowerCase()]}` }); break; }
  }
  // «The setter and captain of the Aoba Josai High School…»
  const rm = text.match(/\b(?:[Tt]he|is)\s+((?:vice[- ]captain|captain|ace|setter|libero|coach)(?:\s+and\s+(?:vice[- ]captain|captain|ace|setter|libero))?)\s+of\s+(?:the\s+)?([A-Z][\w.]+(?: [A-Z][\w.]+)?)/);
  if (rm && ok(rm)) {
    const t = teamName(rm[2]);
    if (t) for (const r of rm[1].toLowerCase().split(/\s+and\s+/)) facts.push({ key: 'role', value: ROLES[r.replace('-', ' ')] || ROLES[r], team: t });
  }
  // «…realizing that he is Karasuno's ace»
  const am = text.match(/\b(?:is|as)\s+([A-Z][\w]+)'s\s+(ace|setter|libero|captain)\b/);
  if (am && ok(am)) facts.push({ key: 'role', value: ROLES[am[2]], team: am[1] });
  // One Piece: fruta del diablo y puesto en la tripulación
  const fruit = (fields['devil fruit'] || '').match(/^([A-Z][a-z]+ [A-Z][a-z]+ no Mi)\b/);
  if (fruit) facts.push({ key: 'fruit', value: fruit[1] });
  const crew = CREW[(fields.position || '').toLowerCase()];
  if (crew) facts.push({ key: 'crew', value: crew });
  // My Hero Academia: don
  const quirk = QUIRKS[(fields.quirk || '').toLowerCase()];
  if (quirk) facts.push({ key: 'quirk', value: quirk });
  // Bleach: zanpakutō y capitanes/tenientes de cada división
  const zan = (fields.zanpakutou || fields['zanpakutō'] || fields.zanpakuto || '').replace(/\(.*$/, '').trim();
  if (/^[A-Z][A-Za-z' -]{2,30}$/.test(zan) && !/none|unknown/i.test(zan)) facts.push({ key: 'zanpakuto', value: zan });
  const div = (fields.rank || '').match(/^(Captain|Lieutenant) of (?:the )?(\d+)(?:st|nd|rd|th) Division\b/i);
  if (div) facts.push({ key: 'division', value: `el ${/^c/i.test(div[1]) ? 'capitán' : 'teniente'} de la ${div[2]}.ª División` });
  if (pos && team && ROLES[(fields.position || '').toLowerCase()]) facts.push({ key: 'role', value: ROLES[fields.position.toLowerCase()], team });
  const seen = new Set();
  return facts.filter((f) => f.value && !seen.has(f.key + f.value + f.team) && seen.add(f.key + f.value + f.team));
}

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const del = (team) => `del ${team}`;
const sameFact = (a, b) => a.key === b.key && a.value === b.value && (a.team || null) === (b.team || null);

// «¿Quién es el Pilar del Viento?» → se responde eligiendo entre 4 caras
function whoQuestions(a, info) {
  const chars = info?.characters || [];
  const out = [];
  for (const c of chars) {
    for (const f of c.facts || []) {
      if (!['pillar', 'moon', 'role', 'division', 'fruit'].includes(f.key)) continue;
      // «Capitán» o «entrenador» solo en equipos deportivos (no «capitán del Straw Hat»)
      if (f.key === 'role' && ['capitán', 'vicecapitán', 'entrenador'].includes(f.value) &&
        !chars.some((o) => (o.facts || []).some((g) => g.key === 'position' && g.team === f.team))) continue;
      // La respuesta tiene que ser única entre los personajes del anime
      if (chars.some((o) => o !== c && (o.facts || []).some((g) => sameFact(f, g) || (f.key === 'role' && g.key === 'position' && g.value === f.value && g.team === f.team)))) continue;
      const family = f.key === 'role' ? ['role', 'position'] : [f.key];
      const wrong = chars.filter((o) => o !== c && o.name !== c.name && (o.facts || []).some((g) => family.includes(g.key)));
      if (wrong.length < 3) continue;
      const text = f.key === 'role' ? `¿Quién es el ${f.value} ${del(f.team)}?` : f.key === 'fruit' ? `¿Quién comió la ${f.value}?` : `¿Quién es ${f.value}?`;
      out.push({ char: c, text, wrong });
    }
  }
  return out;
}

// «¿Qué respiración usa Zenitsu?» → se responde con texto y sale su cara
function whatQuestions(info) {
  const out = [];
  const pool = (key) => [...new Set((info?.characters || []).flatMap((c) => (c.facts || []).filter((f) => f.key === key).map((f) => f.value)))];
  for (const c of info?.characters || []) {
    for (const f of c.facts || []) {
      if (f.key === 'fruit') out.push({ char: c, text: `¿Qué fruta del diablo comió ${c.name}?`, right: f.value, pool: pool('fruit') });
      if (f.key === 'crew') out.push({ char: c, text: `¿Qué puesto tiene ${c.name} en la tripulación?`, right: f.value, pool: Object.values(CREW) });
      if (f.key === 'quirk') out.push({ char: c, text: `¿Cuál es el don de ${c.name}?`, right: f.value, pool: [...new Set(Object.values(QUIRKS))] });
      if (f.key === 'zanpakuto') out.push({ char: c, text: `¿Cómo se llama la zanpakutō de ${c.name}?`, right: f.value, pool: pool('zanpakuto') });
      if (f.key === 'breathing') out.push({ char: c, text: `¿Qué respiración usa ${c.name}?`, right: f.value, pool: BREATHINGS });
      if (f.key === 'grade') out.push({ char: c, text: `¿De qué grado es ${c.name}?`, right: f.value, pool: GRADES });
      if (f.key === 'position') {
        const sport = SPORTS.find((g) => g.includes(f.value));
        out.push({ char: c, text: `¿En qué posición juega ${c.name}${f.team ? ` en el ${f.team}` : ''}?`, right: capital(f.value), pool: sport.map(capital) });
      }
    }
  }
  return out;
}

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

// ───────────── Banco de preguntas de la trama (server/trivia-bank.js) ─────────────
/** Preguntas del banco para un anime visto: por su id del catálogo o por alguno de sus títulos. */
export function bankFor(anime, bank = []) {
  const names = new Set([anime.title, ...(anime.names || [])].filter(Boolean).map(simpleKey));
  const hits = bank.filter((b) => (anime.jw_id && b.ids?.includes(anime.jw_id)) || b.names.some((n) => names.has(simpleKey(n))));
  const seenQ = new Set();
  return hits.flatMap((b) => b.questions).filter((q) => !seenQ.has(simpleKey(q.q)) && seenQ.add(simpleKey(q.q)));
}

// Foto de AniList para un nombre del banco («Kakashi Hatake» ↔ «Kakashi Hatake», «Giyu Tomioka» ↔ «Giyuu Tomioka»)
const nameKey = (s) => simpleKey(s).replace(/(.)\1+/g, '$1').replace(/ou/g, 'o').replace(/uu/g, 'u');
function faceOf(info, name) {
  const want = nameKey(name).split(' ');
  const found = (info?.characters || []).filter((c) => { const have = nameKey(c.name).split(' '); return want.every((w) => have.includes(w)); });
  return found.length === 1 ? found[0].image : null;
}

/**
 * Genera preguntas con los datos de AniList: personajes (con su foto), estudio y año.
 * extraTitles: títulos populares del catálogo para tener opciones aunque hayas visto pocos animes.
 */
export function localTrivia(animes, infos, plan, { extraTitles = [], bank = [], avoid = new Set(), exclude = new Set(), rnd = Math.random, count = TRIVIA_COUNT } = {}) {
  const used = new Set(exclude);
  // Preguntas de la trama escritas a mano
  const fromBank = (a, info) => {
    const pool = triviaShuffle(bankFor(a, bank), rnd).filter((x) => !used.has(x.q));
    const q = pool.find((x) => !avoid.has(x.q)) || pool[0]; // primero las que no te han salido en tus últimas partidas
    if (!q) return null;
    used.add(q.q);
    const options = triviaShuffle([q.a, ...q.w], rnd);
    const faces = q.f ? options.map((o) => faceOf(info, o)) : null;
    return { question: q.q, image: animeImage(a, info), options, correct: options.indexOf(q.a), fact: '',
      ...(faces && faces.every(Boolean) ? { optionImages: faces } : {}), ...(q.k ? { bankKey: q.k } : {}) };
  };
  // Preguntas «de dentro» del anime (Pilares, capitanes, posiciones, respiraciones…)
  const deep = [
    (a, info) => { // ¿Quién es el Pilar del Viento? → 4 caras
      const w = triviaShuffle(whoQuestions(a, info), rnd).find((x) => !used.has(x.text) && !used.has(x.char.name));
      if (!w) return null;
      const picks = [w.char, ...triviaShuffle(w.wrong, rnd).filter((x, i, arr) => arr.findIndex((y) => y.name === x.name) === i).slice(0, 3)];
      if (picks.length < 4) return null;
      const order = triviaShuffle(picks, rnd);
      used.add(w.text); used.add(w.char.name);
      return { question: w.text, image: animeImage(a, info), options: order.map((x) => x.name), optionImages: order.map((x) => x.image),
        correct: order.indexOf(w.char), fact: '' };
    },
    (a, info) => { // ¿Qué respiración usa…? / ¿En qué posición juega…?
      const w = triviaShuffle(whatQuestions(info), rnd).find((x) => !used.has(x.text) && !used.has(x.char.name));
      if (!w) return null;
      const o = options4(w.right, w.pool, rnd);
      if (!o) return null;
      used.add(w.text); used.add(w.char.name);
      return { question: w.text, image: w.char.image, ...o, fact: '' };
    },
  ];
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
      // Solo personajes importantes (los primeros de AniList), que se reconozcan
      const c = triviaShuffle((info?.characters || []).slice(0, 10), rnd).find((x) => !used.has(x.name));
      if (!c) return null;
      const o = options4(a.title, animes.map((x) => x.title), rnd, extraTitles, true);
      if (!o) return null;
      used.add(c.name);
      return { question: `¿De qué anime es ${c.name}?`, image: c.image, ...o, fact: '' };
    },
  ];
  // Estudio y año: solo si no hay nada mejor
  const tail = [
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
    // 3 de cada 4 veces se intenta antes una pregunta «de dentro» del anime
    // Si hay preguntas de la trama, casi siempre van primero; si no, las de AniList «de dentro»
    const hasBank = bankFor(a, bank).length > 0;
    let order = rnd() < 0.75 ? [...triviaShuffle(deep, rnd), ...triviaShuffle(makers, rnd)] : [...triviaShuffle(makers, rnd), ...triviaShuffle(deep, rnd)];
    if (hasBank) order = rnd() < 0.7 ? [fromBank, ...order] : [...order.slice(0, 1), fromBank, ...order.slice(1)];
    order = order.concat(triviaShuffle(tail, rnd));
    for (const make of order) {
      const q = make(a, info);
      if (q) { out.push({ anime: a.title, ...q }); break; }
    }
  }
  // Si algún anime no tenía datos suficientes, se rellenan con los demás
  for (let tries = 0; out.length < count && tries < 40; tries++) {
    const idx = Math.floor(rnd() * animes.length);
    const all = [fromBank, ...deep, ...makers, ...tail];
    const q = all[tries % all.length](animes[idx], infos[idx]);
    if (q) out.push({ anime: animes[idx].title, ...q });
  }
  return out.slice(0, count);
}

/**
 * Prepara una partida: elige animes, trae AniList y pide las preguntas a la IA (si hay);
 * lo que falte hasta 10 se completa con preguntas locales.
 */
export async function buildTrivia(seen, { fetchFn = fetch, ai = null, extraTitles = [], bank = [], moreBank = null, avoid = new Set(), exclude = [], rnd = Math.random } = {}) {
  // exclude: preguntas que ya han salido en esta partida (modo racha: se van pidiendo tandas)
  const qid = (q) => `${q.question}|${q.options[q.correct]}`;
  const exTexts = new Set(exclude.map((q) => q.question));
  const { animes, plan } = planTrivia(seen, rnd);
  const infos = await fetchAniList(animes, fetchFn);
  // Preguntas de la trama generadas por la IA gratuita y guardadas por el servidor (se amplían con el tiempo)
  if (moreBank) {
    try { bank = bank.concat(await moreBank(animes, infos, bank)); } catch { /* sin IA: seguimos */ }
  }
  let questions = [];
  if (ai) { try { questions = await ai(animes, infos, plan); } catch { questions = []; } }
  const fromAi = questions.length;
  if (questions.length < TRIVIA_COUNT) {
    const missing = plan.slice(questions.length);
    questions = questions.concat(localTrivia(animes, infos, missing, { extraTitles, bank, avoid, exclude: exTexts, rnd, count: TRIVIA_COUNT - questions.length }));
  }
  // Sin repetir preguntas dentro de la misma partida (en el modo racha se van pidiendo tandas)
  const seenQ = new Set(exclude.map(qid));
  questions = questions.filter((q) => validQuestion(q) && !seenQ.has(qid(q)) && seenQ.add(qid(q))).slice(0, TRIVIA_COUNT);
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
export const publicQuestion = ({ anime, question, options, image, optionImages, bankKey }) => ({
  anime, question, options, image: image || null, ...(optionImages ? { optionImages } : {}), ...(bankKey ? { reportable: true } : {}) });

/** Mejores partidas: más aciertos, luego menos tiempo, luego la más reciente. */
export const sortBest = (games) => [...games].sort((a, b) => b.score - a.score || a.total_ms - b.total_ms || b.finished_at - a.finished_at);
