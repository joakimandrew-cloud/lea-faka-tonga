// Lesson 38's figures, as data. Every Tongan and English string is copied from
// book/Chapter-38.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Note ké before a one-syllable pronoun, and
// teliá against telia, each as the book prints it.
// No figure in the warning section (38.3 carries its position rule, after the table in the
// next section), in the telia naʻa section (same meaning as naʻa, and the book prints no
// one sentence both ways), or for Words to Learn and Exercises.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The book's line: when a pronoun follows ke, the verb comes after the pronoun. Each scene adds
 *  only the pronoun, one singular and one plural, so number is not the cause. ke takes its accent
 *  before the one-syllable ke, as the book prints it. */
function permitScene(key, rest, pron, accent, say, en) {
  return {
    key,
    tiles: {
      tuku: accent ? [face('Tuku ke', 'quiet'), face('Tuku ké', 'quiet')] : [face('Tuku ke', 'quiet')],
      pron: [face(pron, 'pronoun')],
      verb: [face(rest[0], 'verb')],
      rest: [face(rest[1], rest[2])],
    },
    before: null,
    after: { say, en },
    states: [
      [['tuku', 0], ['verb', 0], ['rest', 0]],
      [['tuku', accent ? 1 : 0], ['pron', 0], ['verb', 0], ['rest', 0]],
    ],
    beats: [{ kind: 'add', tile: 'pron', ...(accent ? { roll: 'tuku' } : {}), to: 1 }, { kind: 'en' }],
    alt: [`When a pronoun follows *ke*, the verb comes after the pronoun: *${say}* ${en}`],
  }
}

export const F38_1 = {
  id: '38.1',
  kind: 'row',
  types: ['add'],
  title: 'When a pronoun follows *ke*, the verb comes after it',
  after: { section: 'granting-permission-tuku-ke', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('nofo heni')) },
  scenes: [
    permitScene('ke', ['nofo', 'heni', 'place'], 'ke', true, 'Tuku ké ke nofo heni.', 'Let yourself stay here.'),
    permitScene('nau', ['ō', 'kinautolu', 'pronoun'], 'nau', false, 'Tuku ke nau ō kinautolu.', 'Let them go.'),
  ],
}

function hopeCase(lane, form, formRole, label, rest, say, en) {
  return {
    lane, say, en,
    row: [face('ʻOfa pē', 'quiet'), { slot: true, form: face(form, formRole), ...(label ? { label } : {}) }, ...rest],
  }
}

/** ʻOfa pē takes ke, or a tense marker instead. The book's reason is the lane's label; té is
 *  left out of the second lane because its sentence looks ahead and the book's reason does not fit it. */
export const F38_2 = {
  id: '38.2',
  kind: 'fork',
  types: ['fork'],
  title: 'What follows *ʻofa pē*?',
  after: { section: 'expressing-hopes-ofa-ke-and-ofa-pe-ke', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('foki')) },
  lanes: [
    { label: 'A wish or hope', forms: ['ke'] },
    { label: 'Something that may already be true or may have happened', forms: ['ʻoku', 'kuo'] },
  ],
  scenes: [
    {
      key: 'kuo',
      cases: [
        hopeCase(0, 'ke', 'quiet', null, [face('mou', 'pronoun'), face('fiefia', 'verb'), face('ʻi homau kiʻi motú', 'place')], 'ʻOfa pē ke mou fiefia ʻi homau kiʻi motú.', 'May you all be happy on our little island.'),
        hopeCase(1, 'kuo', 'tense', 'tense', [face('nau', 'pronoun'), face('aʻu', 'verb'), face('ki ai', 'quiet')], 'ʻOfa pē kuo nau aʻu ki ai.', 'I hope they have arrived there.'),
      ],
    },
    {
      key: 'oku',
      cases: [
        hopeCase(0, 'ke', 'quiet', null, [face('tau', 'pronoun'), face('aʻusia', 'verb'), face('e taʻu foʻoú', 'quiet')], 'ʻOfa pē ke tau aʻusia e taʻu foʻoú.', 'May we all live until the new year.'),
        hopeCase(1, 'ʻoku', 'tense', 'tense', [face('ʻikai puke', 'quiet')], 'ʻOfa pē ʻoku ʻikai puke.', 'I hope he is not sick.'),
      ],
    },
  ],
  alt: [
    'A wish or hope: *ke*. *ʻOfa pē ke mou fiefia ʻi homau kiʻi motú.* May you all be happy on our little island. *ʻOfa pē ke tau aʻusia e taʻu foʻoú.* May we all live until the new year.',
    'Something that may already be true or may have happened: a tense marker instead of *ke*. *ʻOfa pē kuo nau aʻu ki ai.* I hope they have arrived there. *ʻOfa pē ʻoku ʻikai puke.* I hope he is not sick.',
  ],
}

/** One word in three places: the book's table has two of them, and its warning section
 *  raises the third, the tense marker, as the one only context separates. */
