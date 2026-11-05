// Lesson 17's figures, as data. Every Tongan and English string is copied from
// book/Chapter-17.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Labels are the book's words: ʻE-class, Ho-class,
// verbal noun, "of". The possessed nouns are `quiet`: the green noun tile means a noun subject.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function classCase(lane, form, noun, say, en) {
  return { lane, say, en, row: [{ slot: true, form: face(form, 'pronoun'), label: true }, face(noun, 'quiet', 'noun')] }
}

/** Two Classes: the book says the class follows the relationship, not the thing, and its mat shows
 *  it. The second scene is the same noun in both lanes. A question about meaning rings nothing. */
export const F17_1 = {
  id: '17.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Your relationship to the thing picks the class',
  after: { section: 'two-classes-of-possession', block: b => b.type === 'p' && b.text.startsWith('Some words shift class') },
  lanes: [
    { label: 'ʻE-class: you act upon it', forms: ['ʻeku'] },
    { label: 'Ho-class: it acts upon you', forms: ['hoku'] },
  ],
  scenes: [
    {
      key: 'hele-fale',
      cases: [
        classCase(0, 'ʻeku', 'hele', 'ʻeku hele', 'my knife'),
        classCase(1, 'hoku', 'fale', 'hoku fale', 'my house'),
      ],
    },
    {
      key: 'fala',
      cases: [
        classCase(0, 'ʻeku', 'fala', 'ʻeku fala', 'the mat I make'),
        classCase(1, 'hoku', 'fala', 'hoku fala', 'the mat I sit on'),
      ],
    },
  ],
  alt: [
    'ʻE-class, you act upon it: *ʻeku hele*, my knife. *ʻeku fala*, the mat I make.',
    'Ho-class, it acts upon you: *hoku fale*, my house. *hoku fala*, the mat I sit on.',
  ],
}

function pair(marker, rest, en) {
  return { marker, rest, say: `${marker}${rest}`, en }
}

/** The book prints the two sets in two tables a section apart, and its test is a comparison across
 *  them. Here they share one table, with the book's examples. It rests on hoʻo, the form the book
 *  warns about: a first letter h, and still a glottal stop. Titled for these tables: Lesson 37 has
 *  ho-class forms that carry one too. */
export const F17_2 = {
  id: '17.2',
  kind: 'grid',
  types: ['grid'],
  title: 'In these two tables, the glottal stop tells them apart',
  after: { section: 'ho-class-possessive-pronouns', block: b => b.type === 'p' && b.text.startsWith('Notice the pattern') },
  head: ['Meaning', 'ʻE-class', 'Ho-class'],
  rows: [
    { tense: 'my', cells: [pair('ʻeku', ' hele', 'my knife'), pair('hoku', ' fale', 'my house')] },
    { tense: 'your (sg.)', cells: [pair('hoʻo', ' tohi', 'your book'), pair('ho', ' hingoa', 'your name')] },
    { tense: 'his, her, its', cells: [pair('ʻene', ' kato', 'his/her basket'), pair('hono', ' kofu', 'his/her clothes')] },
    { tense: 'our (incl.)', cells: [pair('ʻetau', ' ngāue', 'our work'), pair('hotau', ' fonua', 'our country')] },
    { tense: 'our (excl.)', cells: [pair('ʻemau', ' vaka', 'our boat'), pair('homau', ' loki', 'our room')] },
    { tense: 'your (pl.)', cells: [pair('hoʻomou', ' fala', 'your mat'), pair('homou', ' fale', 'your house')] },
    { tense: 'their', cells: [pair('ʻenau', ' meʻakai', 'their food'), pair('honau', ' ʻapi', 'their home')] },
  ],
  rest: { row: 1, col: 0 },
  scenes: [{ key: 'grid' }],
}

