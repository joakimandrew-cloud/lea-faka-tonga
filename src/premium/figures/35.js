// Lesson 35's figures, as data. Every Tongan and English string is copied from
// book/Chapter-35.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Labels are the book's: article, noun,
// adjective, Size intensifier, Tree classifier.
// No figure for: attributive adjectives alone (a definition with examples; 35.1 carries
// its contrast), fuʻu against foʻi (its table shows the point), the colour list, compound
// adjectives and loto compounds (their tables already set out word by word what each
// part means), Words to Learn or Exercises. The accent figure leaves out ha sote hinehina
// because the book prints that phrase only in an exercise.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const article = text => face(text, 'quiet', 'article')
const noun = text => face(text, 'noun', 'noun')
const adjective = text => face(text, 'verb', 'adjective')
const slot = text => ({ slot: true, form: adjective(text), label: 'adjective' })

/** The same noun, an adjective either side of it: the standard position, and the few that go before. */
export const F35_1 = {
  id: '35.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Which side of the noun?',
  after: { section: 'adjectives-before-the-noun', block: b => b.type === 'note' },
  lanes: [
    { label: 'The standard position: after the noun', forms: ['foʻou', 'lahi', 'kehe'] },
    { label: 'A few: before the noun', forms: ['fuʻu', 'kiʻi', 'muʻaki', 'toe'] },
  ],
  scenes: [
    {
      key: 'fale',
      cases: [
        { lane: 0, say: 'ha fale foʻou', en: 'a new house', row: [article('ha'), noun('fale'), slot('foʻou')] },
        { lane: 1, say: 'ha fuʻu fale', en: 'a big house', row: [article('ha'), slot('fuʻu'), noun('fale')] },
      ],
      alt: [
        'In Tongan, the standard position for an attributive adjective is after the noun: *ha fale foʻou*, a new house.',
        'A few adjectives go before the noun instead of after it: *ha fuʻu fale*, a big house.',
      ],
    },
    {
      key: 'mea',
      cases: [
        { lane: 0, say: 'ha meʻa kehe', en: 'a different thing', row: [article('ha'), noun('meʻa'), slot('kehe')] },
        { lane: 1, say: 'ha toe meʻa', en: 'another thing (an additional thing)', row: [article('ha'), slot('toe'), noun('meʻa')] },
      ],
      alt: [
        'The word *kehe* (different) is postposed: *ha meʻa kehe*, a different thing.',
        'The word *toe* means "additional" or "more of the same kind": *ha toe meʻa*, another thing (an additional thing).',
      ],
    },
  ],
}

/** The book's pattern, built up: article + preposed adjective + noun + postposed adjective. */
export const F35_2 = {
  id: '35.2',
  kind: 'row',
  types: ['add'],
  title: 'An adjective on each side of the noun',
  after: { section: 'double-adjectives-preposed-and-postposed-together', block: b => b.type === 'p' && b.text.startsWith('The pattern is') },
  scenes: [
    {
      key: 'fale',
      tiles: { art: [article('ha')], pre: [adjective('fuʻu')], noun: [noun('fale')], post: [adjective('lahi')] },
      before: null,
      after: { say: 'ha fuʻu fale lahi', en: 'a very big house' },
      states: [
        [['art', 0], ['noun', 0]],
        [['art', 0], ['pre', 0], ['noun', 0]],
        [['art', 0], ['pre', 0], ['noun', 0], ['post', 0]],
      ],
      beats: [{ kind: 'add', tile: 'pre', to: 1 }, { kind: 'add', tile: 'post', to: 2 }, { kind: 'en' }],
      alt: ['The pattern is: article + preposed adjective + noun + postposed adjective. *ha fuʻu fale lahi*, a very big house.'],
    },
    {
      key: 'kii-mea',
      tiles: { art: [article('ha')], pre: [adjective('kiʻi')], noun: [noun('meʻa')], post: [adjective('siʻi')] },
      before: null,
      after: { say: 'ha kiʻi meʻa siʻi', en: 'a little tiny thing' },
      states: [
        [['art', 0], ['noun', 0]],
        [['art', 0], ['pre', 0], ['noun', 0]],
        [['art', 0], ['pre', 0], ['noun', 0], ['post', 0]],
      ],
      beats: [{ kind: 'add', tile: 'pre', to: 1 }, { kind: 'add', tile: 'post', to: 2 }, { kind: 'en' }],
      alt: ['The preposed word goes before the noun, the postposed word goes after it. *ha kiʻi meʻa siʻi*, a little tiny thing.'],
    },
  ],
}

