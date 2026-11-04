// Lesson 2's figures, as data. Every Tongan and English string is copied from
// book/Chapter-02.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The labels are the book's own wherever it
// has them: the Tense column, "We, but not you", "We, and you too", the table's heads.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The sentence that opens the lesson says it: swap in a different marker and the tense changes,
 *  the pronoun and verb stay the same. One slot turns over, ke and kai hold still. The forms and
 *  English are those of the book's table under The Four Tense Markers. */
export const F2_1 = {
  id: '2.1',
  kind: 'row',
  types: ['swap'],
  title: 'Only the opening marker changes',
  after: { section: 'three-new-tense-markers', block: b => b.type === 'p' && b.text.startsWith('So far, the only tense marker') },
  chips: [
    { state: 0, to: 'naʻa', en: 'past' },
    { state: 1, to: 'ʻoku', en: 'present' },
    { state: 2, to: 'kuo', en: 'perfect' },
    { state: 3, to: 'te', en: 'future' },
  ],
  scenes: [
    {
      key: 'ke-kai',
      tiles: {
        tense: [face('Naʻá', 'tense', 'past'), face('ʻOkú', 'tense', 'present'), face('Kuó', 'tense', 'perfect'), face('Té', 'tense', 'future')],
        pron: [face('ke', 'pronoun')],
        verb: [face('kai', 'verb')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Naʻá ke kai.', en: 'You ate.' },
        { say: 'ʻOkú ke kai.', en: 'You eat.' },
        { say: 'Kuó ke kai.', en: 'You have eaten.' },
        { say: 'Té ke kai.', en: 'You will eat.' },
      ],
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 1], ['pron', 0], ['verb', 0]],
        [['tense', 2], ['pron', 0], ['verb', 0]],
        [['tense', 3], ['pron', 0], ['verb', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'tense', to: 1 },
        { kind: 'swap', tile: 'tense', to: 2 },
        { kind: 'swap', tile: 'tense', to: 3 },
      ],
      alt: [
        'The verb and pronoun stay the same in each sentence. Only the opening marker changes.',
        'Past, *naʻa*: *Naʻá ke kai.* You ate.',
        'Present, *ʻoku*: *ʻOkú ke kai.* You eat.',
        'Perfect, *kuo*: *Kuó ke kai.* You have eaten.',
        'Future, *te*: *Té ke kai.* You will eat.',
      ],
    },
  ],
}

function iCase(lane, marker, form, say, en, verb = 'kai') {
  return {
    lane, say, en,
    row: [
      { ...face(marker, 'tense'), ring: true },
      { slot: true, form: face(form, 'pronoun'), label: true },
      face(verb, 'verb'),
    ],
  }
}

/** Three Forms for "I": the form depends on the tense marker before it. */
export const F2_2 = {
  id: '2.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Which “I”? Look at the tense marker',
  after: { section: 'three-forms-for-i', block: b => b.type === 'p' && b.text.startsWith('*Ku* remains') },
  lanes: [
    { label: 'After *naʻa*', forms: ['ku'] },
    { label: 'After *ʻoku*', forms: ['ou'] },
    { label: 'After *kuo* and *te*', forms: ['u'] },
  ],
  scenes: [
    {
      key: 'ku-ou',
      cases: [
        iCase(0, 'Naʻá', 'ku', 'Naʻá ku kai.', 'I ate.'),
        iCase(1, 'ʻOku', 'ou', 'ʻOku ou kai.', 'I eat.'),
      ],
    },
    {
      key: 'u',
      cases: [
        iCase(2, 'Kuó', 'u', 'Kuó u kai.', 'I have eaten.'),
        iCase(2, 'Té', 'u', 'Té u kai.', 'I will eat.'),
      ],
    },
  ],
  alt: [
    'After *naʻa*: *ku*. *Naʻá ku kai.* I ate.',
    'After *ʻoku*: *ou*. *ʻOku ou kai.* I eat.',
    'After *kuo* and *te*: *u*. *Kuó u kai.* I have eaten. *Té u kai.* I will eat.',
  ],
}

function weCase(lane, marker, form, verb, say, en, group) {
  return {
    lane, say, en, group, ringPerson: 3,
    row: [face(marker, 'tense'), { slot: true, form: face(form, 'pronoun'), label: true }, face(verb, 'verb')],
  }
}

/** Two Kinds of "We": the choice is whether the person addressed is in the group. */
export const F2_3 = {
  id: '2.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Is the listener in the group?',
  after: { section: 'more-pronouns', block: b => b.type === 'p' && b.text.startsWith('The choice between') },
  people: ['third', 'third', 'speaker', 'listener'],
  lanes: [
    { label: 'We, but not you', forms: ['mau'] },
    { label: 'We, and you too', forms: ['tau'] },
  ],
  scenes: [
    {
      key: 'mau-tau',
      cases: [
        weCase(0, 'Naʻa', 'mau', 'kai', 'Naʻa mau kai.', 'We ate. (You were not part of it.)', [0, 1, 2]),
        weCase(1, 'ʻOku', 'tau', 'hiva', 'ʻOku tau hiva.', 'We sing. (All of us, including you.)', [0, 1, 2, 3]),
      ],
    },
  ],
  alt: [
    '*mau*: the speaker and their group are in the group, and the listener is not. *Naʻa mau kai.* We ate. (You were not part of it.)',
    '*tau*: the speaker, the listener and anyone else involved are all in the group. *ʻOku tau hiva.* We sing. (All of us, including you.)',
  ],
}

