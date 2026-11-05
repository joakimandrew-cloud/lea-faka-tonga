// Lesson 45's figures, as data. Every Tongan and English string is copied from
// book/Chapter-45.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note heʻene as one contracted form, and
// valá, tohí with the accent at the end of the group.
// No figure for impersonal verbal nouns (the book prints no starting sentence),
// temporal clauses (one example each), the Ko + possessive section and its ʻene and
// hono note (definitions with examples), the possessive table (it shows the point),
// Words to Learn or Exercises.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The book's non-contracting pair: the tense marker goes, ʻi he comes, the verb
 * becomes a verbal noun, and mau becomes the possessive ʻemau, a separate word. */
export const F45_1 = {
  id: '45.1',
  kind: 'row',
  types: ['drop', 'add', 'swap'],
  title: 'The pronoun subject becomes a possessive',
  after: { section: 'pronoun-subjects-become-possessives', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('falé')) },
  scenes: [
    {
      key: 'ta',
      tiles: {
        tense: [face('Naʻa', 'tense')],
        ihe: [face('ʻI he', 'quiet')],
        pron: [face('mau', 'pronoun', 'pronoun'), face('ʻemau', 'pronoun', 'possessive')],
        verb: [face('tā', 'verb'), face('tā', 'verb', 'verbal noun')],
        obj: [face('ʻa e falé', 'quiet', 'object')],
      },
      before: { say: 'Naʻa mau tā ʻa e falé.', en: 'We built the house.' },
      after: { say: 'ʻI he ʻemau tā ʻa e falé', en: 'When we built the house' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['obj', 0]],
        [['GHOST'], ['pron', 0], ['verb', 0], ['obj', 0]],
        [['ihe', 0], ['pron', 0], ['verb', 0], ['obj', 0]],
        [['ihe', 0], ['pron', 0], ['verb', 1], ['obj', 0]],
        [['ihe', 0], ['pron', 1], ['verb', 1], ['obj', 0]],
      ],
      beats: [
        { kind: 'drop', tile: 'tense', to: 1, old: true },
        { kind: 'add', tile: 'ihe', to: 2 },
        { kind: 'swap', tile: 'verb', to: 3 },
        { kind: 'swap', tile: 'pron', to: 4 },
        { kind: 'en' },
      ],
      alt: [
        '*Naʻa mau tā ʻa e falé.* We built the house. becomes *ʻI he ʻemau tā ʻa e falé*, when we built the house.',
        'When a verb turns into a verbal noun, this kind of pronoun subject moves in front of it as a possessive. The pattern *ʻi he* + possessive + verbal noun creates a clause meaning "when" or "because."',
        'After *ʻi he*, the possessives *ʻeku* and *ʻene* contract into single forms: *heʻeku*, *heʻene*. The possessives *hoʻo* and *ʻenau* do not contract and remain separate words.',
      ],
    },
  ],
}

function nounScene(key, verb, markText, name, rest, restRole, restLabel, lines) {
  return {
    key,
    tiles: {
      tense: [face('Naʻe', 'tense'), face('ʻI he', 'quiet')],
      verb: [face(verb, 'verb'), face(verb, 'verb', 'verbal noun')],
      mark: [{ text: markText, role: 'quiet', label: '' }],
      name: [face(name, 'noun', 'subject')],
      rest: [face(rest, restRole, restLabel)],
    },
    before: null,
    after: null,
    lines,
    states: [
      [['tense', 0], ['verb', 0], ['mark', 0], ['name', 0], ['rest', 0]],
      [['tense', 1], ['verb', 1], ['mark', 0], ['name', 0], ['rest', 0]],
    ],
    beats: [{ kind: 'swap', tile: 'tense', to: 1 }],
    alt: [
      `*${lines[0].say}* ${lines[0].en} becomes *${lines[1].say}*. ${lines[1].en}.`,
      'The postposed subject passes unchanged into the verbal noun construction.',
    ],
  }
}

/** The book's two pairs: only the opening changes; the subject after the verb holds still. */
export const F45_2 = {
  id: '45.2',
  kind: 'row',
  types: ['swap'],
  title: 'A postposed noun subject passes through unchanged',
  after: { section: 'noun-subjects-stay-the-same', block: b => b.type === 'p' && b.text.startsWith('In both cases') },
  scenes: [
    nounScene('ana', 'fufulu', 'ʻe', 'ʻAna', 'ʻa e valá', 'quiet', 'object', [
      { say: 'Naʻe fufulu ʻe ʻAna ʻa e valá.', en: 'ʻAna washed the clothes.' },
      { say: 'ʻI he fufulu ʻe ʻAna ʻa e valá', en: 'When ʻAna washed the clothes' },
    ]),
    nounScene('semisi', 'ʻalu', 'ʻa', 'Sēmisi', 'ki Fisi', 'place', '', [
      { say: 'Naʻe ʻalu ʻa Sēmisi ki Fisi.', en: 'Sēmisi went to Fiji.' },
      { say: 'ʻI he ʻalu ʻa Sēmisi ki Fisi', en: 'When Sēmisi went to Fiji' },
    ]),
  ],
}

