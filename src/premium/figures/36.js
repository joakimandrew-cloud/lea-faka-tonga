// Lesson 36's figures, as data. Every Tongan and English string is copied from
// book/Chapter-36.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note naʻá ne, naʻá ku but naʻa nau.
// The Sēmisi row of the book's first table is left out of 36.1: its object also changes,
// e mā to ʻa e mā, a change the section does not teach. The contrastive ia in the Note,
// the ki ai sentence, Words to Learn and Exercises have no figure: nothing there is a change
// or a choice the reader has to reconstruct.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function transitiveScene(key, tenseA, verb, subjA, subjB, obj, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      tense: [face(tenseA, 'tense'), face('naʻá', 'tense')],
      verb: [face(verb, 'verb')],
      subj: [face(subjA, 'noun'), face(subjB, 'noun')],
      pron: [face('ne', 'pronoun')],
      obj: [face(obj, 'quiet')],
    },
    before: { say: sayA, en: enA },
    after: { say: sayB, en: enB },
    states: [
      [['tense', 0], ['verb', 0], ['subj', 0], ['obj', 0]],
      [['subj', 1], ['tense', 0], ['verb', 0], ['obj', 0]],
      [['subj', 1], ['tense', 1], ['pron', 0], ['verb', 0], ['obj', 0]],
    ],
    beats: [
      { kind: 'move', tile: 'subj', arc: 'origin', to: 1 },
      { kind: 'add', tile: 'pron', to: 2, roll: 'tense' },
      { kind: 'en' },
    ],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      'The subject moves to the front with *ko*.',
      'A pronoun appears after the tense marker to represent the displaced subject.',
    ],
  }
}

/** The section's first change: subject to the front with ko, then the pronoun that stands in for it. */
export const F36_1 = {
  id: '36.1',
  kind: 'row',
  types: ['move', 'add'],
  title: 'The subject moves to the front with *ko*',
  // After "Both sentences describe the same event", which is the point of the pair.
  after: { section: 'moving-the-subject-to-the-front-transitive-verbs', block: b => b.type === 'p' && b.text.startsWith('Both sentences') },
  scenes: [
    transitiveScene('tevita', 'Naʻe', 'kai', 'ʻe Tēvita', 'Ko Tēvita', 'e foʻi niú',
      'Naʻe kai ʻe Tēvita e foʻi niú.', 'Tēvita ate the coconut.', 'Ko Tēvita naʻá ne kai e foʻi niú.', 'It was Tēvita who ate the coconut.'),
    transitiveScene('ana', 'Naʻe', 'ʻave', 'ʻe ʻAna', 'Ko ʻAna', 'ʻa e falá',
      'Naʻe ʻave ʻe ʻAna ʻa e falá.', 'ʻAna carried the mat.', 'Ko ʻAna naʻá ne ʻave ʻa e falá.', 'It was ʻAna who carried the mat.'),
  ],
}

function matchCase(lane, subj, tense, form, verb, obj, say, en) {
  return {
    lane, say, en,
    row: [
      { ...subj, ring: true },
      face(tense, 'tense'),
      { slot: true, form: face(form, 'pronoun'), label: true },
      face(verb, 'verb'),
      face(obj, 'quiet'),
    ],
  }
}

/** "The pronoun must match the subject": the subject after ko picks the pronoun. */
export const F36_2 = {
  id: '36.2',
  kind: 'fork',
  types: ['fork'],
  title: 'The pronoun must match the subject',
  after: { section: 'moving-the-subject-to-the-front-transitive-verbs', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('Ko kinautolu')) },
  lanes: [
    { label: 'Subject *Mele*', forms: ['ne'] },
    { label: 'Subject *au*', forms: ['ku'] },
    { label: 'Subject *kinautolu*', forms: ['nau'] },
  ],
  scenes: [
    {
      key: 'ne-ku',
      cases: [
        matchCase(0, face('Ko Mele', 'noun', 'subject'), 'naʻá', 'ne', 'fufulu', 'ʻa e valá', 'Ko Mele naʻá ne fufulu ʻa e valá.', 'It was Mele who washed the clothes.'),
        matchCase(1, face('Ko au', 'pronoun', 'subject'), 'naʻá', 'ku', 'ʻave', 'ʻa e kató', 'Ko au naʻá ku ʻave ʻa e kató.', 'It was I who carried the basket.'),
      ],
    },
    {
      key: 'nau',
      cases: [
        matchCase(2, face('Ko kinautolu', 'pronoun', 'subject'), 'naʻa', 'nau', 'tohi', 'ʻa e tohí', 'Ko kinautolu naʻa nau tohi ʻa e tohí.', 'It was they who wrote the letter.'),
      ],
    },
  ],
  alt: [
    'The pronoun must match the subject.',
    '*Ko Mele naʻá ne fufulu ʻa e valá.* It was Mele who washed the clothes.',
    '*Ko au naʻá ku ʻave ʻa e kató.* It was I who carried the basket.',
    '*Ko kinautolu naʻa nau tohi ʻa e tohí.* It was they who wrote the letter.',
  ],
}

