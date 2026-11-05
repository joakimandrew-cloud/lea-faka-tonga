// Lesson 44's figures, as data. Every Tongan and English string is copied from
// book/Chapter-44.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note fakatahá against fakataha lahí, and
// aú against au: the accent tracks the end of the group, so copy, never carry it over.
// No figure for possessives or hatau and hotau (the sentences differ beyond one word),
// dropped openings (the group is unspoken, so a tile would have to invent it), emphatic
// directional adverbs (its Normal and Emphatic table shows the point), Words to Learn or
// Exercises.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The book's three sentences, read as one article and one accent changing. */
export const F44_1 = {
  id: '44.1',
  kind: 'row',
  types: ['swap'],
  title: 'One sentence, three levels',
  after: { section: 'three-levels-of-definiteness-revisited', block: b => b.type === 'table' },
  chips: [
    { state: 0, to: 'ha puha', en: 'Indefinite' },
    { state: 1, to: 'he puha', en: 'Semi-definite' },
    { state: 2, to: 'he puhá', en: 'Definite' },
  ],
  scenes: [
    {
      key: 'puha',
      tiles: {
        rest: [face('Naʻá ku faʻo ia ki', 'quiet')],
        art: [face('ha', 'quiet'), face('he', 'quiet')],
        noun: [face('puha', 'noun', 'noun'), face('puhá', 'noun', 'noun')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Naʻá ku faʻo ia ki ha puha.', en: 'I put it into a box. (Some box or other.)' },
        { say: 'Naʻá ku faʻo ia ki he puha.', en: 'I put it into a box. (One particular box.)' },
        { say: 'Naʻá ku faʻo ia ki he puhá.', en: 'I put it into the box.' },
      ],
      states: [
        [['rest', 0], ['art', 0], ['noun', 0]],
        [['rest', 0], ['art', 1], ['noun', 0]],
        [['rest', 0], ['art', 1], ['noun', 1]],
      ],
      beats: [
        { kind: 'swap', tile: 'art', to: 1 },
        { kind: 'swap', tile: 'noun', to: 2 },
      ],
      alt: [
        '*Naʻá ku faʻo ia ki ha puha.* I put it into a box. (Some box or other.) Indefinite.',
        '*Naʻá ku faʻo ia ki he puha.* I put it into a box. (One particular box.) Semi-definite.',
        '*Naʻá ku faʻo ia ki he puhá.* I put it into the box. Definite.',
      ],
    },
  ],
}

function groupScene(key, head, headPlain, first, firstPlain, last, lines) {
  return {
    key,
    tiles: {
      he: [face('ʻi he', 'quiet')],
      head: [face(head, 'noun', 'noun'), face(headPlain, 'noun', 'noun')],
      first: [face(first, 'quiet'), face(firstPlain, 'quiet')],
      last: [face(last, 'quiet')],
    },
    before: null,
    after: null,
    lines,
    states: [
      [['he', 0], ['head', 0]],
      [['he', 0], ['head', 1], ['first', 0]],
      [['he', 0], ['head', 1], ['first', 1], ['last', 0]],
    ],
    beats: [
      { kind: 'add', tile: 'first', roll: 'head', to: 1 },
      { kind: 'add', tile: 'last', roll: 'first', to: 2 },
    ],
    alt: [
      lines.map(line => `*${line.say}* ${line.en}.`).join(' '),
      'Each qualifier extends the group, and the accent travels to the end.',
    ],
  }
}

/** The book's two tables, read as a group growing and its accent travelling. */
export const F44_2 = {
  id: '44.2',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'The accent travels to the end of the group',
  after: { section: 'the-definitive-accent-at-group-end', block: b => b.type === 'p' && b.text.startsWith('The core noun is') },
  scenes: [
    groupScene('fale', 'falé', 'fale', 'akó', 'ako', 'motuʻá', [
      { say: 'ʻi he falé', en: 'in the house' },
      { say: 'ʻi he fale akó', en: 'in the school building' },
      { say: 'ʻi he fale ako motuʻá', en: 'in the old school building' },
    ]),
    groupScene('loki', 'lokí', 'loki', 'mohé', 'mohe', 'foʻoú', [
      { say: 'ʻi he lokí', en: 'in the room' },
      { say: 'ʻi he loki mohé', en: 'in the bedroom' },
      { say: 'ʻi he loki mohe foʻoú', en: 'in the new bedroom' },
    ]),
  ],
}

/** The same question three ways: only a word in the noun group carries the accent away. */
export const F44_3 = {
  id: '44.3',
  kind: 'row',
  types: ['swap'],
  title: 'Is the next word in the noun group?',
  after: { section: 'the-definitive-accent-at-group-end', block: b => b.type === 'p' && b.text.startsWith('Now') },
  chips: [
    { state: 0, to: 'ʻaneafi', en: 'yesterday' },
    { state: 1, to: 'lahí', en: 'big' },
    { state: 2, to: 'naʻe fai ʻaneafí', en: 'that was held yesterday' },
  ],
  scenes: [
    {
      key: 'fakataha',
      tiles: {
        rest: [face('Naʻá ke ʻalu ki he', 'quiet')],
        noun: [face('fakatahá', 'noun', 'noun'), face('fakataha', 'noun', 'noun')],
        next: [face('ʻaneafi', 'quiet', 'adverb'), face('lahí', 'quiet', 'adjective'), face('naʻe fai ʻaneafí', 'quiet', 'adjectival clause')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Naʻá ke ʻalu ki he fakatahá ʻaneafi?', en: 'Did you go to the meeting yesterday?' },
        { say: 'Naʻá ke ʻalu ki he fakataha lahí?', en: 'Did you go to the big meeting?' },
        { say: 'Naʻá ke ʻalu ki he fakataha naʻe fai ʻaneafí?' },
      ],
      states: [
        [['rest', 0], ['noun', 0], ['next', 0]],
        [['rest', 0], ['noun', 1], ['next', 1]],
        [['rest', 0], ['noun', 1], ['next', 2]],
      ],
      beats: [
        { kind: 'swap', tile: ['noun', 'next'], to: 1 },
        { kind: 'swap', tile: 'next', to: 2 },
      ],
      alt: [
        '*Naʻá ke ʻalu ki he fakatahá ʻaneafi?* Did you go to the meeting yesterday? The accent stays on *fakatahá* because *ʻaneafi* modifies *ʻalu*.',
        '*Naʻá ke ʻalu ki he fakataha lahí?* Did you go to the big meeting? *lahi* is an adjective modifying *fakataha*, so the accent moves to *lahí*.',
        '*Naʻá ke ʻalu ki he fakataha naʻe fai ʻaneafí?* Did you go to the meeting that was held yesterday? The accent is carried to the end of the whole group.',
      ],
    },
  ],
}

/** The book's reordering: kiate au moves inside, and loses its accent. */
export const F44_4 = {
  id: '44.4',
  kind: 'row',
  types: ['move', 'swap'],
  title: 'Two definite groups, two accents, until they end together',
  after: { section: 'groups-within-groups', block: b => b.type === 'p' && b.text.startsWith('Here') },
  scenes: [
    {
      key: 'faiako',
      tiles: {
        why: [face('Ko e hā ʻa e ʻuhinga', 'quiet')],
        clause: [face('naʻe ʻita ai', 'quiet')],
        noun: [face('ʻa e faiakó', 'noun')],
        me: [face('kiate aú', 'quiet'), face('kiate au', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ko e hā ʻa e ʻuhinga naʻe ʻita ai ʻa e faiakó kiate aú?', en: 'Why was the teacher angry with me?' },
        { say: 'Ko e hā ʻa e ʻuhinga naʻe ʻita ai kiate au ʻa e faiakó?', en: '(Same meaning, different word order.)' },
      ],
      states: [
        [['why', 0], ['clause', 0], ['noun', 0], ['me', 0]],
        [['why', 0], ['clause', 0], ['me', 1], ['noun', 0]],
      ],
      beats: [
        { kind: 'move', tile: 'me', to: 1 },
      ],
      alt: [
        '*Ko e hā ʻa e ʻuhinga naʻe ʻita ai ʻa e faiakó kiate aú?* Why was the teacher angry with me? Two accents appear. Each accent marks the end of its own group.',
        '*Ko e hā ʻa e ʻuhinga naʻe ʻita ai kiate au ʻa e faiakó?* Same meaning, different word order. The single accent on *faiakó* covers both groups at once.',
      ],
    },
  ],
}

/** The book's pair: one accent turns a casual question into a deliberate one. */
export const F44_5 = {
  id: '44.5',
  kind: 'row',
  types: ['swap'],
  title: 'An accent on the opening phrase',
  after: { section: 'phrasal-and-clausal-definitive-accents', block: b => b.type === 'p' && b.text.startsWith('Without the accent') },
  scenes: [
    {
      key: 'alu',
      tiles: {
        ko: [face('Ko', 'quiet')],
        verb: [face('hoʻo ʻalu', 'verb', 'your going'), face('hoʻo ʻalú', 'verb', 'your going')],
        rest: [face('ki fē', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ko hoʻo ʻalu ki fē?', note: 'a casual question' },
        { say: 'Ko hoʻo ʻalú ki fē?', en: 'Where is it that you are going?' },
      ],
      states: [
        [['ko', 0], ['verb', 0], ['rest', 0]],
        [['ko', 0], ['verb', 1], ['rest', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'verb', to: 1 }],
      alt: [
        '*Ko hoʻo ʻalu ki fē?* would be a casual question. *Ko hoʻo ʻalú ki fē?* Where is it that you are going? With the accent, it becomes more deliberate.',
      ],
    },
  ],
}

function splitScene(key, long, split, en) {
  return {
    key,
    tiles: { word: [face(long, 'quiet'), face(split, 'quiet')] },
    before: null,
    after: null,
    lines: [{ say: long, en }, { say: split, note: 'with the definitive accent' }],
    states: [[['word', 0]], [['word', 1]]],
    beats: [{ kind: 'swap', tile: 'word', to: 1 }],
    alt: [`*${long}* (${en}) becomes *${split}* with the definitive accent. The vowel splits into two short vowels, and the stress lands on the second.`],
  }
}

/** The book's pairs, in a line of prose there: the long vowel splits, then contracts back. */
export const F44_6 = {
  id: '44.6',
  kind: 'row',
  types: ['swap'],
  title: 'A long vowel splits under stress, and contracts back',
  after: { section: 'double-vowels-under-the-definitive-accent', block: b => b.type === 'p' && b.text.includes('with the accent carried to') },
  scenes: [
    splitScene('po', 'pō', 'poó', 'night'),
    splitScene('hu', 'hū', 'huú', 'to go in'),
    splitScene('fakaha', 'fakahā', 'fakahaá', 'to show'),
    {
      key: 'po-ni',
      tiles: {
        word: [face('poó', 'quiet'), face('pō', 'quiet')],
        ni: [face('ni', 'quiet'), face('ní', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'poó ni', en: 'this night' },
        { say: 'pō ní', note: 'with the accent carried to ni' },
      ],
      states: [[['word', 0], ['ni', 0]], [['word', 1], ['ni', 1]]],
      beats: [{ kind: 'swap', tile: ['word', 'ni'], to: 1 }],
      alt: ['*poó ni* (this night) becomes *pō ní*, with the accent carried to *ni*. When stress moves further along, the double vowel contracts back to a normal long vowel.'],
    },
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻi he', 'quiet'), face('fale', 'noun', 'noun'), face('ako', 'quiet'), face('foʻoú', 'quiet')],
  say: 'ʻi he fale ako foʻoú',
  en: 'in the new school building',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻi he fale ako foʻoú', en: 'in the new school building' },
  { to: 'Naʻá ke ʻalu ki he fakatahá ʻaneafi?', en: 'Did you go to the meeting yesterday?' },
  { to: 'Ko e hā ʻa e ʻuhinga naʻe ʻita ai ʻa e faiakó kiate aú?', en: 'Why was the teacher angry with me?' },
]

export const FIGURES = [F44_1, F44_2, F44_3, F44_4, F44_5, F44_6]
