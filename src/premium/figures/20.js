// Lesson 20's figures, as data. Every Tongan and English string is copied from
// book/Chapter-20.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its macrons and stress accents kept. The labels are the book's own words: number,
// connector ("the connector mā"), particle, people counter, remaining, finished, possessive.
// No figure for the numeral and tens tables (they show the point), the note on hiva,
// the price sentences (they differ beyond one word), the digit shortcut and times of
// day (their tables show the point), meʻa e fiha, Words to Learn or Exercises.
// The accent on 'a e kato 'e onó stays out: the book's sentence says the noun's last
// vowel and its example marks the number's, and a figure would have to pick one.
// 'e and toko are not drawn as either-or: the book prints Ko e tamaiki 'e toko tolu,
// so the Fork asks only what sits right before the number.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const num = text => face(text, 'quiet', 'number')

function connectorScene(key, parts, say, en, alt) {
  const tiles = { ma: [face('mā', 'quiet', 'connector')] }
  parts.forEach((part, i) => { tiles[`p${i}`] = [num(part)] })
  const lead = parts.slice(0, -1).map((_, i) => [`p${i}`, 0])
  const last = [`p${parts.length - 1}`, 0]
  return {
    key,
    tiles,
    before: null,
    after: { say, en },
    states: [
      [...lead, last],
      [...lead, ['ma', 0], last],
    ],
    beats: [{ kind: 'add', tile: 'ma', to: 1 }, { kind: 'en' }],
    alt,
  }
}

/** "mā appears before the last part only": with three parts, it still lands once. */
export const F20_1 = {
  id: '20.1',
  kind: 'row',
  types: ['add'],
  title: '*mā* goes before the last part',
  after: { section: 'compound-numerals-the-connector-ma', block: b => b.type === 'examples' && b.pairs.some(p => p.line?.includes('nimangofulu')) },
  scenes: [
    connectorScene('thirty-eight', ['tolungofulu', 'valu'], 'tolungofulu mā valu', 'thirty-eight', [
      '*tolungofulu mā valu*. thirty-eight',
      '*mā* appears before the last part only.',
    ]),
    // Three parts, each its own tile, with mā landing once, before the last.
    connectorScene('one-fifty-six', ['teau', 'nimangofulu', 'ono'], 'teau nimangofulu mā ono', 'one hundred and fifty-six', [
      '*teau nimangofulu mā ono*. one hundred and fifty-six',
      '*mā* appears before the last part only.',
    ]),
  ],
}

function particleScene(key, lead, noun, number, say, en) {
  const tiles = {
    noun: [face(noun, 'quiet', 'noun')],
    e: [face('ʻe', 'quiet', 'particle')],
    num: [num(number)],
  }
  if (lead) tiles.lead = [face(lead, 'quiet')]
  const head = lead ? [['lead', 0], ['noun', 0]] : [['noun', 0]]
  return {
    key,
    tiles,
    before: null,
    after: { say, en },
    states: [
      [...head, ['num', 0]],
      [...head, ['e', 0], ['num', 0]],
    ],
    beats: [{ kind: 'add', tile: 'e', to: 1 }, { kind: 'en' }],
    alt: [`*${say}*. ${en}`, 'The pattern is: noun + *ʻe* + number.'],
  }
}

/** The pattern is: noun + 'e + number. */
export const F20_2 = {
  id: '20.2',
  kind: 'row',
  types: ['add'],
  title: 'Noun, *ʻe*, number',
  after: { section: 'numbers-as-adjectives-the-particle-e', block: b => b.type === 'p' && b.text.startsWith('The pattern is: noun') },
  scenes: [
    particleScene('kato', 'ha', 'kato', 'ono', 'ha kato ʻe ono', 'six baskets'),
    particleScene('paanga', null, 'paʻanga', 'taha', 'paʻanga ʻe taha', 'one dollar'),
  ],
}

