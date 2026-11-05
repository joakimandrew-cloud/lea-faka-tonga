// Lesson 50's figures, as data. Every Tongan and English string is copied from
// book/Chapter-50.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents, macrons and the book's protraction dashes kept. The book's
// tables already show base and reduplicated forms side by side, so they get no figure;
// the one picture is the repeated verb, a change inside a sentence.

const face = (text, role, label) => ({ text, role, ...(label ? { label } : {}) })

/** The pattern line: repeat the verb with no intervening word, optionally lengthen its stressed vowel. */
export const F50_1 = {
  id: '50.1',
  kind: 'row',
  types: ['add', 'swap'],
  title: 'Repeat the verb, with no word between',
  after: { section: 'expressive-sound-devices', block: b => b.type === 'p' && b.text.startsWith('The pattern is') },
  scenes: [
    {
      key: 'tuli',
      tiles: {
        tense: [face('Naʻa', 'tense')],
        pron: [face('nau', 'pronoun')],
        verb: [face('tuli', 'verb'), face('tūli', 'verb')],
        verb2: [face('tuli', 'verb'), face('tūli', 'verb')],
        rest: [face('ʻo aʻu ki he vao', 'quiet')],
      },
      before: null,
      after: { say: 'Naʻa nau tūli tūli ʻo aʻu ki he vao.', en: 'They chased and chased all the way to the bush.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['rest', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['verb2', 0], ['rest', 0]],
        [['tense', 0], ['pron', 0], ['verb', 1], ['verb2', 1], ['rest', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'verb2', to: 1 },
        { kind: 'swap', tile: ['verb', 'verb2'], to: 2 },
        { kind: 'en' },
      ],
      alt: [
        '*Naʻa nau tūli tūli ʻo aʻu ki he vao.* They chased and chased all the way to the bush.',
        'The original verb *tuli* (to chase) has its penultimate vowel *u* lengthened to *ū* when repeated: *tūli tūli*. This lengthening signals that the chasing went on for a long time, not just that it happened twice.',
      ],
    },
    {
      key: 'tohi',
      tiles: {
        tense: [face('Naʻá', 'tense')],
        pron: [face('ne', 'pronoun')],
        verb: [face('tohi', 'verb')],
        verb2: [face('tohi', 'verb')],
        rest: [face('pea ʻosi ʻa e tohí', 'quiet')],
      },
      before: null,
      after: { say: 'Naʻá ne tohi tohi pea ʻosi ʻa e tohí.', en: 'He wrote and wrote until the book was finished.' },
      states: [
        [['tense', 0], ['pron', 0], ['verb', 0], ['rest', 0]],
        [['tense', 0], ['pron', 0], ['verb', 0], ['verb2', 0], ['rest', 0]],
      ],
      beats: [
        { kind: 'add', tile: 'verb2', to: 1 },
        { kind: 'en' },
      ],
      alt: [
        '*Naʻá ne tohi tohi pea ʻosi ʻa e tohí.* He wrote and wrote until the book was finished.',
        'Here *tohi* does not show visible lengthening in spelling. The key structural signal is the immediate repetition of the verb.',
      ],
    },
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('ʻOku', 'tense'), face('luoluo', 'verb', 'adjective'), face('ʻa', 'focus'), face('e halá', 'noun')],
  say: 'ʻOku luoluo ʻa e halá.',
  en: 'The road is full of holes.',
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'ʻoku lahilahi pē', en: 'it is just moderately big' },
  { to: 'ʻOku ʻuliʻuli ʻa e langi hé.', en: 'The sky over there is black.' },
  { to: 'ʻOku fakapotopoto ʻa e faiakó.', en: 'The teacher is wise.' },
]

export const FIGURES = [F50_1]
