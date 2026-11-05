// Lesson 5's figures, as data. Every Tongan and English string is copied from
// book/Chapter-05.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The labels are the book's own: "don't" and
// "please" from Words to Learn, "preposed" and "postposed" from the long-forms section.
//
// No figure for Giving a Command (a definition with examples and a table), for the plural verb
// forms (their table says it, in the same strings), for the long-forms table (a Grid would add
// nothing to it), or for Words to Learn and the Exercises.

const face = (text, role, label) => ({ text, role, ...(label != null ? { label } : {}) })

function groupScene(key, one, plural, sayOne, enOne, sayGroup, enGroup) {
  return {
    key,
    tiles: {
      mou: [face('Mou', 'pronoun')],
      verb: [face(one, 'verb'), face(plural, 'verb')],
    },
    before: null,
    after: null,
    lines: [
      { say: sayOne, en: enOne },
      { say: sayGroup, en: enGroup },
    ],
    states: [
      [['verb', 0]],
      [['mou', 0], ['verb', 1]],
    ],
    beats: [{ kind: 'add', tile: 'mou', roll: 'verb', to: 1 }],
    alt: [`*${sayOne}* ${enOne} *${sayGroup}* ${enGroup}`],
  }
}

/** Commands to a Group: place mou before the verb. The verb holds still. */
export const F5_1 = {
  id: '5.1',
  kind: 'row',
  types: ['add'],
  title: 'To a group, *mou* goes before the verb',
  after: { section: 'commands-to-a-group-mou', block: b => b.type === 'p' && b.text.startsWith('When speaking to three or more') },
  scenes: [
    groupScene('nofo', 'Nofo', 'nofo', 'Nofo!', 'Stay!', 'Mou nofo!', 'Stay! (all of you)'),
    groupScene('kai', 'Kai', 'kai', 'Kai!', 'Eat!', 'Mou kai!', 'Eat! (all of you)'),
  ],
}

/** The Command and Prohibition table, read along its rows. To one person ke arrives with ʻoua te;
 *  to a group mou is already there, so only ʻoua te arrives. */
