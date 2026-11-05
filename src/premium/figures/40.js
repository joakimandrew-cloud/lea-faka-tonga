// Lesson 40's figures, as data. Every Tongan and English string is copied from
// book/Chapter-40.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept.
// One figure only. The eight spatial-noun sections are each a definition with examples, and the
// summary table already lines the eight up, so a Swap of the spatial noun would repeat it. The
// lalo/lolo Note prints both forms side by side with one English line. The person rule is the
// one choice the reader would otherwise rebuild by comparing three example blocks.
// Book conflict, flagged rather than drawn: the rule says *ʻia* before a proper name, but the
// tafaʻaki section prints *Nofo hifo he tafaʻaki ʻo Tēvita!* and Exercise 4's model and answer 1
// use *ʻo* before Tēvita and Sione. The Fork uses only the book's own rule examples.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

function personCase(lane, prep, spatial, form, noun, nounLabel, say, en) {
  return {
    lane, say, en,
    row: [
      face(prep, 'quiet'),
      face(spatial, 'quiet', 'spatial noun'),
      { slot: true, form: face(form, 'quiet', 'preposition'), label: true },
      { ...face(noun, 'quiet', nounLabel), ring: true },
    ],
  }
}

/** The book's rule: with people, a preposition goes between, chosen by what follows. */
export const F40_1 = {
  id: '40.1',
  kind: 'fork',
  types: ['fork'],
  title: 'With people, insert *ʻo* or *ʻia*',
  after: { section: 'spatial-nouns-with-people', block: b => b.type === 'p' && b.text.startsWith('The rule:') },
  lanes: [
    { label: 'Before a common noun with its article', forms: ['ʻo'] },
    { label: 'Before a proper name', forms: ['ʻia'] },
  ],
  scenes: [
    {
      key: 'fefine',
      cases: [
        personCase(0, 'ʻi he', 'tuʻa', 'ʻo', 'e fefiné', 'common noun', 'ʻi he tuʻa ʻo e fefiné', 'behind the woman'),
        personCase(1, 'ki', 'muʻa', 'ʻia', 'Sione', 'proper name', 'ki muʻa ʻia Sione', 'ahead of Sione'),
      ],
    },
    {
      key: 'faee',
      cases: [
        personCase(0, 'ʻi he', 'funga', 'ʻo', 'ʻene faʻeé', 'common noun', 'ʻi he funga ʻo ʻene faʻeé', 'on his mother\'s lap'),
      ],
    },
  ],
  alt: [
    'With things, the spatial noun goes directly before the noun: *ʻi he lalo tēpilé*, under the table.',
    'With people, insert *ʻo* before a common noun with its article: *ʻi he tuʻa ʻo e fefiné*, behind the woman. *ʻi he funga ʻo ʻene faʻeé*, on his mother\'s lap.',
    'Before a proper name, insert *ʻia*: *ki muʻa ʻia Sione*, ahead of Sione.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Tuku', 'verb'), face('he', 'quiet'), face('funga', 'quiet', 'spatial noun'), face('katō', 'quiet', 'noun')],
  say: 'Tuku he funga katō!',
  en: 'Put it on top of the basket.',
}

/** Recall cards, by key rule: book lines only. Rule 3's card avoids the ʻo Tēvita sentence. */
export const RECALL = [
  { to: 'Naʻe tuku ʻa e helé ʻi loto falé.', en: 'The knife was put inside the house.' },
  { to: 'ʻOku tuku ʻa e tohí he funga tēpilé.', en: 'The book is placed on top of the table.' },
  { to: 'ʻi he tuʻa ʻo e fefiné', en: 'behind the woman' },
]

export const FIGURES = [F40_1]
