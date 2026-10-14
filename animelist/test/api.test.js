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
  assert.equal(r.data.user.color, '#8bc34a', 'YHM empieza con el verde');
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

test('test de personalidad y color (el verde está reservado para YHM)', async () => {
  assert.equal((await marta('/me', { method: 'PATCH', body: { color: '#8bc34a' } })).status, 403);
  assert.equal((await marta('/me', { method: 'PATCH', body: { color: '#123456' } })).status, 400);
  assert.equal((await marta('/me', { method: 'PATCH', body: { quizResult: 'nadie' } })).status, 400);
  const r = await marta('/me', { method: 'PATCH', body: { quizResult: 'anya', color: '#ff6fb5' } });
  assert.deepEqual([r.data.user.quizDone, r.data.user.quizResult, r.data.user.color], [true, 'anya', '#ff6fb5']);
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
  const kny = data.entries.find((e) => e.title === 'Kimetsu No Yaiba');
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
  assert.equal((await yhm(`/lists/${listId}/pending-order`, { method: 'PUT', body: { ids: [r.data.id, ids.kny] } })).status, 200);
  assert.deepEqual((await yhm('/lists/' + listId)).data.pendingOrder, [r.data.id, ids.kny]);
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
  assert.equal((await marta(`/entries/${ids.kny}/marks/${ids.m}`, { method: 'PUT', body: { rating: 9.75 } })).status, 200);
  assert.equal((await marta(`/entries/${ids.kny}/marks/${ids.y}`, { method: 'PUT', body: { rating: 1 } })).status, 403);
  // Los invitados no comparten ni borran para todos
  assert.equal((await marta(`/lists/${listId}/share`, { body: { userId: otroId } })).status, 403);
  assert.equal((await otro(`/entries/${ids.kny}`, { method: 'DELETE' })).status, 404);
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
