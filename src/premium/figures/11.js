// Lesson 11's figures, as data. Every Tongan and English string is copied from
// book/Chapter-11.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Exercise answers stay out.
// No figure for When (Past) on its own: the book's only answer there changes the person as
// well (Naʻá ne to Naʻá ku), and 11.1 already shows the slot. None for At What Time, whose
// answer also drops words; none for How, whose two lines sit side by side; none for the tables.

const face = (text, role, label) => ({ text, role, ...(label === undefined ? {} : { label }) })

/** "The question sits where the answer goes": the book's question and answer, one slot apart. */
export const F11_1 = {
  id: '11.1',
  kind: 'row',
  types: ['swap'],
  title: 'The question sits where the answer goes',
  after: { section: 'location-questions-i-fe-ki-fe-mei-fe', block: b => b.type === 'table' },
  scenes: [
    {
      key: 'mei',
      tiles: {
        tense: [face('Naʻá', 'tense')],
        pron: [face('ke', 'pronoun'), face('ku', 'pronoun')],
        verb: [face('haʻu', 'verb')],
        where: [face('mei fē', 'question'), face('mei Fisi', 'place')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Naʻá ke haʻu mei fē?', en: 'Where did you come from?' },
        { say: 'Naʻá ku haʻu mei Fisi.', en: 'I came from Fiji.' },
      ],
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['where', 0]],
        [['tense', 0], ['pron', 1], ['verb', 0], ['where', 1]],
      ],
      beats: [{ kind: 'swap', tile: ['pron', 'where'], to: 1 }],
      alt: [
        '*Naʻá ke haʻu mei fē?* Where did you come from?',
        '*Naʻá ku haʻu mei Fisi.* I came from Fiji. The question sits where the answer goes: *mei fē* (where from) becomes *mei Fisi*.',
      ],
    },
  ],
}

function whenCase(lane, tense, pron, verb, when, say, en) {
  return {
    lane, say, en,
    row: [face(tense, 'tense'), face(pron, 'pronoun'), face(verb, 'verb'), { slot: true, form: face(when, 'question') }],
  }
}

/** ʻanefē and ʻafē side by side, once the reader has met both, and ahead of the Note on fakakū. */
export const F11_2 = {
  id: '11.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Has it happened yet?',
  after: { section: 'when-future-afe', block: b => b.type === 'examples' && JSON.stringify(b).includes('apongipongi') },
  lanes: [
    { label: 'Already happened', forms: ['ʻanefē'] },
    { label: 'Has not happened yet', forms: ['ʻafē'] },
  ],
  scenes: [
    {
      key: 'arrive-come',
      cases: [
        whenCase(0, 'Naʻá', 'ne', 'tau mai', 'ʻanefē', 'Naʻá ne tau mai ʻanefē?', 'When did he/she arrive?'),
        whenCase(1, 'Te', 'mau', 'haʻu', 'ʻafē', 'Te mau haʻu ʻafē?', 'When will we come?'),
      ],
    },
    {
      key: 'study-return',
      cases: [
        whenCase(0, 'Naʻa', 'nau', 'ako', 'ʻanefē', 'Naʻa nau ako ʻanefē?', 'When did they study?'),
        whenCase(1, 'Te', 'nau', 'foki mai', 'ʻafē', 'Te nau foki mai ʻafē?', 'When will they return?'),
      ],
    },
  ],
  alt: [
    '*ʻanefē* asks "when" about something that already happened. *Naʻá ne tau mai ʻanefē?* When did he/she arrive? *Naʻa nau ako ʻanefē?* When did they study?',
    '*ʻafē* asks "when" about something that has not happened yet. *Te mau haʻu ʻafē?* When will we come? *Te nau foki mai ʻafē?* When will they return?',
  ],
}