export const F38_3 = {
  id: '38.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Which *naʻa*? Look at where it stands',
  after: { section: 'uncertainty-naa-as-perhaps', block: b => b.type === 'table' },
  lanes: [
    { label: 'After a command: lest', forms: ['naʻa'] },
    { label: 'Before a tense marker or *ko*: perhaps', forms: ['naʻa'] },
    { label: 'Pronoun next, no command or advice: past', forms: ['naʻa'] },
  ],
  scenes: [
    {
      key: 'lest-perhaps',
      cases: [
        {
          lane: 0, say: 'Hola naʻá ke lavea.', en: 'Run away lest you get hurt.',
          row: [{ ...face('Hola', 'verb'), ring: true, label: 'command' }, { slot: true, form: face('naʻá', 'quiet') }, face('ke', 'pronoun'), face('lavea', 'verb')],
        },
        {
          lane: 1, say: 'Naʻa kuó ke hela.', en: 'Perhaps you are tired.',
          row: [{ slot: true, form: face('Naʻa', 'quiet') }, { ...face('kuó', 'tense'), ring: true, label: 'tense' }, face('ke', 'pronoun'), face('hela', 'verb')],
        },
      ],
    },
    {
      key: 'lest-past',
      cases: [
        {
          lane: 0, say: 'Lele mai naʻá ke tōmui.', en: 'Run here or you will be late.',
          row: [{ ...face('Lele mai', 'verb'), ring: true, label: 'command' }, { slot: true, form: face('naʻá', 'quiet') }, face('ke', 'pronoun'), face('tōmui', 'verb')],
        },
        {
          lane: 2, say: 'naʻá ku kai', en: 'I ate',
          row: [{ slot: true, form: face('naʻá', 'tense'), label: 'tense' }, { ...face('ku', 'pronoun'), ring: true, label: 'pronoun' }, face('kai', 'verb')],
        },
      ],
    },
  ],
  alt: [
    'After a command, *naʻa* means lest, or else. *Hola naʻá ke lavea.* Run away lest you get hurt. *Lele mai naʻá ke tōmui.* Run here or you will be late.',
    'At the beginning of its clause, followed by a tense marker or *ko*, *naʻa* means perhaps. *Naʻa kuó ke hela.* Perhaps you are tired.',
    'Before a pronoun with no command or advice before it, *naʻa* is the past tense marker. *naʻá ku kai*, I ate.',
  ],
}

/** The word right after telia settles it: naʻa makes a warning, and without it telia means another thing. */
export const F38_4 = {
  id: '38.4',
  kind: 'fork',
  types: ['fork'],
  title: '*Telia* with *naʻa*, or without?',
  after: { section: 'respect-and-deference-telia-alone', block: b => b.type === 'p' && b.text.startsWith('This *telia*') },
  lanes: [
    { label: 'With *naʻa*: lest', forms: ['telia'] },
    { label: 'Without *naʻa*: for the sake of, out of respect for', forms: ['telia'] },
  ],
  scenes: [
    {
      key: 'book-nuku',
      cases: [
        {
          lane: 0, say: 'Tokanga ki hoʻo tohí teliá naʻa mole.', en: 'Take care of your book lest it be lost.',
          row: [face('Tokanga ki hoʻo tohí', 'quiet'), { slot: true, form: face('teliá', 'quiet') }, { ...face('naʻa', 'quiet'), ring: true, label: 'warning word' }, face('mole', 'verb')],
        },
        {
          lane: 1, say: 'ʻAi homou taʻovala telia ʻa Nuku.', en: 'Put on your taʻovalas out of respect for Nuku.',
          row: [face('ʻAi homou taʻovala', 'quiet'), { slot: true, form: face('telia', 'quiet') }, { ...face('ʻa Nuku', 'quiet'), ring: true, label: 'someone' }],
        },
      ],
    },
    {
      key: 'car-country',
      cases: [
        {
          lane: 0, say: 'Fakaleleiʻi ʻa e kaá telia naʻa maumau he halá.', en: 'Fix the car well lest it break down on the road.',
          row: [face('Fakaleleiʻi ʻa e kaá', 'quiet'), { slot: true, form: face('telia', 'quiet') }, { ...face('naʻa', 'quiet'), ring: true, label: 'warning word' }, face('maumau', 'verb'), face('he halá', 'place')],
        },
        {
          lane: 1, say: 'Kuo fai eni ʻe he tuʻí telia ʻa e fonuá.', en: 'The king has done this for the sake of the country.',
          row: [face('Kuo fai eni ʻe he tuʻí', 'quiet'), { slot: true, form: face('telia', 'quiet') }, { ...face('ʻa e fonuá', 'quiet'), ring: true, label: 'something' }],
        },
      ],
    },
  ],
  alt: [
    'With *naʻa*, *telia* gives a warning: lest. *Tokanga ki hoʻo tohí teliá naʻa mole.* Take care of your book lest it be lost. *Fakaleleiʻi ʻa e kaá telia naʻa maumau he halá.* Fix the car well lest it break down on the road.',
    'Without *naʻa*, *telia* means for the sake of, or out of respect for. *ʻAi homou taʻovala telia ʻa Nuku.* Put on your taʻovalas out of respect for Nuku. *Kuo fai eni ʻe he tuʻí telia ʻa e fonuá.* The king has done this for the sake of the country.',
  ],
}

