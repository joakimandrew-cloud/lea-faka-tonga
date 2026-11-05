// Lesson 31's figures, as data. Every Tongan and English string is copied from
// book/Chapter-31.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its macrons and stress accents kept. The table of foʻi nouns, the Preview notes,
// the Summary and Words to Learn already show their point, so they get no figure.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })
const neg = text => face(text, 'quiet', 'negative')
const group = text => face(text, 'quiet', '*ha* + noun')
const where = text => face(text, 'place', 'location')

/** "The pattern": the pieces of an existential land one at a time, with ʻi ai in the verb slot. */
export const F31_1 = {
  id: '31.1',
  kind: 'row',
  types: ['add'],
  title: 'The pattern: *ʻoku* + *ʻi ai* + *ha* + noun (+ location)',
  after: { section: 'there-is-there-are-oku-i-ai', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('tangata')) },
  scenes: [
    {
      key: 'tangata',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        verb: [face('ʻi ai', 'verb')],
        noun: [group('ha tangata')],
        place: [where('ʻi heni')],
      },
      before: null,
      after: { say: 'ʻOku ʻi ai ha tangata ʻi heni?', en: 'Is there a man here?' },
      states: [
        [['tense', 0], ['verb', 0]],
        [['tense', 0], ['verb', 0], ['noun', 0]],
        [['tense', 0], ['verb', 0], ['noun', 0], ['place', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'noun', to: 1 },
        { kind: 'add', tile: 'place', to: 2 },
        { kind: 'en' },
      ],
      alt: [
        'The pattern: *ʻoku* + *ʻi ai* + *ha* + noun (+ location).',
        '*ʻOku ʻi ai ha tangata ʻi heni?* Is there a man here?',
      ],
    },
  ],
}

function tenseScene(key, tense, noun, rest, say, en) {
  return {
    key,
    tiles: { tense: [face(tense, 'tense')], verb: [face('ʻi ai', 'verb')], noun: [group(noun)], rest: [rest] },
    before: null,
    after: { say, en },
    states: [
      [['verb', 0], ['noun', 0], ['rest', 0]],
      [['tense', 0], ['verb', 0], ['noun', 0], ['rest', 0]],
    ],
    beats: [{ kind: 'add', tile: 'tense', to: 1 }, { kind: 'en' }],
    alt: ['With other tense markers, the construction works the same way.', `*${say}* ${en}`],
  }
}

/** "With other tense markers, the construction works the same way": the marker arrives in front. */
export const F31_2 = {
  id: '31.2',
  kind: 'row',
  types: ['add'],
  title: 'Other tense markers, the same construction',
  after: { section: 'there-is-there-are-oku-i-ai', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('kātoanga')) },
  scenes: [
    tenseScene('nae', 'Naʻe', 'ha vaka', where('ʻi tahi'), 'Naʻe ʻi ai ha vaka ʻi tahi.', 'There was a boat at sea.'),
    tenseScene('e', 'ʻE', 'ha kātoanga', face('ʻapongipongi', 'quiet'), 'ʻE ʻi ai ha kātoanga ʻapongipongi.', 'There will be a celebration tomorrow.'),
  ],
}

function negScene(key, tense, noun, say, en) {
  return {
    key,
    tiles: { tense: [face(tense, 'tense')], neg: [neg('ʻikai ke')], verb: [face('ʻi ai', 'verb')], noun: [group(noun)] },
    before: null,
    after: { say, en },
    states: [
      [['tense', 0], ['verb', 0], ['noun', 0]],
      [['tense', 0], ['neg', 0], ['verb', 0], ['noun', 0]],
    ],
    beats: [{ kind: 'add', tile: 'neg', to: 1 }, { kind: 'en' }],
    alt: ['Place *ʻikai ke* before *ʻi ai*.', `*${say}* ${en}`],
  }
}

/** "Place ʻikai ke before ʻi ai": one piece arrives, all else holds still. */
export const F31_3 = {
  id: '31.3',
  kind: 'row',
  types: ['add'],
  title: 'Place *ʻikai ke* before *ʻi ai*',
  after: { section: 'there-is-not-oku-ikai-ke-i-ai', block: b => b.type === 'examples' && b.pairs.some(p => p.tongan.includes('ha taha')) },
  scenes: [
    negScene('taha', 'ʻOku', 'ha taha', 'ʻOku ʻikai ke ʻi ai ha taha.', 'There is no one.'),
    negScene('vaka', 'Naʻe', 'ha vaka', 'Naʻe ʻikai ke ʻi ai ha vaka.', 'There was no boat.'),
  ],
}

