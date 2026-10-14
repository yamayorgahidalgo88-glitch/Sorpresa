import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dir = mkdtempSync(path.join(tmpdir(), 'animelist-'));
process.env.DB_FILE = path.join(dir, 'test.db');
const { app } = await import('../server/index.js');
const { initDb } = await import('../server/db.js');

let server, base;
before(async () => {
  await initDb();
  await initDb(); // las migraciones se pueden repetir sin romper nada
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

// Mini cliente con cookie de sesión propia
function client() {
  let cookie = '';
  return async (p, { method, body } = {}) => {
    const res = await fetch(base + p, {
      method: method || (body ? 'POST' : 'GET'),
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), cookie },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, data: await res.json() };
  };
}

const yhm = client();
const marta = client();
const otro = client();

test('registro, login y validaciones', async () => {
  assert.equal((await yhm('/auth/register', { body: { username: 'ya', password: '123456' } })).status, 400);
  assert.equal((await yhm('/auth/register', { body: { username: 'YHM', password: '123' } })).status, 400);
  const r = await yhm('/auth/register', { body: { username: 'YHM', password: 'karasuno10' } });
  assert.equal(r.status, 201);
  assert.equal(r.data.user.color, null, 'el color lo da el test');
  assert.equal(r.data.user.quizDone, false, 'y aún tiene pendiente el test');
  assert.equal((await marta('/auth/register', { body: { username: 'yhm', password: 'whatever1' } })).status, 409);
  const m = await marta('/auth/register', { body: { username: 'Martita', password: 'nekoma05' } });
  assert.equal(m.data.user.color, null);
  assert.equal((await otro('/auth/register', { body: { username: 'otro', password: 'otro123' } })).status, 201);
  await yhm('/auth/logout', { method: 'POST' });
  assert.equal((await yhm('/me')).data.user, null);
  assert.equal((await yhm('/lists')).status, 401);
  assert.equal((await yhm('/auth/login', { body: { username: 'yhm', password: 'mal' } })).status, 401);
  assert.equal((await yhm('/auth/login', { body: { username: 'yhm', password: 'karasuno10' } })).status, 200);
});

test('«Recordar usuario»: cookie de un año o solo de sesión', async () => {
  const login = (remember) => fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'otro', password: 'otro123', remember }) }).then((r) => r.headers.get('set-cookie'));
  assert.match(await login(true), /Max-Age=31536000/);
  assert.doesNotMatch(await login(false), /Max-Age/);
});

test('test de personalidad y color (cualquiera puede coger cualquier color)', async () => {
  assert.equal((await marta('/me', { method: 'PATCH', body: { color: '#8bc34a' } })).data.user.color, '#8bc34a');
  assert.equal((await marta('/me', { method: 'PATCH', body: { color: '#123456' } })).status, 400);
  assert.equal((await marta('/me', { method: 'PATCH', body: { quizResult: 'nadie' } })).status, 400);
  const r = await marta('/me', { method: 'PATCH', body: { quizResult: 'rosa', color: '#ff6fb5', avatar: 'anya' } });
  assert.deepEqual([r.data.user.quizDone, r.data.user.quizResult, r.data.user.color, r.data.user.avatar], [true, 'rosa', '#ff6fb5', 'anya']);
  assert.equal((await marta('/me')).data.user.color, '#ff6fb5');
  // YHM hace el test y se queda con su verde
  assert.equal((await yhm('/me', { method: 'PATCH', body: { quizResult: 'hinata', color: '#8bc34a' } })).status, 200);
});

let listId, ids;
test('plantilla: columna de YHM enlazada y columna «Marta» libre', async () => {
  const r = await yhm('/lists', { body: { name: 'Animes para ver juntos', template: 'my' } });
  assert.equal(r.status, 201);
  listId = r.data.id;
  const { data } = await yhm('/lists/' + listId);
  assert.equal(data.entries.length, 9);
  const [m, y] = data.people;
  assert.deepEqual([m.name, m.user_id], ['Marta', null]);
  assert.equal(y.name, 'YHM', 'la columna «Yago» muestra el usuario');
  assert.equal(y.color, '#8bc34a');
  const kny = data.entries.find((e) => e.title === 'Kimetsu no Yaiba');
  assert.deepEqual(kny.marks[m.id], { seen: true, rating: 9 });
  assert.deepEqual(kny.marks[y.id], { seen: true, rating: 10 });
  ids = { m: m.id, y: y.id, kny: kny.id };
  // YHM no puede tocar la columna de Marta
  assert.equal((await yhm(`/entries/${kny.id}/marks/${m.id}`, { method: 'PUT', body: { rating: 1 } })).status, 403);
  assert.equal((await yhm(`/entries/${kny.id}/marks/${y.id}`, { method: 'PUT', body: { rating: '9,5' } })).data.rating, 9.5);
});