/** The book's own comparison: ki he fale, then the he disappears and the possessive follows ki. */
export const F17_3 = {
  id: '17.3',
  kind: 'row',
  types: ['add'],
  title: 'Before a ho-class possessive, the *he* disappears',
  after: { section: 'ho-class-possessive-pronouns', block: b => b.type === 'p' && b.text.startsWith('Compare this with ordinary nouns') },
  scenes: [
    {
      key: 'ki-hoku-fale',
      tiles: {
        ki: [face('ki', 'quiet')],
        he: [face('he', 'quiet', 'article')],
        poss: [face('hoku', 'pronoun')],
        fale: [face('fale', 'quiet', 'noun')],
      },
      before: { say: 'ki he fale', en: 'to the house' },
      after: { say: 'ki hoku fale', en: 'to my house' },
      states: [
        [['ki', 0], ['he', 0], ['fale', 0]],
        [['ki', 0], ['GHOST'], ['fale', 0]],
        [['ki', 0], ['poss', 0], ['fale', 0]],
      ],
      beats: [
        { kind: 'drop', tile: 'he', old: true, to: 1 },
        { kind: 'add', tile: 'poss', to: 2 },
        { kind: 'en' },
      ],
      alt: [
        '*ki he fale* to the house becomes *ki hoku fale* to my house.',
        'With ho-class possessives, the *he* disappears.',
      ],
    },
  ],
}

const S = 'speaker'
const L = 'listener'
const T = 'third'

/** A cell: its form, the marks it counts, and the book's words for it. Below the grid the words sit
 *  with everyone in the room: others, speaker, listener. Those the word means get a frame. */
function dual(form, count, say, en) {
  const others = count.filter(who => who === T)
  const listeners = count.filter(who => who === L)
  const people = [...others, S, ...(listeners.length ? listeners : [L])]
  const members = people.map((who, i) => (who === T || count.includes(who) ? i : -1)).filter(i => i >= 0)
  return { form, count, say, en, people, members }
}

/** The book's dual table, with the marks showing who its Meaning column counts. The table can say
 *  "his/hers and mine" but cannot show which two people that is. Most forms have no book sentence,
 *  so their cell gives the form and the table's meaning; homa and hona take the book's sentences. */
export const F17_4 = {
  id: '17.4',
  kind: 'grid',
  types: ['grid'],
  title: 'Two people: which two?',
  after: { section: 'dual-possessive-pronouns', block: b => b.type === 'table' },
  lightColumns: true,
  head: ['Meaning', 'ʻE-class', 'Ho-class'],
  rows: [
    { tense: 'our (yours and mine, two)', cells: [
      dual('ʻeta', [S, L], 'ʻeta', 'our (yours and mine, two)'),
      dual('hota', [S, L], 'hota', 'our (yours and mine, two)'),
    ] },
    { tense: 'our (his/hers and mine, two)', cells: [
      dual('ʻema', [S, T], 'ʻema', 'our (his/hers and mine, two)'),
      dual('homa', [S, T], 'Kuo ngalo homa kote.', 'We (he and I) have forgotten our coats.'),
    ] },
    { tense: 'your (his/hers and yours, two)', cells: [
      dual('hoʻomo', [L, T], 'hoʻomo', 'your (his/hers and yours, two)'),
      dual('homo', [L, T], 'homo', 'your (his/hers and yours, two)'),
    ] },
    { tense: 'their (two)', cells: [
      dual('ʻena', [T, T], 'ʻena', 'their (two)'),
      dual('hona', [T, T], 'Ko fē hona kote?', 'Where are their coats (the two of them)?'),
    ] },
  ],
  rest: { row: 1, col: 1 },
  scenes: [{ key: 'grid' }],
}

function ofCase(lane, form, head, tail, say, en) {
  return { lane, say, en, row: [face(head, 'quiet'), { slot: true, form: face(form, 'quiet'), label: 'of' }, face(tail, 'quiet')] }
}

/** Both translate as "of", and the class picks which. The second scene is the book's clearest case:
 *  one noun, tokoni, given by the teacher and given to the country. */
