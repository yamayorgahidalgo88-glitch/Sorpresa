"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

/** Cruz con esquinas redondeadas (símbolo del logotipo) como Shape 2D. */
function crossShape(arm = 0.55, len = 1.5, r = 0.18) {
  const s = new THREE.Shape()
  // Contorno en sentido horario empezando arriba-izquierda del brazo superior
  const pts: [number, number][] = [
    [-arm, len], [arm, len], [arm, arm], [len, arm], [len, -arm], [arm, -arm],
    [arm, -len], [-arm, -len], [-arm, -arm], [-len, -arm], [-len, arm], [-arm, arm],
  ]
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[(i - 1 + n) % n]
    const [cx, cy] = pts[i]
    const [nx, ny] = pts[(i + 1) % n]
    const v1 = new THREE.Vector2(px - cx, py - cy).normalize()
    const v2 = new THREE.Vector2(nx - cx, ny - cy).normalize()
    const a = new THREE.Vector2(cx + v1.x * r, cy + v1.y * r)
    const b = new THREE.Vector2(cx + v2.x * r, cy + v2.y * r)
    if (i === 0) s.moveTo(a.x, a.y)
    else s.lineTo(a.x, a.y)
    s.quadraticCurveTo(cx, cy, b.x, b.y)
  }
  s.closePath()
  return s
}

export default function GlassCrossScene({ onReady }: { onReady?: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // En táctiles/móviles: menos resolución y 30 fps para cuidar batería y fluidez.
    const lowPower = window.matchMedia("(pointer: coarse)").matches
    const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: "low-power" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.25 : 1.75))
    renderer.transmissionResolutionScale = lowPower ? 0.4 : 0.6
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute("aria-hidden", "true")
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(0, 0, 9)

    // Esferas de luz detrás de la cruz: el cristal las refracta (paleta de la marca)
    const orbs = new THREE.Group()
    const orbDefs: [number, number, number, number, string][] = [
      [-1.25, 0.95, -2.4, 1.05, "#acff36"],
      [1.4, -0.85, -2.8, 1.2, "#ddaa61"],
      [0.6, 1.6, -3.4, 0.9, "#849671"],
      [-1.5, -1.5, -3, 0.8, "#2e7d32"],
    ]
    for (const [x, y, z, r, c] of orbDefs) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 48, 48),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, roughness: 0.9 })
      )
      mesh.position.set(x, y, z)
      orbs.add(mesh)
    }
    scene.add(orbs)

    const geo = new THREE.ExtrudeGeometry(crossShape(), {
      depth: 0.55,
      bevelEnabled: true,
      bevelThickness: 0.18,
      bevelSize: 0.16,
      bevelSegments: 10,
      curveSegments: 16,
    })
    geo.center()
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#f3fbe9",
      transmission: 1,
      thickness: 1.2,
      roughness: 0.08,
      ior: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color("#cfe9c4"),
      attenuationDistance: 2.4,
      envMapIntensity: 1.1,
    })
    const cross = new THREE.Mesh(geo, glass)
    cross.rotation.set(-0.18, 0.2, 0.06)
    scene.add(cross)

    const key = new THREE.DirectionalLight("#fff4e0", 2.2)
    key.position.set(3, 4, 5)
    scene.add(key, new THREE.AmbientLight("#f7f1e8", 0.6))

    function resize() {
      const w = mount!.clientWidth
      const h = mount!.clientHeight
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = "100%"
      renderer.domElement.style.height = "100%"
      camera.aspect = w / h
      // Encaja la cruz en pantallas estrechas
      camera.position.z = w / h < 0.9 ? 10.5 : 9
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // Interacción suave con puntero y scroll
    const target = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    if (!reduce) window.addEventListener("pointermove", onPointer, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(mount)

    const timer = new THREE.Timer()
    let frame = 0
    let first = true
    let last = 0
    const minDelta = lowPower ? 1000 / 30 : 0
    const render = (now = 0) => {
      frame = requestAnimationFrame(render)
      if (!visible || document.hidden) return
      if (now - last < minDelta) return
      last = now
      timer.update()
      const t = timer.getElapsed()
      const scroll = Math.min(window.scrollY / window.innerHeight, 1.5)
      // Balanceo suave (nunca de canto) + respuesta al puntero y al scroll
      const ry = 0.38 * Math.sin(t * 0.35) + target.x * 0.3 + scroll * 0.45
      const rx = -0.18 + 0.08 * Math.sin(t * 0.5) + target.y * 0.15 - scroll * 0.2
      cross.rotation.y += (ry - cross.rotation.y) * 0.05
      cross.rotation.x += (rx - cross.rotation.x) * 0.05
      cross.position.y = Math.sin(t * 0.8) * 0.12
      orbs.rotation.z = t * 0.05
      orbs.position.x += (target.x * -0.25 - orbs.position.x) * 0.04
      renderer.render(scene, camera)
      if (first) {
        first = false
        onReady?.()
      }
    }
    if (reduce) {
      renderer.render(scene, camera)
      onReady?.()
    } else {
      render()
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onPointer)
      ro.disconnect()
      io.disconnect()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onReady])

  return <div ref={mountRef} className="absolute inset-0" />
}
