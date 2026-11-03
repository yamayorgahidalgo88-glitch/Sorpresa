// Definición musical de la pista de prueba original "Starlight Highway".
// La misma partitura se usa para sintetizar el audio (synth.js) y para generar
// las notas del juego (chart.js), de modo que cada nota corresponde a un
// evento musical real (melodía, arpegio, acordes o batería).

export const SONG = {
  id: 'starlight-highway',
  title: 'Starlight Highway',
  artist: 'NEON PULSE (pista original)',
  theme: 'NEON NIGHT',
  bpm: 120,
  bars: 40,
  tail: 2.5, // segundos extra de cola (reverb / final)
};

export const BEAT = 60 / SONG.bpm; // 0.5 s
export const BAR = BEAT * 4; // 2 s
export const STEP = BEAT / 4; // semicorchea (0.125 s)

// Secciones en compases [inicio, fin)
export const SECTIONS = [
  { id: 'intro', from: 0, to: 2 },
  { id: 'verse', from: 2, to: 10 },
  { id: 'build', from: 10, to: 18 },
  { id: 'chorus1', from: 18, to: 26 },
  { id: 'bridge', from: 26, to: 30 },
  { id: 'chorus2', from: 30, to: 38 },
  { id: 'outro', from: 38, to: 40 },
];

export function sectionOfBar(bar) {
  return SECTIONS.find((s) => bar >= s.from && bar < s.to) || SECTIONS[SECTIONS.length - 1];
}

// Acordes (MIDI) y bajo por compás
const CHORDS = {
  Am: { notes: [57, 60, 64], bass: 45 },
  F: { notes: [57, 60, 65], bass: 41 },
  C: { notes: [55, 60, 64], bass: 48 },
  G: { notes: [55, 59, 62], bass: 43 },
  Dm: { notes: [57, 62, 65], bass: 38 },
  E: { notes: [56, 59, 64], bass: 40 },
};
const MAIN_PROG = ['Am', 'F', 'C', 'G'];
const BRIDGE_PROG = ['Dm', 'Am', 'F', 'E'];

export function chordOfBar(bar) {
  const sec = sectionOfBar(bar);
  if (sec.id === 'bridge') return CHORDS[BRIDGE_PROG[(bar - sec.from) % 4]];
  if (sec.id === 'outro') return CHORDS.Am;
  return CHORDS[MAIN_PROG[bar % 4]];
}

// Escala de La menor a partir de A4 (MIDI 69); grado -> semitonos
const SCALE = [0, 2, 3, 5, 7, 8, 10];
export function degreeToMidi(d) {
  const oct = Math.floor(d / 7);
  const idx = ((d % 7) + 7) % 7;
  return 69 + oct * 12 + SCALE[idx] - 12; // centrado en A3..A5
}

// Motivos melódicos de 2 compases: [paso(semicorcheas), grado, duración]
const MOTIFS = {
  verseA: [[0, 4, 4], [4, 2, 4], [8, 3, 2], [10, 4, 2], [12, 2, 4], [16, 0, 6], [24, 2, 4], [28, 1, 4]],
  verseB: [[0, 4, 4], [4, 5, 4], [8, 4, 2], [10, 3, 2], [12, 2, 4], [16, 1, 8], [24, 3, 4], [28, 4, 4]],
  chorusA: [[0, 7, 3], [3, 7, 3], [6, 6, 2], [8, 4, 4], [12, 5, 4], [16, 4, 3], [19, 4, 3], [22, 2, 2], [24, 3, 4], [28, 4, 4]],
  chorusB: [[0, 7, 3], [3, 7, 3], [6, 8, 2], [8, 9, 4], [12, 8, 4], [16, 7, 6], [22, 6, 2], [24, 4, 8]],
  bridgeA: [[0, 4, 14], [16, 2, 14]],
  bridgeB: [[0, 3, 14], [16, 4, 14]],
  outro: [[0, 7, 16]],
};

// Melodía completa en segundos: { time, midi, degree, dur, section }
export function buildMelody() {
  const out = [];
  const add = (motif, startBar, section) => {
    for (const [step, deg, len] of motif) {
      out.push({
        time: startBar * BAR + step * STEP,
        degree: deg,
        midi: degreeToMidi(deg),
        dur: len * STEP,
        section,
      });
    }
  };
  for (let bar = 2; bar < 10; bar += 2) add(verseMotif(bar), bar, 'verse');
  for (let bar = 18; bar < 26; bar += 2) add(((bar - 18) / 2) % 2 ? MOTIFS.chorusB : MOTIFS.chorusA, bar, 'chorus1');
  add(MOTIFS.bridgeA, 26, 'bridge');
  add(MOTIFS.bridgeB, 28, 'bridge');
  for (let bar = 30; bar < 38; bar += 2) add(((bar - 30) / 2) % 2 ? MOTIFS.chorusB : MOTIFS.chorusA, bar, 'chorus2');
  add(MOTIFS.outro, 38, 'outro');
  return out;
}
function verseMotif(bar) {
  return ((bar - 2) / 2) % 2 ? MOTIFS.verseB : MOTIFS.verseA;
}

// Arpegio en corcheas (build y estribillos): índices sobre el acorde
const ARP_PATTERN = [0, 1, 2, 3, 2, 1, 0, 1];
export function buildArpeggio() {
  const out = [];
  for (let bar = 0; bar < SONG.bars; bar++) {
    const sec = sectionOfBar(bar).id;
    if (sec !== 'build' && sec !== 'chorus1' && sec !== 'chorus2') continue;
    const chord = chordOfBar(bar);
    const tones = [chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[0] + 12];
    for (let i = 0; i < 8; i++) {
      const idx = ARP_PATTERN[i];
      out.push({ time: bar * BAR + i * BEAT * 0.5, midi: tones[idx] + 12, rank: idx, bar, section: sec });
    }
  }
  return out;
}

// Batería: kick / snare / hat por sección
export function buildDrums() {
  const out = [];
  for (let bar = 0; bar < SONG.bars; bar++) {
    const sec = sectionOfBar(bar).id;
    const t0 = bar * BAR;
    for (let step = 0; step < 16; step++) {
      const t = t0 + step * STEP;
      const beat = step / 4;
      const onBeat = step % 4 === 0;
      let kick = false, snare = false, hat = false, open = false;
      switch (sec) {
        case 'intro':
          kick = onBeat;
          hat = step % 2 === 0;
          break;
        case 'verse':
          kick = step === 0 || step === 8 || step === 10;
          snare = step === 4 || step === 12;
          hat = step % 2 === 0;
          break;
        case 'build': {
          kick = onBeat;
          snare = step === 4 || step === 12;
          hat = step % 2 === 0;
          // redoble en los dos últimos compases
          if (bar >= 16) snare = bar === 17 ? true : step % 2 === 0;
          break;
        }
        case 'chorus1':
        case 'chorus2':
          kick = onBeat;
          snare = step === 4 || step === 12;
          hat = true;
          open = step % 4 === 2;
          break;
        case 'bridge':
          kick = step === 0;
          hat = step % 4 === 2;
          break;
        case 'outro':
          kick = bar === 38 && step === 0;
          break;
        default:
          break;
      }
      if (kick) out.push({ time: t, kind: 'kick', beat, bar, step, section: sec });
      if (snare) out.push({ time: t, kind: 'snare', beat, bar, step, section: sec });
      if (hat) out.push({ time: t, kind: open ? 'openhat' : 'hat', beat, bar, step, section: sec });
    }
  }
  return out;
}

export const SONG_DURATION = SONG.bars * BAR + SONG.tail;
