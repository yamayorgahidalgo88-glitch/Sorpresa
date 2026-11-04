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
    'normal': dict(lanes=4, minGap=0.15, peak=5.5, holdMin=0.28, chord=0.08, breakEvery=2),
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


def make_chains(notes, L, rng, diff):
    """Zigzags como los del original: 3-4 monedas unidas por bandas rectas que cruzan la pista
    de lado a lado. Con tiempo suficiente entre monedas (0,25-0,6 s) para seguirlas con fluidez."""
    if diff == 'easy' or L < 4: return notes
    from collections import Counter
    cnt = Counter(n['t'] for n in notes)
    out, i, last_chain = [], 0, -99.0
    while i < len(notes):
        n = notes[i]
        run, j = [n], i + 1
        while j < len(notes) and len(run) < 4:
            m = notes[j]; g = m['t'] - run[-1]['t']
            if 'end' in m or 'end' in run[-1] or cnt[m['t']] > 1 or cnt[run[-1]['t']] > 1 or not (0.25 <= g <= 0.6): break
            run.append(m); j += 1
        nxt = notes[j]['t'] if j < len(notes) else 1e9
        if len(run) >= 3 and run[0]['t'] - last_chain > 4.5 and nxt - run[-1]['t'] >= 0.3 and rng.random() < 0.8:
            # zigzag ancho: de un lado a otro de la pista (en 4 carriles: saltos de 2-3)
            lane = run[0]['lane']
            path = [[run[0]['t'], lane]]
            d = 1 if lane < (L - 1) / 2 else -1
            for m in run[1:]:
                mag = 3 if (path[-1][1] in (0, L - 1) and rng.random() < 0.5) else 2
                nl = path[-1][1] + d * mag
                if nl < 0 or nl > L - 1: nl = path[-1][1] - d * mag
                nl = int(min(L - 1, max(0, nl)))
                if nl == path[-1][1]: nl = 0 if path[-1][1] > (L - 1) / 2 else L - 1
                d = 1 if nl < path[-1][1] else -1          # el siguiente tramo vuelve hacia el otro lado
                path.append([m['t'], nl])
            out.append(dict(t=path[0][0], lane=path[0][1], end=path[-1][0], lane2=path[-1][1], path=path))
            last_chain = run[-1]['t']
            i = j
            continue
        out.append(n); i += 1
    res = []
    for n in out:
        ok = True
        for c in out:
            if 'path' in c and c is not n and c['t'] < n['t'] < c['end'] + 0.25:
                ok = False                                   # nada mientras se sigue un zigzag
        if ok: res.append(n)
    return res


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
    def load(f):
        v, sr = sf.read(f, dtype='float32')
        v = v.mean(axis=1) if v.ndim > 1 else v
        return librosa.resample(v, orig_sr=sr, target_sr=SR)
    return load(out), load(out.replace('vocals.wav', 'no_vocals.wav'))


def nearest(arr, x):
    i = np.searchsorted(arr, x)
    c = [arr[j] for j in (i - 1, i) if 0 <= j < len(arr)]
    return min(c, key=lambda a: abs(a - x)) if c else x


def find_trim(mix, dur):
    """Dónde empieza y acaba la música de verdad (salta intros/colas de videoclip)."""
    hop = SR // 2                                     # tramos de 0,5 s
    rms = librosa.feature.rms(y=mix, frame_length=4096, hop_length=hop)[0]
    db = librosa.amplitude_to_db(rms + 1e-9, ref=np.percentile(rms, 98))
    t = np.arange(len(db)) * 0.5
    start = 0.0
    # inicio: tras el último tramo silencioso (< -26 dB) de >= 3 s dentro de los primeros 60 s
    q = (db < -26).astype(int); run = 0; last_quiet_end = None
    for i, v in enumerate(q):
        run = run + 1 if v else 0
        if run >= 6 and t[i] < 60: last_quiet_end = i
    if last_quiet_end is not None:
        nxt = np.where((db > -20) & (t > t[last_quiet_end]))[0]
        if len(nxt): start = max(0.0, float(t[nxt[0]]) - 0.5)
    # final: último tramo con música (> -25 dB); se deja 1 s de margen
    li = np.where(db > -25)[0]
    end = min(dur, float(t[li[-1]]) + 1.0) if len(li) else dur
    return round(start, 3), round(end, 3)


