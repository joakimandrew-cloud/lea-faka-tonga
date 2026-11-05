// Lesson 22's figures, as data. Every Tongan and English string is copied from
// book/Chapter-22.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note Naʻá ku against Naʻa mau, and ʻOkú ne
// against ʻOku ou: the accent tracks the next word, so copy, never carry it over.
// No figure for kei, toe, lolotonga or ʻosi taken one by one (a definition with
// examples), the frequency words or taki taha (examples and the book's table show them),
// Words to Learn or Exercises. An exercise's printed answer appears only where the reading
// prints the same sentence.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

const MARKER = 'marker'

function slotScene(key, tense, pron, marker, verb, last, lastRole, say, en) {
  const tiles = {
    tense: [face(tense, 'tense')],
    pron: [face(pron, 'pronoun')],
    marker: [face(marker, 'particle', MARKER)],
    verb: [face(verb, 'verb')],
    ...(last ? { last: [face(last, lastRole)] } : {}),
  }
  const tail = last ? [['last', 0]] : []
  return {
    key,
    tiles,
    before: null,
    after: { say, en },
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0], ...tail],
      [['tense', 0], ['pron', 0], ['marker', 0], ['verb', 0], ...tail],
    ],
    beats: [{ kind: 'add', tile: 'marker', to: 1 }, { kind: 'en' }],
    alt: [`*${say}* ${en}`, `*${marker}* comes between the pronoun and the verb.`],
  }
}

/** The lesson's pattern, tense marker + pronoun + aspect marker + verb: the same place each time. */
export const F22_4 = {
  id: '22.4',
  kind: 'row',
  types: ['add'],
  title: 'Tense marker, pronoun, aspect marker, verb',
  after: { section: 'all-aspect-markers-together', block: b => b.type === 'table' },
  scenes: [
    slotScene('kei', 'ʻOku', 'ou', 'kei', 'feinga', 'pē', 'quiet', 'ʻOku ou kei feinga pē.', 'I am still trying.'),
    slotScene('osi', 'Kuó', 'ne', 'ʻosi', 'ʻalu', null, null, 'Kuó ne ʻosi ʻalu.', 'He has already gone.'),
    slotScene('lolotonga', 'ʻOku', 'ou', 'lolotonga', 'lau', 'ha tohi', 'quiet', 'ʻOku ou lolotonga lau ha tohi.', 'I am currently reading a book.'),
    slotScene('toe', 'Naʻá', 'ku', 'toe', 'ʻalu', 'ki kolo', 'place', 'Naʻá ku toe ʻalu ki kolo.', 'I went to town again.'),
  ],
}

/** Which teʻeki: the book's three uses, told apart by what comes after it. */
export const F22_1 = {
  id: '22.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Which form of *teʻeki*? Look at what comes next',
  after: { section: 'teeki-ai-not-yet', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('kamata')) },
  lanes: [
    { label: 'Before a pronoun', forms: ['teʻeki te'] },
    { label: 'Before a verb with a noun subject', forms: ['teʻeki'] },
    { label: 'As the short answer', forms: ['Teʻeki ai'] },
  ],
  scenes: [
    {
      key: 'full',
      cases: [
        {
          lane: 0, say: 'ʻOku teʻeki té ke ʻalu tuʻo taha ki Haʻapai.', en: 'You have not gone even once to Haʻapai.',
          row: [face('ʻOku', 'tense'), { slot: true, form: face('teʻeki té', 'particle') }, { ...face('ke', 'pronoun'), ring: true, label: 'pronoun' }, face('ʻalu', 'verb'), face('tuʻo taha ki Haʻapai', 'quiet')],
        },
        {
          lane: 1, say: 'ʻOku teʻeki kamata ʻa e ngāué.', en: 'The work has not started yet.',
          row: [face('ʻOku', 'tense'), { slot: true, form: face('teʻeki', 'particle') }, { ...face('kamata', 'verb'), ring: true, label: 'verb' }, face('ʻa e ngāué', 'noun')],
        },
      ],
    },
    {
      key: 'alone',
      cases: [
        {
          lane: 2, say: 'Teʻeki ai.', en: 'Not yet.',
          row: [{ slot: true, form: face('Teʻeki ai', 'particle') }],
        },
      ],
    },
  ],
  alt: [
    'Before a pronoun, *teʻeki te*: *ʻOku teʻeki té ke ʻalu tuʻo taha ki Haʻapai.* You have not gone even once to Haʻapai.',
    'Before a verb with a noun subject, *teʻeki* can stand without *te* or *ke*: *ʻOku teʻeki kamata ʻa e ngāué.* The work has not started yet.',
    'The short answer: *Teʻeki ai.* Not yet.',
  ],
}

