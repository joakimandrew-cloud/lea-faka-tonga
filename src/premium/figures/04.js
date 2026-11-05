// Lesson 4's figures, as data. Every Tongan and English string is copied from
// book/Chapter-04.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Labels are the book's own words: time word,
// time expression, object, compound, modifier, intensifier, article, TM.
// No figure for: the three word tables (they already show the point), the days of the
// week (a list), Words to Learn, Exercises.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** Everything before the time word stays exactly as learned; the time word attaches to the end. */
export const F4_1 = {
  id: '4.1',
  kind: 'row',
  types: ['add'],
  title: 'The time word attaches to the end',
  after: { section: 'past-time-words', block: b => b.type === 'p' && b.text.includes('attaches to the end') },
  scenes: [
    {
      key: 'anepo',
      tiles: {
        tense: [face('Naʻa', 'tense')],
        pron: [face('mou', 'pronoun')],
        verb: [face('kai', 'verb')],
        obj: [face('talo', 'quiet', 'object')],
        time: [face('ʻanepō', 'quiet', 'time word')],
      },
      before: null,
      after: { say: 'Naʻa mou kai talo ʻanepō?', en: 'Did you (plural) eat taro last night?' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['obj', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['obj', 0], ['time', 0]],
      ],
      beats: [{ kind: 'add', tile: 'time', to: 1 }, { kind: 'en' }],
      alt: ['*Naʻa mou kai talo ʻanepō?* Did you (plural) eat taro last night? Everything before *ʻanepō* stays exactly as you learned it. The time word attaches to the end.'],
    },
  ],
}

function modifierScene(key, tense, pron, verb, verbLabel, mod, time, say, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verb, 'verb', verbLabel)],
      mod: [face(mod, 'particle', 'modifier')],
      time: [face(time, 'quiet', 'time word')],
    },
    before: null,
    after: { say, en },
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0]],
      [['tense', 0], ['pron', 0], ['verb', 0], ['mod', 0]],
      [['tense', 0], ['pron', 0], ['verb', 0], ['mod', 0], ['time', 0]],
    ],
    beats: [{ kind: 'add', tile: 'mod', to: 1 }, { kind: 'add', tile: 'time', to: 2 }, { kind: 'en' }],
    alt: [`*${say}* ${en} The modifier *${mod}* keeps its usual position. The time word comes after it, at the very end.`],
  }
}

/** Modifiers keep their position after the verb or compound; the time word comes after them. */
export const F4_2 = {
  id: '4.2',
  kind: 'row',
  types: ['add'],
  title: 'The time word comes after the modifier',
  after: { section: 'past-time-words', block: b => b.type === 'p' && b.text.startsWith('The object') },
  scenes: [
    modifierScene('ngaue-malohi', 'Naʻá', 'ku', 'ngāue', null, 'mālohi', 'ʻaneafi', 'Naʻá ku ngāue mālohi ʻaneafi.', 'I worked hard yesterday.'),
    modifierScene('kai-ika-lahi', 'Naʻa', 'nau', 'kai ika', 'compound', 'lahi', 'ʻanepō', 'Naʻa nau kai ika lahi ʻanepō.', 'They ate a lot of fish last night.'),
  ],
}

function lookCase(lane, tense, pron, verb, verbLabel, time, say, en) {
  return {
    lane, say, en,
    row: [
      face(tense, 'tense'),
      face(pron, 'pronoun'),
      face(verb, 'verb', verbLabel),
      { slot: true, form: face(time, 'quiet'), label: 'time word' },
    ],
  }
}

/** The past and future words in sentences, side by side. A question about meaning, so nothing is ringed. */
export const F4_3 = {
  id: '4.3',
  kind: 'fork',
  types: ['fork'],
  title: '*ʻAne-* looks back, *ʻa-* looks forward',
  after: { section: 'future-time-words', block: b => b.type === 'p' && b.text.startsWith('The third pair') },
  lanes: [
    { label: 'Looks back, *ʻane-*', forms: ['ʻanepō', 'ʻanenai', 'ʻaneafi'] },
    { label: 'Looks forward, *ʻa-*', forms: ['ʻapō', 'ʻanai', 'ʻapongipongi'] },
  ],
  scenes: [
    {
      key: 'night',
      cases: [
        lookCase(0, 'Naʻá', 'ne', 'inu kava', 'compound', 'ʻanepō', 'Naʻá ne inu kava ʻanepō.', 'He drank kava last night.'),
        lookCase(1, 'Te', 'nau', 'mohe', null, 'ʻapō', 'Te nau mohe ʻapō.', 'They will sleep tonight.'),
      ],
    },
    {
      key: 'nai',
      cases: [
        lookCase(0, 'Naʻa', 'mau', 'ako lea', 'compound', 'ʻanenai', 'Naʻa mau ako lea ʻanenai.', 'We studied language a little while ago.'),
        lookCase(1, 'Te', 'mau', 'ngāue', null, 'ʻanai', 'Te mau ngāue ʻanai.', 'We will work in a little while.'),
      ],
    },
  ],
  alt: [
    'Past time words begin with *ʻane-*: *ʻanepō*, *ʻanenai*, *ʻaneafi*. *Naʻá ne inu kava ʻanepō.* He drank kava last night. *Naʻa mau ako lea ʻanenai.* We studied language a little while ago.',
    'Future time words begin with *ʻa-*: *ʻapō*, *ʻanai*, *ʻapongipongi*. *Te nau mohe ʻapō.* They will sleep tonight. *Te mau ngāue ʻanai.* We will work in a little while.',
  ],
}

