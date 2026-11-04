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

/** Shrinks a size set so the widest row fits the stage: never under 20 px type. */
export function fitSizes(base, widest, width) {
  if (!widest || !width || widest <= width) return base
  const k = Math.max(20 / base.fs, width / widest)
  return {
    ...base,
    fs: Math.round(base.fs * k * 10) / 10,
    h: Math.round(base.h * k),
    pad: Math.round(base.pad * k),
    gap: Math.max(4, Math.round(base.gap * k)),
    ghost: Math.round(base.ghost * k),
  }
}
