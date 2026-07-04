/**
 * Drill registry — single source of truth for which drill maps to which Core.
 *
 * Keyed by drillId (the same id used in src/data/drill-map.json and in the
 * standalone route paths). Each entry exposes the Core component plus the
 * meta needed to render an anchor strip ({ title, blurb }).
 *
 * Cores are lazy (site-analysis fix #2, 2026-07-03): each drill is its own
 * chunk, fetched the first time it renders. Meta stays static so menus and
 * anchor strips never wait on a chunk. Render sites (DrillPage,
 * ChapterDrillAnchor) wrap <Core> in <Suspense>.
 */

import { lazy } from 'react'

// Drills-Pedagogical-Review 2026-06-17: new drills (chapter-fills + real-use + new types)

export const drillRegistry = {
  // ── Six existing drills ─────────────────────────────────────
  'tense-swapper': {
    Core: lazy(() => import('./TenseSwapperCore')),
    meta: { title: `How Tongan marks tense`, blurb: `Mark past, present, perfect, and future by changing one word in front of the verb.` },
  },
  'first-word-quiz': {
    Core: lazy(() => import('./FirstWordQuizCore')),
    meta: { title: `Name the sentence from its first word`, blurb: `See only the start and call it: statement, command, negation, or "X is Y".` },
  },
  'possessive-sorter': {
    Core: lazy(() => import('./PossessiveSorterCore')),
    meta: { title: `Saying "my": ʻeku or hoku?`, blurb: `Pick ʻeku or hoku for "my," one noun at a time.` },
  },
  'adjective-flip': {
    Core: lazy(() => import('./AdjectiveFlipCore')),
    meta: { title: `Adjective order: before or after the noun`, blurb: `Most adjectives follow the noun (fale foʻou); a few — fuʻu, kiʻi, ʻuluaki, muʻaki, toe — come before it.` },
  },
  'skeleton-filler': {
    Core: lazy(() => import('./SkeletonFillerCore')),
    meta: { title: `Build a Tongan sentence`, blurb: `Put the tense marker, pronoun, and verb in the right order.` },
  },
  'clusivity-corner': {
    Core: lazy(() => import('./ClusivityCornerCore')),
    meta: { title: `Which "we"?`, blurb: `Tongan has four words for "we." Is the listener in the group, and is it two or three-plus?` },
  },

  // ── New-shape sorter ────────────────────────────────────────
  'faka-pattern-sorter': {
    Core: lazy(() => import('./FakaSorterCore')),
    meta: { title: `Sort faka- words by job`, blurb: `faka- does four jobs (manner, cause, every-X, one-particular). Read the word and sort it.` },
  },

  // ── New-shape pickers (PickerCore variants) ─────────────────
  'preposition-selector': {
    Core: lazy(() => import('./PrepositionSelectorCore')),
    meta: { title: `ʻi / ki / mei (and the form they take)`, blurb: `at/to/from and its shape: bare before a place, -a before a name, -ate before a pronoun.` },
  },
  'ai-substitution': {
    Core: lazy(() => import('./AiSubstitutionCore')),
    meta: { title: 'Ai Substitution', blurb: 'Replace a noun after a preposition with the matching ai-form.' },
  },
  'article-picker': {
    Core: lazy(() => import('./ArticlePickerCore')),
    meta: { title: `a, the, or the-after-a-preposition?`, blurb: `Choose ha, ʻa e, or he by definiteness and whether a preposition comes first.` },
  },
  'question-word-picker': {
    Core: lazy(() => import('./QuestionWordPickerCore')),
    meta: { title: `Which question word?`, blurb: `where / when / how / how-many — the question word sits where the answer would go.` },
  },
  'ka-or-kae-picker': {
    Core: lazy(() => import('./KaOrKaePickerCore')),
    meta: { title: `"but": ka or kae`, blurb: `ka before a tense-marker/pronoun/preposition, kae before a verb or adjective.` },
  },
  'plural-marker-picker': {
    Core: lazy(() => import('./PluralMarkerPickerCore')),
    meta: { title: `Plural markers`, blurb: `ngaahi (general), kau (people), fanga (animals), ʻū (a few), ongo (exactly two).` },
  },
  'conditional-picker': {
    Core: lazy(() => import('./ConditionalPickerCore')),
    meta: { title: `if / when / had-I`, blurb: `kapau (uncertain), ka (expected), ka ne (didn't-happen, "had I…").` },
  },
  'modifier-order': {
    Core: lazy(() => import('./ModifierOrderCore')),
    meta: { title: `Where the describing word goes`, blurb: `Describing words follow the verb (sing well); faʻa is the one that goes before.` },
  },
  'audience-picker': {
    Core: lazy(() => import('./AudiencePickerCore')),
    meta: { title: `Commands: one, two, or many`, blurb: `Pick the command form by how many you address: bare verb / mo / mou.` },
  },
  'demonstrative-picker': {
    Core: lazy(() => import('./DemonstrativePickerCore')),
    meta: { title: `here / there / over there`, blurb: `heni (by me), hena (by you), hē (the spot I point to).` },
  },
  'te-or-ke-picker': {
    Core: lazy(() => import('./TeOrKePickerCore')),
    meta: { title: `After ʻikai: te or ke?`, blurb: `te before a pronoun, ke before a bare verb.` },
  },
  'aspect-picker': {
    Core: lazy(() => import('./AspectPickerCore')),
    meta: { title: `Still / Already / Not yet`, blurb: `Pick the word before the verb: kei, ʻosi, teʻeki ai, lolotonga, toe, toki.` },
  },
  'comparative-picker': {
    Core: lazy(() => import('./ComparativePickerCore')),
    meta: { title: `More or Most`, blurb: `ange (more, + a "than" phrase) vs. taha (most).` },
  },
  'direction-picker': {
    Core: lazy(() => import('./DirectionPickerCore')),
    meta: { title: `Which direction`, blurb: `mai (toward me), atu (toward you), ange (toward them), hake/hifo (up/down).` },
  },
  'temporal-conjunction-picker': {
    Core: lazy(() => import('./TemporalConjunctionPickerCore')),
    meta: { title: `if / while / until / when / although`, blurb: `kapau, lolotonga, kaeʻoua ke, ʻi he…, neongo.` },
  },
  'naa-three-way-picker': {
    Core: lazy(() => import('./NaaThreeWayPickerCore')),
    meta: { title: `Which naʻa? (past / lest / perhaps)`, blurb: `Tell past-tense naʻa from "lest" (after a command) and "perhaps" (clause-initial).` },
  },
  'spatial-noun-picker': {
    Core: lazy(() => import('./SpatialNounPickerCore')),
    meta: { title: `inside / under / on top / beside`, blurb: `loto, lalo, funga, veʻe, tuʻa, mata, mui, tafaʻaki.` },
  },
  'word-class-picker': {
    Core: lazy(() => import('./WordClassPickerCore')),
    meta: { title: 'Word Class Identifier', blurb: 'Same word, different role: noun, verb, adjective, or adverb?' },
  },
  'te-disambiguator': {
    Core: lazy(() => import('./TeDisambiguatorCore')),
    meta: { title: `The three jobs of te`, blurb: `Future marker, negation connector after ʻikai, or "one" — by position.` },
  },
  'ko-question-picker': {
    Core: lazy(() => import('./KoQuestionPickerCore')),
    meta: { title: 'Ko-Question Picker', blurb: 'ko hai / ko e hā / ko fē / ko e hā … ai.' },
  },
  'farewell-picker': {
    Core: lazy(() => import('./FarewellPickerCore')),
    meta: { title: 'Farewell Picker', blurb: 'Who is leaving? Who is staying? Pick the right form.' },
  },
  'tm-by-context-picker': {
    Core: lazy(() => import('./TmByContextPickerCore')),
    meta: { title: `Naʻa or Naʻe? Te or ʻE? te or ke?`, blurb: `One rule, three pairs: use the pronoun form when a pronoun follows — past, future, and negation after ʻikai.` },
  },
  'equational-subject-picker': {
    Core: lazy(() => import('./EquationalSubjectPickerCore')),
    meta: { title: `ʻa before a name?`, blurb: `In "X is a Y," ʻa appears before a name but drops before a pronoun.` },
  },
  'classifier-picker': {
    Core: lazy(() => import('./ClassifierPickerCore')),
    meta: { title: 'Classifier Picker', blurb: 'ʻe for things, toko for people, foʻi for single round/whole items.' },
  },
  'auxiliary-picker': {
    Core: lazy(() => import('./AuxiliaryPickerCore')),
    meta: { title: `Want / Can / Like`, blurb: `fie + verb, lava ʻo + verb, saiʻia + phrase — pick by what links to the verb.` },
  },
  'should-or-must-picker': {
    Core: lazy(() => import('./ShouldOrMustPickerCore')),
    meta: { title: `Should or Must`, blurb: `ʻoku totonu ke (should) vs. kuo pau ke (must).` },
  },
  'aki-suffix-picker': {
    Core: lazy(() => import('./AkiSuffixPickerCore')),
    meta: { title: 'ʻaki / -ʻi / -ʻaki', blurb: 'Three sound-alikes, three jobs.' },
  },
  'pehee-picker': {
    Core: lazy(() => import('./PeheePickerCore')),
    meta: { title: 'Pehē: Three Jobs', blurb: 'Verb (say/think), adverb (thus), or transitive (do thus to)?' },
  },
  'before-after-picker': {
    Core: lazy(() => import('./BeforeAfterPickerCore')),
    meta: { title: 'Before / After Picker', blurb: 'ki muʻa / ki mui / ʻamui / tōmuʻa.' },
  },
  'tae-prefix-picker': {
    Core: lazy(() => import('./TaePrefixPickerCore')),
    meta: { title: 'Taʻe- Prefix Picker', blurb: 'Without (noun) / un- (verb-adj) / without doing (clause).' },
  },
  'benefactive-sorter': {
    Core: lazy(() => import('./BenefactiveSorterCore')),
    meta: { title: 'Benefactive Sorter', blurb: 'maʻa (ʻe-class) vs moʻo (ho-class) — by what the recipient gets.' },
  },
  'doer-receiver-picker': {
    Core: lazy(() => import('./DoerReceiverPickerCore')),
    meta: { title: `his choosing vs. his being chosen`, blurb: `ʻene fili (he does it) vs. hono fili (it's done to him).` },
  },
  'classifier-extended-picker': {
    Core: lazy(() => import('./ClassifierExtendedPickerCore')),
    meta: { title: `Counting: ʻe, toko, or foʻi?`, blurb: `ʻe for things, toko for people, foʻi for single round/whole items.` },
  },
  'relative-ai-picker': {
    Core: lazy(() => import('./RelativeAiPickerCore')),
    meta: { title: `the place he works IN / came FROM`, blurb: `Pick ai, ki ai, or mei ai by the preposition the plain sentence would use.` },
  },
  'suffix-picker': {
    Core: lazy(() => import('./SuffixPickerCore')),
    meta: { title: 'Suffix Picker', blurb: '-ʻanga (place) vs -nga (thing).' },
  },
  'reduplication-effect-sorter': {
    Core: lazy(() => import('./ReduplicationEffectSorterCore')),
    meta: { title: 'Reduplication Effect Sorter', blurb: 'Intensify / moderate / pluralize / shift word class.' },
  },
  'subject-marker-picker': {
    Core: lazy(() => import('./SubjectMarkerPickerCore')),
    meta: { title: `Who did it: ʻa, ʻe, or ʻe he?`, blurb: `Intransitive subjects take ʻa; transitive doers take ʻe (name) / ʻe he (common noun).` },
  },
  'pronoun-object-drop-picker': {
    Core: lazy(() => import('./PronounObjectDropPickerCore')),
    meta: { title: `When the object loses its ʻa`, blurb: `A name-object keeps ʻa; a pronoun-object drops it.` },
  },
  'time-pair-matcher': {
    Core: lazy(() => import('./TimePairMatcherCore')),
    meta: { title: 'Time-Pair Matcher', blurb: 'Pair each ʻane- past with its ʻa- future partner.' },
  },
  'definiteness-flip': {
    Core: lazy(() => import('./DefinitenessFlipCore')),
    meta: { title: `Some bread vs. the bread`, blurb: `Change "some" → "the" and watch the sentence rebuild, including the ʻa/ʻe subject.` },
  },
  'cleft-builder': {
    Core: lazy(() => import('./CleftBuilderCore')),
    meta: { title: `Say who did it (Ko …)`, blurb: `Front the doer with Ko: "It was Sione who ate it."` },
  },
  'accent-placement-picker': {
    Core: lazy(() => import('./AccentPlacementPickerCore')),
    meta: { title: `Where the accent lands`, blurb: `Spot which word in a noun phrase carries the accent — and which sit outside the group.` },
  },
  'verbal-noun-converter': {
    Core: lazy(() => import('./VerbalNounConverterCore')),
    meta: { title: `Say "when / because he read it"`, blurb: `Turn "he read it" into a "when/because" clause; pick heʻene, heʻeku, he hoʻo…` },
  },
  'reciprocity-picker': {
    Core: lazy(() => import('./ReciprocityPickerCore')),
    meta: { title: `"each other" verbs (fe-…-ʻaki)`, blurb: `Pick the fe-…-ʻaki form for people doing it to each other.` },
  },
  'emotional-article-matrix': {
    Core: lazy(() => import('./EmotionalArticleMatrixCore')),
    meta: { title: `Adding feeling: siʻi and siʻa`, blurb: `Choose the emotional "the/a" to add pity or affection.` },
  },

  // ── Phase 3: new exercises (menu + /drill/:id; no chapter anchor) ──
  'sentence-builder': {
    Core: lazy(() => import('./SentenceBuilderCore')),
    meta: { title: `Build a whole Tongan sentence`, blurb: `Assemble the sentence from tiles — pick the right ʻa / ʻe / ʻa e / ʻe he markers and the right order.` },
  },
  'pronoun-paradigm': {
    Core: lazy(() => import('./PronounParadigmCore')),
    meta: { title: `Name the pronoun`, blurb: `Recall the right preposed pronoun by its cell: singular / dual / plural, "we" with or without you.` },
  },
  'there-is-have': {
    Core: lazy(() => import('./ThereIsHaveCore')),
    meta: { title: `There is / I have`, blurb: `ʻi ai for "there is" and "have"; the negative for both is the full ʻikai ke ʻi ai. Pick the right opener and tense.` },
  },
  'count-time': {
    Core: lazy(() => import('./CountTimeCore')),
    meta: { title: `Count and tell the time`, blurb: `The numbers 1-10 inside their frames: ʻe for things, toko for people, the clock, prices.` },
  },
  'connector-disambiguator': {
    Core: lazy(() => import('./ConnectorDisambiguatorCore')),
    meta: { title: `Which connector: and / with / but / because`, blurb: `Three words for "and" (mo, pea, ʻo), two for "but" (ka, kae), ke for purpose, he for reason — choose by what is being joined.` },
  },
  'kinship-possessive': {
    Core: lazy(() => import('./KinshipPossessiveCore')),
    meta: { title: `Family: my / your / his`, blurb: `Relatives are ho-class — but parents and children flip to e-class (ʻeku tamai, hoku tokoua).` },
  },
  'vocab-cloze': {
    Core: lazy(() => import('./VocabClozeCore')),
    meta: { title: `Fill the blank (vocabulary)`, blurb: `A known frame with one word missing and an English cue — recall the Tongan word.` },
  },

  // ── Coverage drills for previously undrilled TEACH chapters (Ch 18 / 37 / 46) ──
  'definiteness-three-way-picker': {
    Core: lazy(() => import('./DefinitenessThreeWayPickerCore')),
    meta: { title: `any basket, a basket, or THE basket?`, blurb: `Three levels: ha (any one), e (a particular one), e + stress on the last vowel (the one you both know).` },
  },
  'postposed-possessive-picker': {
    Core: lazy(() => import('./PostposedPossessivePickerCore')),
    meta: { title: `That one is MINE`, blurb: `Ownership after the noun: ʻaʻaku (things you control) vs. ʻoʻoku (things that shelter or define you) — and ʻa hai / ʻo hai for "whose?".` },
  },
  'noun-class-sorter': {
    Core: lazy(() => import('./NounClassSorterCore')),
    meta: { title: `Person, place, or thing: which "to"?`, blurb: `kia Mele, ki kolo, ki he motú — names and places skip the article; everything else takes he and the accent.` },
  },

  // ── Sentence Lab: manipulate a taught sentence (word-swap) ──
  'sentence-lab': {
    Core: lazy(() => import('./SentenceLabCore')),
    meta: { title: `Swap a word, watch the meaning change`, blurb: `Take a taught sentence and change one word at a time — the English re-translates live as you swap.` },
  },

  // ── Drills-Pedagogical-Review 2026-06-17 — chapter-fills (half-drilled chapters) ──
  'same-as-like': {
    Core: lazy(() => import('./SameAsLikeCore')),
    meta: { title: `Same as / like`, blurb: `tatau mo (the same as) and ʻo hangē (like / as if): the comparisons beyond "more" and "most".` },
  },
  'since-after': {
    Core: lazy(() => import('./SinceAfterCore')),
    meta: { title: `Since / after`, blurb: `talu (since) and hilí (after) for time clauses, including the ʻa-marking rule.` },
  },
  'negative-obligation': {
    Core: lazy(() => import('./NegativeObligationCore')),
    meta: { title: `Should not / must not`, blurb: `Negate obligation: ʻoku ʻikai totonu ke, and the emphatic ʻoua naʻa.` },
  },
  'reporting-picker': {
    Core: lazy(() => import('./ReportingCore')),
    meta: { title: `Reportedly / therefore`, blurb: `tokua (they say) vs ko ia (so / therefore), and where tokua sits.` },
  },
  'permission-hope': {
    Core: lazy(() => import('./PermissionHopeCore')),
    meta: { title: `Let / hope (ke-idioms)`, blurb: `tuku ke (let / allow), ʻofa ke (hope / may), fai mo ke (hurry up and).` },
  },
  'seem-look': {
    Core: lazy(() => import('./SeemLookCore')),
    meta: { title: `Seem / look like`, blurb: `ngali (seems, firmer) vs ngalingali (looks as if, tentative).` },
  },

  // ── Drills-Pedagogical-Review 2026-06-17 — real-use exchanges ──
  'greet-thank': {
    Core: lazy(() => import('./GreetThankCore')),
    meta: { title: `Greet, thank & respond`, blurb: `Mālō e lelei, the how-are-you reply, and the mālō-e thanks family, in context.` },
  },
  'qa-match': {
    Core: lazy(() => import('./QuestionAnswerMatchCore')),
    meta: { title: `Match question to answer`, blurb: `Pair each question with its natural answer; the answer echoes the question word's slot.` },
  },
  'introduce-yourself': {
    Core: lazy(() => import('./IntroduceYourselfCore')),
    meta: { title: `Introduce yourself`, blurb: `Ask and answer name and age: Ko hai ho hingoa? Ko ho taʻu fiha eni?` },
  },

  // ── Drills-Pedagogical-Review 2026-06-17 — new drill types ──
  'read-it-back': {
    Core: lazy(() => import('./ReadItBackCore')),
    meta: { title: `Read it back`, blurb: `Read a Tongan sentence and pick what it means. Comprehension, the one thing nothing else drills.` },
  },
  'spot-the-slip': {
    Core: lazy(() => import('./SpotTheSlipCore')),
    meta: { title: `Spot the slip`, blurb: `One word is wrong. Find the error and fix it. Train the editor's eye.` },
  },
  'daily-words': {
    Core: lazy(() => import('./DailyWordsCore')),
    meta: { title: `Daily words`, blurb: `Spaced vocabulary recall: the words you miss come back first.` },
  },
}
