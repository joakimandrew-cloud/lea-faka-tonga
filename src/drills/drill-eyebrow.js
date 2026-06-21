/**
 * drillEyebrow — the single source for a drill's "Ch N · Level" eyebrow.
 *
 * The curated chapter + level for every drill already lives in the menu's
 * GROUPS array (cards carry both ch and level; in-chapter rows carry ch).
 * Rather than restate that data, this derives a flat { id → {ch, level} }
 * lookup from GROUPS so DrillFrame can render one consistent eyebrow on
 * every door (bespoke page, /drill/:id, and — implicitly — the chapter
 * anchor strip). One source, no drift.
 */

import { GROUPS, LEVELS } from '../data/drills-catalog'

const FRAME_META = {}
for (const g of GROUPS) {
  for (const d of g.drills) FRAME_META[d.id] = { ch: d.ch, level: d.level }
  for (const r of g.inChapters) {
    if (!(r.id in FRAME_META)) FRAME_META[r.id] = { ch: r.ch }
  }
}

// A few drills have a bespoke page but only appear as an in-chapter row in
// the menu (no level on a card), plus vocab-cloze which isn't on the menu at
// all. Give them a level so their standalone eyebrow reads "Ch N · Level"
// like every other door. (Level is pedagogical difficulty, not sequence.)
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

export function drillEyebrow(id) {
  const m = FRAME_META[id]
  if (!m) return ''
  const lvl = m.level ? LEVELS[m.level] : ''
  if (m.ch && lvl) return `Lesson ${m.ch} · ${lvl}`
  if (m.ch) return `Lesson ${m.ch}`
  return lvl
}
