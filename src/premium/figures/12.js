// Lesson 12's figures, as data. Every Tongan and English string is copied from
// book/Chapter-12.md at origin/main, as the site renders it (straight ' to U+02BB).
// The labels "noun" and "demonstrative" are the book's: ko e + noun (+ demonstrative).
// The noun after ko e is not the subject, so it is quiet, labelled "noun" (ruling R1; the green
// noun tile means a noun subject). The subject ia in 12.4 stays pronoun.
// No figure for the Summary table, the two Notes (ko fē and the definitive accent are
// covered formally in later lessons), New Vocabulary, Words to Learn or Exercises.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const noun = text => face(text, 'quiet', 'noun')
const demonstrative = text => face(text, 'quiet', 'demonstrative')

/** The basic pattern: ko e holds still while the noun, then the demonstrative, turns over. */
export const F12_1 = {
  id: '12.1',
  kind: 'row',
  types: ['swap'],
  title: 'Change the noun, then the demonstrative',
  after: { section: 'what-ko-does', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('Ko e fala')) },
  scenes: [
    {
      key: 'fala-hele',
      tiles: {
        ko: [face('Ko e', 'quiet')],
        noun: [noun('fala'), noun('hele')],
        dem: [demonstrative('ʻeni'), demonstrative('ē')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ko e fala ʻeni.', en: 'This is a mat.' },
        { say: 'Ko e hele ʻeni.', en: 'This is a knife.' },
        { say: 'Ko e hele ē.', en: 'That is a knife.' },
      ],
      states: [
        [['ko', 0], ['noun', 0], ['dem', 0]],
        [['ko', 0], ['noun', 1], ['dem', 0]],
        [['ko', 0], ['noun', 1], ['dem', 1]],
      ],
      beats: [
        { kind: 'swap', tile: 'noun', to: 1 },
        { kind: 'swap', tile: 'dem', to: 2 },
      ],
      alt: [
        'The basic pattern is: *ko e* + noun (+ demonstrative).',
        '*Ko e fala ʻeni.* This is a mat.',
        'The noun changes: *Ko e hele ʻeni.* This is a knife.',
        'The demonstrative changes: *Ko e hele ē.* That is a knife.',
      ],
    },
  ],
}

function pointCase(lane, form, say, en, who) {
  return {
    lane, say, en,
    // Near or far is distance (Ch 12 lines 37 and 38): the ring on the person alone, no group frame (R7).
    group: [],
    ...(who == null ? {} : { ringPerson: who }),
    // The book's own name for the ko phrase (Summary table): not the bare demonstrative of 12.1 and 12.4.
    row: [{ slot: true, form: face(form, 'quiet', 'short demonstrative'), label: 'short demonstrative' }],
  }
}

/** The three-way system: where the thing is picks the form. A question about meaning, so no ring on a word.
 *  Placed before the daily-speech paragraph, so the book widens ē right after the picture. */
