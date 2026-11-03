#!/usr/bin/env python3
"""
Valida una partitura preparada (superstar/charts/<id>.json) contra su MP3.

Uso:  python3 tools/validate_chart.py superstar/charts/dynamite.json cancion.mp3

Comprueba: tiempos dentro de la canción y no negativos, carriles válidos, notas largas
con duración válida, separación mínima, que nada caiga encima de un conector activo,
que la canción empieza/acaba bien y la sincronía (cuántas notas caen sobre un golpe
real del audio, y el desfase medio).
"""
import json, sys, subprocess, tempfile, os
import numpy as np, librosa, soundfile as sf

SR = 22050
APPROACH = 2.7 - 5 * 0.21   # segundos que tarda una nota en bajar con la velocidad por defecto (5)

def main(chart_path, mp3):
    d = json.load(open(chart_path))
    tmp = tempfile.mktemp(suffix='.wav')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', mp3, '-ar', str(SR), '-ac', '1', tmp], check=True)
    y, _ = sf.read(tmp, dtype='float32'); os.remove(tmp)
    dur = len(y) / SR
    oe = librosa.onset.onset_strength(y=y, sr=SR, hop_length=128)
    ot = librosa.times_like(oe, sr=SR, hop_length=128)
    ons = ot[librosa.onset.onset_detect(onset_envelope=oe, sr=SR, hop_length=128)]
    ok = True
    def check(cond, msg):
        nonlocal ok
        print(('  OK   ' if cond else '  FALLO') + ' ' + msg)
        ok &= bool(cond)
    print(f"Canción: {d['id']} | audio {dur:.2f} s | partitura para {d['duration']:.2f} s | empieza {d.get('start', 0)} s | acaba {d.get('end', dur):.2f} s | BPM {d['bpm']}")
    check(abs(d['duration'] - dur) < 1.5, 'la partitura corresponde a este MP3 (misma duración)')
    for diff, c in d['charts'].items():
        n = c['notes']; L = c['lanes']
        print(f"\n[{diff.upper()}] {len(n)} notas · {sum('end' in x for x in n)} largas · {sum('lane2' in x for x in n)} slides · nivel {c['level']}")
        t = np.array([x['t'] for x in n])
        check(len(n) > 0, 'tiene notas')
        check(t.min() >= 0 and all(x.get('end', x['t']) >= 0 for x in n), 'sin tiempos negativos')
        check(t.max() <= dur and all(x.get('end', 0) <= dur for x in n), 'todas dentro de la duración')
        check(t.min() >= d.get('start', 0) - 0.01, 'ninguna antes del inicio recortado')
        check(all(0 <= x['lane'] < L and 0 <= x.get('lane2', 0) < L for x in n), f'carriles válidos (0..{L - 1})')
        check(all(x['end'] - x['t'] >= 0.15 for x in n if 'end' in x), 'notas largas con duración válida (≥ 0,15 s)')
        check(all(t[i] <= t[i + 1] for i in range(len(t) - 1)), 'ordenadas en el tiempo')
        check(t.min() - d.get('start', 0) + 2.2 >= 0, f'la primera nota tiene tiempo de bajar (aparece {APPROACH:.2f} s antes de pulsarse)')
        ut = np.unique(t)
        check(np.diff(ut).min() >= 0.12, f'separación mínima entre momentos {1000 * np.diff(ut).min():.0f} ms (≥ 120)')
        bad = 0
        for h in [x for x in n if 'end' in x]:
            lo, hi = min(h['lane'], h.get('lane2', h['lane'])), max(h['lane'], h.get('lane2', h['lane']))
            bad += sum(1 for x in n if x is not h and h['t'] < x['t'] < h['end'] + 0.2 and lo - 1 <= x['lane'] <= hi + 1)
        check(bad == 0, f'ninguna nota encima de un conector activo ({bad})')
        dist = np.array([np.min(np.abs(ons - x)) for x in t])
        signed = np.array([ons[np.argmin(np.abs(ons - x))] - x for x in t])
        near = np.mean(dist < 0.045)
        print(f"  info  sincronía: {100 * near:.0f}% de las notas a < 45 ms (ventana S·PERFECT) de un golpe real · desfase mediano {1000 * np.median(signed[dist < 0.06]):+.0f} ms")
        check(near > 0.6 and abs(np.median(signed[dist < 0.06])) < 0.025, 'sin errores de sincronización evidentes')
    print('\nRESULTADO:', 'VÁLIDA' if ok else 'CON ERRORES')
    return ok

if __name__ == '__main__':
    sys.exit(0 if main(sys.argv[1], sys.argv[2]) else 1)
