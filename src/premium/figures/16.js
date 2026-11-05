// Lesson 16's figures, as data. Every Tongan and English string is copied from
// book/Chapter-16.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its macrons and stress accents kept. Labels are the book's own words.
// Left without a figure: the demonstratives review and the pea preview (examples only),
// and the negation review, whose add is already Lesson 12's figure 12.4.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The left and right columns of the book's table: the front turns over, ʻa and the name hold still. */
export const F16_1 = {
  id: '16.1',
  kind: 'row',
  types: ['swap'],
  title: 'In both, *ʻa* marks the subject',
  after: { section: 'noun-subjects-in-equational-sentences-the-focus-marker-a', block: b => b.type === 'p' && b.text.includes('In both cases') },
  // Two scenes: the book's two rows, with Lātū and with ʻOfa.
  scenes: [
    {
      key: 'latu',
      tiles: {
        front: [face('ʻOku', 'tense'), face('Ko e', 'quiet')],
        pred: [face('fiefia', 'verb', 'adjective'), face('tamasiʻi fiefia', 'quiet', 'noun phrase')],
        focus: [face('ʻa', 'focus')],
        noun: [face('Lātū', 'noun')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ʻOku fiefia ʻa Lātū.', en: 'Lātū is happy.' },
        { say: 'Ko e tamasiʻi fiefia ʻa Lātū.', en: 'Lātū is a happy boy.' },
      ],
      states: [
        [['front', 0], ['pred', 0], ['focus', 0], ['noun', 0]],
        [['front', 1], ['pred', 1], ['focus', 0], ['noun', 0]],
      ],
      beats: [{ kind: 'swap', tile: ['front', 'pred'], to: 1 }],
      alt: [
        '*ʻOku fiefia ʻa Lātū.* Lātū is happy.',
        '*Ko e tamasiʻi fiefia ʻa Lātū.* Lātū is a happy boy.',
        'In both cases, *ʻa* marks the subject. The difference is the sentence type: one is verbal (using a tense marker), the other is equational (using *ko*).',
      ],
    },
    {
      key: 'ofa',
      tiles: {
        front: [face('ʻOku', 'tense'), face('Ko e', 'quiet')],
        pred: [face('mālohi', 'verb', 'adjective'), face('taʻahine mālohi', 'quiet', 'noun phrase')],
        focus: [face('ʻa', 'focus')],
        noun: [face('ʻOfa', 'noun')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ʻOku mālohi ʻa ʻOfa.', en: 'ʻOfa is strong.' },
        { say: 'Ko e taʻahine mālohi ʻa ʻOfa.', en: 'ʻOfa is a strong girl.' },
      ],
      states: [
        [['front', 0], ['pred', 0], ['focus', 0], ['noun', 0]],
        [['front', 1], ['pred', 1], ['focus', 0], ['noun', 0]],
      ],
      beats: [{ kind: 'swap', tile: ['front', 'pred'], to: 1 }],
      alt: [
        '*ʻOku mālohi ʻa ʻOfa.* ʻOfa is strong.',
        '*Ko e taʻahine mālohi ʻa ʻOfa.* ʻOfa is a strong girl.',
        'In both cases, *ʻa* marks the subject. The difference is the sentence type: one is verbal (using a tense marker), the other is equational (using *ko*).',
      ],
    },
  ],
}

function pronounScene(key, pred, noun, pron, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      ko: [face('Ko e', 'quiet')],
      pred: [face(pred, 'quiet', 'predicate')],
      focus: [face('ʻa', 'focus')],
      subj: [face(noun, 'noun'), face(pron, 'pronoun')],
    },
    before: { say: sayA, en: enA },
    after: { say: sayB, en: enB },
    states: [
      [['ko', 0], ['pred', 0], ['focus', 0], ['subj', 0]],
      [['ko', 0], ['pred', 0], ['focus', 0], ['subj', 1]],
      [['ko', 0], ['pred', 0], ['subj', 1]],
    ],
    beats: [
      { kind: 'swap', tile: 'subj', to: 1 },
      { kind: 'drop', tile: 'focus', to: 2 },
      { kind: 'en' },
    ],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      'The focus marker *ʻa* is always dropped before postposed pronouns in equational sentences.',
    ],
  }
}

/** The book's noun and pronoun columns: the subject turns into a pronoun and ʻa leaves. */
export const F16_2 = {
  id: '16.2',
  kind: 'row',
  types: ['swap', 'add'],
  title: 'In equational sentences, *ʻa* drops before a postposed pronoun',
  after: { section: 'pronoun-subjects-in-equational-sentences', block: b => b.type === 'table' },
  scenes: [
    pronounScene('mafi', 'tangata ngāue', 'Mafi', 'au', 'Ko e tangata ngāue ʻa Mafi.', 'Mafi is a worker.', 'Ko e tangata ngāue au.', 'I am a worker.'),
    pronounScene('seini', 'taʻahine mālohi', 'Seini', 'ia', 'Ko e taʻahine mālohi ʻa Seini.', 'Seini is a strong girl.', 'Ko e taʻahine mālohi ia.', 'She is a strong girl.'),
  ],
}