/** One toki, two meanings: the time the sentence refers to settles which. */
export const F22_2 = {
  id: '22.2',
  kind: 'fork',
  types: ['fork'],
  title: 'What does *toki* mean here? Look at the time',
  after: { section: 'toki-just-not-until', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('inu')) },
  lanes: [
    { label: 'Recent past: just', forms: ['toki'] },
    { label: 'Delayed future: not until', forms: ['toki'] },
  ],
  scenes: [
    {
      key: 'book',
      cases: [
        {
          lane: 0, say: 'Naʻa mau toki haʻu ʻaneafi.', en: 'We just came yesterday.',
          row: [{ ...face('Naʻa', 'tense'), ring: true, label: 'tense' }, face('mau', 'pronoun'), { slot: true, form: face('toki', 'particle') }, face('haʻu', 'verb'), face('ʻaneafi', 'quiet')],
        },
        {
          lane: 1, say: 'ʻE toki kamata ʻa e fakatahá ʻapongipongi.', en: 'The meeting will not begin until tomorrow.',
          row: [{ ...face('ʻE', 'tense'), ring: true, label: 'tense' }, { slot: true, form: face('toki', 'particle') }, face('kamata', 'verb'), face('ʻa e fakatahá', 'noun'), face('ʻapongipongi', 'quiet')],
        },
      ],
    },
    {
      key: 'more',
      cases: [
        {
          lane: 0, say: 'Naʻá ku toki fanongo ki he meʻa ko iá.', en: 'I only just heard about that.',
          row: [{ ...face('Naʻá', 'tense'), ring: true, label: 'tense' }, face('ku', 'pronoun'), { slot: true, form: face('toki', 'particle') }, face('fanongo', 'verb'), face('ki he meʻa ko iá', 'quiet')],
        },
        {
          lane: 1, say: 'Té u toki ngāue.', en: 'I will work presently. (Not right now, but soon.)',
          row: [{ ...face('Té', 'tense'), ring: true, label: 'tense' }, face('u', 'pronoun'), { slot: true, form: face('toki', 'particle') }, face('ngāue', 'verb')],
        },
      ],
    },
  ],
  alt: [
    'Referring to the past, *toki* emphasizes recency: *Naʻa mau toki haʻu ʻaneafi.* We just came yesterday. *Naʻá ku toki fanongo ki he meʻa ko iá.* I only just heard about that.',
    'Referring to the future, *toki* emphasizes delay: *ʻE toki kamata ʻa e fakatahá ʻapongipongi.* The meeting will not begin until tomorrow. *Té u toki ngāue.* I will work presently. (Not right now, but soon.)',
  ],
}

/** The book's Note: toki before the verb, leva after it, in one phrase. */
export const F22_3 = {
  id: '22.3',
  kind: 'row',
  types: ['add'],
  title: '*toki* before the verb, *leva* after it',
  after: { section: 'leva-immediately', block: b => b.type === 'note' },
  scenes: [{
    key: 'both',
    tiles: {
      tense: [face('naʻe', 'tense')],
      toki: [face('toki', 'particle', 'before the verb')],
      verb: [face('ʻalu', 'verb')],
      leva: [face('leva', 'particle', 'after the verb')],
    },
    before: null,
    after: { say: 'naʻe toki ʻalu leva', en: 'then went immediately' },
    states: [
      [['tense', 0], ['verb', 0]],
      [['tense', 0], ['toki', 0], ['verb', 0]],
      [['tense', 0], ['toki', 0], ['verb', 0], ['leva', 0]],
    ],
    beats: [{ kind: 'add', tile: 'toki', to: 1 }, { kind: 'add', tile: 'leva', to: 2 }, { kind: 'en' }],
    alt: ['*naʻe toki ʻalu leva*: then went immediately.', '*Toki* is preposed (before the verb) and *leva* is postposed (after the verb).'],
  }],
}

/** tuʻo tolu counts; with ko e it orders. */
export const F22_5 = {
  id: '22.5',
  kind: 'fork',
  types: ['fork'],
  title: 'Three times, or the third time? Look for *ko e*',
  after: { section: 'counting-times-tuo-numeral', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('tolu eni')) },
  lanes: [
    { label: 'No *ko e*: how many times', forms: ['tuʻo tolu'] },
    { label: 'With *ko e*: the Nth time', forms: ['tuʻo tolu'] },
  ],
  scenes: [
    {
      key: 'three',
      cases: [
        {
          lane: 0, say: 'Naʻe tuʻo tolu ʻeku tohi kia Mele.', en: 'Three times I wrote to Mele. (Lit. "Was three-times my writing to Mele")',
          row: [{ ...face('Naʻe', 'tense'), ring: true, label: 'tense' }, { slot: true, form: face('tuʻo tolu', 'quiet') }, face('ʻeku tohi', 'quiet'), face('kia Mele', 'quiet')],
        },
        {
          lane: 1, say: 'Ko e tuʻo tolu eni ʻo ʻeku haʻú.', en: 'This is the third time I have come.',
          row: [{ ...face('Ko e', 'quiet'), ring: true }, { slot: true, form: face('tuʻo tolu', 'quiet') }, face('eni', 'quiet'), face('ʻo ʻeku haʻú', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    '*Naʻe tuʻo tolu ʻeku tohi kia Mele.* Three times I wrote to Mele.',
    'In the predicate with *ko e*, *tuʻo* + numeral takes on an ordinal sense, "the Nth time": *Ko e tuʻo tolu eni ʻo ʻeku haʻú.* This is the third time I have come.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOkú', 'tense'), face('ne', 'pronoun'), face('kei', 'particle', MARKER), face('mohe', 'verb'), face('pē', 'quiet')],
  say: 'ʻOkú ne kei mohe pē.',
  en: 'He is still sleeping.',
}

/** Recall cards, one per key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOkú ne kei fiekaia pē.', en: 'He is still hungry.' },
  { to: 'Kuó ne ʻosi ʻalu.', en: 'He has already gone.' },
  { to: 'ʻOkú ke fie toe haʻu?', en: 'Do you want to come again?' },
]

export const FIGURES = [F22_1, F22_2, F22_3, F22_4, F22_5]
