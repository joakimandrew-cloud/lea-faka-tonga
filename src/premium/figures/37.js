// Lesson 37's figures, as data. Every Tongan and English string is copied from
// book/Chapter-37.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents kept. Note soté, paʻangá and tohí before the postposed form.
// No figure for the two forms' tables (singular, dual and plural): they already show the
// paradigm and how it is built. None for Words to Learn or Exercises.
// 37.2 pairs hele with ʻaʻau and fale with ʻoʻoku because Exercise 5 asks kato (mine),
// fale (hers) and hele (theirs): each sentence is printed in the reading, and no pairing
// here prints an exercise's answer.
// R1 (Step 11): no noun here is a subject (each follows Ko e, or stands in a bare noun
// phrase), so every noun tile is quiet "noun". ʻa e kató / ʻa e falé in 37.4 are the subject
// but a grouped phrase, so they stay a quiet group.
// D (Step 11 second look): ia meaning "that" is pronoun in 37.1, 37.2 and the opening,
// as in 39.2 and 12.4 (Ch 39 line 84, Ch 12 line 107); eni stays quiet (Ch 12's demonstrative).
// Recall: chapters.json gives "Ko e vaka eni ʻa hai?" for the third key rule, which is not
// in the book (it prints ʻo hai for vaka), so the card uses the book's hele sentence.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function classCase(lane, noun, dem, form, say, en) {
  return {
    lane, say, en,
    row: [
      face('Ko e', 'quiet'),
      { ...face(noun, 'quiet', 'noun'), ring: true, label: 'noun' },
      face(dem, 'pronoun', 'pronoun'),
      { slot: true, form: face(form, 'pronoun', 'postposed'), label: 'postposed' },
    ],
  }
}

/** The Note's rule, as a choice: your relationship to the thing picks the class. */
export const F37_1 = {
  id: '37.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Which class? Your relationship to the thing',
  // After the Note that states the rule, at the end of the ho-class section.
  after: { section: 'postposed-possessives-ho-class', block: b => b.type === 'note' },
  lanes: [
    { label: 'Things you control or act upon', forms: ['ʻaʻaku', 'ʻaʻau'] },
    { label: 'Things that shelter or define you', forms: ['ʻoʻoku', 'ʻoʻou'] },
  ],
  scenes: [
    {
      key: 'mine',
      cases: [
        classCase(0, 'kato', 'ia', 'ʻaʻaku', 'Ko e kato ia ʻaʻaku.', 'That basket is mine.'),
        classCase(1, 'fale', 'ia', 'ʻoʻoku', 'Ko e fale ia ʻoʻoku.', 'That house is mine.'),
      ],
    },
    {
      key: 'yours',
      cases: [
        classCase(0, 'hele', 'ia', 'ʻaʻau', 'Ko e hele ia ʻaʻau.', 'That knife is yours.'),
        classCase(1, 'vala', 'ia', 'ʻoʻou', 'Ko e vala ia ʻoʻou.', 'Those clothes are yours.'),
      ],
    },
  ],
  alt: [
    'Things you control or act upon take the ʻe-class: *ʻaʻaku*, *ʻaʻau*. *Ko e kato ia ʻaʻaku.* That basket is mine. *Ko e hele ia ʻaʻau.* That knife is yours.',
    'Things that shelter or define you take the ho-class: *ʻoʻoku*, *ʻoʻou*. *Ko e fale ia ʻoʻoku.* That house is mine. *Ko e vala ia ʻoʻou.* Those clothes are yours.',
  ],
}

function whoseScene(key, cls, noun, question, answer, sayQ, enQ, sayA, enA) {
  return {
    key,
    tiles: {
      ko: [face('Ko e', 'quiet')],
      noun: [face(noun, 'quiet', 'noun')],
      dem: [face('eni', 'quiet'), face('ia', 'pronoun', 'pronoun')],
      poss: [face(question, 'question', cls), face(answer, 'pronoun', cls)],
    },
    before: { say: sayQ, en: enQ },
    after: { say: sayA, en: enA },
    states: [
      [['ko', 0], ['noun', 0], ['dem', 0], ['poss', 0]],
      [['ko', 0], ['noun', 0], ['dem', 1], ['poss', 1]],
    ],
    beats: [{ kind: 'swap', tile: ['dem', 'poss'], to: 1 }, { kind: 'en' }],
    alt: [
      `*${sayQ}* ${enQ}`,
      `*${sayA}* ${enA} The noun is ${cls}, in the question and in the answer.`,
    ],
  }
}

