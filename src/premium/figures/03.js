// Lesson 3's figures, as data. Every Tongan and English string is copied from
// book/Chapter-03.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Labels are the book's own words:
// adjective, modifier, intensifier, limiter, compound.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The book's comparison: same tense marker, same pronoun, same position. One slot turns over. */
export const F3_1 = {
  id: '3.1',
  kind: 'row',
  types: ['swap'],
  title: 'An adjective in the verb slot',
  after: { section: 'adjectives-in-the-verb-slot', block: b => b.type === 'p' && b.text.startsWith('Grammatically') },
  scenes: [
    {
      key: 'alu-masiva',
      tiles: {
        tense: [face('naʻá', 'tense')],
        pron: [face('ku', 'pronoun')],
        verb: [face('ʻalu', 'verb'), face('masiva', 'verb', 'adjective')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'naʻá ku ʻalu', en: 'I went' },
        { say: 'naʻá ku masiva', en: 'I was poor' },
      ],
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['verb', 1]],
      ],
      beats: [{ kind: 'swap', tile: 'verb', to: 1 }],
      alt: ['Compare *naʻá ku masiva* (I was poor) with *naʻá ku ʻalu* (I went): same tense marker, same pronoun, same position.'],
    },
  ],
}

/** Tongan places most modifiers after the word they modify, after an adjective in the verb slot too. */
export const F3_2 = {
  id: '3.2',
  kind: 'row',
  types: ['add'],
  title: 'Most modifiers go after the word they modify',
  after: { section: 'modifiers', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('ita lahi')) },
  scenes: [
    {
      key: 'hiva-lelei',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        pron: [face('ou', 'pronoun')],
        verb: [face('hiva', 'verb')],
        mod: [face('lelei', 'particle', 'modifier')],
      },
      before: null,
      after: { say: 'ʻOku ou hiva lelei.', en: 'I sing well.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['mod', 0]],
      ],
      beats: [{ kind: 'add', tile: 'mod', to: 1 }, { kind: 'en' }],
      alt: ['*ʻOku ou hiva lelei.* I sing well. *lelei* comes after the verb *hiva*.'],
    },
    {
      key: 'ita-lahi',
      tiles: {
        tense: [face('ʻOkú', 'tense')],
        pron: [face('ne', 'pronoun')],
        verb: [face('ʻita', 'verb', 'adjective')],
        mod: [face('lahi', 'particle', 'modifier')],
      },
      before: { say: 'ʻOkú ne ʻita.', en: 'He is angry.' },
      after: { say: 'ʻOkú ne ʻita lahi.', en: 'He is very angry.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['mod', 0]],
      ],
      beats: [{ kind: 'add', tile: 'mod', to: 1 }, { kind: 'en' }],
      alt: ['*ʻOkú ne ʻita.* He is angry. *ʻOkú ne ʻita lahi.* He is very angry. These modifiers work after adjectives in the verb slot too.'],
    },
  ],
}

/** ʻAupito always comes last, after any other modifier. Lahi arrives, then ʻaupito lands behind it. */
export const F3_3 = {
  id: '3.3',
  kind: 'row',
  types: ['add'],
  title: '*ʻAupito* comes last, after any other modifier',
  after: { section: 'modifiers', block: b => b.type === 'p' && b.text.startsWith('In the second sentence') },
  scenes: [
    {
      key: 'lahi-aupito',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        pron: [face('ou', 'pronoun')],
        verb: [face('fiefia', 'verb', 'adjective')],
        mod: [face('lahi', 'particle', 'modifier')],
        very: [face('ʻaupito', 'particle', 'intensifier')],
      },
      before: null,
      after: { say: 'ʻOku ou fiefia lahi ʻaupito.', en: 'I am extremely happy.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['mod', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['mod', 0], ['very', 0]],
      ],
      beats: [{ kind: 'add', tile: 'mod', to: 1 }, { kind: 'add', tile: 'very', to: 2 }, { kind: 'en' }],
      alt: ['*ʻOku ou fiefia lahi ʻaupito.* I am extremely happy. *ʻAupito* comes last, after any other modifier.'],
    },
  ],
}

function compoundScene(key, tense, pron, compound, word, label, say, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(compound, 'verb', 'compound')],
      mod: [face(word, 'particle', label)],
    },
    before: null,
    after: { say, en },
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0]],
      [['tense', 0], ['pron', 0], ['verb', 0], ['mod', 0]],
    ],
    beats: [{ kind: 'add', tile: 'mod', to: 1 }, { kind: 'en' }],
    alt: [`*${say}* ${en} *${word}* goes after the compound *${compound}*.`],
  }
}

