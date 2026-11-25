/**
 * drillEyebrow: the single source for a drill's "Ch N · Level" eyebrow.
 *
 * The curated chapter + level for every drill lives in the catalogue: the
 * menu's GROUPS (cards carry both ch and level) and LESSON_DRILLS, the drills
 * that live only inside their lesson (cards keep ch and level; rows carry ch).
 * Rather than restate that data, this derives a flat { id → {ch, level} }
 * lookup from both so DrillFrame can render one consistent eyebrow on
 * every door (bespoke page, /drill/:id, and, implicitly, the chapter
 * anchor strip). One source, no drift.
 */

import { GROUPS, LESSON_DRILLS, LEVELS } from '../data/drills-catalog'

const FRAME_META = {}
for (const g of GROUPS) {
  for (const d of g.drills) FRAME_META[d.id] = { ch: d.ch, level: d.level }
}
for (const d of LESSON_DRILLS) {
  if (!(d.id in FRAME_META)) FRAME_META[d.id] = d.level ? { ch: d.ch, level: d.level } : { ch: d.ch }
}

// A few lesson drills were rows with no level on the old menu (no level on a
// card), plus vocab-cloze which was never on it. Give them a level so their
// standalone eyebrow reads "Lesson N · Level" like every other door. (Level
// is pedagogical difficulty, not sequence.) sentence-lab is on the menu now;
// its override stays so the eyebrow cannot change.
const LEVEL_OVERRIDES = {
  'skeleton-filler': 'beginner',
  'clusivity-corner': 'beginner',
  'adjective-flip': 'beginner',
  'vocab-cloze': 'beginner',
  'sentence-lab': 'intermediate',
}
for (const [id, level] of Object.entries(LEVEL_OVERRIDES)) {
  FRAME_META[id] = { ...(FRAME_META[id] || {}), level }
}

/**
 * The lesson a drill belongs to, or null. Same FRAME_META the eyebrow reads,
 * so "Lesson 8" in the eyebrow and "Back to Lesson 8" on the end card stay
 * one fact. Added 2026-09-03 for UX-09.
 */
export function drillLesson(id) {
  return FRAME_META[id]?.ch ?? null
}

export function drillEyebrow(id) {
  const m = FRAME_META[id]
  if (!m) return ''
  const lvl = m.level ? LEVELS[m.level] : ''
  if (m.ch && lvl) return `Lesson ${m.ch} · ${lvl}`
  if (m.ch) return `Lesson ${m.ch}`
  return lvl
}