const fuu = () => face('fuʻu', 'particle')

/** Beyond "big", the book gives fuʻu two uses, and the word after it tells them apart. */
export const F35_3 = {
  id: '35.3',
  kind: 'fork',
  types: ['fork'],
  title: 'What comes after *fuʻu*?',
  after: { section: 'fuu-as-intensifier-and-tree-classifier', block: b => b.type === 'examples' && JSON.stringify(b).includes('tō') },
  lanes: [
    { label: 'An adjective or adverb: size intensifier', forms: ['lahi', 'lelei'] },
    { label: 'A plant name: tree classifier', forms: ['mango', 'niu', 'mei'] },
  ],
  scenes: [
    {
      key: 'lahi-mango',
      cases: [
        { lane: 0, say: 'fuʻu lahi', en: 'really big, very much', row: [fuu(), { slot: true, form: adjective('lahi'), label: 'adjective' }] },
        { lane: 1, say: 'fuʻu mango', en: 'a mango tree', row: [fuu(), { slot: true, form: face('mango', 'quiet'), label: 'plant name' }] },
      ],
      alt: [
        'Before an adjective or adverb, *fuʻu* intensifies the meaning: *fuʻu lahi*, really big, very much.',
        'Before a plant name, *fuʻu* means the whole tree or plant: *fuʻu mango*, a mango tree.',
      ],
    },
    {
      key: 'lelei-niu',
      cases: [
        { lane: 0, say: 'fuʻu lelei', en: 'really good', row: [fuu(), { slot: true, form: adjective('lelei'), label: 'adjective' }] },
        { lane: 1, say: 'fuʻu niu', en: 'a coconut palm', row: [fuu(), { slot: true, form: face('niu', 'quiet'), label: 'plant name' }] },
      ],
      alt: [
        'Size intensifier: *fuʻu lelei*, really good.',
        'Tree classifier: *fuʻu niu*, a coconut palm.',
      ],
    },
  ],
}

/** The colour keeps its spelling in the ha sentence and takes the accent as the last word of a definite phrase. */
export const F35_4 = {
  id: '35.4',
  kind: 'fork',
  types: ['fork'],
  title: 'When a color takes the definitive accent',
  after: { section: 'colors', block: b => b.type === 'examples' && JSON.stringify(b).includes('kulokulá') },
  lanes: [
    { label: 'With *ha*', forms: ['kulokula'] },
    { label: 'Last word of a definite phrase', forms: ['kulokulá'] },
  ],
  scenes: [
    {
      key: 'kulokula',
      cases: [
        {
          lane: 0, say: 'Naʻá ku fakatau mai ha sote kulokula.', en: 'I bought a red shirt.',
          row: [face('Naʻá ku fakatau mai', 'quiet'), { ...article('ha'), ring: true, label: 'article' }, noun('sote'), slot('kulokula')],
        },
        {
          lane: 1, say: 'e kato kulokulá', en: 'the red basket',
          row: [{ ...article('e'), ring: true, label: 'article' }, noun('kato'), slot('kulokulá')],
        },
      ],
      alt: [
        '*Naʻá ku fakatau mai ha sote kulokula.* I bought a red shirt.',
        'When a color adjective is the last word in a definite noun phrase, the definitive accent falls on its final vowel: *e kato kulokulá*, the red basket.',
      ],
    },
  ],
}

/** The opening row in the hero: the one phrase with an adjective on each side of its noun. */
export const OPENING = {
  row: [article('ha'), adjective('fuʻu'), noun('fale'), adjective('lahi')],
  say: 'ha fuʻu fale lahi',
  en: 'a very big house',
}

/** Recall cards, by key rule, in order: book sentences only. */
export const RECALL = [
  { to: 'Naʻá ku fakatau mai ha vaka foʻou.', en: 'I bought a new boat.' },
  { to: 'ha kiʻi tamasiʻi', en: 'a small boy' },
  { to: 'Naʻá ku fakatau mai ha sote kulokula.', en: 'I bought a red shirt.' },
]

export const FIGURES = [F35_1, F35_2, F35_3, F35_4]
