// Entrada para Vercel: toda la app (API + web) corre como una única función.
import { app, ready } from '../server/index.js';

export default async function handler(req, res) {
  await ready();
  return app(req, res);
}
