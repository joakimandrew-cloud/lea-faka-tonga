/**
 * Word Rain: round generation (pure, no React).
 *
 * A round is one target card and its answer options: the target's own face
 * plus distractors, drawn from the same part of speech where the deck allows
 * and from the whole deck otherwise. A distractor is never a second right
 * answer:
 *   - its shown meaning never equals the target's;
 *   - it shares no comma- or semicolon-separated meaning item with the target;
 *   - it never has the target's Tongan spelling (homographs: hiva is both
 *     "nine" and "sing", so neither may sit beside the other);
 *   - no two options read the same.
 */

/** Seeded PRNG (mulberry32), so tests and the review sample can repeat. */
export function makeRng(seed = Date.now()) {
  let a = seed >>> 0
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Directions: the moving word is Tongan (tap the English) or the reverse. */
export const DIRECTIONS = ['to-english', 'to-tongan']

/** What a card shows on its face in a direction. */
export function moverText(card, direction) {
  return direction === 'to-tongan' ? card.meaning : card.tonganShown
}
export function optionText(card, direction) {
  return direction === 'to-tongan' ? card.tonganShown : card.meaning
}

/** True when `other` could pass for a right answer to `target`. */
export function clashes(target, other) {
  if (other.id === target.id) return true
  if (other.tongan === target.tongan) return true
  if (other.meaning.toLowerCase() === target.meaning.toLowerCase()) return true
  const items = new Set(target.items)
  return other.items.some(i => items.has(i))
}

/**
 * One round. `avoid` is a set of card ids not to use as the target (the last
 * few words, so the same word does not come straight back).
 * Returns { target, options: [card], labels: [string], correctIndex, mover }.
 */
export function makeRound(deck, rng, { direction = 'to-english', optionCount = 4, avoid = null } = {}) {
  const pool = avoid && avoid.size < deck.length ? deck.filter(c => !avoid.has(c.id)) : deck
  const target = pool[Math.floor(rng() * pool.length)]
  const label = c => optionText(c, direction)
  const chosen = []
  const seenLabels = new Set([label(target).toLowerCase()])

  const tryAdd = candidates => {
    for (const c of shuffle(candidates, rng)) {
      if (chosen.length >= optionCount - 1) return
      if (clashes(target, c)) continue
      const l = label(c).toLowerCase()
      if (seenLabels.has(l)) continue
      // Two distractors that read alike would leave a learner who knows the
      // right answer still guessing between them; one is enough.
      if (chosen.some(d => clashes(d, c))) continue
      chosen.push(c)
      seenLabels.add(l)
    }
  }
  tryAdd(deck.filter(c => c.pos === target.pos))
  if (chosen.length < optionCount - 1) tryAdd(deck)

  const options = shuffle([target, ...chosen], rng)
  return {
    target,
    options,
    labels: options.map(label),
    correctIndex: options.indexOf(target),
    mover: moverText(target, direction),
    direction,
  }
}
