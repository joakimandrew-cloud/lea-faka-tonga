// Lesson 43's figures, as data. Every Tongan and English string is copied from
// book/Chapter-43.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept.
// No figure for taʻe- before a noun, a verb or a phrase (definitions with examples; the
// book's base-word table already shows the pairs), the double negative (no book sentence
// shows the half without taʻe, so a tile row would have to invent one), talaʻehai and
// koloto (meanings with examples), the summary table, Words to Learn or Exercises.

const face = (text, role, label) => ({ text, role, ...(label !== undefined ? { label } : {}) })

function swapScene(key, tense, base, rest, ikai, tae, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      neg: [face('ʻikai ke', 'quiet', ''), face('taʻe', 'particle', 'prefix')],
      base: [face(base, 'verb', 'base word')],
      ...rest.tiles,
    },
    before: null,
    after: null,
    lines: [{ say: ikai, en }, { say: tae, en }],
    states: [
      [['tense', 0], ['neg', 0], ['base', 0], ...rest.state],
      [['tense', 0], ['neg', 1], ['base', 0], ...rest.state],
    ],
    beats: [{ kind: 'swap', tile: 'neg', to: 1 }],
    alt: [
      `*${ikai}* becomes *${tae}* ${en}`,
      '*ʻIkai* is a separate word that fits between the tense marker and the verb, using *ke* or *te* as a link. *Taʻe-* attaches directly to the word it negates.',
    ],
  }
}

/** The book's comparison table, read as one slot changing: ʻikai ke out, taʻe in. */
export const F43_1 = {
  id: '43.1',
  kind: 'row',
  types: ['swap'],
  title: '*taʻe* in place of *ʻikai ke*',
  after: { section: 'the-prefix-tae', block: b => b.type === 'p' && b.text.startsWith('Both') },
  scenes: [
    swapScene('tokanga', 'ʻOku', 'tokanga',
      { tiles: { focus: [face('ʻa', 'focus')], noun: [face('Sione', 'noun', 'noun')] }, state: [['focus', 0], ['noun', 0]] },
      'ʻOku ʻikai ke tokanga ʻa Sione.', 'ʻOku taʻe tokanga ʻa Sione.', 'Sione is inattentive.'),
    swapScene('feunga', 'Naʻe', 'feʻunga',
      { tiles: { rest: [face('ʻene ngāué', 'quiet')] }, state: [['rest', 0]] },
      'Naʻe ʻikai ke feʻunga ʻene ngāué.', 'Naʻe taʻe feʻunga ʻene ngāué.', 'His work was inadequate.'),
  ],
}

/** The book's rule: a noun subject after the verb takes neʻineʻi, a preposed pronoun neʻineʻi te. */
export const F43_2 = {
  id: '43.2',
  kind: 'fork',
  types: ['fork'],
  title: '*neʻineʻi* or *neʻineʻi te*? Look at the subject',
  after: { section: 'neinei-no-wonder', block: b => b.type === 'p' && b.text.includes('preposed pronoun') },
  lanes: [
    { label: 'A noun placed after the verb', forms: ['neʻineʻi'] },
    { label: 'A preposed pronoun', forms: ['neʻineʻi te'] },
  ],
  scenes: [
    {
      key: 'neinei',
      cases: [
        {
          lane: 0, say: 'Neʻineʻi hola ʻa Mele ia.', en: 'No wonder Mele ran away.',
          row: [
            { slot: true, form: face('Neʻineʻi', 'tense', 'no wonder'), label: 'no wonder' },
            face('hola', 'verb'), face('ʻa', 'focus'),
            { ...face('Mele', 'noun'), ring: true, label: 'noun' },
            face('ia', 'quiet', ''),
          ],
        },
        {
          lane: 1, say: 'Neʻineʻi te nau fiefia', en: 'No wonder they were glad',
          row: [
            { slot: true, form: face('Neʻineʻi te', 'tense', 'no wonder'), label: 'no wonder' },
            { ...face('nau', 'pronoun'), ring: true, label: 'pronoun' },
            face('fiefia', 'verb'),
          ],
        },
      ],
    },
  ],
  alt: [
    '*Neʻineʻi* replaces the tense marker at the beginning of its clause.',
    'When the subject is a noun placed after the verb, the verb follows directly after *neʻineʻi*: *Neʻineʻi hola ʻa Mele ia.* No wonder Mele ran away.',
    'When the subject is a preposed pronoun, the form becomes *neʻineʻi te*: *Neʻineʻi te nau fiefia*, No wonder they were glad.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('taʻe', 'particle', 'prefix'), face('mahino', 'verb', 'base word'), face('ʻenau leá', 'quiet')],
  say: 'ʻOku taʻe mahino ʻenau leá.',
  en: 'Their speech is unintelligible.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku ngāue taʻe totongi ʻa Sēmisi.', en: 'Sēmisi is working without pay.' },
  { to: 'ʻOku taʻe feʻunga ʻene ngāué.', en: 'His work is inadequate.' },
  { to: 'ʻE ʻikai té u taʻe fai e ngāué ni.', en: 'I will certainly do this work.' },
  { to: 'Neʻineʻi tangi ʻa Seini he naʻe puké.', en: 'No wonder Seini cried, she was sick.' },
]

export const FIGURES = [F43_1, F43_2]