/** Verb and object act as one unit: one tile. The modifier and pē go after the pair, never inside it. */
export const F3_4 = {
  id: '3.4',
  kind: 'row',
  types: ['add'],
  title: 'The modifier goes after the compound',
  after: { section: 'verb-object-compounds', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('kai ika pē')) },
  scenes: [
    compoundScene('kai-ika-lahi', 'Naʻa', 'nau', 'kai ika', 'lahi', 'modifier', 'Naʻa nau kai ika lahi.', 'They ate a lot of fish.'),
    compoundScene('kai-ika-pe', 'Naʻá', 'ku', 'kai ika', 'pē', 'limiter', 'Naʻá ku kai ika pē.', 'I just ate fish.'),
  ],
}

/** Faʻa sits between the pronoun and the verb, the reverse of the postposed modifiers. */
export const F3_5 = {
  id: '3.5',
  kind: 'row',
  types: ['add'],
  title: '*Faʻa* goes before the verb',
  after: { section: 'faa', block: b => b.type === 'p' && b.text.startsWith('The pattern: TM') },
  scenes: [
    {
      key: 'faa-hiva',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        pron: [face('ou', 'pronoun')],
        faa: [face('faʻa', 'particle', 'modifier')],
        verb: [face('hiva', 'verb')],
      },
      before: null,
      after: { say: 'ʻOku ou faʻa hiva.', en: 'I often sing.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['faa', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'faa', to: 1 }, { kind: 'en' }],
      alt: ['*ʻOku ou faʻa hiva.* I often sing. *Faʻa* sits before the verb, between the pronoun and the verb.'],
    },
    {
      key: 'faa-kai-lahi',
      tiles: {
        tense: [face('ʻOkú', 'tense')],
        pron: [face('ne', 'pronoun')],
        faa: [face('faʻa', 'particle', 'modifier')],
        verb: [face('kai', 'verb')],
        mod: [face('lahi', 'particle', 'modifier')],
      },
      before: null,
      after: { say: 'ʻOkú ne faʻa kai lahi.', en: 'He often eats a lot.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['faa', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['faa', 0], ['verb', 0], ['mod', 0]],
      ],
      beats: [{ kind: 'add', tile: 'faa', to: 1 }, { kind: 'add', tile: 'mod', to: 2 }, { kind: 'en' }],
      alt: ['*ʻOkú ne faʻa kai lahi.* He often eats a lot. *Faʻa* comes before the verb and *lahi* after it.'],
    },
  ],
}

/** The most complex sentence: the book's own list of what it combines, built around the compound. */
export const F3_6 = {
  id: '3.6',
  kind: 'row',
  types: ['add'],
  title: 'Every element from this lesson',
  after: { section: 'faa', block: b => b.type === 'p' && b.text.startsWith('This combines') },
  scenes: [
    {
      key: 'stack',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        pron: [face('ou', 'pronoun')],
        faa: [face('faʻa', 'particle', 'modifier')],
        verb: [face('kai mā', 'verb', 'compound')],
        mod: [face('lahi ʻaupito', 'particle', 'modifier, intensifier')],
      },
      before: null,
      after: { say: 'ʻOku ou faʻa kai mā lahi ʻaupito.', en: 'I often eat a great deal of bread.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['faa', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['faa', 0], ['verb', 0], ['mod', 0]],
      ],
      beats: [{ kind: 'add', tile: 'faa', to: 1 }, { kind: 'add', tile: 'mod', to: 2 }, { kind: 'en' }],
      alt: ['*ʻOku ou faʻa kai mā lahi ʻaupito.* I often eat a great deal of bread. This combines: present tense marker + first person pronoun + preposed modifier + verb + indefinite object + postposed modifier + intensifier.'],
    },
  ],
}

/** The opening row in the hero: an adjective in the verb slot with ʻaupito after it. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('ou', 'pronoun'), face('helaʻia', 'verb', 'adjective'), face('ʻaupito', 'particle', 'intensifier')],
  say: 'ʻOku ou helaʻia ʻaupito.',
  en: 'I am very tired.',
}

/** Recall cards, one per key rule, in order: book sentences only. */
export const RECALL = [
  { to: 'ʻOku ou fiekaia.', en: 'I am hungry.' },
  { to: 'ʻOku ou hiva lelei.', en: 'I sing well.' },
  { to: 'ʻOku ou fiefia lahi ʻaupito.', en: 'I am extremely happy.' },
  { to: 'Naʻá ke inu kava?', en: 'Did you drink kava?' },
]

export const FIGURES = [F3_1, F3_2, F3_3, F3_4, F3_5, F3_6]
