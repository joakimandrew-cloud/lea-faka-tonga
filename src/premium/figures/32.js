// Lesson 32's figures, as data. Every Tongan and English string is copied from
// book/Chapter-32.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The Fork in the reflexive section rings the base
// word, because the book says the sort is learned verb by verb and no neighbouring word
// predicts it. The tables, the Preview on fakapotopoto, the summary, Words to Learn and
// Exercises carry no figure.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The spelling rule: a proper place name takes the hyphen, a common noun is one word. */
export const F32_1 = {
  id: '32.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Hyphen or one word?',
  after: { section: 'manner-and-likeness', block: b => b.type === 'p' && b.text.startsWith('When') && b.text.includes('proper place name') },
  lanes: [
    { label: 'A proper place name', forms: ['faka-Tonga'] },
    { label: 'A common noun', forms: ['fakatangata'] },
  ],
  scenes: [
    {
      key: 'book',
      cases: [
        { lane: 0, en: 'Tongan, in the Tongan way', row: [{ ...face('Tonga', 'quiet'), ring: true }, { slot: true, form: face('faka-Tonga', 'particle') }] },
        { lane: 1, en: 'human, in a human manner', row: [{ ...face('tangata', 'quiet'), ring: true }, { slot: true, form: face('fakatangata', 'particle') }] },
      ],
    },
  ],
  alt: [
    'With a proper place name, *faka-* is written with a hyphen: *faka-Tonga*, *faka-Pālangi*.',
    'With common nouns, it is written as one word: *fakatangata*, *fakaako*.',
  ],
}

function causeScene(key, base, baseEn, form, formEn, tense, pron, rest, say, en) {
  return {
    key,
    tiles: {
      word: [base, face(form, 'verb')],
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      rest: [face(rest, 'quiet')],
    },
    before: null,
    after: null,
    lines: [
      { say: base.text, en: baseEn },
      { say: form, en: formEn },
      { say, en },
    ],
    states: [
      [['word', 0]],
      [['word', 1]],
      [['tense', 0], ['pron', 0], ['word', 1], ['rest', 0]],
    ],
    beats: [
      { kind: 'swap', tile: 'word', to: 1 },
      { kind: 'add', tile: ['tense', 'pron', 'rest'], to: 2 },
    ],
    alt: [
      `*${base.text}* (${baseEn}) becomes *${form}* (${formEn}).`,
      `*${say}* ${en}`,
    ],
  }
}

/** One word turns over into its causative, then goes to work in a sentence. */
export const F32_2 = {
  id: '32.2',
  kind: 'row',
  types: ['swap', 'add'],
  title: 'From doing it to making it happen',
  after: { section: 'causative-verbs', block: b => b.type === 'p' && b.text.startsWith('The pattern is consistent') },
  scenes: [
    causeScene('verb', face('mohe', 'verb'), 'to sleep', 'fakamohe', 'to put to sleep', 'Naʻá', 'ne', 'ʻene tamasiʻí', 'Naʻá ne fakamohe ʻene tamasiʻí.', 'She put her child to sleep.'),
    causeScene('adjective', face('lelei', 'quiet', 'adjective'), 'good', 'fakalelei', 'to mend, to make good', 'Kuó', 'ne', 'ʻa e vaká', 'Kuó ne fakalelei ʻa e vaká.', 'He has mended the boat.'),
  ],
}

/** The sort the book says is learned verb by verb, so the ring is on the word itself. */
export const F32_3 = {
  id: '32.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Who the action lands on, word by word',
  after: { section: 'reflexive-causatives', block: b => b.type === 'p' && b.text.startsWith('Whether a') },
  lanes: [
    { label: 'Someone or something else', forms: ['fakamohe'] },
    { label: 'Themselves', forms: ['fakataha'] },
  ],
  scenes: [
    {
      key: 'book',
      cases: [
        { lane: 0, en: 'to put to sleep', row: [{ ...face('mohe', 'quiet'), ring: true }, { slot: true, form: face('fakamohe', 'verb') }] },
        { lane: 1, en: 'to assemble, to gather together', row: [{ ...face('taha', 'quiet'), ring: true }, { slot: true, form: face('fakataha', 'verb') }] },
      ],
    },
  ],
  alt: [
    '*Fakamohe* and *fakalelei* are transitive: the subject causes the action on someone or something else.',
    '*Fakataha* and *fakamamaʻo* are reflexive: the subject causes the action on themselves, or a group does it collectively.',
    'Which one a word is, is best learned verb by verb.',
  ],
}