test('añadir, editar y borrar un anime; orden de pendientes', async () => {
  const r = await yhm(`/lists/${listId}/entries`, { body: { title: 'Frieren', duration: '28 cap', platform: 'Crunchyroll', language: 'Español' } });
  assert.equal(r.status, 201);
  assert.equal((await yhm(`/entries/${r.data.id}`, { method: 'PATCH', body: { title: 'Sousou no Frieren' } })).status, 200);
  assert.equal((await yhm('/lists/' + listId)).data.entries.at(-1).title, 'Sousou no Frieren');
  const v1 = (await yhm(`/lists/${listId}/version`)).data.updated_at;
  assert.equal((await yhm(`/lists/${listId}/pending-order`, { method: 'PUT', body: { ids: [r.data.id, ids.kny] } })).status, 200);
  assert.deepEqual((await yhm('/lists/' + listId)).data.pendingOrder, [r.data.id, ids.kny]);
  assert.ok((await yhm(`/lists/${listId}/version`)).data.updated_at >= v1, 'reordenar avisa a los demás');
  assert.equal((await marta(`/lists/${listId}/version`)).status, 404, 'solo los miembros consultan la versión');
  assert.equal((await yhm(`/entries/${r.data.id}`, { method: 'DELETE' })).status, 200);
  assert.equal((await yhm('/lists/' + listId)).data.entries.length, 9);
});

test('amigos: solicitud, rechazo, aceptación', async () => {
  const found = await yhm('/users/search?q=mar');
  assert.deepEqual(found.data.users.map((u) => u.username), ['Martita']);
  assert.equal((await yhm('/friends/request', { body: { username: 'yhm' } })).status, 400);
  assert.equal((await yhm('/friends/request', { body: { username: 'nadie' } })).status, 404);

  assert.equal((await otro('/friends/request', { body: { username: 'yhm' } })).status, 201);
  let f = (await yhm('/friends')).data;
  await yhm(`/friends/requests/${f.incoming[0].requestId}/reject`, { method: 'POST' });
  assert.equal((await yhm('/friends')).data.incoming.length, 0);

  assert.equal((await yhm('/friends/request', { body: { username: 'martita' } })).status, 201);
  assert.equal((await yhm('/friends/request', { body: { username: 'martita' } })).status, 409);
  assert.equal((await marta('/me')).data.stats.requests, 1);
  f = (await marta('/friends')).data;
  assert.equal((await otro(`/friends/requests/${f.incoming[0].requestId}/accept`, { method: 'POST' })).status, 400);
  await marta(`/friends/requests/${f.incoming[0].requestId}/accept`, { method: 'POST' });
  assert.deepEqual((await yhm('/friends')).data.friends.map((x) => x.username), ['Martita']);
});

