/**
 * TenseSwapperCore — particles do the work English verbs do.
 *
 * Each EXAMPLE carries a `minChapter` tag plus its own per-tense particle
 * cluster (so pronoun-subject examples can show the morphing "I" form
 * Naʻá ku → ʻOku ou → Kuó u → Té u, while noun-subject examples show
 * the bare TM Naʻe / ʻOku / Kuo / ʻE).
 *
 * Polarity (negation) is gated to chapterNum ≥ 9 — Ch 2 students don't
 * see the toggle since they haven't met negation yet.
 */

import { useState, useMemo, useEffect } from 'react'

const TENSES = [
  { id: 'present', english_label: 'Present' },
  { id: 'past',    english_label: 'Past' },
  { id: 'perfect', english_label: 'Perfect' },
  { id: 'future',  english_label: 'Future' },
]

const ALL_EXAMPLES = [
  // ── Pronoun subjects: Ch 2+ ──────────────────────────────────────────
  {
    id: 'i-go',
    minChapter: 2,
    title: 'I go',
    hint: 'Pronoun subject. The "I" pronoun morphs with the tense marker — ku, ou, u, u — but the verb ʻalu never moves.',
    body: 'ʻalu',
    perTense: {
      affirmative: { present: 'ʻOku ou', past: 'Naʻá ku', perfect: 'Kuó u', future: 'Té u' },
      negative:    { present: 'ʻOku ʻikai te u', past: 'Naʻe ʻikai te u', perfect: 'Kuo ʻikai te u', future: 'ʻE ʻikai te u' },
    },
    english: {
      affirmative: { present: 'I am going.', past: 'I went.', perfect: 'I have gone.', future: 'I will go.' },
      negative:    { present: 'I am not going.', past: 'I did not go.', perfect: 'I have not gone.', future: 'I will not go.' },
    },
  },
  {
    id: 'he-eats',
    minChapter: 2,
    title: 'He eats',
    hint: 'Pronoun subject "ne" (he/she). One pronoun, four particles. The accent shifts to the TM\u2019s last syllable before ne.',
    body: 'kai',
    perTense: {
      affirmative: { present: 'ʻOkú ne', past: 'Naʻá ne', perfect: 'Kuó ne', future: 'Té ne' },
      negative:    { present: 'ʻOku ʻikai té ne', past: 'Naʻe ʻikai té ne', perfect: 'Kuo ʻikai té ne', future: 'ʻE ʻikai té ne' },
    },
    english: {
      affirmative: { present: 'He is eating.', past: 'He ate.', perfect: 'He has eaten.', future: 'He will eat.' },
      negative:    { present: 'He is not eating.', past: 'He did not eat.', perfect: 'He has not eaten.', future: 'He will not eat.' },
    },
  },
  {
    id: 'we-incl-sing',
    minChapter: 2,
    title: 'We (incl. you) sing',
    hint: 'Inclusive plural pronoun "tau". The listener is part of the "we".',
    body: 'hiva',
    perTense: {
      affirmative: { present: 'ʻOku tau', past: 'Naʻa tau', perfect: 'Kuo tau', future: 'Te tau' },
      negative:    { present: 'ʻOku ʻikai te tau', past: 'Naʻe ʻikai te tau', perfect: 'Kuo ʻikai te tau', future: 'ʻE ʻikai te tau' },
    },
    english: {
      affirmative: { present: 'We are singing.', past: 'We sang.', perfect: 'We have sung.', future: 'We will sing.' },
      negative:    { present: 'We are not singing.', past: 'We did not sing.', perfect: 'We have not sung.', future: 'We will not sing.' },
    },
  },
  {
    id: 'they-sleep',
    minChapter: 2,
    title: 'They sleep',
    hint: 'Plural pronoun "nau" (three or more). Two-syllable pronoun, no accent shift on the TM.',
    body: 'mohe',
    perTense: {
      affirmative: { present: 'ʻOku nau', past: 'Naʻa nau', perfect: 'Kuo nau', future: 'Te nau' },
      negative:    { present: 'ʻOku ʻikai te nau', past: 'Naʻe ʻikai te nau', perfect: 'Kuo ʻikai te nau', future: 'ʻE ʻikai te nau' },
    },
    english: {
      affirmative: { present: 'They are sleeping.', past: 'They slept.', perfect: 'They have slept.', future: 'They will sleep.' },
      negative:    { present: 'They are not sleeping.', past: 'They did not sleep.', perfect: 'They have not slept.', future: 'They will not sleep.' },
    },
  },

  // ── Noun subjects: Ch 15+ (require ʻa Sione / ʻa e + noun-subject construction) ──
  {
    id: 'sione-go',
    minChapter: 15,
    title: 'Sione goes',
    hint: 'Noun subject (ʻa Sione). For names, the past TM becomes Naʻe and future becomes ʻE.',
    body: 'ʻalu ʻa Sione',
    perTense: {
      affirmative: { present: 'ʻOku', past: 'Naʻe', perfect: 'Kuo', future: 'ʻE' },
      negative:    { present: 'ʻOku ʻikai ke', past: 'Naʻe ʻikai ke', perfect: 'Kuo ʻikai ke', future: 'ʻE ʻikai ke' },
    },
    english: {
      affirmative: { present: 'Sione is going.', past: 'Sione went.', perfect: 'Sione has gone.', future: 'Sione will go.' },
      negative:    { present: 'Sione is not going.', past: 'Sione did not go.', perfect: 'Sione has not gone.', future: 'Sione will not go.' },
    },
  },

  // ── Existential + transitive examples: Ch 31+ ────────────────────────
  {
    id: 'doctor-at-home',
    minChapter: 31,
    title: 'There is a doctor at home',
    hint: 'Existential ʻi ai ha — Tongan has no verb "to be".',
    body: 'ʻi ai ha tōketā ʻi ʻapi',
    perTense: {
      affirmative: { present: 'ʻOku', past: 'Naʻe', perfect: 'Kuo', future: 'ʻE' },
      negative:    { present: 'ʻOku ʻikai ke', past: 'Naʻe ʻikai ke', perfect: 'Kuo ʻikai ke', future: 'ʻE ʻikai ke' },
    },
    english: {
      affirmative: { present: 'There is a doctor at home.', past: 'There was a doctor at home.', perfect: 'There has been a doctor at home.', future: 'There will be a doctor at home.' },
      negative:    { present: 'There is no doctor at home.', past: 'There was no doctor at home.', perfect: 'There has been no doctor at home.', future: 'There will be no doctor at home.' },
    },
  },
  {
    id: 'dog-runs-to-town',
    minChapter: 19,
    title: 'The dog runs to town',
    hint: 'Definite noun subject (ʻa e kulī). The location particle ki is a separate word, not a verb ending.',
    body: 'lele ʻa e kulī ki kolo',
    perTense: {
      affirmative: { present: 'ʻOku', past: 'Naʻe', perfect: 'Kuo', future: 'ʻE' },
      negative:    { present: 'ʻOku ʻikai ke', past: 'Naʻe ʻikai ke', perfect: 'Kuo ʻikai ke', future: 'ʻE ʻikai ke' },
    },
    english: {
      affirmative: { present: 'The dog is running to town.', past: 'The dog ran to town.', perfect: 'The dog has run to town.', future: 'The dog will run to town.' },
      negative:    { present: 'The dog is not running to town.', past: 'The dog did not run to town.', perfect: 'The dog has not run to town.', future: 'The dog will not run to town.' },
    },
  },
]

