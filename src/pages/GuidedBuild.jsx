import { useState } from 'react'
import GuidedWizard from '../components/GuidedWizard'
import SlotBuilder from '../components/SlotBuilder'
import { getOptionsForSlot } from '../engine/slot-engine'
import sentencePatterns from '../data/sentence-patterns.json'

// ---------------------------------------------------------------------------
// Entry-point ID → pattern IDs
// ---------------------------------------------------------------------------

const ENTRY_TO_PATTERNS = {
  statement:         ['s01', 's02', 's03', 's04', 's07'],
  location_state:    ['s05', 's06'],
  negation:          ['s12'],
  experiencer:       ['s24'],
  noun_subject:      ['s22'],
  command:           ['s08'],
  command_plural:    ['s09'],
  suggestion:        ['s11'],
  prohibition:       ['s10'],
  ko_identification: ['s18'],
  ko_negation:       ['s13'],
  ko_question_what:  ['s16'],
  ko_question_who:   ['s15'],
  ko_question_where: ['s17'],
}

function getPattern(id) {
  return sentencePatterns.patterns.find(p => p.id === id) || null
}

/**
 * Convert wizard preSeededSteps (graph-walker format) into filledSlots
 * for the slot engine. Matches by tongan text against the pattern's options.
 */
function buildPreFilledSlots(patternId, preSeededSteps) {
  const filled = {}

  for (const step of preSeededSteps) {
    const nid = step.nodeId

    // Tense marker
    if (nid.startsWith('tense_marker')) {
      const opts = getOptionsForSlot(patternId, 'tense_marker', {}, 53)
      const match = opts.find(o => o.tongan === step.word.tongan)
      if (match) filled.tense_marker = match
    }

    // Pronoun → "subject" slot
    if (nid.startsWith('pronoun')) {
      const opts = getOptionsForSlot(patternId, 'subject', filled, 53)
      const match = opts.find(o => o.tongan === step.word.tongan)
      if (match) filled.subject = match
    }

    // Suggestion pronoun
    if (nid === 'suggestion_pronoun') {
      const opts = getOptionsForSlot(patternId, 'suggestion_pronoun', {}, 53)
      const match = opts.find(o => o.tongan === step.word.tongan)
      if (match) filled.suggestion_pronoun = match
    }
  }

  return filled
}

// ===========================================================================
// Component
// ===========================================================================

export default function GuidedBuild() {
  const [resolved, setResolved] = useState(null)
  const [wizardState, setWizardState] = useState(null)
  const [selectedPatternId, setSelectedPatternId] = useState(null)

  const handleResolve = (result) => {
    setResolved(result)

    // Auto-select if only one pattern maps to this entry point
    const patternIds = ENTRY_TO_PATTERNS[result.entryPoint.id] || []
    if (patternIds.length === 1) {
      setSelectedPatternId(patternIds[0])
    }
  }

  const handleBackToWizard = () => {
    setResolved(null)
    setSelectedPatternId(null)
  }

  const handleStartOver = () => {
    setResolved(null)
    setSelectedPatternId(null)
    setWizardState(null)
  }

  const handleBackToPatternPicker = () => {
    setSelectedPatternId(null)
  }

  // ── Resolved + pattern selected → SlotBuilder ──────────────────────────

  if (resolved && selectedPatternId) {
    const pattern = getPattern(selectedPatternId)
    const preFilledSlots = buildPreFilledSlots(selectedPatternId, resolved.preSeededSteps)
    const preFilledEntries = Object.entries(preFilledSlots)

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl text-[var(--accent)] font-bold tracking-wide">GUIDED BUILD</h1>
            <p className="text-sm text-[var(--text-muted)]">{pattern?.title || selectedPatternId}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleBackToWizard}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            >
              &larr; Back to questions
            </button>
            <button
              onClick={handleStartOver}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Start over
            </button>
          </div>
        </div>

        {/* Pre-seed teaching note */}
        {preFilledEntries.length > 0 && (
          <div className="border-l-2 border-[var(--accent)]/40 bg-[var(--accent-faint)] px-4 py-3 mb-4">
            <div className="text-sm text-[var(--text-muted)] leading-relaxed">
              Based on your answers, your sentence starts with{' '}
              <span className="font-tongan">
                {preFilledEntries.map(([, v]) => v.tongan).join(' ')}
              </span>
              {' '}&mdash;{' '}
              <span className="text-[var(--text-muted)]">
                {preFilledEntries.map(([, v]) => v.english).join(' + ')}
              </span>
            </div>
          </div>
        )}

        <SlotBuilder
          key={selectedPatternId}
          patternId={selectedPatternId}
          initialFilledSlots={preFilledSlots}
          forceQuestion={resolved.forceQuestion || false}
          onBack={handleBackToPatternPicker}
        />
      </div>
    )
  }

  // ── Resolved but multiple patterns → pattern picker ────────────────────

  if (resolved) {
    const patternIds = ENTRY_TO_PATTERNS[resolved.entryPoint.id] || []
    const availablePatterns = patternIds
      .map(id => getPattern(id))
      .filter(p => p && p.data_status === 'complete')

    if (availablePatterns.length === 0) {
      return (
        <div>
          <p className="text-[var(--text-muted)]">
            No patterns available for this sentence type yet.{' '}
            <button onClick={handleStartOver} className="text-[var(--accent)] underline cursor-pointer">
              Start over
            </button>
          </p>
        </div>
      )
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl text-[var(--accent)] font-bold tracking-wide">WHAT KIND OF SENTENCE?</h1>
          <div className="flex gap-4">
            <button
              onClick={handleBackToWizard}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              onClick={handleStartOver}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Start over
            </button>
          </div>
        </div>

        {/* Pre-seeded words note */}
        {resolved.preSeededSteps.length > 0 && (
          <div className="border-l-2 border-[var(--accent)]/40 bg-[var(--accent-faint)] px-4 py-3 mb-4">
            <div className="text-sm text-[var(--text-muted)] leading-relaxed">
              Your sentence starts with{' '}
              <span className="font-tongan">
                {resolved.preSeededSteps.map(s => s.word.tongan).join(' ')}
              </span>
              {' '}&mdash; now choose what kind of sentence to build.
            </div>
          </div>
        )}

        <div className="space-y-2">
          {availablePatterns.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPatternId(p.id)}
              className="block w-full text-left px-5 py-4 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--text)]">{p.title}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{p.label_en}</div>
              {p.examples.length > 0 && (
                <div className="text-xs font-tongan mt-1">
                  {p.examples[0].tongan}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Wizard phase ───────────────────────────────────────────────────────

  return (
    <GuidedWizard
      onResolve={handleResolve}
      savedState={wizardState}
      onStateChange={setWizardState}
    />
  )
}