/** The book's three ways an object behaves, one example each. */
export const F45_3 = {
  id: '45.3',
  kind: 'fork',
  types: ['fork'],
  title: 'What happens to the object?',
  after: { section: 'what-happens-to-objects', block: b => b.type === 'p' && b.text.startsWith('When the object is a pronoun') },
  lanes: [
    { label: 'Possessive subject in front', forms: ['ʻa e'] },
    { label: 'Postposed or no subject: can switch', forms: ['ʻo e'] },
    { label: 'Pronoun, postposed or no subject', forms: ['hoku'] },
  ],
  scenes: [
    {
      key: 'subject',
      cases: [
        {
          lane: 0, say: 'ʻi heʻene lau ʻa e tohí', en: 'at his reading the book',
          row: [face('ʻi heʻene', 'pronoun', 'possessive'), face('lau', 'verb', 'verbal noun'), { slot: true, form: face('ʻa e', 'quiet'), label: 'object' }, face('tohí', 'quiet')],
        },
        {
          lane: 1, say: 'Té u tokoni ʻi he fufulu ʻo e valá.', en: 'I will help with the washing of the clothes.',
          row: [face('Té u tokoni ʻi he fufulu', 'quiet'), { slot: true, form: face('ʻo e', 'quiet'), label: 'object' }, face('valá', 'quiet')],
        },
      ],
    },
    {
      key: 'pronoun',
      cases: [
        {
          lane: 2, say: 'Naʻá ku fiefia ʻi hoku tokoni ʻe Sēmisi.', en: 'I was glad when I was helped by Sēmisi.',
          row: [face('Naʻá ku fiefia ʻi', 'quiet'), { slot: true, form: face('hoku', 'pronoun'), label: 'object' }, face('tokoni ʻe Sēmisi', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    'With a possessive subject in front: *ʻi heʻene lau ʻa e tohí*, at his reading the book. The object *ʻa e tohi* sits in its original form.',
    'With a postposed subject or no subject, the object can switch from *ʻa e* to *ʻo e*: *Té u tokoni ʻi he fufulu ʻo e valá.* I will help with the washing of the clothes.',
    'When the object is a pronoun and the verb has a postposed subject (or no subject), the pronoun changes to a ho-class possessive. The pronoun *au* (me) becomes *hoku*: *Naʻá ku fiefia ʻi hoku tokoni ʻe Sēmisi.* I was glad when I was helped by Sēmisi.',
  ],
}

function subjectScene(key, verb, desc, doer, lines) {
  return {
    key,
    tiles: {
      oku: [face('ʻOku', 'tense')],
      verb: [face(verb, 'verb'), face(verb, 'noun', 'verbal noun')],
      desc: [face(desc, 'quiet', 'descriptive word')],
      e: [face('e', 'quiet')],
      doer: [face(doer, 'quiet', 'doer')],
    },
    before: lines[0],
    after: lines[1],
    states: [
      [['oku', 0], ['verb', 0], ['desc', 0], ['doer', 0]],
      [['oku', 0], ['desc', 0], ['verb', 0], ['doer', 0]],
      [['oku', 0], ['desc', 0], ['e', 0], ['verb', 0], ['doer', 0]],
      [['oku', 0], ['desc', 0], ['e', 0], ['verb', 1], ['doer', 0]],
    ],
    beats: [
      { kind: 'move', tile: 'desc', to: 1 },
      { kind: 'add', tile: 'e', to: 2 },
      { kind: 'swap', tile: 'verb', to: 3 },
      { kind: 'en' },
    ],
    alt: [
      `*${lines[0].say}* ${lines[0].en} compared with *${lines[1].say}* ${lines[1].en}`,
      `The verbal noun *${verb}* is the subject, and the descriptive word *${desc}* describes the action itself.`,
    ],
  }
}

/** The book's table, read as the standard verb pattern turned round. */
export const F45_4 = {
  id: '45.4',
  kind: 'row',
  types: ['move', 'add', 'swap'],
  title: 'The verbal noun as the subject',
  after: { section: 'verbal-nouns-as-sentence-subjects', block: b => b.type === 'table' },
  scenes: [
    subjectScene('seini', 'hiva', 'mālie', 'ʻa Seini', [
      { say: 'ʻOku hiva mālie ʻa Seini.', en: 'Seini sings superbly.' },
      { say: 'ʻOku mālie e hiva ʻa Seini.', en: "Seini's singing is superb." },
    ]),
    subjectScene('tevita', 'ngāue', 'mālohi', 'ʻa Tēvita', [
      { say: 'ʻOku ngāue mālohi ʻa Tēvita.', en: 'Tēvita works hard.' },
      { say: 'ʻOku mālohi e ngāue ʻa Tēvita.', en: "Tēvita's working is hard." },
    ]),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Ko', 'quiet'), face('hoʻo', 'pronoun', 'possessive'), face('ʻalu', 'verb', 'verbal noun'), face('ki fē', 'question')],
  say: 'Ko hoʻo ʻalu ki fē?',
  en: 'Where are you going?',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Naʻá ku ofo ʻi heʻene lau ʻa e tohí.', en: 'I was surprised at his reading the book.' },
  { to: 'ʻI he ʻalu ʻa Sēmisi ki Fisi', en: 'When Sēmisi went to Fiji' },
  { to: 'Ko e ʻosi pē ʻa e meʻakai, pea nau mālōlō.', en: 'As soon as the food was finished, they rested.' },
]

export const FIGURES = [F45_1, F45_2, F45_3, F45_4]