def build(mp3, song_id, workdir, diffs=('normal',), start=None, end=None):
    mix = decode(mp3, SR)
    dur = len(mix) / SR
    voc, inst = separate_vocals(mp3, workdir)
    voc, inst = voc[: len(mix)], inst[: len(mix)]
    a_start, a_end = find_trim(mix, dur)
    start = a_start if start is None else start
    end = a_end if end is None else end

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

    strong_ons = ons[strength > 0.6]
    fdt = float(ft[1] - ft[0]) if len(ft) > 1 else 0.02
    def sustain(t, nxt):
        # La nota larga sigue mientras la voz siga sonando la misma frase: sólo termina si la voz
        # se calla (> 90 ms), baja mucho de volumen o empieza otra sílaba con un salto de tono claro.
        lim = min(nxt, t + 3.2) - 0.05
        i = np.searchsorted(ft, t + 0.06)
        if i >= len(ft) or np.isnan(midi[i]): return 0.0
        ref = midi[i]; j = i; gap = 0
        peak = db[min(len(db) - 1, np.searchsorted(rt, t + 0.05))]
        while j < len(ft) and ft[j] < lim:
            m = midi[j]
            if np.isnan(m):
                gap += 1
                if gap * fdt > 0.09: break
            else:
                gap = 0
                if abs(m - ref) > 2.5 and len(strong_ons) and np.min(np.abs(strong_ons - ft[j])) < 0.04: break
                ref = 0.9 * ref + 0.1 * m
            k = min(len(db) - 1, np.searchsorted(rt, ft[j]))
            if db[k] < peak - 15: break
            j += 1
        return max(0.0, ft[min(j, len(ft) - 1)] - t - gap * fdt)

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
    syl = [x for x in syl if start + 0.3 <= x['t'] <= end]
    first_vocal = syl[0]['t'] if syl else start

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

    # golpes especiales: picos de la música (sin voz) que destacan muchísimo sobre su entorno
    oe_i = librosa.onset.onset_strength(y=inst, sr=SR, hop_length=HOP)
    ti = librosa.times_like(oe_i, sr=SR, hop_length=HOP)
    win = int(4 * SR / HOP)
    med = np.array([np.median(oe_i[max(0, i - win // 2): i + win // 2]) for i in range(0, len(oe_i))])
    pk = librosa.util.peak_pick(oe_i, pre_max=6, post_max=6, pre_avg=20, post_avg=20, delta=0.5, wait=8)
    thr = np.percentile(oe_i, 99.2)
    accents = []
    for i in pk:
        ta = float(ti[i])
        if oe_i[i] >= thr and oe_i[i] > 5 * (med[i] + 1e-6) and first_vocal - 0.05 <= ta <= end:
            if not len(ons) or np.min(np.abs(ons - ta)) > 0.09:   # no pisar una sílaba
                g = nearest(grid16, ta); accents.append(float(g if abs(g - ta) < 0.04 else ta))

    # ---- batería (pista instrumental, parte percusiva): bombo y caja por separado ----
    perc = librosa.effects.percussive(inst, margin=2.0)
    S = np.abs(librosa.stft(perc, n_fft=1024, hop_length=HOP))
    fq = librosa.fft_frequencies(sr=SR, n_fft=1024)
    def band_flux(lo, hi):
        m = (fq >= lo) & (fq < hi)
        e = np.log1p(S[m].sum(axis=0) * 10)
        f = np.maximum(0, np.diff(e, prepend=e[0]))
        return f / (np.percentile(f, 99) + 1e-9)
    kick_env, snare_env = band_flux(30, 150), band_flux(180, 5000)
    tf = librosa.frames_to_time(np.arange(S.shape[1]), sr=SR, hop_length=HOP)
    drums = []
    for env, kind in ((kick_env, 'k'), (snare_env, 's')):
        pk = librosa.util.peak_pick(env, pre_max=4, post_max=4, pre_avg=12, post_avg=12, delta=0.12, wait=6)
        for i in pk:
            tq = float(tf[i]); g = nearest(grid16, tq)
            if abs(g - tq) <= 0.045: tq = float(g)
            drums.append(dict(t=tq, s=float(min(1.5, env[i])), drum=kind,
                              onBeat=abs(nearest(beats, tq) - tq) < 0.02, on8=abs(nearest(grid8, tq) - tq) < 0.02))
    drums.sort(key=lambda x: x['t'])

    # ---- secciones: dónde canta la voz y dónde manda la música ----
    syl_t = np.array([x['t'] for x in syl])
    def near_voice(t, w):
        return len(syl_t) and np.min(np.abs(syl_t - t)) < w
    # tramo instrumental = al menos 4 pulsos seguidos sin sílabas
    inst_spans = []
    edges = [start] + list(syl_t) + [end]
    for a_, b_ in zip(edges, edges[1:]):
        if b_ - a_ >= 4 * period: inst_spans.append((a_ + 0.15, b_ - 0.15))
    def in_inst(t):
        return any(a_ <= t <= b_ for a_, b_ in inst_spans)
    drum_cand = []
    for d in drums:
        if not (start <= d['t'] <= end): continue
        # sólo golpes de bombo en el pulso, en pausas instrumentales largas y después de empezar a cantar
        if d['t'] > first_vocal + 0.1 and in_inst(d['t']) and d['drum'] == 'k' and d['onBeat']:
            d = dict(d, kind='d', s=d['s'] * 0.8)
        else:
            continue
        drum_cand.append(d)
    thin, last_t = [], -9
    for d in sorted(drum_cand, key=lambda x: x['t']):
        if d['t'] - last_t >= 2 * period - 0.02: thin.append(d); last_t = d['t']
    drum_cand = thin
    # HARD: además de la voz, los golpes de batería (bombo y caja) que caen en el compás (corcheas),
    # en toda la canción, para que haya más notas pero siempre sobre algo que suena
    # (confirmados por el detector general de golpes de la pista instrumental, para no inventar golpes)
    oe_c = librosa.onset.onset_strength(y=inst, sr=SR, hop_length=128)
    t_c = librosa.times_like(oe_c, sr=SR, hop_length=128)
    inst_on = t_c[librosa.onset.onset_detect(onset_envelope=oe_c, sr=SR, hop_length=128)]
    heard = lambda t: len(inst_on) and np.min(np.abs(inst_on - t)) < 0.04
    drum_hard = [dict(d, kind='d', s=d['s'] * 0.75) for d in drums if heard(d['t'])
                 and start <= d['t'] <= end and d['t'] > first_vocal + 0.1 and d['s'] > 0.15
                 and abs(nearest(grid16, d['t']) - d['t']) < 0.01]
    sections = [dict(a=round(a_, 2), b=round(b_, 2)) for a_, b_ in inst_spans]

    charts = {}
    for diff in diffs:
        c = CFG[diff]
        L = c['lanes']
        rng = np.random.default_rng(abs(hash(song_id + diff)) % (2 ** 32))
        # selección: prioridad a sílabas fuertes y en tiempo; respeta separación y pico por segundo
        cand = [dict(x, kind='v') for x in syl if max(start + 0.3, first_vocal - 0.01) <= x['t'] <= end]
        cand += [dict(t=a, s=2.0, onBeat=False, on8=True, kind='a') for a in accents]
        cand += drum_cand
        if diff == 'hard':
            cand += [x for x in drum_hard if not near_voice(x['t'], 0.08)]
        if diff == 'hard':
            # en HARD sólo sílabas que se oyen claras o caen en el compás; la batería real tiene prioridad
            cand = [x for x in cand if x['kind'] != 'v' or x['s'] >= 0.15 or x['on8']]
            for x in cand:
                if x['kind'] == 'd': x['s'] *= 1.4
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
            # nunca más de "peak" notas en NINGÚN segundo que contenga esta nota
            lo_i, hi_i = np.searchsorted(times, t - 1.0), np.searchsorted(times, t + 1.0)
            near_t = times[lo_i:hi_i] + [t]; near_t.sort()
            if any(sum(1 for u in near_t if w0 <= u < w0 + 1.0) > c['peak'] for w0 in near_t): continue
            times.insert(i, t); chosen.append(x)
        chosen.sort(key=lambda x: x['t'])

        # carriles siguiendo la melodía
        notes = []
        lane = L // 2
        lane2 = -1
        last_dir = 0
        prev_kind = ''
        prev_p = np.nan
        prev_t = -9
        busy_until = [-1.0] * L
        spans = []   # conectores activos: (fin, carril_min, carril_max)
        def blocked(l, t):
            for e, lo, hi in spans:
                if t < e + 0.2 and lo - 1 <= l <= hi + 1: return True
            return False
        phrase_until = -1.0
        for k, x in enumerate(chosen):
            t = x['t']
            if t < phrase_until: continue                    # dentro de una frase alargada: es la misma palabra
            nxt = chosen[k + 1]['t'] if k + 1 < len(chosen) else dur
            p = pitch_at(t, t + 0.15)
            dp = 0 if (np.isnan(p) or np.isnan(prev_p)) else p - prev_p
            pref = 0 if (np.isnan(p) or np.isnan(prev_p) or abs(dp) < 0.8) else (1 if dp > 0 else -1)
            if x['kind'] == 'd' and L >= 4:
                # batería como una batería de verdad: bombo en los botones de fuera, caja en los del centro
                pool = [0, L - 1] if x.get('drum') == 'k' else list(range(1, L - 1))
                opts = [l for l in pool if l != lane] or pool
                if lane2 in opts and len(opts) > 1 and t - prev_t < 0.5: opts = [l for l in opts if l != lane2] or opts
                c_ = (L - 1) / 2
                opts.sort(key=lambda l: -abs((l - c_) - (lane - c_)))      # preferir el lado contrario
                new = opts[0] if rng.random() < 0.7 else opts[int(rng.integers(len(opts)))]
                last_dir = 1 if new > lane else -1 if new < lane else last_dir
            elif x['kind'] == 'a' and t - prev_t < 0.7 and prev_kind == 'a':
                d = last_dir or 1                                # golpes seguidos: escalera pim-pim-pim
                new = lane + d if 0 <= lane + d < L else lane - d; last_dir = 1 if new > lane else -1
            else:
                new, last_dir = next_lane(lane, lane2, last_dir, t - prev_t, L, rng, pref)
            new = int(np.clip(new, 0, L - 1))
            spans[:] = [sp for sp in spans if t < sp[0] + 0.2]
            if blocked(new, t):                              # nunca encima/al lado de un conector activo
                free = [l for l in range(L) if not blocked(l, t) and busy_until[l] <= t]
                if not free: continue
                new = min(free, key=lambda l: abs(l - new))
            if busy_until[new] > t:                          # carril ocupado por una larga
                free = [l for l in range(L) if busy_until[l] <= t and l != lane] or [l for l in range(L) if busy_until[l] <= t]
                if not free: continue
                new = min(free, key=lambda l: abs(l - new))
            n = dict(t=round(t, 3), lane=new)
            # nota larga si la voz se sostiene
            if x['kind'] == 'v' and not spans:              # un conector cada vez
                sus = sustain(t, nxt if diff == 'easy' else min(nxt + 1.5, dur))
                if sus >= c['holdMin'] and (diff != 'easy' or nxt - t > sus + 0.1):
                    hend = t + (min(sus, 0.8) if sus < 1.0 else min(sus, 3.0))   # cortas como el original; frases alargadas = notas largas largas
                    g = nearest(grid8, hend)
                    if abs(g - hend) < 0.12: hend = g
                    if hend - t >= c['holdMin'] * 0.9:
                        n['end'] = round(float(hend), 3)
                        if hend - t >= 1.0: phrase_until = hend + 0.12
                        p2 = pitch_at(hend - 0.2, hend)
                        if L > 3 and not np.isnan(p) and not np.isnan(p2) and abs(p2 - p) >= 1.5:
                            mag = (2 if L >= 7 else 1) * (2 if hend - t >= 0.6 else 1)       # sostenidas largas: diagonal ancha
                            l2 = int(np.clip(new + (1 if p2 > p else -1) * mag, 0, L - 1))
                            if l2 == new: l2 = int(np.clip(new - (1 if p2 > p else -1) * mag, 0, L - 1))
                            if l2 != new and busy_until[l2] <= t: n['lane2'] = l2; busy_until[l2] = hend + 0.05
                        busy_until[new] = hend + 0.05
                        l2_ = n.get('lane2', new)
                        spans.append((hend, min(new, l2_), max(new, l2_)))
            notes.append(n)
            # nota doble en golpes fuertes de partes intensas
            if c['chord'] and 'end' not in n and not spans and (x['onBeat'] or (x['on8'] and x['s'] > 0.7)) and I_at(t) > 0.45 and rng.random() < c['chord'] * 2.2:
                l2 = L - 1 - new if abs((L - 1 - new) - new) >= 2 else int(np.clip(new + (3 if new < L / 2 else -3), 0, L - 1))
                if l2 != new and busy_until[l2] <= t:
                    notes.append(dict(t=round(t, 3), lane=l2))
            lane2, lane, prev_p, prev_t, prev_kind = lane, new, (p if not np.isnan(p) else prev_p), t, x['kind']
        notes.sort(key=lambda n: (n['t'], n['lane']))
        notes = make_chains(notes, L, rng, diff)
        # nivel (estrellas) por densidad máxima en 4 s
        tt_ = np.array([n['t'] for n in notes])
        peak4 = max((np.sum((tt_ >= a) & (tt_ < a + 4)) / 4 for a in tt_), default=0)
        level = int(np.clip(round(peak4 * 1.9 + (L - 3) * 0.9), 1, 15))
        charts[diff] = dict(lanes=L, notes=notes, level=level)

    return dict(
        v=3, id=song_id, duration=round(dur, 3), firstVocal=round(first_vocal, 3), start=start, end=end, accents=len(accents),
        instSections=sections,
        bpm=round(60 / period, 2), phase=round(float(beats[0]), 3), beats=[round(float(b), 3) for b in beats],
        intensity=dict(step=STEP, v=[round(float(x), 2) for x in inten]),
        charts=charts,
    )


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('mp3'); ap.add_argument('song_id')
    ap.add_argument('--out', default='superstar/charts')
    ap.add_argument('--work', default=None)
    ap.add_argument('--start', type=float, default=None, help='segundo donde empieza la canción (si no, se detecta)')
    ap.add_argument('--end', type=float, default=None)
    ap.add_argument('--diffs', default='normal')
    a = ap.parse_args()
    work = a.work or tempfile.mkdtemp()
    res = build(a.mp3, a.song_id, work, tuple(a.diffs.split(',')), a.start, a.end)
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, a.song_id + '.json'), 'w') as f:
        json.dump(res, f, separators=(',', ':'))
    for d, c in res['charts'].items():
        n = c['notes']
        print(f"{d:6s} notas {len(n):4d}  largas {sum('end' in x for x in n):3d}  slides {sum('lane2' in x for x in n):3d}  nivel {c['level']}")
    print('empieza', res['start'], 's | acaba', res['end'], 's | primera sílaba', res['firstVocal'], 's | primera nota', min(x['t'] for c in res['charts'].values() for x in c['notes']), 's | BPM', res['bpm'], '| golpes especiales', res['accents'])
