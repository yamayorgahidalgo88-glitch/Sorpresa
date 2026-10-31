// Herramientas de barbero en 3D (tijeras, navaja, peine, máquina y poste) en oro
// y acero. Un solo lienzo fijo detrás de la página: las herramientas rodean el
// logo en la portada y vuelven a aparecer junto a los precios y en el cierre,
// enganchadas al contenido mientras haces scroll.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function initTools(canvas, { reduceMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();

  // Estudio fotográfico: tiras de luz sobre negro, para que el metal refleje
  // como en una foto de producto y no como plástico gris.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x050403);
  const strip = (w, h, color, intensity, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.rotation.set(...rot);
    studio.add(m);
  };
  strip(14, 2.2, 0xffffff, 6, [0, 7, 2], [Math.PI / 2, 0, 0]);
  strip(2.2, 12, 0xfff1d6, 4.5, [-8, 1, 3], [0, Math.PI / 2, 0]);
  strip(1.4, 12, 0xffe2a8, 3.5, [8, 0, -2], [0, -Math.PI / 2, 0]);
  strip(10, 1.2, 0xd4a852, 2.5, [0, -6, -4], [-Math.PI / 3, 0, 0]);
  strip(12, 9, 0xfff3dc, 2.6, [0, 1, 11], [0, Math.PI, 0]);
  strip(3, 3, 0xffffff, 6, [-5, 5, 8], [0, Math.PI * 0.8, 0]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio, 0.02).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const CAM_Z = 14;
  camera.position.set(0, 0, CAM_Z);

  const key = new THREE.DirectionalLight(0xffe7c0, 2.0);
  key.position.set(5, 7, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe8b860, 2.6);
  rim.position.set(-7, -1, -6);
  scene.add(rim);

  // ---------- Materiales ----------
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xdcb05a, metalness: 1, roughness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.15, side: THREE.DoubleSide, envMapIntensity: 1.4 });
  const goldSatin = new THREE.MeshPhysicalMaterial({ color: 0xc89b45, metalness: 1, roughness: 0.38, side: THREE.DoubleSide, envMapIntensity: 1.2 });
  const mirror = new THREE.MeshPhysicalMaterial({ color: 0xf2f0ea, metalness: 1, roughness: 0.06, side: THREE.DoubleSide, envMapIntensity: 1.6 });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xdedbd3, metalness: 1, roughness: 0.22, side: THREE.DoubleSide, envMapIntensity: 1.3 });
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x0d0c0a, metalness: 0.2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide, envMapIntensity: 1.2 });

  const extrude = (shape, depth, bevel = 0.02, size = bevel, segs = 3) =>
    new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: size, bevelSegments: segs, curveSegments: 32 }).center();

  // ---------- Tijeras ----------
  function makeScissors() {
    const group = new THREE.Group();
    const half = (mirrorSide) => {
      const g = new THREE.Group();
      const blade = new THREE.Shape();
      blade.moveTo(-0.1, 0);
      blade.lineTo(0.12, 0);
      blade.quadraticCurveTo(0.2, 1.2, 0.015, 2.5);
      blade.quadraticCurveTo(-0.06, 1.3, -0.1, 0);
      const bg = extrude(blade, 0.02, 0.02, 0.035, 4);
      bg.translate(0, 1.25, 0);
      g.add(new THREE.Mesh(bg, gold));
      const shank = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, -0.45, 0), new THREE.Vector3(0.36, -0.86, 0)]),
        24, 0.065, 12, false
      );
      g.add(new THREE.Mesh(shank, gold));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.075, 20, 64), gold);
      ring.position.set(0.5, -1.18, 0);
      ring.scale.set(1, 1.18, 1);
      g.add(ring);
      if (mirrorSide) g.scale.x = -1;
      g.position.z = mirrorSide ? 0.05 : -0.05;
      return g;
    };
    const a = half(false);
    const b = half(true);
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 32), mirror);
    screw.rotation.x = Math.PI / 2;
    group.add(a, b, screw);
    group.userData = { a, b };
    a.rotation.z = -0.32;
    b.rotation.z = 0.32;
    return group;
  }

  // ---------- Navaja: hoja vaciada con un bisel ancho que hace de espejo ----------
  function makeRazor() {
    const group = new THREE.Group();
    const handleShape = new THREE.Shape();
    handleShape.moveTo(0, -0.17);
    handleShape.lineTo(2.1, -0.15);
    handleShape.quadraticCurveTo(2.35, 0, 2.1, 0.15);
    handleShape.lineTo(0, 0.17);
    handleShape.quadraticCurveTo(-0.22, 0, 0, -0.17);
    const handle = new THREE.Mesh(extrude(handleShape, 0.1, 0.04, 0.04, 4), lacquer);
    handle.position.x = 1.05;
    group.add(handle);
    for (const x of [0.12, 2.0]) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 24), gold);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(x, 0, 0);
      group.add(pin);
    }
    const pivot = new THREE.Group();
    const spine = new THREE.Shape();
    spine.moveTo(0.1, 0.24);
    spine.lineTo(1.95, 0.28);
    spine.lineTo(1.98, 0.36);
    spine.lineTo(0.25, 0.33);
    spine.lineTo(0.1, 0.24);
    const spineMesh = new THREE.Mesh(extrude(spine, 0.05, 0.01), steel);
    spineMesh.position.set(1.04, 0.3, 0);
    const blade = new THREE.Shape();
    blade.moveTo(0, -0.05);
    blade.lineTo(1.75, -0.08);
    blade.quadraticCurveTo(2.05, -0.02, 1.98, 0.3);
    blade.lineTo(0.25, 0.26);
    blade.quadraticCurveTo(0.05, 0.24, 0, -0.05);
    const bladeMesh = new THREE.Mesh(extrude(blade, 0.008, 0.012, 0.07, 6), mirror);
    bladeMesh.position.set(1.0, 0.11, 0);
    const tang = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.1, 0.05, 2, 0.02), goldSatin);
    tang.position.set(-0.15, 0, 0);
    pivot.add(bladeMesh, spineMesh, tang);
    pivot.position.set(0.12, 0, 0.09);
    group.add(pivot);
    group.userData = { pivot };
    pivot.rotation.z = Math.PI * 0.82;
    return group;
  }

  // ---------- Peine ----------
  function makeComb() {
    const s = new THREE.Shape();
    const L = 2.8, spineH = 0.34, tooth = 0.56;
    s.moveTo(0, 0);
    s.lineTo(L, 0);
    s.lineTo(L, -spineH);
    let x = L;
    const step = (w, gap, until) => {
      while (x - w - gap > until) {
        s.lineTo(x, -spineH - tooth);
        s.lineTo(x - w, -spineH - tooth);
        s.lineTo(x - w, -spineH);
        s.lineTo(x - w - gap, -spineH);
        x -= w + gap;
      }
    };
    step(0.045, 0.045, L / 2);
    step(0.07, 0.07, 0.1);
    s.lineTo(0, -spineH);
    s.lineTo(0, 0);
    return new THREE.Mesh(extrude(s, 0.05, 0.02, 0.012), gold);
  }

  // ---------- Máquina: cuerpo cónico, cuchilla, palanca y cable ----------
  function makeClipper() {
    const group = new THREE.Group();
    const body = new THREE.Shape();
    body.moveTo(-0.36, -1.2);
    body.quadraticCurveTo(-0.46, 0.1, -0.5, 1.0);
    body.lineTo(0.5, 1.0);
    body.quadraticCurveTo(0.46, 0.1, 0.36, -1.2);
    body.quadraticCurveTo(0, -1.38, -0.36, -1.2);
    group.add(new THREE.Mesh(extrude(body, 0.34, 0.14, 0.12, 6), lacquer));
    const grip = new THREE.Shape();
    grip.moveTo(-0.47, 0.25);
    grip.lineTo(0.47, 0.25);
    grip.lineTo(0.48, 0.42);
    grip.lineTo(-0.48, 0.42);
    grip.lineTo(-0.47, 0.25);
    const gripMesh = new THREE.Mesh(extrude(grip, 0.64, 0.02), goldSatin);
    gripMesh.position.y = 0.33;
    group.add(gripMesh);
    const head = new THREE.Mesh(new RoundedBoxGeometry(1.06, 0.24, 0.5, 3, 0.06), gold);
    head.position.y = 1.12;
    group.add(head);
    const guard = new THREE.Mesh(new RoundedBoxGeometry(1.02, 0.1, 0.36, 2, 0.03), mirror);
    guard.position.set(0, 1.28, 0.06);
    group.add(guard);
    const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.032, 0.16, 0.05), mirror, 20);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 20; i++) {
      m.makeTranslation(-0.48 + i * 0.0505, 1.4, 0.16);
      teeth.setMatrixAt(i, m);
    }
    group.add(teeth);
    const lever = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.5, 0.12, 2, 0.03), gold);
    lever.position.set(0.55, 0.78, 0);
    lever.rotation.z = -0.35;
    group.add(lever);
    const sw = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.36, 0.06, 3, 0.03), gold);
    sw.position.set(0, -0.15, 0.3);
    group.add(sw);
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 12, 32), goldSatin);
    cord.position.set(0, -1.32, 0);
    cord.rotation.x = Math.PI / 2;
    group.add(cord);
    return group;
  }

  // ---------- Poste ----------
  function makePole() {
    const group = new THREE.Group();
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#efe7d6';
    g.fillRect(0, 0, 256, 256);
    g.save();
    g.translate(128, 128);
    g.rotate(-Math.PI / 4);
    const colors = ['#c99a3f', '#efe7d6', '#0e0d0b', '#efe7d6'];
    for (let i = -8; i < 8; i++) {
      g.fillStyle = colors[((i % 4) + 4) % 4];
      g.fillRect(-300, i * 32, 600, 32);
    }
    g.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2.2);
    group.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 2.6, 48, 1, true),
      new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.9 })
    ));
    group.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 2.6, 48, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0, clearcoat: 1, envMapIntensity: 1.6 })
    ));
    for (const y of [1.42, -1.42]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.24, 48), gold);
      cap.position.y = y;
      group.add(cap);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.04, 12, 48), gold);
      lip.position.y = y + (y > 0 ? -0.12 : 0.12);
      lip.rotation.x = Math.PI / 2;
      group.add(lip);
    }
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 24), gold);
    ball.position.y = 1.78;
    group.add(ball);
    group.userData = { tex };
    return group;
  }

  // ---------- Herramientas ----------
  const tools = {
    scissors: { obj: makeScissors(), rest: new THREE.Euler(0.3, -0.4, -0.75), phase: 0 },
    razor: { obj: makeRazor(), rest: new THREE.Euler(-0.3, 0.5, 0.35), phase: 1.7 },
    comb: { obj: makeComb(), rest: new THREE.Euler(0.2, 0.28, -0.2), phase: 3.4 },
    clipper: { obj: makeClipper(), rest: new THREE.Euler(0.25, -0.6, 0.45), phase: 5.1 },
    pole: { obj: makePole(), rest: new THREE.Euler(0.05, 0, 0.12), phase: 6.8 },
  };
  for (const t of Object.values(tools)) {
    t.wrap = new THREE.Group();
    t.wrap.add(t.obj);
    t.obj.rotation.copy(t.rest);
    t.cur = null;
    scene.add(t.wrap);
  }

  // ---------- Escenas: dónde aparece cada herramienta ----------
  // Cada pose se ancla a un elemento de la página: [ax, ay] es el punto dentro
  // de su caja (0–1), z la profundidad, s la escala y spin un giro extra.
  const STAGES = {
    wide: [
      {
        anchor: '.hero',
        poses: {
          scissors: { ax: 0.82, ay: 0.3, z: 0.2, s: 0.62 },
          razor: { ax: 0.17, ay: 0.27, z: -0.6, s: 0.9 },
          comb: { ax: 0.22, ay: 0.8, z: 0.4, s: 0.8 },
          clipper: { ax: 0.81, ay: 0.73, z: -0.2, s: 0.85 },
          pole: { ax: 0.05, ay: 0.5, z: -3.2, s: 0.9 },
        },
      },
      {
        anchor: '#servicios .section__head',
        poses: {
          clipper: { ax: 0.6, ay: 0.14, z: 0, s: 0.5, spin: 0.8 },
          razor: { ax: 0.86, ay: 0.02, z: -1, s: 0.55, spin: -0.6 },
        },
      },
      {
        anchor: '.close',
        poses: {
          pole: { ax: 0.1, ay: 0.5, z: 0, s: 1.05 },
          scissors: { ax: 0.87, ay: 0.36, z: 0.5, s: 0.6, spin: 1.2 },
          comb: { ax: 0.8, ay: 0.76, z: -1, s: 0.55, spin: -0.4 },
        },
      },
    ],
    narrow: [
      {
        anchor: '.hero',
        poses: {
          scissors: { ax: 0.79, ay: 0.16, z: 0, s: 0.5 },
          razor: { ax: 0.2, ay: 0.15, z: -0.4, s: 0.56 },
          comb: { ax: 0.24, ay: 0.85, z: 0.2, s: 0.55 },
          clipper: { ax: 0.8, ay: 0.84, z: -0.2, s: 0.52 },
        },
      },
      {
        anchor: '.close',
        poses: {
          pole: { ax: 0.5, ay: 0.16, z: 0, s: 0.62 },
          scissors: { ax: 0.82, ay: 0.14, z: 0.3, s: 0.42, spin: 1.2 },
        },
      },
    ],
  };

  let width = 1, height = 1, stages = [];
  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const wide = camera.aspect > 1.1;
    camera.fov = wide ? 32 : 44;
    camera.updateProjectionMatrix();
    stages = (wide ? STAGES.wide : STAGES.narrow).map((s) => ({ ...s, el: document.querySelector(s.anchor) })).filter((s) => s.el);
  }
  resize();
  window.addEventListener('resize', resize);

  const worldH = () => 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  // ---------- Puntero ----------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // ---------- Animación ----------
  const clock = new THREE.Clock();
  const start = performance.now();
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  function targets() {
    const H = worldH();
    const W = H * camera.aspect;
    const out = {};
    for (const name of Object.keys(tools)) out[name] = { x: 0, y: 0, z: 0, s: 0, spin: 0, w: 0 };
    for (const st of stages) {
      const r = st.el.getBoundingClientRect();
      const vis = Math.max(0, Math.min(r.bottom, height) - Math.max(r.top, 0));
      const w = Math.min(1, vis / Math.max(1, Math.min(r.height * 0.85, height * 0.55)));
      if (w <= 0) continue;
      const ww = w * w * (3 - 2 * w);
      for (const [name, p] of Object.entries(st.poses)) {
        const o = out[name];
        o.x += ww * ((r.left + p.ax * r.width) / width - 0.5) * W;
        o.y += ww * (0.5 - (r.top + p.ay * r.height) / height) * H;
        o.z += ww * p.z;
        o.s += ww * p.s;
        o.spin += ww * (p.spin || 0);
        o.w += ww;
      }
    }
    return out;
  }

  function frame(now = performance.now()) {
    const t = clock.getElapsedTime();
    const intro = reduceMotion ? 1 : Math.min(1, (now - start) / 1800);

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    camera.position.x = pointer.x * 0.7;
    camera.position.y = -pointer.y * 0.45;
    camera.lookAt(camera.position.x * 0.3, camera.position.y * 0.3, 0);

    const tg = targets();
    let anyVisible = false;
    Object.entries(tools).forEach(([name, tool], i) => {
      const g = tg[name];
      const local = reduceMotion ? 1 : easeOut(Math.min(1, Math.max(0, intro * 1.6 - i * 0.12)));
      let x, y, z, s, spin;
      if (g.w > 0.001) {
        const n = Math.max(1, g.w);
        x = g.x / n; y = g.y / n; z = g.z / n; spin = g.spin / n;
        s = (g.s / n) * Math.min(1, g.w);
        tool.lastX = x; tool.lastY = y;
      } else {
        x = tool.lastX ?? 0; y = tool.lastY ?? 0; z = -6; s = 0; spin = 0;
      }
      if (!tool.cur) tool.cur = { x, y, z, s, spin };
      // Llegan con inercia: se las ve viajar entre secciones. En vertical siguen
      // al contenido más de cerca para no despegarse al hacer scroll.
      const c = tool.cur;
      const k = reduceMotion ? 1 : 0.12;
      c.x += (x - c.x) * k;
      c.y += (y - c.y) * (reduceMotion ? 1 : 0.35);
      c.z += (z - c.z) * k;
      c.s += (s - c.s) * k;
      c.spin += (spin - c.spin) * (reduceMotion ? 1 : 0.06);

      const bob = reduceMotion ? 0 : Math.sin(t * 0.9 + tool.phase) * 0.12;
      tool.wrap.position.set(c.x, c.y + bob, c.z - (1 - local) * 14);
      const sc = c.s * (0.2 + 0.8 * local);
      tool.wrap.scale.setScalar(Math.max(0.0001, sc));
      tool.wrap.visible = sc > 0.01;
      if (tool.wrap.visible) anyVisible = true;
      tool.wrap.rotation.y = reduceMotion ? c.spin : Math.sin(t * 0.35 + tool.phase) * 0.35 + pointer.x * 0.35 + (1 - local) * 3 + c.spin;
      tool.wrap.rotation.x = reduceMotion ? 0 : Math.cos(t * 0.3 + tool.phase) * 0.18 + pointer.y * 0.2;
    });

    if (!reduceMotion) {
      // Tijeras: corte rápido cada pocos segundos
      const sc = tools.scissors.obj.userData;
      const snip = (t % 2.6) / 2.6;
      let open;
      if (snip < 0.08) open = 0.34 * (1 - snip / 0.08);
      else if (snip < 0.32) open = 0.34 * easeOut((snip - 0.08) / 0.24);
      else open = 0.34;
      sc.a.rotation.z = -open;
      sc.b.rotation.z = open;
      // Navaja: se abre y se cierra despacio
      tools.razor.obj.userData.pivot.rotation.z = Math.PI * (0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.6)));
      // Poste: las rayas suben mientras gira
      tools.pole.obj.userData.tex.offset.y = -t * 0.25;
      tools.pole.obj.rotation.y = t * 0.4;
    }

    if (anyVisible || intro < 1) renderer.render(scene, camera);
    else renderer.clear();
  }

  let running = false;
  let raf = 0;
  const loop = (now) => {
    frame(now);
    raf = requestAnimationFrame(loop);
  };
  const play = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  if (reduceMotion) {
    const once = () => requestAnimationFrame(() => frame());
    window.addEventListener('scroll', once, { passive: true });
    window.addEventListener('resize', once);
    once();
  } else {
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
    play();
  }

  return { renderer, pause, play };
}
