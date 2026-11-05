// Lesson 14's figures, as data. Every Tongan and English string is copied from
// book/Chapter-14.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its macrons and stress accents kept. Greetings are fixed formulas, so the figures
// stay on the few places where the book shows a change or a choice.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** "Several variations use the same mālō e pattern": one slot turns over, Mālō e holds still. */
export const F14_1 = {
  id: '14.1',
  kind: 'row',
  types: ['swap'],
  title: 'The same *mālō e* pattern',
  after: { section: 'malo-e-ofa', block: b => b.type === 'p' && b.text.startsWith('Several variations') },
  chips: [
    { state: 0, to: 'lelei', en: 'well' },
    { state: 1, to: 'ʻofa', en: 'kindness' },
    { state: 2, to: 'tokoni mai', en: 'help' },
    { state: 3, to: 'lava mai', en: 'coming' },
  ],
  scenes: [
    {
      key: 'malo-e',
      tiles: {
        malo: [face('Mālō e', 'quiet')],
        slot: [face('lelei', 'quiet'), face('ʻofa', 'quiet'), face('tokoni mai', 'quiet'), face('lava mai', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Mālō e lelei!', en: 'Hello.' },
        { say: 'Mālō e ʻofa!', en: 'Thank you for your kindness.' },
        { say: 'Mālō e tokoni mai!', en: 'Thanks for your help' },
        { say: 'Mālō e lava mai!', en: 'Thanks for coming.' },
      ],
      states: [
        [['malo', 0], ['slot', 0]],
        [['malo', 0], ['slot', 1]],
        [['malo', 0], ['slot', 2]],
        [['malo', 0], ['slot', 3]],
      ],
      beats: [
        { kind: 'swap', tile: 'slot', to: 1 },
        { kind: 'swap', tile: 'slot', to: 2 },
        { kind: 'swap', tile: 'slot', to: 3 },
      ],
      alt: [
        'Several variations use the same *mālō e* pattern.',
        '*Mālō e lelei!* Hello.',
        '*Mālō e ʻofa!* Thank you for your kindness.',
        '*Mālō e tokoni mai!* Thanks for your help.',
        '*Mālō e lava mai!* Thanks for coming.',
      ],
    },
  ],
}

function farewell(lane, verb, say, en) {
  return { lane, say, en, row: [{ slot: true, form: face(verb, 'verb') }, face('ā', 'particle')] }
}

/** "Tongan farewells depend on who is leaving and who is staying": the same English, two verbs. */
export const F14_2 = {
  id: '14.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Who is leaving, and who is staying?',
  after: { section: 'farewells', block: b => b.type === 'examples' },
  lanes: [
    { label: 'To the person who is leaving', forms: ['ʻAlu'] },
    { label: 'To the person who is staying', forms: ['Nofo'] },
    { label: 'To someone going to bed', forms: ['Mohe'] },
  ],
  scenes: [
    {
      key: 'alu-nofo',
      cases: [
        farewell(0, 'ʻAlu', 'ʻAlu ā!', 'Goodbye.'),
        farewell(1, 'Nofo', 'Nofo ā!', 'Goodbye.'),
      ],
    },
    {
      key: 'mohe',
      cases: [farewell(2, 'Mohe', 'Mohe ā!', 'Goodnight.')],
    },
  ],
  alt: [
    '*ʻAlu ā!* Goodbye. (Said to the person who is leaving.)',
    '*Nofo ā!* Goodbye. (Said to the person who is staying.)',
    '*Mohe ā!* Goodnight. (Said to someone going to bed.)',
  ],
}

/** The book's three lines: the bare imperative, ā makes it a farewell, ē is the friendly embellishment. */
export const F14_3 = {
  id: '14.3',
  kind: 'row',
  types: ['add'],
  title: 'A bare verb becomes a farewell',
  after: { section: 'farewells', block: b => b.type === 'p' && b.text.startsWith('The *ē* is a friendly') },
  scenes: [
    {
      key: 'alu',
      tiles: {
        verb: [face('ʻAlu', 'verb')],
        a: [face('ā', 'particle', 'tonal adverb')],
        e: [face('ē', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ʻAlu!', en: 'Go.' },
        { say: 'ʻAlu ā!', en: 'Goodbye.' },
        { say: 'ʻAlu ā ē!', en: 'Goodbye.' },
      ],
      states: [
        [['verb', 0]],
        [['verb', 0], ['a', 0]],
        [['verb', 0], ['a', 0], ['e', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'a', to: 1 },
        { kind: 'add', tile: 'e', to: 2 },
      ],
      alt: [
        'Without *ā*, the verb is a bare imperative: *ʻAlu!* Go.',
        'With *ā*, it becomes a polite farewell: *ʻAlu ā!* Go well, goodbye.',
        'In speech, a vocative *ē* often appears at the end: *ʻAlu ā ē!* Goodbye.',
      ],
    },
  ],
}

const COUNTS = ['To one person', 'To two people', 'To three or more']

function countScene(key, one, plural, sayOne, sayTwo, sayMore) {
  return {
    key,
    tiles: {
      pron: [face('Mo', 'pronoun'), face('Mou', 'pronoun')],
      verb: [face(one, 'verb'), face(plural, 'verb')],
      a: [face('ā', 'particle', 'tonal adverb')],
    },
    before: null,
    after: null,
    lines: [
      { say: sayOne, note: COUNTS[0] },
      { say: sayTwo, note: COUNTS[1] },
      { say: sayMore, note: COUNTS[2] },
    ],
    states: [
      [['verb', 0], ['a', 0]],
      [['pron', 0], ['verb', 1], ['a', 0]],
      [['pron', 1], ['verb', 1], ['a', 0]],
    ],
    beats: [
      { kind: 'add', tile: 'pron', roll: 'verb', to: 1 },
      { kind: 'swap', tile: 'pron', to: 2 },
    ],
    alt: [`${COUNTS[0]}: *${sayOne}* ${COUNTS[1]}: *${sayTwo}* ${COUNTS[2]}: *${sayMore}*`],
  }
}

/** The book's table, read along its rows: mo + verb, mou + verb, and the plural form of "go" is ō. */
export const F14_4 = {
  id: '14.4',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'One person, two, three or more',
  after: { section: 'farewells', block: b => b.type === 'p' && b.text.startsWith('These follow the imperative') },
  scenes: [
    countScene('leaving', 'ʻAlu', 'ō', 'ʻAlu ā!', 'Mo ō ā!', 'Mou ō ā!'),
    countScene('staying', 'Nofo', 'nofo', 'Nofo ā!', 'Mo nofo ā!', 'Mou nofo ā!'),
  ],
}

/** The Note's pair: the pronoun turns from you to I, ʻIo arrives, and English says "No". */
export const F14_5 = {
  id: '14.5',
  kind: 'row',
  types: ['swap', 'add'],
  title: '*ʻIo* when answering negative questions where English would say “no”',
  after: { section: 'io-and-ikai', block: b => b.type === 'note' },
  scenes: [
    {
      key: 'alu',
      tiles: {
        io: [face('ʻIo,', 'quiet')],
        neg: [face('Naʻe ʻikai té', 'quiet'), face('naʻe ʻikai té', 'quiet')],
        pron: [face('ke', 'pronoun'), face('u', 'pronoun')],
        verb: [face('ʻalu', 'verb')],
      },
      before: { say: 'Naʻe ʻikai té ke ʻalu?', en: "Didn't you go?" },
      after: { say: 'ʻIo, naʻe ʻikai té u ʻalu.', en: "No, I didn't go." },
      states: [
        [['neg', 0], ['pron', 0], ['verb', 0]],
        [['neg', 0], ['pron', 1], ['verb', 0]],
        [['io', 0], ['neg', 1], ['pron', 1], ['verb', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'pron', to: 1 },
        { kind: 'add', tile: 'io', roll: 'neg', to: 2 },
        { kind: 'en' },
      ],
      alt: [
        "*Naʻe ʻikai té ke ʻalu?* Didn't you go?",
        "*ʻIo, naʻe ʻikai té u ʻalu.* No, I didn't go. The *ʻio* confirms the negative.",
      ],
    },
  ],
}

/** "The answer follows the same pattern": two slots turn over, Ko, taʻu and eni hold still. */
export const F14_6 = {
  id: '14.6',
  kind: 'row',
  types: ['swap'],
  title: 'The answer follows the same pattern',
  after: { section: 'asking-someones-age', block: b => b.type === 'examples' && JSON.stringify(b).includes('hoku') },
  scenes: [
    {
      key: 'age',
      tiles: {
        ko: [face('Ko', 'quiet')],
        poss: [face('ho', 'pronoun', 'possessive pronoun'), face('hoku', 'pronoun', 'possessive pronoun')],
        tau: [face('taʻu', 'quiet')],
        num: [face('fiha', 'question'), face('uofulu', 'quiet')],
        eni: [face('eni', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ko ho taʻu fiha eni?', en: 'How old are you?' },
        { say: 'Ko hoku taʻu uofulu eni.', en: 'I am twenty years old.' },
      ],
      states: [
        [['ko', 0], ['poss', 0], ['tau', 0], ['num', 0], ['eni', 0]],
        [['ko', 0], ['poss', 1], ['tau', 0], ['num', 1], ['eni', 0]],
      ],
      beats: [{ kind: 'swap', tile: ['poss', 'num'], to: 1 }],
      alt: [
        '*Ko ho taʻu fiha eni?* How old are you?',
        '*Ko hoku taʻu uofulu eni.* I am twenty years old. *ho* (your) becomes *hoku* (my), and *fiha* (how many) becomes *uofulu* (twenty).',
      ],
    },
  ],
}

/** The opening row in the hero: the lesson's first formula. */
export const OPENING = {
  row: [face('Mālō e', 'quiet'), face('lelei', 'quiet')],
  say: 'Mālō e lelei!',
  en: 'Hello.',
}

/** Recall cards, by key rule, in order: book sentences only. */
export const RECALL = [
  { to: 'Mālō e lelei!', en: 'Hello.' },
  { to: 'Fēfē hake?', en: 'How are you?' },
  { to: 'ʻAlu ā!', en: 'Goodbye. (Said to the person who is leaving.)' },
  { to: 'Ko hai ho hingoa?', en: 'What is your name?' },
]

export const FIGURES = [F14_1, F14_2, F14_3, F14_4, F14_5, F14_6]
