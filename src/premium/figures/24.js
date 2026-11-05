// Lesson 24's figures, as data. Every Tongan and English string is copied from
// book/Chapter-24.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Two choices and one drop earn a picture;
// pe, ʻo fuoloa, the mo Note and the Summary table read fine as the book prints them.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** A question about meaning: nothing in the row is ringed, the case goes straight to its lane. */
function joinCase(lane, first, form, second, say, en) {
  return {
    lane, say, en,
    row: [face(first, 'verb'), { slot: true, form: face(form, 'quiet') }, face(second, 'verb')],
  }
}

/** "Compare Haʻu pea kai": the same two verbs, and the speaker's view of them picks the word. */
export const F24_1 = {
  id: '24.1',
  kind: 'fork',
  types: ['fork'],
  title: 'Two separate steps, or one event?',
  after: { section: 'o-and-as-part-of-one-event', block: b => b.type === 'p' && b.text.startsWith('In each case') },
  lanes: [
    { label: 'Two separate steps', forms: ['pea'] },
    { label: 'One event', forms: ['ʻo'] },
  ],
  scenes: [
    {
      key: 'hau-kai',
      cases: [
        joinCase(0, 'Haʻu', 'pea', 'kai', 'Haʻu pea kai', 'come, and then eat'),
        joinCase(1, 'Haʻu', 'ʻo', 'kai', 'Haʻu ʻo kai.', 'Come and eat.'),
      ],
    },
    {
      key: 'mohe-alu',
      cases: [
        joinCase(0, 'Mohe', 'pea', 'ngāue', 'Mohe pea ngāue.', 'Sleep and then work.'),
        joinCase(1, 'ʻAlu', 'ʻo', 'ako', 'ʻAlu ʻo ako.', 'Go and study.'),
      ],
    },
  ],
  alt: [
    'Two separate steps: *pea*. *Haʻu pea kai* come, and then eat. *Mohe pea ngāue.* Sleep and then work.',
    'One event: *ʻo*. *Haʻu ʻo kai.* Come and eat. *ʻAlu ʻo ako.* Go and study.',
  ],
}

/** "Look at the word immediately after": the ring sits on that word, and it picks ka or kae. */
export const F24_2 = {
  id: '24.2',
  kind: 'fork',
  types: ['fork'],
  title: '*ka* or *kae*? Look at the next word',
  after: { section: 'ka-and-kae-but', block: b => b.type === 'p' && b.text.startsWith('The rule is straightforward') },
  lanes: [
    { label: 'Before a tense marker, a pronoun, or a preposition', forms: ['ka'] },
    { label: 'Before a verb, an adjective, or an adverb', forms: ['kae'] },
  ],
  scenes: [
    {
      key: 'tense-verb',
      cases: [
        {
          lane: 0,
          say: 'ʻOku ou saiʻia he hivá, ka ʻoku ʻikai té u saiʻia he ngāué.',
          en: "I like singing, but I don't like working.",
          row: [
            face('ʻOku ou saiʻia he hivá,', 'quiet'),
            { slot: true, form: face('ka', 'quiet') },
            { ...face('ʻoku', 'tense'), ring: true, label: 'tense marker' },
            face('ʻikai té u saiʻia he ngāué', 'quiet'),
          ],
        },
        {
          lane: 1,
          say: 'Naʻe ʻalu ʻa Sione kae nofo ʻa Mele.',
          en: 'Sione went but Mele stayed.',
          row: [
            face('Naʻe ʻalu ʻa Sione', 'quiet'),
            { slot: true, form: face('kae', 'quiet') },
            { ...face('nofo', 'verb'), ring: true, label: 'verb' },
            face('ʻa', 'focus'),
            face('Mele', 'noun'),
          ],
        },
      ],
    },
    {
      key: 'pronoun-stative',
      cases: [
        {
          lane: 0,
          say: 'ʻAlu koe, ka ke foki mai he fā.',
          en: 'Go, but come back at four.',
          row: [
            face('ʻAlu koe,', 'quiet'),
            { slot: true, form: face('ka', 'quiet') },
            { ...face('ke', 'pronoun'), ring: true, label: 'pronoun' },
            face('foki mai he fā', 'quiet'),
          ],
        },
        {
          lane: 1,
          say: 'Naʻe ʻalu ʻa Pita kae puke ʻa Tēvita.',
          en: 'Pita went but Tēvita was sick.',
          row: [
            face('Naʻe ʻalu ʻa Pita', 'quiet'),
            { slot: true, form: face('kae', 'quiet') },
            { ...face('puke', 'verb'), ring: true, label: 'stative' },
            face('ʻa', 'focus'),
            face('Tēvita', 'noun'),
          ],
        },
      ],
    },
  ],
  alt: [
    "Before a tense marker, a pronoun, or a preposition: *ka*. *ʻOku ou saiʻia he hivá, ka ʻoku ʻikai té u saiʻia he ngāué.* I like singing, but I don't like working. The next word is the tense marker *ʻoku*. *ʻAlu koe, ka ke foki mai he fā.* Go, but come back at four. The next word is the pronoun *ke*.",
    'Before a verb, an adjective, or an adverb: *kae*. *Naʻe ʻalu ʻa Sione kae nofo ʻa Mele.* Sione went but Mele stayed. The next word is the verb *nofo*. *Naʻe ʻalu ʻa Pita kae puke ʻa Tēvita.* Pita went but Tēvita was sick. The next word is the stative *puke*.',
  ],
}

