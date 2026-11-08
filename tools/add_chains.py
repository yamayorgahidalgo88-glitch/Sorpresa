#!/usr/bin/env python3
"""
Convierte las notas largas en CADENAS DE MONEDAS que siguen la melodía (como en el juego original):
cuando la voz alarga una sílaba y cambia de tono, la nota larga se vuelve una cadena de monedas
unidas por bandas doradas; cada moneda cae en una corchea del compás y se mueve hacia un lado
cuando el tono sube y hacia el otro cuando baja. Si la voz mantiene el mismo tono, se queda
como nota larga normal. Las cadenas nunca ocupan toda la pista (anchura máxima limitada).

Uso:
  python3 tools/add_chains.py superstar/charts/<id>.json cancion.mp3 [--work carpeta]
También lo usa build_chart.py al final para las canciones nuevas (función chainify).
"""
import argparse, json, os, sys, tempfile
import numpy as np

MAX_SPAN = {4: 2, 7: 3}   # anchura máxima de una cadena en carriles (4 carriles: 2 de 3; 7 carriles: 3 de 6)


def chainify(chart, beats, period, pitch, lanes, min_len=0.6, min_gap=0.25, step=1.0, max_mid=4):
    """chart: dict con 'notes'. pitch(t0, t1) -> semitono medio (o nan). Devuelve nº de cadenas creadas."""
    notes = chart['notes']
    beats = np.asarray(beats, dtype=float)
    grid8 = np.sort(np.concatenate([beats, beats + period / 2]))
    span = MAX_SPAN.get(lanes, max(1, (lanes - 1) // 2))
    made = 0
    for n in notes:
        if 'path' in n or 'end' not in n: continue
        t0, t1 = n['t'], n['end']
        if t1 - t0 < min_len: continue
        p0 = pitch(t0, t0 + 0.12)
        if np.isnan(p0): continue
        cand = [g for g in grid8 if t0 + 0.2 <= g <= t1 - 0.15]
        pts, last_t, last_p = [], t0, p0
        for g in cand:
            if g - last_t < min_gap: continue
            p = pitch(g - 0.04, g + 0.04)
            if np.isnan(p) or abs(p - last_p) < step: continue
            pts.append((float(g), float(p))); last_t, last_p = g, p
            if len(pts) >= max_mid: break
        if not pts: continue                         # tono sostenido: se queda como nota larga
        pe = pitch(t1 - 0.12, t1)
        # carriles: suben o bajan con la melodía, dentro de una ventana de anchura limitada
        start = n['lane']
        # carriles ocupados por otras notas mientras se mantiene la cadena (y su vecino): no se pisan
        busy = {x['lane'] for x in notes if x is not n and t0 < x['t'] < t1 + 0.2}
        ok = lambda a, b: all(not (a - 1 <= l <= b + 1) for l in busy)
        win = None
        for w in range(span, 0, -1):
            opts = [(a, a + w) for a in range(max(0, start - w), min(start, lanes - 1 - w) + 1) if ok(a, a + w)]
            if opts: win = min(opts, key=lambda ab: abs((ab[0] + ab[1]) / 2 - start)); break
        if not win: continue                         # no hay sitio libre: se queda como nota larga
        lo, hi = win
        path = [[float(t0), int(start)]]
        cur, prev_p = start, p0
        seq = pts + ([(float(t1), pe)] if not np.isnan(pe) else [(float(t1), prev_p)])
        for k, (tp, pp) in enumerate(seq):
            d = pp - prev_p
            mv = 0 if abs(d) < step else (2 if abs(d) >= 5 and lanes >= 7 else 1) * (1 if d > 0 else -1)
            nxt = cur + mv
            if nxt > hi or nxt < lo: nxt = cur - mv if lo <= cur - mv <= hi else cur   # rebota dentro de la ventana
            path.append([round(tp, 4), int(nxt)])
            cur, prev_p = nxt, pp
        if len(path) < 3: continue
        n['path'] = path; n['lane2'] = path[-1][1]; n['mel'] = True
        made += 1
    return made


def pitch_tracker(voc, sr):
    import librosa
    hop = 512
    f0, vflag, _ = librosa.pyin(voc, fmin=80, fmax=1000, sr=sr, hop_length=hop)
    ft = librosa.times_like(f0, sr=sr, hop_length=hop)
    midi = librosa.hz_to_midi(np.where(vflag, f0, np.nan))
    def pitch(t0, t1):
        m = (ft >= t0) & (ft <= t1)
        v = midi[m]; v = v[~np.isnan(v)]
        return float(np.median(v)) if len(v) else np.nan
    return pitch


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('chart'); ap.add_argument('mp3'); ap.add_argument('--work', default=None)
    a = ap.parse_args()
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import build_chart as B
    work = a.work or tempfile.mkdtemp()
    os.makedirs(work, exist_ok=True)
    mix = B.decode(a.mp3, B.SR)
    voc, _ = B.separate_vocals(a.mp3, work)
    pitch = pitch_tracker(voc[: len(mix)], B.SR)
    ch = json.load(open(a.chart))
    period = 60 / ch['bpm']
    for diff, c in ch['charts'].items():
        L = c.get('lanes', 4)
        k = chainify(c, ch['beats'], period, pitch, L, min_gap=0.25 if diff != 'hard' else 0.2)
        print(f'{diff}: {k} notas largas convertidas en cadenas que siguen la melodía')
    json.dump(ch, open(a.chart, 'w'), separators=(',', ':'))


if __name__ == '__main__':
    main()
