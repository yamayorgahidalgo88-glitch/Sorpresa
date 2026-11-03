import { useEffect, useRef } from 'react';
import { Renderer } from '../game/render/Renderer.js';
import { laneFromPoint } from '../game/perspective.js';
import { keyLabel } from '../game/constants.js';

// Canvas de la pista. Contiene el ÚNICO bucle de animación del juego:
// cada fotograma actualiza el motor (reloj de audio) y dibuja.
export default function GameTrack({ engine, deck, keys }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;
    const showKeys = !matchMedia('(pointer: coarse)').matches;
    const keyLabels = keys.map(keyLabel);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(window.innerWidth, window.innerHeight, dpr, deck);
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    let raf = 0;
    const loop = (perf) => {
      engine.update(perf);
      renderer.draw(engine, perf, { showKeys, keyLabels });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, [engine, deck, keys]);

  // Controles táctiles / ratón: multitáctil con Pointer Events
  useEffect(() => {
    const canvas = canvasRef.current;
    const active = new Map(); // pointerId -> carril
    const laneAt = (e) => {
      const g = rendererRef.current?.geom;
      if (!g) return -1;
      const rect = canvas.getBoundingClientRect();
      return laneFromPoint(g, e.clientX - rect.left, e.clientY - rect.top);
    };
    const onDown = (e) => {
      e.preventDefault();
      const lane = laneAt(e);
      if (lane < 0) return;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura */
      }
      active.set(e.pointerId, lane);
      engine.press(lane, e.timeStamp);
    };
    const onMove = (e) => {
      if (!active.has(e.pointerId)) return;
      const lane = laneAt(e);
      const prev = active.get(e.pointerId);
      if (lane >= 0 && lane !== prev) {
        // deslizar el dedo a otro carril
        engine.release(prev, e.timeStamp);
        active.set(e.pointerId, lane);
        engine.press(lane, e.timeStamp);
      }
    };
    const onUp = (e) => {
      if (!active.has(e.pointerId)) return;
      engine.release(active.get(e.pointerId), e.timeStamp);
      active.delete(e.pointerId);
    };
    const noMenu = (e) => e.preventDefault();
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('lostpointercapture', onUp);
    canvas.addEventListener('contextmenu', noMenu);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('lostpointercapture', onUp);
      canvas.removeEventListener('contextmenu', noMenu);
    };
  }, [engine]);

  return <canvas ref={canvasRef} className="track-canvas" aria-label="Pista de juego" />;
}
