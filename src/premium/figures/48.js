// Lesson 48's figures, as data. Every Tongan and English string is copied from
// book/Chapter-48.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Labels are the book's words: noun, transitive,
// intransitive, part, whole, of.
// 48.3 uses the table's loose and compound forms, not the sentence pair above it: the pair
// also differs in the accent on helé, and a figure would teach that difference as part of
// the change.
// No figure for: -ʻanga, the -nga table, the -a nouns, the state suffixes, the three uses
// of -ʻia, -ngataʻa and -ngofua (each is a definition with examples, or a table that already
// shows the point), the durational -a (the book prints one sentence, no pair), Faiʻaki (one
// sentence), Words to Learn or Exercises. No opening row: a tile row cannot split a suffix
// from its base, so no five-tile book sentence shows the lesson's shape.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function wordCase(lane, form, en) {
  return { lane, say: form, en, row: [{ slot: true, form: face(form, 'quiet'), label: 'noun' }] }
}

/** The book's general distinction: -ʻanga answers "where?", -nga answers "what?". */
export const F48_1 = {
  id: '48.1',
  kind: 'fork',
  types: ['fork'],
  title: 'The general distinction: *-ʻanga* or *-nga*?',
  // After "In some cases the difference is small ... the general distinction holds".
  after: { section: 'nga-thing-not-place', block: b => b.type === 'p' && b.text.startsWith('In some cases the difference is small') },
  lanes: [
    { label: 'Answers “where?”: a place', forms: ['-ʻanga'] },
    { label: 'Answers “what?”: a thing', forms: ['-nga'] },
  ],
  scenes: [
    {
      key: 'mohe',
      cases: [
        wordCase(0, 'moheʻanga', 'sleeping-place (where you sleep)'),
        wordCase(1, 'mohenga', 'bed (the thing you sleep on)'),
      ],
    },
    {
      key: 'tuu',
      cases: [
        wordCase(0, 'tuʻuʻanga', 'standing-place, site'),
        wordCase(1, 'tuʻunga', 'stand, ladder, or (figuratively) rank, status'),
      ],
    },
  ],
  alt: [
    '*-ʻanga* points to a place and answers "where?". *moheʻanga*: sleeping-place (where you sleep). *tuʻuʻanga*: standing-place, site.',
    '*-nga* points to a thing and answers "what?". *mohenga*: bed (the thing you sleep on). *tuʻunga*: stand, ladder, or (figuratively) rank, status.',
  ],
}

/** The same sentence with each verb: someone broke it, or it is in a broken state. */
export const F48_2 = {
  id: '48.2',
  kind: 'row',
  types: ['swap'],
  title: 'Two ways to say “passive”',
  after: { section: 'adjective-and-intransitive-suffixes', block: b => b.type === 'p' && b.text.startsWith('Tongan has no passive verb form') },
  scenes: [
    {
      key: 'ipu',
      tiles: {
        tense: [face('Naʻe', 'tense')],
        verb: [face('foaʻi', 'verb', 'transitive'), face('mafoa', 'verb', 'intransitive')],
        rest: [face('ʻa e ipú', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Naʻe foaʻi ʻa e ipú.', en: 'The cup was broken, by someone.' },
        { say: 'Naʻe mafoa ʻa e ipú.', en: 'The cup broke, it is in a broken state.' },
      ],
      states: [
        [['tense', 0], ['verb', 0], ['rest', 0]],
        [['tense', 0], ['verb', 1], ['rest', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'verb', to: 1 }],
      alt: [
        '*Naʻe foaʻi ʻa e ipú.* The cup was broken, by someone. The impersonal transitive: a transitive verb without naming the agent.',
        '*Naʻe mafoa ʻa e ipú.* The cup broke, it is in a broken state. A state-describing intransitive verb. The first implies someone broke it; the second describes the result.',
      ],
    },
  ],
}

function compoundScene(key, part, partI, whole, loose, compound, en) {
  return {
    key,
    tiles: {
      part: [face(part, 'quiet', 'part'), face(partI, 'quiet', 'part')],
      of: [face('ʻo e', 'quiet', 'of')],
      whole: [face(whole, 'quiet', 'whole')],
    },
    before: { say: loose },
    after: { say: compound, en },
    states: [
      [['part', 0], ['of', 0], ['whole', 0]],
      [['part', 0], ['whole', 0]],
      [['part', 1], ['whole', 0]],
    ],
    beats: [{ kind: 'drop', tile: 'of', to: 1 }, { kind: 'swap', tile: 'part', to: 2 }, { kind: 'en' }],
    alt: [`*${loose}*, the loose form, joined by *ʻo*.`, `*${compound}*, the compound: *-ʻi* replaces *ʻo* and fuses the two nouns. ${en}.`],
  }
}

/** -ʻi takes the place of ʻo (of) and bonds the part to the whole. */
export const F48_3 = {
  id: '48.3',
  kind: 'row',
  types: ['drop', 'swap'],
  title: '*-ʻi* replaces *ʻo* (of)',
  after: { section: 'possessive-suffix-i-compound-nouns', block: b => b.type === 'p' && b.text.startsWith('The compound form is tighter') },
  scenes: [
    compoundScene('hele', 'mata', 'mataʻi', 'hele', 'mata ʻo e hele', 'mataʻi hele', 'knife-blade'),
    compoundScene('ika', 'ʻulu', 'ʻuluʻi', 'ika', 'ʻulu ʻo e ika', 'ʻuluʻi ika', 'fish-head'),
  ],
}

/**
 * Recall cards, by key rule. The first two rules are about forming a word and the book
 * prints no sentence for them, so their cards carry the book's own example word and gloss.
 */
export const RECALL = [
  { to: 'nofoʻanga', en: 'dwelling-place' },
  { to: 'mohenga', en: 'bed (the thing you sleep on)' },
  { to: 'ʻOku kumāʻia e ngouē.', en: 'The garden is infested with rats.' },
]

export const FIGURES = [F48_1, F48_2, F48_3]
