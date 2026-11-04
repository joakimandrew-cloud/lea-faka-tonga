// Lesson 15's figures, as data. Every Tongan string here is copied from
// book/Chapter-15.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. English glosses come from the same
// lines. Nothing is taken from chapters.json teaching.paradigm.
// Rich strings mark Tongan with *asterisks*; each one is drawn with data-tongan.

const face = (text, role) => ({ text, role })

export const F15_1 = {
  id: '15.1',
  kind: 'row',
  types: ['move', 'add', 'swap'],
  title: 'One name, three changes',
  // Straight under the book's numbered list, and its beats light that list.
  after: { section: 'noun-subjects-a-new-word-order', block: b => b.type === 'list' },
  linkList: true,
  scenes: [
    {
      key: 'sione',
      tiles: {
        tense: [face('Naʻá', 'tense'), face('Naʻe', 'tense')],
        subj: [face('ne', 'pronoun'), face('Sione', 'noun')],
        verb: [face('hiva', 'verb')],
        focus: [face('ʻa', 'focus')],
      },
      before: { say: 'Naʻá ne hiva.', en: 'He sang.' },
      after: { say: 'Naʻe hiva ʻa Sione.', en: 'Sione sang.' },
      states: [
        [['tense', 0], ['subj', 0], ['verb', 0]],
        [['tense', 0], ['GHOST'], ['verb', 0], ['subj', 1]],
        [['tense', 0], ['GHOST'], ['verb', 0], ['focus', 0], ['subj', 1]],
        [['tense', 1], ['GHOST'], ['verb', 0], ['focus', 0], ['subj', 1]],
      ],
      beats: [
        { kind: 'move', tile: 'subj', mark: 1, li: 0, arc: 'GHOST', to: 1 },
        { kind: 'add', tile: 'focus', mark: 2, li: 1, to: 2 },
        { kind: 'swap', tile: 'tense', mark: 3, li: 2, old: true, to: 3 },
        { kind: 'en' },
      ],
      alt: [
        '*Naʻá ne hiva.* He sang. becomes *Naʻe hiva ʻa Sione.* Sione sang.',
        'The noun moves after the verb.',
        'The marker *ʻa* appears before the noun.',
        'The tense marker changes from *naʻa* to *naʻe*.',
      ],
    },
    {
      key: 'tevita',
      tiles: {
        tense: [face('Té', 'tense'), face('ʻE', 'tense')],
        subj: [face('ne', 'pronoun'), face('Tēvita', 'noun')],
        verb: [face('hiva', 'verb')],
        focus: [face('ʻa', 'focus')],
      },
      before: { say: 'Té ne hiva.', en: 'He will sing.' },
      after: { say: 'ʻE hiva ʻa Tēvita.', en: 'Tēvita will sing.' },
      states: [
        [['tense', 0], ['subj', 0], ['verb', 0]],
        [['tense', 0], ['GHOST'], ['verb', 0], ['subj', 1]],
        [['tense', 0], ['GHOST'], ['verb', 0], ['focus', 0], ['subj', 1]],
        [['tense', 1], ['GHOST'], ['verb', 0], ['focus', 0], ['subj', 1]],
      ],
      beats: [
        { kind: 'move', tile: 'subj', mark: 1, li: 0, arc: 'GHOST', to: 1 },
        { kind: 'add', tile: 'focus', mark: 2, li: 1, to: 2 },
        { kind: 'swap', tile: 'tense', mark: 3, li: 2, old: true, to: 3 },
        { kind: 'en' },
      ],
      alt: [
        '*Té ne hiva.* He will sing. becomes *ʻE hiva ʻa Tēvita.* Tēvita will sing.',
        'The noun moves after the verb.',
        'The marker *ʻa* appears before the noun.',
        'The tense marker changes from *te* to *ʻe*.',
      ],
    },
  ],
}

