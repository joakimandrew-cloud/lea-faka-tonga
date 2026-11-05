// Lesson 7's figures, as data. Every Tongan and English string is copied from
// book/Chapter-07.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The labels are the book's own: "from", "to",
// "person", "place", the heads of its Before a place / person / pronoun table.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** "With mei and ki together, you can describe a complete journey": the two phrases arrive in turn. */
export const F7_1 = {
  id: '7.1',
  kind: 'row',
  types: ['add'],
  title: 'A complete journey: *mei* and *ki*',
  after: { section: 'three-prepositions-with-places', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('mei Fisi ki Tonga')) },
  scenes: [
    {
      key: 'fisi-tonga',
      tiles: {
        tense: [face('Naʻá', 'tense')],
        pron: [face('ku', 'pronoun')],
        verb: [face('haʻu', 'verb')],
        from: [face('mei Fisi', 'place', 'from')],
        to: [face('ki Tonga', 'place', 'to')],
      },
      before: null,
      after: { say: 'Naʻá ku haʻu mei Fisi ki Tonga.', en: 'I came from Fiji to Tonga.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['from', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['from', 0], ['to', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'from', to: 1 },
        { kind: 'add', tile: 'to', to: 2 },
        { kind: 'en' },
      ],
      alt: [
        'With *mei* and *ki* together, you can describe a complete journey.',
        '*Naʻá ku haʻu mei Fisi ki Tonga.* I came from Fiji to Tonga.',
      ],
    },
  ],
}

function formCase(lane, tense, pron, verb, form, target, say, en) {
  return {
    lane, say, en,
    row: [
      face(tense, 'tense'),
      face(pron, 'pronoun'),
      face(verb, 'verb'),
      { slot: true, form: face(form, 'quiet') },
      { ...target, ring: true },
    ],
  }
}

/** The full pattern across all three form types: what follows picks the form. */
export const F7_2 = {
  id: '7.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Which form? Look at what follows',
  after: { section: 'before-a-pronoun-the-ate-forms', block: b => b.type === 'p' && b.text.startsWith('When the target') },
  lanes: [
    { label: 'Before a place', forms: ['ʻi', 'ki', 'mei'] },
    { label: 'Before a person', forms: ['ʻia', 'kia', 'meia'] },
    { label: 'Before a pronoun', forms: ['ʻiate', 'kiate', 'meiate'] },
  ],
  scenes: [
    {
      key: 'ki-kia',
      cases: [
        formCase(0, 'Té', 'u', 'ʻalu', 'ki', face('Tonga', 'place'), 'Té u ʻalu ki Tonga.', 'I will go to Tonga.'),
        formCase(1, 'Naʻá', 'ku', 'lea', 'kia', face('Tēvita', 'quiet', 'person'), 'Naʻá ku lea kia Tēvita.', 'I spoke to Tēvita.'),
      ],
    },
    {
      key: 'kiate-iate',
      cases: [
        formCase(2, 'Naʻá', 'ku', 'tokoni', 'kiate', face('ia', 'pronoun'), 'Naʻá ku tokoni kiate ia.', 'I helped him.'),
        formCase(2, 'ʻOkú', 'ne', 'nofo', 'ʻiate', face('au', 'pronoun'), 'ʻOkú ne nofo ʻiate au.', 'He stays with me.'),
      ],
    },
    {
      key: 'mei-meiate',
      cases: [
        formCase(0, 'Naʻá', 'ku', 'haʻu', 'mei', face('Tonga', 'place'), 'Naʻá ku haʻu mei Tonga.', 'I came from Tonga.'),
        formCase(2, 'Naʻá', 'ne', 'haʻu', 'meiate', face('kimautolu', 'pronoun'), 'Naʻá ne haʻu meiate kimautolu.', 'He came from us.'),
      ],
    },
  ],
  alt: [
    'Before a place: *ʻi*, *ki*, *mei*. *Té u ʻalu ki Tonga.* I will go to Tonga. *Naʻá ku haʻu mei Tonga.* I came from Tonga.',
    'Before a person: *ʻia*, *kia*, *meia*. *Naʻá ku lea kia Tēvita.* I spoke to Tēvita.',
    'Before a pronoun: *ʻiate*, *kiate*, *meiate*. *Naʻá ku tokoni kiate ia.* I helped him. *ʻOkú ne nofo ʻiate au.* He stays with me. *Naʻá ne haʻu meiate kimautolu.* He came from us.',
  ],
}

