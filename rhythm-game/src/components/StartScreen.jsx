import { useMemo, useState } from 'react';
import { DIFFICULTIES, approachTimeForSpeed } from '../game/constants.js';
import { SONG } from '../game/song.js';
import { buildBuiltinChart, chartStats, analyzeAudio } from '../game/chart.js';
import { decodeFile } from '../game/audio.js';
import { deckCards, computeThemeBonus } from '../game/cards.js';
import KeyConfig from './KeyConfig.jsx';
import CardCollection from './CardCollection.jsx';
import CharacterCard from './CharacterCard.jsx';

export default function StartScreen({
  settings, setSettings, collection, setCollection, ready, loadError,
  custom, setCustom, songChoice, setSongChoice, onStart,
}) {
  const [tab, setTab] = useState('play'); // play | cards | settings
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [starting, setStarting] = useState(false);

  const deck = useMemo(() => deckCards(collection), [collection]);
  const theme = computeThemeBonus(deck, SONG.theme);
  const stats = useMemo(
    () => Object.fromEntries(Object.keys(DIFFICULTIES).map((d) => [d, chartStats(buildBuiltinChart(d))])),
    [],
  );
  const best = collection.best?.[`${SONG.id}:${settings.difficulty}`];

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingFile(true);
    setFileError(null);
    try {
      const buffer = await decodeFile(file);
      if (buffer.duration < 20) throw new Error('La canción debe durar al menos 20 segundos.');
      const analysis = analyzeAudio(buffer);
      setCustom({
        buffer,
        analysis,
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 40),
        bpm: analysis.bpm,
        offset: analysis.offset,
      });
      setSongChoice('custom');
    } catch (err) {
      setFileError(err?.message || 'No se pudo leer el archivo de audio.');
    } finally {
      setLoadingFile(false);
      e.target.value = '';
    }
  };

  const canStart = songChoice === 'custom' ? !!custom : ready;
  const start = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    await onStart();
    setStarting(false);
  };

  return (
    <div className="menu">
      <div className="menu-bg" />
      <div className="menu-inner">
        <header className="logo">
          <div className="logo-eyebrow">RHYTHM STAGE</div>
          <h1>
            NEON <span>PULSE</span>
          </h1>
          <div className="logo-notes">
            <i className="dot yellow" />
            <i className="dot cyan" />
            <i className="dot pink" />
          </div>
        </header>

        <nav className="tabs">
          {[['play', 'JUGAR'], ['cards', 'CARTAS'], ['settings', 'CONTROLES']].map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>

        {tab === 'play' && (
          <section className="panel-sec">
            <h3>Canción</h3>
            <div className="song-list">
              <button className={`song ${songChoice === 'builtin' ? 'active' : ''}`} onClick={() => setSongChoice('builtin')}>
                <span className="song-title">{SONG.title}</span>
                <span className="song-meta">
                  {SONG.artist} · {SONG.bpm} BPM · 1:20 · {ready ? 'lista' : 'generando…'}
                </span>
              </button>
              <label className={`song upload ${songChoice === 'custom' ? 'active' : ''}`}>
                <input type="file" accept="audio/*" onChange={onFile} hidden />
                <span className="song-title">{custom ? `🎵 ${custom.title}` : '＋ Cargar tu propia canción'}</span>
                <span className="song-meta">
                  {loadingFile
                    ? 'Analizando ritmo…'
                    : custom
                      ? `${custom.bpm} BPM detectados · ${Math.round(custom.buffer.duration)} s`
                      : 'MP3 / OGG / WAV · las notas se generan según el ritmo'}
                </span>
              </label>
              {custom && songChoice === 'custom' && (
                <div className="bpm-edit">
                  <label>
                    BPM
                    <input
                      type="number"
                      min="60"
                      max="220"
                      step="0.1"
                      value={custom.bpm}
                      onChange={(e) => setCustom({ ...custom, bpm: Math.max(60, Math.min(220, Number(e.target.value) || custom.bpm)) })}
                    />
                  </label>
                  <label>
                    Desfase (s)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={custom.offset}
                      onChange={(e) => setCustom({ ...custom, offset: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </label>
                </div>
              )}
              {fileError && <p className="error">{fileError}</p>}
              {loadError && <p className="error">Error al generar la pista: {loadError}</p>}
            </div>

            <h3>Dificultad</h3>
            <div className="diff-row">
              {Object.values(DIFFICULTIES).map((d) => (
                <button
                  key={d.id}
                  className={`diff ${settings.difficulty === d.id ? 'active' : ''}`}
                  style={{ '--c': d.color }}
                  onClick={() => set({ difficulty: d.id, speed: d.defaultSpeed })}
                  data-testid={`diff-${d.id}`}
                >
                  <b>{d.label}</b>
                  {songChoice === 'builtin' && <small>{stats[d.id].notes} notas</small>}
                </button>
              ))}
            </div>

            <div className="slider-row">
              <label>
                Velocidad <b>{settings.speed}</b>
                <small>({approachTimeForSpeed(settings.speed).toFixed(1)} s de recorrido)</small>
              </label>
              <input type="range" min="1" max="10" step="1" value={settings.speed} onChange={(e) => set({ speed: Number(e.target.value) })} />
            </div>

            <div className="deck-preview" onClick={() => setTab('cards')}>
              <div className="deck-cards">
                {deck.map((c) => (
                  <CharacterCard key={c.id} card={c} size="mini" />
                ))}
              </div>
              <div className="deck-info">
                <b>THEME BONUS Lv.{theme.level}</b>
                <span>
                  +{theme.percent}% · {theme.matching}/{deck.length} cartas «{SONG.theme}»
                </span>
              </div>
            </div>

            <button className="btn start" onClick={start} disabled={!canStart || starting} data-testid="start-btn">
              {canStart ? (starting ? 'CARGANDO…' : '▶ INICIAR') : 'PREPARANDO PISTA…'}
            </button>
            {best ? <p className="best">Mejor puntuación: {best.toLocaleString('es-ES')}</p> : null}

            <div className="howto">
              <p>
                <b>Móvil:</b> toca los carriles cuando las notas lleguen a la línea brillante. Puedes pulsar varios a la vez y mantener
                las notas largas.
              </p>
              <p>
                <b>Ordenador:</b> teclas <kbd>{settings.keys.map((k) => k.replace('Key', '')).join(' ')}</kbd> · <kbd>Esc</kbd> pausa.
              </p>
            </div>
          </section>
        )}

        {tab === 'cards' && <CardCollection collection={collection} setCollection={setCollection} />}

        {tab === 'settings' && (
          <section className="panel-sec">
            <h3>Teclas de los carriles</h3>
            <KeyConfig keys={settings.keys} onChange={(keys) => set({ keys })} />
            <h3>Ajuste de latencia</h3>
            <div className="slider-row">
              <label>
                Desfase de audio <b>{settings.calibrationMs > 0 ? '+' : ''}{settings.calibrationMs} ms</b>
                <small>(positivo si las notas llegan antes que la música)</small>
              </label>
              <input
                type="range"
                min="-150"
                max="150"
                step="5"
                value={settings.calibrationMs}
                onChange={(e) => set({ calibrationMs: Number(e.target.value) })}
              />
            </div>
            <h3>Juicios</h3>
            <ul className="judge-list">
              <li className="j-sperfect">S PERFECT · ±{Math.round(DIFFICULTIES[settings.difficulty].windows.s * 1000)} ms · 1200</li>
              <li className="j-perfect">PERFECT · ±{Math.round(DIFFICULTIES[settings.difficulty].windows.p * 1000)} ms · 1000</li>
              <li className="j-good">GOOD · ±{Math.round(DIFFICULTIES[settings.difficulty].windows.g * 1000)} ms · 500</li>
              <li className="j-miss">MISS · rompe el combo y resta energía</li>
            </ul>
            <p className="hint">
              La puntuación se multiplica por combo (hasta ×1.4), RAVE BONUS (hasta ×1.5), THEME BONUS, tipo de nota (★ ×1.5) y
              CARD BONUS (×1.1 si el color de la nota coincide con la carta activa).
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