test('compartir: invitación que Martita acepta y ocupa la columna «Marta»', async () => {
  const martaId = (await yhm('/friends')).data.friends[0].id;
  const otroId = (await yhm('/users/search?q=otro')).data.users[0].id;
  assert.equal((await yhm(`/lists/${listId}/share`, { body: { userId: otroId } })).status, 400, 'solo amigos');
  assert.equal((await yhm(`/lists/${listId}/share`, { body: { userId: martaId, personId: ids.m } })).status, 201);
  assert.equal((await marta('/lists/' + listId)).status, 404, 'aún no la ha aceptado');
  assert.equal((await yhm('/lists/' + listId)).data.invites.length, 1);

  const f = (await marta('/friends')).data;
  assert.equal(f.invites.length, 1);
  assert.equal(f.invites[0].listName, 'Animes para ver juntos');
  assert.equal(f.invites[0].fromName, 'YHM');
  assert.equal((await marta('/me')).data.stats.requests, 1);
  assert.equal((await otro(`/invites/${f.invites[0].inviteId}/accept`, { method: 'POST' })).status, 404);
  assert.equal((await marta(`/invites/${f.invites[0].inviteId}/accept`, { method: 'POST' })).status, 200);

  const { data } = await marta('/lists/' + listId);
  assert.equal(data.list.role, 'editor');
  assert.equal(data.people.length, 2, 'no se duplica la columna');
  const mine = data.people.find((p) => p.id === ids.m);
  assert.deepEqual([mine.name, mine.color, mine.user_id], ['Martita', '#ff6fb5', martaId]);
  // Conserva las notas antiguas de Marta y ahora puede cambiarlas ella, pero no las de YHM
  assert.equal(data.entries.find((e) => e.id === ids.kny).marks[ids.m].rating, 9);
  // El orden de «Pendientes» es el mismo para los dos
  assert.deepEqual(data.pendingOrder, (await yhm('/lists/' + listId)).data.pendingOrder);
  await marta(`/lists/${listId}/pending-order`, { method: 'PUT', body: { ids: [ids.kny] } });
  assert.deepEqual((await yhm('/lists/' + listId)).data.pendingOrder, [ids.kny]);
  assert.equal((await marta(`/entries/${ids.kny}/marks/${ids.m}`, { method: 'PUT', body: { rating: 9.75 } })).status, 200);
  assert.equal((await marta(`/entries/${ids.kny}/marks/${ids.y}`, { method: 'PUT', body: { rating: 1 } })).status, 403);
  // Los invitados no comparten ni borran para todos
  assert.equal((await marta(`/lists/${listId}/share`, { body: { userId: otroId } })).status, 403);
  assert.equal((await otro(`/entries/${ids.kny}`, { method: 'DELETE' })).status, 404);
});

test('foto de perfil: se guarda y la ven los amigos', async () => {
  assert.equal((await yhm('/me', { method: 'PATCH', body: { avatar: 'no-existe' } })).status, 400);
  assert.equal((await yhm('/me', { method: 'PATCH', body: { avatar: 'tanjiro' } })).data.user.avatar, 'tanjiro');
  assert.equal((await yhm('/me')).data.user.avatar, 'tanjiro');
  assert.equal((await yhm('/me')).data.user.color, '#8bc34a', 'cambiar la foto no toca el color');
  assert.equal((await marta('/friends')).data.friends[0].avatar, 'tanjiro');
  assert.equal((await marta('/users/search?q=yh')).data.users[0].avatar, 'tanjiro');
  const people = (await marta('/lists/' + listId)).data.people;
  assert.equal(people.find((p) => p.name === 'YHM').avatar, 'tanjiro');
  assert.ok((await yhm('/avatars')).data.avatars.length >= 60);
});

test('ver las tablas de un amigo (solo mirar) y llevarte un anime a la tuya', async () => {
  const yhmId = (await marta('/friends')).data.friends[0].id;
  const otroId = (await yhm('/users/search?q=otro')).data.users[0].id;
  // Martita crea una tabla propia y YHM la mira
  const { id: suya } = (await marta('/lists', { body: { name: 'Lo de Marta' } })).data;
  await marta(`/lists/${suya}/entries`, { body: { title: 'Frieren', jw_id: 'ts330489', kind: 'show', duration: '28 cap', platform: 'Crunchyroll', language: 'Español' } });
  const martaId = (await yhm('/friends')).data.friends[0].id;
  const prof = (await yhm(`/friends/${martaId}/profile`)).data;
  assert.equal(prof.user.username, 'Martita');
  assert.ok(prof.lists.some((l) => l.name === 'Lo de Marta' && !l.mine));
  const view = (await yhm(`/friends/${martaId}/lists/${suya}`)).data;
  assert.equal(view.list.role, 'viewer');
  assert.equal(view.entries[0].title, 'Frieren');
  // Mirar no da permiso para cambiar nada
  const e = view.entries[0], col = view.people[0];
  assert.equal((await yhm(`/entries/${e.id}/marks/${col.id}`, { method: 'PUT', body: { rating: 1 } })).status, 404);
  assert.equal((await yhm(`/entries/${e.id}`, { method: 'PATCH', body: { title: 'x' } })).status, 404);
  assert.equal((await yhm(`/lists/${suya}/entries`, { body: { title: 'x' } })).status, 404);
  assert.equal((await yhm(`/lists/${suya}/pending-order`, { method: 'PUT', body: { ids: [] } })).status, 404);
  // Solo amigos
  assert.equal((await otro(`/friends/${martaId}/profile`)).status, 404);
  assert.equal((await otro(`/friends/${yhmId}/lists/${listId}`)).status, 404);
  // «Añadir a mi lista»: es un anime nuevo en la tabla de YHM, sin las notas de Martita
  const before = (await yhm('/lists/' + listId)).data.entries.length;
  const { title, jw_id, poster, kind, duration, platform, language, availability } = e;
  assert.equal((await yhm(`/lists/${listId}/entries`, { body: { title, jw_id, poster, kind, duration, platform, language, availability } })).status, 201);
  const after = (await yhm('/lists/' + listId)).data.entries;
  assert.equal(after.length, before + 1);
  assert.deepEqual(after.at(-1).marks, {});
});

