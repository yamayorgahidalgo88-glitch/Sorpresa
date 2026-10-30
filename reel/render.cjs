// Uso: node reel/render.cjs [--cuenta @tucuenta] [--fps 30] [--frames-only]
// Renderiza reel/index.html (1080x1920) fotograma a fotograma y lo une con el audio.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('--fps', 30), DUR = 21, ACC = opt('--cuenta', '@tucuenta');
const only = opt('--only', null);              // p.ej. --only 1.5,4,7,10,14,18,20.5 para volcar capturas
const root = path.resolve(__dirname, '..');
const assets = {};
for (let i = 1; i <= 6; i++)
  for (const ext of ['png', 'jpg', 'jpeg', 'webp', 'mp4'])
    { const f = path.join(root, 'assets', `toma${i}.${ext}`); if (fs.existsSync(f) && ext !== 'mp4') { assets[i] = 'file://' + f; break; } }
const out = process.env.REEL_TMP || path.join(__dirname, 'frames');
(async () => {
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })).newPage();
  await page.addInitScript(a => { window.ASSETS = a; }, assets);
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?cuenta=' + encodeURIComponent(ACC));
  const times = only ? only.split(',').map(Number) : Array.from({ length: DUR * FPS }, (_, i) => i / FPS);
  for (const [i, t] of times.entries()) {
    await page.evaluate(t => window.render(t), t);
    await page.screenshot({ path: path.join(out, only ? `t${t}.jpg` : `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
  }
  await b.close();
  if (only) return console.log('capturas en', out);
  const audio = path.join(__dirname, 'audio.wav');
  if (!fs.existsSync(audio)) execFileSync('python3', [path.join(__dirname, 'audio.py'), audio], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-framerate', FPS, '-i', path.join(out, 'f%05d.jpg'), '-i', audio, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(__dirname, 'halloween-reel.mp4')], { stdio: 'inherit' });
  fs.rmSync(out, { recursive: true, force: true });
  console.log('Listo: reel/halloween-reel.mp4');
})();