function subjectFirstScene(key, pred, noun, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      first: [face('Ko', 'quiet')],
      ko: [face('Ko e', 'quiet'), face('ko e', 'quiet')],
      pred: [face(pred, 'quiet', 'predicate')],
      focus: [face('ʻa', 'focus')],
      subj: [face(noun, 'noun')],
    },
    before: { say: sayA, en: enA },
    after: { say: sayB, en: enB },
    states: [
      [['ko', 0], ['pred', 0], ['focus', 0], ['subj', 0]],
      [['subj', 0], ['ko', 0], ['pred', 0]],
      [['first', 0], ['subj', 0], ['ko', 1], ['pred', 0]],
    ],
    beats: [
      { kind: 'move', tile: 'subj', arc: 'origin', to: 1 },
      { kind: 'add', tile: 'first', roll: 'ko', to: 2 },
      { kind: 'en' },
    ],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      'The subject comes first. The first *ko* introduces the subject, the second *ko e* introduces the predicate.',
      'The English translations look the same, but the Tongan sentences carry different emphasis.',
    ],
  }
}

/** Two example blocks apart in the book: the subject travels to the front and ko arrives before it. */
export const F16_3 = {
  id: '16.3',
  kind: 'row',
  types: ['move', 'add'],
  title: 'Placing the subject first',
  after: { section: 'subject-first-word-order-for-emphasis', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('Lisiate ko e faiako')) },
  scenes: [
    subjectFirstScene('lisiate', 'faiako', 'Lisiate', 'Ko e faiako ʻa Lisiate.', 'Lisiate is the teacher.', 'Ko Lisiate ko e faiako.', 'Lisiate is the teacher. (emphasis: Lisiate, and no one else)'),
    subjectFirstScene('peau', 'tangata mālohi', 'Peau', 'Ko e tangata mālohi ʻa Peau.', 'Peau is a strong man.', 'Ko Peau ko e tangata mālohi.', 'Peau is a strong man.'),
  ],
}

/** The book's four boat lines: the noun keeps its word, and each diminutive lands on its own side. */
export const F16_4 = {
  id: '16.4',
  kind: 'row',
  types: ['add'],
  title: '*Kiʻi* before the noun, *siʻisiʻi* after it',
  after: { section: 'diminutives-kii-and-siisii', block: b => b.type === 'p' && b.text.includes('The difference is position') },
  scenes: [
    {
      key: 'vaka',
      tiles: {
        ko: [face('Ko e', 'quiet')],
        kii: [face('kiʻi', 'quiet', 'preposed')],
        noun: [face('vaka', 'quiet', 'noun')],
        sii: [face('siʻisiʻi', 'quiet', 'postposed')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ko e vaka.', en: 'It is a boat.' },
        { say: 'Ko e kiʻi vaka.', en: 'It is a small boat.' },
        { say: 'Ko e vaka siʻisiʻi.', en: 'It is a small boat.' },
        { say: 'Ko e kiʻi vaka siʻisiʻi.', en: 'It is a very small boat.' },
      ],
      states: [
        [['ko', 0], ['noun', 0]],
        [['ko', 0], ['kii', 0], ['noun', 0]],
        [['ko', 0], ['noun', 0], ['sii', 0]],
        [['ko', 0], ['kii', 0], ['noun', 0], ['sii', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'kii', to: 1 },
        { kind: 'add', tile: 'sii', to: 2 },
        { kind: 'add', tile: 'kii', to: 3 },
      ],
      alt: [
        '*Ko e vaka.* It is a boat.',
        '*Ko e kiʻi vaka.* It is a small boat.',
        '*Ko e vaka siʻisiʻi.* It is a small boat.',
        '*Ko e kiʻi vaka siʻisiʻi.* It is a very small boat.',
        'The difference is position: *kiʻi* before the noun, *siʻisiʻi* after it.',
      ],
    },
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Ko e', 'quiet'), face('faiako', 'quiet', 'predicate'), face('ʻa', 'focus'), face('Lisiate', 'noun')],
  say: 'Ko e faiako ʻa Lisiate.',
  en: 'Lisiate is the teacher.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Ko e tangata ngāue ʻa Mafi.', en: 'Mafi is a worker.' },
  { to: 'Ko e tangata ngāue au.', en: 'I am a worker.' },
  { to: 'Ko Lisiate ko e faiako.', en: 'Lisiate is the teacher. (emphasis: Lisiate, and no one else)' },
]

export const FIGURES = [F16_1, F16_2, F16_3, F16_4]