/** ʻAho + ni: ni arrives, the stress shifts forward, and he comes before it inside a sentence. */
export const F4_4 = {
  id: '4.4',
  kind: 'row',
  types: ['add', 'swap'],
  title: '*ni* arrives, the stress shifts, *he* comes before it inside a sentence',
  after: { section: 'today', block: b => b.type === 'p' && b.text.startsWith('When *') },
  scenes: [
    {
      key: 'he-aho-ni',
      tiles: {
        he: [face('he', 'quiet', 'article')],
        aho: [face('ʻáho', 'quiet', 'day'), face('ʻahó', 'quiet', 'day')],
        ni: [face('ni', 'quiet', 'this')],
      },
      before: null,
      after: { say: 'he ʻahó ni', en: 'today, literally "on this day"' },
      states: [
        [['aho', 0]],
        [['aho', 0], ['ni', 0]],
        [['aho', 1], ['ni', 0]],
        [['he', 0], ['aho', 1], ['ni', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'ni', to: 1 },
        { kind: 'swap', tile: 'aho', to: 2 },
        { kind: 'add', tile: 'he', to: 3 },
        { kind: 'en' },
      ],
      alt: [
        'The stress shifts forward: *ʻáho* alone, but *ʻahó ni*.',
        'When *ʻaho ni* appears as a time expression inside a sentence, the article *he* comes before it: *he ʻahó ni* (today, literally "on this day").',
      ],
    },
  ],
}

function tonightCase(lane, time, label, say, en) {
  return {
    lane, say, en,
    row: [
      face('Té', 'tense'),
      face('ta', 'pronoun'),
      face('ʻalu', 'verb'),
      { slot: true, form: face(time, 'quiet'), label },
    ],
  }
}

/** Two ways to say tonight, and the choice depends on when you are speaking. Nothing to ring. */
export const F4_5 = {
  id: '4.5',
  kind: 'fork',
  types: ['fork'],
  title: 'Which “tonight”? It depends on when you are speaking',
  after: { section: 'today', block: b => b.type === 'p' && b.text.startsWith('The stress shifts') },
  lanes: [
    { label: 'While the sun is still up', forms: ['ʻapō'] },
    { label: 'After dark', forms: ['he poó ni'] },
  ],
  scenes: [
    {
      key: 'tonight',
      cases: [
        tonightCase(0, 'ʻapō', 'time word', 'Té ta ʻalu ʻapō.', 'We will go tonight.'),
        tonightCase(1, 'he poó ni', 'time expression', 'Té ta ʻalu he poó ni.', 'We are going tonight.'),
      ],
    },
  ],
  alt: [
    'While the sun is still up: *Té ta ʻalu ʻapō.* We will go tonight.',
    'After dark: *Té ta ʻalu he poó ni.* We are going tonight.',
  ],
}

/** The book's full pattern, built up: each element lands in its own position and the time word goes last. */
export const F4_6 = {
  id: '4.6',
  kind: 'row',
  types: ['add'],
  title: 'Each element keeps its own position',
  after: { section: 'where-time-words-go', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('inu vai lahi')) },
  scenes: [
    {
      key: 'stack',
      tiles: {
        start: [face('Naʻa mau', 'quiet', 'TM + pronoun')],
        faa: [face('faʻa', 'particle', 'modifier')],
        verb: [face('inu vai', 'verb', 'compound')],
        mod: [face('lahi ʻaupito', 'particle', 'modifier, intensifier')],
        time: [face('ʻanepō', 'quiet', 'time word')],
      },
      before: null,
      after: { say: 'Naʻa mau faʻa inu vai lahi ʻaupito ʻanepō.', en: 'We often drank a great deal of water last night.' },
      states: [
        [['start', 0], ['verb', 0]],
        [['start', 0], ['faa', 0], ['verb', 0]],
        [['start', 0], ['faa', 0], ['verb', 0], ['mod', 0]],
        [['start', 0], ['faa', 0], ['verb', 0], ['mod', 0], ['time', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'faa', to: 1 },
        { kind: 'add', tile: 'mod', to: 2 },
        { kind: 'add', tile: 'time', to: 3 },
        { kind: 'en' },
      ],
      alt: ['*Naʻa mau faʻa inu vai lahi ʻaupito ʻanepō.* We often drank a great deal of water last night. Each element keeps its own position. The time word goes last.'],
    },
  ],
}

/** The opening row in the hero: the lesson's shape, a time word at the end. */
export const OPENING = {
  row: [face('Naʻá', 'tense'), face('ku', 'pronoun'), face('mohe', 'verb'), face('ʻaneafi', 'quiet', 'time word')],
  say: 'Naʻá ku mohe ʻaneafi.',
  en: 'I slept yesterday.',
}

/** Recall cards, one per key rule, in order: book sentences only. */
export const RECALL = [
  { to: 'Naʻa nau kai ika lahi ʻanepō.', en: 'They ate a lot of fish last night.' },
  { to: 'Naʻa mau ako lea ʻanenai.', en: 'We studied language a little while ago.' },
  { to: 'Té u ʻalu ʻapongipongi.', en: 'I will go tomorrow.' },
]

export const FIGURES = [F4_1, F4_2, F4_3, F4_4, F4_5, F4_6]