/** Question in one section, answer in another: the answer keeps the question's class. */
export const F37_2 = {
  id: '37.2',
  kind: 'row',
  types: ['swap'],
  title: 'The answer keeps the question\'s class',
  after: { section: 'asking-whose-a-hai-and-o-hai', block: b => b.type === 'table' },
  scenes: [
    whoseScene('hele', 'ʻe-class', 'hele', 'ʻa hai', 'ʻaʻau',
      'Ko e hele eni ʻa hai?', 'Whose knife is this?', 'Ko e hele ia ʻaʻau.', 'That knife is yours.'),
    whoseScene('fale', 'ho-class', 'fale', 'ʻo hai', 'ʻoʻoku',
      'Ko e fale eni ʻo hai?', 'Whose house is this?', 'Ko e fale ia ʻoʻoku.', 'That house is mine.'),
  ],
}

function emphasisScene(key, pre, noun, post, before, say, en) {
  return {
    key,
    tiles: {
      pre: [face(pre, 'pronoun', 'preposed')],
      noun: [face(noun, 'quiet', 'noun')],
      post: [face(post, 'pronoun', 'postposed')],
    },
    before,
    after: { say, en },
    states: [
      [['pre', 0], ['noun', 0]],
      [['pre', 0], ['noun', 0], ['post', 0]],
    ],
    beats: [{ kind: 'add', tile: 'post', to: 1 }, { kind: 'en' }],
    alt: [`*${say}* ${en}`, 'A noun can carry both a preposed and a postposed possessive at the same time.'],
  }
}

/** The book's pair: a second possessive arrives after the noun. */
export const F37_3 = {
  id: '37.3',
  kind: 'row',
  types: ['add'],
  title: 'A second possessive, after the noun, stresses the owner',
  after: { section: 'adding-emphasis-to-a-possessor', block: b => b.type === 'p' && b.text.startsWith('A noun can carry both') },
  scenes: [
    emphasisScene('hono', 'Hono', 'soté', 'ʻona', { say: 'Hono soté.', en: 'His shirt.' }, 'Hono soté ʻona.', 'HIS shirt (not anyone else\'s).'),
    emphasisScene('eku', 'ʻEku', 'paʻangá', 'ʻaku', null, 'ʻEku paʻangá ʻaku.', 'MY money (emphasizing that it is mine).'),
    emphasisScene('hoo', 'Hoʻo', 'tohí', 'ʻau', null, 'Hoʻo tohí ʻau.', 'YOUR book (emphasizing that it is yours).'),
  ],
}

function verbCase(lane, form, rest, say, en) {
  return {
    lane, say, en,
    row: [
      face('ʻOku', 'tense'),
      { slot: true, form: face(form, 'verb'), label: 'verb' },
      face(rest, 'quiet'),
    ],
  }
}

/** The possessive in the verb's place, and the class still chosen by what is owned. */
export const F37_4 = {
  id: '37.4',
  kind: 'fork',
  types: ['fork'],
  title: 'With a tense marker, the possessive acts as the verb',
  // After the kató and falé pair, the sentences its second scene shows.
  after: { section: 'standing-in-as-the-verb-this-is-his', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('kató')) },
  lanes: [
    { label: 'Something the person controls', forms: ['ʻaʻana', 'ʻaʻaku'] },
    { label: 'Something that characterizes them', forms: ['ʻoʻona', 'ʻoʻoku'] },
  ],
  scenes: [
    {
      key: 'his',
      cases: [
        verbCase(0, 'ʻaʻana', 'eni', 'ʻOku ʻaʻana eni.', 'This is his.'),
        verbCase(1, 'ʻoʻona', 'eni', 'ʻOku ʻoʻona eni.', 'This is his. (ho-class)'),
      ],
    },
    {
      key: 'mine',
      cases: [
        verbCase(0, 'ʻaʻaku', 'ʻa e kató', 'ʻOku ʻaʻaku ʻa e kató.', 'The basket is mine.'),
        verbCase(1, 'ʻoʻoku', 'ʻa e falé', 'ʻOku ʻoʻoku ʻa e falé.', 'The house is mine.'),
      ],
    },
  ],
  alt: [
    'The postposed possessive takes a tense marker and acts as the verb of the sentence.',
    'Something the person controls: *ʻOku ʻaʻana eni.* This is his. *ʻOku ʻaʻaku ʻa e kató.* The basket is mine.',
    'Something that characterizes them: *ʻOku ʻoʻona eni.* This is his. (ho-class) *ʻOku ʻoʻoku ʻa e falé.* The house is mine.',
  ],
}

/** The opening row in the hero: a still. */
export const OPENING = {
  row: [face('Ko e', 'quiet'), face('kato', 'quiet', 'noun'), face('ia', 'pronoun', 'pronoun'), face('ʻaʻaku', 'pronoun', 'postposed')],
  say: 'Ko e kato ia ʻaʻaku.',
  en: 'That basket is mine.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Ko e kato ia ʻaʻaku.', en: 'That basket is mine.' },
  { to: 'Ko e fale ia ʻoʻoku.', en: 'That house is mine.' },
  { to: 'Ko e hele eni ʻa hai?', en: 'Whose knife is this?' },
]

export const FIGURES = [F37_1, F37_2, F37_3, F37_4]
