// Servidor local: sirve la web estática.
// Uso: npm run dev
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, path);
  if (!file.startsWith(ROOT) || /[/\\]\.(git|env)/.test(file)) {
    res.statusCode = 403;
    return res.end('Forbidden');
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('No encontrado');
  }
}).listen(PORT, () => console.log(`Web en http://localhost:${PORT}`));
