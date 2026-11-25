// Shared bits for the answers API (files starting with _ are not routes).
import {createHash} from 'node:crypto';
export const sha256 = s => createHash('sha256').update(s).digest('hex');
export const cookies = req => Object.fromEntries((req.headers.cookie || '').split(/;\s*/).filter(Boolean)
  .map(c => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = []; let size = 0;
  for await (const ch of req) { size += ch.length; if (size > 20000) throw new Error('too big'); chunks.push(ch); }
  const raw = Buffer.concat(chunks).toString('utf8');
  if ((req.headers['content-type'] || '').includes('application/json')) return JSON.parse(raw || '{}');
  return Object.fromEntries(new URLSearchParams(raw));
}