export const F5_2 = {
  id: '5.2',
  kind: 'row',
  types: ['add'],
  title: 'The pattern: *ʻoua te* + pronoun + verb',
  after: { section: 'saying-dont-prohibitions-with-oua', block: b => b.type === 'p' && b.text.startsWith('Unlike a positive command') },
  scenes: [
    {
      key: 'kai',
      tiles: {
        oua: [face('ʻOua', 'quiet', 'don’t')],
        te: [face('té', 'quiet', '')],
        pron: [face('ke', 'pronoun')],
        verb: [face('Kai', 'verb'), face('kai', 'verb')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Kai!', en: 'Eat!' },
        { say: 'ʻOua té ke kai!', en: "Don't eat!" },
      ],
      states: [
        [['verb', 0]],
        [['oua', 0], ['te', 0], ['pron', 0], ['verb', 1]],
      ],
      beats: [{ kind: 'add', tile: ['oua', 'te', 'pron'], roll: 'verb', to: 1 }],
      alt: ['*Kai!* Eat! *ʻOua té ke kai!* Don\'t eat! A prohibition always includes the pronoun, because *ʻoua te* requires one.'],
    },
    {
      key: 'mou-o',
      tiles: {
        oua: [face('ʻOua', 'quiet', 'don’t')],
        te: [face('te', 'quiet', '')],
        pron: [face('Mou', 'pronoun'), face('mou', 'pronoun')],
        verb: [face('ō', 'verb')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Mou ō!', en: 'Go! (all)' },
        { say: 'ʻOua te mou ō!', en: "Don't go! (all)" },
      ],
      states: [
        [['pron', 0], ['verb', 0]],
        [['oua', 0], ['te', 0], ['pron', 1], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: ['oua', 'te'], roll: 'pron', to: 1 }],
      alt: ['*Mou ō!* Go! (all) *ʻOua te mou ō!* Don\'t go! (all) For a group, the pronoun is *mou*.'],
    },
  ],
}

const please = () => face('muʻa', 'particle', 'please')

function pleaseScene(key, tiles, row, say, en, sayPlease, enPlease) {
  return {
    key,
    tiles: { ...tiles, mua: [please()] },
    before: null,
    after: null,
    lines: [
      { say, en },
      { say: sayPlease, en: enPlease },
    ],
    states: [row, [...row, ['mua', 0]]],
    beats: [{ kind: 'add', tile: 'mua', to: 1 }],
    alt: [`*${say}* ${en} *${sayPlease}* ${enPlease}`],
  }
}

/** Adding "Please": mu'a comes after the verb, whatever came before it. */
export const F5_3 = {
  id: '5.3',
  kind: 'row',
  types: ['add'],
  title: '*Muʻa* comes after the verb',
  after: { section: 'adding-please-mua', block: b => b.type === 'p' && b.text.startsWith('The word') },
  scenes: [
    pleaseScene('nofo', { verb: [face('Nofo', 'verb')] }, [['verb', 0]],
      'Nofo!', 'Stay!', 'Nofo muʻa!', 'Please stay!'),
    pleaseScene('mou-o', { pron: [face('Mou', 'pronoun')], verb: [face('ō', 'verb')] }, [['pron', 0], ['verb', 0]],
      'Mou ō!', 'Go! (to a group)', 'Mou ō muʻa!', 'Please go! (all of you)'),
    pleaseScene('oua', {
      oua: [face('ʻOua', 'quiet', 'don’t')],
      te: [face('té', 'quiet', '')],
      pron: [face('ke', 'pronoun')],
      verb: [face('kai', 'verb')],
    }, [['oua', 0], ['te', 0], ['pron', 0], ['verb', 0]],
    'ʻOua té ke kai!', "Don't eat!", 'ʻOua té ke kai muʻa.', "Please don't eat."),
  ],
}

/** Emphatic statements: the postposed pronoun echoes the preposed one, right after the verb. */
export const F5_4 = {
  id: '5.4',
  kind: 'row',
  types: ['add'],
  title: 'The long form echoes the pronoun, after the verb',
  after: { section: 'emphatic-statements-with-postposed-pronouns', block: b => b.type === 'p' && b.text.startsWith('When you add the postposed') },
  scenes: [
    {
      key: 'nofo-au',
      tiles: {
        tense: [face('Té', 'tense')],
        pron: [face('u', 'pronoun', 'preposed')],
        verb: [face('nofo', 'verb')],
        post: [face('au', 'pronoun', 'postposed')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Té u nofo.', en: 'I will stay.' },
        { say: 'Té u nofo au.', en: "I will stay. (that's certain)" },
      ],
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['post', 0]],
      ],
      beats: [{ kind: 'add', tile: 'post', to: 1 }],
      alt: ['*Té u nofo.* I will stay. *Té u nofo au.* I will stay. (that\'s certain) The postposed pronoun appears right after the verb. It adds weight.'],
    },
    {
      key: 'tau-kai',
      tiles: {
        pron: [face('Tau', 'pronoun', 'preposed')],
        verb: [face('kai', 'verb')],
        post: [face('kitautolu', 'pronoun', 'postposed')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Tau kai!', en: "Let's eat!" },
        { say: 'Tau kai kitautolu!', en: "Let's eat! What are we waiting for?" },
      ],
      states: [
        [['pron', 0], ['verb', 0]],
        [['pron', 0], ['verb', 0], ['post', 0]],
      ],
      beats: [{ kind: 'add', tile: 'post', to: 1 }],
      alt: ['*Tau kai!* Let\'s eat! *Tau kai kitautolu!* Let\'s eat! What are we waiting for?'],
    },
  ],
}

function oneCase(verb, say, en) {
  return {
    lane: 0, say, en,
    row: [face(verb, 'verb'), { slot: true, form: face('koe', 'pronoun'), label: true }],
  }
}

function groupCase(verb, say, en) {
  return {
    lane: 1, say, en,
    row: [face('Mou', 'pronoun'), face(verb, 'verb'), { slot: true, form: face('kimoutolu', 'pronoun'), label: true }],
  }
}

/** Emphasis in Commands: koe singles out the one person, kimoutolu the group. */
export const F5_5 = {
  id: '5.5',
  kind: 'fork',
  types: ['fork'],
  title: 'Who is the command for?',
  after: { section: 'emphasis-in-commands-alu-koe', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('Mou kai kimoutolu')) },
  lanes: [
    { label: 'To one person', forms: ['koe'] },
    { label: 'To a group', forms: ['kimoutolu'] },
  ],
  scenes: [
    {
      key: 'go',
      cases: [
        oneCase('ʻAlu', 'ʻAlu koe!', 'Go! (I mean you!)'),
        groupCase('ō', 'Mou ō kimoutolu!', 'Go! (all of you, I mean it!)'),
      ],
    },
    {
      key: 'eat',
      cases: [
        oneCase('Kai', 'Kai koe!', 'Eat! (you!)'),
        groupCase('kai', 'Mou kai kimoutolu!', 'Eat! (all of you!)'),
      ],
    },
  ],
  alt: [
    'To one person: *koe*. *ʻAlu koe!* Go! (I mean you!) *Kai koe!* Eat! (you!)',
    'To a group: *kimoutolu*, with *mou* already before the verb. *Mou ō kimoutolu!* Go! (all of you, I mean it!) *Mou kai kimoutolu!* Eat! (all of you!)',
  ],
}

/** The opening row in the hero: a still, with a command and its emphasis in one sentence. */
export const OPENING = {
  row: [face('Mou', 'pronoun'), face('ō', 'verb'), face('kimoutolu', 'pronoun', 'postposed')],
  say: 'Mou ō kimoutolu!',
  en: 'Go! (all of you, I mean it!)',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Kai!', en: 'Eat!' },
  { to: 'Mou hiva!', en: 'Sing! (all of you)' },
  { to: 'ʻOua té ke kai!', en: "Don't eat!" },
  { to: 'Haʻu muʻa!', en: 'Please come!' },
]

export const FIGURES = [F5_1, F5_2, F5_3, F5_4, F5_5]