/** The book's full form and standard form: the second té leaves, and pea takes the accent before u. */
export const F24_3 = {
  id: '24.3',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'With pronoun subjects, the tense marker after *pea* is often dropped',
  after: { section: 'dropping-the-tense-marker-after-pea', block: b => b.type === 'p' && b.text.startsWith('The meaning is the same') },
  scenes: [
    {
      key: 'ngaue',
      tiles: {
        first: [face('Té u ngāue,', 'quiet'), face('Té u ngāue', 'quiet')],
        pea: [face('pea', 'quiet'), face('peá', 'quiet')],
        te: [face('té', 'tense')],
        pron: [face('u', 'pronoun')],
        rest: [face('toe foki', 'quiet')],
      },
      before: { say: 'Té u ngāue, pea té u toe foki.', en: 'I will work, and then I will go back again.' },
      after: { say: 'Té u ngāue peá u toe foki.', en: 'I will work and then go back again.' },
      states: [
        [['first', 0], ['pea', 0], ['te', 0], ['pron', 0], ['rest', 0]],
        [['first', 0], ['pea', 0], ['GHOST'], ['pron', 0], ['rest', 0]],
        [['first', 1], ['pea', 1], ['GHOST'], ['pron', 0], ['rest', 0]],
      ],
      beats: [
        { kind: 'drop', tile: 'te', old: true, to: 1 },
        { kind: 'swap', tile: ['first', 'pea'], to: 2 },
        { kind: 'en' },
      ],
      alt: [
        '*Té u ngāue, pea té u toe foki.* I will work, and then I will go back again. becomes *Té u ngāue peá u toe foki.* I will work and then go back again.',
        'The tense marker in the second clause is dropped, and the pronoun follows *pea* directly.',
        'The meaning is the same. Before the one-syllable pronoun *u*, the stress shifts to the final vowel of *peá*.',
      ],
    },
  ],
}

/** The opening row in the hero: two verbs and the word that joins them. */
export const OPENING = {
  row: [face('Haʻu', 'verb'), face('ʻo', 'quiet', 'conjunction'), face('kai', 'verb')],
  say: 'Haʻu ʻo kai.',
  en: 'Come and eat.',
}

/** Recall cards, by key rule, in order: book sentences only. */
export const RECALL = [
  { to: 'Naʻá ku lotu peá u mohe.', en: 'I prayed and then I slept.' },
  { to: 'Haʻu ʻo kai.', en: 'Come and eat.' },
  { to: 'Naʻe ʻalu ʻa Sione kae nofo ʻa Mele.', en: 'Sione went but Mele stayed.' },
]

export const FIGURES = [F24_1, F24_2, F24_3]
