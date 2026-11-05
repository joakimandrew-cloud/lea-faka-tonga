// Lesson 39's figures, as data. Every Tongan and English string is copied from
// book/Chapter-39.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note koló and falé, ʻoku nau but ʻokú ne.
// No figure for koʻeni and the days, eni as "now", pehē, kaeʻumaʻa, Words to Learn or
// Exercises: their tables and neighbouring lines already show the point. The mei ai sentence
// has no starting sentence in the book, so 39.1 shows ai and ki ai only.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const BACK = 'back-reference'

function aiScene(key, noun, dem, clauseA, clauseB, phraseA, phraseB, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      ko: [face('Ko e', 'quiet')],
      noun: [face(noun, 'noun', 'noun')],
      dem: [face(dem, 'quiet')],
      clause: [face(clauseA, 'quiet'), face(clauseB, 'quiet')],
      phrase: [face(phraseA, 'quiet'), face(phraseB, 'particle', BACK)],
    },
    before: { say: sayA, en: enA },
    after: { say: sayB, en: enB },
    states: [
      [['clause', 0], ['phrase', 0], ['noun', 0]],
      [['noun', 0], ['clause', 0], ['phrase', 0]],
      [['ko', 0], ['noun', 0], ['dem', 0], ['clause', 1], ['phrase', 0]],
      [['ko', 0], ['noun', 0], ['dem', 0], ['clause', 1], ['phrase', 1]],
    ],
    beats: [
      { kind: 'move', tile: 'noun', to: 1 },
      { kind: 'add', tile: ['ko', 'dem'], to: 2, roll: 'clause' },
      { kind: 'swap', tile: 'phrase', to: 3 },
      { kind: 'en' },
    ],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      `A *ko* clause introduces the noun, *${noun}*, and the descriptive clause that follows uses *${phraseB}* to refer back to it.`,
    ],
  }
}

/** The book's table, read across: the noun goes up front and ai refers back to it. */
export const F39_1 = {
  id: '39.1',
  kind: 'row',
  types: ['move', 'add', 'swap'],
  title: 'The noun goes first, and *ai* refers back to it',
  // After the table, before the Note on bare ai, ki ai and mei ai.
  after: { section: 'ai-in-relative-clauses', block: b => b.type === 'table' },
  scenes: [
    aiScene('kolo', 'koló', 'eni', 'ʻOku nau nofo', 'ʻoku nau nofo', 'ʻi he', 'ai',
      'ʻOku nau nofo ʻi he koló.', 'They live in the village.', 'Ko e koló eni ʻoku nau nofo ai.', 'This is the village they live in.'),
    aiScene('fale', 'falé', 'eni', 'ʻOkú ne ngāue', 'ʻokú ne ngāue', 'ʻi he', 'ai',
      'ʻOkú ne ngāue ʻi he falé.', 'He works in the house.', 'Ko e falé eni ʻokú ne ngāue ai.', 'This is the house he works in.'),
    aiScene('tamasii', 'tamasiʻí', 'ia', 'Naʻá ku lea', 'naʻá ku lea', 'ki he', 'ki ai',
      'Naʻá ku lea ki he tamasiʻí.', 'I spoke to the boy.', 'Ko e tamasiʻí ia naʻá ku lea ki ai.', 'That is the boy I spoke to.'),
  ],
}

function pointCase(lane, first, form, label, rest, say, en, who) {
  return {
    lane, say, en,
    ...(who == null ? { group: [] } : { ringPerson: who, group: [who] }),
    row: [
      face(first, 'quiet'),
      { slot: true, form: face(form, 'pronoun', label), label },
      ...(rest ? [face(rest, 'quiet')] : []),
    ],
  }
}