export const F15_2 = {
  id: '15.2',
  kind: 'fork',
  types: ['fork'],
  title: 'Which tense marker? Look at the next word',
  // After the sentence beginning "The rule is", before the ʻoku and kuo paragraph.
  after: { section: 'why-the-tense-marker-changes-nae-and-e-with-noun-subjects', block: b => b.type === 'p' && b.text.startsWith('The rule is') },
  lanes: [
    { label: 'Right before a pronoun', forms: ['naʻa', 'te'] },
    { label: 'Everywhere else', forms: ['naʻe', 'ʻe'] },
  ],
  scenes: [
    {
      key: 'past',
      cases: [
        {
          lane: 0, say: 'Naʻá ku ʻalu.', en: 'I went.',
          row: [{ slot: true, form: face('Naʻá', 'tense'), label: 'tense' }, { ...face('ku', 'pronoun'), ring: true, label: 'pronoun' }, face('ʻalu', 'verb')],
        },
        {
          lane: 1, say: 'Naʻe ʻalu ʻa Sione.', en: 'Sione went.',
          row: [{ slot: true, form: face('Naʻe', 'tense'), label: 'tense' }, { ...face('ʻalu', 'verb'), ring: true, label: 'verb' }, face('ʻa', 'focus'), face('Sione', 'noun')],
        },
      ],
    },
    {
      key: 'future',
      cases: [
        {
          lane: 0, say: 'Té ke lea.', en: 'You will speak.',
          row: [{ slot: true, form: face('Té', 'tense'), label: 'tense' }, { ...face('ke', 'pronoun'), ring: true, label: 'pronoun' }, face('lea', 'verb')],
        },
        {
          lane: 1, say: 'ʻE lea ʻa Mele.', en: 'Mele will speak.',
          row: [{ slot: true, form: face('ʻE', 'tense'), label: 'tense' }, { ...face('lea', 'verb'), ring: true, label: 'verb' }, face('ʻa', 'focus'), face('Mele', 'noun')],
        },
      ],
    },
  ],
  alt: [
    'Right before a pronoun: *naʻa* and *te*. *Naʻá ku ʻalu.* I went. *Té ke lea.* You will speak.',
    'Everywhere else: *naʻe* and *ʻe*. *Naʻe ʻalu ʻa Sione.* Sione went. *ʻE lea ʻa Mele.* Mele will speak.',
    'In *Naʻá ku ʻalu.* the next word, *ku*, is a pronoun. In *Naʻe ʻalu ʻa Sione.* the next word, *ʻalu*, is not.',
  ],
}

export const F15_3 = {
  id: '15.3',
  kind: 'row',
  types: ['add'],
  title: 'The pronoun *ne* leaves',
  // E46's place: after the section's table, before the Note.
  after: { section: 'dropping-the-third-person-pronoun', block: b => b.type === 'table' },
  limit: {
    row: [face('naʻá', 'tense'), { ...face('ku', 'pronoun'), ring: true }, face('ʻalu', 'verb')],
    en: 'I went',
    caption: 'Third person only. First and second person stay.',
  },
  scenes: [
    dropScene('oku', 'ʻOkú', 'ʻOku', 'ʻalu', 'Sione', 'ʻOkú ne ʻalu.', 'He is going.', 'ʻOku ʻalu ʻa Sione.', 'Sione is going.'),
    dropScene('naa', 'Naʻá', 'Naʻe', 'mohe', 'Pita', 'Naʻá ne mohe.', 'He slept.', 'Naʻe mohe ʻa Pita.', 'Pita slept.'),
    dropScene('kuo', 'Kuó', 'Kuo', 'hiva', 'Tēvita', 'Kuó ne hiva.', 'He has sung.', 'Kuo hiva ʻa Tēvita.', 'Tēvita has sung.'),
  ],
}

