// Lesson 28's figures, as data. Every Tongan and English string is copied from
// book/Chapter-28.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. No figure pairs haʻu with mai, atu, hake or
// hifo (the book's Note), ange appears here only after action verbs and in the book's
// hanga table, and Exercise 4 item 4's printed answer stays out.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The set of three, from the book's table: whom the action moves toward. */
export const F28_1 = {
  id: '28.1',
  kind: 'path',
  types: ['path'],
  title: 'Who the action moves toward',
  after: { section: 'ange-toward-a-third-person', block: b => b.type === 'table' },
  marks: ['speaker', 'listener', 'third'],
  scenes: [
    {
      key: 'book',
      cases: [
        { particle: 'mai', dirText: 'toward me', from: 'listener', to: 'speaker', say: 'ʻOmi mai e tohí.', en: 'Bring me the book.' },
        { particle: 'atu', dirText: 'toward you', from: 'speaker', to: 'listener', say: 'Té u ʻoatu e tohí.', en: 'I will give you the book.' },
        { particle: 'ange', dirText: 'toward him/her/them', from: 'listener', to: 'third', say: 'Tuku ange e tohí.', en: 'Leave the book for him/her.' },
      ],
    },
    {
      key: 'go',
      cases: [
        { particle: 'mai', dirText: 'toward me', from: 'listener', to: 'speaker', say: 'Foki mai!', en: 'Come back! (toward me)' },
        { particle: 'atu', dirText: 'away from me', from: 'listener', to: 'away', say: 'ʻAlu atu!', en: 'Go away! (away from me)' },
        { particle: 'ange', dirText: 'toward him/her/them', from: 'listener', to: 'third', say: 'Tala ange ke haʻu!', en: 'Tell him/her to come!' },
      ],
    },
  ],
  alt: [
    '*mai*, toward me: *ʻOmi mai e tohí.* Bring me the book. *Foki mai!* Come back! (toward me)',
    '*atu*, away from the speaker, often toward the person being addressed: *Té u ʻoatu e tohí.* I will give you the book. *ʻAlu atu!* Go away! (away from me)',
    '*ange*, toward someone who is neither the speaker nor the listener: *Tuku ange e tohí.* Leave the book for him/her. *Tala ange ke haʻu!* Tell him/her to come!',
  ],
}

/** The three based on physical direction, from the book's summary table. */
export const F28_2 = {
  id: '28.2',
  kind: 'path',
  types: ['path'],
  layout: 'space',
  title: 'Up, down, around',
  after: { section: 'holo-around-about', block: b => b.type === 'table' },
  scenes: [
    {
      key: 'space',
      cases: [
        { particle: 'hake', dirText: 'up', dir: 'up', say: 'Sio hake ki hē!', en: 'Look up over there!' },
        { particle: 'hifo', dirText: 'down', dir: 'down', say: 'Tangutu hifo!', en: 'Sit down!' },
        { particle: 'holo', dirText: 'around', dir: 'around', say: 'Naʻa mau ō holo ʻo mamata.', en: 'We went around and looked.' },
      ],
    },
  ],
  alt: [
    '*hake*, up: *Sio hake ki hē!* Look up over there!',
    '*hifo*, down: *Tangutu hifo!* Sit down!',
    '*holo*, around, in various directions without a fixed destination: *Naʻa mau ō holo ʻo mamata.* We went around and looked.',
  ],
}

function placeScene(key, tense, pron, verb, part, place, say, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verb, 'verb')],
      part: [face(part, 'particle')],
      place: [face(place, 'place')],
    },
    before: null,
    after: { say, en },
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0], ['place', 0]],
      [['tense', 0], ['pron', 0], ['verb', 0], ['part', 0], ['place', 0]],
    ],
    beats: [
      { kind: 'add', tile: 'part', to: 1 },
      { kind: 'en' },
    ],
    alt: [
      `*${say}* ${en}`,
      `*${part}* comes immediately after the verb, before the prepositional phrase.`,
    ],
  }
}

