/**
 * Builder — legacy pattern-based Free Build (route: /build).
 *
 * Uses the old slot-engine.js + sentence-patterns.json (38 fixed patterns).
 * Known to retain the two symptoms now fixed in the stack walker:
 *   - "options disappear" (Rule 1): once a pattern is chosen, only that
 *     pattern's slots are offered, so the user can never mix location +
 *     time + companion + purpose in the same sentence.
 *   - wrong-position words: postposed_pronoun etc. are constrained by the
 *     pattern's slot list rather than by syntactic position.
 *
 * Kept alive in parallel per spec/Phase-2-Engine-Plan.md:1190 until the
 * stack-walker successor at /open-build covers all 53 chapters. See
 * OpenBuilder.jsx for the spec-compliant replacement and graph-walker.test.js
 * "user-reported symptoms (regression guards)" for the behavioral contract.
 * Do not invest in this file — fixes land in graph-walker.js + grammar-graph.json.
 */
import { useState, useMemo } from 'react'
import SlotBuilder from '../components/SlotBuilder'
import sentencePatterns from '../data/sentence-patterns.json'

// Category display order
const CATEGORY_ORDER = [
  'Statements',
  'Location and Direction',
  'Commands and Requests',
  'Negation',
  'Questions',
  'Ko Sentences',
  'Noun Subjects and Agents',
]

// Short descriptions for each category
const CATEGORY_DESCRIPTIONS = {
  'Statements': 'Actions, feelings, and states',
  'Location and Direction': 'Being somewhere, going places',
  'Commands and Requests': 'Tell someone what to do',
  'Negation': 'Say what is not or does not happen',
  'Questions': 'Ask who, what, where, when, how',
  'Ko Sentences': 'Identify and describe things',
  'Noun Subjects and Agents': 'Sentences with named subjects',
}

export default function Builder() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedPatternId, setSelectedPatternId] = useState(null)

  // Complete patterns grouped by category
  const completePatterns = useMemo(
    () => sentencePatterns.patterns.filter(p => p.data_status === 'complete'),
    []
  )

  const categories = useMemo(() => {
    const cats = [...new Set(completePatterns.map(p => p.category))]
    return CATEGORY_ORDER.filter(c => cats.includes(c))
  }, [completePatterns])

  const patternsInCategory = useMemo(
    () => selectedCategory
      ? completePatterns.filter(p => p.category === selectedCategory)
      : [],
    [selectedCategory, completePatterns]
  )

  const selectedPattern = selectedPatternId
    ? sentencePatterns.patterns.find(p => p.id === selectedPatternId)
    : null

  // ── SlotBuilder view ───────────────────────────────────────────────────

  if (selectedPatternId && selectedPattern) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl text-[var(--accent)] font-bold tracking-wide">FREE BUILD</h1>
            <p className="text-sm text-[var(--text-muted)]">{selectedPattern.title}</p>
          </div>
          <button
            onClick={() => setSelectedPatternId(null)}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            &larr; Change pattern
          </button>
        </div>
        <SlotBuilder
          key={selectedPatternId}
          patternId={selectedPatternId}
          onBack={() => setSelectedPatternId(null)}
        />
      </div>
    )
  }

  // ── Pattern list view ──────────────────────────────────────────────────

  if (selectedCategory) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl text-[var(--accent)] font-bold tracking-wide">FREE BUILD</h1>
            <p className="text-sm text-[var(--text-muted)]">{selectedCategory}</p>
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            &larr; All categories
          </button>
        </div>

        <div className="space-y-2">
          {patternsInCategory.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPatternId(p.id)}
              className="block w-full text-left px-5 py-4 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--text)]">{p.title}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{p.label_en}</div>
              {p.examples.length > 0 && (
                <div className="text-xs font-tongan mt-1">
                  e.g. {p.examples[0].tongan} &mdash; {p.examples[0].english}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Category selection view ────────────────────────────────────────────

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl text-[var(--accent)] font-bold tracking-wide">FREE BUILD</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Choose a sentence type to build</p>
      </div>

      <div className="space-y-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="block w-full text-left px-5 py-4 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors cursor-pointer"
          >
            <div className="text-[var(--text)]">{cat}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{CATEGORY_DESCRIPTIONS[cat]}</div>
            <div className="text-xs text-[var(--text-faint)] mt-1">
              {completePatterns.filter(p => p.category === cat).length} patterns
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