function intransitiveScene(key, tenseA, tenseB, verb, subjA, subjB, rest, sayA, enA, sayB, enB) {
  const tiles = {
    tense: [face(tenseA, 'tense'), face(tenseB, 'tense')],
    verb: [face(verb, 'verb')],
    subj: [face(subjA, 'noun'), face(subjB, 'noun')],
  }
  if (rest) tiles.rest = [face(rest, 'place')]
  const tail = rest ? [['rest', 0]] : []
  return {
    key,
    tiles,
    before: { say: sayA, en: enA },
    after: { say: sayB, en: enB },
    states: [
      [['tense', 0], ['verb', 0], ['subj', 0], ...tail],
      [['subj', 1], ['tense', 1], ['verb', 0], ...tail],
    ],
    beats: [
      { kind: 'move', tile: 'subj', arc: 'origin', to: 1, roll: 'tense' },
      { kind: 'en' },
    ],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      'No pronoun is needed to repeat the subject. The tense marker connects directly to the verb.',
    ],
  }
}

/** The same move as 36.1, and no pronoun arrives: the tense marker stays against the verb. */
export const F36_3 = {
  id: '36.3',
  kind: 'row',
  types: ['move'],
  title: 'Intransitive verb: no pronoun needed',
  after: { section: 'moving-the-subject-to-the-front-intransitive-verbs', block: b => b.type === 'table' },
  scenes: [
    intransitiveScene('tamasii', 'Naʻe', 'naʻe', 'tangi', 'ʻa e kiʻi tamasiʻi', 'Ko e kiʻi tamasiʻi', null,
      'Naʻe tangi ʻa e kiʻi tamasiʻi.', 'The little boy cried.', 'Ko e kiʻi tamasiʻi naʻe tangi.', 'It was the little boy who cried.'),
    intransitiveScene('pita', 'ʻOku', 'ʻoku', 'ngāue', 'ʻa Pita', 'Ko Pita', 'heni',
      'ʻOku ngāue ʻa Pita heni.', 'Pita works here.', 'Ko Pita ʻoku ngāue heni.', 'It is Pita who works here.'),
  ],
}

/** ia and foki land in one place, right after the subject. Only the ia sentence has a plain form in the book. */
export const F36_4 = {
  id: '36.4',
  kind: 'row',
  types: ['add'],
  title: '*ia* and *foki* come after the subject',
  after: { section: 'adding-emphasis-with-ia-and-foki', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('foki')) },
  scenes: [
    {
      key: 'ia',
      tiles: {
        subj: [face('Ko e kiʻi tamasiʻi', 'noun')],
        ia: [face('ia', 'pronoun')],
        tense: [face('naʻe', 'tense')],
        verb: [face('tangi', 'verb')],
      },
      before: { say: 'Ko e kiʻi tamasiʻi naʻe tangi.', en: 'It was the little boy who cried.' },
      after: { say: 'Ko e kiʻi tamasiʻi ia naʻe tangi.', en: 'He was the little boy who cried.' },
      states: [
        [['subj', 0], ['tense', 0], ['verb', 0]],
        [['subj', 0], ['ia', 0], ['tense', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'ia', to: 1 }, { kind: 'en' }],
      alt: [
        '*Ko e kiʻi tamasiʻi naʻe tangi.* It was the little boy who cried. becomes *Ko e kiʻi tamasiʻi ia naʻe tangi.* He was the little boy who cried.',
        'The pronoun *ia* placed after the subject reinforces the identity of the person being highlighted.',
      ],
    },
    {
      key: 'foki',
      tiles: {
        subj: [face('Ko e tangata', 'noun')],
        foki: [face('foki', 'quiet', 'also')],
        tense: [face('naʻe', 'tense')],
        verb: [face('lea', 'verb')],
      },
      before: null,
      after: { say: 'Ko e tangata foki naʻe lea.', en: 'He was also the man who spoke.' },
      states: [
        [['subj', 0], ['tense', 0], ['verb', 0]],
        [['subj', 0], ['foki', 0], ['tense', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'foki', to: 1 }, { kind: 'en' }],
      alt: [
        '*Ko e tangata foki naʻe lea.* He was also the man who spoke.',
        'The word *foki* (also) placed after the subject contributes a similar emphatic effect.',
      ],
    },
  ],
}

/** The frame holds still and the clause inside it changes; ai stays right after the verb. */
export const F36_5 = {
  id: '36.5',
  kind: 'row',
  types: ['swap'],
  title: '*Ko e meʻa ia* and *ai* hold, the clause between them changes',
  after: { section: 'thats-why-with-ko-e-mea-ia-ai', block: b => b.type === 'p' && b.text.startsWith('The word') },
  chips: [
    { state: 0, to: 'loto mamahi', en: 'upset' },
    { state: 1, to: 'haʻu', en: 'came' },
    { state: 2, to: 'ngāue', en: 'works' },
  ],
  scenes: [
    {
      key: 'ai',
      tiles: {
        ko: [face('Ko e meʻa ia', 'quiet')],
        tp: [face('ʻoku ou', 'quiet'), face('naʻá ku', 'quiet'), face('ʻokú ne', 'quiet')],
        verb: [face('loto mamahi', 'verb'), face('haʻu', 'verb'), face('ngāue', 'verb')],
        ai: [face('ai', 'particle', 'refers back')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ko e meʻa ia ʻoku ou loto mamahi ai.', en: "That's why I am upset." },
        { say: 'Ko e meʻa ia naʻá ku haʻu ai.', en: "That's the reason I came." },
        { say: 'Ko e meʻa ia ʻokú ne ngāue ai.', en: "That's why he works." },
      ],
      states: [
        [['ko', 0], ['tp', 0], ['verb', 0], ['ai', 0]],
        [['ko', 0], ['tp', 1], ['verb', 1], ['ai', 0]],
        [['ko', 0], ['tp', 2], ['verb', 2], ['ai', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'tp', roll: 'verb', to: 1 },
        { kind: 'swap', tile: 'tp', roll: 'verb', to: 2 },
      ],
      alt: [
        '*Ko e meʻa ia* combined with *ai* after the verb expresses "that\'s why" or "that\'s the reason".',
        "*Ko e meʻa ia ʻoku ou loto mamahi ai.* That's why I am upset.",
        "*Ko e meʻa ia naʻá ku haʻu ai.* That's the reason I came.",
        "*Ko e meʻa ia ʻokú ne ngāue ai.* That's why he works.",
      ],
    },
  ],
}

function reverseScene(key, predA, predB, subjA, subjB, subjRole, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      pred: [face(predA, 'quiet', 'predicate'), face(predB, 'quiet', 'predicate')],
      subj: [face(subjA, subjRole, 'subject'), face(subjB, subjRole, 'subject')],
    },
    before: { say: sayA, en: enA },
    after: { say: sayB, en: enB },
    states: [
      [['pred', 0], ['subj', 0]],
      [['subj', 1], ['pred', 1]],
    ],
    beats: [
      { kind: 'move', tile: 'subj', arc: 'origin', to: 1, roll: 'pred' },
      { kind: 'en' },
    ],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      'To emphasize the subject, reverse the order and introduce the predicate with a second *ko*.',
    ],
  }
}