export const F12_2 = {
  id: '12.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Where is the thing you point at?',
  after: { section: 'pointing-and-identifying-koeni-ko-e-koena', block: b => b.type === 'examples' && b.pairs.some(p => /Koʻena|Ko'ena/.test(p.tongan)) },
  people: ['speaker', 'listener'],
  lanes: [
    { label: 'Near me', forms: ['Koʻeni'] },
    { label: 'Near you', forms: ['Koʻena'] },
    { label: 'Over there, or general pointing', forms: ['Ko ē'] },
  ],
  scenes: [
    {
      key: 'near',
      cases: [
        pointCase(0, 'Koʻeni', 'Koʻeni.', 'Here it is.', 0),
        pointCase(1, 'Koʻena', 'Koʻena.', 'There it is (near you).', 1),
      ],
    },
    {
      key: 'there',
      cases: [
        pointCase(2, 'Ko ē', 'Ko ē!', 'There it is!', null),
      ],
    },
  ],
  alt: [
    'Near me: *Koʻeni.* Here it is.',
    'Near you: *Koʻena.* There it is (near you).',
    'Over there, or general pointing: *Ko ē!* There it is!',
  ],
}

function answerScene(key, form, dem, ask, askEn, answer, answerEn) {
  return {
    key,
    tiles: {
      ko: [face('Ko e', 'quiet')],
      what: [face('hā', 'question'), noun(form)],
      // No label: "question word" and "demonstrative" collide at 390.
      dem: [face(dem, 'quiet')],
    },
    before: null,
    after: null,
    lines: [
      { say: ask, en: askEn },
      { say: answer, en: answerEn },
    ],
    states: [
      [['ko', 0], ['what', 0], ['dem', 0]],
      [['ko', 0], ['what', 1]],
    ],
    beats: [{ kind: 'swap', tile: 'what', to: 1 }],
    alt: [`*${ask}* ${askEn} The answer uses the same *ko* pattern: *${answer}* ${answerEn}`],
  }
}

/** The answer uses the same ko pattern: the noun takes the place of hā. */
export const F12_3 = {
  id: '12.3',
  kind: 'row',
  types: ['swap'],
  title: 'The answer uses the same *ko* pattern',
  after: { section: 'asking-what-is-that-ko-e-ha-e', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('Ko e vaka')) },
  scenes: [
    answerScene('kato', 'kato', 'ʻeni', 'Ko e hā ʻeni?', 'What is this?', 'Ko e kato.', "It's a basket."),
    answerScene('vaka', 'vaka', 'ē', 'Ko e hā ē?', 'What is that?', 'Ko e vaka.', "It's a boat."),
  ],
}

function negativeScene(key, form, endTile, say, en, sayNot, enNot) {
  return {
    key,
    tiles: {
      tense: [face('ʻOku', 'tense')],
      neg: [face('ʻikai', 'quiet', 'negation')],
      ko: [face('Ko e', 'quiet'), face('ko e', 'quiet')],
      noun: [noun(form)],
      end: [endTile],
    },
    before: null,
    after: null,
    lines: [
      { say, en },
      { say: sayNot, en: enNot },
    ],
    states: [
      [['ko', 0], ['noun', 0], ['end', 0]],
      [['tense', 0], ['neg', 0], ['ko', 1], ['noun', 0], ['end', 0]],
    ],
    beats: [{ kind: 'add', tile: ['tense', 'neg'], roll: 'ko', to: 1 }],
    alt: [`*${say}* ${en}`, `The *ʻoku ʻikai* is placed immediately before the *ko*: *${sayNot}* ${enNot}`],
  }
}

/** The negation pattern: ʻoku ʻikai arrives immediately before ko, and brings a tense marker the positive sentence does not have. */
export const F12_4 = {
  id: '12.4',
  kind: 'row',
  types: ['add'],
  title: '*ʻOku ʻikai* goes immediately before *ko*',
  after: { section: 'negating-ko-sentences-oku-ikai-ko-e', block: b => b.type === 'p' && b.text.startsWith('The negation pattern is') },
  scenes: [
    negativeScene('hele', 'hele', demonstrative('ʻeni'), 'Ko e hele ʻeni.', 'This is a knife.', 'ʻOku ʻikai ko e hele ʻeni.', 'This is not a knife.'),
    negativeScene('faiako', 'faiako', face('ia', 'pronoun'), 'Ko e faiako ia.', 'He/she is a teacher', 'ʻOku ʻikai ko e faiako ia.', 'He/she is not a teacher.'),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Ko e', 'quiet'), noun('hele'), demonstrative('ʻeni')],
  say: 'Ko e hele ʻeni.',
  en: 'This is a knife.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Ko e fala ʻeni.', en: 'This is a mat.' },
  { to: 'Ko e hā ē?', en: 'What is that?' },
  { to: 'ʻOku ʻikai ko e hele ʻeni.', en: 'This is not a knife.' },
]

export const FIGURES = [F12_1, F12_2, F12_3, F12_4]