export default function TenseSwapperCore({ chapterNum }) {
  const examples = useMemo(
    () => ALL_EXAMPLES.filter(e => !chapterNum || e.minChapter <= chapterNum),
    [chapterNum]
  )

  const allowNegative = !chapterNum || chapterNum >= 9

  const [exampleIdx, setExampleIdx] = useState(0)
  const [tenseId, setTenseId] = useState('past')
  const [polarity, setPolarity] = useState('affirmative')

  // Force affirmative if a chapter <9 user somehow lands on negative.
  useEffect(() => {
    if (!allowNegative && polarity !== 'affirmative') setPolarity('affirmative')
  }, [allowNegative, polarity])

  // Clamp exampleIdx if filter shrinks the list.
  useEffect(() => {
    if (exampleIdx >= examples.length) setExampleIdx(0)
  }, [examples.length, exampleIdx])

  const example = examples[exampleIdx] || examples[0]
  const particle = example.perTense[polarity][tenseId]
  const english = example.english[polarity][tenseId]

  const nextExample = () => setExampleIdx(i => (i + 1) % examples.length)
  const prevExample = () => setExampleIdx(i => (i - 1 + examples.length) % examples.length)

  return (
    <section className="tense-swap-card">
      <div className="tense-swap-example-row">
        <button className="tense-swap-nav" onClick={prevExample} aria-label="Previous example">
          {'\u2190'}
        </button>
        <div className="tense-swap-example-title">{example.title}</div>
        <button className="tense-swap-nav" onClick={nextExample} aria-label="Next example">
          {'\u2192'}
        </button>
      </div>

      <div className="tense-swap-sentence">
        <span className="tense-swap-particle">{particle}</span>
        <span className="tense-swap-body">{example.body}</span>
        <span className="tense-swap-period">.</span>
      </div>

      <div className="tense-swap-english">{english}</div>

      <div className="tense-swap-hint">{example.hint}</div>

      <div className="tense-swap-control-group">
        <div className="tense-swap-control-label">Tense</div>
        <div className="tense-swap-buttons">
          {TENSES.map(t => (
            <button
              key={t.id}
              onClick={() => setTenseId(t.id)}
              className={`tense-swap-btn ${t.id === tenseId ? 'is-active' : ''}`}
            >
              <span className="tense-swap-btn-top">{example.perTense[polarity][t.id]}</span>
              <span className="tense-swap-btn-bottom">{t.english_label}</span>
            </button>
          ))}
        </div>
      </div>

      {allowNegative && (
        <div className="tense-swap-control-group">
          <div className="tense-swap-control-label">Polarity</div>
          <div className="tense-swap-buttons">
            <button
              onClick={() => setPolarity('affirmative')}
              className={`tense-swap-btn is-wide ${polarity === 'affirmative' ? 'is-active' : ''}`}
            >
              <span className="tense-swap-btn-top">{example.perTense.affirmative[tenseId]}</span>
              <span className="tense-swap-btn-bottom">Affirmative</span>
            </button>
            <button
              onClick={() => setPolarity('negative')}
              className={`tense-swap-btn is-wide ${polarity === 'negative' ? 'is-active' : ''}`}
            >
              <span className="tense-swap-btn-top">{example.perTense.negative[tenseId]}</span>
              <span className="tense-swap-btn-bottom">Negative</span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