/** The table's four columns, as a choice: who the word is tied to. */
export const F39_2 = {
  id: '39.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Who does the word refer to?',
  after: { section: 'all-the-pointing-words-in-one-place', block: b => b.type === 'table' },
  people: ['speaker', 'listener'],
  lanes: [
    { label: 'Near me', forms: ['ni', 'eni'] },
    { label: 'Near you', forms: ['na', 'ena'] },
    { label: 'Pointing', forms: ['ē'] },
    { label: 'Mentioned', forms: ['ia'] },
  ],
  scenes: [
    {
      key: 'near',
      cases: [
        pointCase(0, 'ʻI he falé', 'ni', 'enclitic', 'ʻoku mau lotu ai', 'ʻI he falé ni ʻoku mau lotu ai.', 'In this house we pray.', 0),
        pointCase(1, 'Ho valá', 'na', 'enclitic', 'ʻoku lelei ʻaupito', 'Ho valá na ʻoku lelei ʻaupito.', 'Those clothes of yours are very nice.', 1),
      ],
    },
    {
      key: 'neither',
      cases: [
        pointCase(2, 'Ko e hā', 'ē', 'pronoun', null, 'Ko e hā ē?', 'What is that? (pointing)', null),
        pointCase(3, 'Ko', 'ia', 'pronoun', 'pē', 'Ko ia pē.', 'That is all.', null),
      ],
    },
  ],
  alt: [
    'Near me: *ni*, *eni*. *ʻI he falé ni ʻoku mau lotu ai.* In this house we pray.',
    'Near you: *na*, *ena*. *Ho valá na ʻoku lelei ʻaupito.* Those clothes of yours are very nice.',
    'Pointing: *ē*, not tied to a particular person. *Ko e hā ē?* What is that? (pointing)',
    'Mentioned: *ia*, detached from both speaker and listener. *Ko ia pē.* That is all.',
  ],
}

// The phrase alone: a Fork row does not wrap, and these sentences run past a phone's width.
// The full sentences are the book's examples straight below the figure.
function evenCase(lane, form, next, nextRole, en) {
  return {
    lane, en,
    row: [
      { slot: true, form: face(form, 'quiet') },
      { ...face(next, nextRole), ring: true },
    ],
  }
}

/** The book's one rule for the form: what comes right after it. */
export const F39_3 = {
  id: '39.3',
  kind: 'fork',
  types: ['fork'],
  title: '*Naʻa mo* or *naʻa mo e*? Look at the next word',
  after: { section: 'two-additional-expressions', block: b => b.type === 'p' && b.text.startsWith('The expression') },
  lanes: [
    { label: 'Before a pronoun or name', forms: ['naʻa mo'] },
    { label: 'Before a common noun with an article', forms: ['naʻa mo e'] },
  ],
  scenes: [
    {
      key: 'ia',
      cases: [
        evenCase(0, 'Naʻa mo', 'ia', 'pronoun', 'Even he'),
        evenCase(1, 'Naʻa mo e', 'ʻahó ni', 'quiet', 'Even today'),
      ],
    },
    {
      key: 'mele',
      cases: [
        evenCase(0, 'Naʻa mo', 'Mele', 'quiet', 'Even Mele'),
      ],
    },
  ],
  alt: [
    'Before a pronoun or name: *naʻa mo*. *Naʻa mo ia, he ʻikai té ne lava.* Even he cannot. *Naʻa mo Mele, naʻe ʻikai fie haʻu.* Even Mele did not want to come.',
    'Before a common noun with an article: *naʻa mo e*. *Naʻa mo e ʻahó ni ʻoku kei puke pē ʻa Tēvitá.* Even today Tēvita is still just sick.',
  ],
}

/** The opening row in the hero: a still. */
export const OPENING = {
  // Three tiles: the hero's still row does not wrap, and five ran off a phone. The blank label
  // keeps the particle's default ("direction") off ai; "back-reference" is wider than its tile.
  row: [face('Ko e koló ia', 'quiet'), face('naʻá ku nofo', 'quiet'), face('ai', 'particle', ' ')],
  say: 'Ko e koló ia naʻá ku nofo ai.',
  en: 'That is the village I lived in.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Ko e tamasiʻí ia naʻá ku lea ki ai.', en: 'That is the boy I spoke to.' },
  { to: 'ʻI he falé ni ʻoku mau lotu ai.', en: 'In this house we pray.' },
  { to: 'Naʻa mo Mele, naʻe ʻikai fie haʻu.', en: 'Even Mele did not want to come.' },
]

export const FIGURES = [F39_1, F39_2, F39_3]
