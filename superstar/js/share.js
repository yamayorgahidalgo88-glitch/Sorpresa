// Compartir una canción por privado: se crea un MP3 normal con una etiqueta ID3 que guarda
// qué canción es (id, título, era) y, si la hay, la partitura grabada. Así se puede mandar por
// WhatsApp, Telegram, etc., y el juego de la otra persona la reconoce sola al importarla.
// Nada se sube a la web: el archivo va directamente de un móvil a otro.

const TAG = 'SUPERSTAR';
const enc = new TextEncoder(), dec = new TextDecoder();
const syncsafe = n => [(n >> 21) & 127, (n >> 14) & 127, (n >> 7) & 127, n & 127];
const unsync = b => (b[0] << 21) | (b[1] << 14) | (b[2] << 7) | b[3];

function frame(id, payload) {
  const out = new Uint8Array(10 + payload.length);
  out.set(enc.encode(id), 0); out.set(syncsafe(payload.length), 4);
  out.set(payload, 10);
  return out;
}
function textFrame(id, text) { const t = enc.encode(text); const p = new Uint8Array(1 + t.length); p[0] = 3; p.set(t, 1); return frame(id, p); }
function txxx(desc, value) {
  const d = enc.encode(desc), v = enc.encode(value);
  const p = new Uint8Array(1 + d.length + 1 + v.length); p[0] = 3; p.set(d, 1); p.set(v, 2 + d.length);
  return frame('TXXX', p);
}
// tamaño de la etiqueta ID3v2 que ya traiga el archivo (para quitarla)
function id3Size(b) {
  if (b.length < 10 || b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return 0;
  return 10 + unsync(b.subarray(6, 10)) + (b[5] & 0x10 ? 10 : 0);
}

export function isMp3(name, type) { return /mpeg|mp3/i.test(type || '') || /\.mp3$/i.test(name || ''); }

// audio: ArrayBuffer del MP3 original; info: {song:{id,title,artist,theme}, chart?}
export function buildShareFile(audio, info) {
  const src = new Uint8Array(audio);
  const body = src.subarray(id3Size(src));
  const frames = [textFrame('TIT2', info.song.title), textFrame('TPE1', info.song.artist || 'BTS'), txxx(TAG, JSON.stringify({ v: 1, ...info }))];
  const size = frames.reduce((a, f) => a + f.length, 0);
  const head = new Uint8Array(10); head.set(enc.encode('ID3'), 0); head[3] = 4; head[4] = 0; head[5] = 0; head.set(syncsafe(size), 6);
  const safe = info.song.title.replace(/[\\/:*?"<>|]+/g, '').trim() || 'cancion';
  return new File([head, ...frames, body], `${safe.replace(/\s+/g, '_')}_SUPERSTAR.mp3`, { type: 'audio/mpeg' });
}

// Lee la información SUPERSTAR de un archivo (o null si no la tiene)
export async function readShareInfo(file) {
  try {
    const first = new Uint8Array(await file.slice(0, 10).arrayBuffer());
    const size = id3Size(first);
    if (!size || size > 4e6) return null;
    const b = new Uint8Array(await file.slice(0, size).arrayBuffer());
    const v4 = b[3] === 4;
    let i = 10;
    while (i + 10 <= size) {
      const id = dec.decode(b.subarray(i, i + 4));
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const fs = v4 ? unsync(b.subarray(i + 4, i + 8)) : ((b[i + 4] << 24) | (b[i + 5] << 16) | (b[i + 6] << 8) | b[i + 7]);
      if (id === 'TXXX') {
        const p = b.subarray(i + 10, i + 10 + fs);
        const z = p.indexOf(0, 1);
        if (z > 0 && dec.decode(p.subarray(1, z)) === TAG) return JSON.parse(dec.decode(p.subarray(z + 1)));
      }
      i += 10 + fs;
    }
  } catch {}
  return null;
}

// Guardar el archivo en el móvil (Descargas)
export function saveFile(file) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
