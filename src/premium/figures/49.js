// Lesson 49's figures, as data. Every Tongan and English string is copied from
// book/Chapter-49.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept.
//
// Most of this lesson is word-building inside one word (fe- in front, -ʻaki at the end),
// and its tables already show base and built form side by side. Tiles are whole words, so
// those tables keep the work. The one place the book sets two sentences against each
// other is the resultative ma-: "Compare this with the active transitive".

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The book's own comparison: the active transitive hae (to tear) against the ma- form
 *  mahae (to be torn), an intransitive state that results from an action (lines 110, 113, 119).
 *  Lanes are labelled action against resulting state, never named against unnamed doer, since
 *  Lesson 19 leaves a doer out without changing the verb. Shown as two lanes, two book sentences, not one turned into the other, since
 *  the pair also differs in ʻo Sialé. The question is about meaning, so nothing is ringed. */
export const F49_1 = {
  id: '49.1',
  kind: 'fork',
  types: ['fork'],
  title: 'The result, without naming who or what caused it',
  after: { section: 'ma-mo-ma-resultative-state', block: b => b.type === 'p' && b.text.startsWith('Compare this with the active transitive') },
  lanes: [
    { label: 'The action: to tear', forms: ['hae'] },
    { label: 'The state that results: to be torn', forms: ['mahae'] },
  ],
  scenes: [
    {
      key: 'hae-mahae',
      cases: [
        {
          lane: 0, say: 'Naʻe hae ʻe ia ʻa e kofú.', en: 'He tore the garment.',
          row: [face('Naʻe', 'tense'), { slot: true, form: face('hae', 'verb'), label: true }, face('ʻe ia', 'pronoun'), face('ʻa e kofú', 'quiet')],
        },
        {
          lane: 1, say: 'Naʻe mahae ʻa e kofu ʻo Sialé.', en: "Siale's garment was torn. (Something tore it, or it tore on its own.)",
          row: [face('Naʻe', 'tense'), { slot: true, form: face('mahae', 'verb'), label: true }, face('ʻa e kofu ʻo Sialé', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    'The active transitive: *Naʻe hae ʻe ia ʻa e kofú.* He tore the garment.',
    "The *ma-* form: *Naʻe mahae ʻa e kofu ʻo Sialé.* Siale's garment was torn. (Something tore it, or it tore on its own.) The *ma-* form describes the result without naming who or what caused it.",
  ],
}

/** The lesson's shape in one book sentence: a fe-...-ʻaki verb with a plural subject. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('nau', 'pronoun'), face('feʻofaʻaki', 'verb')],
  say: 'ʻOku nau feʻofaʻaki.',
  en: 'They love one another.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku nau feʻofaʻaki.', en: 'They love one another.' },
  { to: 'Naʻe mahae ʻa e kofu ʻo Sialé.', en: "Siale's garment was torn." },
  { to: 'Kātakiʻi ʻeku tōmui, naʻá ku moʻumohea.', en: 'Forgive my lateness, I overslept.' },
]

export const FIGURES = [F49_1]
