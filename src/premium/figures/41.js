// Lesson 41's figures, as data. Every Tongan and English string is copied from
// book/Chapter-41.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note ʻOkú ne but ʻOku lāʻā.
// No figure for verbs or nouns used as adjectives or adverbs, fai, ʻai, ngali, ngalingali,
// Words to Learn or Exercises: each is a definition with examples, or its table already
// shows the point. A ngali and ngalingali pair would differ in more than the word.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function weatherScene(key, word, gloss, tense, say, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      word: [face(word, 'noun', 'noun'), face(word, 'verb', 'verb')],
    },
    before: { say: word, en: gloss },
    after: { say, en },
    states: [
      [['word', 0]],
      [['tense', 0], ['word', 0]],
      [['tense', 0], ['word', 1]],
    ],
    beats: [
      { kind: 'add', tile: 'tense', to: 1 },
      { kind: 'swap', tile: 'word', to: 2 },
      { kind: 'en' },
    ],
    alt: [
      `*${word}*, ${gloss}. *${say}* ${en}`,
      'When a tense marker introduces them, they describe an event rather than a thing.',
    ],
  }
}

/** The book's table, read as a change: a tense marker arrives and the noun works as a verb. */
export const F41_1 = {
  id: '41.1',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'Weather words: after a tense marker, a verb',
  after: { section: 'nouns-used-as-verbs', block: b => b.type === 'p' && b.text.startsWith('Weather and nature') },
  scenes: [
    weatherScene('uha', 'ʻuha', 'rain', 'Naʻe', 'Naʻe ʻuha.', 'It rained.'),
    weatherScene('laa', 'lāʻā', 'sun', 'ʻOku', 'ʻOku lāʻā.', 'It is sunny.'),
    weatherScene('matangi', 'matangi', 'wind', 'ʻE', 'ʻE matangi.', 'It will be windy.'),
  ],
}

/** The ʻeiki pair: the same word, a verb or a noun by what it takes. */
export const F41_2 = {
  id: '41.2',
  kind: 'fork',
  types: ['fork'],
  title: '*ʻeiki*, verb or noun? Look at what it takes',
  after: { section: 'nouns-used-as-verbs', block: b => b.type === 'p' && b.text.startsWith('The difference between') },
  lanes: [
    { label: 'A tense marker and a pronoun: a verb', forms: ['ʻeiki'] },
    { label: 'An article: a noun', forms: ['ʻeiki'] },
  ],
  scenes: [
    {
      key: 'eiki',
      cases: [
        {
          lane: 0, say: 'ʻOkú ne ʻeiki.', en: 'He is a chief.',
          row: [{ ...face('ʻOkú', 'tense'), ring: true, label: 'tense' }, face('ne', 'pronoun'), { slot: true, form: face('ʻeiki', 'verb'), label: 'verb' }],
        },
        {
          lane: 1, say: 'ko ha ʻeiki ia', en: 'he is a chief',
          row: [face('ko', 'quiet'), { ...face('ha', 'quiet'), ring: true, label: 'article' }, { slot: true, form: face('ʻeiki', 'noun'), label: 'noun' }, face('ia', 'pronoun')],
        },
      ],
    },
  ],
  alt: [
    'In *ʻokú ne ʻeiki* (he is a chief, verb), *ʻeiki* functions as a verb: it takes a tense marker and a pronoun.',
    'In *ko ha ʻeiki ia* (he is a chief, noun), *ʻeiki* is a noun: it takes an article.',
    'Both translate the same way in English, but the Tongan structures are different.',
  ],
}

/** The opening row in the hero: a still. */
export const OPENING = {
  row: [face('Naʻe', 'tense'), face('ʻuha', 'verb'), face('ʻanepō', 'quiet')],
  say: 'Naʻe ʻuha ʻanepō.',
  en: 'It rained last night.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Naʻe ʻuha ʻanepō.', en: 'It rained last night.' },
  { to: 'ha loki mohe', en: 'a bedroom (a room for sleeping)' },
  { to: 'Naʻa mau fai lotu.', en: 'We prayed.' },
  { to: 'ʻOku ngalingali ʻe ʻuha he ʻahó ni.', en: 'It looks like it will rain today.' },
]

export const FIGURES = [F41_1, F41_2]
