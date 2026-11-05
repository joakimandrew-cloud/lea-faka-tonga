// Lesson 51's figures, as data. Every Tongan and English string is copied from
// book/Chapter-51.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The impersonal te and kita, kau, the
// relative pronouns and te and ʻe without future meaning are definitions with examples,
// so they get no figure. The rhetorical dual gets none either: the book prints only the
// ta sentence, never the tau one, so a swap would show a sentence the book does not print.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function possCase(lane, lead, link, form, noun, say, en) {
  return {
    lane, say, en,
    row: [face(lead, 'quiet'), face(link, 'quiet'), { slot: true, form: face(form, 'pronoun'), label: true }, { ...face(noun, 'quiet'), ring: true }],
  }
}

/** The two-class choice for the impersonal possessive, from the book's two sentences. */
export const F51_1 = {
  id: '51.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Which “one’s”? Look at what is owned',
  after: { section: 'impersonal-possessive-forms', block: b => b.type === 'examples' },
  lanes: [
    { label: 'Things one controls', forms: ['ʻete'] },
    { label: 'Things that characterise one', forms: ['hoto'] },
  ],
  scenes: [
    {
      key: 'ete-hoto',
      cases: [
        possCase(0, 'ʻOku totonu ke tauhi', 'ʻe te', 'ʻete', 'ngāué', 'ʻOku totonu ke tauhi ʻe te ʻete ngāué.', "One should take care of one's work."),
        possCase(1, 'ʻOku totonu ke tokanga', 'ki', 'hoto', 'fāmilí', 'ʻOku totonu ke tokanga ki hoto fāmilí.', "One should care for one's family."),
      ],
    },
  ],
  alt: [
    '*ʻete*, ʻe-class, for things you act upon or control: *ʻOku totonu ke tauhi ʻe te ʻete ngāué.* One should take care of one\'s work.',
    '*hoto*, ho-class, for things that belong to you by nature or shelter you: *ʻOku totonu ke tokanga ki hoto fāmilí.* One should care for one\'s family.',
  ],
}

const S = 'speaker'
const L = 'listener'
const T = 'third'

function countCase(lane, marker, form, verb, say, en, group) {
  return {
    lane, say, en, group, ringPerson: 2,
    row: [face(marker, 'tense'), { slot: true, form: face(form, 'pronoun'), label: true }, face(verb, 'verb'), face('mo ia', 'quiet')],
  }
}

/** Dual for singular: the pronoun counts everyone in the situation, him included. */
export const F51_2 = {
  id: '51.2',
  kind: 'fork',
  types: ['fork'],
  title: 'The pronoun counts everyone in the situation',
  after: { section: 'dual-for-singular-idiom', block: b => b.type === 'p' && b.text.startsWith('Even if only two') },
  // Speaker, listener, him (the ia of mo ia), and two others.
  people: [S, L, T, T, T],
  lanes: [
    { label: 'We two (excluding you)', forms: ['ma'] },
    { label: 'You two', forms: ['mo'] },
    { label: 'They, three or more', forms: ['nau'] },
  ],
  scenes: [
    {
      key: 'ma-mo',
      cases: [
        countCase(0, 'Naʻá', 'ma', 'nofo', 'Naʻá ma nofo mo ia.', 'I stayed with him.', [0, 2]),
        countCase(1, 'Té', 'mo', 'nofo', 'Té mo nofo mo ia?', 'Will you stay with him?', [1, 2]),
      ],
    },
    {
      key: 'nau',
      cases: [
        countCase(2, 'Naʻa', 'nau', 'talanoa', 'Naʻa nau talanoa mo ia.', 'They talked with him.', [2, 3, 4]),
      ],
    },
  ],
  alt: [
    '*Naʻá ma nofo mo ia.* I stayed with him. *ma* means "we two (excluding you)": both the speaker and the other person were involved in the staying.',
    '*Té mo nofo mo ia?* Will you stay with him? *mo* means "you two": Tongan sees the situation as involving both people.',
    '*Naʻa nau talanoa mo ia.* They talked with him. Even if only two people were talking with him, *nau* (they, three or more) is used because, including him, there were three people involved.',
  ],
}

/** ne for naʻe: the same sentence, with the shade of "as expected". */
export const F51_3 = {
  id: '51.3',
  kind: 'row',
  types: ['swap'],
  title: '*ne*: past, as expected',
  after: { section: 'ne-vs-naa-nae-a-note-on-nuance', block: b => b.type === 'examples' },
  scenes: [
    {
      key: 'sione',
      tiles: {
        tense: [face('Naʻe', 'tense'), face('Ne', 'tense')],
        verb: [face('ʻalu', 'verb')],
        focus: [face('ʻa', 'focus')],
        noun: [face('Sione', 'noun')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Naʻe ʻalu ʻa Sione.', en: 'Sione went. (Simple past, neutral.)' },
        { say: 'Ne ʻalu ʻa Sione.', en: 'Sione went. (As planned, as expected.)' },
      ],
      states: [
        [['tense', 0], ['verb', 0], ['focus', 0], ['noun', 0]],
        [['tense', 1], ['verb', 0], ['focus', 0], ['noun', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'tense', to: 1 },
      ],
      alt: [
        '*Naʻe ʻalu ʻa Sione.* Sione went. (Simple past, neutral.)',
        '*Ne ʻalu ʻa Sione.* Sione went. (As planned, as expected.)',
        '*ne* also marks the past tense but implies that what happened was "as expected" or "as intended."',
      ],
    },
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOkú', 'tense'), face('te', 'pronoun'), face('mā', 'verb'), face('kita', 'pronoun')],
  say: 'ʻOkú te mā kita.',
  en: 'One is ashamed.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku ʻikai totonu ke te tokanga pē kiate kita.', en: 'One should not attend only to oneself.' },
  { to: 'Kau ʻalu muʻa?', en: 'May I go, please?' },
  { to: 'Ke ta feinga ke fai ʻa e ngāué.', en: 'That we strive to do the work.' },
]

export const FIGURES = [F51_1, F51_2, F51_3]
