// Lesson 42's figures, as data. Every Tongan string here is copied from
// book/Chapter-42.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. English glosses come from the same
// lines. Nothing is taken from chapters.json teaching.paradigm.

const face = (text, role, label) => (label === undefined ? { text, role } : { text, role, label })

/** Days keep he and drop ʻi; months keep ʻi and drop he. The book's two sentences, side by side. */
export const F42_1 = {
  id: '42.1',
  kind: 'fork',
  types: ['fork'],
  title: 'A day of the week takes *he*, a month takes *ʻi*',
  // After the month sentences, so the day sentence above and the month sentences meet in one picture.
  after: { section: 'months-with-i', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('Nōvema')) },
  lanes: [
    { label: 'A day of the week', forms: ['he'] },
    { label: 'A month', forms: ['ʻi'] },
  ],
  scenes: [
    {
      key: 'day-month',
      cases: [
        {
          lane: 0, say: 'Té u ʻalu he Mōnite kahaʻú.', en: 'I will go next Monday.',
          row: [
            face('Té', 'tense'), face('u', 'pronoun'), face('ʻalu', 'verb'),
            { slot: true, form: face('he', 'quiet'), label: 'article' },
            { ...face('Mōnite kahaʻú', 'quiet'), ring: true, label: 'day' },
          ],
        },
        {
          lane: 1, say: 'Naʻá ku haʻu ʻi Maʻasi.', en: 'I came in March.',
          row: [
            face('Naʻá', 'tense'), face('ku', 'pronoun'), face('haʻu', 'verb'),
            { slot: true, form: face('ʻi', 'quiet'), label: 'preposition' },
            { ...face('Maʻasi', 'quiet'), ring: true, label: 'month' },
          ],
        },
      ],
    },
  ],
  alt: [
    'With days of the week, the preposition *ʻi* drops and the article *he* stands alone: *Té u ʻalu he Mōnite kahaʻú.* I will go next Monday.',
    'With months, the article *he* drops, and *ʻi* stands alone: *Naʻá ku haʻu ʻi Maʻasi.* I came in March.',
  ],
}

/** Fuofua against ʻuluaki: a question about meaning, so nothing is ringed. */
export const F42_2 = {
  id: '42.2',
  kind: 'fork',
  types: ['fork'],
  title: 'A first-ever event, or first in a series',
  after: { section: 'fuofua-and-fua-first-initial', block: b => b.type === 'p' && b.text.includes('first-ever') },
  lanes: [
    { label: 'First-ever, a new event', forms: ['fuofua'] },
    { label: 'First in a series', forms: ['ʻuluaki'] },
  ],
  scenes: [
    {
      key: 'fakataha',
      cases: [
        {
          lane: 0, say: 'Ko e fuofua fakataha', en: 'the first-ever meeting',
          row: [face('Ko e', 'quiet'), { slot: true, form: face('fuofua', 'quiet'), label: 'first' }, face('fakataha', 'quiet')],
        },
        {
          lane: 1, say: 'ko e ʻuluaki fakataha', en: 'the first meeting',
          row: [face('ko e', 'quiet'), { slot: true, form: face('ʻuluaki', 'quiet'), label: 'first' }, face('fakataha', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    '*Ko e fuofua fakataha* means the first-ever meeting, emphasising that this is a new event.',
    '*ko e ʻuluaki fakataha* means the first meeting, in a series, with a second and third to follow.',
  ],
}

export const OPENING = {
  row: [face('Naʻá', 'tense'), face('ku', 'pronoun'), face('haʻu', 'verb'), face('ʻi', 'quiet', 'preposition'), face('Maʻasi', 'quiet', 'month')],
  say: 'Naʻá ku haʻu ʻi Maʻasi.',
  en: 'I came in March.',
}

/** Recall cards, by key rule and in key-rule order: the page pairs card i with rule i. The first key rule
 *  (asking a name) has no sentence in this lesson, so index 0 is null and gets no card. */
export const RECALL = [
  null,
  { to: 'Naʻá ku haʻu ʻi Maʻasi.', en: 'I came in March.' },
  { to: 'Talu hoʻo haʻú mo ʻene momoko.', en: 'Ever since you came, it has been cold.' },
  { to: 'Ko hono tolu ʻo e himí.', en: 'The third hymn.' },
]

export const FIGURES = [F42_1, F42_2]
