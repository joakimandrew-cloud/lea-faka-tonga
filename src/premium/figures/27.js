// Lesson 27's figures, as data. Every Tongan and English string is copied from
// book/Chapter-27.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note ʻia before a name but ʻi he before a common noun.
// No figure for the modifiers, tatau, fai kehekehe, meimei, matuʻaki, huanoa, tautefito ki,
// Words to Learn or Exercises: their tables and example lists already show the point.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function angeScene(key, adj, first, second, say, en) {
  return {
    key,
    tiles: {
      oku: [face('ʻOku', 'tense')],
      adj: [face(adj, 'verb', 'adjective')],
      ange: [face('ange', 'particle', ' ')],
      first: [face(first, 'noun', 'first thing')],
      second: [face(second, 'quiet', 'second thing')],
    },
    before: null,
    after: { say, en },
    states: [
      [['oku', 0], ['adj', 0], ['first', 0]],
      [['oku', 0], ['adj', 0], ['ange', 0], ['first', 0]],
      [['oku', 0], ['adj', 0], ['ange', 0], ['first', 0], ['second', 0]],
    ],
    beats: [
      { kind: 'add', tile: 'ange', to: 1 },
      { kind: 'add', tile: 'second', to: 2 },
      { kind: 'en' },
    ],
    alt: [
      `*${say}* ${en}`,
      `The adjective *${adj}* does not change form. The word *ange* after it creates the comparison.`,
    ],
  }
}

/** The book's pattern, built up: the adjective holds still, ange and the second thing arrive. */
export const F27_1 = {
  id: '27.1',
  kind: 'row',
  types: ['add'],
  title: 'The adjective stays the same, and *ange* comes after it',
  after: { section: 'comparative-adjective-ange', block: b => b.type === 'p' && b.text.startsWith('The pattern') },
  scenes: [
    angeScene('malohi', 'mālohi', 'ʻa Tēvita', 'ʻia Sēmisi', 'ʻOku mālohi ange ʻa Tēvita ʻia Sēmisi.', 'Tēvita is stronger than Sēmisi.'),
    angeScene('vave', 'vave', 'ʻa e lolí', 'ʻi he pasikalá', 'ʻOku vave ange ʻa e lolí ʻi he pasikalá.', 'The truck is faster than the bicycle.'),
  ],
}

// The truck sentence, not the section's own kau tamaikí one: that one split ʻi he from its noun across a wrap at 390.
/** The book's rule for the form: what the comparison is against. */
export const F27_2 = {
  id: '27.2',
  kind: 'fork',
  types: ['fork'],
  title: '*ʻia* or *ʻi he*? Look at the next word',
  after: { section: 'the-than-phrase-with-i', block: b => b.type === 'p' && b.text.startsWith('The') },
  lanes: [
    { label: 'Before a proper noun', forms: ['ʻia'] },
    { label: 'Before a common noun with an article', forms: ['ʻi he', 'ʻi e'] },
  ],
  scenes: [
    {
      key: 'than',
      cases: [
        {
          lane: 0, say: 'ʻOku talavou ange ʻa Peni ʻia Tēvita.', en: 'Peni is better-looking than Tēvita.',
          row: [face('ʻOku talavou ange', 'quiet'), face('ʻa Peni', 'noun', 'first thing'), { slot: true, form: face('ʻia', 'quiet') }, { ...face('Tēvita', 'quiet', 'proper noun'), ring: true }],
        },
        {
          lane: 1, say: 'ʻOku vave ange ʻa e lolí ʻi he pasikalá.', en: 'The truck is faster than the bicycle.',
          row: [face('ʻOku vave ange', 'quiet'), face('ʻa e lolí', 'noun', 'first thing'), { slot: true, form: face('ʻi he', 'quiet') }, { ...face('pasikalá', 'quiet', 'common noun'), ring: true }],
        },
      ],
    },
  ],
  alt: [
    'Before a proper noun: *ʻia*. *ʻOku talavou ange ʻa Peni ʻia Tēvita.* Peni is better-looking than Tēvita.',
    'Before a common noun with an article: *ʻi he* (or *ʻi e*). *ʻOku vave ange ʻa e lolí ʻi he pasikalá.* The truck is faster than the bicycle.',
  ],
}

