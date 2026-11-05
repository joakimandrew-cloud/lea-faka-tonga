// Lesson 9's figures, as data. Every Tongan and English string is copied from
// book/Chapter-09.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept. Exercise answers stay out. No figure for
// the section on the one-word answer, nor for the tenses table, which shows its point.

const face = (text, role, label) => ({ text, role, ...(label === undefined ? {} : { label }) })
const neg = text => face(text, 'quiet', 'negative')

export const F9_1 = {
  id: '9.1',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'Where *ʻikai te* goes',
  after: { section: 'saying-not-with-a-pronoun-ikai-te', block: b => b.type === 'p' && b.text.startsWith('**Negative:**') },
  scenes: [
    {
      key: 'ou',
      tiles: { tense: [face('ʻOku', 'tense')], neg: [neg('ʻikai té')], pron: [face('ou', 'pronoun'), face('u', 'pronoun')], verb: [face('fiefia', 'verb')] },
      before: { say: 'ʻOku ou fiefia.', en: 'I am happy.' },
      after: { say: 'ʻOku ʻikai té u fiefia.', en: 'I am not happy.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pron', 1], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'neg', to: 1 }, { kind: 'swap', tile: 'pron', to: 2 }, { kind: 'en' }],
      alt: [
        '*ʻOku ou fiefia.* I am happy. becomes *ʻOku ʻikai té u fiefia.* I am not happy.',
        'Place *ʻikai te* between the tense marker and the pronoun. The verb and everything after it stay in their normal positions.',
        'After *te*, the first-person singular pronoun is *u*.',
      ],
    },
    {
      key: 'ne',
      tiles: { tense: [face('ʻOkú', 'tense'), face('ʻOku', 'tense')], neg: [neg('ʻikai té')], pron: [face('ne', 'pronoun')], verb: [face('ʻita', 'verb')] },
      before: { say: 'ʻOkú ne ʻita.', en: 'He is angry.' },
      after: { say: 'ʻOku ʻikai té ne ʻita.', en: 'He is not angry.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pron', 0], ['verb', 0]],
        [['tense', 1], ['neg', 0], ['pron', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'neg', to: 1 }, { kind: 'swap', tile: 'tense', to: 2 }, { kind: 'en' }],
      alt: [
        '*ʻOkú ne ʻita.* He is angry. becomes *ʻOku ʻikai té ne ʻita.* He is not angry.',
        'Place *ʻikai te* between the tense marker and the pronoun. All other pronouns keep their usual forms.',
      ],
    },
    {
      key: 'nau',
      tiles: { tense: [face('ʻOku', 'tense')], neg: [neg('ʻikai te')], pron: [face('nau', 'pronoun')], verb: [face('fiekaia', 'verb')] },
      before: { say: 'ʻOku nau fiekaia.', en: 'They are hungry.' },
      after: { say: 'ʻOku ʻikai te nau fiekaia.', en: 'They are not hungry.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pron', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'neg', to: 1 }, { kind: 'en' }],
      alt: [
        '*ʻOku nau fiekaia.* They are hungry. becomes *ʻOku ʻikai te nau fiekaia.* They are not hungry.',
        'Place *ʻikai te* between the tense marker and the pronoun. All other pronouns keep their usual forms.',
      ],
    },
  ],
}

export const F9_2 = {
  id: '9.2',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'Past and future: *ʻikai* changes the marker',
  // After both paragraphs, the past and the future, so the two stay together. The book gives
  // naʻá ku fiefia and Té u fiefia no English, so their before lines carry none.
  after: { section: 'negation-across-tenses', block: b => b.type === 'p' && b.text.startsWith('The same logic explains the future') },
  scenes: [
    {
      key: 'past',
      tiles: { tense: [face('naʻá', 'tense'), face('Naʻe', 'tense')], neg: [neg('ʻikai té')], pron: [face('ku', 'pronoun'), face('u', 'pronoun')], verb: [face('fiefia', 'verb')] },
      before: { say: 'naʻá ku fiefia' },
      after: { say: 'Naʻe ʻikai té u fiefia.', en: 'I was not happy.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pron', 0], ['verb', 0]],
        [['tense', 1], ['neg', 0], ['pron', 0], ['verb', 0]],
        [['tense', 1], ['neg', 0], ['pron', 1], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'neg', to: 1 }, { kind: 'swap', tile: 'tense', to: 2 }, { kind: 'swap', tile: 'pron', to: 3 }, { kind: 'en' }],
      alt: [
        '*naʻá ku fiefia* becomes *Naʻe ʻikai té u fiefia.* I was not happy.',
        '*naʻa* appears before pronouns, *naʻe* appears elsewhere. Since *ʻikai* is not a pronoun, the past negative uses *naʻe*.',
      ],
    },
    {
      key: 'future',
      tiles: { tense: [face('Té', 'tense'), face('ʻE', 'tense')], neg: [neg('ʻikai té')], pron: [face('u', 'pronoun')], verb: [face('fiefia', 'verb')] },
      before: { say: 'Té u fiefia.' },
      after: { say: 'ʻE ʻikai té u fiefia.', en: 'I will not be happy.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pron', 0], ['verb', 0]],
        [['tense', 1], ['neg', 0], ['pron', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'neg', to: 1 }, { kind: 'swap', tile: 'tense', to: 2 }, { kind: 'en' }],
      alt: [
        '*Té u fiefia.* becomes *ʻE ʻikai té u fiefia.* I will not be happy.',
        'In the negative, the tense marker is followed by *ʻikai*, so *ʻe* is used.',
      ],
    },
  ],
}

