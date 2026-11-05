// Lesson 6's figures, as data. Every Tongan and English string is copied from
// book/Chapter-06.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The labels stative and location are the
// book's own, from the table under Being Somewhere.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function placeScene(key, tense, pron, verb, place, say, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verb, 'verb')],
      place: [face(place, 'place')],
    },
    before: null,
    after: { say, en },
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0]],
      [['tense', 0], ['pron', 0], ['verb', 0], ['place', 0]],
    ],
    beats: [
      { kind: 'add', tile: 'place', to: 1 },
      { kind: 'en' },
    ],
    alt: [`*${say}* ${en}`, 'The location phrase attaches to the end of the sentence patterns you already know.'],
  }
}

/** The pattern line: the sentence stands as you know it, and the place phrase lands on the end. */
export const F6_1 = {
  id: '6.1',
  kind: 'row',
  types: ['add'],
  title: 'The location phrase attaches to the end',
  after: { section: 'the-preposition-i', block: b => b.type === 'p' && b.text.startsWith('TM + pronoun + verb') },
  scenes: [
    placeScene('tonga', 'Té', 'u', 'nofo', 'ʻi Tonga', 'Té u nofo ʻi Tonga.', 'I will stay in Tonga.'),
    placeScene('kolo', 'Naʻa', 'mau', 'ngāue', 'ʻi kolo', 'Naʻa mau ngāue ʻi kolo.', 'We worked in town.'),
  ],
}

function answerScene(key, tense, ask, answer, verb, where, place, askLine, answerLine) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(ask, 'pronoun'), face(answer, 'pronoun')],
      verb: [face(verb, 'verb')],
      place: [face(where, 'question'), face(place, 'place')],
    },
    before: null,
    after: null,
    lines: [askLine, answerLine],
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0], ['place', 0]],
      [['tense', 0], ['pron', 1], ['verb', 0], ['place', 1]],
    ],
    beats: [{ kind: 'swap', tile: ['pron', 'place'], to: 1 }],
    alt: [`*${askLine.say}* ${askLine.en}`, `*${answerLine.say}* ${answerLine.en}`],
  }
}

/** The book's two question and answer pairs: the place phrase turns over where it stands. */
export const F6_2 = {
  id: '6.2',
  kind: 'row',
  types: ['swap'],
  title: '*ʻI fē* goes in the same position as the answer',
  after: { section: 'asking-where-i-fe', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('fale mohe')) },
  scenes: [
    answerScene('mohe', 'Naʻá', 'ke', 'ku', 'mohe', 'ʻi fē', 'ʻi fale mohe',
      { say: 'Naʻá ke mohe ʻi fē?', en: 'Where did you sleep?' },
      { say: 'Naʻá ku mohe ʻi fale mohe.', en: 'I slept in the dormitory.' }),
    answerScene('ngaue', 'ʻOku', 'mou', 'mau', 'ngāue', 'ʻi fē', 'ʻi kolo',
      { say: 'ʻOku mou ngāue ʻi fē?', en: 'Where do you work?' },
      { say: 'ʻOku mau ngāue ʻi kolo.', en: 'We work in town.' }),
  ],
}

/** The book's pair: ʻi leaves, the English holds, since the two sentences mean the same. */
export const F6_3 = {
  id: '6.3',
  kind: 'row',
  types: ['drop'],
  title: 'Sometimes *ʻi* is omitted',
  after: { section: 'here-there-over-there', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('Tau nofo heni')) },
  scenes: [
    {
      key: 'heni',
      tiles: {
        pron: [face('Tau', 'pronoun')],
        verb: [face('nofo', 'verb')],
        i: [face('ʻi', 'quiet', 'preposition')],
        place: [face('heni', 'place')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Tau nofo ʻi heni.', en: "Let's stay here." },
        { say: 'Tau nofo heni.', en: "Let's stay here." },
      ],
      states: [
        [['pron', 0], ['verb', 0], ['i', 0], ['place', 0]],
        [['pron', 0], ['verb', 0], ['GHOST'], ['place', 0]],
      ],
      beats: [{ kind: 'drop', tile: 'i', to: 1 }],
      alt: [
        "*Tau nofo ʻi heni.* Let's stay here.",
        "*Tau nofo heni.* Let's stay here. Sometimes *ʻi* is omitted, and the word works on its own as a single location word.",
      ],
    },
  ],
}

/** The book's comparison: tense marker and pronoun hold still, and the one slot turns over. */
export const F6_4 = {
  id: '6.4',
  kind: 'row',
  types: ['swap'],
  title: 'What fills the verb slot',
  after: { section: 'being-somewhere', block: b => b.type === 'p' && b.text.startsWith('Both follow the same structure') },
  scenes: [
    {
      key: 'fiefia-kolo',
      tiles: {
        tense: [face('Naʻá', 'tense')],
        pron: [face('ku', 'pronoun')],
        fill: [face('fiefia', 'verb', 'stative'), face('ʻi kolo', 'place', 'location')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Naʻá ku fiefia.', en: 'I was happy.' },
        { say: 'Naʻá ku ʻi kolo.', en: 'I was in town.' },
      ],
      states: [
        [['tense', 0], ['pron', 0], ['fill', 0]],
        [['tense', 0], ['pron', 0], ['fill', 1]],
      ],
      beats: [{ kind: 'swap', tile: 'fill', to: 1 }],
      alt: [
        'Stative: *Naʻá ku fiefia.* I was happy.',
        'Location: *Naʻá ku ʻi kolo.* I was in town.',
        'Both follow the same structure: tense marker + pronoun + what fills the verb slot.',
      ],
    },
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('ou', 'pronoun'), face('nofo', 'verb'), face('ʻi ʻapi', 'place')],
  say: 'ʻOku ou nofo ʻi ʻapi.',
  en: 'I live at home.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku ou ʻi ʻapi.', en: 'I am at home.' },
  { to: 'Naʻá ke mohe ʻi fē?', en: 'Where did you sleep?' },
  { to: 'Tau nofo heni.', en: "Let's stay here." },
]

export const FIGURES = [F6_1, F6_2, F6_3, F6_4]
