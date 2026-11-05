// Lesson 8's figures, as data. Every Tongan and English string is copied from
// book/Chapter-08.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The labels are the book's own: "preposition",
// "article", "noun", "indefinite", "definite", the heads of its Bare noun table. Figure 8.1's
// slot has no label: on a phone it ran into "preposition" under the narrow ki and ʻi tiles.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function theCase(lane, lead, before, form, noun, say, en) {
  return {
    lane, say, en,
    row: [
      face(lead, 'quiet'),
      { ...before, ring: true },
      { slot: true, form: face(form, 'quiet') },
      face(noun, 'quiet'),
    ],
  }
}

const prep = text => face(text, 'quiet', 'preposition')
const verb = text => face(text, 'verb')

/** "The form depends on which word comes directly before the article": ring that word, the lane picks the form. */
export const F8_1 = {
  id: '8.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Which form of “the”? Look at the word directly before it',
  after: { section: 'the-definite-article-e-and-he', block: b => b.type === 'p' && b.text.startsWith('The full rule') },
  lanes: [
    { label: 'After *ʻi*, *ki*, *mei*', forms: ['he'] },
    { label: 'Elsewhere', forms: ['e', 'ʻa e'] },
  ],
  scenes: [
    {
      key: 'ki-kai',
      cases: [
        theCase(0, 'Té u ʻalu', prep('ki'), 'he', 'fale', 'Té u ʻalu ki he fale.', 'I will go to the house.'),
        theCase(1, 'Naʻá ke', verb('kai'), 'ʻa e', 'mā', 'Naʻá ke kai ʻa e mā?', 'Did you eat the bread?'),
      ],
    },
    {
      key: 'i-fiemau',
      cases: [
        theCase(0, 'Naʻá ku nofo', prep('ʻi'), 'he', 'fale kai', 'Naʻá ku nofo ʻi he fale kai.', 'I stayed in the cafeteria.'),
        theCase(1, 'ʻOku ou', verb('fiemaʻu'), 'ʻa e', 'talo', 'ʻOku ou fiemaʻu ʻa e talo.', 'I want the taro.'),
      ],
    },
    {
      key: 'mei-kai',
      cases: [
        theCase(0, 'Naʻa mau haʻu', prep('mei'), 'he', 'kolo', 'Naʻa mau haʻu mei he kolo.', 'We came from the town.'),
        theCase(1, 'Naʻá ke', verb('kai'), 'e', 'mā', 'Naʻá ke kai e mā?', 'Did you eat the bread?'),
      ],
    },
  ],
  alt: [
    'The form depends on which word comes directly before the article.',
    'After *ʻi*, *ki*, *mei*, use *he*: *Té u ʻalu ki he fale.* I will go to the house. *Naʻá ku nofo ʻi he fale kai.* I stayed in the cafeteria. *Naʻa mau haʻu mei he kolo.* We came from the town.',
    'Elsewhere, *e* or *ʻa e*: *Naʻá ke kai ʻa e mā?* Did you eat the bread? *ʻOku ou fiemaʻu ʻa e talo.* I want the taro. *Naʻá ke kai e mā?* Did you eat the bread?',
  ],
}

