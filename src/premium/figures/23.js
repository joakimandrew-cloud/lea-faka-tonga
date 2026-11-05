// Lesson 23's figures, as data. Every Tongan and English string is copied from
// book/Chapter-23.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. The tile labels on the first figure are the
// book's own slot-by-slot reading: present, right, that, you, try.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The doubled ke ke: the book reads the sentence slot by slot and says the two are different roles. */
export const F23_1 = {
  id: '23.1',
  kind: 'row',
  types: ['add'],
  title: 'Two *ke* in a row, two different roles',
  after: { section: 'oku-totonu-ke-should-ought-to', block: b => b.type === 'p' && b.text.startsWith('Notice the doubled') },
  scenes: [
    {
      key: 'feinga',
      tiles: {
        tense: [face('ʻOku', 'tense', 'present')],
        pred: [face('totonu', 'quiet', 'right')],
        that: [face('ke', 'quiet', 'that')],
        you: [face('ke', 'pronoun', 'you')],
        verb: [face('feinga', 'verb', 'try')],
      },
      before: null,
      after: { say: 'ʻOku totonu ke ke feinga.', en: 'You should try.' },
      states: [
        [['tense', 0], ['pred', 0]],
        [['tense', 0], ['pred', 0], ['that', 0]],
        [['tense', 0], ['pred', 0], ['that', 0], ['you', 0]],
        [['tense', 0], ['pred', 0], ['that', 0], ['you', 0], ['verb', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'that', to: 1 },
        { kind: 'add', tile: 'you', to: 2 },
        { kind: 'add', tile: 'verb', to: 3 },
        { kind: 'en' },
      ],
      alt: [
        '*ʻOku totonu ke ke feinga.* You should try.',
        'The first *ke* is the subordinator ("that"). The second *ke* is the pronoun "you."',
        'Slot by slot: *ʻoku* (present) + *totonu* (right) + *ke* (that) + *ke* (you) + *feinga* (try).',
      ],
    },
  ],
}

/** A pronoun follows ke; with a noun subject ke is followed directly by the verb and the subject comes at the end with ʻa. */
export const F23_2 = {
  id: '23.2',
  kind: 'fork',
  types: ['fork'],
  title: 'What comes after *ke*? It depends on the subject',
  after: { section: 'oku-totonu-ke-should-ought-to', block: b => b.type === 'p' && b.text.startsWith('When a noun subject') },
  lanes: [
    { label: 'A pronoun', forms: ['ke'] },
    { label: 'A noun subject, after the verb', forms: ['Sione'] },
  ],
  scenes: [
    {
      key: 'lotu-tokoni',
      cases: [
        {
          lane: 0, say: 'ʻOku totonu ke ke lotu.', en: 'You should pray.',
          row: [face('ʻOku totonu ke', 'quiet', ' '), { slot: true, form: face('ke', 'pronoun'), label: true }, face('lotu', 'verb')],
        },
        {
          lane: 1, say: 'ʻOku totonu ke tokoni ʻa Sione.', en: 'Sione should help.',
          row: [face('ʻOku totonu ke', 'quiet', ' '), face('tokoni', 'verb'), face('ʻa', 'focus'), { slot: true, form: face('Sione', 'noun'), label: true }],
        },
      ],
    },
  ],
  alt: [
    'With a pronoun, *ke* is followed by the pronoun and then the verb. *ʻOku totonu ke ke lotu.* You should pray.',
    'When a noun subject appears instead of a pronoun, the *ke* is followed directly by the verb, and the subject comes after it, here with *ʻa*. *ʻOku totonu ke tokoni ʻa Sione.* Sione should help.',
  ],
}

/** The lesson's main choice, in the book's words: what is right or proper, what is necessary or inevitable. */
export const F23_3 = {
  id: '23.3',
  kind: 'fork',
  types: ['fork'],
  title: 'Right and proper, or necessary?',
  after: { section: 'kuo-pau-ke-must-certainly', block: b => b.type === 'table' },
  lanes: [
    { label: 'What is right or proper', forms: ['ʻoku totonu ke'] },
    { label: 'What is necessary or inevitable', forms: ['kuo pau ke'] },
  ],
  scenes: [
    {
      key: 'ako',
      cases: [
        {
          lane: 0, say: 'ʻOku totonu ke ke ako.', en: 'You should study. (It is the right thing to do.)',
          row: [{ slot: true, form: face('ʻOku totonu ke', 'quiet', ' '), label: true }, face('ke', 'pronoun'), face('ako', 'verb')],
        },
        {
          lane: 1, say: 'Kuo pau ke ke ako.', en: 'You must study. (It is necessary.)',
          row: [{ slot: true, form: face('Kuo pau ke', 'quiet', ' '), label: true }, face('ke', 'pronoun'), face('ako', 'verb')],
        },
      ],
    },
  ],
  alt: [
    '*ʻoku totonu ke* expresses what is right or proper. *ʻOku totonu ke ke ako.* You should study. (It is the right thing to do.)',
    '*kuo pau ke* expresses what is necessary or inevitable. *Kuo pau ke ke ako.* You must study. (It is necessary.)',
  ],
}

/** "Insert ʻikai between the tense marker and totonu": one tile arrives, everything else holds still. */
export const F23_4 = {
  id: '23.4',
  kind: 'row',
  types: ['add'],
  title: '*ʻikai* goes between the tense marker and *totonu*',
  after: { section: 'negating-obligation-oku-ikai-totonu-ke', block: b => b.type === 'p' && b.text.startsWith('To say') },
  scenes: [
    {
      key: 'hau',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        neg: [face('ʻikai', 'quiet', ' ')],
        pred: [face('totonu ke', 'quiet', ' ')],
        pron: [face('u', 'pronoun')],
        verb: [face('haʻu', 'verb')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ʻOku totonu ke u haʻu.', en: 'I should come.' },
        { say: 'ʻOku ʻikai totonu ke u haʻu.', en: 'I should not come.' },
      ],
      states: [
        [['tense', 0], ['pred', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pred', 0], ['pron', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'neg', to: 1 }],
      alt: [
        '*ʻOku totonu ke u haʻu.* I should come. becomes *ʻOku ʻikai totonu ke u haʻu.* I should not come.',
        '*ʻikai* goes between the tense marker and *totonu*.',
      ],
    },
    {
      key: 'tevita',
      tiles: {
        tense: [face('Naʻe', 'tense')],
        neg: [face('ʻikai', 'quiet', ' ')],
        pred: [face('totonu ke', 'quiet', ' ')],
        rest: [face('ʻi heni ʻa Tēvita', 'quiet', ' ')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Naʻe totonu ke ʻi heni ʻa Tēvita.', en: 'Tēvita should have been here.' },
        { say: 'Naʻe ʻikai totonu ke ʻi heni ʻa Tēvita.', en: 'Tēvita should not have been here.' },
      ],
      states: [
        [['tense', 0], ['pred', 0], ['rest', 0]],
        [['tense', 0], ['neg', 0], ['pred', 0], ['rest', 0]],
      ],
      beats: [{ kind: 'add', tile: 'neg', to: 1 }],
      alt: [
        '*Naʻe totonu ke ʻi heni ʻa Tēvita.* Tēvita should have been here. becomes *Naʻe ʻikai totonu ke ʻi heni ʻa Tēvita.* Tēvita should not have been here.',
        'The past tense form uses *naʻe*, and *ʻikai* follows it.',
      ],
    },
  ],
}

/** The two negatives put the "not" in different places, and the book says the tone differs. Both sentences are from its table of all patterns. */
export const F23_5 = {
  id: '23.5',
  kind: 'fork',
  types: ['fork'],
  title: 'Both say “should not”, but the tone differs',
  after: { section: 'emphatic-should-not-oku-totonu-ke-oua-naa', block: b => b.type === 'p' && b.text.startsWith('Both negative forms') },
  lanes: [
    { label: 'A plain statement of what is not proper', forms: ['ʻikai'] },
    { label: 'Carries more weight', forms: ['ʻoua naʻa'] },
  ],
  scenes: [
    {
      key: 'mohe',
      cases: [
        {
          lane: 0, say: 'ʻOku ʻikai totonu ke ke mohe.', en: 'You should not sleep.',
          row: [face('ʻOku', 'tense'), { slot: true, form: face('ʻikai', 'quiet', ' '), label: true }, face('totonu ke', 'quiet', ' '), face('ke', 'pronoun'), face('mohe', 'verb')],
        },
        {
          lane: 1, say: 'ʻOku totonu ke ʻoua naʻá ke mohe.', en: 'You shouldn\'t sleep.',
          row: [face('ʻOku', 'tense'), face('totonu ke', 'quiet', ' '), { slot: true, form: face('ʻoua naʻá', 'quiet', ' '), label: true }, face('ke', 'pronoun'), face('mohe', 'verb')],
        },
      ],
    },
  ],
  alt: [
    '*ʻOku ʻikai totonu ke* is a plain statement of what is not proper. *ʻOku ʻikai totonu ke ke mohe.* You should not sleep.',
    '*ʻOku totonu ke ʻoua naʻa* carries more weight, with *ʻoua naʻa* inside the *ke* clause. *ʻOku totonu ke ʻoua naʻá ke mohe.* You shouldn\'t sleep.',
  ],
}

/** "Treat each obligation pattern as a single unit": the unit, then the pronoun and verb. */
export const OPENING = {
  row: [face('ʻOku totonu ke', 'quiet', ' '), face('u', 'pronoun'), face('ako', 'verb')],
  say: 'ʻOku totonu ke u ako.',
  en: 'I should study.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku totonu ke ke feinga.', en: 'You should try.' },
  { to: 'Kuo pau ke u foki ki fale.', en: 'I must go home.' },
  { to: 'ʻOku ʻikai totonu ke ke nofo heni.', en: 'You should not stay here.' },
]

export const FIGURES = [F23_1, F23_2, F23_3, F23_4, F23_5]