const S = 'speaker'
const L = 'listener'
const T = 'third'

/** A cell: its form, the marks it counts, and a book sentence. Below the grid the sentence sits
 *  with everyone in the room: others, speaker, listener. Those the word means get a frame. */
function cell(form, count, say, en) {
  const others = count.filter(who => who === T)
  const listeners = count.filter(who => who === L)
  const people = [...others, S, ...(listeners.length ? listeners : [L])]
  const members = people.map((who, i) => (who === T || count.includes(who) ? i : -1)).filter(i => i >= 0)
  return { form, count, say, en, people, members }
}

/** Dual Pronouns: the book's table, its rows and columns, with the marks counting the people. */
export const F2_4 = {
  id: '2.4',
  kind: 'grid',
  types: ['grid'],
  title: 'One, two, three or more',
  after: { section: 'dual-pronouns', block: b => b.type === 'table' },
  lightColumns: true,
  head: ['', 'One', 'Two', 'Three or more'],
  rows: [
    { tense: 'I / We (exclusive)', cells: [
      cell('ku, ou, u', [S], 'Naʻá ku kai.', 'I ate.'),
      cell('ma', [S, T], 'Naʻá ma kai.', 'We two ate. (Not you.)'),
      cell('mau', [S, T, T], 'Naʻa mau kai.', 'We ate. (You were not part of it.)'),
    ] },
    { tense: 'We (inclusive)', cells: [
      { none: true, form: '(none)' },
      cell('ta', [S, L], 'Ta hiva?', 'Shall we (two) sing?'),
      cell('tau', [S, L, T], 'ʻOku tau hiva.', 'We sing. (All of us, including you.)'),
    ] },
    { tense: 'You', cells: [
      cell('ke', [L], 'Té ke kai.', 'You will eat.'),
      cell('mo', [L, L], 'ʻOkú mo lea.', 'You two speak.'),
      cell('mou', [L, L, L], 'Te mou hiva.', 'You all will sing.'),
    ] },
    { tense: 'He, she, it / They', cells: [
      cell('ne', [T], 'Naʻá ne kai.', 'He ate. / She ate.'),
      cell('na', [T, T], 'Té na mohe.', 'They two will sleep.'),
      cell('nau', [T, T, T], 'Naʻa nau kai.', 'They ate.'),
    ] },
  ],
  rest: { row: 0, col: 1 },
  scenes: [{ key: 'grid' }],
}

function stressScene(key, a, b, p, q, verb, sayA, sayB) {
  return {
    key,
    tiles: {
      tense: [face(a, 'tense'), face(b, 'tense')],
      pron: [face(p, 'pronoun', 'one syllable'), face(q, 'pronoun', 'two syllables')],
      verb: [face(verb, 'verb')],
    },
    before: null,
    after: null,
    lines: [
      { say: sayA, note: 'accent, stress shifts' },
      { say: sayB, note: 'no accent, stress stays' },
    ],
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0]],
      [['tense', 1], ['pron', 1], ['verb', 0]],
    ],
    beats: [{ kind: 'swap', tile: ['tense', 'pron'], to: 1 }],
    alt: [`*${sayA}* A one-syllable pronoun: accent, stress shifts. *${sayB}* A two-syllable pronoun: no accent, stress stays.`],
  }
}

/** The book's four pairs: the same marker and verb, a one-syllable pronoun swapped for a two-syllable one. */
export const F2_5 = {
  id: '2.5',
  kind: 'row',
  types: ['swap'],
  title: 'One syllable shifts the stress, two do not',
  after: { section: 'pronunciation-stress-across-all-combinations', block: b => b.type === 'p' && b.text.includes('Te mou kai') },
  scenes: [
    stressScene('oku', 'ʻOkú', 'ʻOku', 'na', 'nau', 'lea', 'ʻOkú na lea.', 'ʻOku nau lea.'),
    stressScene('kuo', 'Kuó', 'Kuo', 'ne', 'nau', 'kai', 'Kuó ne kai.', 'Kuo nau kai.'),
    stressScene('naa', 'Naʻá', 'Naʻa', 'ke', 'mou', 'mohe', 'Naʻá ke mohe.', 'Naʻa mou mohe.'),
    stressScene('te', 'Té', 'Te', 'ke', 'mou', 'kai', 'Té ke kai.', 'Te mou kai.'),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING_2 = {
  row: [face('Té', 'tense'), face('ke', 'pronoun'), face('kai', 'verb')],
  say: 'Té ke kai.',
  en: 'You will eat.',
}

/** Recall cards, by key rule: book sentences only (Direction.md part 5). */
export const RECALL_2 = [
  { to: 'ʻOkú ke kai.', en: 'You eat.' },
  { to: 'Kuó u kai.', en: 'I have eaten.' },
  { to: 'ʻOku tau hiva.', en: 'We sing. (All of us, including you.)' },
  { to: 'Tau kai.', en: "Let's eat." },
]

export const FIGURES_2 = [F2_1, F2_2, F2_3, F2_4, F2_5]
