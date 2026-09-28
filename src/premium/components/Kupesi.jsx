/** Only Andrew's four approved website motifs are available here. */
import { useEffect, useRef, useState } from 'react'
import { APPROVED_MOTIF_KEYS, approvedMotif } from '../lib/motif-policy.js'

export const TILE_KEYS = APPROVED_MOTIF_KEYS

// Separated lesson squares draw each approved motif a little smaller, centred,
// so a flipped tile keeps its coloured frame (the original Option A
// footprint). Scale per motif from tapa-options-codex/original-a-cleaned/
// presentation.json; the ground still fills the whole tile.
const FRAME = { nest: .9473897298, leaf: .8941156175, lens: .8916136000, pinwheel: .8883287218 }

function Shape({ t, scale }) {
  const path = <path d={t.d} className="kp-fg" transform={`translate(0 ${t.h}) scale(.1 -.1)`} />
  return (
    <>
      <rect width={t.w} height={t.h} className="kp-bg" />
      {scale ? <g transform={`translate(${(1 - scale) / 2 * t.w} ${(1 - scale) / 2 * t.h}) scale(${scale})`}>{path}</g> : path}
    </>
  )
}

export function KupesiTile({ kind = 'leaf', invert = false, framed = false, size, className = '', style }) {
  const t = approvedMotif(kind, invert)
  return (
    <svg
      viewBox={`0 0 ${t.w} ${t.h}`}
      className={`kp-tile kp-${kind} ${invert ? 'is-invert' : ''} ${className}`}
      style={{ width: size, height: size && (size * t.h) / t.w, ...style }}
      aria-hidden="true"
    >
      <Shape t={t} scale={framed ? FRAME[kind] : undefined} />
    </svg>
  )
}

// All reusable bands draw from the same approved set.
const DEFAULT_SEQ = APPROVED_MOTIF_KEYS

export function KupesiBand({ tile = 56, seq = DEFAULT_SEQ, className = '', animate = true, count }) {
  const ref = useRef(null)
  const step = tile
  const [n, setN] = useState(count || 24)
  const [seen, setSeen] = useState(!animate)

  useEffect(() => {
    if (count) return
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setN(Math.ceil(e.contentRect.width / step) + 1))
    ro.observe(el)
    return () => ro.disconnect()
  }, [step, count])

  useEffect(() => {
    if (!animate) return
    const el = ref.current
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: .2 })
    io.observe(el)
    return () => io.disconnect()
  }, [animate])

  return (
    <div ref={ref} className={`kp-band ${seen ? 'is-seen' : ''} ${className}`} style={{ '--tile': `${tile}px` }} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <KupesiTile
          key={i}
          kind={seq[i % seq.length]}
          size={tile}
          framed
          style={{ '--i': i }}
        />
      ))}
    </div>
  )
}