function dropScene(key, a, b, verb, noun, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      tense: [face(a, 'tense'), face(b, 'tense')],
      pron: [face('ne', 'pronoun')],
      verb: [face(verb, 'verb')],
      focus: [face('ʻa', 'focus')],
      noun: [face(noun, 'noun')],
    },
    before: { say: sayA, en: enA },
    after: { say: sayB, en: enB },
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0]],
      [['tense', 0], ['GHOST'], ['verb', 0]],
      [['tense', 1], ['GHOST'], ['verb', 0], ['focus', 0], ['noun', 0]],
    ],
    beats: [
      { kind: 'drop', tile: 'pron', mark: 1, to: 1 },
      { kind: 'add', tile: ['focus', 'noun'], to: 2, roll: 'tense' },
      { kind: 'en' },
      { kind: 'limit' },
    ],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      '*ne* leaves.',
      '*ku* stays: *naʻá ku ʻalu*. Third person only. First and second person stay.',
    ],
  }
}

export const F15_4 = {
  id: '15.4',
  kind: 'row',
  types: ['add'],
  title: 'Nothing in the subject slot',
  after: { section: 'weather-and-impersonal-expressions', block: b => b.type === 'p' && b.text.includes('These are called impersonal verbs') },
  scenes: [
    absentScene('uha', 'Naʻe', 'ʻuha', 'Naʻe ʻuha.', 'It rained.'),
    absentScene('laa', 'ʻOku', 'lāʻā', 'ʻOku lāʻā.', 'It is sunny.'),
  ],
}

function absentScene(key, tense, verb, say, en) {
  return {
    key,
    tiles: { tense: [face(tense, 'tense')], verb: [face(verb, 'verb')] },
    before: null,
    after: { say, en },
    states: [[['tense', 0], ['verb', 0], ['SLOT']]],
    beats: [
      { kind: 'slot' },
      { kind: 'en' },
      { kind: 'line' },
    ],
    enFirstWord: 'It',
    alt: [`*${say}* ${en} There is no subject in the Tongan, and nothing there answers to the English "It".`],
  }
}

export const F15_5 = {
  id: '15.5',
  kind: 'row',
  types: ['move'],
  title: 'The question word slots in',
  after: { section: 'questions-with-noun-subjects', block: b => b.type === 'p' && b.text.startsWith('In statements, the noun subject follows') },
  scenes: [
    questionScene('ana', 'ʻOku', 'nofo', 'ʻa ʻAna', 'ʻi ʻapi', 'ʻi fē', 'ʻOku nofo ʻa ʻAna ʻi ʻapi.', 'ʻAna lives at home.', 'ʻOku nofo ʻi fē ʻa ʻAna?', 'Where does ʻAna live?'),
    questionScene('tevita', 'Naʻe', 'ʻalu', 'ʻa Tēvita', 'ki ʻapi', 'ki fē', 'Naʻe ʻalu ʻa Tēvita ki ʻapi.', 'Tēvita went home.', 'Naʻe ʻalu ki fē ʻa Tēvita?', 'Where did Tēvita go?'),
  ],
}

function questionScene(key, tense, verb, subj, place, ask, sayA, enA, sayB, enB) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      verb: [face(verb, 'verb')],
      subj: [face(subj, 'noun')],
      place: [face(place, 'place'), face(ask, 'question')],
    },
    before: { say: sayA, en: enA },
    after: { say: sayB, en: enB },
    states: [
      [['tense', 0], ['verb', 0], ['subj', 0], ['place', 0]],
      [['tense', 0], ['verb', 0], ['subj', 0], ['place', 1]],
      [['tense', 0], ['verb', 0], ['place', 1], ['subj', 0]],
    ],
    beats: [
      { kind: 'swap', tile: 'place', to: 1 },
      { kind: 'move', tile: 'place', mark: 1, arc: 'origin', to: 2 },
      { kind: 'en' },
    ],
    alt: [
      `*${sayA}* ${enA} becomes *${sayB}* ${enB}`,
      'The question word slots in between the verb and the noun subject, pushing the subject to the end.',
    ],
  }
}

