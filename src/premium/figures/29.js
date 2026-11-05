// Lesson 29's figures, as data. Every Tongan and English string is copied from
// book/Chapter-29.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Nouns are `quiet`, since none here is a noun
// subject. No figure for the doer/receiver table, the intransitive verbs (no choice to show),
// the Note on relatives, the tables of indefinite forms (the tables show them), the dual
// Note, Words to Learn or Exercises. 29.6's lane keeps the book's exception for second person:
// its examples, ki hoʻo tohi and mei hoʻomou ngāue, have no English, so they get no case.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const E = 'ʻe-class'
const H = 'ho-class'
const examplesWith = (b, text) => b.type === 'examples' && b.pairs.some(p => (p.tongan || p.line || '').includes(text))

function forkCase(lane, before, form, after, say, en) {
  return {
    lane, say, en,
    row: [
      ...(before ? [face(before, 'quiet')] : []),
      { slot: true, form: face(form, 'pronoun') },
      ...(after ? [face(after, 'quiet')] : []),
    ],
  }
}

function verbalCase(lane, form, verb, say, en) {
  return {
    lane, say, en,
    row: [{ slot: true, form: face(form, 'pronoun') }, face(verb, 'quiet', 'verbal noun')],
  }
}

/** The principle: the class says whether the possessor does the action or receives it. */
export const F29_1 = {
  id: '29.1',
  kind: 'fork',
  types: ['fork'],
  title: 'The possessive class tells you: doer or receiver',
  after: { section: 'the-deeper-principle-doer-and-receiver', block: b => b.type === 'p' && b.text.startsWith('Both phrases') },
  lanes: [
    { label: 'ʻE-class (doer)', forms: ['ʻeku', 'ʻene'] },
    { label: 'Ho-class (receiver)', forms: ['hoku', 'hono'] },
  ],
  scenes: [
    {
      key: 'tokoni',
      cases: [
        verbalCase(0, 'ʻEku', 'tokoni', 'ʻEku tokoni.', 'my helping (I do the helping)'),
        verbalCase(1, 'Hoku', 'tokoni', 'Hoku tokoni.', 'my being helped (the helping is done to me)'),
      ],
    },
    {
      key: 'fili',
      cases: [
        verbalCase(0, 'ʻEne', 'fili', 'ʻEne fili.', 'his choosing (he does the choosing)'),
        verbalCase(1, 'Hono', 'fili', 'Hono fili.', 'his being chosen (the choosing is done to him)'),
      ],
    },
  ],
  alt: [
    'ʻE-class (doer): *ʻEku tokoni.* my helping (I do the helping). *ʻEne fili.* his choosing (he does the choosing).',
    'Ho-class (receiver): *Hoku tokoni.* my being helped (the helping is done to me). *Hono fili.* his being chosen (the choosing is done to him).',
  ],
}

function nounScene(key, a, b, noun, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      poss: [face(a, 'pronoun', E), face(b, 'pronoun', H)],
      noun: [face(noun, 'quiet', 'noun')],
    },
    before: null,
    after: null,
    lines: [{ say: sayA, en: enA }, { say: sayB, en: enB }],
    states: [
      [['poss', 0], ['noun', 0]],
      [['poss', 1], ['noun', 0]],
    ],
    beats: [{ kind: 'swap', tile: 'poss', to: 1 }],
    alt: [`*${sayA}* ${enA}. *${sayB}* ${enB}. The noun stays; the class changes with your relationship to it.`],
  }
}

/** Some nouns change class depending on your relationship to them. */
export const F29_2 = {
  id: '29.2',
  kind: 'row',
  types: ['swap'],
  title: 'Same noun, a different relationship',
  after: { section: 'the-principle-with-everyday-nouns', block: b => examplesWith(b, 'vala') },
  scenes: [
    nounScene('vala', 'ʻEku', 'Hoku', 'vala', 'ʻEku vala.', 'the clothes I make (I act upon them)', 'Hoku vala.', 'the clothes I wear (they cover me)'),
    nounScene('hiva', 'ʻEne', 'Hono', 'hiva', 'ʻEne hiva.', 'the song he sings (he produces it)', 'Hono hiva.', 'the song sung about him (it is about him)'),
  ],
}

