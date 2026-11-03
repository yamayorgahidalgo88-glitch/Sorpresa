#!/usr/bin/env python3
"""
Construye partituras "que siguen la voz" para una canción, a partir de su MP3.

Uso:
  python3 tools/build_chart.py cancion.mp3 <song-id> [--out superstar/charts]

Pasos:
  1. Decodifica con ffmpeg (misma línea de tiempo que el navegador).
  2. Separa la voz con Demucs (htdemucs, dos pistas).
  3. Pulsos con librosa sobre la mezcla; sílabas (onsets) y melodía (pYIN) sobre la voz.
  4. Cada sílaba es una nota; el carril sigue la melodía; voz sostenida = nota larga;
     si el tono cambia mientras se sostiene = slide.
  5. Reglas de diseño medidas en partituras HARD originales de la serie:
     ~5,4 pulsaciones/s, pico 6,5 en 1 s, separación mínima 130 ms, se repite botón
     o se salta 2+ botones (casi nunca el de al lado). NORMAL y EASY escalan desde ahí.

Sólo se guardan tiempos y carriles (JSON). El audio nunca se copia al juego.
"""
import argparse, json, os, subprocess, sys, tempfile
import numpy as np
import librosa, soundfile as sf

SR = 22050
HOP = 256

CFG = {
    'easy':   dict(lanes=3, minGap=0.36, peak=2.5, holdMin=0.4, chord=0.0,  breakEvery=4),
    'normal': dict(lanes=4, minGap=0.21, peak=4.0, holdMin=0.28, chord=0.08, breakEvery=2),
    'hard':   dict(lanes=7, minGap=0.13, peak=6.5, holdMin=0.2, chord=0.22, breakEvery=1),
}



# ---- Modelo de movimiento entre botones ----
# Probabilidades agregadas medidas en 152 partituras HARD de la serie (7 posiciones).
# Cuanto más rápido vienen las notas, más se salta de lado y menos se repite botón.
GAP_EDGES = [0.16, 0.26, 0.42]
JUMP_P = [  # salto 0..6 (en posiciones de 7) por rapidez: muy rápido, rápido, medio, lento
    [7.4, 0.9, 53.1, 13.9, 19.5, 1.7, 3.5],
    [9.3, 5.7, 56.1, 8.4, 14.2, 1.6, 4.5],
    [17.9, 10.8, 39.3, 8.2, 14.0, 2.5, 7.3],
    [20.2, 10.7, 28.7, 9.3, 18.6, 2.5, 10.0],
]
SIDE_CHANGE = [0.65, 0.50, 0.42, 0.52]
STAIRS = [0.29, 0.40, 0.33, 0.25]
USE7 = [1, 0.45, 1, 0.7, 1, 0.45, 1]


def next_lane(prev, prev2, last_dir, gap, L, rng, pref_dir=0):
    b = sum(gap >= e for e in GAP_EDGES)
    p = np.array(JUMP_P[b]); p = p / p.sum()
    for _ in range(12):
        k = int(rng.choice(7, p=p))
        x = k * (L - 1) / 6
        j = int(np.floor(x)) + (rng.random() < x - np.floor(x))
        if k > 0: j = max(1, j)
        if j == 0 and (prev == prev2 or L <= 3 and rng.random() < 0.5): continue   # nunca 3 seguidas en el mismo botón
        if j == 0: return prev, last_dir
        c = (L - 1) / 2
        opts = [d for d in (1, -1) if 0 <= prev + d * j < L]
        if not opts: continue
        if len(opts) == 2:
            if pref_dir and rng.random() < 0.5:
                d = pref_dir                                   # sigue la melodía (sube = derecha)
            elif rng.random() < SIDE_CHANGE[b]:
                d = 1 if prev < c else -1 if prev > c else (1 if rng.random() < 0.5 else -1)
            else:
                d = last_dir if (last_dir and rng.random() < STAIRS[b]) else -last_dir if last_dir else (1 if rng.random() < 0.5 else -1)
            if d not in opts: d = opts[0]
        else:
            d = opts[0]
        new = prev + d * j
        if L == 7 and rng.random() > USE7[new]: continue
        return new, d
    return (prev + (2 if prev < (L - 1) / 2 else -2)) % L if L > 3 else (prev + 1) % L, last_dir


