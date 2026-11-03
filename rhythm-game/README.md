# NEON PULSE · Rhythm Stage

Juego musical de ritmo para navegador (React + Vite + Canvas), inspirado en el
estilo de los juegos de ritmo con cartas de personajes: pista en perspectiva de
5 carriles, notas circulares luminosas, S PERFECT / PERFECT / GOOD / MISS,
combo, energía, RAVE BONUS, THEME BONUS y colección de cartas.

Todo el contenido es original: la canción de prueba «Starlight Highway» se
sintetiza en el propio navegador y los personajes son ilustraciones generadas
por código. No se usa ninguna imagen ni audio externo.

## Ejecutar

```bash
cd rhythm-game
npm install
npm run dev        # http://localhost:5173 (con --host también desde el móvil en la misma red)
```

Build de producción (rutas relativas, se puede servir desde cualquier carpeta):

```bash
npm run build      # genera dist/
npm run preview
```

## Controles

- **Móvil:** toca los carriles (multitáctil, se pueden mantener notas largas y deslizar entre carriles).
- **Ordenador:** `A S D F G` (configurables en la pestaña CONTROLES). `Esc` / `P` pausa.
- Opción `?debug=1` en la URL expone el motor en `window.__engine` para pruebas.

## Arquitectura

```
src/
  game/                    lógica (sin React)
    GameEngine.js          estado central: juicios, puntuación, combo, energía, RAVE, cartas
    audio.js               AudioClock: reloj único basado en AudioContext (pausa = suspend)
    song.js                partitura de la pista de prueba (BPM, secciones, melodía, batería)
    synth.js               síntesis DSP de la pista a un AudioBuffer
    chart.js               secuencias de notas: integrada (por dificultad) y automática para canciones del usuario
    perspective.js         proyección de la pista; projectNote(tiempoRestante) -> posición
    cards.js / portraits.js  colección de cartas, THEME BONUS, recompensas, retratos originales
    render/                Canvas: fondo, pista/carriles, notas, efectos
  components/              Game, GameHeader, GameTrack, ScoreDisplay, ComboDisplay, EnergyBar,
                           RaveBonus, CharacterCard, ThemeBonus, GameControls, PauseOverlay,
                           JudgmentDisplay, StartScreen, ResultsScreen, CardCollection, KeyConfig
```

- Un único bucle `requestAnimationFrame` (en `GameTrack`) actualiza el motor y dibuja.
- El tiempo de canción sale siempre del reloj de audio: música y notas avanzan juntas,
  y al pausar/reanudar se continúa desde el mismo punto (con cuenta atrás de 3 s).
- Cambiar de pestaña pausa la partida; redimensionar o girar el móvil no la reinicia.

## Puntuación

`puntos = base(juicio) × combo(hasta ×1.4) × RAVE(+10 %/nivel, máx. Lv.5) × THEME BONUS × tipo de nota (★ ×1.5, larga ×1.1) × CARD BONUS (×1.1 si el color coincide con la carta activa)`

| Juicio    | Normal  | Puntos | Energía |
|-----------|---------|--------|---------|
| S PERFECT | ±42 ms  | 1200   | +1.2    |
| PERFECT   | ±82 ms  | 1000   | +0.8    |
| GOOD      | ±135 ms | 500    | +0.2    |
| MISS      | —       | 0      | −8      |

Si la energía llega a 0 la partida termina (STAGE FAILED).
