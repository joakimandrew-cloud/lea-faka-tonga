// Lesson 19's figures, as data. Every Tongan and English string is copied from
// book/Chapter-19.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note *kai ma* (no macron) beside *e mā*.
// The fixed key has no role for the agent marker: alone it is a quiet tile with the book's
// own name for it; a phrase that moves or leaves as one tile keeps the noun's role.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const AGENT = 'agent marker'

function markerCase(lane, say, en, row) {
  return { lane, say, en, row }
}

const intrans = (lane, tense, verb, noun, say, en) => markerCase(lane, say, en, [
  face(tense, 'tense'),
  { ...face(verb, 'verb'), ring: true },
  { slot: true, form: face('ʻa', 'focus'), label: true },
  face(noun, 'noun'),
])

const trans = (lane, tense, verb, noun, object, say, en) => markerCase(lane, say, en, [
  face(tense, 'tense'),
  face(verb, 'verb'),
  { slot: true, form: face('ʻe', 'quiet'), label: AGENT },
  face(noun, 'noun'),
  { ...face(object, 'focus'), ring: true },
])

/** The core distinction: one question picks the marker on the subject. */
export const F19_1 = {
  id: '19.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Does the verb have an object?',
  after: { section: 'transitive-and-intransitive-the-core-distinction', block: b => b.type === 'table' },
  lanes: [
    { label: 'Intransitive (no object)', forms: ['ʻa'] },
    { label: 'Transitive (has an object)', forms: ['ʻe'] },
  ],
  scenes: [
    {
      key: 'sione',
      cases: [
        intrans(0, 'Naʻe', 'lea', 'Sione', 'Naʻe lea ʻa Sione.', 'Sione spoke.'),
        trans(1, 'Naʻe', 'lau', 'Sione', 'ʻa e tohí', 'Naʻe lau ʻe Sione ʻa e tohí.', 'Sione read the book.'),
      ],
    },
    {
      key: 'kepu',
      cases: [
        intrans(0, 'Naʻe', 'lea', 'Tolu', 'Naʻe lea ʻa Tolu.', 'Tolu spoke.'),
        trans(1, 'Naʻe', 'ʻave', 'Pita', 'ʻa Kepu', 'Naʻe ʻave ʻe Pita ʻa Kepu.', 'Pita took Kepu.'),
      ],
    },
  ],
  alt: [
    'Intransitive (no object): the subject takes *ʻa*. *Naʻe lea ʻa Sione.* Sione spoke. *Naʻe lea ʻa Tolu.* Tolu spoke.',
    'Transitive (has an object): the subject takes *ʻe*. *Naʻe lau ʻe Sione ʻa e tohí.* Sione read the book. *Naʻe ʻave ʻe Pita ʻa Kepu.* Pita took Kepu.',
  ],
}

function doerCase(lane, form, tense, verb, noun, object, say, en) {
  return markerCase(lane, say, en, [
    face(tense, 'tense'),
    face(verb, 'verb'),
    { slot: true, form: face(form, 'quiet') },
    { ...face(noun, 'noun'), ring: true },
    face(object, 'focus'),
  ])
}

/** Before a proper noun the agent marker stands alone; before a common noun it combines with he. */
export const F19_2 = {
  id: '19.2',
  kind: 'fork',
  types: ['fork'],
  title: '*ʻe* or *ʻe he*? Look at the doer',
  after: { section: 'common-noun-subjects-e-he', block: b => b.type === 'p' && b.text.includes('follows the same pattern') },
  lanes: [
    { label: 'A proper noun', forms: ['ʻe'] },
    { label: 'A common noun', forms: ['ʻe he'] },
  ],
  scenes: [
    {
      key: 'pita',
      cases: [
        doerCase(0, 'ʻe', 'Naʻe', 'ʻave', 'Pita', 'ʻa Mele', 'Naʻe ʻave ʻe Pita ʻa Mele.', 'Pita took Mele.'),
        doerCase(1, 'ʻe he', 'Kuo', 'fai', 'faiakó', 'ʻa e lesoní', 'Kuo fai ʻe he faiakó ʻa e lesoní?', 'Has the teacher given the lesson?'),
      ],
    },
    {
      key: 'sione',
      cases: [
        doerCase(0, 'ʻe', 'Naʻe', 'lau', 'Sione', 'ʻa e tohí', 'Naʻe lau ʻe Sione ʻa e tohí.', 'Sione read the book.'),
        doerCase(1, 'ʻe he', 'Naʻe', 'tohi', 'tamasiʻí', 'ʻa e tohí', 'Naʻe tohi ʻe he tamasiʻí ʻa e tohí.', 'The boy wrote the book.'),
      ],
    },
  ],
  alt: [
    'A proper noun: *ʻe* stands alone. *Naʻe ʻave ʻe Pita ʻa Mele.* Pita took Mele. *Naʻe lau ʻe Sione ʻa e tohí.* Sione read the book.',
    'A common noun: *ʻe he*. *Kuo fai ʻe he faiakó ʻa e lesoní?* Has the teacher given the lesson? *Naʻe tohi ʻe he tamasiʻí ʻa e tohí.* The boy wrote the book.',
  ],
}

