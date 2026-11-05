// Lesson 21's figures, as data. Every Tongan and English string is copied from
// book/Chapter-21.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The ʻia lane says a person's name, since the
// book's examples are all people and its Exercise 2 answer keeps ʻi before Tonga.
// No figure prints an exercise's answer that the reading does not print.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

const AUX = 'auxiliary'

/** fie slots in between the pronoun and the verb. */
export const F21_1 = {
  id: '21.1',
  kind: 'row',
  types: ['add'],
  title: '*fie* goes directly before the main verb',
  after: { section: 'fie-want-to-wish-to', block: b => b.type === 'p' && b.text.startsWith('tense marker') },
  scenes: [
    {
      key: 'nofo',
      tiles: {
        tense: [face('ʻOkú', 'tense')], pron: [face('ke', 'pronoun')], fie: [face('fie', 'particle', AUX)],
        verb: [face('nofo', 'verb')], place: [face('ʻi Haʻapai', 'place')],
      },
      before: null,
      after: { say: 'ʻOkú ke fie nofo ʻi Haʻapai?', en: 'Do you want to live in Haʻapai?' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['place', 0]],
        [['tense', 0], ['pron', 0], ['fie', 0], ['verb', 0], ['place', 0]],
      ],
      beats: [{ kind: 'add', tile: 'fie', to: 1 }, { kind: 'en' }],
      alt: ['*ʻOkú ke fie nofo ʻi Haʻapai?* Do you want to live in Haʻapai?', '*fie* is slotted in between the pronoun and the verb.'],
    },
    {
      key: 'mohe',
      tiles: {
        tense: [face('Naʻá', 'tense')], pron: [face('ku', 'pronoun')], fie: [face('fie', 'particle', AUX)],
        verb: [face('mohe', 'verb')], rest: [face('ʻanepō', 'quiet')],
      },
      before: null,
      after: { say: 'Naʻá ku fie mohe ʻanepō.', en: 'I wanted to sleep last night.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['rest', 0]],
        [['tense', 0], ['pron', 0], ['fie', 0], ['verb', 0], ['rest', 0]],
      ],
      beats: [{ kind: 'add', tile: 'fie', to: 1 }, { kind: 'en' }],
      alt: ['*Naʻá ku fie mohe ʻanepō.* I wanted to sleep last night.', 'The auxiliary takes the position right before the main verb.'],
    },
  ],
}