/** The Pattern line: immediately after the verb, before any prepositional phrase. */
export const F28_3 = {
  id: '28.3',
  kind: 'row',
  types: ['add'],
  title: 'Where the particle sits',
  after: { section: 'combining-directional-particles-with-other-grammar', block: b => b.type === 'p' && b.text.startsWith('Pattern:') },
  scenes: [
    placeScene('hifo', 'Naʻa', 'mau', 'lele', 'hifo', 'ki tahí', 'Naʻa mau lele hifo ki tahí.', 'We ran down to the sea.'),
    placeScene('holo', 'ʻOkú', 'na', 'ʻalu', 'holo', 'ʻi he koló', 'ʻOkú na ʻalu holo ʻi he koló.', 'They (two) are going around in the village.'),
  ],
}

function hangaScene(key, first, second, lines) {
  const tiles = {
    hanga: [face('Hanga', 'verb')],
    ange: [face('ange', 'particle', 'deference')],
    mua: [face('muʻa', 'particle', 'please')],
    rest: [face('ʻo tāpuni ʻa e matapaá', 'quiet')],
  }
  const order = ['ange', 'mua'].filter(id => id === first || id === second)
  const step1 = [['hanga', 0], [first, 0], ['rest', 0]]
  const step2 = [['hanga', 0], [order[0], 0], [order[1], 0], ['rest', 0]]
  return {
    key,
    tiles,
    before: { say: 'Hanga ʻo tāpuni ʻa e matapaá.', en: 'Close the door.' },
    after: null,
    lines,
    states: [[['hanga', 0], ['rest', 0]], step1, step2],
    beats: [
      { kind: 'add', tile: first, to: 1 },
      { kind: 'add', tile: second, to: 2 },
    ],
    alt: [
      '*Hanga ʻo tāpuni ʻa e matapaá.* Polite. *Hanga ange ʻo tāpuni ʻa e matapaá.* More polite. *Hanga muʻa ʻo tāpuni ʻa e matapaá.* More polite. *Hanga ange muʻa ʻo tāpuni ʻa e matapaá.* Very polite.',
      'The more particles you stack, the more courteous the request.',
    ],
  }
}

/** The book's table, read as particles arriving after hanga. */
export const F28_4 = {
  id: '28.4',
  kind: 'row',
  types: ['add'],
  title: 'The more particles, the more courteous',
  after: { section: 'polite-commands-with-hanga', block: b => b.type === 'p' && b.text.startsWith('The more particles') },
  scenes: [
    hangaScene('ange-first', 'ange', 'mua', [
      { say: 'Hanga ʻo tāpuni ʻa e matapaá.', note: 'Polite' },
      { say: 'Hanga ange ʻo tāpuni ʻa e matapaá.', note: 'More polite' },
      { say: 'Hanga ange muʻa ʻo tāpuni ʻa e matapaá.', note: 'Very polite' },
    ]),
    hangaScene('mua-first', 'mua', 'ange', [
      { say: 'Hanga ʻo tāpuni ʻa e matapaá.', note: 'Polite' },
      { say: 'Hanga muʻa ʻo tāpuni ʻa e matapaá.', note: 'More polite' },
      { say: 'Hanga ange muʻa ʻo tāpuni ʻa e matapaá.', note: 'Very polite' },
    ]),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Foki', 'verb'), face('mai', 'particle')],
  say: 'Foki mai!',
  en: 'Come back! (toward me)',
}

/** Recall cards, by key rule: book sentences only (Direction.md part 5). */
export const RECALL = [
  { to: 'ʻOkú ne ʻomai ʻa e tohí.', en: 'He is bringing the book (to me/us).' },
  { to: 'ʻOkú ne ʻave ange ʻa e kató ki he faiakó.', en: 'She is taking the basket to the teacher.' },
  { to: 'Naʻá ku ʻomai ʻa e valá mei he falé.', en: 'I brought the clothes from the house.' },
]

export const FIGURES = [F28_1, F28_2, F28_3, F28_4]