/** Mahino: the person who understands appears after kiate, or kia before a name. */
export const F7_3 = {
  id: '7.3',
  kind: 'row',
  types: ['swap'],
  title: 'The one who understands comes after *kiate* or *kia*',
  after: { section: 'before-a-pronoun-the-ate-forms', block: b => b.type === 'p' && b.text.startsWith('With a person') },
  chips: [
    { state: 0, to: 'kiate au', en: 'to me' },
    { state: 1, to: 'kia Siale', en: 'to Siale' },
  ],
  scenes: [
    {
      key: 'mahino',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        verb: [face('mahino', 'verb')],
        prep: [face('kiate', 'quiet'), face('kia', 'quiet')],
        who: [face('au', 'pronoun'), face('Siale', 'quiet', 'person')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ʻOku mahino kiate au.', en: 'I understand. (Lit. "Is understandable to me.")' },
        { say: 'ʻOku mahino kia Siale.', en: 'Siale understands. (Lit. "Is understandable to Siale.")' },
      ],
      states: [
        [['tense', 0], ['verb', 0], ['prep', 0], ['who', 0]],
        [['tense', 0], ['verb', 0], ['prep', 1], ['who', 1]],
      ],
      beats: [
        { kind: 'swap', tile: ['prep', 'who'], to: 1 },
      ],
      alt: [
        'The person who understands appears after *kiate*, or *kia* before a name.',
        '*ʻOku mahino kiate au.* I understand. (Lit. "Is understandable to me.")',
        '*ʻOku mahino kia Siale.* Siale understands. (Lit. "Is understandable to Siale.")',
      ],
    },
  ],
}

/** The answer opens on ʻIo, so the grouped tile is not only a tense marker: it is drawn quiet, as in 21.js. */
const answer = text => face(text, 'quiet')

function aiScene(key, tiles, states, turning, lines, alt) {
  return {
    key,
    tiles,
    before: null,
    after: null,
    lines,
    states,
    beats: [{ kind: 'swap', tile: turning, to: 1 }],
    alt,
  }
}

/** The book's question and answer pairs: the noun phrase turns over to the ai phrase. */
export const F7_4 = {
  id: '7.4',
  kind: 'row',
  types: ['swap'],
  title: '*Ai* takes the place of a noun after a preposition',
  after: { section: 'the-noun-particle-ai', block: b => b.type === 'p' && b.text.startsWith('The particle') },
  scenes: [
    aiScene(
      'ki-vavau',
      {
        tense: [face('Té', 'tense'), answer('ʻIo, té')],
        pron: [face('ke', 'pronoun'), face('u', 'pronoun')],
        verb: [face('ʻalu', 'verb')],
        phrase: [face('ki Vavaʻu', 'place'), face('ki ai', 'place')],
      },
      [
        [['tense', 0], ['pron', 0], ['verb', 0], ['phrase', 0]],
        [['tense', 1], ['pron', 1], ['verb', 0], ['phrase', 1]],
      ],
      ['tense', 'pron', 'phrase'],
      [
        { say: 'Té ke ʻalu ki Vavaʻu?', en: 'Will you go to Vavaʻu?' },
        { say: 'ʻIo, té u ʻalu ki ai.', en: 'Yes, I will go there.' },
      ],
      ['*Té ke ʻalu ki Vavaʻu?* Will you go to Vavaʻu? *ʻIo, té u ʻalu ki ai.* Yes, I will go there.'],
    ),
    aiScene(
      'kia-sione',
      {
        tense: [face('Té', 'tense'), answer('ʻIo, té')],
        pron: [face('ke', 'pronoun'), face('u', 'pronoun')],
        verb: [face('lea', 'verb')],
        phrase: [face('kia Sione', 'quiet', 'person'), face('ki ai', 'quiet')],
      },
      [
        [['tense', 0], ['pron', 0], ['verb', 0], ['phrase', 0]],
        [['tense', 1], ['pron', 1], ['verb', 0], ['phrase', 1]],
      ],
      ['tense', 'pron', 'phrase'],
      [
        { say: 'Té ke lea kia Sione?', en: 'Will you speak to Sione?' },
        { say: 'ʻIo, té u lea ki ai.', en: 'Yes, I will speak to him.' },
      ],
      ['*Té ke lea kia Sione?* Will you speak to Sione? *ʻIo, té u lea ki ai.* Yes, I will speak to him.'],
    ),
    aiScene(
      'i-tonga',
      {
        tense: [face('ʻOkú', 'tense'), answer('ʻIo, ʻokú')],
        pron: [face('ne', 'pronoun')],
        phrase: [face('ʻi Tonga', 'place'), face('ʻi ai', 'place')],
      },
      [
        [['tense', 0], ['pron', 0], ['phrase', 0]],
        [['tense', 1], ['pron', 0], ['phrase', 1]],
      ],
      ['tense', 'phrase'],
      [
        { say: 'ʻOkú ne ʻi Tonga?', en: 'Is he in Tonga?' },
        { say: 'ʻIo, ʻokú ne ʻi ai.', en: 'Yes, he is there.' },
      ],
      ['*ʻOkú ne ʻi Tonga?* Is he in Tonga? *ʻIo, ʻokú ne ʻi ai.* Yes, he is there.'],
    ),
    aiScene(
      'mei-fisi',
      {
        tense: [face('Naʻá', 'tense'), answer('ʻIo, naʻá')],
        pron: [face('ke', 'pronoun'), face('ku', 'pronoun')],
        verb: [face('haʻu', 'verb')],
        phrase: [face('mei Fisi', 'place'), face('mei ai', 'place')],
      },
      [
        [['tense', 0], ['pron', 0], ['verb', 0], ['phrase', 0]],
        [['tense', 1], ['pron', 1], ['verb', 0], ['phrase', 1]],
      ],
      ['tense', 'pron', 'phrase'],
      [
        { say: 'Naʻá ke haʻu mei Fisi?', en: 'Did you come from Fiji?' },
        { say: 'ʻIo, naʻá ku haʻu mei ai.', en: 'Yes, I came from there.' },
      ],
      ['*Naʻá ke haʻu mei Fisi?* Did you come from Fiji? *ʻIo, naʻá ku haʻu mei ai.* Yes, I came from there.'],
    ),
  ],
}

