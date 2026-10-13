// Disponibilidad de anime en España (JustWatch, país ES) + caché en memoria.
export const JW_PACKAGES = [
  { key: 'crunchyroll', name: 'Crunchyroll', short: 'cru', tech: ['crunchyroll'] },
  { key: 'netflix', name: 'Netflix', short: 'nfx', tech: ['netflix', 'netflixbasicwithads'] },
  { key: 'max', name: 'HBO Max', short: 'mxx', tech: ['max', 'hbomax'] },
  { key: 'prime', name: 'Prime Video', short: 'prv', tech: ['amazonprimevideo', 'amazonprimevideowithads'] },
  { key: 'disney', name: 'Disney+', short: 'dnp', tech: ['disneyplus'] },
];
const TECH_TO_KEY = Object.fromEntries(JW_PACKAGES.flatMap((p) => p.tech.map((t) => [t, p.key])));
const SUB_TYPES = new Set(['FLATRATE', 'FREE', 'ADS']);

export function posterUrl(p) {
  return p ? 'https://images.justwatch.com' + p.replace('{profile}', 's332').replace('{format}', 'webp') : null;
}

export function normalizeOffers(offers = []) {
  const by = new Map();
  for (const o of offers) {
    const key = TECH_TO_KEY[o.package?.technicalName];
    if (!key || !SUB_TYPES.has(o.monetizationType)) continue;
    const cur = by.get(key) || { key, url: o.standardWebURL, audio: new Set(), subs: new Set() };
    (o.audioLanguages || []).forEach((l) => cur.audio.add(l));
    (o.subtitleLanguages || []).forEach((l) => cur.subs.add(l));
    by.set(key, cur);
  }
  return JW_PACKAGES.filter((p) => by.has(p.key)).map((p) => {
    const v = by.get(p.key);
    return { key: p.key, url: v.url, audio: [...v.audio].sort(), subs: [...v.subs].sort() };
  });
}

const NODE_FIELDS = `
  id objectType
  content(country:ES, language:es) { title originalTitle originalReleaseYear posterUrl runtime genres { shortName } }
  ... on Show { totalSeasonCount seasons { totalEpisodeCount } }
  offers(country:ES, platform:WEB) { monetizationType standardWebURL package { technicalName } audioLanguages subtitleLanguages }`;

async function gql(query, variables) {
  const ctrl = AbortSignal.timeout(8000);
  const res = await fetch('https://apis.justwatch.com/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: ctrl,
  });
  if (!res.ok) throw new Error('JustWatch ' + res.status);
  const json = await res.json();
  if (!json.data) throw new Error('JustWatch sin datos');
  return json.data;
}

function toItem(node) {
  const c = node.content;
  const episodes = (node.seasons || []).reduce((a, s) => a + (s.totalEpisodeCount || 0), 0);
  return {
    id: node.id,
    type: node.objectType === 'MOVIE' ? 'movie' : 'show',
    title: c.title,
    original: c.originalTitle,
    year: c.originalReleaseYear,
    poster: posterUrl(c.posterUrl),
    episodes: episodes || null,
    seasons: node.totalSeasonCount || null,
    runtime: c.runtime || null,
    animation: (c.genres || []).some((g) => g.shortName === 'ani'),
    platforms: normalizeOffers(node.offers),
  };
}

const cache = new Map();
const TTL = 6 * 3600 * 1000;
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return v;
}

/** Búsqueda en vivo (entiende títulos en japonés/inglés/español). */
export function liveSearch(q) {
  return cached('s:' + q.toLowerCase(), async () => {
    const data = await gql(`query($q:String!){ popularTitles(country:ES, first:12, filter:{searchQuery:$q}) { edges { node { ${NODE_FIELDS} } } } }`, { q });
    return data.popularTitles.edges.map((e) => toItem(e.node)).filter((i) => i.animation);
  });
}

/** Disponibilidad actualizada de un título concreto. */
export function liveDetail(id) {
  return cached('d:' + id, async () => {
    const data = await gql(`query($id:ID!){ node(id:$id) { ... on MovieOrShow { ${NODE_FIELDS} } } }`, { id });
    return data.node ? toItem(data.node) : null;
  });
}
