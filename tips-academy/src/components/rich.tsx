import { Fragment } from "react"

/**
 * Texto con negritas: lo que va entre **dobles asteriscos** se marca con <strong>.
 * Se usa con moderación para destacar las ideas clave de cada apartado.
 */
export function Rich({ text }: { text: string }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className="font-semibold text-ink">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}