/** The book's full contrast: verb and speaker hold still, ha arrives, then ʻa e takes its place and talo takes its accent. */
export const F8_2 = {
  id: '8.2',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'Three ways to connect a noun to a verb',
  after: { section: 'the-contrast-ha-vs-e-he', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('talō')) },
  chips: [
    { state: 0, to: 'talo', en: 'Bare noun' },
    { state: 1, to: 'ha talo', en: 'Indefinite article' },
    { state: 2, to: 'ʻa e talō', en: 'Definite article' },
  ],
  scenes: [
    {
      key: 'talo',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        pron: [face('ou', 'pronoun')],
        verb: [face('fiemaʻu', 'verb')],
        art: [face('ha', 'quiet', 'indefinite'), face('ʻa e', 'quiet', 'definite')],
        noun: [face('talo', 'quiet', 'noun'), face('talō', 'quiet', 'noun')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ʻOku ou fiemaʻu talo.', en: 'I want taro.' },
        { say: 'ʻOku ou fiemaʻu ha talo.', en: 'I want some taro.' },
        { say: 'ʻOku ou fiemaʻu ʻa e talō.', en: 'I want the taro.' },
      ],
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['noun', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['art', 0], ['noun', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['art', 1], ['noun', 1]],
      ],
      beats: [
        { kind: 'add', tile: 'art', to: 1 },
        { kind: 'swap', tile: ['art', 'noun'], to: 2 },
      ],
      alt: [
        'Bare noun: *ʻOku ou fiemaʻu talo.* I want taro.',
        'Indefinite article: *ʻOku ou fiemaʻu ha talo.* I want some taro.',
        'Definite article: *ʻOku ou fiemaʻu ʻa e talō.* I want the taro. Notice the stress on the last vowel of *talō*.',
      ],
    },
  ],
}

/** The book's pairs: ʻi leaves and the English holds, since both forms are correct. */
export const F8_3 = {
  id: '8.3',
  kind: 'row',
  types: ['drop'],
  title: 'In speech, *ʻi* is dropped before *he*',
  after: { section: 'dropping-i-before-he', block: b => b.type === 'p' && b.text.startsWith('Both forms are correct') },
  scenes: [
    {
      key: 'nofo',
      tiles: {
        tense: [face('Té', 'tense')],
        pron: [face('u', 'pronoun')],
        verb: [face('nofo', 'verb')],
        i: [face('ʻi', 'quiet', 'preposition')],
        he: [face('he fale', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Té u nofo ʻi he fale.', en: 'I will stay in the house.' },
        { say: 'Té u nofo he fale.', en: 'I will stay in the house.' },
      ],
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['i', 0], ['he', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['GHOST'], ['he', 0]],
      ],
      beats: [{ kind: 'drop', tile: 'i', to: 1 }],
      alt: [
        '*Té u nofo ʻi he fale.* I will stay in the house.',
        '*Té u nofo he fale.* I will stay in the house. Both forms are correct. In speech, the short form is normal.',
      ],
    },
    {
      key: 'ngaue',
      tiles: {
        tense: [face('ʻOkú', 'tense')],
        pron: [face('ke', 'pronoun')],
        verb: [face('ngāue', 'verb')],
        i: [face('ʻi', 'quiet', 'preposition')],
        he: [face('he kolo', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ʻOkú ke ngāue ʻi he kolo?', en: 'Do you work in the town?' },
        { say: 'ʻOkú ke ngāue he kolo?', en: 'Do you work in the town?' },
      ],
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['i', 0], ['he', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['GHOST'], ['he', 0]],
      ],
      beats: [{ kind: 'drop', tile: 'i', to: 1 }],
      alt: [
        '*ʻOkú ke ngāue ʻi he kolo?* Do you work in the town?',
        '*ʻOkú ke ngāue he kolo?* Do you work in the town? This applies only to *ʻi*.',
      ],
    },
  ],
}

/** The opening row in the hero: ha before its noun, the lesson's first sentence. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('ou', 'pronoun'), face('fiemaʻu', 'verb'), face('ha ika', 'quiet', 'noun phrase')],
  say: 'ʻOku ou fiemaʻu ha ika.',
  en: 'I want some fish.',
}

/** Recall cards, by key rule: book sentences only. The third rule's card is the bare noun, the form the first two do not show. */
export const RECALL = [
  { to: 'ʻOku ou fiemaʻu ha ika.', en: 'I want some fish.' },
  { to: 'Té u ʻalu ki he fale.', en: 'I will go to the house.' },
  { to: 'ʻOku ou fiemaʻu talo.', en: 'I want taro.' },
]

export const FIGURES = [F8_1, F8_2, F8_3]