/** Plants: the fruit or crop takes the ʻe-class, the tree the ho-class, and niu can be either. */
export const F29_3 = {
  id: '29.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Crops and fruit, or trees?',
  after: { section: 'possessives-with-plants', block: b => examplesWith(b, 'Eku niu') },
  lanes: [
    { label: 'Crops and fruit', forms: ['ʻeku'] },
    { label: 'Trees', forms: ['hoku'] },
  ],
  scenes: [
    {
      key: 'crop-tree',
      cases: [
        forkCase(0, null, 'ʻEku', 'ʻufi', 'ʻEku ʻufi.', 'my yam plants (crops, ʻe-class)'),
        forkCase(1, null, 'Hoku', 'niu', 'Hoku niu.', 'my coconut palms (trees, ho-class)'),
      ],
    },
    {
      key: 'niu',
      cases: [
        forkCase(0, null, 'ʻEku', 'niu', 'ʻEku niu.', 'my coconuts (the fruit I harvest)'),
        forkCase(1, null, 'Hoku', 'niu', 'Hoku niu.', 'my coconut palms (the trees)'),
      ],
    },
  ],
  alt: [
    'Crops and fruit take the ʻe-class: *ʻEku ʻufi.* my yam plants. *ʻEku niu.* my coconuts (the fruit I harvest).',
    'Trees take the ho-class: *Hoku niu.* my coconut palms (the trees).',
  ],
}

// 29.4 and 29.5 split the possessive slot from a quiet noun tile, Lesson 17's shape. The engine now keeps
// one stage height when the long ʻOku ʻikai ke ʻi ai row wraps at 390, so the noun no longer lands on the English.
function possCase(lane, frame, form, noun, say, en, tail) {
  return {
    lane, say, en,
    row: [
      face(frame, 'quiet'),
      { slot: true, form: face(form, 'pronoun'), label: true },
      face(noun, 'quiet', 'noun'),
      ...(tail ? [face(tail, 'quiet')] : []),
    ],
  }
}
const OKU = 'ʻOku ʻi ai'
const IKAI = 'ʻOku ʻikai ke ʻi ai'

/** The indefinite form in the question and the negative; the definite returns in the answer. */
export const F29_4 = {
  id: '29.4',
  kind: 'fork',
  types: ['fork'],
  title: 'To have: not specific, or now specific?',
  after: { section: 'indefinite-possessives', block: b => b.type === 'p' && b.text.startsWith('The indefinite form appears') },
  lanes: [
    { label: 'Indefinite, not specific: question or negative', forms: ['haʻo', 'haʻaku'] },
    { label: 'Definite, now specific: affirmative answer', forms: ['ʻeku'] },
  ],
  scenes: [
    {
      key: 'question-negative',
      cases: [
        possCase(0, OKU, 'haʻo', 'kato', 'ʻOku ʻi ai haʻo kato?', 'Do you have a basket?'),
        possCase(0, IKAI, 'haʻaku', 'hele', 'ʻOku ʻikai ke ʻi ai haʻaku hele.', 'I don\'t have a knife.'),
      ],
    },
    {
      key: 'negative-answer',
      cases: [
        possCase(0, IKAI, 'haʻaku', 'hele', 'ʻOku ʻikai ke ʻi ai haʻaku hele.', 'I don\'t have a knife.'),
        possCase(1, OKU, 'ʻeku', 'hele', 'ʻOku ʻi ai ʻeku hele ʻe ua.', 'I have two knives.', 'ʻe ua'),
      ],
    },
  ],
  alt: [
    'The indefinite form appears in the question and in the negative. *ʻOku ʻi ai haʻo kato?* Do you have a basket? *ʻOku ʻikai ke ʻi ai haʻaku hele.* I don\'t have a knife.',
    'The definite form returns in affirmative answers. *ʻOku ʻi ai ʻeku hele ʻe ua.* I have two knives.',
  ],
}

