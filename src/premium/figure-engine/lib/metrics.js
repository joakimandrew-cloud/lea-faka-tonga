// Tile sizes and text measuring. Widths are read from a real DOM span in the real
// font, so a tile fits its word exactly at either width.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const FONT_FAMILY = "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif"
const cache = new Map()
let probe = null

function ensureProbe() {
  if (probe) return probe
  probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = `position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:pre;font-family:${FONT_FAMILY};font-style:italic;font-weight:500;font-size:100px;font-optical-sizing:auto;line-height:1`
  document.body.appendChild(probe)
  return probe
}

/** Width of a Tongan word in tile type at a font size. */
export function textWidth(text, fs) {
  const key = `${text}@${fs}`
  if (cache.has(key)) return cache.get(key)
  const el = ensureProbe()
  el.style.fontSize = `${fs}px`
  el.textContent = text
  const w = el.getBoundingClientRect().width
  cache.set(key, w)
  return w
}

/** A role's label under its tile, unless the face names its own (a blank one hides it). */
export const ROLE_LABEL = {
  tense: 'tense',
  verb: 'verb',
  pronoun: 'pronoun',
  noun: 'noun subject',
  question: 'question word',
  place: 'place',
  particle: 'direction',
}

let labelProbe = null
/** Width of a face's label as .ft-label sets it at this viewport; 0 when the face shows none. */
export function labelWidth(face) {
  if (!face || typeof document === 'undefined') return 0
  const text = face.role === 'focus' ? 'focus ʻa' : face.label ?? ROLE_LABEL[face.role]
  if (!text) return 0
  const phone = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
  const key = `label:${face.role}:${text}@${phone ? 'phone' : 'wide'}`
  if (cache.has(key)) return cache.get(key)
  if (!labelProbe) {
    labelProbe = document.createElement('span')
    labelProbe.setAttribute('aria-hidden', 'true')
    labelProbe.className = 'ft-label'
    labelProbe.style.cssText = 'left:-9999px;top:-9999px;visibility:hidden;transform:none'
    document.body.appendChild(labelProbe)
  }
  // Measured as Label sets it: Tongan written *like this* is a serif italic span, as Rich draws it.
  labelProbe.textContent = ''
  const parts = face.role === 'focus' ? ['focus ', '*ʻa*'] : String(text).split(/(\*[^*]+\*)/g).filter(Boolean)
  for (const part of parts) {
    const span = document.createElement('span')
    const tongan = part.length > 2 && part.startsWith('*') && part.endsWith('*')
    if (tongan) span.className = 'fx-to'
    span.textContent = tongan ? part.slice(1, -1) : part
    labelProbe.appendChild(span)
  }
  const w = labelProbe.getBoundingClientRect().width
  cache.set(key, w)
  return w
}

/** Re-render once the tile face has loaded, since widths change with it. */
export function useTileFont() {
  const [epoch, setEpoch] = useState(0)
  useEffect(() => {
    let live = true
    const refresh = () => {
      cache.clear()
      if (live) setEpoch(e => e + 1)
    }
    const faces = document.fonts
    if (!faces) return undefined
    Promise.all([
      faces.load(`italic 500 30px 'Source Serif 4 Variable'`),
      faces.load(`italic 500 24px 'Source Serif 4 Variable'`),
    ]).then(refresh, refresh)
    faces.ready.then(refresh, refresh)
    return () => { live = false }
  }, [])
  return epoch
}

/** The inner width of an element, kept current. */
export function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const read = () => setWidth(node.clientWidth)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(node)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

/** Tile geometry at this stage width. Direction.md part 4: 30 px in 56, 24 px in 44. */
export function tileSizes(width) {
  const phone = width > 0 && width < 480
  return phone
    ? { fs: 24, h: 44, pad: 11, gap: 6, r: 10, arc: 32, label: 22, ghost: 22, mark: 20 }
    : { fs: 30, h: 56, pad: 15, gap: 8, r: 10, arc: 40, label: 24, ghost: 30, mark: 22 }
}

/** Fits a figure's size set to its stage. A wide stage grows the tiles until the widest row
 *  nearly fills it, up to 38 px type, and shrinks a long row a little, to no less than 24 px, so
 *  it stays on one line. A phone shrinks to no less than 20 px type. A row that would still not
 *  fit stays at full size and wraps to a second line. */
export function fitSizes(base, widest, width) {
  if (!widest || !width) return base
  const scale = k => ({
    ...base,
    fs: Math.round(base.fs * k * 10) / 10,
    h: Math.round(base.h * k),
    pad: Math.round(base.pad * k),
    gap: Math.max(4, Math.round(base.gap * k)),
    ghost: Math.round(base.ghost * k),
    arc: Math.round(base.arc * Math.max(k, 1)),
  })
  if (width >= 480) {
    const grow = Math.min(38 / base.fs, (width * 0.92) / widest)
    if (grow > 1.02) return scale(grow)
    if (widest <= width) return base
    const k = width / widest
    return k < 24 / base.fs ? base : scale(k * 0.985)
  }
  if (widest <= width) return base
  const k = width / widest
  // A touch under the exact fit, since sizes round to whole pixels and must not push a row to wrap.
  return k < 20 / base.fs ? base : scale(k * 0.985)
}

/** The distance from one wrapped row of tiles to the next: a Row's and a Fork's alike. */
export const lineHeightOfRow = s => s.h + 40

/** One line of wrapped English. A single line keeps its 30 px; see .ft-en.is-wrap. */
export const EN_WRAP_LINE = 22

/** Width of interface text in a given CSS font, for placing a line of English beside a row. */
let canvas = null
export function uiWidth(text, font) {
  if (typeof document === 'undefined') return 0
  canvas = canvas || document.createElement('canvas').getContext('2d')
  canvas.font = font
  return canvas.measureText(text).width
}

/** Width of a figure's English line, in the font .ft-en sets at this stage width. */
export function enWidth(text, width) {
  // A note may mark Tongan *like this*; the marks are not drawn, so they are not measured.
  return uiWidth(String(text).replace(/\*([^*]+)\*/g, '$1'), `500 ${width < 480 ? 15.5 : 16}px 'Inter Variable', Inter, sans-serif`) + 2
}

/** The lines an English sentence takes when it wraps on this stage. */
export function enLineCount(text, width) {
  if (!text || enWidth(text, width) <= width) return 1
  let lines = 1
  let current = ''
  String(text).split(' ').forEach(word => {
    const next = current ? `${current} ${word}` : word
    if (current && enWidth(next, width) > width) { lines += 1; current = word } else current = next
  })
  return lines
}