function timeScene(key, tiles, order, say, en, word) {
  return {
    key,
    tiles,
    before: null,
    after: { say, en },
    states: [
      order.map(id => [id, 0]),
      [...order, 'time'].map(id => [id, 0]),
    ],
    beats: [
      { kind: 'add', tile: 'time', to: 1 },
      { kind: 'en' },
    ],
    alt: [
      `*${say}* ${en}`,
      `*${word}* sits after the verb, in the same position as other adverbs.`,
    ],
  }
}

/** The position the tables do not show: the adverb arrives after the verb. */
export const F32_4 = {
  id: '32.4',
  kind: 'row',
  types: ['add'],
  title: 'Where the time word sits',
  after: { section: 'temporal-adverbs', block: b => b.type === 'p' && b.text.startsWith('These temporal adverbs') },
  scenes: [
    timeScene('daily', {
      tense: [face('ʻOku', 'tense')], pron: [face('ou', 'pronoun')], verb: [face('lotu', 'verb')], time: [face('fakaʻaho', 'particle', 'adverb')],
    }, ['tense', 'pron', 'verb'], 'ʻOku ou lotu fakaʻaho.', 'I pray daily.', 'fakaʻaho'),
    timeScene('weekly', {
      tense: [face('Naʻe', 'tense')], verb: [face('ʻalu', 'verb')], time: [face('fakauike', 'particle', 'adverb')],
    }, ['tense', 'verb'], 'Naʻe ʻalu fakauike.', 'He went weekly.', 'fakauike'),
  ],
}

/** One question, two forms in one sentence frame: villages in general, or one village. */
export const F32_5 = {
  id: '32.5',
  kind: 'fork',
  types: ['fork'],
  title: 'Villages in general, or one village?',
  after: { section: 'narrowing-the-sense', block: b => b.type === 'p' && b.text.includes('singles out') },
  lanes: [
    { label: 'Villages in general', forms: ['fakakolo'] },
    { label: 'One particular village', forms: ['fakaekolo'] },
  ],
  scenes: [
    {
      key: 'kolo',
      cases: [
        { lane: 0, say: 'ha meʻa fakakolo', en: 'a village matter (relating to villages in general)', row: [face('ha meʻa', 'quiet'), { slot: true, form: face('fakakolo', 'particle') }] },
        { lane: 1, say: 'ha meʻa fakaekolo', en: 'a matter pertaining to one particular village', row: [face('ha meʻa', 'quiet'), { slot: true, form: face('fakaekolo', 'particle') }] },
      ],
    },
  ],
  alt: [
    '*ha meʻa fakakolo*: a village matter (relating to villages in general).',
    '*ha meʻa fakaekolo*: a matter pertaining to one particular village.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOkú ne haka', 'quiet'), face('fakatangata', 'particle', 'manner')],
  say: 'ʻOkú ne haka fakatangata.',
  en: 'He dances in a human (not stylized) manner.',
}

/** Recall cards, by key rule, in order: book sentences only. */
export const RECALL = [
  { to: 'ʻOkú ne haka fakatangata.', en: 'He dances in a human (not stylized) manner.' },
  { to: 'Kuó ne fakalelei ʻa e vaká.', en: 'He has mended the boat.' },
  { to: 'ʻOku ou lotu fakaʻaho.', en: 'I pray daily.' },
]

export const FIGURES = [F32_1, F32_2, F32_3, F32_4, F32_5]
