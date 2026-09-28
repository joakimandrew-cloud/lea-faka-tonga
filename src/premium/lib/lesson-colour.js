/**
 * Each lesson's tile colour: one monochromatic scale per level, stepping one
 * point of HSL lightness darker per lesson and centred on the level's colour
 * (Andrew approved 2026-09-26; spec and all 52 values in
 * reviews/2026-09-25-premium-site/tapa-options-codex/original-a-cleaned/
 * progressive-colour.json).
 */
// Every lesson's square: this five-motif rhythm in lesson order, with
// alternate lessons flipped (Lesson 1 flipped). The homepage map, the lesson
// list and the lesson page all read it from here.
export const LESSON_SEQUENCE = ['nest', 'leaf', 'lens', 'pinwheel', 'pinwheel']

export function lessonTile(n, offset = 0) {
  const i = n - 1 + offset
  return { kind: LESSON_SEQUENCE[i % LESSON_SEQUENCE.length], invert: i % 2 === 0 }
}

const LEVEL_BASE = { basic: '#f39e53', intermediate: '#e0683c', advanced: '#ef3f1a' }

function hsl(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min
  if (!d) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: ((h * 60) + 360) % 360, s: s * 100, l: l * 100 }
}

/** `chapters` in lesson order, `levelOf(chapter)` → 'basic' | 'intermediate' | 'advanced'. */
export function lessonColours(chapters, levelOf) {
  const byLevel = {}
  for (const c of chapters) (byLevel[levelOf(c)] ||= []).push(c.chapter)
  const out = {}
  for (const [lvl, list] of Object.entries(byLevel)) {
    const base = hsl(LEVEL_BASE[lvl] || LEVEL_BASE.basic)
    list.forEach((n, i) => {
      const l = base.l + (list.length - 1) / 2 - i
      out[n] = `hsl(${base.h.toFixed(3)} ${base.s.toFixed(3)}% ${l.toFixed(3)}%)`
    })
  }
  return out
}