def decode(path, sr, mono=True):
    tmp = tempfile.mktemp(suffix='.wav')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', path, '-ar', str(sr), '-ac', '1' if mono else '2', tmp], check=True)
    y, _ = sf.read(tmp, dtype='float32')
    os.remove(tmp)
    return y


def separate_vocals(path, workdir):
    full = os.path.join(workdir, 'full.wav')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', path, '-ar', '44100', '-ac', '2', full], check=True)
    out = os.path.join(workdir, 'htdemucs', 'full', 'vocals.wav')
    if not os.path.exists(out):
        subprocess.run([sys.executable, '-m', 'demucs', '--two-stems=vocals', '-n', 'htdemucs', '-o', workdir, full], check=True)
    v, sr = sf.read(out, dtype='float32')
    v = v.mean(axis=1) if v.ndim > 1 else v
    return librosa.resample(v, orig_sr=sr, target_sr=SR)


def nearest(arr, x):
    i = np.searchsorted(arr, x)
    c = [arr[j] for j in (i - 1, i) if 0 <= j < len(arr)]
    return min(c, key=lambda a: abs(a - x)) if c else x


def build(mp3, song_id, workdir):
    mix = decode(mp3, SR)
    dur = len(mix) / SR
    voc = separate_vocals(mp3, workdir)[: len(mix)]

    # ---- pulsos (mezcla) ----
    tempo, beats = librosa.beat.beat_track(y=mix, sr=SR, hop_length=HOP, units='time', tightness=200)
    beats = np.asarray(beats, dtype=float)
    period = float(np.median(np.diff(beats)))
    # tempo cómodo (70-140): si va al doble, nos quedamos con uno de cada dos pulsos (el más fuerte)
    if 60 / period > 140:
        oe0 = librosa.onset.onset_strength(y=mix, sr=SR, hop_length=HOP); t0_ = librosa.times_like(oe0, sr=SR, hop_length=HOP)
        a, b = beats[0::2], beats[1::2]
        beats = a if np.interp(a, t0_, oe0).mean() >= np.interp(b, t0_, oe0).mean() else b
        period = float(np.median(np.diff(beats)))
    # ¿pulso en los contratiempos? compara fuerza de golpe en el pulso y a medio pulso
    oe_mix = librosa.onset.onset_strength(y=mix, sr=SR, hop_length=HOP)
    tt = librosa.times_like(oe_mix, sr=SR, hop_length=HOP)
    on_b = np.interp(beats, tt, oe_mix).mean(); off_b = np.interp(beats + period / 2, tt, oe_mix).mean()
    if off_b > on_b * 1.15:
        beats = beats + period / 2
    grid16 = np.sort(np.concatenate([beats + k * period / 4 for k in range(4)]))
    grid8 = np.sort(np.concatenate([beats, beats + period / 2]))

    # ---- voz: actividad, sílabas, melodía ----
    rms = librosa.feature.rms(y=voc, hop_length=HOP)[0]
    rt = librosa.times_like(rms, sr=SR, hop_length=HOP)
    db = librosa.amplitude_to_db(rms + 1e-9, ref=np.max)
    active = db > -32
    oe = librosa.onset.onset_strength(y=voc, sr=SR, hop_length=HOP, aggregate=np.median)
    on_f = librosa.onset.onset_detect(onset_envelope=oe, sr=SR, hop_length=HOP, backtrack=False, delta=0.04, wait=3)
    ons = librosa.frames_to_time(on_f, sr=SR, hop_length=HOP)
    strength = oe[on_f] / (np.percentile(oe[on_f], 95) + 1e-9)
    keep = [i for i, t in enumerate(ons) if active[min(len(active) - 1, np.searchsorted(rt, t + 0.03))]]
    ons, strength = ons[keep], strength[keep]
    f0, vflag, _ = librosa.pyin(voc, fmin=80, fmax=1000, sr=SR, hop_length=HOP * 2)
    ft = librosa.times_like(f0, sr=SR, hop_length=HOP * 2)
    midi = librosa.hz_to_midi(np.where(vflag, f0, np.nan))

    def pitch_at(t0, t1):
        m = (ft >= t0) & (ft < t1)
        v = midi[m]; v = v[~np.isnan(v)]
        return float(np.median(v)) if len(v) else np.nan

    def sustain(t, nxt):
        # nota larga sólo si la voz mantiene un tono estable (o se desliza) sin empezar otra sílaba
        nxt_syl = ons[ons > t + 0.08]
        lim = min(nxt, nxt_syl[0] if len(nxt_syl) else dur, t + 2.4) - 0.05
        i = np.searchsorted(ft, t + 0.06)
        if i >= len(ft) or np.isnan(midi[i]): return 0.0
        ref = midi[i]; j = i; peak = db[min(len(db) - 1, np.searchsorted(rt, t + 0.05))]
        while j < len(ft) and ft[j] < lim and not np.isnan(midi[j]) and abs(midi[j] - ref) < 3.5:
            k = min(len(db) - 1, np.searchsorted(rt, ft[j]))
            if db[k] < peak - 12: break
            ref = 0.85 * ref + 0.15 * midi[j]            # permite deslizarse poco a poco
            j += 1
        return ft[min(j, len(ft) - 1)] - t

    # sílabas cuadradas a semicorcheas si están cerca (la voz suele ir a tempo)
    syl = []
    for t, s in zip(ons, strength):
        g = nearest(grid16, t)
        tq = g if abs(g - t) <= 0.04 else t
        syl.append(dict(t=float(tq), s=float(s), onBeat=abs(nearest(beats, tq) - tq) < 0.02, on8=abs(nearest(grid8, tq) - tq) < 0.02))
    syl.sort(key=lambda x: x['t'])
    # elimina duplicados por cuadrar
    dd = []
    for x in syl:
        if dd and abs(dd[-1]['t'] - x['t']) < 0.05:
            if x['s'] > dd[-1]['s']: dd[-1] = x
        else:
            dd.append(x)
    syl = dd
    first_vocal = syl[0]['t'] if syl else 0.0

    # ---- intensidad por tramos (mezcla + densidad de voz) para las luces ----
    STEP = 0.5
    nS = int(np.ceil(dur / STEP))
    mrms = librosa.feature.rms(y=mix, hop_length=HOP)[0]
    loud = np.array([mrms[(rt >= k * STEP) & (rt < (k + 1) * STEP)].mean() if np.any((rt >= k * STEP) & (rt < (k + 1) * STEP)) else 0 for k in range(nS)])
    vden = np.array([np.sum((ons >= k * STEP - 2) & (ons < k * STEP + 2)) for k in range(nS)], dtype=float)
    def rn(a):
        lo, hi = np.percentile(a, 8), np.percentile(a, 95)
        return np.clip((a - lo) / ((hi - lo) or 1), 0, 1)
    inten = 0.6 * rn(np.log(loud + 1e-6)) + 0.4 * rn(vden)
    inten = np.convolve(inten, np.ones(9) / 9, mode='same')
    inten = rn(inten)
    I_at = lambda t: float(np.interp(t, np.arange(nS) * STEP, inten))

    # notas de batería para pausas instrumentales largas (después de empezar a cantar)
    no_voc_beats = []
    ts = [x['t'] for x in syl]
    for a, b in zip(ts, ts[1:]):
        if b - a > 4.0:
            no_voc_beats += [float(x) for x in beats if a + 0.6 < x < b - 0.6]

    charts = {}
    for diff, c in CFG.items():
        L = c['lanes']
        rng = np.random.default_rng(abs(hash(song_id + diff)) % (2 ** 32))
        # selección: prioridad a sílabas fuertes y en tiempo; respeta separación y pico por segundo
        cand = [dict(x, kind='v') for x in syl]
        bi = 0
        for k, t in enumerate(no_voc_beats):
            if k % c['breakEvery'] == 0:
                cand.append(dict(t=t, s=0.5, onBeat=True, on8=True, kind='b'))
        def prio(x):
            p = x['s'] + (0.6 if x['onBeat'] else 0.25 if x['on8'] else 0)
            if diff == 'easy' and not x['on8']: p -= 0.8
            return p + 0.3 * I_at(x['t'])
        cand.sort(key=prio, reverse=True)
        chosen = []
        times = []
        for x in cand:
            t = x['t']
            i = np.searchsorted(times, t)
            if i > 0 and t - times[i - 1] < c['minGap']: continue
            if i < len(times) and times[i] - t < c['minGap']: continue
            win = sum(1 for u in times if abs(u - t) < 0.5)
            if win + 1 > c['peak']: continue
            times.insert(i, t); chosen.append(x)
        chosen.sort(key=lambda x: x['t'])

        # carriles siguiendo la melodía
        notes = []
        lane = L // 2
        lane2 = -1
        last_dir = 0
        prev_p = np.nan
        prev_t = -9
        busy_until = [-1.0] * L
        for k, x in enumerate(chosen):
            t = x['t']
            nxt = chosen[k + 1]['t'] if k + 1 < len(chosen) else dur
            p = pitch_at(t, t + 0.15)
            dp = 0 if (np.isnan(p) or np.isnan(prev_p)) else p - prev_p
            pref = 0 if (np.isnan(p) or np.isnan(prev_p) or abs(dp) < 0.8) else (1 if dp > 0 else -1)
            new, last_dir = next_lane(lane, lane2, last_dir, t - prev_t, L, rng, pref)
            new = int(np.clip(new, 0, L - 1))
            if busy_until[new] > t:                          # carril ocupado por una larga
                free = [l for l in range(L) if busy_until[l] <= t and l != lane] or [l for l in range(L) if busy_until[l] <= t]
                if not free: continue
                new = min(free, key=lambda l: abs(l - new))
            n = dict(t=round(t, 3), lane=new)
            # nota larga si la voz se sostiene
            if x['kind'] == 'v':
                sus = sustain(t, nxt if diff == 'easy' else min(nxt + 1.5, dur))
                if sus >= c['holdMin'] and (diff != 'easy' or nxt - t > sus + 0.1):
                    end = t + min(sus, 2.4)
                    g = nearest(grid8, end)
                    if abs(g - end) < 0.12: end = g
                    if end - t >= c['holdMin'] * 0.9:
                        n['end'] = round(float(end), 3)
                        p2 = pitch_at(end - 0.2, end)
                        if L > 3 and not np.isnan(p) and not np.isnan(p2) and abs(p2 - p) >= 1.5:
                            l2 = int(np.clip(new + (1 if p2 > p else -1) * (2 if L >= 7 else 1), 0, L - 1))
                            if l2 != new and busy_until[l2] <= t: n['lane2'] = l2; busy_until[l2] = end + 0.05
                        busy_until[new] = end + 0.05
            notes.append(n)
            # nota doble en golpes fuertes de partes intensas
            if c['chord'] and 'end' not in n and (x['onBeat'] or (x['on8'] and x['s'] > 0.7)) and I_at(t) > 0.45 and rng.random() < c['chord'] * 2.2:
                l2 = L - 1 - new if abs((L - 1 - new) - new) >= 2 else int(np.clip(new + (3 if new < L / 2 else -3), 0, L - 1))
                if l2 != new and busy_until[l2] <= t:
                    notes.append(dict(t=round(t, 3), lane=l2))
            lane2, lane, prev_p, prev_t = lane, new, (p if not np.isnan(p) else prev_p), t
        notes.sort(key=lambda n: (n['t'], n['lane']))
        # nivel (estrellas) por densidad máxima en 4 s
        tt_ = np.array([n['t'] for n in notes])
        peak4 = max((np.sum((tt_ >= a) & (tt_ < a + 4)) / 4 for a in tt_), default=0)
        level = int(np.clip(round(peak4 * 1.9 + (L - 3) * 0.9), 1, 15))
        charts[diff] = dict(lanes=L, notes=notes, level=level)

    return dict(
        v=1, id=song_id, duration=round(dur, 3), firstVocal=round(first_vocal, 3),
        bpm=round(60 / period, 2), phase=round(float(beats[0]), 3), beats=[round(float(b), 3) for b in beats],
        intensity=dict(step=STEP, v=[round(float(x), 2) for x in inten]),
        charts=charts,
    )


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('mp3'); ap.add_argument('song_id')
    ap.add_argument('--out', default='superstar/charts')
    ap.add_argument('--work', default=None)
    a = ap.parse_args()
    work = a.work or tempfile.mkdtemp()
    res = build(a.mp3, a.song_id, work)
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, a.song_id + '.json'), 'w') as f:
        json.dump(res, f, separators=(',', ':'))
    for d, c in res['charts'].items():
        n = c['notes']
        print(f"{d:6s} notas {len(n):4d}  largas {sum('end' in x for x in n):3d}  slides {sum('lane2' in x for x in n):3d}  nivel {c['level']}")
    print('primera sílaba', res['firstVocal'], 's | primera nota', min(x['t'] for c in res['charts'].values() for x in c['notes']), 's | BPM', res['bpm'])