/** The book's two sentences, side by side in one row: ke gives way to tau. */
export const F38_5 = {
  id: '38.5',
  kind: 'row',
  types: ['swap'],
  title: '*Ke* changes to match the audience',
  after: { section: 'fai-mo-ke-hurry-up-and', block: b => b.type === 'p' && b.text.startsWith('When addressing multiple') },
  scenes: [
    {
      key: 'tau',
      tiles: {
        fai: [face('Fai mo', 'quiet')],
        pron: [face('ke', 'pronoun'), face('tau', 'pronoun')],
        verb: [face('ʻalu', 'verb'), face('ō', 'verb')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Fai mo ke ʻalu!', en: 'Hurry up and go.' },
        { say: 'Fai mo tau ō!', en: 'Come on, let us go' },
      ],
      states: [
        [['fai', 0], ['pron', 0], ['verb', 0]],
        [['fai', 0], ['pron', 1], ['verb', 1]],
      ],
      beats: [{ kind: 'swap', tile: ['pron', 'verb'], to: 1 }],
      alt: [
        '*Fai mo ke ʻalu!* Hurry up and go.',
        '*Fai mo tau ō!* Come on, let us go. It uses the inclusive first person plural *tau* instead of *ke*.',
      ],
    },
  ],
}

function adverbCase(lane, row, say, en) {
  return { lane, say, en, row }
}
const adverb = form => ({ slot: true, form: face(form, 'particle') })

/** Three adverbs in one spot, told apart by the Tone column of the book's table. */
export const F38_6 = {
  id: '38.6',
  kind: 'fork',
  types: ['fork'],
  title: 'Which adverb? Ask what tone you want',
  after: { section: 'adverbs-of-uncertainty-nai-ape-and-koa', block: b => b.type === 'table' },
  lanes: [
    { label: 'Gentle uncertainty', forms: ['nai'] },
    { label: 'Conjecture, suggestion', forms: ['ʻapē'] },
    { label: 'Requests definite answer', forms: ['koā'] },
  ],
  scenes: [
    {
      key: 'nai-ape',
      cases: [
        adverbCase(0, [face('ʻOku', 'tense'), face('toko fiha', 'question'), adverb('nai'), face('hoʻo fānau', 'quiet')], 'ʻOku toko fiha nai hoʻo fānau?', 'How many children do you have? (polite, softened)'),
        adverbCase(1, [face('ʻE', 'tense'), face('haʻu', 'verb'), adverb('ʻapē'), face('ʻa e vakapuná', 'quiet'), face('ʻapongipongi', 'quiet')], 'ʻE haʻu ʻapē ʻa e vakapuná ʻapongipongi?', 'Is the airplane coming tomorrow? (I guess it might)'),
      ],
    },
    {
      key: 'nai-koa',
      cases: [
        adverbCase(0, [face('Té', 'tense'), face('ke', 'pronoun'), face('fie ʻalu', 'verb'), adverb('nai')], 'Té ke fie ʻalu nai?', 'I wonder whether you would like to go.'),
        adverbCase(2, [face('Té', 'tense'), face('ke', 'pronoun'), face('haʻu', 'verb'), adverb('koā'), face('pe ʻikai', 'quiet')], 'Té ke haʻu koā pe ʻikai?', 'Are you coming or not? (I need a clear answer)'),
      ],
    },
  ],
  alt: [
    '*nai*, gentle uncertainty. *ʻOku toko fiha nai hoʻo fānau?* How many children do you have? (polite, softened) *Té ke fie ʻalu nai?* I wonder whether you would like to go.',
    '*ʻapē*, conjecture or suggestion. *ʻE haʻu ʻapē ʻa e vakapuná ʻapongipongi?* Is the airplane coming tomorrow? (I guess it might)',
    '*koā*, requests a definite answer. *Té ke haʻu koā pe ʻikai?* Are you coming or not? (I need a clear answer)',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Hola', 'verb'), face('naʻá', 'quiet', 'warning word'), face('ke', 'pronoun'), face('lavea', 'verb')],
  say: 'Hola naʻá ke lavea.',
  en: 'Run away lest you get hurt.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Tuku ké ke nofo heni.', en: 'Let yourself stay here.' },
  { to: 'ʻOfa pē ke mou fiefia ʻi homau kiʻi motú.', en: 'May you all be happy on our little island.' },
  { to: 'Hola naʻá ke lavea.', en: 'Run away lest you get hurt.' },
]

export const FIGURES = [F38_1, F38_2, F38_3, F38_4, F38_5, F38_6]
