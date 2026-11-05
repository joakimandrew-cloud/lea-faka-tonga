// Lesson 13's figures, as data. Every Tongan and English string is copied from
// book/Chapter-13.md at origin/main, as the site renders it (straight ' to U+02BB).
// No figure for the answers (ko + the person is a definition with examples), the
// Summary table, Words to Learn or Exercises. The ko hai fork (tense marker alone
// against té ne) is held under ruling H1 until Ch 13 joins the app book sync.
// The where fork (HELD_13_WHERE below) is held the same way: it copies live line 67,
// which the root book has since corrected (the nuance belongs to ko e fē, and
// Shumway treats ko fē as a plain alternative). Rebuild it from the synced text.

const face = (text, role, label) => ({ text, role, ...(label !== undefined ? { label } : {}) })
const what = () => face('Ko e hā', 'question', 'what')

/** The longer form: hā at the front, then the thing, then the clause describing it. */
export const F13_1 = {
  id: '13.1',
  kind: 'row',
  types: ['add'],
  title: 'The question word at the front, the thing described after it',
  after: { section: 'ko-e-ha-and-ko-e-ha-a-e-mea-what', block: b => b.type === 'p' && b.text.includes('literal translation') },
  scenes: [
    {
      key: 'fiemau',
      tiles: {
        q: [what()],
        thing: [face('ʻa e meʻa', 'quiet', 'thing')],
        clause: [face('ʻokú ke fiemaʻu', 'quiet', 'clause')],
      },
      before: null,
      after: { say: 'Ko e hā ʻa e meʻa ʻokú ke fiemaʻu?', en: 'What do you want? (Lit. "The thing you want-to-get is what?")' },
      states: [
        [['q', 0]],
        [['q', 0], ['thing', 0]],
        [['q', 0], ['thing', 0], ['clause', 0]],
      ],
      beats: [{ kind: 'add', tile: 'thing', to: 1 }, { kind: 'add', tile: 'clause', to: 2 }, { kind: 'en' }],
      alt: ['*Ko e hā ʻa e meʻa ʻokú ke fiemaʻu?* What do you want? The thing being asked about is described in the clause, with the question word *hā* sitting at the front.'],
    },
  ],
}

/** Held: two ways to ask where. Not in FIGURES until the book sync (see top). */
export const HELD_13_WHERE = {
  id: '13.held-where',
  kind: 'fork',
  types: ['fork'],
  title: 'Two ways to ask where',
  after: { section: 'ko-fe-where-which', block: b => b.type === 'p' && b.text.startsWith('You may recall') },
  lanes: [
    { label: 'You suppose it may be far away', forms: ['ʻoku ʻi fē'] },
    { label: 'You suppose it is somewhere within sight', forms: ['ko fē'] },
  ],
  scenes: [
    {
      key: 'where',
      cases: [
        {
          lane: 0, say: 'ʻoku ʻi fē', en: 'where?',
          row: [{ slot: true, form: face('ʻoku ʻi fē', 'question') }],
        },
        {
          lane: 1, say: 'Ko fē ʻa e kato?', en: 'Where is the basket?',
          row: [{ slot: true, form: face('Ko fē', 'question') }, face('ʻa e kato', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    '*ʻoku ʻi fē* is used when you suppose the person or thing may be far away.',
    '*ko fē* is used when you suppose it is somewhere within sight. *Ko fē ʻa e kato?* Where is the basket?',
  ],
}

function whyScene(key, tiles, order, say, en) {
  const without = order.filter(id => id !== 'ai').map(id => [id, 0])
  return {
    key,
    tiles: { ...tiles, ai: [face('ai', 'particle', 'because of it')] },
    before: null,
    after: { say, en },
    states: [without, order.map(id => [id, 0])],
    beats: [{ kind: 'add', tile: 'ai', to: 1 }, { kind: 'en' }],
    alt: [`*${say}* ${en} The *ai* comes immediately after the verb or verb phrase.`],
  }
}

/** Why: ai lands immediately after the verb. */
export const F13_2 = {
  id: '13.2',
  kind: 'row',
  types: ['add'],
  title: 'Where *ai* sits',
  after: { section: 'ko-e-ha-ai-why', block: b => b.type === 'p' && b.text.includes('comes immediately after the verb') },
  scenes: [
    whyScene(
      'nukualofa',
      { q: [what()], tense: [face('naʻá ke', 'tense', 'tense + *ke*')], verb: [face('ʻalu', 'verb')], place: [face('ki Nukuʻalofa', 'place')] },
      ['q', 'tense', 'verb', 'ai', 'place'],
      'Ko e hā naʻá ke ʻalu ai ki Nukuʻalofa?',
      'Why did you go to Nukuʻalofa? (Lit. "What is [the thing] you went because-of-it to Nukuʻalofa?")',
    ),
    whyScene(
      'ita',
      { q: [what()], tense: [face('naʻe', 'tense')], verb: [face('ʻita', 'verb')] },
      ['q', 'tense', 'verb', 'ai'],
      'Ko e hā naʻe ʻita ai?',
      'Why was he angry? (Lit. "What is [the thing] was-angry because-of-it?")',
    ),
  ],
}

export const OPENING = {
  row: [face('Ko hai', 'question'), face('ʻoku', 'tense'), face('hiva', 'verb')],
  say: 'Ko hai ʻoku hiva?',
  en: 'Who is singing?',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Ko hai ʻoku hiva?', en: 'Who is singing?' },
  { to: 'Ko fē ʻa e kato?', en: 'Where is the basket?' },
  { to: 'Ko Sione.', en: 'Sione.' },
]

export const FIGURES = [F13_1, F13_2]