/** lava arrives with ʻo: the conjunction links it to the action that follows. */
export const F21_2 = {
  id: '21.2',
  kind: 'row',
  types: ['add'],
  title: '*lava*, then *ʻo*, then the main verb',
  after: { section: 'lava-to-be-able-to', block: b => b.type === 'p' && b.text.startsWith('tense marker') },
  scenes: [
    {
      key: 'kakau',
      tiles: {
        tense: [face('ʻOku', 'tense')], pron: [face('ou', 'pronoun')], lava: [face('lava', 'particle', AUX)],
        o: [face('ʻo', 'quiet', 'conjunction')], verb: [face('kakau', 'verb')],
      },
      before: null,
      after: { say: 'ʻOku ou lava ʻo kakau.', en: 'I can swim.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['lava', 0], ['verb', 0]],
        [['tense', 0], ['pron', 0], ['lava', 0], ['o', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'lava', to: 1 }, { kind: 'add', tile: 'o', to: 2 }, { kind: 'en' }],
      alt: ['*ʻOku ou lava ʻo kakau.* I can swim.', 'The conjunction *ʻo* links *lava* to the action that follows.'],
    },
  ],
}

/** With a noun subject, the second verb picks the marker before the noun. */
export const F21_3 = {
  id: '21.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Which marker before the noun? Look at the second verb',
  after: { section: 'lava-to-be-able-to', block: b => b.type === 'p' && b.text.startsWith('Notice that when the second verb') },
  lanes: [
    { label: 'The second verb is transitive', forms: ['ʻe'] },
    { label: 'Any other second verb', forms: ['ʻa'] },
  ],
  scenes: [
    {
      key: 'pita-siale',
      cases: [
        {
          lane: 0, say: 'ʻE lava ʻe Pita ʻo fakatau ʻa e meʻakái?', en: 'Can Pita buy the food?',
          row: [
            face('ʻE lava', 'quiet'), { slot: true, form: face('ʻe', 'quiet'), label: 'agent marker' }, face('Pita', 'noun'),
            { ...face('ʻo fakatau', 'verb'), ring: true, label: 'second verb' }, face('ʻa e meʻakái', 'quiet'),
          ],
        },
        {
          lane: 1, say: 'Naʻe lava ʻa Siale ʻo hiva lelei.', en: 'Siale was able to sing well.',
          row: [
            face('Naʻe lava', 'quiet'), { slot: true, form: face('ʻa', 'focus'), label: 'focus marker' }, face('Siale', 'noun'),
            { ...face('ʻo hiva', 'verb'), ring: true, label: 'second verb' }, face('lelei', 'quiet'),
          ],
        },
      ],
    },
  ],
  alt: [
    'When the second verb is transitive, the agent marker *ʻe* replaces the focus marker *ʻa* before the noun subject. *ʻE lava ʻe Pita ʻo fakatau ʻa e meʻakái?* Can Pita buy the food?',
    'The focus marker *ʻa*: *Naʻe lava ʻa Siale ʻo hiva lelei.* Siale was able to sing well.',
  ],
}

function negCase(lane, say, en, neg, form, subject, rest) {
  return {
    lane, say, en,
    row: lane === 0
      ? [face(neg, 'quiet'), { slot: true, form: face(form, 'quiet') }, { ...face(subject, 'pronoun'), ring: true, label: 'pronoun' }, face('lava', 'particle', AUX), face(rest, 'quiet')]
      : [face(neg, 'quiet'), { slot: true, form: face(form, 'quiet') }, face('lava', 'particle', AUX), { ...face(subject, 'noun'), ring: true, label: 'noun' }, face(rest, 'quiet')],
  }
}

/** In the negative, the subject picks te or ke, and a pronoun comes before lava. */
export const F21_4 = {
  id: '21.4',
  kind: 'fork',
  types: ['fork'],
  title: 'In the negative, look at the subject',
  after: { section: 'lava-to-be-able-to', block: b => b.type === 'p' && b.text.startsWith('In the negative') },
  lanes: [
    { label: 'A pronoun subject', forms: ['te'] },
    { label: 'A noun subject', forms: ['ke'] },
  ],
  scenes: [
    {
      key: 'alu-tevita',
      cases: [
        negCase(0, 'ʻOku ʻikai té u lava ʻo ʻalu.', 'I cannot go.', 'ʻOku ʻikai', 'té', 'u', 'ʻo ʻalu'),
        negCase(1, 'ʻOku ʻikai ke lava ʻa Tēvita ʻo tohi.', 'Tēvita cannot write.', 'ʻOku ʻikai', 'ke', 'ʻa Tēvita', 'ʻo tohi'),
      ],
    },
    {
      key: 'hau-mele',
      cases: [
        negCase(0, 'Naʻe ʻikai té ke lava ʻo haʻu?', 'Were you not able to come?', 'Naʻe ʻikai', 'té', 'ke', 'ʻo haʻu'),
        negCase(1, 'ʻOku ʻikai ke lava ʻa Mele ʻo lea lelei.', 'Mele cannot speak well.', 'ʻOku ʻikai', 'ke', 'ʻa Mele', 'ʻo lea lelei'),
      ],
    },
  ],
  alt: [
    'With pronoun subjects, use *ʻoku ʻikai te* + pronoun + *lava*. *ʻOku ʻikai té u lava ʻo ʻalu.* I cannot go. *Naʻe ʻikai té ke lava ʻo haʻu?* Were you not able to come?',
    'With noun subjects, use *ʻoku ʻikai ke lava*. *ʻOku ʻikai ke lava ʻa Tēvita ʻo tohi.* Tēvita cannot write. *ʻOku ʻikai ke lava ʻa Mele ʻo lea lelei.* Mele cannot speak well.',
  ],
}

function likeCase(lane, say, en, tense, pron, form, liked, label) {
  return {
    lane, say, en,
    row: [face(tense, 'tense'), face(pron, 'pronoun'), face('saiʻia', 'verb'), { slot: true, form: face(form, 'quiet') }, { ...face(liked, 'quiet'), ring: true, label }],
  }
}

/** he before a definite noun, ʻia before a person's name. */
export const F21_5 = {
  id: '21.5',
  kind: 'fork',
  types: ['fork'],
  title: '*he* or *ʻia*? Look at what is liked',
  after: { section: 'saiia-to-like', block: b => b.type === 'p' && b.text.startsWith('With proper names') },
  lanes: [
    { label: 'A definite noun', forms: ['he'] },
    { label: 'A person’s name', forms: ['ʻia'] },
  ],
  scenes: [
    {
      key: 'food-seini',
      cases: [
        likeCase(0, 'ʻOkú ke saiʻia he meʻakai?', 'Do you like the food?', 'ʻOkú', 'ke', 'he', 'meʻakai', 'noun'),
        likeCase(1, 'ʻOkú ke saiʻia ʻia Seini?', 'Do you like Seini?', 'ʻOkú', 'ke', 'ʻia', 'Seini', 'name'),
      ],
    },
    {
      key: 'song-latu',
      cases: [
        likeCase(0, 'ʻOku ou saiʻia he hivá.', 'I like the song.', 'ʻOku', 'ou', 'he', 'hivá', 'noun'),
        likeCase(1, 'Naʻá ke saiʻia ʻia Lātū?', 'Did you like Lātū?', 'Naʻá', 'ke', 'ʻia', 'Lātū', 'name'),
      ],
    },
  ],
  alt: [
    'Because *ʻi* before the definite article *he* drops, you will usually see *saiʻia he*. *ʻOkú ke saiʻia he meʻakai?* Do you like the food? *ʻOku ou saiʻia he hivá.* I like the song.',
    'With proper names, use *ʻia*, the personal form of *ʻi*. *ʻOkú ke saiʻia ʻia Seini?* Do you like Seini? *Naʻá ke saiʻia ʻia Lātū?* Did you like Lātū?',
  ],
}

function aiScene(key, subjA, subjB, phrase, before, after) {
  return {
    key,
    tiles: {
      io: [face('ʻIo,', 'quiet')],
      subj: [face(subjA, 'tense', 'tense + pronoun'), face(subjB, 'tense', 'tense + pronoun')],
      verb: [face('saiʻia', 'verb')],
      lahi: [face('lahi', 'particle', 'modifier')],
      phrase: [face(phrase, 'quiet', '*ʻia* phrase'), face('ai', 'particle', 'refers back')],
    },
    before,
    after,
    states: [
      [['subj', 0], ['verb', 0], ['phrase', 0]],
      [['subj', 1], ['verb', 0], ['lahi', 0], ['phrase', 0]],
      [['io', 0], ['subj', 1], ['verb', 0], ['lahi', 0], ['phrase', 0]],
      [['io', 0], ['subj', 1], ['verb', 0], ['lahi', 0], ['phrase', 1]],
    ],
    beats: [
      { kind: 'swap', tile: 'subj', to: 1 },
      { kind: 'add', tile: 'io', roll: 'subj', to: 2 },
      { kind: 'swap', tile: 'phrase', to: 3 },
      { kind: 'en' },
    ],
    alt: [`*${before.say}* ${before.en}`, `*${after.say}* ${after.en}`, '*ai* replaces the full *ʻi*/*ʻia* phrase when the object has already been mentioned.'],
  }
}

/** The answer does not repeat the ʻia phrase: ai replaces it. */
export const F21_6 = {
  id: '21.6',
  kind: 'row',
  types: ['swap', 'add'],
  title: '*ai* replaces the full *ʻi* or *ʻia* phrase',
  after: { section: 'saiia-to-like', block: b => b.type === 'p' && b.text.startsWith('The substitute') },
  scenes: [
    aiScene('seini', 'ʻOkú ke', 'ʻoku ou', 'ʻia Seini',
      { say: 'ʻOkú ke saiʻia ʻia Seini?', en: 'Do you like Seini?' },
      { say: 'ʻIo, ʻoku ou saiʻia lahi ai.', en: 'Yes, I like her a lot.' }),
    aiScene('latu', 'Naʻá ke', 'naʻá ku', 'ʻia Lātū',
      { say: 'Naʻá ke saiʻia ʻia Lātū?', en: 'Did you like Lātū?' },
      { say: 'ʻIo, naʻá ku saiʻia lahi ai.', en: 'Yes, I liked him a lot.' }),
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('ou', 'pronoun'), face('fie', 'particle', AUX), face('ako', 'verb')],
  say: 'ʻOku ou fie ako.',
  en: 'I want to study.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku mau fie ʻalu ki kolo.', en: 'We want to go to town.' },
  { to: 'ʻOku ʻikai té u lava ʻo ʻalu.', en: 'I cannot go.' },
  { to: 'ʻOku ou saiʻia lahi he lea faka-Tongá.', en: 'I like the Tongan language a lot.' },
]

export const FIGURES = [F21_1, F21_2, F21_3, F21_4, F21_5, F21_6]