/** The book's two lines, read as the number's slot turning into the question. */
export const F20_3 = {
  id: '20.3',
  kind: 'row',
  types: ['swap'],
  title: '*fiha* in the number’s place',
  after: { section: 'asking-how-many-and-how-much-fiha', block: b => b.type === 'examples' && b.pairs.some(p => p.line?.includes('kato')) },
  scenes: [
    {
      key: 'kato',
      tiles: {
        lead: [face('ha', 'quiet')],
        noun: [face('kato', 'quiet', 'noun')],
        e: [face('ʻe', 'quiet')],
        slot: [num('ono'), face('fiha', 'question')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ha kato ʻe ono', en: 'six baskets' },
        { say: 'ha kato ʻe fiha?', en: 'how many baskets?' },
      ],
      states: [
        [['lead', 0], ['noun', 0], ['e', 0], ['slot', 0]],
        [['lead', 0], ['noun', 0], ['e', 0], ['slot', 1]],
      ],
      beats: [{ kind: 'swap', tile: 'slot', to: 1 }],
      alt: [
        '*ha kato ʻe ono*. six baskets',
        '*ha kato ʻe fiha?* how many baskets?',
      ],
    },
  ],
}

const toko = { slot: true, form: face('toko', 'quiet'), label: 'people counter' }
const eSlot = { slot: true, form: face('ʻe', 'quiet'), label: 'particle' }

/** toko sits right before the number for people or living animals; 'e may still come earlier. */
export const F20_4 = {
  id: '20.4',
  kind: 'fork',
  types: ['fork'],
  title: '*toko* for people and living animals',
  after: { section: 'counting-people-toko', block: b => b.type === 'p' && b.text.startsWith('The pattern is') },
  lanes: [
    { label: 'People or living animals', forms: ['toko'] },
    { label: 'Any other noun', forms: ['ʻe'] },
  ],
  scenes: [
    {
      key: 'count',
      cases: [
        {
          lane: 0, say: 'Ko e tamaiki ʻe toko tolu.', en: 'Three children.',
          row: [face('Ko e', 'quiet'), { ...face('tamaiki', 'quiet'), ring: true, label: 'noun' }, face('ʻe', 'quiet'), toko, num('tolu')],
        },
        {
          lane: 1, say: 'ha tohi ʻe tolu', en: 'three books',
          row: [face('ha', 'quiet'), { ...face('tohi', 'quiet'), ring: true, label: 'noun' }, eSlot, num('tolu')],
        },
      ],
    },
    {
      key: 'ask',
      cases: [
        {
          lane: 0, say: 'ʻOku toko fiha hoʻo kau akó?', en: 'How many pupils do you have?',
          row: [face('ʻOku', 'tense'), toko, face('fiha', 'question'), face('hoʻo', 'pronoun', 'possessive'), { ...face('kau akó', 'noun'), ring: true, label: 'noun' }],
        },
        {
          lane: 1, say: 'ha kato ʻe fiha?', en: 'how many baskets?',
          row: [face('ha', 'quiet'), { ...face('kato', 'quiet'), ring: true, label: 'noun' }, eSlot, face('fiha', 'question')],
        },
      ],
    },
  ],
  alt: [
    'When a number refers to people or living animals, *toko* precedes the number.',
    '*Ko e tamaiki ʻe toko tolu.* Three children. *ʻOku toko fiha hoʻo kau akó?* How many pupils do you have?',
    '*ha tohi ʻe tolu*. three books. *ha kato ʻe fiha?* how many baskets?',
  ],
}

/** "To answer, state the hour": the question word's slot turns over, Ko e and eni hold still. */
export const F20_5 = {
  id: '20.5',
  kind: 'row',
  types: ['swap'],
  title: 'The hour answers *fihá*',
  after: { section: 'telling-time', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan?.includes('Ko e valú eni')) },
  chips: [
    { state: 0, to: 'fihá', en: 'What time' },
    { state: 1, to: 'tolú', en: 'three' },
    { state: 2, to: 'valú', en: 'eight' },
  ],
  scenes: [
    {
      key: 'time',
      tiles: {
        ko: [face('Ko e', 'quiet')],
        slot: [face('fihá', 'question'), num('tolú'), num('valú')],
        eni: [face('eni', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ko e fihá eni?', en: 'What time is it?' },
        { say: 'Ko e tolú eni.', en: "It is three o'clock." },
        { say: 'Ko e valú eni.', en: "It is eight o'clock." },
      ],
      states: [
        [['ko', 0], ['slot', 0], ['eni', 0]],
        [['ko', 0], ['slot', 1], ['eni', 0]],
        [['ko', 0], ['slot', 2], ['eni', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'slot', to: 1 },
        { kind: 'swap', tile: 'slot', to: 2 },
      ],
      alt: [
        '*Ko e fihá eni?* What time is it?',
        '*Ko e tolú eni.* It is three o\'clock.',
        '*Ko e valú eni.* It is eight o\'clock.',
      ],
    },
  ],
}

export const F20_6 = {
  id: '20.6',
  kind: 'fork',
  types: ['fork'],
  title: 'Before the hour or after it?',
  after: { section: 'telling-time', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan?.startsWith('Kuo')) },
  lanes: [
    { label: 'Before the hour', forms: ['toe'] },
    { label: 'After the hour', forms: ['ʻosi'] },
  ],
  scenes: [
    {
      key: 'minutes',
      cases: [
        {
          lane: 0, say: 'ʻOku toe ʻa e miniti ʻe nima ki he tolú.', en: 'Five minutes to three.',
          row: [face('ʻOku', 'tense'), { slot: true, form: face('toe', 'verb'), label: 'remaining' }, face('ʻa e miniti ʻe nima', 'quiet'), face('ki he tolú', 'quiet')],
        },
        {
          lane: 1, say: 'Kuo ʻosi ʻa e valú, miniti ʻe hongofulu.', en: 'Ten minutes past eight.',
          row: [face('Kuo', 'tense'), { slot: true, form: face('ʻosi', 'verb'), label: 'finished' }, face('ʻa e valú,', 'quiet'), face('miniti ʻe hongofulu', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    'For minutes before the hour, Tongan uses the word *toe*. *ʻOku toe ʻa e miniti ʻe nima ki he tolú.* Five minutes to three. (Lit. "Five minutes remain to the three.")',
    'For minutes after the hour, Tongan uses *ʻosi*. *Kuo ʻosi ʻa e valú, miniti ʻe hongofulu.* Ten minutes past eight. (Lit. "The eight is finished, ten minutes.")',
  ],
}

function ordinalScene(key, plain, accented, say, en) {
  return {
    key,
    tiles: {
      ko: [face('ko', 'quiet')],
      hono: [face('hono', 'pronoun', 'possessive')],
      num: [num(plain), num(accented)],
    },
    before: null,
    after: { say, en },
    states: [
      [['ko', 0], ['num', 0]],
      [['ko', 0], ['hono', 0], ['num', 0]],
      [['ko', 0], ['hono', 0], ['num', 1]],
    ],
    beats: [
      { kind: 'add', tile: 'hono', to: 1 },
      { kind: 'swap', tile: 'num', to: 2 },
      { kind: 'en' },
    ],
    alt: [
      `*${say}*, ${en}.`,
      'For second, third and higher: the possessive *hono* plus the number with the definitive accent.',
    ],
  }
}

/** hono arrives, then the number takes the definitive accent. */
export const F20_7 = {
  id: '20.7',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'Second, third and higher: *hono* plus the accented number',
  after: { section: 'ordinal-numbers', block: b => b.type === 'p' && b.text.startsWith('This is a natural extension') },
  scenes: [
    ordinalScene('third', 'tolu', 'tolú', 'ko hono tolú', 'the third'),
    ordinalScene('fifth', 'nima', 'nimá', 'ko hono nimá', 'the fifth'),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ha', 'quiet'), face('kato', 'quiet', 'noun'), face('ʻe', 'quiet', 'particle'), num('ono')],
  say: 'ha kato ʻe ono',
  en: 'six baskets',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ha tohi ʻe tolu', en: 'three books' },
  { to: 'Ko e tamaiki ʻe toko tolu.', en: 'Three children.' },
  { to: 'Ko e valú eni.', en: "It is eight o'clock." },
]

export const FIGURES = [F20_1, F20_2, F20_3, F20_4, F20_5, F20_6, F20_7]