/** The same class rules apply to the indefinite forms. */
export const F29_5 = {
  id: '29.5',
  kind: 'fork',
  types: ['fork'],
  title: 'The same class rules apply',
  after: { section: 'indefinite-possessives', block: b => b.type === 'p' && b.text.startsWith('The same class rules apply') },
  lanes: [
    { label: 'ʻE-class: things you control', forms: ['haʻo', 'haʻaku'] },
    { label: 'Ho-class: things that shelter or define you', forms: ['hao', 'haku'] },
  ],
  scenes: [
    {
      key: 'question',
      cases: [
        possCase(0, OKU, 'haʻo', 'kato', 'ʻOku ʻi ai haʻo kato?', 'Do you have a basket?'),
        possCase(1, OKU, 'hao', 'fale', 'ʻOku ʻi ai hao fale?', 'Do you have a house?'),
      ],
    },
    {
      key: 'negative',
      cases: [
        possCase(0, IKAI, 'haʻaku', 'hele', 'ʻOku ʻikai ke ʻi ai haʻaku hele.', 'I don\'t have a knife.'),
        possCase(1, IKAI, 'haku', 'fale', 'ʻOku ʻikai ke ʻi ai haku fale.', 'I don\'t have a house.'),
      ],
    },
  ],
  alt: [
    'Use the ʻe-class indefinite for things you control. *ʻOku ʻi ai haʻo kato?* Do you have a basket? *ʻOku ʻikai ke ʻi ai haʻaku hele.* I don\'t have a knife.',
    'Use the ho-class indefinite for things that shelter or define you. *ʻOku ʻi ai hao fale?* Do you have a house? *ʻOku ʻikai ke ʻi ai haku fale.* I don\'t have a house.',
  ],
}

/** After a preposition: ho-class connects directly; ʻe-class takes he between, second person excepted. */
export const F29_6 = {
  id: '29.6',
  kind: 'fork',
  types: ['fork'],
  title: 'Does *he* appear after the preposition?',
  after: { section: 'possessives-after-prepositions', block: b => examplesWith(b, 'tamaí') },
  lanes: [
    { label: 'Ho-class: no *he*', forms: ['hoku', 'homau', 'hono'] },
    { label: 'ʻE-class: *he*, except *hoʻo*, *hoʻomo*, *hoʻomou*', forms: ['he ʻene', 'heʻeku', 'he ʻenau'] },
  ],
  scenes: [
    {
      key: 'ki',
      cases: [
        forkCase(0, 'ki', 'hoku', 'falé', 'ki hoku falé', 'to my house'),
        forkCase(1, 'ki', 'he ʻene', 'faiakó', 'ki he ʻene faiakó', 'to his teacher'),
      ],
    },
    {
      key: 'mei',
      cases: [
        forkCase(0, 'mei', 'homau', 'ʻapí', 'mei homau ʻapí', 'from our home'),
        forkCase(1, 'mei', 'heʻeku', 'tamaí', 'mei heʻeku tamaí', 'from my father'),
      ],
    },
    {
      key: 'i-e',
      cases: [
        forkCase(0, 'ʻi', 'hono', 'lokí', 'ʻi hono lokí', 'in his room'),
        forkCase(1, 'ʻe', 'he ʻenau', 'mātuʻá', 'ʻe he ʻenau mātuʻá', 'by their parents'),
      ],
    },
  ],
  alt: [
    'Ho-class possessives connect directly, with no article *he*: *ki hoku falé* to my house, *mei homau ʻapí* from our home, *ʻi hono lokí* in his room.',
    'With an ʻe-class possessive, the article *he* appears between the preposition and the possessive: *ki he ʻene faiakó* to his teacher, *mei heʻeku tamaí* from my father, *ʻe he ʻenau mātuʻá* by their parents.',
    'The second-person forms *hoʻo*, *hoʻomo* and *hoʻomou* are exceptions: they connect directly, with no *he*.',
  ],
}

/** The opening row in the hero: the possessive class and the verbal noun. */
export const OPENING = {
  row: [face('ʻEku', 'pronoun', E), face('tokoni', 'quiet', 'verbal noun')],
  say: 'ʻEku tokoni.',
  en: 'my helping (I do the helping)',
}

/** Recall cards, one per key rule, in order: book sentences only. */
export const RECALL = [
  { to: 'Hoku tokoni.', en: 'my being helped (the helping is done to me)' },
  { to: 'ʻEku vala.', en: 'the clothes I make (I act upon them)' },
  { to: 'ʻOku ʻi ai haʻo kato?', en: 'Do you have a basket?' },
]

export const FIGURES = [F29_1, F29_2, F29_3, F29_4, F29_5, F29_6]
