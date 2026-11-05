// Lesson 10's figures, as data. Every Tongan and English string is copied from
// book/Chapter-10.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Names are `quiet`, since the noun colour means
// a noun subject and these are not. No figure for kau ki: a definition with examples.

const face = (text, role, label) => ({ text, role, ...(label === undefined ? {} : { label }) })
const quiet = text => face(text, 'quiet', '')

/** It sits after the verb and any location phrases, and time words still come last. */
export const F10_1 = {
  id: '10.1',
  kind: 'row',
  types: ['add'],
  title: 'Where the *mo* phrase sits',
  after: { section: 'mo-with-together-with', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('hiva mo Mele')) },
  scenes: [
    {
      key: 'place',
      tiles: {
        tense: [face('ʻOku', 'tense')], pron: [face('ou', 'pronoun')], verb: [face('nofo', 'verb')],
        place: [face('ʻi Vavaʻu', 'place')], mo: [face('mo Mele', 'quiet', '*mo* phrase')],
      },
      before: null,
      after: { say: 'ʻOku ou nofo ʻi Vavaʻu mo Mele.', en: 'I live in Vavaʻu with Mele.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['place', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['place', 0], ['mo', 0]],
      ],
      beats: [{ kind: 'add', tile: 'mo', to: 1 }, { kind: 'en' }],
      alt: ['*ʻOku ou nofo ʻi Vavaʻu mo Mele.* I live in Vavaʻu with Mele.', 'It sits in the sentence after the verb and any location phrases.'],
    },
    {
      key: 'time',
      tiles: {
        rest: [quiet('Naʻá ku ʻalu')], place: [face('ki kolo', 'place')],
        mo: [face('mo Sione', 'quiet', '*mo* phrase')], time: [face('ʻaneafi', 'quiet', 'time word')],
      },
      before: null,
      after: { say: 'Naʻá ku ʻalu ki kolo mo Sione ʻaneafi.', en: 'I went to town with Sione yesterday.' },
      states: [
        [['rest', 0], ['place', 0], ['time', 0]],
        [['rest', 0], ['place', 0], ['mo', 0], ['time', 0]],
      ],
      beats: [{ kind: 'add', tile: 'mo', to: 1 }, { kind: 'en' }],
      alt: ['*Naʻá ku ʻalu ki kolo mo Sione ʻaneafi.* I went to town with Sione yesterday.', 'The *mo* phrase fits naturally into longer sentences. Time words still come last.'],
    },
  ],
}

