// Lesson 33's figures, as data. Every Tongan and English string is copied from
// book/Chapter-33.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note falá, ngāué, iká, and ʻene ʻu falá with
// the book's plain u. Labels are the book's words: preposition, object, instrument,
// intransitive, transitive. The ʻa of 33.2 takes the focus look and its default label,
// as in Lesson 19 (the book: "The focus marker 'a on objects").
// No figure for: the meanings of ʻaki (its table shows them), ʻaki as "with it" (the book
// prints no sentence with the noun repeated to change from), teuteu and teuteuʻi (the lanes
// of 33.3 do not fit it, and the two lines sit side by side already), the suffix -ʻaki (its
// table and Note carry it, and the book prints no pair to change between), Words to Learn
// or Exercises.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** Both orders are correct and mean the same thing; the row rests on the more common one. */
export const F33_1 = {
  id: '33.1',
  kind: 'row',
  types: ['move'],
  title: 'Two orders, the same meaning',
  after: { section: 'expressing-with-and-by-means-of', block: b => b.type === 'p' && b.text.startsWith('Both orders are correct') },
  scenes: [
    {
      key: 'fufulu',
      tiles: {
        verb: [face('Fufulu', 'verb')],
        aki: [face('ʻaki', 'particle', 'preposition')],
        object: [face('ho falá', 'quiet', 'object')],
        means: [face('e vai māfaná', 'quiet', 'instrument')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Fufulu ho falá ʻaki e vai māfaná.', en: 'Wash your mat with warm water.' },
        { say: 'Fufulu ʻaki ho falá e vai māfaná.', en: 'Wash your mat with warm water.' },
      ],
      states: [
        [['verb', 0], ['object', 0], ['aki', 0], ['means', 0]],
        [['verb', 0], ['aki', 0], ['object', 0], ['means', 0]],
      ],
      beats: [{ kind: 'move', tile: 'aki', arc: 'origin', to: 1 }],
      alt: [
        '*Fufulu ho falá ʻaki e vai māfaná.* Wash your mat with warm water. *ʻaki* comes after the object.',
        '*Fufulu ʻaki ho falá e vai māfaná.* Wash your mat with warm water. *ʻaki* sits right after the verb, the more common word order.',
      ],
    },
  ],
}

// The marker tile holds ki or ʻa alone; an article travels on the last tile (he ngāué, e ngāué).
// In the pule scene ki goes unlabelled: at 390 its label ran into INTRANSITIVE, and the
// tokoni scene has just named it.
function transitiveScene(key, tense, pron, verbA, verbB, restA, restB, sayA, enA, sayB, enB, altB) {
  const restMoves = restA !== restB
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verbA, 'verb', 'intransitive'), face(verbB, 'verb', 'transitive')],
      prep: [face('ki', 'quiet', restMoves ? undefined : 'preposition'), face('ʻa', 'focus')],
      rest: restMoves ? [face(restA, 'quiet'), face(restB, 'quiet')] : [face(restA, 'quiet')],
    },
    before: null,
    after: null,
    lines: [{ say: sayA, en: enA }, { say: sayB, en: enB }],
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0], ['prep', 0], ['rest', 0]],
      [['tense', 0], ['pron', 0], ['verb', 1], ['prep', 1], ['rest', restMoves ? 1 : 0]],
    ],
    beats: [{ kind: 'swap', tile: restMoves ? ['verb', 'prep', 'rest'] : ['verb', 'prep'], to: 1 }],
    alt: [`*${sayA}* ${enA} Without *-ʻi*, the verb takes the preposition *ki*.`, `*${sayB}* ${enB} ${altB}`],
  }
}

/** The verb takes -ʻi and, in the same step, ki gives way to a direct object marked by ʻa. */
export const F33_2 = {
  id: '33.2',
  kind: 'row',
  types: ['swap'],
  title: 'Add *-ʻi*, and *ki* gives way to *ʻa*',
  after: { section: 'making-verbs-transitive-the-suffix-i', block: b => b.type === 'p' && b.text.startsWith('Both sentences translate') },
  scenes: [
    transitiveScene('tokoni', 'Naʻá', 'ku', 'tokoni', 'tokoniʻi', 'Seini', 'Seini',
      'Naʻá ku tokoni ki Seini.', 'I helped Seini.', 'Naʻá ku tokoniʻi ʻa Seini.', 'I helped Seini.',
      'With *-ʻi*, *tokoniʻi* takes a direct object marked by *ʻa*.'),
    transitiveScene('pule', 'ʻOkú', 'ne', 'pule', 'puleʻi', 'he ngāué', 'e ngāué',
      'ʻOkú ne pule ki he ngāué.', 'He is in charge of the work.', 'ʻOkú ne puleʻi ʻa e ngāué.', 'He manages the work.',
      'With *-ʻi*, *puleʻi* takes a direct object marked by *ʻa*.'),
  ],
}

