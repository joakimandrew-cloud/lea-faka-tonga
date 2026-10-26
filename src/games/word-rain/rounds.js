/**
 * Word Rain: round generation (pure, no React).
 *
 * A round is one target card and its answer options: the target's own face
 * plus distractors, drawn from the same broad part of speech where the deck allows
 * and from the whole deck otherwise. A distractor is never a second right
 * answer:
 *   - its shown meaning never equals the target's;
 *   - it shares no comma- or semicolon-separated meaning item with the target;
 *   - it never has the target's Tongan spelling (homographs: hiva is both
 *     "nine" and "sing", so neither may sit beside the other);
 *   - no two options read the same;
 *   - it shares no content word with the target ("sit down" is a fair
 *     translation of one meaning of nofo, "stay, sit, live"), and no two
 *     distractors share one either; applied in both directions;
 *   - it is not the singular or the source of the target, where the English
 *     note says so ("live together (plural of nofo)");
 *   - the pair is not in confusable-pairs.json, the synonyms that share no
 *     word (big and large).
 */
import { shuffle, posClass, clashes } from '../shared/fair.js'

/** Directions: the moving word is Tongan (tap the English) or the reverse. */
export const DIRECTIONS = ['to-english', 'to-tongan']

/** What a card shows on its face in a direction. */
export function moverText(card, direction) {
  return direction === 'to-tongan' ? (card.label ?? card.meaning) : card.tonganShown
}
export function optionText(card, direction) {
  return direction === 'to-tongan' ? card.tonganShown : (card.label ?? card.meaning)
}

/**
 * One round. `avoid` is a set of card ids not to use as the target (the last
 * few words, so the same word does not come straight back). `target` fixes
 * the target (tests and the review sample). `fallback` is the wider deck a
 * word list draws its distractors from once the list itself has no more words
 * that could not pass for the target: the list first, then the wider deck
 * within the target's part of speech, then the wider deck at large.
 * Returns { target, options: [card], labels: [string], correctIndex, mover }.
 */
export function makeRound(deck, rng, { direction = 'to-english', optionCount = 4, avoid = null, fallback = null, target: fixed = null } = {}) {
  const free = avoid && avoid.size ? deck.filter(c => !avoid.has(c.id)) : deck
  const pool = free.length ? free : deck
  const target = fixed ?? pool[Math.floor(rng() * pool.length)]
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
  tryAdd(deck.filter(c => posClass(c.pos) === posClass(target.pos)))
  if (chosen.length < optionCount - 1) tryAdd(deck)
  if (fallback) {
    if (chosen.length < optionCount - 1) tryAdd(fallback.filter(c => posClass(c.pos) === posClass(target.pos)))
    if (chosen.length < optionCount - 1) tryAdd(fallback)
  }

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
