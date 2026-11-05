// Lesson 26's figures, as data. Every Tongan and English string is copied from
// book/Chapter-26.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note paʻangá and falé, Naʻá ku but Naʻa nau.
// No figure for the koeʻuhi patterns (the book's table shows them), the pronoun table,
// Words to Learn or Exercises. 26.5 has one scene: the falé pair was cut because the
// book's two lines differ in article ("a house", "the house"), which the pair would teach as caused by the pronoun.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const SUB = 'subordinator'
const PREP = 'preposition'

/** The book's pair: the same sentence, and the pronoun assigns the action to a person. */
export const F26_1 = {
  id: '26.1',
  kind: 'row',
  types: ['add'],
  title: 'A pronoun assigns the action to a specific person',
  after: { section: 'ke-to-in-order-to-so-that', block: b => b.type === 'p' && b.text.startsWith('The doubled') },
  scenes: [
    {
      key: 'ke-ke',
      tiles: {
        good: [face('ʻOku lelei', 'quiet')],
        sub: [face('ke', 'quiet')],
        pron: [face('ke', 'pronoun')],
        verb: [face('fufulu', 'verb')],
        rest: [face('leva ʻa e valá', 'quiet')],
      },
      before: { say: 'ʻOku lelei ke fufulu leva ʻa e valá.', en: 'The clothes had better be washed at once.' },
      after: { say: 'ʻOku lelei ke ke fufulu leva ʻa e valá.', en: 'You had better wash the clothes at once.' },
      states: [
        [['good', 0], ['sub', 0], ['verb', 0], ['rest', 0]],
        [['good', 0], ['sub', 0], ['pron', 0], ['verb', 0], ['rest', 0]],
      ],
      beats: [{ kind: 'add', tile: 'pron', to: 1 }, { kind: 'en' }],
      alt: [
        '*ʻOku lelei ke fufulu leva ʻa e valá.* The clothes had better be washed at once. becomes *ʻOku lelei ke ke fufulu leva ʻa e valá.* You had better wash the clothes at once.',
        'The first *ke* is the subordinator; the second is the pronoun "you."',
      ],
    },
  ],
}

function whyCase(lane, form, first, rest, say, en) {
  return {
    lane, say, en,
    row: [face(first, 'quiet'), { slot: true, form: face(form, 'quiet'), label: '' }, face(rest, 'quiet')],
  }
}

/** ke from the section before and he from this one, side by side: what the second part tells you. */
export const F26_2 = {
  id: '26.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Does the second part give a purpose or a reason?',
  after: { section: 'he-for-because', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('hela')) },
  lanes: [
    { label: 'A purpose', forms: ['ke'] },
    { label: 'A reason or explanation', forms: ['he'] },
  ],
  scenes: [
    {
      key: 'lau-hela',
      cases: [
        whyCase(0, 'ke', 'Kuo nau ō mai', 'lau ʻa e tohí', 'Kuo nau ō mai ke lau ʻa e tohí.', 'They have come to read the book.'),
        whyCase(1, 'he', 'ʻOku ou ʻalu ki ʻapi,', 'ʻoku ou helaʻia', 'ʻOku ou ʻalu ki ʻapi, he ʻoku ou helaʻia.', 'I am going home, because I am tired.'),
      ],
    },
    {
      key: 'kole-uha',
      cases: [
        whyCase(0, 'ke', 'Té u kole kia Mele', 'ne haʻu', 'Té u kole kia Mele ke ne haʻu.', 'I will ask Mele to come.'),
        whyCase(1, 'he', 'ʻOua té ke ʻalu,', 'ʻoku ʻuha', 'ʻOua té ke ʻalu, he ʻoku ʻuha.', 'Do not go, because it is raining.'),
      ],
    },
  ],
  alt: [
    'A purpose, *ke*: *Kuo nau ō mai ke lau ʻa e tohí.* They have come to read the book. *Té u kole kia Mele ke ne haʻu.* I will ask Mele to come.',
    'A reason or explanation, *he*: *ʻOku ou ʻalu ki ʻapi, he ʻoku ou helaʻia.* I am going home, because I am tired. *ʻOua té ke ʻalu, he ʻoku ʻuha.* Do not go, because it is raining.',
  ],
}

function dropScene(key, tense, pron, verb, rest, full, short, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verb, 'verb')],
      koeuhi: [face('koeʻuhi', 'quiet')],
      rest: [face(rest, 'quiet')],
    },
    before: null,
    after: null,
    lines: [{ say: full, en }, { say: short, en }],
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0], ['koeuhi', 0], ['rest', 0]],
      [['tense', 0], ['pron', 0], ['verb', 0], ['rest', 0]],
    ],
    beats: [{ kind: 'drop', tile: 'koeuhi', to: 1 }],
    alt: [`*${full}* becomes *${short}* ${en} The meaning stays the same.`],
  }
}

/** The book's two arrows under Dropping koeʻuhi, with one English line for both forms. */
export const F26_3 = {
  id: '26.3',
  kind: 'row',
  types: ['drop'],
  title: '*koeʻuhi* can drop before *ko* and *ke*, and the meaning stays',
  after: { section: 'koeuhi-because-in-order-that', block: b => b.type === 'p' && b.text.startsWith('Both the full') },
  scenes: [
    dropScene('ko-mele', 'Té', 'u', 'foki', 'ko Mele', 'Té u foki koeʻuhi ko Mele.', 'Té u foki ko Mele.', "I will return for Mele's sake."),
    dropScene('ke-mahino', 'Naʻá', 'ku', 'lea', 'ke mahino kiate kinautolu', 'Naʻá ku lea koeʻuhi ke mahino kiate kinautolu.', 'Naʻá ku lea ke mahino kiate kinautolu.', 'I spoke so that they would understand.'),
  ],
}

