// Construye data/catalog.json: TODO el anime (series y películas) disponible por
// suscripción en España en Crunchyroll, Netflix, HBO Max, Prime Video y Disney+.
// Fuente de disponibilidad e idiomas: JustWatch (país ES).
// Alias (romaji / inglés) para que la búsqueda entienda "Kimetsu no Yaiba": AniList.
//
// Uso: node scripts/build-catalog.mjs   (tarda unos minutos por los límites de AniList)
//      node scripts/build-catalog.mjs --only-missing   (solo reintenta alias que faltan)
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { JW_PACKAGES, normalizeOffers, posterUrl } from '../server/justwatch.js';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'catalog.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LIST_QUERY = `query($after:String){
  popularTitles(country:ES, first:100, after:$after, sortBy:POPULAR,
    filter:{genres:["ani"], productionCountries:["JP"], packages:${JSON.stringify(JW_PACKAGES.map((p) => p.short))}, monetizationTypes:[FLATRATE, FREE, ADS]}) {
    totalCount pageInfo { endCursor hasNextPage }
    edges { node {
      id objectType
      content(country:ES, language:es) { title originalTitle originalReleaseYear posterUrl runtime }
      ... on Show { totalSeasonCount seasons { totalEpisodeCount } }
      offers(country:ES, platform:WEB) { monetizationType standardWebURL package { technicalName } audioLanguages subtitleLanguages }
    } }
  }
}`;

async function gql(url, query, variables, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      if (res.status === 429) { await sleep(Number(res.headers.get('retry-after') || 30) * 1000); continue; }
      const json = await res.json();
      if (json.errors && !json.data) throw new Error(JSON.stringify(json.errors).slice(0, 300));
      return json.data;
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(2000 * 2 ** i);
    }
  }
}

async function fetchJustWatch() {
  const out = [];
  let after = null;
  for (;;) {
    const data = await gql('https://apis.justwatch.com/graphql', LIST_QUERY, { after });
    const pt = data.popularTitles;
    for (const { node } of pt.edges) {
      const c = node.content;
      const platforms = normalizeOffers(node.offers);
      if (!platforms.length) continue;
      const episodes = (node.seasons || []).reduce((a, s) => a + (s.totalEpisodeCount || 0), 0);
      out.push({
        id: node.id,
        type: node.objectType === 'MOVIE' ? 'movie' : 'show',
        title: c.title,
        original: c.originalTitle,
        year: c.originalReleaseYear,
        poster: posterUrl(c.posterUrl),
        episodes: episodes || null,
        seasons: node.totalSeasonCount || null,
        runtime: c.runtime || null,
        platforms,
      });
    }
    process.stdout.write(`\rJustWatch: ${out.length}/${pt.totalCount}`);
    if (!pt.pageInfo.hasNextPage) break;
    after = pt.pageInfo.endCursor;
    await sleep(300);
  }
  console.log();
  return out;
}

// AniList: busca por título nativo (japonés) y guarda romaji + inglés como alias.
const plain = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function enrichAniList(items, { retry = false } = {}) {
  const BATCH = 12;
  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH);
    const fields = slice.map((it, k) =>
      `a${k}: Page(perPage:3){ media(search:${JSON.stringify(plain(retry ? it.title : it.original || it.title))}, type:ANIME){ title{romaji english native} synonyms startDate{year} } }`);
    try {
      const data = await gql('https://graphql.anilist.co', `query{${fields.join('\n')}}`, {}, 4);
      slice.forEach((it, k) => {
        const media = data?.[`a${k}`]?.media || [];
        const best = media.find((m) => m.startDate?.year && Math.abs(m.startDate.year - it.year) <= 1) ||
          media.find((m) => m.title.native === it.original) ||
          (retry && media[0]?.startDate?.year && Math.abs(media[0].startDate.year - it.year) <= 3 ? media[0] : null);
        if (!best) return;
        const aka = new Set([best.title.romaji, best.title.english, ...(best.synonyms || []).filter((s) => /^[\x00-\x7FÀ-ÿ\s]+$/.test(s))]);
        aka.delete(it.title); aka.delete(null); aka.delete(undefined);
        if (aka.size) it.aka = [...aka].slice(0, 6);
      });
    } catch (e) {
      console.warn(`\nAniList lote ${i}: ${e.message}`);
    }
    process.stdout.write(`\rAniList: ${Math.min(i + BATCH, items.length)}/${items.length}`);
    await sleep(2200);
  }
  console.log();
}

let items;
if (process.argv.includes('--only-missing')) {
  items = JSON.parse(await readFile(OUT, 'utf8')).items;
  const missing = items.filter((it) => !it.aka);
  await enrichAniList(missing.filter((it) => it.original && it.original !== it.title));
  await enrichAniList(items.filter((it) => !it.aka), { retry: true });
} else {
  items = await fetchJustWatch();
  if (!process.argv.includes('--no-anilist')) {
    await enrichAniList(items);
    await enrichAniList(items.filter((it) => !it.aka), { retry: true });
  }
}
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ country: 'ES', builtAt: new Date().toISOString(), count: items.length, items }));
console.log(`Guardado ${items.length} títulos en ${OUT}`);
