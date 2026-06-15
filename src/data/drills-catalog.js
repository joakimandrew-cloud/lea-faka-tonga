/**
 * drills-catalog — the curated catalogue behind the Practice Drills menu.
 *
 * LEVELS feeds the level filter chips and the per-card badge. GROUPS is the
 * full board: each skill family, its menu cards (with a real sample item
 * from the drill's deck), and the in-chapter rows. This is the single source
 * for a drill's chapter + level, consumed both by the menu (DrillsMenu.jsx)
 * and by the shared drill header (drill-eyebrow.js). Pure data — no JSX — so
 * it lives outside the component file (keeps react-refresh happy).
 */

export const LEVELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

// ── The 28 menu drills, grouped by skill family ────────────────────────────
// level keys feed the filter chips; order within a group = reach-for-it-first.
// sample = one real item from the drill's deck: q (the task, in English),
// ton (the Tongan line, verbatim from the Core), opts (answer chips),
// sel (index of the correct chip; -1 = builder tiles, nothing highlighted).
export const GROUPS = [
  {
    key: 'build',
    name: 'Build the sentence',
    note: 'Assemble and recognize whole sentences.',
    drills: [
      { id: 'first-word-quiz', ch: 12, level: 'beginner', title: `Name the sentence from its first word`, blurb: `ʻOku, Naʻe, ʻIkai, Ko — the opening word already tells you: statement, command, negation, or "X is Y".`, action: 'Name',
        sample: { q: 'What kind of sentence?', ton: `Naʻa ku ʻalu ki kolo.`, opts: ['Statement', 'Command', 'Negation'], sel: 0 } },
      { id: 'modifier-order', ch: 3, level: 'beginner', title: `Where the describing word goes`, blurb: `In Tongan you "sing well", never "well sing" — describing words follow the verb; faʻa alone goes in front.`, action: 'Order',
        sample: { q: 'Say: I sing well', ton: `ʻOku ou ___ ___`, opts: ['hiva lelei', 'lelei hiva'], sel: 0 } },
      { id: 'sentence-builder', ch: 19, level: 'advanced', title: `Build a whole Tongan sentence`, blurb: `The capstone: build the sentence from tiles, picking the right markers (ʻa / ʻe / ʻa e / ʻe he) and the right order.`, action: 'Build',
        sample: { q: 'Say: Sione ate the bread', ton: `Naʻe kai ʻe Sione ʻa e mā.`, opts: ['Naʻe', 'kai', 'ʻe Sione', 'ʻa e mā'], sel: -1 } },
      { id: 'cleft-builder', ch: 36, level: 'advanced', title: `Say who did it: Ko …`, blurb: `Front the doer with Ko — "It was Sione who ate it" — and watch the rest of the sentence rearrange.`, action: 'Build',
        sample: { q: 'It was Sione who ate the bread', ton: `Ko Sione naʻá ne kai ʻa e mā.`, opts: ['Ko', 'Sione', 'naʻá ne'], sel: -1 } },
      { id: 'terminal-builder', ch: 19, level: 'advanced', title: `Free-build any sentence`, blurb: `An open sandbox with every structure unlocked — pick a sentence type for guidance or jump straight in.`, action: 'Build',
        sample: { q: 'Pick a word, watch it build', ton: `ʻOku ou ʻalu …`, opts: ['ki kolo', 'ki he fale'], sel: -1 } },
    ],
    inChapters: [
      { id: 'skeleton-filler', ch: 1, label: 'Order the tense marker, pronoun, and verb' },
      { id: 'adjective-flip', ch: 35, label: 'Adjective order: before or after the noun' },
      { id: 'word-class-picker', ch: 41, label: 'Same word, different role: noun, verb, adjective, adverb' },
    ],
  },
  {
    key: 'tense',
    name: 'Tense & the verb',
    note: 'The marker system every sentence starts from.',
    drills: [
      { id: 'tense-swapper', ch: 9, level: 'beginner', title: `Change the tense with one word`, blurb: `Past, present, perfect, future — Tongan swaps one small word in front of the verb. Practice the swap.`, action: 'Swap',
        sample: { q: 'Make it past', ton: `ʻOku ou ʻalu.`, opts: ['Naʻá ku', 'Kuó u', 'Té u'], sel: 0 } },
      { id: 'tm-by-context-picker', ch: 15, level: 'beginner', title: `Naʻa or Naʻe? Te or ʻE?`, blurb: `One rule covers all three pairs: use the pronoun form when a pronoun follows — past, future, and after ʻikai.`, action: 'Pick',
        sample: { q: 'I went — which marker?', ton: `___ ku ʻalu.`, opts: ['Naʻa', 'Naʻe'], sel: 0 } },
      { id: 'aspect-picker', ch: 22, level: 'intermediate', title: `Still, already, not yet`, blurb: `kei, ʻosi, teʻeki ai, lolotonga, toe, toki — pick the little word before the verb that sets the timing.`, action: 'Pick',
        sample: { q: 'He is still hungry', ton: `ʻOkú ne ___ fiekaia pē.`, opts: ['kei', 'ʻosi', 'toki'], sel: 0 } },
      { id: 'auxiliary-picker', ch: 21, level: 'intermediate', title: `Want to, can, like to`, blurb: `fie + verb, lava ʻo + verb, saiʻia + phrase — each links to the verb its own way; pick the right link.`, action: 'Pick',
        sample: { q: 'I want to sleep', ton: `ʻOku ou ___ mohe.`, opts: ['fie', 'lava', 'saiʻia'], sel: 0 } },
      { id: 'naa-three-way-picker', ch: 38, level: 'advanced', title: `The three jobs of naʻa`, blurb: `Past tense, "lest" after a command, "perhaps" at the front of a clause — read the sentence and tell them apart.`, action: 'Pick',
        sample: { q: 'Which naʻa is this?', ton: `___ ku kai.`, opts: ['Past', '“Lest”', '“Perhaps”'], sel: 0 } },
    ],
    inChapters: [
      { id: 'te-or-ke-picker', ch: 9, label: 'After ʻikai: te or ke? (the focused deck)' },
      { id: 'audience-picker', ch: 10, label: 'Commands: one, two, or many' },
      { id: 'te-disambiguator', ch: 51, label: 'The three jobs of te' },
      { id: 'time-pair-matcher', ch: 4, label: 'Pair each ʻane- past with its ʻa- future partner' },
    ],
  },
  {
    key: 'markers',
    name: 'Markers, articles & counting',
    note: `Who did it, which one, and how many — the ʻa / ʻe / ha / he machinery.`,
    drills: [
      { id: 'article-picker', ch: 8, level: 'beginner', title: `Which "the": ha, ʻa e, or he?`, blurb: `Two questions decide it: is the thing definite, and does a preposition come first?`, action: 'Pick',
        sample: { q: 'I want some water', ton: `ʻOku ou fiemaʻu ___ vai.`, opts: ['ha', 'ʻa e', 'he'], sel: 0 } },
      { id: 'subject-marker-picker', ch: 19, level: 'intermediate', title: `Who did it: ʻa, ʻe, or ʻe he?`, blurb: `Subjects of plain verbs take ʻa; doers of verbs-with-objects take ʻe for names, ʻe he for common nouns.`, action: 'Pick',
        sample: { q: 'Lupe lived in town', ton: `Naʻe nofo ___ Lupe ʻi kolo.`, opts: ['ʻa', 'ʻe', 'ʻe he'], sel: 0 } },
      { id: 'plural-marker-picker', ch: 25, level: 'intermediate', title: `Pick the plural marker`, blurb: `ngaahi for most things, kau for people, fanga for animals, ʻū for a small handful, ongo for exactly two.`, action: 'Pick',
        sample: { q: 'The teachers', ton: `e ___ faiakó`, opts: ['kau', 'ngaahi', 'fanga'], sel: 0 } },
      { id: 'classifier-extended-picker', ch: 31, level: 'intermediate', title: `Counting: ʻe, toko, or foʻi?`, blurb: `ʻe counts things, toko counts people, foʻi singles out one round or whole item.`, action: 'Pick',
        sample: { q: 'A single coconut', ton: `ha ___ niu`, opts: ['foʻi', 'ʻe', 'toko'], sel: 0 } },
      { id: 'count-time', ch: 20, level: 'beginner', title: `Count and tell the time`, blurb: `The numbers 1–10 in their working frames: counting things and people, reading the clock, naming prices.`, action: 'Count',
        sample: { q: 'Five baskets', ton: `kato ʻe ___`, opts: ['nima', 'fā', 'ono'], sel: 0 } },
    ],
    inChapters: [
      { id: 'definiteness-three-way-picker', ch: 18, label: 'any basket, a basket, or THE basket?' },
      { id: 'definiteness-flip', ch: 19, label: 'Some bread vs. the bread — watch the sentence rebuild' },
      { id: 'pronoun-object-drop-picker', ch: 19, label: 'When the object loses its ʻa' },
      { id: 'equational-subject-picker', ch: 16, label: 'ʻa before a name?' },
      { id: 'noun-class-sorter', ch: 46, label: 'Person, place, or thing: which "to"?' },
      { id: 'classifier-picker', ch: 20, label: 'The classifier introduction: ʻe / toko / foʻi' },
      { id: 'emotional-article-matrix', ch: 52, label: 'Adding feeling: siʻi and siʻa' },
    ],
  },
  {
    key: 'possession',
    name: 'Pronouns, possession & having',
    note: `Who you mean and what is theirs — the e-class / ho-class system.`,
    drills: [
      { id: 'pronoun-paradigm', ch: 2, level: 'beginner', title: `Name the pronoun`, blurb: `Singular, dual, plural — and the two kinds of "we". Recall the right pronoun for each cell of the grid.`, action: 'Recall',
        sample: { q: 'I ate (past)', ton: `Naʻa ___ kai.`, opts: ['ku', 'ou', 'u'], sel: 0 } },
      { id: 'possessive-sorter', ch: 17, level: 'beginner', title: `Saying "my": ʻeku or hoku?`, blurb: `Every noun takes one or the other. Sort them one at a time until the rule feels obvious.`, action: 'Sort',
        sample: { q: '"My house" — which class?', ton: `fale`, opts: ['hoku', 'ʻeku'], sel: 0 } },
      { id: 'doer-receiver-picker', ch: 29, level: 'advanced', title: `His choosing vs. his being chosen`, blurb: `ʻene fili: he does the choosing. hono fili: it happens to him. Pick the right side every time.`, action: 'Pick',
        sample: { q: 'My helping — who acts?', ton: `ʻeku tokoni`, opts: ['I do it', 'done to me'], sel: 0 } },
      { id: 'verbal-noun-converter', ch: 45, level: 'advanced', title: `Say "when / because he read it"`, blurb: `Turn a whole sentence into a when/because phrase — and pick heʻene, heʻeku, or he hoʻo to hold it.`, action: 'Convert',
        sample: { q: 'When he read the book', ton: `ʻi ___ lau ʻa e tohí`, opts: ['heʻene', 'he hoʻo', 'heʻeku'], sel: 0 } },
      { id: 'there-is-have', ch: 31, level: 'intermediate', title: `There is / I have`, blurb: `ʻi ai covers both "there is" and "have"; the negative for both is the full ʻikai ke ʻi ai. Pick the opener and the tense.`, action: 'Pick',
        sample: { q: 'I have a book', ton: `___ haʻaku tohi.`, opts: ['ʻOku ʻi ai', 'Naʻe ʻi ai'], sel: 0 } },
    ],
    inChapters: [
      { id: 'clusivity-corner', ch: 2, label: 'Which "we"? — in the group or not, two or more' },
      { id: 'kinship-possessive', ch: 29, label: 'Family: my / your / his' },
      { id: 'postposed-possessive-picker', ch: 37, label: 'That one is MINE: ʻaʻaku vs. ʻoʻoku' },
      { id: 'benefactive-sorter', ch: 26, label: 'maʻa or moʻo — for whose benefit' },
    ],
  },
  {
    key: 'place',
    name: 'Questions, place & direction',
    note: 'Asking, locating, and pointing the verb the right way.',
    drills: [
      { id: 'question-word-picker', ch: 11, level: 'beginner', title: `Which question word?`, blurb: `Where, when, how, how many — the question word sits exactly where the answer would.`, action: 'Pick',
        sample: { q: 'Where did you stay last night?', ton: `Naʻá ke nofo ___ ʻanepō?`, opts: ['ʻi fē', 'ki fē', 'mei fē'], sel: 0 } },
      { id: 'preposition-selector', ch: 7, level: 'beginner', title: `ʻi, ki, or mei — and which shape`, blurb: `At, to, from — bare before places, -a before names, -ate before pronouns.`, action: 'Pick',
        sample: { q: 'I went to Vavaʻu', ton: `Naʻá ku ʻalu ___ Vavaʻu.`, opts: ['ki', 'kia', 'kiate'], sel: 0 } },
      { id: 'direction-picker', ch: 28, level: 'intermediate', title: `Point the verb: mai, atu, ange`, blurb: `mai toward me, atu toward you, ange toward them — and hake / hifo for up and down.`, action: 'Pick',
        sample: { q: 'Siale is coming toward us', ton: `ʻOku ʻalu ___ ʻa Siale.`, opts: ['mai', 'atu', 'ange'], sel: 0 } },
      { id: 'relative-ai-picker', ch: 39, level: 'advanced', title: `The place he works in / came from`, blurb: `ai, ki ai, or mei ai — match the preposition the plain sentence would have used.`, action: 'Pick',
        sample: { q: 'The house he works in', ton: `Ko e falé eni ʻokú ne ngāue ___.`, opts: ['ai', 'ki ai', 'mei ai'], sel: 0 } },
    ],
    inChapters: [
      { id: 'demonstrative-picker', ch: 6, label: 'here / there / over there: heni, hena, hē' },
      { id: 'spatial-noun-picker', ch: 40, label: 'inside / under / on top / beside' },
      { id: 'ko-question-picker', ch: 13, label: 'ko hai / ko e hā / ko fē — the ko-questions' },
      { id: 'ai-substitution', ch: 7, label: 'Replace the place with ai / ki ai / mei ai' },
      { id: 'before-after-picker', ch: 42, label: 'ki muʻa / ki mui / ʻamui / tōmuʻa' },
      { id: 'farewell-picker', ch: 14, label: 'Who leaves, who stays — pick the farewell' },
    ],
  },
  {
    key: 'joining',
    name: 'Joining & shaping',
    note: 'Connect clauses, build words, and place the accent.',
    drills: [
      { id: 'connector-disambiguator', ch: 26, level: 'intermediate', title: `Which "and", which "but"`, blurb: `Three words for and (mo, pea, ʻo), two for but (ka, kae), ke for purpose, he for reason — pick by the join.`, action: 'Pick',
        sample: { q: 'I went to town with Sione', ton: `Naʻá ku ʻalu ki kolo ___ Sione.`, opts: ['mo', 'pea', 'ʻo'], sel: 0 } },
      { id: 'temporal-conjunction-picker', ch: 30, level: 'intermediate', title: `If, while, until, when, although`, blurb: `kapau, lolotonga, kaeʻoua ke, ʻi he…, neongo — pick the clause-opener the timeline needs.`, action: 'Pick',
        sample: { q: 'If you return, I will cook', ton: `___ té ke foki, té u kuki.`, opts: ['kapau', 'lolotonga', 'neongo'], sel: 0 } },
      { id: 'faka-pattern-sorter', ch: 32, level: 'advanced', title: `Sort faka- words by job`, blurb: `One prefix, four jobs: manner, cause, every-X, one-particular. Read each word and file it.`, action: 'Sort',
        sample: { q: 'What is faka- doing here?', ton: `faka-Tonga`, opts: ['Manner', 'Cause', 'Every-X'], sel: 0 } },
      { id: 'accent-placement-picker', ch: 44, level: 'advanced', title: `Where the accent lands`, blurb: `Find the word in the noun phrase that carries the definitive accent — or call it when the phrase takes none.`, action: 'Place',
        sample: { q: 'Where does the accent land?', ton: `Naʻá ku ʻalu ki he fale.`, opts: ['falé', 'No accent'], sel: 0 } },
    ],
    inChapters: [
      { id: 'ka-or-kae-picker', ch: 24, label: '"but": ka or kae — the focused deck' },
      { id: 'conditional-picker', ch: 47, label: 'if / when / had-I: kapau, ka, ka ne' },
      { id: 'should-or-must-picker', ch: 23, label: 'Should or Must: totonu ke vs. pau ke' },
      { id: 'comparative-picker', ch: 27, label: 'More or Most: ange vs. taha' },
      { id: 'aki-suffix-picker', ch: 33, label: 'ʻaki / -ʻi / -ʻaki — three sound-alikes' },
      { id: 'tae-prefix-picker', ch: 43, label: 'taʻe-: without / un- / without doing' },
      { id: 'suffix-picker', ch: 48, label: '-ʻanga (place) vs. -nga (thing)' },
      { id: 'reduplication-effect-sorter', ch: 50, label: 'What doubling does: intensify, moderate, pluralize' },
      { id: 'pehee-picker', ch: 34, label: 'Pehē: say, thus, or do-thus-to' },
      { id: 'reciprocity-picker', ch: 49, label: '"each other" verbs (fe-…-ʻaki)' },
      { id: 'register-sorter', ch: 53, label: 'Five vocabulary levels by social rank' },
    ],
  },
]
