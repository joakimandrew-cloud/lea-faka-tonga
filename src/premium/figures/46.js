// Lesson 46's figures, as data. Every Tongan and English string is copied from
// book/Chapter-46.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note tahí and lotó only after he.
// No figure for hou'eiki (one example), the verbs with ʻi and ʻia (its four-row table
// sets the pairs side by side, and 46.3 teaches the same choice), laʻi (a definition
// with examples and a table), Words to Learn or Exercises.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function localScene(key, prep, plain, accented, lines) {
  return {
    key,
    tiles: {
      prep: [face(prep, 'quiet')],
      he: [face('he', 'quiet', 'article')],
      noun: [face(plain, 'noun', 'local noun'), face(accented, 'noun', 'common noun')],
    },
    before: null,
    after: null,
    lines,
    states: [
      [['prep', 0], ['noun', 0]],
      [['prep', 0], ['he', 0], ['noun', 1]],
    ],
    beats: [{ kind: 'add', tile: 'he', roll: 'noun', to: 1 }],
    alt: [
      `*${lines[0].say}* (${lines[0].en}) vs. *${lines[1].say}* (${lines[1].en}).`,
      'When they take an article and the definitive accent, they become common nouns with a more specific meaning.',
    ],
  }
}

/** The book's examples: an article and the accent turn a local noun into a common noun. */
export const F46_1 = {
  id: '46.1',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'These words, with an article and the definitive accent, become common nouns',
  after: { section: 'personal-and-local-nouns', block: b => b.type === 'examples' },
  scenes: [
    localScene('tahi', 'ki', 'tahi', 'tahí', [
      { say: 'ki tahi', en: 'to sea, generally' },
      { say: 'ki he tahí', en: 'to the sea, a specific body of water' },
    ]),
    localScene('loto', 'ʻi', 'loto', 'lotó', [
      { say: 'ʻi loto', en: 'inside' },
      { say: 'ʻi he lotó', en: 'in the mind' },
    ]),
  ],
}

function possScene(key, word, lines, altText) {
  return {
    key,
    tiles: {
      poss: [face('ʻene', 'quiet', 'ʻe-class possessive'), face('hono', 'quiet', 'ho-class possessive')],
      word: [{ text: word, role: 'verb', label: '' }],
    },
    before: null,
    after: null,
    lines,
    states: [
      [['poss', 0], ['word', 0]],
      [['poss', 1], ['word', 0]],
    ],
    beats: [{ kind: 'swap', tile: 'poss', to: 1 }],
    alt: altText,
  }
}

/** The book's two pairs: only the possessive changes, and the meaning with it. */
export const F46_2 = {
  id: '46.2',
  kind: 'row',
  types: ['swap'],
  title: 'The possessive class signals the difference',
  after: { section: 'verbal-nouns-as-a-noun-class', block: b => b.type === 'p' && b.text.startsWith('The possessive class') },
  scenes: [
    possScene('taki', 'taki', [
      { say: 'ʻene taki', en: 'his leading' },
      { say: 'hono taki', en: 'his being led' },
    ], [
      '*ʻene taki*, his leading: he does the leading, an ʻe-class possessive.',
      '*hono taki*, his being led: the leading is done to him, a ho-class possessive.',
    ]),
    possScene('malohi', 'mālohi', [
      { say: 'ʻene mālohi', en: 'his being strong' },
      { say: 'hono mālohi', en: 'his strength' },
    ], [
      '*ʻene mālohi*, his being strong: a state, a verbal noun.',
      '*hono mālohi*, his strength: a quality, an abstract noun.',
    ]),
  ],
}

/** The summary table read as a choice: the type of noun picks the preposition form. */
export const F46_3 = {
  id: '46.3',
  kind: 'fork',
  types: ['fork'],
  title: 'What type of noun follows ki?',
  after: { section: 'summary-of-the-classification-system', block: b => b.type === 'p' && b.text.startsWith('The classification determines') },
  lanes: [
    { label: 'Personal noun', forms: ['kia'] },
    { label: 'Local noun', forms: ['ki'] },
    { label: 'Common noun', forms: ['ki he'] },
  ],
  scenes: [
    {
      key: 'people',
      cases: [
        {
          lane: 0, say: 'kia Mele', en: 'to Mele',
          row: [{ slot: true, form: face('kia', 'quiet'), label: 'preposition' }, { ...face('Mele', 'noun', 'personal noun'), ring: true }],
        },
        {
          lane: 2, say: 'ki he fefiné', en: 'to the woman',
          row: [{ slot: true, form: face('ki he', 'quiet'), label: 'preposition' }, { ...face('fefiné', 'noun', 'common noun'), ring: true }],
        },
      ],
    },
    {
      key: 'places',
      cases: [
        {
          lane: 1, say: 'ki Vavaʻu', en: 'to Vavaʻu',
          row: [{ slot: true, form: face('ki', 'quiet'), label: 'preposition' }, { ...face('Vavaʻu', 'noun', 'local noun'), ring: true }],
        },
        {
          lane: 2, say: 'ki he motú', en: 'to the island',
          row: [{ slot: true, form: face('ki he', 'quiet'), label: 'preposition' }, { ...face('motú', 'noun', 'common noun'), ring: true }],
        },
      ],
    },
  ],
  alt: [
    'Personal nouns, names of people: *ʻia*, *kia*, *meia*. *kia Mele* (to Mele).',
    'Local nouns, names of places: *ʻi*, *ki*, *mei*. *ki Vavaʻu* (to Vavaʻu).',
    'Common nouns, everything else: *ʻi he*, *ki he*, *mei he*. *ki he fefiné* (to the woman). *ki he motú* (to the island).',
    'If you know what type of noun follows a preposition, you know which form to use.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOkú', 'tense'), face('ne', 'pronoun'), face('ʻofa', 'verb'), face('ʻia', 'quiet'), face('Seini', 'noun', 'personal noun')],
  say: 'ʻOkú ne ʻofa ʻia Seini.',
  en: 'He loves Seini.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOkú ne ʻita ʻia Tēvita.', en: 'He is angry at Tēvita.' },
  { to: 'ki Vavaʻu', en: 'to Vavaʻu' },
  { to: 'ki tahi', en: 'to sea, generally' },
]

export const FIGURES = [F46_1, F46_2, F46_3]