test('«Añadir a otra lista» copia tu check y tu nota (y luego van por separado)', async () => {
  const { id: vistos } = (await yhm('/lists', { body: { name: 'Todo lo que he visto' } })).data;
  const src = (await yhm('/lists/' + listId)).data;
  const kny = src.entries.find((e) => e.id === ids.kny);
  const mine = kny.marks[ids.y];
  const r = await yhm(`/lists/${vistos}/entries`, { body: { title: kny.title, jw_id: kny.jw_id, kind: kny.kind, myMark: mine } });
  const dst = (await yhm('/lists/' + vistos)).data;
  const myCol = dst.people.find((p) => p.name === 'YHM');
  assert.deepEqual(dst.entries[0].marks[myCol.id], { seen: true, rating: mine.rating });
  await yhm(`/entries/${r.data.id}/marks/${myCol.id}`, { method: 'PUT', body: { rating: 3 } });
  assert.equal((await yhm('/lists/' + listId)).data.entries.find((e) => e.id === ids.kny).marks[ids.y].rating, mine.rating);
  await yhm('/lists/' + vistos, { method: 'DELETE' });
});

test('desempate del podio: cada uno guarda el suyo', async () => {
  assert.equal((await yhm(`/lists/${listId}/podium-picks`, { method: 'PUT', body: { picks: { [`${ids.y}:show`]: [5, 3], 'malo': [1] } } })).status, 200);
  assert.deepEqual((await yhm('/lists/' + listId)).data.podiumPicks, { [`${ids.y}:show`]: [5, 3] });
  assert.deepEqual((await marta('/lists/' + listId)).data.podiumPicks, {});
  assert.equal((await otro(`/lists/${listId}/podium-picks`, { method: 'PUT', body: { picks: {} } })).status, 404);
});

test('salir de la tabla deja la columna libre con su nombre', async () => {
  assert.equal((await marta('/lists/' + listId, { method: 'DELETE' })).data.left, true);
  assert.equal((await marta('/lists/' + listId)).status, 404);
  const p = (await yhm('/lists/' + listId)).data.people.find((x) => x.id === ids.m);
  assert.deepEqual([p.name, p.user_id], ['Martita', null]);
});

test('borrar tabla (dueño)', async () => {
  assert.equal((await yhm('/lists/' + listId, { method: 'DELETE' })).data.deleted, true);
  assert.equal((await yhm('/lists')).data.lists.length, 0);
});

test('búsqueda en el catálogo local tolera erratas', async () => {
  const { searchCatalog } = await import('../server/catalog.js');
  assert.equal(searchCatalog('tokyo goul')[0].title, 'Tokyo Ghoul');
  assert.equal(searchCatalog('black cover')[0].title, 'Black Clover');
  assert.match(searchCatalog('kimetsu no yaiba')[0].title, /Kimetsu/);
  assert.match(searchCatalog('haikyu')[0].title, /Haikyu/);
});

// ───────────── Quiz tipo Kahoot ─────────────
// AniList simulado: así los tests no dependen de internet
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (!String(url).includes('anilist.co')) return realFetch(url, opts);
  const query = JSON.parse(opts.body).query;
  const aliases = [...query.matchAll(/\b(a\d+): Page/g)].map((m) => m[1]);
  const data = Object.fromEntries(aliases.map((a, k) => [a, { media: [{
    title: { romaji: `Romaji ${k}`, english: null }, format: 'TV', startDate: { year: 2015 + k }, episodes: 24,
    bannerImage: `https://s4.anilist.co/banner/${k}.jpg`, coverImage: { large: null },
    studios: { nodes: [{ name: 'MAPPA' }] },
    characters: { edges: Array.from({ length: 6 }, (_, c) => ({ role: c < 3 ? 'MAIN' : 'SUPPORTING',
      node: { name: { full: `Personaje ${k}-${c}` }, image: { large: `https://s4.anilist.co/char/${k}-${c}.jpg` } } })) },
  }] }]));
  return new Response(JSON.stringify({ data }), { headers: { 'content-type': 'application/json' } });
};

