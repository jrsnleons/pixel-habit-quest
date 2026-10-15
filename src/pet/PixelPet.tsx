import { useEffect, useMemo, useState } from 'react'
import type { PetLook } from '../lib/types'
import { buildSprite, CANVAS_H, CANVAS_W, type Face } from './sprites'

interface Props {
  look: PetLook
  face: Face
  crown?: boolean
  /** Blink every few seconds when the face has open eyes. */
  blink?: boolean
  className?: string
  title?: string
}

export function PixelPet({ look, face, crown, blink = true, className, title }: Props) {
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    if (!blink || face !== 'normal') return
    let timer: number
    const loop = () => {
      timer = window.setTimeout(() => {
        setBlinking(true)
        timer = window.setTimeout(() => {
          setBlinking(false)
          loop()
        }, 160)
      }, 2600 + Math.random() * 2400)
    }
    loop()
    return () => window.clearTimeout(timer)
  }, [blink, face])

  const shown: Face = blinking && face === 'normal' ? 'blink' : face
  const rects = useMemo(() => {
    const grid = buildSprite({ ...look, face: shown, crown })
    // Merge horizontal runs of one colour into a single rect.
    const out: { x: number; y: number; w: number; c: string }[] = []
    grid.forEach((row, y) => {
      let x = 0
      while (x < row.length) {
        const c = row[x]
        if (!c) {
          x++
          continue
        }
        let w = 1
        while (row[x + w] === c) w++
        out.push({ x, y, w, c })
        x += w
      }
    })
    return out
  }, [look, shown, crown])

  return (
    <svg
      className={className}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  )
}