/** A question of meaning, so nothing is ringed: against a second thing, or the most within its group. */
export const F27_3 = {
  id: '27.3',
  kind: 'fork',
  types: ['fork'],
  title: '*ange* or *taha*?',
  after: { section: 'superlative-adjective-taha', block: b => b.type === 'p' && b.text.startsWith('The superlative') },
  lanes: [
    { label: 'Against a second thing', forms: ['ange'] },
    { label: 'The most within its group', forms: ['taha'] },
  ],
  scenes: [
    {
      key: 'malohi',
      cases: [
        {
          lane: 0, say: 'ʻOku mālohi ange ʻa Tēvita ʻia Sēmisi.', en: 'Tēvita is stronger than Sēmisi.',
          row: [face('ʻOku', 'tense'), face('mālohi', 'verb', 'adjective'), { slot: true, form: face('ange', 'particle', ' ') }, face('ʻa Tēvita', 'noun', 'first thing'), face('ʻia Sēmisi', 'quiet', 'second thing')],
        },
        {
          lane: 1, say: 'ʻOku mālohi taha ʻa Siaosi.', en: 'Siaosi is the strongest.',
          row: [face('ʻOku', 'tense'), face('mālohi', 'verb', 'adjective'), { slot: true, form: face('taha', 'particle', ' ') }, face('ʻa Siaosi', 'noun', ' ')],
        },
      ],
    },
  ],
  alt: [
    '*ange*, with a second thing: *ʻOku mālohi ange ʻa Tēvita ʻia Sēmisi.* Tēvita is stronger than Sēmisi.',
    '*taha* does not use an *ʻi* phrase. It stands alone: *ʻOku mālohi taha ʻa Siaosi.* Siaosi is the strongest.',
  ],
}

/** The book's table of three patterns, each in one of its own whole sentences. */
export const F27_4 = {
  id: '27.4',
  kind: 'fork',
  types: ['fork'],
  title: 'What comes after *ʻo hangē*?',
  after: { section: 'hange-to-be-like-seem-like', block: b => b.type === 'table' },
  lanes: [
    { label: 'Like + noun', forms: ['ko'] },
    { label: 'Like + noun (indefinite)', forms: ['ha'] },
    { label: 'As though + clause', forms: ['kuo ʻita'] },
  ],
  scenes: [
    {
      key: 'noun',
      cases: [
        {
          lane: 0, say: 'Naʻe hiva ʻa Neomai ʻo hangē ko e taʻahine.', en: 'Neomai sang like a young woman.',
          row: [face('Naʻe hiva ʻa Neomai', 'quiet'), face('ʻo hangē', 'quiet'), { slot: true, form: face('ko', 'quiet') }, { ...face('e taʻahine', 'quiet', 'noun'), ring: true }],
        },
        {
          lane: 1, say: 'Naʻe ngāue ʻa Sēmisi ʻo hangē ha fuʻu hōsí.', en: 'Sēmisi worked like a big horse.',
          row: [face('Naʻe ngāue ʻa Sēmisi', 'quiet'), face('ʻo hangē', 'quiet'), { slot: true, form: face('ha', 'quiet') }, { ...face('fuʻu hōsí', 'quiet', 'noun'), ring: true }],
        },
      ],
    },
    {
      key: 'clause',
      cases: [
        {
          lane: 2, say: 'ʻOku lea ʻa e tamasiʻí ʻo hangē kuo ʻita.', en: 'The boy talks as though he is angry.',
          row: [face('ʻOku lea ʻa e tamasiʻí', 'quiet'), face('ʻo hangē', 'quiet'), { slot: true, form: face('kuo ʻita', 'quiet') }],
        },
      ],
    },
  ],
  alt: [
    'Like + noun: *ʻo hangē* + *ko* + noun. *Naʻe hiva ʻa Neomai ʻo hangē ko e taʻahine.* Neomai sang like a young woman.',
    'Like + noun (indefinite): *ʻo hangē* + *ha* + noun. *Naʻe ngāue ʻa Sēmisi ʻo hangē ha fuʻu hōsí.* Sēmisi worked like a big horse.',
    'As though + clause: *ʻo hangē* + clause. *ʻOku lea ʻa e tamasiʻí ʻo hangē kuo ʻita.* The boy talks as though he is angry.',
  ],
}