function rememberCase(lane, form, rest, say, en) {
  return {
    lane, say, en,
    row: [face('ʻOku', 'tense'), face('ou', 'pronoun'), { slot: true, form: face(form, 'verb'), label: true }, face(rest, 'quiet')],
  }
}

/** Both forms work with Lupe; the choice is about meaning, so nothing is ringed. */
export const F33_3 = {
  id: '33.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Which “remember” do you mean?',
  after: { section: 'connotative-differences-with-and-without-i', block: b => b.type === 'examples' && b.pairs.some(p => /manatu.i/.test(p.tongan)) },
  lanes: [
    { label: 'Suggests emotional remembering', forms: ['manatu'] },
    { label: 'Suggests factual recall', forms: ['manatuʻi'] },
  ],
  scenes: [
    {
      key: 'lupe',
      cases: [
        rememberCase(0, 'manatu', 'kia Lupe', 'ʻOku ou manatu kia Lupe.', 'I remember Lupe. (with feeling, reminiscing)'),
        rememberCase(1, 'manatuʻi', 'ʻa Lupe', 'ʻOku ou manatuʻi ʻa Lupe.', 'I remember Lupe. (I can recall her)'),
      ],
    },
  ],
  alt: [
    '*manatu* without *-ʻi* suggests emotional remembering, and takes *kia* before a name. *ʻOku ou manatu kia Lupe.* I remember Lupe. (with feeling, reminiscing)',
    '*manatuʻi* with *-ʻi* suggests factual recall, and takes a direct object. *ʻOku ou manatuʻi ʻa Lupe.* I remember Lupe. (I can recall her)',
  ],
}

function completionScene(key, tense, pron, verbA, verbB, rest, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verbA, 'verb'), face(verbB, 'verb')],
      rest: [face(rest, 'quiet')],
    },
    before: null,
    after: null,
    lines: [{ say: sayA, en: enA }, { say: sayB, en: enB }],
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0], ['rest', 0]],
      [['tense', 0], ['pron', 0], ['verb', 1], ['rest', 0]],
    ],
    beats: [{ kind: 'swap', tile: 'verb', to: 1 }],
    alt: [`*${sayA}* ${enA}`, `*${sayB}* ${enB} The verb is already transitive, so *-ʻi* emphasizes completion and nothing else in the row changes.`],
  }
}

/** Set against 33.2: the verb is already transitive, so only the verb's own form changes. */
export const F33_4 = {
  id: '33.4',
  kind: 'row',
  types: ['swap'],
  title: 'Already transitive: *-ʻi* emphasizes completion',
  after: { section: 'executive-i-emphasis-on-completion', block: b => b.type === 'p' && b.text.startsWith('With *t') },
  scenes: [
    completionScene('tapuni', 'Naʻá', 'ku', 'tāpuni', 'tāpuniʻi', 'e katō',
      'Naʻá ku tāpuni e katō.', 'I closed the basket.', 'Naʻá ku tāpuniʻi e katō.', 'I closed the basket completely.'),
    completionScene('vahe', 'Naʻá', 'ne', 'vahe', 'vaheʻi', 'ʻa e iká',
      'Naʻá ne vahe ʻa e iká.', 'She divided the fish.', 'Naʻá ne vaheʻi ʻa e iká.', 'She divided up the fish. (into portions, completely)'),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Fufulu', 'verb'), face('ʻaki', 'particle', 'preposition'), face('ho falá', 'quiet', 'object'), face('e vai māfaná', 'quiet', 'instrument')],
  say: 'Fufulu ʻaki ho falá e vai māfaná.',
  en: 'Wash your mat with warm water.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Fufulu ʻaki ho falá e vai māfaná.', en: 'Wash your mat with warm water.' },
  { to: 'Naʻá ku tokoniʻi ʻa Seini.', en: 'I helped Seini.' },
  { to: 'ʻOku mau ngāueʻaki ʻene ʻu falá.', en: 'We are using his mats.' },
]

export const FIGURES = [F33_1, F33_2, F33_3, F33_4]