/** The general object fused to the verb, then the same verb with a separate, definite object. */
export const F19_3 = {
  id: '19.3',
  kind: 'row',
  types: ['swap', 'add'],
  title: 'General object or specific object',
  after: { section: 'when-the-object-is-general-vs-specific', block: b => b.type === 'p' && b.text.startsWith('In the first sentence') },
  scenes: [
    {
      key: 'kai',
      tiles: {
        tense: [face('Naʻe', 'tense')],
        verb: [face('kai ma', 'verb'), face('kai', 'verb')],
        marker: [face('ʻa', 'focus'), face('ʻe', 'quiet', AGENT)],
        noun: [face('Sione', 'noun', 'subject')],
        object: [face('ʻa e mā', 'focus')],
      },
      before: { say: 'Naʻe kai ma ʻa Sione.', en: 'Sione ate bread.' },
      after: { say: 'Naʻe kai ʻe Sione ʻa e mā.', en: 'Sione ate the bread.' },
      states: [
        [['tense', 0], ['verb', 0], ['marker', 0], ['noun', 0]],
        [['tense', 0], ['verb', 1], ['marker', 0], ['noun', 0], ['object', 0]],
        [['tense', 0], ['verb', 1], ['marker', 1], ['noun', 0], ['object', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'object', to: 1, roll: 'verb' },
        { kind: 'swap', tile: 'marker', to: 2 },
        { kind: 'en' },
      ],
      alt: [
        '*Naʻe kai ma ʻa Sione.* Sione ate bread. becomes *Naʻe kai ʻe Sione ʻa e mā.* Sione ate the bread.',
        '*kai ma* (eat bread) acts as a single intransitive verb, and the subject marker is *ʻa*.',
        '*e mā* (the bread) is a separate, definite object, and the subject marker switches to *ʻe*.',
      ],
    },
    {
      key: 'inu',
      tiles: {
        tense: [face('Naʻá', 'tense')],
        pron: [face('ku', 'pronoun')],
        verb: [face('inu vai', 'verb'), face('inu', 'verb')],
        object: [face('ʻa e vaí', 'focus')],
      },
      before: { say: 'Naʻá ku inu vai.', en: 'I drank water.' },
      after: { say: 'Naʻá ku inu ʻa e vaí.', en: 'I drank the water.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['verb', 1], ['object', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'object', to: 1, roll: 'verb' },
        { kind: 'en' },
      ],
      alt: ['*Naʻá ku inu vai.* I drank water. (Intransitive compound.) becomes *Naʻá ku inu ʻa e vaí.* I drank the water. (Transitive: definite object.)'],
    },
  ],
}

function doerOut(key, tense, verb, doer, object, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      verb: [face(verb, 'verb')],
      doer: [face(doer, 'noun')],
      object: [face(object, 'focus')],
    },
    before: null,
    after: null,
    lines: [{ say: sayA, en: enA }, { say: sayB, en: enB }],
    states: [
      [['tense', 0], ['verb', 0], ['doer', 0], ['object', 0]],
      [['tense', 0], ['verb', 0], ['GHOST'], ['object', 0]],
    ],
    beats: [{ kind: 'drop', tile: 'doer', to: 1 }],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      'To leave the doer out, drop the *ʻe* phrase. The verb does not change.',
    ],
  }
}

/** Saying who did it, or leaving it out: the ʻe phrase leaves, all else holds still. */
export const F19_4 = {
  id: '19.4',
  kind: 'row',
  types: ['drop'],
  title: 'The *ʻe* phrase leaves',
  after: { section: 'saying-who-did-it-or-leaving-it-out', block: b => b.type === 'p' && b.text.startsWith('To leave the doer out') },
  scenes: [
    doerOut('sione', 'Naʻe', 'langa', 'ʻe Sione', 'ʻa e falé', 'Naʻe langa ʻe Sione ʻa e falé.', 'Sione built the house.', 'Naʻe langa ʻa e falé.', 'The house was built.'),
    doerOut('kuli', 'Kuo', 'kai', 'ʻe he kulī', 'ʻa e moá', 'Kuo kai ʻe he kulī ʻa e moá.', 'The dog has eaten the chicken.', 'Kuo kai ʻa e moá.', 'The chicken has been eaten.'),
  ],
}