export const F9_3 = {
  id: '9.3',
  kind: 'fork',
  types: ['fork'],
  title: '*ʻikai te* or *ʻikai ke*?',
  after: { section: 'when-there-is-no-pronoun-ikai-ke', block: b => b.type === 'p' && b.text.startsWith('The rule:') },
  lanes: [
    { label: 'Before a pronoun', forms: ['ʻikai te'] },
    { label: 'Directly before a verb', forms: ['ʻikai ke'] },
  ],
  scenes: [
    {
      key: 'present',
      cases: [
        {
          lane: 0, say: 'ʻOku ʻikai té ne helaʻia.', en: 'He is not tired.',
          row: [face('ʻOku', 'tense'), { slot: true, form: face('ʻikai té', 'quiet') }, { ...face('ne', 'pronoun'), ring: true, label: 'pronoun' }, face('helaʻia', 'verb')],
        },
        {
          lane: 1, say: 'ʻOku ʻikai ke ʻuha.', en: 'It is not raining.',
          row: [face('ʻOku', 'tense'), { slot: true, form: face('ʻikai ke', 'quiet') }, { ...face('ʻuha', 'verb'), ring: true, label: 'verb' }],
        },
      ],
    },
    {
      key: 'past',
      cases: [
        {
          lane: 0, say: 'Naʻe ʻikai te mau kai ika ʻanepō.', en: 'We did not eat fish last night.',
          row: [face('Naʻe', 'tense'), { slot: true, form: face('ʻikai te', 'quiet') }, { ...face('mau', 'pronoun'), ring: true, label: 'pronoun' }, face('kai', 'verb'), face('ika ʻanepō', 'quiet')],
        },
        {
          lane: 1, say: 'Naʻe ʻikai ke matangi ʻanepō.', en: 'It was not windy last night.',
          row: [face('Naʻe', 'tense'), { slot: true, form: face('ʻikai ke', 'quiet') }, { ...face('matangi', 'verb'), ring: true, label: 'verb' }, face('ʻanepō', 'quiet')],
        },
      ],
    },
    {
      key: 'future',
      cases: [
        {
          lane: 0, say: 'ʻE ʻikai té ke nofo ʻi Tonga.', en: 'You will not stay in Tonga.',
          row: [face('ʻE', 'tense'), { slot: true, form: face('ʻikai té', 'quiet') }, { ...face('ke', 'pronoun'), ring: true, label: 'pronoun' }, face('nofo', 'verb'), face('ʻi Tonga', 'place')],
        },
        {
          lane: 1, say: 'ʻE ʻikai ke momoko ʻapongipongi.', en: 'It will not be cold tomorrow.',
          row: [face('ʻE', 'tense'), { slot: true, form: face('ʻikai ke', 'quiet') }, { ...face('momoko', 'verb'), ring: true, label: 'verb' }, face('ʻapongipongi', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    '*ʻikai te* appears before a pronoun. *ʻOku ʻikai té ne helaʻia.* He is not tired. *Naʻe ʻikai te mau kai ika ʻanepō.* We did not eat fish last night. *ʻE ʻikai té ke nofo ʻi Tonga.* You will not stay in Tonga.',
    '*ʻIkai ke* appears directly before a verb. *ʻOku ʻikai ke ʻuha.* It is not raining. *Naʻe ʻikai ke matangi ʻanepō.* It was not windy last night. *ʻE ʻikai ke momoko ʻapongipongi.* It will not be cold tomorrow.',
  ],
}

export const F9_4 = {
  id: '9.4',
  kind: 'row',
  types: ['add'],
  title: 'Where *loko* sits',
  after: { section: 'softening-a-negative-loko', block: b => b.type === 'p' && b.text.startsWith('The pattern is always') },
  scenes: [
    {
      key: 'ika',
      tiles: { tense: [face('ʻOku', 'tense')], neg: [neg('ʻikai ke')], loko: [face('loko', 'particle', 'modifier')], verb: [face('lelei', 'verb')], rest: [face('ʻa e ika', 'quiet')] },
      before: null,
      after: { say: 'ʻOku ʻikai ke loko lelei ʻa e ika.', en: 'The fish is not too good.' },
      states: [
        [['tense', 0], ['neg', 0], ['verb', 0], ['rest', 0]],
        [['tense', 0], ['neg', 0], ['loko', 0], ['verb', 0], ['rest', 0]],
      ],
      beats: [{ kind: 'add', tile: 'loko', to: 1 }, { kind: 'en' }],
      alt: ['*ʻOku ʻikai ke loko lelei ʻa e ika.* The fish is not too good.', 'The pattern is always: negative + *ke* + *loko* + verb.'],
    },
    {
      key: 'ngaue',
      tiles: { tense: [face('Naʻe', 'tense')], neg: [neg('ʻikai ke')], loko: [face('loko', 'particle', 'modifier')], verb: [face('lelei', 'verb')], rest: [face('ʻemau ngāué', 'quiet')] },
      before: null,
      after: { say: 'Naʻe ʻikai ke loko lelei ʻemau ngāué.', en: 'Our work was not too good.' },
      states: [
        [['tense', 0], ['neg', 0], ['verb', 0], ['rest', 0]],
        [['tense', 0], ['neg', 0], ['loko', 0], ['verb', 0], ['rest', 0]],
      ],
      beats: [{ kind: 'add', tile: 'loko', to: 1 }, { kind: 'en' }],
      alt: ['*Naʻe ʻikai ke loko lelei ʻemau ngāué.* Our work was not too good.', 'The pattern is always: negative + *ke* + *loko* + verb.'],
    },
  ],
}

export const F9_5 = {
  id: '9.5',
  kind: 'row',
  types: ['add'],
  title: 'Where *teitei* sits',
  after: { section: 'strengthening-a-negative-teitei', block: b => b.type === 'p' && b.text.startsWith('The pattern:') },
  scenes: [
    {
      key: 'ngaue',
      tiles: { tense: [face('ʻOku', 'tense')], neg: [neg('ʻikai té')], pron: [face('u', 'pronoun')], teitei: [face('teitei', 'particle', '')], verb: [face('ngāue', 'verb')] },
      before: null,
      after: { say: 'ʻOku ʻikai té u teitei ngāue.', en: 'I absolutely do not work.' },
      states: [
        [['tense', 0], ['neg', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pron', 0], ['teitei', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'teitei', to: 1 }, { kind: 'en' }],
      alt: ['*ʻOku ʻikai té u teitei ngāue.* I absolutely do not work.', 'The pattern: negative + TM + pronoun + *teitei* + verb.'],
    },
    {
      key: 'alu',
      tiles: { tense: [face('ʻE', 'tense')], neg: [neg('ʻikai té')], pron: [face('u', 'pronoun')], teitei: [face('teitei', 'particle', '')], verb: [face('ʻalu', 'verb')] },
      before: null,
      after: { say: 'ʻE ʻikai té u teitei ʻalu.', en: 'I am certainly not going.' },
      states: [
        [['tense', 0], ['neg', 0], ['pron', 0], ['verb', 0]],
        [['tense', 0], ['neg', 0], ['pron', 0], ['teitei', 0], ['verb', 0]],
      ],
      beats: [{ kind: 'add', tile: 'teitei', to: 1 }, { kind: 'en' }],
      alt: ['*ʻE ʻikai té u teitei ʻalu.* I am certainly not going.', 'The pattern: negative + TM + pronoun + *teitei* + verb.'],
    },
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), neg('ʻikai té'), face('u', 'pronoun'), face('fiefia', 'verb')],
  say: 'ʻOku ʻikai té u fiefia.',
  en: 'I am not happy.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku ʻikai té u fiefia.', en: 'I am not happy.' },
  { to: 'Naʻe ʻikai té u fiefia.', en: 'I was not happy.' },
  { to: 'ʻOku ʻikai ke ʻuha.', en: 'It is not raining.' },
]

export const FIGURES = [F9_1, F9_2, F9_3, F9_4, F9_5]
