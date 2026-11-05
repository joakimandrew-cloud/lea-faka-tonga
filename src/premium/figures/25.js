// Lesson 25's figures, as data. Every Tongan and English string is copied from
// book/Chapter-25.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its macrons and stress accents kept. Labels and lane questions use the book's words:
// article, possessive, noun, the "Used with" column, the Singular and Plural/Dual heads.
// No figure for ongo, the irregular nouns, kau vs. ngaahi (its table pairs all four words) or Words to Learn.
// 25.2 labels tohí and fale only "noun": the book separates ʻū and ngaahi by number, not noun kind (line 98).
// Exercise answers stay out, so haʻu and ō mai have no pair here.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const marker = text => face(text, 'quiet', 'plural marker')

function addScene(key, firstText, firstLabel, noun, say, en) {
  return {
    key,
    tiles: {
      first: [face(firstText, 'quiet', firstLabel)],
      plural: [marker('ngaahi')],
      noun: [face(noun, 'noun', 'noun')],
    },
    before: null,
    after: { say, en },
    states: [
      [['first', 0], ['noun', 0]],
      [['first', 0], ['plural', 0], ['noun', 0]],
    ],
    beats: [
      { kind: 'add', tile: 'plural', to: 1 },
      { kind: 'en' },
    ],
    alt: [
      `*${say}* ${en}`,
      'The plural marker sits between the article (or possessive) and the noun.',
    ],
  }
}

/** "The plural marker sits between the article (or possessive) and the noun." The noun does not change. */
export const F25_1 = {
  id: '25.1',
  kind: 'row',
  types: ['add'],
  title: 'Where the plural marker sits',
  after: { section: 'ngaahi-the-general-plural', block: b => b.type === 'p' && b.text.startsWith('The plural marker sits') },
  scenes: [
    addScene('article', 'ha', 'article', 'fale', 'ha ngaahi fale', 'some houses'),
    addScene('possessive', 'ʻeku', 'possessive', 'kató', 'ʻeku ngaahi kató', 'my baskets'),
  ],
}

function pluralCase(lane, article, form, asked, label, say, en) {
  return {
    lane, say, en,
    row: [
      face(article, 'quiet', 'article'),
      { slot: true, form: face(form, 'quiet'), label: 'plural marker' },
      { ...face(asked, 'noun', label), ring: true },
    ],
  }
}

function kiiCase(say, en, noun) {
  return {
    lane: 2, say, en,
    row: [
      face('ha', 'quiet', 'article'),
      { slot: true, form: face('fanga', 'quiet'), label: 'plural marker' },
      { ...face('kiʻi', 'quiet', 'small'), ring: true },
      face(noun, 'noun', 'noun'),
    ],
  }
}

/** Choosing the right plural marker: the book's "Used with" column, asked of each noun. */
export const F25_2 = {
  id: '25.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Choosing the right plural marker',
  after: { section: 'choosing-the-right-plural-marker', block: b => b.type === 'p' && b.text.startsWith('When in doubt') },
  lanes: [
    { label: 'Anything (the default)', forms: ['ngaahi'] },
    { label: 'People', forms: ['kau'] },
    { label: 'Animals; *kiʻi* + noun', forms: ['fanga'] },
    { label: 'Things (smaller number)', forms: ['ʻū'] },
  ],
  scenes: [
    {
      key: 'people-animals',
      cases: [
        pluralCase(1, 'e', 'kau', 'faiakó', 'people', 'e kau faiakó', 'the teachers'),
        pluralCase(2, 'ha', 'fanga', 'moa', 'animals', 'ha fanga moa', 'some chickens'),
      ],
    },
    {
      key: 'uu-ngaahi',
      cases: [
        pluralCase(3, 'e', 'ʻū', 'tohí', 'noun', 'e ʻū tohí', 'the books'),
        pluralCase(0, 'ha', 'ngaahi', 'fale', 'noun', 'ha ngaahi fale', 'some houses'),
      ],
    },
    {
      key: 'kii',
      cases: [
        kiiCase('ha fanga kiʻi kato', 'some little baskets', 'kato'),
        kiiCase('ha fanga kiʻi meʻa', 'some little things', 'meʻa'),
      ],
    },
  ],
  alt: [
    '*ngaahi*, anything (the default): *ha ngaahi fale.* some houses.',
    '*kau*, people: *e kau faiakó.* the teachers.',
    '*fanga*, animals: *ha fanga moa.* some chickens. Also before *kiʻi*, regardless of what the noun refers to: *ha fanga kiʻi kato.* some little baskets. *ha fanga kiʻi meʻa.* some little things.',
    '*ʻū*, things (smaller number): *e ʻū tohí.* the books.',
  ],
}