function travelScene(key, tense, pron, verb, noun, phrase, say, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verb, 'verb')],
      noun: [face(noun, 'quiet', 'transport noun')],
      phrase: [face(phrase, 'place')],
    },
    before: null,
    after: { say, en },
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0], ['phrase', 0]],
      [['tense', 0], ['pron', 0], ['verb', 0], ['noun', 0], ['phrase', 0]],
    ],
    beats: [
      { kind: 'add', tile: 'noun', to: 1 },
      { kind: 'en' },
    ],
    alt: [
      `*${say}* ${en}`,
      `The noun *${noun}* sits right after *${verb}*, with no preposition, and the prepositional phrase follows.`,
    ],
  }
}

/** Travel compounds in longer sentences: the transport noun, then the prepositional phrase. */
export const F7_5 = {
  id: '7.5',
  kind: 'row',
  types: ['add'],
  title: 'Where the transport noun sits',
  after: { section: 'travel-compounds', block: b => b.type === 'p' && b.text.startsWith('Travel compounds fit') },
  scenes: [
    travelScene('loli', 'Naʻá', 'ne', 'ʻalu', 'loli', 'ki kolo', 'Naʻá ne ʻalu loli ki kolo.', 'He went by truck to town.'),
    travelScene('pasi', 'Naʻa', 'mau', 'haʻu', 'pasī', 'mei Nukuʻalofa', 'Naʻa mau haʻu pasī mei Nukuʻalofa.', 'We came by bus from Nukuʻalofa.'),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Naʻá', 'tense'), face('ku', 'pronoun'), face('haʻu', 'verb'), face('mei Fisi', 'place', 'from'), face('ki Tonga', 'place', 'to')],
  say: 'Naʻá ku haʻu mei Fisi ki Tonga.',
  en: 'I came from Fiji to Tonga.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Naʻa mau ʻalu mei ʻapi ki kolo ʻaneafi.', en: 'We went from home to town yesterday.' },
  { to: 'Naʻá ku lea kia Tēvita.', en: 'I spoke to Tēvita.' },
  { to: 'ʻOku mahino kiate au.', en: 'I understand.' },
]

export const FIGURES = [F7_1, F7_2, F7_3, F7_4, F7_5]
