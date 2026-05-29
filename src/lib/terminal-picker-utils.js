/**
 * terminal-picker-utils — non-component helpers shared by the terminal-style
 * sentence builders (TerminalPicker.jsx and the SentenceBuilder/TerminalBuilder
 * pages). Kept out of the .jsx component file so React Fast Refresh stays happy
 * (a component module should export only components).
 */

import { useEffect, useState } from 'react'

// Touch-primary detection for swapping the inline drum-roller for a
// tap-first dropdown picker on phones/tablets. Uses pointer/hover media
// queries rather than a viewport-width breakpoint — a wide iPad still
// needs the tap flow, and a narrow desktop window shouldn't. SSR-safe
// default is false (desktop) since window is only read inside useEffect.
export function useIsTouchPrimary() {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const update = () => setIsTouch(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return isTouch
}

// ── Split an "Add more" group into per-POS tab pills ─────────────────────
//
// The engine's `extensions` / `mixed` phases bundle terminators (. ?) and
// extension items (+ verb, + adverb, + ki he place, …) into one group
// labelled "Add more". That rendered as a single pill with a long list of
// `+ …` rows, which reads like the old "+ Add More" button rather than a
// part-of-speech tab row.
//
// This transform flattens that group: terminators become a "Finish" tab
// and each extension becomes its own tab pill whose only item is a
// confirmation row. `type` + `id` on the item are preserved so the parent's
// confirmSelection still routes to `pickExtension` / `pickTerminator`.
// Groups without any extension items (plain word groups, "Finish", "Done")
// pass through unchanged.
export function expandAddMoreGroup(groups) {
  const result = []
  for (const group of groups) {
    const hasExtensions = group.items.some(it => it.type === 'extension')
    if (!hasExtensions) {
      result.push(group)
      continue
    }
    const terminators = group.items.filter(it => it.type === 'terminator')
    const extensions = group.items.filter(it => it.type === 'extension')
    if (terminators.length > 0) {
      result.push({ label: 'Finish', items: terminators })
    }
    for (const ext of extensions) {
      const tabLabel = ext.display.replace(/^\+\s*/, '')
      result.push({
        label: tabLabel,
        items: [{
          type: 'extension',
          id: ext.id,
          display: `add ${tabLabel.toLowerCase()}`,
          hint: ext.hint || '',
        }],
      })
    }
  }
  return result
}