test('quiz: sin animes vistos no se puede jugar', async () => {
  const r = await otro('/trivia');
  assert.equal(r.data.seen, 0);
  assert.equal((await otro('/trivia', { method: 'POST' })).status, 400);
});

test('quiz: 10 preguntas de tus vistos, respuestas en orden y ranking', async () => {
  await yhm('/lists', { body: { name: 'Para el quiz', template: 'my' } });
  const info = (await yhm('/trivia')).data;
  assert.ok(info.seen >= 3, 'cuenta los animes con tu check');
  assert.equal(info.ai, false);
  assert.deepEqual(info.best, []);
  const g = await yhm('/trivia', { method: 'POST' });
  assert.equal(g.status, 201);
  assert.equal(g.data.questions.length, 10);
  for (const q of g.data.questions) {
    assert.equal(q.options.length, 4);
    assert.equal('correct' in q, false, 'el móvil no recibe la respuesta antes de contestar');
  }
  const id = g.data.id;
  assert.equal((await yhm(`/trivia/${id}/answer`, { body: { q: 3, choice: 0, ms: 1000 } })).status, 409, 'hay que ir en orden');
  assert.equal((await marta(`/trivia/${id}/answer`, { body: { q: 0, choice: 0, ms: 1000 } })).status, 404, 'cada uno juega la suya');
  let last, rights = 0;
  for (let i = 0; i < 10; i++) {
    last = (await yhm(`/trivia/${id}/answer`, { body: { q: i, choice: i === 9 ? null : 0, ms: 1500 } })).data;
    assert.ok(last.correct >= 0 && last.correct < 4);
    if (last.right) rights++;
    assert.equal(last.done, i === 9);
  }
  assert.equal(last.right, false, 'sin responder es fallo');
  assert.equal(last.score, rights);
  assert.equal(last.total_ms, 9 * 1500 + 20000);
  assert.equal(last.rank, 1);
  assert.equal(last.played, 1);
  assert.equal((await yhm(`/trivia/${id}/answer`, { body: { q: 9, choice: 0 } })).status, 409);
  const after = (await yhm('/trivia')).data;
  assert.equal(after.best.length, 1);
  assert.equal(after.best[0].score, rights);
  assert.ok(after.best[0].finished_at > 0);
  // Una partida a medias no cuenta
  await yhm('/trivia', { method: 'POST' });
  assert.equal((await yhm('/trivia')).data.played, 1);
});