/** The same word doing double duty, and the book's own sentence holding both senses. */
export const F10_2 = {
  id: '10.2',
  kind: 'row',
  types: ['add'],
  title: 'Between two names, *mo* means “and”',
  after: { section: 'mo-connecting-names-and', block: b => b.type === 'table' },
  scenes: [
    {
      key: 'two',
      tiles: {
        rest: [quiet('Naʻá ku lea')], first: [quiet('kia Sione')],
        mo: [face('mo', 'quiet', 'and')], second: [quiet('Mele')],
      },
      before: null,
      after: { say: 'Naʻá ku lea kia Sione mo Mele.', en: 'I spoke to Sione and Mele.' },
      states: [
        [['rest', 0], ['first', 0]],
        [['rest', 0], ['first', 0], ['mo', 0], ['second', 0]],
      ],
      beats: [{ kind: 'add', tile: ['mo', 'second'], to: 1 }, { kind: 'en' }],
      alt: ['*Naʻá ku lea kia Sione mo Mele.* I spoke to Sione and Mele.', 'When *mo* appears between two names, it means “and.”'],
    },
    {
      key: 'list',
      tiles: {
        a: [quiet('Tēvita')], mo1: [face('mo', 'quiet', 'and')], b: [quiet('Seini')],
        mo2: [face('mo', 'quiet', 'and')], c: [quiet('Lupe')],
      },
      before: null,
      after: { say: 'Tēvita mo Seini mo Lupe', en: 'Tēvita, Seini, and Lupe' },
      states: [
        [['a', 0]],
        [['a', 0], ['mo1', 0], ['b', 0]],
        [['a', 0], ['mo1', 0], ['b', 0], ['mo2', 0], ['c', 0]],
      ],
      beats: [{ kind: 'add', tile: ['mo1', 'b'], to: 1 }, { kind: 'add', tile: ['mo2', 'c'], to: 2 }, { kind: 'en' }],
      alt: ['*Tēvita mo Seini mo Lupe.* Tēvita, Seini, and Lupe', 'To list three or more names, repeat *mo* before each.'],
    },
    {
      key: 'both',
      tiles: {
        rest: [quiet('Naʻa mau ʻalu ki tahi')], mo1: [face('mo', 'quiet', 'with')], a: [quiet('Sēmisi')],
        mo2: [face('mo', 'quiet', 'and')], b: [quiet('ʻAna')],
      },
      before: null,
      after: { say: 'Naʻa mau ʻalu ki tahi mo Sēmisi mo ʻAna.', en: 'We went to the sea with Sēmisi and ʻAna.' },
      states: [
        [['rest', 0]],
        [['rest', 0], ['mo1', 0], ['a', 0]],
        [['rest', 0], ['mo1', 0], ['a', 0], ['mo2', 0], ['b', 0]],
      ],
      beats: [{ kind: 'add', tile: ['mo1', 'a'], to: 1 }, { kind: 'add', tile: ['mo2', 'b'], to: 2 }, { kind: 'en' }],
      alt: ['*Naʻa mau ʻalu ki tahi mo Sēmisi mo ʻAna.* We went to the sea with Sēmisi and ʻAna.', 'The same word does double duty: “with” before the first name, and “and” between the two names.'],
    },
  ],
}

/** The motion verb sets the way (line 73: *ʻalu* (go), *haʻu* (come)); the book's own gloss of each. */
export const F10_3 = {
  id: '10.3',
  kind: 'path',
  types: ['path'],
  title: 'A motion verb, *mo* and a thing: bringing or taking',
  after: { section: 'taking-something-along', block: b => b.type === 'p' && b.text.startsWith('When a motion verb') },
  marks: ['speaker', 'listener'],
  scenes: [
    {
      key: 'bring-take',
      cases: [
        { particle: 'Haʻu', role: 'verb', dirText: 'come', from: 'listener', to: 'speaker', say: 'Haʻu mo e tohí!', en: 'Bring the book (to me).' },
        { particle: 'ʻAlu', role: 'verb', dirText: 'go', from: 'listener', to: 'away', say: 'ʻAlu mo e valá!', en: 'Take the clothes (with you).' },
      ],
    },
  ],
  alt: [
    '*Haʻu mo e tohí!* literally means “Come with the book” but idiomatically means “Bring the book (to me).”',
    '*ʻAlu mo e valá!* means “Take the clothes (with you).”',
  ],
}

/** The book says this in one parenthesis: ki, ʻi and mei change form before pronouns, mo does not. */
export const F10_4 = {
  id: '10.4',
  kind: 'grid',
  types: ['grid'],
  title: '*Mo* does not change before a pronoun',
  after: { section: 'mo-with-pronouns', block: b => b.type === 'p' && b.text.startsWith('Unlike the prepositions') },
  head: ['Preposition', 'Before a pronoun'],
  rows: [
    { tense: '*ki*', tag: 'Changes form', cells: [{ none: true, form: 'kiate' }] },
    { tense: '*ʻi*', tag: 'Changes form', cells: [{ none: true, form: 'ʻiate' }] },
    { tense: '*mei*', tag: 'Changes form', cells: [{ none: true, form: 'meiate' }] },
    { tense: '*mo*', tag: 'Stays', cells: [{ marker: 'mo', rest: ' au', say: 'mo au', en: 'with me' }] },
  ],
  rest: { row: 3, col: 0 },
  scenes: [{ key: 'grid' }],
}

