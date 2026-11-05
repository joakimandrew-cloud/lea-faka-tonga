// Lesson 52's figures, as data. Every Tongan and English string is copied from
// book/Chapter-52.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The article grid and the two possessive
// tables already show their forms side by side, so they get no figure. The pictures
// are the three choices the reading asks the student to make: where siʻi stands,
// which class an emotional possessive takes, and the frame of the ka exclamation.

const face = (text, role, label) => ({ text, role, ...(label !== undefined ? { label } : {}) })

/** Position tells you which function siʻi is performing. */
export const F52_1 = {
  id: '52.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Which siʻi? Look at where it stands',
  // After the Note that ends "Position tells you which function si'i is performing".
  after: { section: 'the-emotional-definite-article-sii', block: b => b.type === 'note' },
  lanes: [
    { label: 'Before the noun: emotional article', forms: ['siʻi'] },
    { label: 'After the noun: adjective', forms: ['siʻi'] },
  ],
  scenes: [
    {
      key: 'position',
      cases: [
        {
          lane: 0, say: 'ʻOku hela ʻa siʻi hōsí.', en: 'The poor horse is tired.',
          row: [face('ʻOku', 'tense'), face('hela', 'verb'), face('ʻa', 'focus'), { slot: true, form: face('siʻi', 'quiet', 'emotional article'), label: 'emotional article' }, { ...face('hōsí', 'noun'), ring: true, label: 'noun' }],
        },
        {
          lane: 1, say: 'ha konga siʻi', en: 'a small piece',
          row: [face('ha', 'quiet', 'indefinite'), { ...face('konga', 'quiet', 'noun'), ring: true, label: 'noun' }, { slot: true, form: face('siʻi', 'quiet', 'adjective'), label: 'adjective' }],
        },
      ],
    },
  ],
  alt: [
    'Before the noun, *siʻi* is the emotional article: *ʻOku hela ʻa siʻi hōsí.* The poor horse is tired.',
    'After the noun, *siʻi* is an adjective meaning "small": *ha konga siʻi*, a small piece.',
  ],
}

/** siʻano (ho-class) with faingamālie; siʻane ('e-class) with ʻamanaki. */
export const F52_2 = {
  id: '52.2',
  kind: 'fork',
  types: ['fork'],
  title: 'ʻe-class or ho-class? Look at the thing possessed',
  // After the paragraph beginning "Both sentences use third-person singular".
  after: { section: 'emotional-indefinite-possessive-pronouns', block: b => b.type === 'p' && b.text.startsWith('Both sentences use') },
  lanes: [
    { label: 'ho-class: faingamālie, something that comes to you', forms: ['siʻano'] },
    { label: 'ʻe-class: ʻamanaki, something you hold', forms: ['siʻane'] },
  ],
  scenes: [
    {
      key: 'third-person',
      cases: [
        {
          lane: 0, say: 'Naʻe ʻikai siʻano faingamālie.', en: 'He never had a chance. (poor him)',
          row: [face('Naʻe', 'tense'), face('ʻikai', 'quiet', 'negation'), { slot: true, form: face('siʻano', 'quiet', 'ho-class'), label: 'ho-class' }, { ...face('faingamālie', 'quiet', 'opportunity'), ring: true, label: 'opportunity' }],
        },
        {
          lane: 1, say: 'Naʻe ʻikai siʻane ʻamanaki.', en: 'He had no idea. (poor him)',
          row: [face('Naʻe', 'tense'), face('ʻikai', 'quiet', 'negation'), { slot: true, form: face('siʻane', 'quiet', 'ʻe-class'), label: 'ʻe-class' }, { ...face('ʻamanaki', 'quiet', 'expectation'), ring: true, label: 'expectation' }],
        },
      ],
    },
  ],
  alt: [
    '*siʻano* (ho-class) pairs with *faingamālie* (opportunity, something that comes to you): *Naʻe ʻikai siʻano faingamālie.* He never had a chance. (poor him)',
    '*siʻane* (ʻe-class) pairs with *ʻamanaki* (expectation, something you hold): *Naʻe ʻikai siʻane ʻamanaki.* He had no idea. (poor him)',
  ],
}

/** The fixed frame: Ko e ___ ka ko ha ___! */
export const F52_3 = {
  id: '52.3',
  kind: 'row',
  types: ['swap'],
  title: 'The same word twice: first with e, then with ha',
  // After the paragraph beginning "This idiom is common in spoken Tongan".
  after: { section: 'the-exclamatory-idiom-with-ka', block: b => b.type === 'p' && b.text.startsWith('This idiom is common') },
  chips: [
    { state: 0, to: 'tangi', en: 'cry' },
    { state: 1, to: 'ʻofa', en: 'love' },
    { state: 2, to: 'momoko', en: 'cold' },
  ],
  scenes: [
    {
      key: 'ka',
      tiles: {
        koe: [face('Ko e', 'quiet', 'semi-definite')],
        n1: [face('tangi', 'quiet', ''), face('ʻofa', 'quiet', ''), face('momoko', 'quiet', '')],
        ka: [face('ka', 'quiet', 'but')],
        koha: [face('ko ha', 'quiet', 'indefinite')],
        n2: [face('tangi!', 'quiet', ''), face('ʻofa!', 'quiet', ''), face('momoko!', 'quiet', '')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ko e tangi ka ko ha tangi!', en: 'What a tremendous cry!' },
        { say: 'Ko e ʻofa ka ko ha ʻofa!', en: 'What a wonderful love!' },
        { say: 'Ko e momoko ka ko ha momoko!', en: 'It is terribly cold!' },
      ],
      states: [
        [['koe', 0], ['n1', 0], ['ka', 0], ['koha', 0], ['n2', 0]],
        [['koe', 0], ['n1', 1], ['ka', 0], ['koha', 0], ['n2', 1]],
        [['koe', 0], ['n1', 2], ['ka', 0], ['koha', 0], ['n2', 2]],
      ],
      beats: [
        { kind: 'swap', tile: ['n1', 'n2'], to: 1 },
        { kind: 'swap', tile: ['n1', 'n2'], to: 2 },
      ],
      alt: [
        'The structure literally says: "It was a cry, but it was a cry!" The first clause uses *e*, the second uses *ha*.',
        '*Ko e tangi ka ko ha tangi!* What a tremendous cry!',
        '*Ko e ʻofa ka ko ha ʻofa!* What a wonderful love!',
        '*Ko e momoko ka ko ha momoko!* It is terribly cold!',
      ],
    },
  ],
}

/** Opening row: the lesson's first example. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('hela', 'verb'), face('ʻa', 'focus'), face('siʻi', 'quiet', 'emotional article'), face('hōsí', 'noun')],
  say: 'ʻOku hela ʻa siʻi hōsí.',
  en: 'The poor horse is tired.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku hela ʻa siʻi hōsí.', en: 'The poor horse is tired.' },
  { to: 'Kuó ne lavea siʻa tamasiʻí?', en: 'Has a child been hurt? (poor thing)' },
  { to: 'ʻOku tangi siʻeku kiʻi pēpē.', en: 'My poor little baby is crying.' },
]

export const FIGURES = [F52_1, F52_2, F52_3]