function forCase(lane, form, first, thing, rest, say, en, after) {
  const slot = form === 'moʻou'
    ? { slot: true, form: face(form, 'pronoun'), label: true }
    : { slot: true, form: face(form, 'quiet', PREP), label: PREP }
  return {
    lane, say, en,
    row: [
      face(first, 'quiet'),
      { ...face(thing, 'quiet'), ring: true },
      ...(after ? [face(after, 'quiet')] : []),
      slot,
      ...(rest ? [face(rest, 'quiet')] : []),
    ],
  }
}

/** The class of the thing given or intended picks the word for "for". */
export const F26_4 = {
  id: '26.4',
  kind: 'fork',
  types: ['fork'],
  title: 'Which “for”? Look at the thing given or intended',
  after: { section: 'maa-and-moo-for-someones-benefit', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('tānaki')) },
  lanes: [
    { label: 'ʻe-class: acted on or controlled', forms: ['maʻa'] },
    { label: 'ho-class: characterizes or shelters', forms: ['moʻo'] },
  ],
  scenes: [
    {
      key: 'money-house',
      cases: [
        forCase(0, 'maʻa', 'Naʻa nau tānaki', 'ʻa e paʻangá', 'Tēvita', 'Naʻa nau tānaki ʻa e paʻangá maʻa Tēvita.', 'They collected money for Tēvita.'),
        forCase(1, 'moʻo', 'Naʻa nau langa', 'ʻa e falé', 'Mele', 'Naʻa nau langa ʻa e falé moʻo Mele.', 'They built a house for Mele.'),
      ],
    },
    {
      key: 'fish-boat',
      cases: [
        forCase(0, 'maʻa', 'Ko e kato', 'ika', 'Tēvita', 'Ko e kato ika eni maʻa Tēvita.', 'This basket of fish is for Tēvita.', 'eni'),
        forCase(1, 'moʻou', 'ʻOku langa', 'e vaká', null, 'ʻOku langa e vaká moʻou?', 'Is the boat being built for you?'),
      ],
    },
  ],
  alt: [
    'Fish is food, *ʻe*-class, so *maʻa*: *Ko e kato ika eni maʻa Tēvita.* This basket of fish is for Tēvita.',
    'A boat carries a person, ho-class, so *moʻo*: *ʻOku langa e vaká moʻou?* Is the boat being built for you?',
    'Money is *ʻe*-class, so *maʻa*: *Naʻa nau tānaki ʻa e paʻangá maʻa Tēvita.* They collected money for Tēvita.',
    'A house is ho-class, so *moʻo*: *Naʻa nau langa ʻa e falé moʻo Mele.* They built a house for Mele.',
  ],
}

function pronounScene(key, start, prep, name, combined, before, after) {
  return {
    key,
    tiles: {
      start: [face(start, 'quiet')],
      prep: [face(prep, 'quiet', PREP), face(combined, 'pronoun')],
      name: [face(name, 'quiet')],
    },
    before,
    after,
    states: [
      [['start', 0], ['prep', 0], ['name', 0]],
      [['start', 0], ['prep', 0]],
      [['start', 0], ['prep', 1]],
    ],
    beats: [
      { kind: 'drop', tile: 'name', to: 1 },
      { kind: 'swap', tile: 'prep', to: 2 },
      { kind: 'en' },
    ],
    alt: [
      `*${before.say}* ${before.en} becomes *${after.say}* ${after.en}`,
      'When the beneficiary is a pronoun rather than a name or noun, *maʻa* and *moʻo* combine with postposed possessive pronoun forms.',
    ],
  }
}

/** A name stands apart from maʻa and moʻo; a pronoun combines with them. */
export const F26_5 = {
  id: '26.5',
  kind: 'row',
  types: ['drop', 'swap'],
  title: 'A name stands apart, a pronoun combines',
  after: { section: 'maa-and-moo-for-someones-benefit', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('onau')) },
  scenes: [
    pronounScene('kato', 'Ko e kato ika eni', 'maʻa', 'Tēvita', 'maʻaku',
      { say: 'Ko e kato ika eni maʻa Tēvita.', en: 'This basket of fish is for Tēvita.' },
      { say: 'Ko e kato ika eni maʻaku.', en: 'This basket of fish is for me.' }),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Kuo', 'tense'), face('nau', 'pronoun'), face('ō mai', 'verb'), face('ke', 'quiet', SUB), face('lau ʻa e tohí', 'quiet')],
  say: 'Kuo nau ō mai ke lau ʻa e tohí.',
  en: 'They have come to read the book.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Té u kole kia Mele ke ne haʻu.', en: 'I will ask Mele to come.' },
  { to: 'ʻOku ou ʻalu ki ʻapi, he ʻoku ou helaʻia.', en: 'I am going home, because I am tired.' },
  { to: 'Naʻa nau tānaki ʻa e paʻangá maʻa Tēvita.', en: 'They collected money for Tēvita.' },
]

export const FIGURES = [F26_1, F26_2, F26_3, F26_4, F26_5]