function surpassScene(key, first, second, say, en) {
  return {
    key,
    tiles: {
      oku: [face('ʻOku', 'tense')],
      verb: [face('ʻangeʻange', 'verb')],
      first: [face(first, 'quiet', 'being surpassed')],
      second: [face(second, 'quiet', 'doing the surpassing')],
    },
    before: null,
    after: { say, en },
    states: [
      [['oku', 0], ['verb', 0]],
      [['oku', 0], ['verb', 0], ['first', 0]],
      [['oku', 0], ['verb', 0], ['first', 0], ['second', 0]],
    ],
    beats: [
      { kind: 'add', tile: 'first', to: 1 },
      { kind: 'add', tile: 'second', to: 2 },
      { kind: 'en' },
    ],
    alt: [
      `*${say}* ${en}`,
      'The thing named first is the one being surpassed, not the one doing the surpassing.',
    ],
  }
}

/** The word order the book warns about, labelled in the book's words. */
export const F27_5 = {
  id: '27.5',
  kind: 'row',
  types: ['add'],
  title: 'The thing named first is the one being surpassed',
  after: { section: 'angeange-to-be-surpassed-by', block: b => b.type === 'p' && b.text.startsWith('The word order') },
  scenes: [
    surpassScene('momoko', 'ʻa e momoko ʻi heni', 'he momoko ʻi Haʻamoá', 'ʻOku ʻangeʻange ʻa e momoko ʻi heni he momoko ʻi Haʻamoá.', 'The cold here is surpassed by the cold in Samoa. (Samoa is colder.)'),
    surpassScene('poto', 'hoʻo potó', 'heʻeku potó', 'ʻOku ʻangeʻange hoʻo potó heʻeku potó.', 'My skill surpasses yours. (Lit. Your skill is surpassed by my skill.)'),
    surpassScene('vela', 'ʻa e vela ʻi heni', 'he vela ʻi ʻAmeliká', 'ʻOku ʻangeʻange ʻa e vela ʻi heni he vela ʻi ʻAmeliká.', 'The heat here is surpassed by the heat in America. (America is hotter.)'),
  ],
}

/** The Note's pair: lahi after the verb, or lahi before it with pē after. */
export const F27_6 = {
  id: '27.6',
  kind: 'row',
  types: ['move', 'add'],
  title: 'Very sick, or sick most of the time',
  after: { section: 'lahi-pe-mostly', block: b => b.text && b.text.includes('postposed intensifier') },
  scenes: [
    {
      key: 'puke',
      tiles: {
        naa: [face('Naʻá', 'tense')],
        ku: [face('ku', 'pronoun')],
        puke: [face('puke', 'verb')],
        lahi: [face('lahi', 'particle', ' ')],
        pe: [face('pē', 'particle', ' ')],
      },
      before: { say: 'Naʻá ku puke lahi', en: 'I was very sick' },
      after: { say: 'Naʻá ku lahi puke pē', en: 'I was sick most of the time' },
      states: [
        [['naa', 0], ['ku', 0], ['puke', 0], ['lahi', 0]],
        [['naa', 0], ['ku', 0], ['lahi', 0], ['puke', 0]],
        [['naa', 0], ['ku', 0], ['lahi', 0], ['puke', 0], ['pe', 0]],
      ],
      beats: [
        { kind: 'move', tile: 'lahi', to: 1 },
        { kind: 'add', tile: 'pe', to: 2 },
        { kind: 'en' },
      ],
      alt: [
        '*Naʻá ku puke lahi* means I was very sick.',
        '*Naʻá ku lahi puke pē* means I was sick most of the time.',
      ],
    },
  ],
}

/** The opening row in the hero: a still. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('mālohi', 'verb', 'adjective'), face('ange', 'particle', ' '), face('ʻa Tēvita', 'noun', 'first thing'), face('ʻia Sēmisi', 'quiet', 'second thing')],
  say: 'ʻOku mālohi ange ʻa Tēvita ʻia Sēmisi.',
  en: 'Tēvita is stronger than Sēmisi.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku mālohi ange ʻa Tēvita ʻia Sēmisi.', en: 'Tēvita is stronger than Sēmisi.' },
  { to: 'ʻOku mālohi taha ʻa Siaosi.', en: 'Siaosi is the strongest.' },
  { to: 'ʻOku tatau ʻa e tohi ko eni mo e tohi ko ē.', en: 'This book is the same as that book.' },
]

export const FIGURES = [F27_1, F27_2, F27_3, F27_4, F27_5, F27_6]