function command(lane, group, row, say, en) {
  return { lane, group, row, say, en }
}

const one = (verb, say, en) => command(0, [1], [{ slot: true, form: face(verb, 'verb') }], say, en)
const two = (verb, say, en) => command(1, [1, 2], [{ slot: true, form: face('Mo', 'pronoun'), label: true }, face(verb, 'verb')], say, en)
const many = (verb, say, en) => command(2, [1, 2, 3], [{ slot: true, form: face('Mou', 'pronoun'), label: true }, face(verb, 'verb')], say, en)

/** The book's table headings as lanes, with the people it counts. Its table prints the forms;
 *  this shows who each one addresses. Two cases a scene; the One person lane (*Hopo!*) fires only in the hopo scene, so the other scenes show the table's two-or-more forms. English only
 *  where the book pairs it with the form (the reading for Mo hopo!, Exercise 6's prompts for
 *  the rest); the table's other forms have none of their own and carry en: null. */
export const F10_5 = {
  id: '10.5',
  kind: 'fork',
  types: ['fork'],
  title: 'How many people are you telling?',
  after: { section: 'commands-to-two-people-mo-verb', block: b => b.type === 'p' && b.text.startsWith('The plural verb forms apply') },
  people: ['speaker', 'listener', 'listener', 'listener'],
  lanes: [
    { label: 'One person', forms: ['Hopo!'] },
    { label: 'Two people', forms: ['Mo'] },
    { label: 'Three or more', forms: ['Mou'] },
  ],
  scenes: [
    {
      key: 'hopo',
      cases: [
        one('Hopo!', 'Hopo!', 'Jump! (1 person)'),
        two('hopo!', 'Mo hopo!', 'Jump! (you two)'),
      ],
    },
    {
      key: 'o',
      laneForms: [['ʻAlu!'], null, null],
      cases: [
        two('ō!', 'Mo ō!', 'Go! (2 people)'),
        many('ō!', 'Mou ō!', 'Go! (3 or more people)'),
      ],
    },
    {
      key: 'nofo',
      laneForms: [['Nofo!'], null, null],
      cases: [
        two('nofo!', 'Mo nofo!', null),
        many('nofo!', 'Mou nofo!', null),
      ],
    },
    {
      key: 'kai',
      laneForms: [['Kai!'], null, null],
      cases: [
        two('kai!', 'Mo kai!', null),
        many('kai!', 'Mou kai!', null),
      ],
    },
    {
      key: 'mou-hopo',
      cases: [
        many('hopo!', 'Mou hopo!', null),
      ],
    },
  ],
  alt: [
    'A bare verb makes a command to one person: *Hopo!*',
    'For exactly two people, *mo* before the verb: *Mo hopo!* Jump! (you two) *Mo ō!* Go! (2 people)',
    'For a group of three or more, *mou* before the verb: *Mou ō!* Go! (3 or more people) *Mou hopo!*',
    'The same for *Mo nofo!* *Mou nofo!* and *Mo kai!* *Mou kai!*',
    '*ʻAlu!* becomes *ō* with two or more people: *Mo ō!* *Mou ō!*',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Naʻá', 'tense'), face('ku', 'pronoun'), face('ʻalu', 'verb'), face('mo', 'quiet', 'preposition'), face('Sione', 'quiet', 'name')],
  say: 'Naʻá ku ʻalu mo Sione.',
  en: 'I went with Sione.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Naʻá ku ʻalu mo Sione.', en: 'I went with Sione.' },
  { to: 'Naʻá ku lea kia Sione mo Mele.', en: 'I spoke to Sione and Mele.' },
  { to: 'Mo hopo!', en: 'Jump! (you two)' },
]

export const FIGURES = [F10_1, F10_2, F10_3, F10_4, F10_5]