export const F15_6 = {
  id: '15.6',
  kind: 'fork',
  types: ['fork'],
  title: '*ʻikai te* or *ʻikai ke*?',
  after: { section: 'negation-with-noun-subjects-ikai-ke', block: b => b.type === 'p' && b.text.startsWith('The key distinction') },
  lanes: [
    { label: 'Pronoun subject', forms: ['ʻikai te'] },
    { label: 'Noun subject', forms: ['ʻikai ke'] },
  ],
  scenes: [
    {
      key: 'sione',
      cases: [
        {
          lane: 0, say: 'Naʻe ʻikai té u ʻalu.', en: 'I did not go.',
          row: [face('Naʻe', 'tense'), { slot: true, form: face('ʻikai té', 'quiet') }, { ...face('u', 'pronoun'), ring: true, label: 'pronoun' }, face('ʻalu', 'verb')],
        },
        {
          lane: 1, say: 'Naʻe ʻikai ke ʻalu ʻa Sione.', en: 'Sione did not go.',
          row: [face('Naʻe', 'tense'), { slot: true, form: face('ʻikai ke', 'quiet') }, face('ʻalu', 'verb'), face('ʻa', 'focus'), { ...face('Sione', 'noun'), ring: true, label: 'noun' }],
        },
      ],
    },
    {
      key: 'pita',
      cases: [
        {
          lane: 0, say: 'Naʻe ʻikai té u ʻalu.', en: 'I did not go.',
          row: [face('Naʻe', 'tense'), { slot: true, form: face('ʻikai té', 'quiet') }, { ...face('u', 'pronoun'), ring: true, label: 'pronoun' }, face('ʻalu', 'verb')],
        },
        {
          lane: 1, say: 'ʻOku ʻikai ke puke ʻa Pita.', en: 'Pita is not sick.',
          row: [face('ʻOku', 'tense'), { slot: true, form: face('ʻikai ke', 'quiet') }, face('puke', 'verb'), face('ʻa', 'focus'), { ...face('Pita', 'noun'), ring: true, label: 'noun' }],
        },
      ],
    },
  ],
  alt: [
    'Pronoun subject: *ʻikai te*. *Naʻe ʻikai té u ʻalu.* I did not go.',
    'Noun subject: *ʻikai ke*. *Naʻe ʻikai ke ʻalu ʻa Sione.* Sione did not go. *ʻOku ʻikai ke puke ʻa Pita.* Pita is not sick.',
  ],
}

export const F15_7 = {
  id: '15.7',
  kind: 'grid',
  types: ['grid'],
  title: 'All four tenses, side by side',
  after: { section: 'the-full-pattern', block: b => b.type === 'table' },
  head: ['Tense', 'Pronoun subject (3sg)', 'Noun subject'],
  rows: [
    { tense: 'Present', tag: 'One form', cells: [cell('ʻOkú', ' ne ʻalu.', 'He is going.'), cell('ʻOku', ' ʻalu ʻa Sione.', 'Sione is going.')] },
    { tense: 'Perfect', tag: 'One form', cells: [cell('Kuó', ' ne ʻalu.', 'He has gone.'), cell('Kuo', ' ʻalu ʻa Sione.', 'Sione has gone.')] },
    { tense: 'Past', tag: 'Changes form', cells: [cell('Naʻá', ' ne ʻalu.', 'He went.'), cell('Naʻe', ' ʻalu ʻa Sione.', 'Sione went.')] },
    { tense: 'Future', tag: 'Changes form', cells: [cell('Té', ' ne ʻalu.', 'He will go.'), cell('ʻE', ' ʻalu ʻa Sione.', 'Sione will go.')] },
  ],
  rest: { row: 2, col: 1 },
  caption: 'The accent on *ʻOkú* and *Kuó* marks stress before *ne* (Lesson 2).',
  scenes: [{ key: 'grid' }],
}

function cell(marker, rest, en) {
  return { marker, rest, say: `${marker}${rest}`, en }
}

/** The opening row in the hero: a still, with labels. */
export const OPENING_15 = {
  row: [face('Naʻe', 'tense'), face('hiva', 'verb'), face('ʻa', 'focus'), face('Sione', 'noun')],
  say: 'Naʻe hiva ʻa Sione.',
  en: 'Sione sang.',
}

export const FIGURES_15 = [F15_1, F15_2, F15_3, F15_4, F15_5, F15_6, F15_7]