/** After a word, hā asks what or what kind and fē asks which one. Exercise 5 asks for this choice. */
export const F11_3 = {
  id: '11.3',
  kind: 'fork',
  types: ['fork'],
  title: '*hā* or *fē*?',
  after: { section: 'postposed-fe-which', block: b => b.type === 'p' && b.text.startsWith('The interrogative *fē*') },
  lanes: [
    { label: 'What, what kind', forms: ['hā'] },
    { label: 'Which one', forms: ['fē', 'feé'] },
  ],
  scenes: [
    {
      key: 'work-house',
      cases: [
        {
          lane: 0, say: 'ʻOkú ke ngāue hā?', en: 'What work do you do?',
          row: [face('ʻOkú', 'tense'), face('ke', 'pronoun'), face('ngāue', 'verb'), { slot: true, form: face('hā', 'question') }],
        },
        {
          lane: 1, say: 'Ko e fale fē naʻá ke nofo ai?', en: 'Which house did you live in?',
          row: [face('Ko e fale', 'quiet'), { slot: true, form: face('fē', 'question') }, face('naʻá ke nofo ai', 'quiet')],
        },
      ],
    },
    {
      key: 'teach-knife',
      cases: [
        {
          lane: 0, say: 'ʻOkú ke faiako hā?', en: 'What do you teach?',
          row: [face('ʻOkú', 'tense'), face('ke', 'pronoun'), face('faiako', 'verb'), { slot: true, form: face('hā', 'question') }],
        },
        {
          lane: 1, say: 'ʻA e hele feé?', en: 'Which knife?',
          row: [face('ʻA e hele', 'quiet'), { slot: true, form: face('feé', 'question') }],
        },
      ],
    },
  ],
  alt: [
    '*hā* (what, what kind). *ʻOkú ke ngāue hā?* What work do you do? *ʻOkú ke faiako hā?* What do you teach?',
    '*fē* (which): the noun + *fē* combination asks the listener to specify which one. *Ko e fale fē naʻá ke nofo ai?* Which house did you live in? *ʻA e hele feé?* Which knife?',
  ],
}

function howCase(lane, say, en, before, how, object) {
  return {
    lane, say, en,
    row: [
      ...before,
      { slot: true, form: face(how, 'question') },
      ...(object ? [{ ...face(object, 'quiet'), ring: true, label: 'object' }] : []),
    ],
  }
}

/** The book's contrast: fēfē for a state or condition, fēfeeʻi for doing something to an object. */
export const F11_4 = {
  id: '11.4',
  kind: 'fork',
  types: ['fork'],
  title: '*fēfē* or *fēfeeʻi*?',
  after: { section: 'fefeei-how-transitive', block: b => b.type === 'p' && b.text.startsWith('The transitive form') },
  lanes: [
    { label: 'A state or condition', forms: ['fēfē'] },
    { label: 'Doing something to an object', forms: ['fēfeeʻi'] },
  ],
  scenes: [
    {
      key: 'is-build',
      cases: [
        howCase(0, 'ʻOku fēfē?', 'How is it?', [face('ʻOku', 'tense')], 'fēfē'),
        howCase(1, 'Naʻá ke langa fēfeeʻi ʻa e falé?', 'How did you build the house?',
          [face('Naʻá', 'tense'), face('ke', 'pronoun'), face('langa', 'verb')], 'fēfeeʻi', 'ʻa e falé'),
      ],
    },
    {
      key: 'are-split',
      cases: [
        howCase(0, 'ʻOkú ke fēfē?', 'How are you?', [face('ʻOkú', 'tense'), face('ke', 'pronoun')], 'fēfē'),
        howCase(1, 'Naʻá ke fahi fēfeeʻi ʻa e laupapá?', 'How did you split the board?',
          [face('Naʻá', 'tense'), face('ke', 'pronoun'), face('fahi', 'verb')], 'fēfeeʻi', 'ʻa e laupapá'),
      ],
    },
  ],
  alt: [
    '*fēfē* asks about a state or condition. *ʻOku fēfē?* How is it? *ʻOkú ke fēfē?* How are you?',
    '*fēfeeʻi* asks about the manner of doing something to an object. *Naʻá ke langa fēfeeʻi ʻa e falé?* How did you build the house? *Naʻá ke fahi fēfeeʻi ʻa e laupapá?* How did you split the board?',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Naʻá', 'tense'), face('ke', 'pronoun'), face('haʻu', 'verb'), face('mei fē', 'question')],
  say: 'Naʻá ke haʻu mei fē?',
  en: 'Where did you come from?',
}

/** Recall cards, by key rule, in order: book sentences only. */
export const RECALL = [
  { to: 'Naʻá ne tau mai ʻanefē?', en: 'When did he/she arrive?' },
  { to: 'Te mau haʻu ʻafē?', en: 'When will we come?' },
  { to: 'ʻOkú ke fēfē?', en: 'How are you?' },
]

export const FIGURES = [F11_1, F11_2, F11_3, F11_4]
