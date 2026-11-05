// Lesson 34's figures, as data. Every Tongan and English string is copied from
// book/Chapter-34.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Labels use the book's own words.
// No figure for Ko ia or Tā: each is a definition with examples, and the examples
// already show it. The adverb pehē is taught in F34_4, after its transitive form.

const face = (text, role, label) => ({ text, role, ...(label != null ? { label } : {}) })

function noThatScene(key, tense, pron, verb, rest, say, en) {
  return {
    key,
    tiles: {
      tense: [face(tense, 'tense')],
      pron: [face(pron, 'pronoun')],
      verb: [face(verb, 'verb')],
      rest: [face(rest, 'quiet', 'second clause')],
    },
    before: null,
    after: { say, en },
    // The gap between the clauses, named in the book's words ("There is no word for \"that\"").
    slotLabel: 'no "that"',
    states: [
      [['tense', 0], ['pron', 0], ['verb', 0], ['SLOT']],
      [['tense', 0], ['pron', 0], ['verb', 0], ['SLOT'], ['rest', 0]],
    ],
    beats: [
      { kind: 'slot' },
      { kind: 'add', tile: 'rest', to: 1 },
      { kind: 'en' },
    ],
    alt: [`*${say}* ${en} There is no word for "that" between the two clauses. The two clauses sit side by side.`],
  }
}

export const F34_1 = {
  id: '34.1',
  kind: 'row',
  types: ['add'],
  title: 'No word for "that" between the two clauses',
  after: { section: 'reporting-what-you-hear-know-or-believe', block: b => b.type === 'p' && b.text.startsWith('There is no word for') },
  scenes: [
    noThatScene('fanongo', 'ʻOku', 'ou', 'fanongo', 'ko e kolō lelei ʻa Nukuʻalofa', 'ʻOku ou fanongo ko e kolō lelei ʻa Nukuʻalofa.', 'I hear that Nukuʻalofa is a good town.'),
    noThatScene('ilo', 'Naʻá', 'ku', 'ʻilo', 'ʻe tōmui ʻa Seini', 'Naʻá ku ʻilo ʻe tōmui ʻa Seini.', 'I knew that Seini would be late.'),
  ],
}

function ownTenseScene(key, rest, say, en) {
  return {
    key,
    tiles: {
      past: [face('Naʻá', 'tense', 'past tense')],
      pron: [face('ku', 'pronoun')],
      verb: [face('ʻilo', 'verb')],
      future: [face('ʻe', 'tense', 'future')],
      rest: [face(rest, 'quiet', '')],
    },
    before: null,
    after: { say, en },
    states: [
      [['past', 0], ['pron', 0], ['verb', 0]],
      [['past', 0], ['pron', 0], ['verb', 0], ['future', 0], ['rest', 0]],
    ],
    beats: [
      { kind: 'add', tile: ['future', 'rest'], to: 1 },
      { kind: 'en' },
    ],
    alt: [`*${say}* ${en} The second clause keeps its own tense marker. If someone thought something would happen in the future, the future marker *ʻe* stays, even if the first clause is past tense.`],
  }
}

export const F34_2 = {
  id: '34.2',
  kind: 'row',
  types: ['add'],
  title: 'The second clause keeps its own tense marker',
  after: { section: 'reporting-what-you-hear-know-or-believe', block: b => b.type === 'note' || (b.type === 'p' && b.text.includes('keeps its own tense marker')) },
  scenes: [
    ownTenseScene('mele', 'foki ʻa Mele', 'Naʻá ku ʻilo ʻe foki ʻa Mele.', 'I knew Mele would return.'),
    ownTenseScene('seini', 'tōmui ʻa Seini', 'Naʻá ku ʻilo ʻe tōmui ʻa Seini.', 'I knew that Seini would be late.'),
  ],
}

