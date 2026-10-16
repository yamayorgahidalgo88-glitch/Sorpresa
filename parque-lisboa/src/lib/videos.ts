/**
 * Vídeos ambientales. Clips de Mixkit con «Stock Video Free License»
 * (uso comercial permitido, sin atribución): https://mixkit.co/license/
 * Son imágenes de estilo de vida ilustrativas: no muestran el centro ni a su equipo.
 *
 * Para usar vídeos propios o generados con IA, sustituye los archivos de
 * /public/videos manteniendo los nombres (ver README › Vídeos).
 */
export const videos = {
  hero: { name: "hero", source: "https://mixkit.co/free-stock-video/woman-stretching-in-the-morning-before-starting-her-day-31407/" },
  fisioterapia: { name: "fisioterapia", source: "https://mixkit.co/free-stock-video/girl-stretching-her-body-before-exercising-in-a-park-40761/" },
  rehabilitacion: { name: "rehabilitacion", source: "https://mixkit.co/free-stock-video/a-young-man-stretches-his-arms-on-the-balcony-50759/" },
  podologia: { name: "podologia", source: "https://mixkit.co/free-stock-video/feet-of-a-couple-of-people-walking-in-a-park-32616/" },
  respira: { name: "respira", source: "https://mixkit.co/free-stock-video/woman-meditating-and-breathing-deeply-42904/" },
} as const

export type VideoName = keyof typeof videos

export const posterSrc = (name: VideoName) => `/videos/${videos[name].name}-poster.webp`
