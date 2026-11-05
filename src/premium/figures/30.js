// Lesson 30's figures, as data. Every Tongan and English string is copied from
// book/Chapter-30.md at origin/main, as the site renders it (straight ' to U+02BB),
// with its stress accents and macrons kept.
// No figure for lolotonga: its point is that tense markers need not match, and both of the
// book's sentences happen to match. None for ʻilonga, kehe ke or faifai: definitions with
// examples whose lines already show the point. The summary table shows the rest.

const face = (text, role, label) => ({ text, role, ...(label !== undefined ? { label } : {}) })

/** "The only difference is clause order": the result goes first and kapau becomes ʻo kapau. */
export const F30_1 = {
  id: '30.1',
  kind: 'row',
  types: ['move', 'swap'],
  title: 'The only difference is clause order',
  after: { section: 'if-kapau', block: b => b.type === 'p' && b.text.startsWith('This means the same thing') },
  scenes: [
    {
      key: 'kuki',
      tiles: {
        kapau: [face('Kapau', 'quiet', ''), face('ʻo kapau', 'quiet', '')],
        cond: [face('té ke foki,', 'quiet', 'condition'), face('té ke foki.', 'quiet', 'condition')],
        res: [face('té u kuki.', 'quiet', 'result'), face('Té u kuki', 'quiet', 'result')],
      },
      before: { say: 'Kapau té ke foki, té u kuki.', en: "If you return, I'll cook." },
      after: { say: 'Té u kuki ʻo kapau té ke foki.', en: "I'll cook if you return." },
      states: [
        [['kapau', 0], ['cond', 0], ['res', 0]],
        [['res', 1], ['kapau', 0], ['cond', 1]],
        [['res', 1], ['kapau', 1], ['cond', 1]],
      ],
      beats: [
        { kind: 'move', tile: 'res', arc: 'origin', to: 1, roll: 'cond' },
        { kind: 'swap', tile: 'kapau', to: 2 },
        { kind: 'en' },
      ],
      alt: [
        "*Kapau té ke foki, té u kuki.* If you return, I'll cook. becomes *Té u kuki ʻo kapau té ke foki.* I'll cook if you return.",
        'When the result comes first and the condition follows, *ʻo* is placed before *kapau*.',
      ],
    },
  ],
}