/** "The ke ʻi ai is often dropped": the same English either side, and the book keeps the full form. */
export const F31_4 = {
  id: '31.4',
  kind: 'row',
  types: ['drop'],
  title: 'In everyday speech, *ke ʻi ai* is often dropped',
  after: { section: 'there-is-not-oku-ikai-ke-i-ai', block: b => b.type === 'p' && b.text.startsWith('In everyday speech') },
  limit: {
    row: [face('ʻoku ʻikai ke ʻi ai', 'quiet')],
    en: 'there is not',
    caption: 'This book always teaches and drills the full form.',
  },
  scenes: [
    {
      key: 'meakai',
      tiles: {
        tense: [face('ʻOku', 'tense')],
        neg: [face('ʻikai', 'quiet', ' ')],
        core: [face('ke ʻi ai', 'quiet', '*ke* + *ʻi ai*')],
        noun: [group('ha meʻakai')],
        place: [where('ʻi fale')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'ʻOku ʻikai ke ʻi ai ha meʻakai ʻi fale.', en: 'There is no food in the house.' },
        { say: 'ʻOku ʻikai ha meʻakai ʻi fale', en: 'There is no food in the house.' },
      ],
      states: [
        [['tense', 0], ['neg', 0], ['core', 0], ['noun', 0], ['place', 0]],
        [['tense', 0], ['neg', 0], ['GHOST'], ['noun', 0], ['place', 0]],
      ],
      beats: [{ kind: 'drop', tile: 'core', to: 1 }, { kind: 'limit' }],
      alt: [
        '*ʻOku ʻikai ke ʻi ai ha meʻakai ʻi fale.* There is no food in the house.',
        'In everyday speech, the *ke ʻi ai* is often dropped: *ʻOku ʻikai ha meʻakai ʻi fale*, for "there is no food in the house." This book always teaches and drills the full *ʻoku ʻikai ke ʻi ai*.',
      ],
    },
  ],
}

/** "Without foʻi, the noun is more general": foʻi arrives, and the meaning narrows to one. */
export const F31_5 = {
  id: '31.5',
  kind: 'row',
  types: ['add'],
  title: 'Without *foʻi*, the noun is more general',
  after: { section: 'the-classifier-foi-in-existential-contexts', block: b => b.type === 'p' && b.text.startsWith('Without') },
  scenes: [
    {
      key: 'niu',
      tiles: {
        ha: [face('Ha', 'quiet', ' ')],
        foi: [face('foʻi', 'quiet', 'classifier')],
        noun: [face('niu', 'quiet', 'noun')],
      },
      before: null,
      after: null,
      lines: [
        { say: 'Ha niu', en: 'could mean a coconut, some coconuts, or even a coconut tree, depending on context.' },
        { say: 'Ha foʻi niu', en: 'means specifically one coconut.' },
      ],
      states: [
        [['ha', 0], ['noun', 0]],
        [['ha', 0], ['foi', 0], ['noun', 0]],
      ],
      beats: [{ kind: 'add', tile: 'foi', to: 1 }],
      alt: [
        'Without *foʻi*, the noun is more general. *Ha niu* could mean a coconut, some coconuts, or even a coconut tree, depending on context.',
        '*Ha foʻi niu* means specifically one coconut.',
      ],
    },
  ],
}

export const OPENING = {
  row: [face('ʻOku', 'tense'), face('ʻi ai', 'verb'), group('ha tangata')],
  say: 'ʻOku ʻi ai ha tangata.',
  en: 'There is a man.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻOku ʻi ai ha tangata ʻi heni?', en: 'Is there a man here?' },
  { to: 'ʻOku ʻikai ke ʻi ai ha meʻakai ʻi fale.', en: 'There is no food in the house.' },
  { to: 'ʻOku ʻi ai ha foʻi siaine ʻi he kato?', en: 'Is there a banana in the basket?' },
]

export const FIGURES = [F31_1, F31_2, F31_3, F31_4, F31_5]
