import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ARENA } from '../sim/data/arena';
import { PAL } from './palette';
import { setMaxAnisotropy } from './textures';

export type Quality = 'alto' | 'medio' | 'bajo';

/** Ajustes por nivel de calidad (móviles modestos usan 'medio' o 'bajo'). */
const QUALITY: Record<Quality, { pixelRatio: number; shadows: boolean; shadowMap: number; bloom: boolean }> = {
  alto: { pixelRatio: 2, shadows: true, shadowMap: 2048, bloom: true },
  medio: { pixelRatio: 1.5, shadows: true, shadowMap: 1024, bloom: false },
  bajo: { pixelRatio: 1, shadows: false, shadowMap: 512, bloom: false },
};

export function defaultQuality(): Quality {
  const fromUrl = new URLSearchParams(location.search).get('calidad');
  if (fromUrl === 'alto' || fromUrl === 'medio' || fromUrl === 'bajo') return fromUrl;
  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return touch ? 'medio' : 'alto';
}

/**
 * Renderizador 3D del campo: escena, cámara en perspectiva inclinada (vista de juego de
 * estrategia móvil), sol con sombras suaves, luz de cielo, contraluz y bloom opcional.
 * Coordenadas: 1 unidad = 1 casilla; x = columna, z = fila de la simulación, y = altura.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  readonly settings: (typeof QUALITY)[Quality];
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  /** Fracción inferior de la pantalla reservada al HUD (el campo no se dibuja debajo). */
  hudFraction = 0.16;
  /** Fracción superior reservada a la barra de marcador. */
  topFraction = 0.015;
  /** Inclinación de la cámara de juego (grados sobre la horizontal). */
  pitchDeg = 58;
  /** >1: la escena se dibuja a resolución reducida y se amplía con píxeles nítidos (estilo pixel art). */
  pixelScale = 1;

  constructor(readonly canvas: HTMLCanvasElement, readonly quality: Quality = defaultQuality()) {
    this.settings = QUALITY[quality];
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.settings.pixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Tone mapping neutro: respeta los colores saturados del estilo juguete.
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = this.settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    setMaxAnisotropy(this.renderer.capabilities.getMaxAnisotropy());
    // Estadísticas del fotograma completo (todas las pasadas), no solo de la última.
    this.renderer.info.autoReset = false;

    this.scene.background = new THREE.Color(PAL.sky);
    this.scene.fog = new THREE.Fog(PAL.fog, 48, 95);

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.5, 250);

    // Luz de cielo + sol cálido desde arriba a la izquierda + contraluz fría para siluetas.
    this.scene.add(new THREE.HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.15));
    this.sun = new THREE.DirectionalLight(PAL.sun, 2.4);
    this.sun.position.set(ARENA.width / 2 - 14, 26, ARENA.height / 2 + 10);
    this.sun.target.position.set(ARENA.width / 2, 0, ARENA.height / 2);
    this.sun.castShadow = this.settings.shadows;
    const s = this.sun.shadow;
    s.mapSize.set(this.settings.shadowMap, this.settings.shadowMap);
    s.camera.left = -22;
    s.camera.right = 22;
    s.camera.top = 26;
    s.camera.bottom = -26;
    s.camera.near = 1;
    s.camera.far = 80;
    s.bias = -0.0006;
    s.normalBias = 0.03;
    s.radius = 3;
    this.scene.add(this.sun, this.sun.target);
    const rim = new THREE.DirectionalLight(PAL.rim, 0.7);
    rim.position.set(ARENA.width / 2 + 10, 12, -12);
    this.scene.add(rim);

    if (this.settings.bloom) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      // Umbral alto: solo brillan los efectos emisivos (rayos, cristales), no el escenario.
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.45, 0.82);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
  }

  resize(width: number, height: number): void {
    if (this.pixelScale > 1) {
      this.renderer.setPixelRatio(1 / this.pixelScale);
      this.canvas.style.imageRendering = 'pixelated';
    }
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.bloom?.resolution.set(width / 2, height / 2);
    this.camera.aspect = width / height;
    this.fitGameCamera();
  }

  /**
   * Encuadre de juego: inclinación fija de ~57°, el jugador abajo. Ajusta la distancia para
   * que el campo completo (con las torres) quepa en la parte superior de la pantalla,
   * dejando libre la franja del HUD.
   */
  fitGameCamera(): void {
    const cam = this.camera;
    const target = new THREE.Vector3(ARENA.width / 2, 0, ARENA.height / 2 + 0.6);
    const pitch = THREE.MathUtils.degToRad(this.pitchDeg);
    const dir = new THREE.Vector3(0, Math.sin(pitch), Math.cos(pitch));
    const corners = [
      [-0.6, 0, -0.8], [ARENA.width + 0.6, 0, -0.8], [-0.6, 0, ARENA.height + 0.6], [ARENA.width + 0.6, 0, ARENA.height + 0.6],
      [9, 6.5, 2.2], // punta del tejado de la base rival
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const yMin = -1 + this.hudFraction * 2;
    let lo = 10;
    let hi = 160;
    for (let i = 0; i < 40; i++) {
      const d = (lo + hi) / 2;
      cam.position.copy(target).addScaledVector(dir, d);
      cam.lookAt(target);
      cam.updateMatrixWorld();
      cam.updateProjectionMatrix();
      const fits = corners.every((c) => {
        const p = c.clone().project(cam);
        return Math.abs(p.x) <= 0.99 && p.y <= 1 - this.topFraction * 2 && p.y >= yMin;
      });
      if (fits) hi = d;
      else lo = d;
    }
    cam.position.copy(target).addScaledVector(dir, hi);
    // Desplaza el encuadre hacia arriba para centrar el campo en la zona libre del HUD.
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    this.fitFog(hi);
  }

  /** La niebla solo afecta al decorado lejano, nunca al campo de juego. */
  fitFog(cameraDistance: number): void {
    const fog = this.scene.fog as THREE.Fog;
    fog.near = cameraDistance + 14;
    fog.far = cameraDistance + 70;
  }

  render(): void {
    this.renderer.info.reset();
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