export const F34_3 = {
  id: '34.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Where the speaker goes',
  after: { section: 'pehe-to-say-to-think', block: b => b.type === 'table' },
  lanes: [
    { label: 'Pronoun', forms: ['ou', 'ke'] },
    { label: 'Name', forms: ['ʻe'] },
    { label: 'Common noun', forms: ['ʻe he'] },
  ],
  scenes: [
    {
      key: 'pronoun-name',
      cases: [
        {
          lane: 0, say: 'ʻOku ou pehē ʻe ʻalu ʻa Sione.', en: 'I think Sione will go.',
          row: [face('ʻOku', 'tense'), { slot: true, form: face('ou', 'pronoun'), label: 'pronoun' }, face('pehē', 'verb'), face('ʻe ʻalu ʻa Sione', 'quiet')],
        },
        {
          lane: 1, say: 'Naʻe pehē ʻe Siale ʻe ngāue ʻa Mele.', en: 'Siale said Mele would work.',
          row: [face('Naʻe', 'tense'), face('pehē', 'verb'), { slot: true, form: face('ʻe', 'quiet') }, { ...face('Siale', 'noun'), ring: true, label: 'name' }, face('ʻe ngāue ʻa Mele', 'quiet')],
        },
      ],
    },
    {
      key: 'noun-pronoun',
      cases: [
        {
          lane: 2, say: 'ʻOku pehē ʻe he faiakō té ke nofo.', en: 'The teacher thinks you will stay.',
          row: [face('ʻOku', 'tense'), face('pehē', 'verb'), { slot: true, form: face('ʻe he', 'quiet') }, { ...face('faiakō', 'noun'), ring: true, label: 'common noun' }, face('té ke nofo', 'quiet')],
        },
        {
          lane: 0, say: 'ʻOkú ke pehē té ke helaʻia ʻi Fisi?', en: 'Do you think you will be tired in Fiji?',
          row: [face('ʻOkú', 'tense'), { slot: true, form: face('ke', 'pronoun'), label: 'pronoun' }, face('pehē', 'verb'), face('té ke helaʻia ʻi Fisi', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    'Pronoun: tense marker, pronoun, *pehē*, content. *ʻOku ou pehē ʻe ʻalu ʻa Sione.* I think Sione will go. *ʻOkú ke pehē té ke helaʻia ʻi Fisi?* Do you think you will be tired in Fiji?',
    'Name: tense marker, *pehē*, *ʻe*, name, content. *Naʻe pehē ʻe Siale ʻe ngāue ʻa Mele.* Siale said Mele would work.',
    'Common noun: tense marker, *pehē*, *ʻe he*, noun, content. *ʻOku pehē ʻe he faiakō té ke nofo.* The teacher thinks you will stay.',
  ],
}

export const F34_4 = {
  id: '34.4',
  kind: 'fork',
  types: ['fork'],
  title: 'Which meaning? *pehē* or *peheʻi*',
  // After the last examples of the peheʻi section: all three uses have now been met.
  after: { section: 'pehei-to-do-or-treat-in-this-way', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('Tuku pehe')) },
  lanes: [
    { label: 'to say, to think', forms: ['pehē'] },
    { label: 'thus, like this, like that', forms: ['pehē'] },
    { label: 'to do or treat in this way', forms: ['peheʻi'] },
  ],
  scenes: [
    {
      key: 'nae-pehe',
      cases: [
        {
          lane: 0, say: 'Naʻe pehē ʻe Tēvita ʻe foki ʻa Mele.', en: 'Tēvita thought Mele would return.',
          row: [face('Naʻe', 'tense'), { slot: true, form: face('pehē', 'verb'), label: 'verb' }, face('ʻe', 'quiet'), face('Tēvita', 'noun'), face('ʻe foki ʻa Mele', 'quiet')],
        },
        {
          lane: 1, say: 'Naʻe pehē pē mei he kamataʻangá.', en: 'It was that way from the beginning.',
          row: [face('Naʻe', 'tense'), { slot: true, form: face('pehē', 'particle'), label: 'adverb' }, face('pē mei he kamataʻangá', 'quiet')],
        },
      ],
    },
    {
      key: 'oua',
      cases: [
        {
          lane: 1, say: 'ʻOua té ke lea pehē.', en: 'Do not talk like that.',
          row: [face('ʻOua té ke', 'quiet'), face('lea', 'verb'), { slot: true, form: face('pehē', 'particle'), label: 'adverb' }],
        },
        {
          lane: 2, say: 'ʻOua té ke peheʻi ʻa e fefiné!', en: 'Do not treat the woman that way.',
          row: [face('ʻOua té ke', 'quiet'), { slot: true, form: face('peheʻi', 'verb'), label: 'transitive form' }, face('ʻa e fefiné', 'quiet')],
        },
      ],
    },
    {
      // Book line 105: peheʻi often appears in commands. A meaning question rings nothing.
      // R10: each lane form keeps one role. Lane 1 pehē (adverb, line 73 'describes the manner of an action')
      // is `particle` (R2, goes with the verb); lane 2 peheʻi is `verb` everywhere (line 93, 'to do in this way').
      key: 'commands',
      cases: [
        {
          lane: 2, say: 'Tō peheʻi!', en: 'Plant it this way.',
          row: [face('Tō', 'verb'), { slot: true, form: face('peheʻi', 'verb'), label: 'transitive form' }],
        },
        {
          lane: 2, say: 'Tuku peheʻi pē ia!', en: 'Leave it the way it is.',
          row: [face('Tuku', 'verb'), { slot: true, form: face('peheʻi', 'verb'), label: 'transitive form' }, face('pē ia', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    'To say, to think: *pehē*. *Naʻe pehē ʻe Tēvita ʻe foki ʻa Mele.* Tēvita thought Mele would return.',
    'Thus, like this, like that: *pehē*. *Naʻe pehē pē mei he kamataʻangá.* It was that way from the beginning. *ʻOua té ke lea pehē.* Do not talk like that.',
    'To do or treat in this way: *peheʻi*. *ʻOua té ke peheʻi ʻa e fefiné!* Do not treat the woman that way. *Peheʻi* often appears in commands, telling someone to do a task in a particular way: *Tō peheʻi!* Plant it this way. *Tuku peheʻi pē ia!* Leave it the way it is.',
  ],
}

export const F34_5 = {
  id: '34.5',
  kind: 'fork',
  types: ['fork'],
  title: 'Where *tokua* sits, and how much it colours',
  after: { section: 'tokua-they-say-it-is-said', block: b => b.type === 'p' && b.text.includes('colours the whole sentence') },
  lanes: [
    { label: 'At the start: the whole sentence', forms: ['Tokua'] },
    { label: 'After the verb: only that clause', forms: ['tokua'] },
  ],
  scenes: [
    {
      key: 'tokua',
      cases: [
        {
          lane: 0, say: 'Tokua kuo foki ʻa Sione ki Fisi.', en: 'It is said that Sione has returned to Fiji.',
          row: [{ slot: true, form: face('Tokua', 'quiet'), label: 'reportative word' }, face('kuo', 'tense'), face('foki', 'verb'), face('ʻa Sione', 'noun'), face('ki Fisi', 'place')],
        },
        {
          lane: 1, say: 'ʻOku nofo tokua ʻi Haʻapai.', en: 'She lives, so they say, in Haʻapai.',
          row: [face('ʻOku', 'tense'), { ...face('nofo', 'verb'), ring: true, label: 'verb' }, { slot: true, form: face('tokua', 'quiet'), label: 'reportative word' }, face('ʻi Haʻapai', 'place')],
        },
      ],
    },
  ],
  alt: [
    'At the start, *tokua* colours the whole sentence as secondhand information. *Tokua kuo foki ʻa Sione ki Fisi.* It is said that Sione has returned to Fiji.',
    'After the verb, it colours only that clause. *ʻOku nofo tokua ʻi Haʻapai.* She lives, so they say, in Haʻapai.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Naʻe', 'tense'), face('pehē', 'verb'), face('ʻe', 'quiet', '*ʻe* phrase'), face('Tēvita', 'noun', 'speaker'), face('ʻe foki ʻa Mele', 'quiet', 'reported content')],
  say: 'Naʻe pehē ʻe Tēvita ʻe foki ʻa Mele.',
  en: 'Tēvita thought Mele would return.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku ou fanongo ko e kolō lelei ʻa Nukuʻalofa.', en: 'I hear that Nukuʻalofa is a good town.' },
  { to: 'Naʻe pehē ʻe Tēvita ʻe foki ʻa Mele.', en: 'Tēvita thought Mele would return.' },
  { to: 'Tokua kuo foki ʻa Sione ki Fisi.', en: 'It is said that Sione has returned to Fiji.' },
]

export const FIGURES = [F34_1, F34_2, F34_3, F34_4, F34_5]
