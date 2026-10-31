// Herramientas de barbero en 3D: tijeras, navaja, peine, máquina y poste,
// en oro y acero, flotando alrededor del logo. Siguen al puntero y se
// dispersan al hacer scroll.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const key = new THREE.DirectionalLight(0xffe4b5, 2.4);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd4a852, 3.2);
  rim.position.set(-6, -2, -6);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x2a2418, 0.6));

  // ---------- Materiales ----------
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd9ad57, metalness: 1, roughness: 0.24, clearcoat: 0.4, clearcoatRoughness: 0.2, side: THREE.DoubleSide, envMapIntensity: 1.25 });
  const goldSatin = new THREE.MeshPhysicalMaterial({ color: 0xc89b45, metalness: 1, roughness: 0.42, side: THREE.DoubleSide });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xe9e6df, metalness: 1, roughness: 0.16, side: THREE.DoubleSide, envMapIntensity: 1.3 });
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x0e0d0b, metalness: 0.3, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide });

  const extrude = (shape, depth, bevel = 0.02) =>
    new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 28 }).center();

  // ---------- Tijeras ----------
  function makeScissors() {
    const group = new THREE.Group();
    const half = (mirror) => {
      const g = new THREE.Group();
      const blade = new THREE.Shape();
      blade.moveTo(-0.1, 0);
      blade.lineTo(0.12, 0);
      blade.quadraticCurveTo(0.2, 1.2, 0.015, 2.5);
      blade.quadraticCurveTo(-0.06, 1.3, -0.1, 0);
      const bg = extrude(blade, 0.04, 0.015);
      bg.translate(0, 1.25, 0);
      const bladeMesh = new THREE.Mesh(bg, gold);
      g.add(bladeMesh);
      const shank = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, -0.45, 0), new THREE.Vector3(0.36, -0.86, 0)]),
        24, 0.065, 12, false
      );
      g.add(new THREE.Mesh(shank, gold));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.075, 20, 64), gold);
      ring.position.set(0.5, -1.18, 0);
      ring.scale.set(1, 1.18, 1);
      g.add(ring);
      if (mirror) g.scale.x = -1;
      g.position.z = mirror ? 0.05 : -0.05;
      return g;
    };
    const a = half(false);
    const b = half(true);
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 32), steel);
    screw.rotation.x = Math.PI / 2;
    group.add(a, b, screw);
    group.userData = { a, b, open: 0.32 };
    a.rotation.z = -0.32;
    b.rotation.z = 0.32;
    return group;
  }

  // ---------- Navaja ----------
  function makeRazor() {
    const group = new THREE.Group();
    const handleShape = new THREE.Shape();
    handleShape.moveTo(0, -0.17);
    handleShape.lineTo(2.1, -0.15);
    handleShape.quadraticCurveTo(2.35, 0, 2.1, 0.15);
    handleShape.lineTo(0, 0.17);
    handleShape.quadraticCurveTo(-0.22, 0, 0, -0.17);
    const handle = new THREE.Mesh(extrude(handleShape, 0.12, 0.03), lacquer);
    handle.position.x = 1.05;
    group.add(handle);
    for (const x of [0.12, 2.0]) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 24), gold);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(x, 0, 0);
      group.add(pin);
    }
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, -0.05);
    bladeShape.lineTo(1.75, -0.08);
    bladeShape.quadraticCurveTo(2.05, -0.02, 1.98, 0.36);
    bladeShape.lineTo(0.25, 0.32);
    bladeShape.quadraticCurveTo(0.05, 0.3, 0, -0.05);
    const blade = new THREE.Mesh(extrude(bladeShape, 0.03, 0.01), steel);
    const pivot = new THREE.Group();
    blade.position.set(1.0, 0.13, 0);
    const tang = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.05), goldSatin);
    tang.position.set(-0.15, 0, 0);
    pivot.add(blade, tang);
    pivot.position.set(0.12, 0, 0.09);
    group.add(pivot);
    group.userData = { pivot };
    pivot.rotation.z = Math.PI * 0.82;
    return group;
  }

  // ---------- Peine ----------
  function makeComb() {
    const s = new THREE.Shape();
    const L = 2.8, spine = 0.34, tooth = 0.56;
    s.moveTo(0, 0);
    s.lineTo(L, 0);
    s.lineTo(L, -spine);
    let x = L;
    const step = (w, gap, until) => {
      while (x - w - gap > until) {
        s.lineTo(x, -spine - tooth);
        s.lineTo(x - w, -spine - tooth);
        s.lineTo(x - w, -spine);
        s.lineTo(x - w - gap, -spine);
        x -= w + gap;
      }
    };
    step(0.045, 0.045, L / 2); // púas finas
    step(0.07, 0.07, 0.1); // púas anchas
    s.lineTo(0, -spine);
    s.lineTo(0, 0);
    const geo = extrude(s, 0.07, 0.012);
    return new THREE.Mesh(geo, gold);
  }

  // ---------- Máquina ----------
  function makeClipper() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.95, 2.5, 0.62, 6, 0.3), lacquer);
    group.add(body);
    const band = new THREE.Mesh(new RoundedBoxGeometry(0.99, 0.16, 0.66, 4, 0.06), gold);
    band.position.y = 0.4;
    group.add(band);
    const head = new THREE.Mesh(new RoundedBoxGeometry(1.02, 0.22, 0.5, 3, 0.05), gold);
    head.position.y = 1.32;
    group.add(head);
    const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.14, 0.06), steel, 18);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 18; i++) {
      m.makeTranslation(-0.46 + i * 0.054, 1.5, 0.12);
      teeth.setMatrixAt(i, m);
    }
    group.add(teeth);
    const sw = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.42, 0.08, 3, 0.04), gold);
    sw.position.set(0, -0.2, 0.33);
    group.add(sw);
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
    const stripes = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 2.6, 48, 1, true),
      new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 })
    );
    group.add(stripes);
    for (const y of [1.42, -1.42]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.24, 48), gold);
      cap.position.y = y;
      group.add(cap);
    }
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 24), gold);
    ball.position.y = 1.78;
    group.add(ball);
    group.userData = { tex };
    return group;
  }

  // ---------- Composición ----------
  const tools = [
    { name: 'scissors', obj: makeScissors(), rest: new THREE.Euler(0.3, -0.4, -0.75), scale: 1 },
    { name: 'razor', obj: makeRazor(), rest: new THREE.Euler(-0.3, 0.5, 0.35), scale: 1 },
    { name: 'comb', obj: makeComb(), rest: new THREE.Euler(0.5, 0.3, -0.25), scale: 0.95 },
    { name: 'clipper', obj: makeClipper(), rest: new THREE.Euler(0.25, -0.6, 0.45), scale: 0.95 },
    { name: 'pole', obj: makePole(), rest: new THREE.Euler(0.05, 0, 0.12), scale: 0.95 },
  ];
  tools.forEach((t, i) => {
    t.phase = i * 1.7;
    t.wrap = new THREE.Group();
    t.wrap.add(t.obj);
    t.obj.rotation.copy(t.rest);
    scene.add(t.wrap);
  });

  // Posiciones según el formato de pantalla: alrededor del logo, nunca encima
  function layout(aspect) {
    const wide = aspect > 1.1;
    // [x, y, z, escala]
    const P = wide
      ? {
          scissors: [4.6, 1.75, 0.2, 0.62],
          razor: [-4.7, 1.9, -0.6, 0.9],
          comb: [-4.2, -2.3, 0.4, 0.85],
          clipper: [4.4, -2.1, -0.2, 0.85],
          pole: [-6.9, 0.0, -3.2, 0.9],
        }
      : {
          scissors: [1.5, 3.7, 0, 0.5],
          razor: [-1.55, 3.75, -0.4, 0.56],
          comb: [-1.3, -3.75, 0.2, 0.55],
          clipper: [1.6, -3.7, -0.2, 0.52],
          pole: [0, 0, -9, 0],
        };
    const k = wide ? Math.min(1.2, aspect / 1.6) : 1;
    tools.forEach((t) => {
      const p = P[t.name];
      t.base = new THREE.Vector3(p[0] * k, p[1], p[2]);
      t.layoutScale = p[3];
      t.wrap.visible = p[3] > 0;
    });
  }

  let width = 0, height = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 44 : 32;
    camera.updateProjectionMatrix();
    layout(camera.aspect);
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- Interacción ----------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollP = 0;
  const hero = canvas.parentElement;
  const onScroll = () => {
    const h = hero.offsetHeight || window.innerHeight;
    scrollP = Math.min(1, Math.max(0, window.scrollY / h));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Animación ----------
  const clock = new THREE.Clock();
  const start = performance.now();
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  let snipT = 0;

  function frame(now = performance.now()) {
    const t = clock.getElapsedTime();
    const intro = reduceMotion ? 1 : Math.min(1, (now - start) / 1800);

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    camera.position.x = pointer.x * 0.9;
    camera.position.y = -pointer.y * 0.6;
    camera.lookAt(0, 0, 0);

    tools.forEach((tool, i) => {
      const local = reduceMotion ? 1 : easeOut(Math.min(1, Math.max(0, intro * 1.6 - i * 0.12)));
      const spread = 1 + scrollP * 0.9;
      const bob = reduceMotion ? 0 : Math.sin(t * 0.9 + tool.phase) * 0.14;
      tool.wrap.position.set(
        tool.base.x * spread,
        tool.base.y * spread + bob + scrollP * 2.2 * Math.sign(tool.base.y || 1),
        tool.base.z - (1 - local) * 14 + scrollP * 2
      );
      tool.wrap.scale.setScalar(tool.scale * tool.layoutScale * (0.2 + 0.8 * local));
      if (!reduceMotion) {
        tool.wrap.rotation.y = Math.sin(t * 0.35 + tool.phase) * 0.35 + pointer.x * 0.35 + (1 - local) * 3;
        tool.wrap.rotation.x = Math.cos(t * 0.3 + tool.phase) * 0.18 + pointer.y * 0.2 + scrollP * 1.4;
      }
    });

    // Tijeras: corte rápido cada pocos segundos
    const sc = tools[0].obj.userData;
    if (!reduceMotion) {
      snipT = (t % 2.6) / 2.6;
      let open;
      if (snipT < 0.08) open = 0.34 * (1 - snipT / 0.08);
      else if (snipT < 0.32) open = 0.34 * easeOut((snipT - 0.08) / 0.24);
      else open = 0.34;
      sc.a.rotation.z = -open;
      sc.b.rotation.z = open;
    }

    // Navaja: se abre y se cierra despacio
    const rz = tools[1].obj.userData;
    if (!reduceMotion) rz.pivot.rotation.z = Math.PI * (0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.6)));

    // Poste: las rayas suben
    const pole = tools[4].obj.userData;
    if (!reduceMotion) pole.tex.offset.y = -t * 0.25;
    tools[4].obj.rotation.y = reduceMotion ? 0.4 : t * 0.4;

    canvas.style.opacity = String(1 - Math.min(1, scrollP * 1.15));
    renderer.render(scene, camera);
  }

  let running = false;
  let raf = 0;
  const loop = (now) => {
    frame(now);
    raf = requestAnimationFrame(loop);
  };
  const play = () => {
    if (running || reduceMotion) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  if (reduceMotion) {
    frame();
    window.addEventListener('resize', () => frame());
  } else {
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()), { threshold: 0 });
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
    play();
  }

  return { renderer, pause, play };
}