/** "The difference": what kaeʻoua looks forward to picks ke or kuo. */
export const F30_2 = {
  id: '30.2',
  kind: 'fork',
  types: ['fork'],
  title: 'After *kaeʻoua*: *ke* or *kuo*?',
  after: { section: 'until-kaeoua-ke', block: b => b.type === 'p' && b.text.startsWith('The difference') },
  lanes: [
    { label: 'Looks forward to a future event', forms: ['ke'] },
    { label: 'Looks forward to a point of completion', forms: ['kuo'] },
  ],
  scenes: [
    {
      key: 'until',
      cases: [
        {
          lane: 0, say: 'Té u ngāue heni kaeʻoua ke nau foki mai.', en: 'I will work here until they come back.',
          row: [face('Té u ngāue heni', 'quiet'), face('kaeʻoua', 'quiet'), { slot: true, form: face('ke', 'quiet') }, face('nau foki mai.', 'quiet')],
        },
        {
          lane: 1, say: 'ʻE nofo ai kaeʻoua kuo mālohi.', en: 'She will stay there until she is strong.',
          row: [face('ʻE nofo ai', 'quiet'), face('kaeʻoua', 'quiet'), { slot: true, form: face('kuo', 'tense') }, face('mālohi.', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    '*kaeʻoua ke* looks forward to a future event. *Té u ngāue heni kaeʻoua ke nau foki mai.* I will work here until they come back.',
    '*Kaeʻoua kuo* looks forward to a point of completion. *ʻE nofo ai kaeʻoua kuo mālohi.* She will stay there until she is strong.',
  ],
}

/** "The ʻi he pattern emphasizes a moment in time. The ko e ... pē pattern emphasizes immediacy." */
export const F30_3 = {
  id: '30.3',
  kind: 'fork',
  types: ['fork'],
  title: '*ʻi he* or *ko e ... pē*?',
  after: { section: 'when-something-happens-i-he-verbal-noun', block: b => b.type === 'p' && b.text.startsWith('Both patterns use') },
  lanes: [
    { label: 'Emphasizes a moment in time', forms: ['ʻi he'] },
    { label: 'Emphasizes immediacy', forms: ['ko e ... pē'] },
  ],
  scenes: [
    {
      key: 'when',
      cases: [
        {
          lane: 0, say: 'ʻI he ʻosi ʻenau hivá, pea nau mohe.', en: 'When they finished singing, they slept.',
          row: [{ slot: true, form: face('ʻI he', 'quiet') }, face('ʻosi ʻenau hivá,', 'quiet'), face('pea nau mohe.', 'quiet')],
        },
        {
          lane: 1, say: 'Ko e haʻu pē ʻe Mele, peá u ʻave leva ʻene kato.', en: 'As soon as Mele came, I carried her basket right away.',
          row: [{ slot: true, form: face('Ko e', 'quiet') }, face('haʻu', 'quiet'), { ...face('pē', 'quiet'), ring: true }, face('ʻe Mele,', 'quiet'), face('peá u ʻave leva ʻene kato.', 'quiet')],
        },
      ],
    },
  ],
  alt: [
    'The *ʻi he* pattern emphasizes a moment in time. *ʻI he ʻosi ʻenau hivá, pea nau mohe.* When they finished singing, they slept.',
    'The *ko e ... pē* pattern emphasizes immediacy. *Ko e haʻu pē ʻe Mele, peá u ʻave leva ʻene kato.* As soon as Mele came, I carried her basket right away.',
  ],
}

/** "neongo introduces the conceded fact while kae kehe introduces the contrasting result." */
export const F30_4 = {
  id: '30.4',
  kind: 'fork',
  types: ['fork'],
  title: '*neongo* or *kae kehe*?',
  after: { section: 'different-nevertheless-provided-that-kehe', block: b => b.type === 'p' && b.text.includes('appears at the start of a clause') },
  lanes: [
    { label: 'Introduces the conceded fact', forms: ['neongo'] },
    { label: 'Introduces the contrasting result', forms: ['kae kehe'] },
  ],
  scenes: [
    {
      key: 'concession',
      cases: [
        {
          lane: 0, say: 'Neongo ʻeku helaʻia, ka té u ngāue pē.', en: 'Although I am tired, I will work anyway.',
          row: [{ slot: true, form: face('Neongo', 'quiet') }, { ...face('ʻeku helaʻia,', 'quiet'), ring: true, label: 'conceded fact' }, face('ka té u ngāue pē.', 'quiet')],
        },
        {
          lane: 1, say: 'Naʻe faingataʻa ʻa e ngāué, kae kehe, naʻa nau lava ia.', en: 'The work was difficult, nevertheless, they accomplished it.',
          row: [face('Naʻe faingataʻa ʻa e ngāué,', 'quiet'), { slot: true, form: face('kae kehe,', 'quiet') }, { ...face('naʻa nau lava ia.', 'quiet'), ring: true, label: 'contrasting result' }],
        },
      ],
    },
  ],
  alt: [
    '*neongo* introduces the conceded fact. *Neongo ʻeku helaʻia, ka té u ngāue pē.* Although I am tired, I will work anyway.',
    '*kae kehe* introduces the contrasting result. *Naʻe faingataʻa ʻa e ngāué, kae kehe, naʻa nau lava ia.* The work was difficult, nevertheless, they accomplished it.',
  ],
}

/** The opening row in the hero: a still, with labels. */
export const OPENING = {
  row: [face('Kapau', 'quiet', ''), face('té ke foki,', 'quiet', 'condition'), face('té u kuki.', 'quiet', 'result')],
  say: 'Kapau té ke foki, té u kuki.',
  en: "If you return, I'll cook.",
}

/** Recall cards, by key rule: book sentences only. */
export const RECALL = [
  { to: 'Té u kuki ʻo kapau té ke foki.', en: "I'll cook if you return." },
  { to: 'ʻOkú ne hiva lolotonga ʻoku ou ngāue.', en: 'She sings while I work.' },
  { to: 'Té u ngāue heni kaeʻoua ke nau foki mai.', en: 'I will work here until they come back.' },
]

export const FIGURES = [F30_1, F30_2, F30_3, F30_4]