test('quiz: preguntas de la IA (Claude simulado) con foto del personaje', async () => {
  const http = await import('node:http');
  let sent = null;
  const fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      sent = JSON.parse(body);
      const blocks = [...sent.messages[0].content.matchAll(/^### (.+)$[\s\S]*?Personajes \(para el campo image\): ([^,\n]+)/gm)]
        .map((m) => ({ title: m[1], who: m[2] }));
      const questions = Array.from({ length: 10 }, (_, i) => {
        const b = blocks[i % blocks.length];
        return { anime: b.title, question: `¿Qué hace ${b.who} en la escena ${i}?`,
          options: ['Corre', 'Salta', 'Llora', 'Grita'], correct: 2, image: b.who, fact: 'Porque sí.' };
      });
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: sent.model, stop_reason: 'end_turn',
        content: [{ type: 'text', text: JSON.stringify({ questions }) }], usage: { input_tokens: 1, output_tokens: 1 } }));
    });
  }).listen(0);
  process.env.ANTHROPIC_API_KEY = 'test';
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${fake.address().port}`;
  try {
    assert.equal((await yhm('/trivia')).data.ai, true);
    const g = await yhm('/trivia', { method: 'POST' });
    assert.equal(g.data.source, 'ai');
    assert.equal(sent.model, 'claude-opus-5-5');
    assert.equal(sent.output_config.format.type, 'json_schema');
    assert.match(sent.system, /español de España/);
    const q = g.data.questions[0];
    assert.match(q.image, /anilist\.co\/char\//, 'foto del personaje que sale en la pregunta');
    const r = (await yhm(`/trivia/${g.data.id}/answer`, { body: { q: 0, choice: 0, ms: 500 } })).data;
    assert.equal(q.options[r.correct], 'Llora', 'las opciones se mezclan pero la buena se conserva');
    assert.equal(r.fact, 'Porque sí.');
  } finally {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_BASE_URL;
    fake.close();
  }
});

test('quiz: si la IA falla, se juega igual con preguntas de AniList', async () => {
  process.env.ANTHROPIC_API_KEY = 'test';
  process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9'; // nadie escucha
  try {
    const g = await yhm('/trivia', { method: 'POST' });
    assert.equal(g.status, 201);
    assert.equal(g.data.source, 'local');
    assert.equal(g.data.questions.length, 10);
  } finally {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_BASE_URL;
  }
});

test('quiz: datos de los personajes (solo lo que es seguro y sin spoilers)', async () => {
  const { characterFacts } = await import('../server/trivia-shared.js');
  const keys = (d) => characterFacts(d).map((f) => `${f.key}:${f.value}${f.team ? '@' + f.team : ''}`);
  assert.deepEqual(keys('__Height:__ 179cm\n\nDemon Hunter and the Wind Pillar of the Demon Killing Corps. He is the older brother of [Genya](https://anilist.co/character/1).'),
    ['pillar:el Pilar del Viento']);
  assert.deepEqual(keys('Genya is a Demon Hunter. He is also the younger brother of the Wind Pillar [Sanemi](https://anilist.co/character/2).'), [], 'el hermano no es el Pilar');
  assert.deepEqual(keys('Retired member of the Demon Slayer Corps, previously holding the title of Water Hashira.'), [], 'antiguo Pilar: no cuenta');
  assert.deepEqual(keys('__Height:__ 176 cm\n__Combat Style:__ Water Breathing\n\nWater pillar in the Demon Killing Corps.'),
    ['breathing:Respiración del Agua', 'pillar:el Pilar del Agua']);
  assert.deepEqual(keys('__Combat Style:__ Water Breathing & ~!Sun Breathing!~\n\nTanjirou is kind.'), [], 'dos respiraciones: se salta');
  assert.deepEqual(keys('__Height:__ 169.2 cm\n\nThe setter of the Nekoma High School volleyball club.'), ['role:colocador@Nekoma']);
  assert.deepEqual(keys("Even though he isn't Karasuno's official setter anymore"), [], 'Sugawara no es el colocador titular');
  assert.deepEqual(keys('__Team:__ Karasuno High\n__Position:__ Libero'), ['position:líbero@Karasuno', 'role:líbero@Karasuno']);
  assert.deepEqual(keys('~!Rui was a member of the Twelve Demon Moons, having held the position of Lower Moon Five.!~'), [], 'lo marcado como spoiler se ignora');
  assert.deepEqual(keys('__Devil Fruit:__ Gomu Gomu no Mi (Rubber-Rubber Fruit)\n__Position:__ Navigator'), ['fruit:Gomu Gomu no Mi', 'crew:Navegante']);
  assert.deepEqual(keys('__Quirk:__ Half-Cold Half-Hot'), ['quirk:Medio frío, medio caliente']);
  assert.deepEqual(keys('__Rank:__ Captain of the 10th Division'), ['division:el capitán de la 10.ª División']);
});

test('quiz: banco de preguntas de la trama (formato y que cada anime se encuentre)', async () => {
  const { TRIVIA_BANK } = await import('../server/trivia-bank.js');
  const { bankFor, validQuestion } = await import('../server/trivia-shared.js');
  const { getById } = await import('../server/catalog.js');
  for (const b of TRIVIA_BANK) {
    assert.ok(b.questions.length >= 4, b.names[0]);
    for (const q of b.questions) assert.ok(validQuestion({ question: q.q, options: [q.a, ...q.w], correct: 0 }), q.q);
  }
  // Por id del catálogo, por título, y sin mezclar la serie con sus películas
  assert.match(bankFor({ title: 'Lo que sea', jw_id: 'ts87466' }, TRIVIA_BANK)[0].q, /Nezuko/);
  assert.ok(bankFor({ title: 'BLUELOCK' }, TRIVIA_BANK).length > 0);
  assert.equal(bankFor({ title: 'Kimetsu no Yaiba: Infinity Castle', jw_id: 'tm1572695' }, TRIVIA_BANK).some((q) => /Nezuko al principio/.test(q.q)), false);
  assert.equal(bankFor({ title: 'Naruto' }, TRIVIA_BANK).some((q) => /Jiraiya\?$/.test(q.q)), false, 'Naruto no trae preguntas de Shippuden');
  assert.deepEqual(bankFor({ title: 'Un anime que no está' }, TRIVIA_BANK), []);
  for (const b of TRIVIA_BANK) for (const id of b.ids) assert.ok(getById(id) || id === 'ts359486', `${id} está en el catálogo`);
});
