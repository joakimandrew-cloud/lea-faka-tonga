// Lesson 18's figures, as data. Every Tongan and English string is copied from
// book/Chapter-18.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note fále, falé and fale: the accent tracks
// the end of the group, so copy, never carry it over.
// No figure for long vowels (the book's Note says not to master them here, and Lesson 44
// takes them up), the generic use (a statement with examples), the summary table, Words
// to Learn or Exercises.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The book's three sentences, read as one article and one accent changing. */
export const F18_1 = {
  id: '18.1',
  kind: 'row',
  types: ['swap'],
  title: 'One noun, three levels',
  after: { section: 'three-levels-of-definiteness', block: b => b.type === 'p' && b.text.startsWith('The difference between the second and third') },
  chips: [
    { state: 0, to: 'ha kato', en: 'Indefinite' },
    { state: 1, to: 'e kato', en: 'Semi-definite' },
    { state: 2, to: 'e kató', en: 'Definite' },
  ],
  scenes: [
    {
      key: 'kato',
      tiles: {
        rest: [face('Haʻu mo', 'quiet')],
        art: [face('ha', 'quiet', 'article'), face('e', 'quiet', 'article')],
        noun: [face('kato', 'noun', 'noun'), face('kató', 'noun', 'noun')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Haʻu mo ha kato.', en: 'Bring a basket. (Any basket.)' },
        { say: 'Haʻu mo e kato.', en: 'Bring a basket. (I have a particular one in mind, but you may not know which.)' },
        { say: 'Haʻu mo e kató.', en: 'Bring the basket. (The one you know about.)' },
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
        '*Haʻu mo ha kato.* Bring a basket. (Any basket.) Indefinite.',
        '*Haʻu mo e kato.* Bring a basket. (I have a particular one in mind, but you may not know which.) Semi-definite.',
        '*Haʻu mo e kató.* Bring the basket. (The one you know about.) Definite.',
      ],
    },
  ],
}

/** The book's table, read as a group growing and its stress landing on the last vowel. */
export const F18_2 = {
  id: '18.2',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'In a definite noun group, the stress lands on the last vowel',
  after: { section: 'how-the-definitive-accent-works', block: b => b.type === 'p' && b.text.includes('No matter how many') },
  scenes: [
    {
      key: 'fale',
      tiles: {
        he: [face('ʻi he', 'quiet')],
        head: [face('fále', 'noun', 'noun'), face('falé', 'noun', 'noun'), face('fale', 'noun', 'noun')],
        first: [face('akó', 'quiet', 'modifier'), face('ako', 'quiet', 'modifier')],
        last: [face('foʻoú', 'quiet', 'modifier')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'fále', en: 'house (normal stress, second-to-last vowel)' },
        { say: 'ʻi he falé', en: 'in the house' },
        { say: 'ʻi he fale akó', en: 'in the school building' },
        { say: 'ʻi he fale ako foʻoú', en: 'in the new school building' },
      ],
      states: [
        [['head', 0]],
        [['he', 0], ['head', 1]],
        [['he', 0], ['head', 2], ['first', 0]],
        [['he', 0], ['head', 2], ['first', 1], ['last', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'he', roll: 'head', to: 1 },
        { kind: 'add', tile: 'first', roll: 'head', to: 2 },
        { kind: 'add', tile: 'last', roll: 'first', to: 3 },
      ],
      alt: [
        '*fále*. house (normal stress, second-to-last vowel). *ʻi he falé*. in the house (stress on the last vowel).',
        '*ʻi he fale akó* in the school building. *ʻi he fale ako foʻoú* in the new school building.',
        'No matter how many adjectives or qualifying words follow the noun, the stress lands on the last vowel of the full noun group.',
      ],
    },
    {
      key: 'koloa',
      tiles: {
        e: [face('e', 'quiet', 'article')],
        head: [face('koloá', 'noun', 'noun'), face('koloa', 'noun', 'noun')],
        next: [face('lahí', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'e koloá', en: 'the wealth' },
        { say: 'e koloa lahí', en: 'the great wealth' },
      ],
      states: [
        [['e', 0], ['head', 0]],
        [['e', 0], ['head', 1], ['next', 0]],
      ],
      beats: [{ kind: 'add', tile: 'next', roll: 'head', to: 1 }],
      alt: ['*e koloá* the wealth. *e koloa lahí* the great wealth. The stress lands on the last vowel of the full noun group.'],
    },
  ],
}

function article(say, en, rest, before, form, noun) {
  return {
    lane: form === 'he' ? 0 : 1,
    say,
    en,
    row: [face(rest, 'quiet'), { ...before, ring: true }, { slot: true, form: face(form, 'quiet') }, face(noun, 'noun', 'noun')],
  }
}

/** "He appears right after the prepositions": the accent holds, the word before picks the form. */
export const F18_3 = {
  id: '18.3',
  kind: 'fork',
  types: ['fork'],
  title: '*he* or *e*? Look at the word before it',
  after: { section: 'definite-common-noun-subjects-with-e', block: b => b.type === 'p' && b.text.startsWith('In each sentence') },
  lanes: [
    { label: 'Right after *ʻi*, *ki*, *mei* or *ʻe*', forms: ['he'] },
    { label: 'Everywhere else', forms: ['e'] },
  ],
  scenes: [
    {
      key: 'tamasii',
      cases: [
        article('Naʻá ku sio ki he tamasiʻí.', 'I looked at the boy.', 'Naʻá ku sio', face('ki', 'quiet', 'preposition'), 'he', 'tamasiʻí'),
        article('Naʻe lele ʻa e tamasiʻí.', 'The boy ran.', 'Naʻe lele', face('ʻa', 'focus'), 'e', 'tamasiʻí'),
      ],
    },
    {
      key: 'tangata',
      cases: [
        article('Té ke tokoni ki he tangatá?', 'Will you help the man?', 'Té ke tokoni', face('ki', 'quiet', 'preposition'), 'he', 'tangatá'),
        article('Naʻe haʻu ʻa e faiakó.', 'The teacher came.', 'Naʻe haʻu', face('ʻa', 'focus'), 'e', 'faiakó'),
      ],
    },
  ],
  alt: [
    '*he* appears right after the prepositions *ʻi*, *ki*, and *mei*, and after *ʻe*. *Naʻá ku sio ki he tamasiʻí.* I looked at the boy. *Té ke tokoni ki he tangatá?* Will you help the man?',
    'Use *e* everywhere else. *Naʻe lele ʻa e tamasiʻí.* The boy ran. *Naʻe haʻu ʻa e faiakó.* The teacher came.',
    'In each sentence, the definite article combines with the definitive accent on the final vowel.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Haʻu mo', 'quiet'), face('e', 'quiet', 'article'), face('kató', 'noun', 'noun')],
  say: 'Haʻu mo e kató.',
  en: 'Bring the basket. (The one you know about.)',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Haʻu mo e kató.', en: 'Bring the basket. (The one you know about.)' },
  { to: 'ʻi he fale ako foʻoú', en: 'in the new school building' },
  { to: 'ʻOku lelei ʻa e iká.', en: 'Fish is good.' },
]

export const FIGURES = [F18_1, F18_2, F18_3]