export const F17_5 = {
  id: '17.5',
  kind: 'fork',
  types: ['fork'],
  title: 'Two words for “of”',
  after: { section: 'the-possessive-prepositions-a-and-o', block: b => b.type === 'p' && b.text.startsWith('The distinction is clearest') },
  lanes: [
    { label: 'ʻE-class', forms: ['ʻa'] },
    { label: 'Ho-class', forms: ['ʻo'] },
  ],
  scenes: [
    {
      key: 'sione',
      cases: [
        ofCase(0, 'ʻa', 'Ko e paʻanga', 'Sione', 'Ko e paʻanga ʻa Sione.', "Sione's money."),
        ofCase(1, 'ʻo', 'Ko e fale', 'Sione', 'Ko e fale ʻo Sione.', "Sione's house."),
      ],
    },
    {
      key: 'tokoni',
      cases: [
        ofCase(0, 'ʻa', 'ko e tokoni', 'e faiako', 'ko e tokoni ʻa e faiako', 'the help given by the teacher'),
        ofCase(1, 'ʻo', 'ko e tokoni', 'e fonua', 'ko e tokoni ʻo e fonua', 'the help given to the country'),
      ],
    },
  ],
  alt: [
    "ʻE-class, *ʻa*: *Ko e paʻanga ʻa Sione.* Sione's money. *ko e tokoni ʻa e faiako* the help given by the teacher.",
    "Ho-class, *ʻo*: *Ko e fale ʻo Sione.* Sione's house. *ko e tokoni ʻo e fonua* the help given to the country.",
  ],
}

function verbalScene(key, poss, verb, place, say, en) {
  const tiles = {
    ko: [face('Ko', 'quiet')],
    poss: [face(poss, 'pronoun')],
    verb: [face(verb, 'verb'), face(verb, 'quiet', 'verbal noun')],
    ...(place ? { place: [face(place, 'place')] } : {}),
  }
  const end = place ? [['place', 0]] : []
  return {
    key,
    tiles,
    before: null,
    after: { say, en },
    states: [
      [['verb', 0], ...end],
      [['poss', 0], ['verb', 0], ...end],
      [['poss', 0], ['verb', 1], ...end],
      [['ko', 0], ['poss', 0], ['verb', 1], ...end],
    ],
    beats: [
      { kind: 'add', tile: 'poss', to: 1 },
      { kind: 'swap', tile: 'verb', to: 2 },
      { kind: 'add', tile: 'ko', to: 3 },
      { kind: 'en' },
    ],
    alt: [
      `*${say}* ${en}`,
      'The pattern: *ko* + possessive pronoun + verb (as verbal noun).',
    ],
  }
}

/** The book's sentence: a verb paired with a possessive pronoun becomes a noun. The tile turns over
 *  when the possessive arrives, and ko completes the pattern. The English keeps the book's Lit. line,
 *  which is what makes the shape readable. */
export const F17_6 = {
  id: '17.6',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'A possessive turns the verb into a noun',
  after: { section: 'possessives-with-ko-describing-current-actions', block: b => b.type === 'p' && b.text.startsWith('The pattern') },
  scenes: [
    verbalScene('alu', 'ʻeku', 'ʻalu', 'ki Nukunuku', 'Ko ʻeku ʻalu ki Nukunuku.', 'I am going to Nukunuku. (Lit. "It is my going to Nukunuku.")'),
    verbalScene('huo', 'hoʻo', 'huo', null, 'Ko hoʻo huo?', 'Are you hoeing? (Lit. "It is your hoeing?")'),
  ],
}

/** The opening row in the hero: a still. The one stroked tile holds the possessive, labelled with
 *  the book's gloss. Grouped to three tiles: four wrapped on a phone, and "fale ʻa Sione" as a tile
 *  would read as the book's ʻa of possession, which this ʻa is not. */
export const OPENING = {
  row: [face('ʻOku ʻi', 'quiet'), face('hoku fale', 'pronoun', 'my house'), face('ʻa Sione', 'quiet')],
  say: 'ʻOku ʻi hoku fale ʻa Sione.',
  en: 'Sione is at my house.',
}

/** Recall cards, by key rule: book examples only. */
export const RECALL = [
  { to: 'ʻeku hele', en: 'my knife' },
  { to: 'hoku fale', en: 'my house' },
  { to: 'Ko e paʻanga ʻa Sione.', en: "Sione's money." },
  { to: 'Ko hoʻo ako?', en: 'Are you studying?' },
]

export const FIGURES = [F17_1, F17_2, F17_3, F17_4, F17_5, F17_6]
