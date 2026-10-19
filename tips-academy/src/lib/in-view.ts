/** Ejecuta `cb` una sola vez cuando el elemento entra en pantalla (IntersectionObserver: sin coste en cada scroll). */
export function whenInView(el: Element, cb: () => void, rootMargin = "0px 0px -15% 0px") {
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        io.disconnect()
        cb()
      }
    },
    { rootMargin }
  )
  io.observe(el)
  return () => io.disconnect()
}

/** Avisa cada vez que el elemento entra o sale de pantalla (para pausar animaciones infinitas fuera de vista). */
export function onVisibility(el: Element, cb: (visible: boolean) => void, rootMargin = "100px") {
  const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin })
  io.observe(el)
  return () => io.disconnect()
}