/** The order reverses and a second ko appears: read across the book's table. */
export const F36_6 = {
  id: '36.6',
  kind: 'row',
  types: ['move'],
  title: 'The order reverses, with a second *ko*',
  after: { section: 'emphatic-equational-sentences', block: b => b.type === 'table' },
  scenes: [
    reverseScene('pita', 'Ko e tangata mālohi', 'ko e tangata mālohi', 'ʻa Pita', 'Ko Pita', 'noun',
      'Ko e tangata mālohi ʻa Pita.', 'Pita is a strong man.', 'Ko Pita ko e tangata mālohi.', 'Pita (and no one else) is a strong man.'),
    reverseScene('au', 'Ko e faiako', 'ko e faiako', 'au', 'Ko au', 'pronoun',
      'Ko e faiako au.', 'I am a teacher.', 'Ko au ko e faiako.', 'I (specifically) am a teacher.'),
  ],
}

function emptyScene(key, head, tense, pron, verb, say, en) {
  return {
    key,
    tiles: {
      head: [face(head, 'quiet')],
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verb, 'verb')],
    },
    before: null,
    after: { say, en },
    // A GHOST and not the SLOT tile: the engine prints "no subject" on SLOT, and this slot is the object's.
    states: [[['head', 0], ['tense', 0], ['pron', 0], ['verb', 0], ['GHOST']]],
    beats: [{ kind: 'en' }],
    alt: [`*${say}* ${en} The slot where the object would normally go stays empty. The definitive accent on *${verb}* marks where the description ends.`],
  }
}

/** The slot after the verb stays empty, and nothing in the Tongan answers to whom or that. */
export const F36_7 = {
  id: '36.7',
  kind: 'row',
  types: ['add'],
  title: 'The object slot stays empty',
  after: { section: 'leaving-out-whom-which-and-that', block: b => b.type === 'p' && b.text.startsWith('The English sentence') },
  scenes: [
    emptyScene('fefine', 'Ko e fefine eni', 'naʻá', 'ku', 'ʻiló', 'Ko e fefine eni naʻá ku ʻiló.', 'This is the woman whom I found.'),
    emptyScene('tohi', 'Ko e tohi eni', 'naʻa', 'nau', 'laú', 'Ko e tohi eni naʻa nau laú.', 'This is the book that they read.'),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Ko Tēvita', 'noun'), face('naʻá', 'tense'), face('ne', 'pronoun'), face('kai', 'verb'), face('e foʻi niú', 'quiet')],
  say: 'Ko Tēvita naʻá ne kai e foʻi niú.',
  en: 'It was Tēvita who ate the coconut.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Ko Sēmisi naʻá ne kai ʻa e mā.', en: 'It was Sēmisi who ate the bread.' },
  { to: 'Ko e fānau naʻe hiva.', en: 'It was the children who sang.' },
  { to: 'Ko e meʻa ia naʻá ku haʻu ai.', en: "That's the reason I came." },
]

export const FIGURES = [F36_1, F36_2, F36_3, F36_4, F36_5, F36_6, F36_7]
