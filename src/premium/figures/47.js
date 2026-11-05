// Lesson 47's figures, as data. Every Tongan and English string is copied from
// book/Chapter-47.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Labels are the book's own words:
// "conjunction", "future tense marker", "adverb".
//
// No figure for ka ʻi ai (a definition with examples), for the past ka ne (its table
// says it), for the present counterfactual's main-clause markers (the table gives them
// with the same strings and the book prints no sentence for ʻoku), for ka ne ʻikai and
// taʻeʻoua (the book's pairs differ in more than the word), for heiʻilo (one example),
// or for Words to Learn and the Exercises.

const face = (text, role, label) => ({ text, role, ...(label != null ? { label } : {}) })

/** Noun subject: ka once, before the verb. Pronoun subject: ka, the pronoun, then a second ka. */
export const F47_1 = {
  id: '47.1',
  kind: 'fork',
  types: ['fork'],
  title: 'With a pronoun subject, a second *ka*',
  after: { section: 'conditional-future-ka', block: b => b.type === 'p' && b.text.startsWith('The first') },
  lanes: [
    { label: 'Noun subject', forms: ['ka'] },
    { label: 'Pronoun subject', forms: ['ka'] },
  ],
  scenes: [
    {
      key: 'siale',
      cases: [
        {
          lane: 0, say: 'Ka haʻu ʻa Siale, peá ke tala ki ai.', en: 'When Siale comes, tell him.',
          row: [{ slot: true, form: face('Ka', 'quiet', 'conjunction') }, face('haʻu', 'verb'), face('ʻa', 'focus'), { ...face('Siale,', 'noun'), ring: true, label: 'noun' }, face('peá ke tala ki ai.', 'quiet')],
        },
        {
          lane: 1, say: 'Ka ke ka fakaʻosi hoʻo ngāue, té ke fiefia lahi.', en: 'Whenever you finish your work, you will be very happy.',
          row: [face('Ka', 'quiet', 'conjunction'), { ...face('ke', 'pronoun'), ring: true, label: 'pronoun' }, { slot: true, form: face('ka', 'tense', 'future tense marker') }, face('fakaʻosi', 'verb'), face('hoʻo ngāue, té ke fiefia lahi.', 'quiet')],
        },
      ],
    },
    {
      key: 'mele',
      cases: [
        {
          lane: 0, say: 'Ka puke ʻa Mele, peá ke tala mai.', en: 'If Mele gets sick, tell me.',
          row: [{ slot: true, form: face('Ka', 'quiet', 'conjunction') }, face('puke', 'verb'), face('ʻa', 'focus'), { ...face('Mele,', 'noun'), ring: true, label: 'noun' }, face('peá ke tala mai.', 'quiet')],
        },
        {
          lane: 1, say: 'Ka nau ka lea mai, té u tala kiate kinautolu.', en: 'If they speak to me, I will tell them.',
          row: [face('Ka', 'quiet', 'conjunction'), { ...face('nau', 'pronoun'), ring: true, label: 'pronoun' }, { slot: true, form: face('ka', 'tense', 'future tense marker') }, face('lea', 'verb'), face('mai, té u tala kiate kinautolu.', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    'Noun subject: *ka* appears once, directly before the verb. *Ka haʻu ʻa Siale, peá ke tala ki ai.* When Siale comes, tell him. *Ka puke ʻa Mele, peá ke tala mai.* If Mele gets sick, tell me.',
    'Pronoun subject: the pronoun sits between the conjunction *ka* and a second *ka*, the future tense marker. *Ka ke ka fakaʻosi hoʻo ngāue, té ke fiefia lahi.* Whenever you finish your work, you will be very happy. *Ka nau ka lea mai, té u tala kiate kinautolu.* If they speak to me, I will tell them.',
  ],
}

/** The book's own pair: only Kapau ʻe becomes Ka, and the likelihood changes. */
export const F47_2 = {
  id: '47.2',
  kind: 'row',
  types: ['swap'],
  title: '*kapau* leaves the outcome open; *ka* leans toward it happening',
  after: { section: 'ka-versus-kapau', block: b => b.type === 'p' && b.text.includes('leaves the outcome open') },
  scenes: [
    {
      key: 'semisi',
      tiles: {
        conj: [face('Kapau ʻe', 'quiet', ''), face('Ka', 'quiet', '')],
        verb: [face('haʻu', 'verb')],
        subj: [face('ʻa Sēmisi,', 'noun')],
        rest: [face('té u loto mamahi.', 'quiet')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Kapau ʻe haʻu ʻa Sēmisi, té u loto mamahi.', en: 'If Sēmisi comes, I will be upset. (He probably will not come.)' },
        { say: 'Ka haʻu ʻa Sēmisi, té u loto mamahi.', en: 'When(ever) Sēmisi comes, I will be upset. (He is probably coming.)' },
      ],
      states: [
        [['conj', 0], ['verb', 0], ['subj', 0], ['rest', 0]],
        [['conj', 1], ['verb', 0], ['subj', 0], ['rest', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'conj', old: true, to: 1 }],
      alt: [
        '*Kapau ʻe haʻu ʻa Sēmisi, té u loto mamahi.* If Sēmisi comes, I will be upset. (He probably will not come.)',
        'becomes *Ka haʻu ʻa Sēmisi, té u loto mamahi.* When(ever) Sēmisi comes, I will be upset. (He is probably coming.)',
      ],
    },
  ],
}

/** mei arrives before the verb: "nearly", and in a conditional's main clause "would". */
export const F47_3 = {
  id: '47.3',
  kind: 'row',
  types: ['add'],
  title: '*mei* before the verb: nearly, or would',
  after: { section: 'moderative-mei-nearly-would-should-might', block: b => b.type === 'p' && b.text.startsWith('The connection between') },
  scenes: [
    {
      key: 'osi',
      tiles: { kuo: [face('Kuo', 'tense')], mei: [face('mei', 'particle', 'adverb')], verb: [face('ʻosi', 'verb')] },
      before: null,
      after: { say: 'Kuo mei ʻosi.', en: 'It is nearly finished.' },
      states: [
        [['kuo', 0], ['verb', 0]],
        [['kuo', 0], ['mei', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'mei', to: 1 }, { kind: 'en' }],
      alt: ['*Kuo mei ʻosi.* It is nearly finished.', '*mei* (nearly) is placed before the verb.'],
    },
    {
      key: 'ita',
      tiles: {
        cond: [face('Ka ne ʻikai ke pehē,', 'quiet', '')],
        tense: [face('naʻá', 'tense')],
        pron: [face('ku', 'pronoun')],
        mei: [face('mei', 'particle', 'adverb')],
        verb: [face('ʻita', 'verb')],
      },
      before: null,
      after: { say: 'Ka ne ʻikai ke pehē, naʻá ku mei ʻita.', en: 'If it were not so, I would be angry.' },
      states: [
        [['cond', 0], ['tense', 0], ['pron', 0], ['verb', 0]],
        [['cond', 0], ['tense', 0], ['pron', 0], ['mei', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'mei', to: 1 }, { kind: 'en' }],
      alt: ['*Ka ne ʻikai ke pehē, naʻá ku mei ʻita.* If it were not so, I would be angry.', 'In conditional sentences, *mei* appears in the main clause to express what would have happened.'],
    },
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Ka', 'quiet', 'conjunction'), face('haʻu', 'verb'), face('ʻa', 'focus'), face('Siale,', 'noun'), face('peá ke tala ki ai.', 'quiet')],
  say: 'Ka haʻu ʻa Siale, peá ke tala ki ai.',
  en: 'When Siale comes, tell him.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Ka haʻu ʻa Siale, peá ke tala ki ai.', en: 'When Siale comes, tell him.' },
  { to: 'Ka ne u feinga, naʻá ku lava.', en: 'Had I tried, I would have succeeded.' },
  { to: 'Ka ne ʻikai ʻa Mele, ʻoku ʻikai lava e ngāué.', en: 'If it were not for Mele, the work could not be done.' },
]

export const FIGURES = [F47_1, F47_2, F47_3]