/** A pronoun takes the object's place without ʻa, and comes before the ʻe phrase. */
export const F19_5 = {
  id: '19.5',
  kind: 'row',
  types: ['swap', 'move'],
  title: 'A singular pronoun object drops *ʻa* and usually comes before the *ʻe* phrase',
  after: { section: 'postposed-pronouns-as-transitive-objects', block: b => b.type === 'p' && b.text.startsWith('The pronoun object usually follows') },
  scenes: [
    {
      key: 'ia',
      tiles: {
        tense: [face('Naʻe', 'tense')],
        verb: [face('ui', 'verb')],
        doer: [face('ʻe Pita', 'noun')],
        object: [face('ʻa Mele', 'focus'), face('ia', 'pronoun')],
      },
      before: { say: 'Naʻe ui ʻe Pita ʻa Mele.', en: 'Pita called Mele.' },
      after: { say: 'Naʻe ui ia ʻe Pita.', en: 'Pita called her.' },
      states: [
        [['tense', 0], ['verb', 0], ['doer', 0], ['object', 0]],
        [['tense', 0], ['verb', 0], ['doer', 0], ['object', 1]],
        [['tense', 0], ['verb', 0], ['object', 1], ['doer', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'object', to: 1 },
        { kind: 'move', tile: 'object', arc: 'origin', to: 2 },
        { kind: 'en' },
      ],
      alt: [
        '*Naʻe ui ʻe Pita ʻa Mele.* Pita called Mele. (Object is a proper noun: *ʻa* present.) becomes *Naʻe ui ia ʻe Pita.* Pita called her. (Object is a pronoun: *ʻa* dropped.)',
        'The focus marker *ʻa* is dropped before the singular pronouns and is usually dropped before the dual and plural pronouns.',
        'The pronoun object usually follows the verb phrase and comes before the *ʻe* noun phrase.',
      ],
    },
  ],
}

/** Flexible word order: each marker travels with its noun, so the roles hold. */
export const F19_6 = {
  id: '19.6',
  kind: 'row',
  types: ['move'],
  title: 'The markers keep the roles clear, in either order',
  after: { section: 'flexible-word-order-for-emphasis', block: b => b.type === 'p' && b.text.startsWith('The meaning is the same') },
  scenes: [
    {
      key: 'tevita',
      tiles: {
        tense: [face('Naʻe', 'tense')],
        verb: [face('tāmateʻi', 'verb')],
        doer: [face('ʻe Tēvita', 'noun')],
        object: [face('ʻa Kōlaiate', 'focus')],
      },
      before: { say: 'Naʻe tāmateʻi ʻe Tēvita ʻa Kōlaiate.', en: 'Tēvita killed Kōlaiate.' },
      after: { say: 'Naʻe tāmateʻi ʻa Kōlaiate ʻe Tēvita.', en: 'Kōlaiate was killed by Tēvita.' },
      states: [
        [['tense', 0], ['verb', 0], ['doer', 0], ['object', 0]],
        [['tense', 0], ['verb', 0], ['object', 0], ['doer', 0]],
      ],
      beats: [
        { kind: 'move', tile: 'object', to: 1 },
        { kind: 'en' },
      ],
      alt: [
        '*Naʻe tāmateʻi ʻe Tēvita ʻa Kōlaiate.* Tēvita killed Kōlaiate. becomes *Naʻe tāmateʻi ʻa Kōlaiate ʻe Tēvita.* Kōlaiate was killed by Tēvita.',
        'The meaning is the same. The markers *ʻe* and *ʻa* make the roles clear regardless of position.',
      ],
    },
  ],
}

/** Adding "myself": the emphatic pronoun alone without an object, with ʻe when there is one. */
export const F19_7 = {
  id: '19.7',
  kind: 'fork',
  types: ['fork'],
  title: 'Emphasis: *au* or *ʻe au*?',
  after: { section: 'adding-myself-yourself-in-transitive-sentences', block: b => b.type === 'p' && b.text.includes('is the same agent marker') },
  lanes: [
    { label: 'Intransitive', forms: ['au'] },
    { label: 'Transitive', forms: ['ʻe au'] },
  ],
  scenes: [
    {
      key: 'au',
      cases: [
        {
          lane: 0, say: 'Té u nofo au.', en: 'I will stay (emphatic).',
          row: [face('Té', 'tense'), face('u', 'pronoun'), { ...face('nofo', 'verb'), ring: true }, { slot: true, form: face('au', 'pronoun') }],
        },
        {
          lane: 1, say: 'Té u fai ia ʻe au.', en: 'I will do it myself.',
          row: [face('Té', 'tense'), face('u', 'pronoun'), face('fai', 'verb'), { ...face('ia', 'pronoun'), ring: true }, { slot: true, form: face('ʻe au', 'pronoun') }],
        },
      ],
    },
  ],
  alt: [
    'In intransitive sentences, adding the postposed pronoun creates emphasis: *Té u nofo au.* I will stay (emphatic).',
    'In transitive sentences, the same emphasis uses *ʻe* + the postposed pronoun: *Té u fai ia ʻe au.* I will do it myself.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Naʻe', 'tense'), face('ʻave', 'verb'), face('ʻe Pita', 'noun'), face('ʻa Mele', 'focus')],
  say: 'Naʻe ʻave ʻe Pita ʻa Mele.',
  en: 'Pita took Mele.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Naʻe lau ʻe Sione ʻa e tohí.', en: 'Sione read the book.' },
  { to: 'Naʻe kai ma ʻa Sione.', en: 'Sione ate bread.' },
  { to: 'Naʻe langa ʻa e falé.', en: 'The house was built.' },
]

export const FIGURES = [F19_1, F19_2, F19_3, F19_4, F19_5, F19_6, F19_7]
