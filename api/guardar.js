// Saves one answer (dates chosen, recipes swiped, cards picked, tickets redeemed...) in the private Blob store.
// Only her real site saves; the test copy ('pruebas') is ignored.
import {put} from '@vercel/blob';
import {readBody} from './_comun.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  if (host.includes('pruebas') || !host.includes('mi-vida')) return res.status(204).end();
  let b;
  try { b = await readBody(req); } catch { return res.status(400).end(); }
  const casita = Number(b.casita);
  if (!Number.isInteger(casita) || casita < 1 || casita > 24) return res.status(400).end();
  const rec = {
    fecha: new Date().toISOString(),
    casita,
    titulo: String(b.titulo || '').slice(0, 120),
    tipo: String(b.tipo || '').slice(0, 30),
    datos: b.datos && typeof b.datos === 'object' ? b.datos : {},
    dispositivo: String(req.headers['user-agent'] || '').slice(0, 160),
  };
  const body = JSON.stringify(rec);
  if (body.length > 8000) return res.status(413).end();
  await put(`respuestas/${Date.now()}-casita${casita}.json`, body,
    {access: 'private', contentType: 'application/json', addRandomSuffix: true});
  res.status(201).json({ok: true});
}
