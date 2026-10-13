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

const yago = client();
const marta = client();
const otro = client();

test('registro, login y validaciones', async () => {
  assert.equal((await yago('/auth/register', { body: { username: 'ya', password: '123456' } })).status, 400);
  assert.equal((await yago('/auth/register', { body: { username: 'yago', password: '123' } })).status, 400);
  assert.equal((await yago('/auth/register', { body: { username: 'yago', password: 'karasuno10' } })).status, 201);
  assert.equal((await marta('/auth/register', { body: { username: 'YAGO', password: 'whatever1' } })).status, 409);
  assert.equal((await marta('/auth/register', { body: { username: 'marta', password: 'nekoma05' } })).status, 201);
  assert.equal((await otro('/auth/register', { body: { username: 'otro', password: 'otro123' } })).status, 201);
  assert.equal((await yago('/me')).data.user.username, 'yago');
  await yago('/auth/logout', { method: 'POST' });
  assert.equal((await yago('/me')).data.user, null);
  assert.equal((await yago('/lists')).status, 401);
  assert.equal((await yago('/auth/login', { body: { username: 'yago', password: 'mal' } })).status, 401);
  assert.equal((await yago('/auth/login', { body: { username: 'Yago', password: 'karasuno10' } })).status, 200);
});

let listId;
test('crear tabla con la plantilla M&Y', async () => {
  const r = await yago('/lists', { body: { name: 'ANIME LIST: M&Y', template: 'my' } });
  assert.equal(r.status, 201);
  listId = r.data.id;
  const { data } = await yago('/lists/' + listId);
  assert.equal(data.entries.length, 32);
  assert.deepEqual(data.people.map((p) => p.name), ['Marta', 'Yago']);
  const kny = data.entries.find((e) => e.title === 'Kimetsu No Yaiba');
  assert.equal(kny.together, true);
  const [m, y] = data.people;
  assert.deepEqual(kny.marks[m.id], { seen: true, rating: 9 });
  assert.deepEqual(kny.marks[y.id], { seen: true, rating: 10 });
  assert.ok(kny.availability.length > 0, 'enlazado al catálogo con plataformas');
});

test('añadir, puntuar, editar y borrar un anime', async () => {
  const r = await yago(`/lists/${listId}/entries`, { body: { title: 'Frieren', duration: '28 cap', platform: 'Crunchyroll', language: 'Español', together: true } });
  assert.equal(r.status, 201);
  const { data } = await yago('/lists/' + listId);
  const yagoCol = data.people.find((p) => p.name === 'Yago');
  assert.equal((await yago(`/entries/${r.data.id}/marks/${yagoCol.id}`, { method: 'PUT', body: { rating: '9,5' } })).data.rating, 9.5);
  assert.equal((await yago(`/entries/${r.data.id}/marks/${yagoCol.id}`, { method: 'PUT', body: { rating: 11 } })).status, 400);
  assert.equal((await yago(`/entries/${r.data.id}`, { method: 'PATCH', body: { title: 'Sousou no Frieren' } })).status, 200);
  const after = (await yago('/lists/' + listId)).data.entries.at(-1);
  assert.equal(after.title, 'Sousou no Frieren');
  assert.equal(after.marks[yagoCol.id].rating, 9.5);
  assert.equal((await yago(`/entries/${r.data.id}`, { method: 'DELETE' })).status, 200);
  assert.equal((await yago('/lists/' + listId)).data.entries.length, 32);
});

test('amigos: solicitud, rechazo, aceptación', async () => {
  const found = await yago('/users/search?q=mar');
  assert.deepEqual(found.data.users.map((u) => u.username), ['marta']);
  assert.equal((await yago('/friends/request', { body: { username: 'yago' } })).status, 400);
  assert.equal((await yago('/friends/request', { body: { username: 'nadie' } })).status, 404);

  assert.equal((await otro('/friends/request', { body: { username: 'yago' } })).status, 201);
  let f = (await yago('/friends')).data;
  assert.equal(f.incoming.length, 1);
  await yago(`/friends/requests/${f.incoming[0].requestId}/reject`, { method: 'POST' });
  assert.equal((await yago('/friends')).data.incoming.length, 0);

  assert.equal((await yago('/friends/request', { body: { username: 'marta' } })).status, 201);
  assert.equal((await yago('/friends/request', { body: { username: 'marta' } })).status, 409);
  assert.equal((await yago('/me')).data.stats.requests, 0);
  assert.equal((await marta('/me')).data.stats.requests, 1);
  f = (await marta('/friends')).data;
  assert.equal(f.incoming[0].username, 'yago');
  // Solo el destinatario puede aceptar
  assert.equal((await otro(`/friends/requests/${f.incoming[0].requestId}/accept`, { method: 'POST' })).status, 400);
  await marta(`/friends/requests/${f.incoming[0].requestId}/accept`, { method: 'POST' });
  assert.deepEqual((await yago('/friends')).data.friends.map((x) => x.username), ['marta']);
});

test('compartir tabla: solo con amigos, y el invitado puede editar', async () => {
  const martaId = (await yago('/friends')).data.friends[0].id;
  const otroId = (await yago('/users/search?q=otro')).data.users[0].id;
  assert.equal((await marta('/lists/' + listId)).status, 404);
  assert.equal((await yago(`/lists/${listId}/share`, { body: { userId: otroId } })).status, 400);
  assert.equal((await yago(`/lists/${listId}/share`, { body: { userId: martaId } })).status, 200);

  const { data } = await marta('/lists/' + listId);
  assert.equal(data.list.role, 'editor');
  // Ya había columna "Marta" (nombre distinto en mayúsculas no importa): no se duplica
  assert.equal(data.people.length, 2);
  const m = data.people.find((p) => p.name === 'Marta');
  const e = data.entries.find((x) => x.title === 'Dan Da Dan');
  assert.equal((await marta(`/entries/${e.id}/marks/${m.id}`, { method: 'PUT', body: { seen: true, rating: 8 } })).status, 200);
  const seenByYago = (await yago('/lists/' + listId)).data.entries.find((x) => x.id === e.id).marks[m.id];
  assert.deepEqual(seenByYago, { seen: true, rating: 8 });

  // Invitada no puede compartir ni borrar para todos; "borrar" = salir
  assert.equal((await marta(`/lists/${listId}/share`, { body: { userId: otroId } })).status, 403);
  assert.equal((await marta('/lists/' + listId, { method: 'DELETE' })).data.left, true);
  assert.equal((await marta('/lists/' + listId)).status, 404);
  assert.equal((await yago('/lists/' + listId)).status, 200);
  // Otro usuario no puede tocar entradas ajenas
  assert.equal((await otro(`/entries/${e.id}`, { method: 'DELETE' })).status, 404);
});

test('borrar tabla (dueño)', async () => {
  assert.equal((await yago('/lists/' + listId, { method: 'DELETE' })).data.deleted, true);
  assert.equal((await yago('/lists')).data.lists.length, 0);
});

test('búsqueda en el catálogo local tolera erratas', async () => {
  const { searchCatalog } = await import('../server/catalog.js');
  assert.equal(searchCatalog('tokyo goul')[0].title, 'Tokyo Ghoul');
  assert.equal(searchCatalog('black cover')[0].title, 'Black Clover');
  assert.match(searchCatalog('kimetsu no yaiba')[0].title, /Kimetsu/);
  assert.match(searchCatalog('haikyu')[0].title, /Haikyu/);
});
