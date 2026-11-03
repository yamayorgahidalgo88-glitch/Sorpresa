import { useCallback, useEffect, useMemo, useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import Game from './components/Game.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';
import { renderSong } from './game/synth.js';
import { SONG } from './game/song.js';
import { buildBuiltinChart, buildCustomChart } from './game/chart.js';
import { getAudioContext } from './game/audio.js';
import { loadCollection, saveCollection, deckCards, computeThemeBonus, applyRewards } from './game/cards.js';
import { loadSettings, saveSettings } from './game/settings.js';

export default function App() {
  const [screen, setScreen] = useState('menu'); // menu | game | results
  const [settings, setSettings] = useState(loadSettings);
  const [collection, setCollection] = useState(loadCollection);
  const [builtinBuffer, setBuiltinBuffer] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [custom, setCustom] = useState(null); // { buffer, analysis, title, bpm, offset }
  const [songChoice, setSongChoice] = useState('builtin');
  const [session, setSession] = useState(null);
  const [results, setResults] = useState(null);

  // Genera la pista de prueba en segundo plano al cargar
  useEffect(() => {
    renderSong().then(setBuiltinBuffer).catch((e) => setLoadError(String(e)));
  }, []);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveCollection(collection), [collection]);

  const deck = useMemo(() => deckCards(collection), [collection]);

  const startGame = useCallback(async () => {
    const ctx = getAudioContext();
    try {
      await ctx.resume();
    } catch {
      /* algunos navegadores lo reanudan al primer gesto */
    }
    let buffer, chart, song;
    if (songChoice === 'custom' && custom) {
      buffer = custom.buffer;
      chart = buildCustomChart(custom.analysis, settings.difficulty, custom.bpm, custom.offset);
      song = { id: 'custom:' + custom.title, title: custom.title, theme: 'NEON NIGHT', bpm: custom.bpm, beatOffset: custom.offset };
    } else {
      if (!builtinBuffer) return;
      buffer = builtinBuffer;
      chart = buildBuiltinChart(settings.difficulty);
      song = { id: SONG.id, title: SONG.title, theme: SONG.theme, bpm: SONG.bpm, beatOffset: 0 };
    }
    const themeBonus = computeThemeBonus(deck, song.theme);
    setSession({
      key: Date.now(),
      ctx,
      buffer,
      chart,
      song,
      deck,
      themeBonus,
      difficulty: settings.difficulty,
      speed: settings.speed,
      calibrationMs: settings.calibrationMs,
      keys: settings.keys,
    });
    setScreen('game');
  }, [songChoice, custom, builtinBuffer, settings, deck]);

  const onFinish = useCallback(
    (result) => {
      const rewards = applyRewards(collection, result, result.songId);
      setCollection(rewards.collection);
      setResults({ result, rewards });
      setScreen('results');
    },
    [collection],
  );

  const replay = useCallback(() => {
    setSession((s) => ({ ...s, key: Date.now(), deck, themeBonus: computeThemeBonus(deck, s.song.theme) }));
    setScreen('game');
  }, [deck]);

  return (
    <div className="app">
      {screen === 'menu' && (
        <StartScreen
          settings={settings}
          setSettings={setSettings}
          collection={collection}
          setCollection={setCollection}
          ready={!!builtinBuffer}
          loadError={loadError}
          custom={custom}
          setCustom={setCustom}
          songChoice={songChoice}
          setSongChoice={setSongChoice}
          onStart={startGame}
        />
      )}
      {screen === 'game' && session && (
        <Game key={session.key} config={session} onFinish={onFinish} onExit={() => setScreen('menu')} />
      )}
      {screen === 'results' && results && (
        <ResultsScreen data={results} onReplay={replay} onMenu={() => setScreen('menu')} />
      )}
    </div>
  );
}
