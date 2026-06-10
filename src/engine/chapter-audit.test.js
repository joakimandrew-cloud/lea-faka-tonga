/**
 * Chapter-parity audit (Tier 1).
 *
 * Automated checks that catch the error classes we've been finding by hand:
 *   A. Pairing dead-ends — user picks a preposition that narrows the place slot
 *      to a class with zero options at that chapter.
 *   B. Example round-trip — every example sentence in sentence-patterns.json
 *      must be constructable from the options available at the pattern's
 *      min_chapter.
 *   C. Cross-node min_chapter divergence — same Tongan word in multiple
 *      grammar-graph nodes with widely different min_chapter values; surfaces
 *      as an info-level assertion so divergences stay visible.
 */
import { describe, it, expect } from 'vitest'
import { getOptionsForSlot } from './slot-engine.js'
import sentencePatterns from '../data/sentence-patterns.json'
import grammarGraph from '../data/grammar-graph.json'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise curly apostrophes + case for equality checks. */
function norm(s) {
  if (!s) return ''
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

/** Tokenise a Tongan sentence: strip trailing punctuation, split by whitespace. */
function tokenise(tongan) {
  return tongan
    .replace(/[.!?,]+$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(norm)
}

/** All tokens that appear in any pickable option + locked value of a pattern at `chapter`. */
function availableTokens(pattern, chapter) {
  const set = new Set()
  // Always-allowed connectors/articles that the engine inserts or that are
  // stored as part of multi-word options — accept bare or joined forms.
  for (const w of ["'a", 'he', 'e', 'ha', "'ae", 'ia', 'ai']) set.add(norm(w))

  // Experiencer patterns (s24) synthesise the preposition kiate/ʻiate at
  // assembly time from verb choice — neither is exposed as a slot option.
  if (pattern.assembly_rules?.sentence_type === 'experiencer') {
    set.add(norm('kiate'))
    set.add(norm("\u02BBiate"))
  }

  // Cleft patterns (s39) synthesise a resumptive pronoun and accent the TM
  // at assembly time — these tokens don't appear in any slot's options.
  if (pattern.assembly_rules?.cleft_pronoun_insertion) {
    set.add(norm('na\u02BB\u00E1'))
    set.add(norm('ne'))
    set.add(norm('ku'))
    set.add(norm('nau'))
  }

  // Stress-accent synthesis: assembleSentence accents te/kuo/ʻoku/naʻa when
  // the next part starts with a one-syllable enclitic pronoun (Ch 2 + Ch 9:22),
  // so examples may carry the accented forms wherever the bare marker exists.
  const STRESS_PAIRS = [['te', 'té'], ['kuo', 'kuó'], ["'oku", "'okú"], ["na'a", "na'á"]]

  // Synthetic filler that activates every condition a slot might have.
  // Used to probe conditional slots (e.g. s04 `object` requires a transitive
  // verb in filledSlots) so their vocabulary shows up in the union.
  const syntheticFill = {
    verb: {
      tongan: '__probe__',
      tags: ['action', 'transitive', 'intransitive', 'motion', 'stative', 'experiencer'],
    },
  }

  for (const slot of pattern.slots) {
    if (slot.locked && slot.locked_value) {
      const t = slot.locked_value.tongan
      set.add(norm(t))
      for (const sub of t.split(/\s+/)) set.add(norm(sub))
      continue
    }
    const opts = slot.condition
      ? getOptionsForSlot(pattern.id, slot.id, syntheticFill, chapter)
      : getOptionsForSlot(pattern.id, slot.id, {}, chapter)
    for (const o of opts) {
      if (!o.tongan) continue
      set.add(norm(o.tongan))
      for (const sub of o.tongan.split(/\s+/)) set.add(norm(sub))
    }
  }
  for (const [bare, accented] of STRESS_PAIRS) {
    if (set.has(norm(bare))) set.add(norm(accented))
  }
  return set
}

/** Find the first `place`/`preposition` slot pairing in a pattern, if any. */
function pairingSlots(pattern) {
  const prep = pattern.slots.find(s => s.id === 'preposition')
  const place = pattern.slots.find(s => s.id === 'place')
  if (!prep || !place) return null
  if (prep.locked) return null // locked prep = no user-driven branch
  return { prep, place }
}

// ---------------------------------------------------------------------------
// A. Pairing dead-end detector
// ---------------------------------------------------------------------------

describe('Audit A — slot pairing dead-ends', () => {
  const failures = []

  for (const pattern of sentencePatterns.patterns) {
    const pair = pairingSlots(pattern)
    if (!pair) continue
    for (const chapter of pattern.book_chapters) {
      const prepOptions = getOptionsForSlot(pattern.id, 'preposition', {}, chapter)
      for (const prep of prepOptions) {
        const placeOptions = getOptionsForSlot(
          pattern.id, 'place', { preposition: prep }, chapter
        )
        if (placeOptions.length === 0) {
          failures.push({
            pattern: pattern.id,
            chapter,
            prep: prep.tongan,
            noun_class: prep.noun_class,
          })
        }
      }
    }
  }

  it('every (pattern × chapter × preposition) combination has at least one place option', () => {
    expect(failures, formatPairingFailures(failures)).toEqual([])
  })
})

function formatPairingFailures(fs) {
  if (!fs.length) return ''
  const lines = fs.map(f =>
    `  ${f.pattern} Ch${f.chapter}: prep "${f.prep}" (${f.noun_class || '?'}) → place has NO options`
  )
  return '\nDead-end pairings found:\n' + lines.join('\n')
}

// ---------------------------------------------------------------------------
// B. Example round-trip / token availability
// ---------------------------------------------------------------------------

describe('Audit B — example round-trip', () => {
  const failures = []

  for (const pattern of sentencePatterns.patterns) {
    if (!pattern.examples || !pattern.examples.length) continue
    // Try each chapter this pattern is taught in — the example only needs
    // to be buildable in ONE of them. Covers patterns like s01 whose
    // min_chapter=1 but examples use tense markers introduced at Ch 2.
    const candidateChapters = pattern.book_chapters?.length
      ? pattern.book_chapters
      : [pattern.min_chapter]

    for (const ex of pattern.examples) {
      const tokens = tokenise(ex.tongan)
      let bestMissing = tokens
      let bestChapter = candidateChapters[0]
      for (const ch of candidateChapters) {
        const available = availableTokens(pattern, ch)
        const missing = tokens.filter(t => !available.has(t))
        if (missing.length < bestMissing.length) {
          bestMissing = missing
          bestChapter = ch
        }
        if (missing.length === 0) break
      }
      if (bestMissing.length > 0) {
        failures.push({
          pattern: pattern.id,
          chapter: bestChapter,
          tongan: ex.tongan,
          missing: bestMissing,
        })
      }
    }
  }

  // Informational: token-match heuristic has false positives for compound
  // forms (e.g. `fo'i niú` — definitive-accent form). Fail only if the
  // number of flagged examples grows beyond the current baseline so new
  // regressions are visible, and emit the full report either way.
  const BASELINE_FAILURES = 0
  it(`example-token coverage (baseline ≤ ${BASELINE_FAILURES} gaps)`, () => {
    if (failures.length > 0) {
      // eslint-disable-next-line no-console
      console.info(formatExampleFailures(failures))
    }
    expect(failures.length).toBeLessThanOrEqual(BASELINE_FAILURES)
  })
})

function formatExampleFailures(fs) {
  if (!fs.length) return ''
  const lines = fs.map(f =>
    `  ${f.pattern} Ch${f.chapter}: "${f.tongan}" missing [${f.missing.join(', ')}]`
  )
  return '\nExamples with unavailable tokens:\n' + lines.join('\n')
}

// ---------------------------------------------------------------------------
// C. Cross-node min_chapter divergence (informational)
// ---------------------------------------------------------------------------

describe('Audit C — cross-node min_chapter divergence', () => {
  // Map: tongan → [{ node, min_chapter }]
  const wordNodes = new Map()
  for (const [nodeId, node] of Object.entries(grammarGraph.nodes || {})) {
    for (const w of node.words || []) {
      if (!w.tongan || w.min_chapter === undefined) continue
      const key = norm(w.tongan)
      if (!wordNodes.has(key)) wordNodes.set(key, [])
      wordNodes.get(key).push({ node: nodeId, min_chapter: w.min_chapter })
    }
  }

  const DIVERGENCE_THRESHOLD = 5
  const divergent = []
  for (const [tongan, appearances] of wordNodes.entries()) {
    if (appearances.length < 2) continue
    const chapters = appearances.map(a => a.min_chapter)
    const spread = Math.max(...chapters) - Math.min(...chapters)
    if (spread > DIVERGENCE_THRESHOLD) {
      divergent.push({ tongan, spread, appearances })
    }
  }

  // This is INFO-level: we want a single place to see divergences, not a hard
  // failure. Snapshot the count — if a future change introduces a new large
  // divergence, you'll see the count tick up and can inspect the full list.
  // To regenerate the full list, temporarily change `toBeLessThanOrEqual`
  // below to `toBe(-1)` and read the failure message.
  it('flags words whose min_chapter varies by more than 5 chapters across nodes', () => {
    if (divergent.length > 0) {
      // Sort for stable output.
      divergent.sort((a, b) => b.spread - a.spread)
      const lines = divergent.slice(0, 40).map(d => {
        const byNode = d.appearances
          .map(a => `${a.node}:Ch${a.min_chapter}`)
          .join(', ')
        return `  ${d.tongan.padEnd(16)} spread=${d.spread}  (${byNode})`
      })
      const preamble = `\n${divergent.length} words have min_chapter spread > ${DIVERGENCE_THRESHOLD} across nodes:\n`
      // Use console.info so the report is visible when tests pass too.
      // eslint-disable-next-line no-console
      console.info(preamble + lines.join('\n'))
    }
    // Soft assertion: we only want to see the list, not fail on it.
    // Tune this number down if you want divergences to start failing.
    expect(divergent.length).toBeLessThanOrEqual(500)
  })
})