/** Compare the singular: the book's own pair, the subject picks the verb's form. */
export const F25_3 = {
  id: '25.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Some common verbs have different forms when the subject is two or more people',
  after: { section: 'special-plural-forms-verbs', block: b => b.type === 'p' && b.text.startsWith('The subject') },
  lanes: [
    { label: 'Singular', forms: ['ʻalu'] },
    { label: 'Plural/Dual', forms: ['ō'] },
  ],
  scenes: [
    {
      key: 'alu-o',
      cases: [
        {
          lane: 0, say: 'Naʻe ʻalu ʻa Sione ki kolo', en: 'Sione went to town',
          row: [
            face('Naʻe', 'tense'),
            { slot: true, form: face('ʻalu', 'verb'), label: 'verb' },
            face('ʻa', 'focus'),
            { ...face('Sione', 'noun', 'subject'), ring: true },
            face('ki kolo', 'place'),
          ],
        },
        {
          lane: 1, say: 'Naʻe ō ʻa e kau tamaikí ki kolo.', en: 'The children went to town.',
          row: [
            face('Naʻe', 'tense'),
            { slot: true, form: face('ō', 'verb'), label: 'verb' },
            face('ʻa', 'focus'),
            { ...face('e kau tamaikí', 'noun', 'subject'), ring: true },
            face('ki kolo', 'place'),
          ],
        },
      ],
    },
  ],
  alt: [
    'Singular, *ʻalu*: *Naʻe ʻalu ʻa Sione ki kolo.* Sione went to town.',
    'Plural or dual, *ō*: *Naʻe ō ʻa e kau tamaikí ki kolo.* The children went to town.',
  ],
}

function adjectiveScene(key, single, singleMeans, plural, pluralMeans, singleEn, pluralEn) {
  const say0 = `ha ngaahi meʻa ${single}`
  const say1 = `ha ngaahi meʻa ${plural}`
  return {
    key,
    tiles: {
      rest: [face('ha ngaahi meʻa', 'quiet')],
      adj: [face(single, 'quiet', singleMeans), face(plural, 'quiet', pluralMeans)],
    },
    before: null,
    after: null,
    lines: [
      { say: say0, en: singleEn },
      { say: say1, en: pluralEn },
    ],
    states: [
      [['rest', 0], ['adj', 0]],
      [['rest', 0], ['adj', 1]],
    ],
    beats: [{ kind: 'swap', tile: 'adj', to: 1 }],
    alt: [
      `*${say0}*: ${singleEn} (*${single}* = ${singleMeans}). *${say1}*: ${pluralEn} (*${plural}* = ${pluralMeans}, plural).`,
    ],
  }
}

/** lahi can mean "big" or "many"; the plural form removes the ambiguity. The same for siʻi. */
export const F25_4 = {
  id: '25.4',
  kind: 'row',
  types: ['swap'],
  title: 'The plural form removes the ambiguity',
  after: { section: 'special-plural-forms-adjectives', block: b => b.type === 'examples' && JSON.stringify(b.pairs).includes('iiki') },
  scenes: [
    adjectiveScene('lahi', 'lahi', 'many', 'lalahi', 'big', 'many things', 'some big things'),
    adjectiveScene('sii', 'siʻi', 'few', 'iiki', 'small', 'a few things', 'some small things'),
  ],
}

export const OPENING = {
  row: [face('ha', 'quiet', 'article'), marker('ngaahi'), face('fale', 'noun', 'noun')],
  say: 'ha ngaahi fale',
  en: 'some houses',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻeku ngaahi kató', en: 'my baskets' },
  { to: 'e kau faiakó', en: 'the teachers' },
  { to: 'Naʻe ō ʻa e kau tamaikí ki kolo.', en: 'The children went to town.' },
]

export const FIGURES = [F25_1, F25_2, F25_3, F25_4]
