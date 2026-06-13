/**
 * Drill registry — single source of truth for which drill maps to which Core.
 *
 * Keyed by drillId (the same id used in src/data/drill-map.json and in the
 * standalone route paths). Each entry exposes the Core component plus the
 * meta needed to render an anchor strip ({ title, blurb }).
 */

import PossessiveSorterCore from './PossessiveSorterCore'
import FakaSorterCore from './FakaSorterCore'
import TenseSwapperCore from './TenseSwapperCore'
import FirstWordQuizCore from './FirstWordQuizCore'
import AdjectiveFlipCore from './AdjectiveFlipCore'
import SkeletonFillerCore from './SkeletonFillerCore'
import ClusivityCornerCore from './ClusivityCornerCore'
import PrepositionSelectorCore from './PrepositionSelectorCore'
import AiSubstitutionCore from './AiSubstitutionCore'
import ArticlePickerCore from './ArticlePickerCore'
import QuestionWordPickerCore from './QuestionWordPickerCore'
import KaOrKaePickerCore from './KaOrKaePickerCore'
import PluralMarkerPickerCore from './PluralMarkerPickerCore'
import ConditionalPickerCore from './ConditionalPickerCore'
import ModifierOrderCore from './ModifierOrderCore'
import AudiencePickerCore from './AudiencePickerCore'
import DemonstrativePickerCore from './DemonstrativePickerCore'
import TeOrKePickerCore from './TeOrKePickerCore'
import AspectPickerCore from './AspectPickerCore'
import ComparativePickerCore from './ComparativePickerCore'
import DirectionPickerCore from './DirectionPickerCore'
import TemporalConjunctionPickerCore from './TemporalConjunctionPickerCore'
import NaaThreeWayPickerCore from './NaaThreeWayPickerCore'
import SpatialNounPickerCore from './SpatialNounPickerCore'
import WordClassPickerCore from './WordClassPickerCore'
import TeDisambiguatorCore from './TeDisambiguatorCore'
import KoQuestionPickerCore from './KoQuestionPickerCore'
import FarewellPickerCore from './FarewellPickerCore'
import TmByContextPickerCore from './TmByContextPickerCore'
import EquationalSubjectPickerCore from './EquationalSubjectPickerCore'
import ClassifierPickerCore from './ClassifierPickerCore'
import AuxiliaryPickerCore from './AuxiliaryPickerCore'
import ShouldOrMustPickerCore from './ShouldOrMustPickerCore'
import AkiSuffixPickerCore from './AkiSuffixPickerCore'
import PeheePickerCore from './PeheePickerCore'
import BeforeAfterPickerCore from './BeforeAfterPickerCore'
import TaePrefixPickerCore from './TaePrefixPickerCore'
import BenefactiveSorterCore from './BenefactiveSorterCore'
import DoerReceiverPickerCore from './DoerReceiverPickerCore'
import ClassifierExtendedPickerCore from './ClassifierExtendedPickerCore'
import RelativeAiPickerCore from './RelativeAiPickerCore'
import SuffixPickerCore from './SuffixPickerCore'
import ReduplicationEffectSorterCore from './ReduplicationEffectSorterCore'
import RegisterSorterCore from './RegisterSorterCore'
import SubjectMarkerPickerCore from './SubjectMarkerPickerCore'
import PronounObjectDropPickerCore from './PronounObjectDropPickerCore'
import TimePairMatcherCore from './TimePairMatcherCore'
import DefinitenessFlipCore from './DefinitenessFlipCore'
import CleftBuilderCore from './CleftBuilderCore'
import AccentPlacementPickerCore from './AccentPlacementPickerCore'
import VerbalNounConverterCore from './VerbalNounConverterCore'
import ReciprocityPickerCore from './ReciprocityPickerCore'
import EmotionalArticleMatrixCore from './EmotionalArticleMatrixCore'
import SentenceBuilderCore from './SentenceBuilderCore'
import PronounParadigmCore from './PronounParadigmCore'
import ThereIsHaveCore from './ThereIsHaveCore'
import CountTimeCore from './CountTimeCore'
import ConnectorDisambiguatorCore from './ConnectorDisambiguatorCore'
import KinshipPossessiveCore from './KinshipPossessiveCore'
import VocabClozeCore from './VocabClozeCore'
import DefinitenessThreeWayPickerCore from './DefinitenessThreeWayPickerCore'
import PostposedPossessivePickerCore from './PostposedPossessivePickerCore'
import NounClassSorterCore from './NounClassSorterCore'

export const drillRegistry = {
  // ── Six existing drills ─────────────────────────────────────
  'tense-swapper': {
    Core: TenseSwapperCore,
    meta: { title: `How Tongan marks tense`, blurb: `Mark past, present, perfect, and future by changing one word in front of the verb.` },
  },
  'first-word-quiz': {
    Core: FirstWordQuizCore,
    meta: { title: `Name the sentence from its first word`, blurb: `See only the start and call it: statement, command, negation, or "X is Y".` },
  },
  'possessive-sorter': {
    Core: PossessiveSorterCore,
    meta: { title: `Saying "my": ʻeku or hoku?`, blurb: `Pick ʻeku or hoku for "my," one noun at a time.` },
  },
  'adjective-flip': {
    Core: AdjectiveFlipCore,
    meta: { title: `Adjective order: before or after the noun`, blurb: `Most adjectives follow the noun (fale foʻou); a few — fuʻu, kiʻi, ʻuluaki, muʻaki, toe — come before it.` },
  },
  'skeleton-filler': {
    Core: SkeletonFillerCore,
    meta: { title: `Build a Tongan sentence`, blurb: `Put the tense marker, pronoun, and verb in the right order.` },
  },
  'clusivity-corner': {
    Core: ClusivityCornerCore,
    meta: { title: `Which "we"?`, blurb: `Tongan has four words for "we." Is the listener in the group, and is it two or three-plus?` },
  },

  // ── New-shape sorter ────────────────────────────────────────
  'faka-pattern-sorter': {
    Core: FakaSorterCore,
    meta: { title: `Sort faka- words by job`, blurb: `faka- does four jobs (manner, cause, every-X, one-particular). Read the word and sort it.` },
  },

  // ── New-shape pickers (PickerCore variants) ─────────────────
  'preposition-selector': {
    Core: PrepositionSelectorCore,
    meta: { title: `ʻi / ki / mei (and the form they take)`, blurb: `at/to/from and its shape: bare before a place, -a before a name, -ate before a pronoun.` },
  },
  'ai-substitution': {
    Core: AiSubstitutionCore,
    meta: { title: 'Ai Substitution', blurb: 'Replace a noun after a preposition with the matching ai-form.' },
  },
  'article-picker': {
    Core: ArticlePickerCore,
    meta: { title: `a, the, or the-after-a-preposition?`, blurb: `Choose ha, ʻa e, or he by definiteness and whether a preposition comes first.` },
  },
  'question-word-picker': {
    Core: QuestionWordPickerCore,
    meta: { title: `Which question word?`, blurb: `where / when / how / how-many — the question word sits where the answer would go.` },
  },
  'ka-or-kae-picker': {
    Core: KaOrKaePickerCore,
    meta: { title: `"but": ka or kae`, blurb: `ka before a tense-marker/pronoun/preposition, kae before a verb or adjective.` },
  },
  'plural-marker-picker': {
    Core: PluralMarkerPickerCore,
    meta: { title: `Plural markers`, blurb: `ngaahi (general), kau (people), fanga (animals), ʻū (a few), ongo (exactly two).` },
  },
  'conditional-picker': {
    Core: ConditionalPickerCore,
    meta: { title: `if / when / had-I`, blurb: `kapau (uncertain), ka (expected), ka ne (didn't-happen, "had I…").` },
  },
  'modifier-order': {
    Core: ModifierOrderCore,
    meta: { title: `Where the describing word goes`, blurb: `Describing words follow the verb (sing well); faʻa is the one that goes before.` },
  },
  'audience-picker': {
    Core: AudiencePickerCore,
    meta: { title: `Commands: one, two, or many`, blurb: `Pick the command form by how many you address: bare verb / mo / mou.` },
  },
  'demonstrative-picker': {
    Core: DemonstrativePickerCore,
    meta: { title: `here / there / over there`, blurb: `heni (by me), hena (by you), hē (the spot I point to).` },
  },
  'te-or-ke-picker': {
    Core: TeOrKePickerCore,
    meta: { title: `After ʻikai: te or ke?`, blurb: `te before a pronoun, ke before a bare verb.` },
  },
  'aspect-picker': {
    Core: AspectPickerCore,
    meta: { title: `Still / Already / Not yet`, blurb: `Pick the word before the verb: kei, ʻosi, teʻeki ai, lolotonga, toe, toki.` },
  },
  'comparative-picker': {
    Core: ComparativePickerCore,
    meta: { title: `More or Most`, blurb: `ange (more, + a "than" phrase) vs. taha (most).` },
  },
  'direction-picker': {
    Core: DirectionPickerCore,
    meta: { title: `Which direction`, blurb: `mai (toward me), atu (toward you), ange (toward them), hake/hifo (up/down).` },
  },
  'temporal-conjunction-picker': {
    Core: TemporalConjunctionPickerCore,
    meta: { title: `if / while / until / when / although`, blurb: `kapau, lolotonga, kaeʻoua ke, ʻi he…, neongo.` },
  },
  'naa-three-way-picker': {
    Core: NaaThreeWayPickerCore,
    meta: { title: `Which naʻa? (past / lest / perhaps)`, blurb: `Tell past-tense naʻa from "lest" (after a command) and "perhaps" (clause-initial).` },
  },
  'spatial-noun-picker': {
    Core: SpatialNounPickerCore,
    meta: { title: `inside / under / on top / beside`, blurb: `loto, lalo, funga, veʻe, tuʻa, mata, mui, tafaʻaki.` },
  },
  'word-class-picker': {
    Core: WordClassPickerCore,
    meta: { title: 'Word Class Identifier', blurb: 'Same word, different role: noun, verb, adjective, or adverb?' },
  },
  'te-disambiguator': {
    Core: TeDisambiguatorCore,
    meta: { title: `The three jobs of te`, blurb: `Future marker, negation connector after ʻikai, or "one" — by position.` },
  },
  'ko-question-picker': {
    Core: KoQuestionPickerCore,
    meta: { title: 'Ko-Question Picker', blurb: 'ko hai / ko e hā / ko fē / ko e hā … ai.' },
  },
  'farewell-picker': {
    Core: FarewellPickerCore,
    meta: { title: 'Farewell Picker', blurb: 'Who is leaving? Who is staying? Pick the right form.' },
  },
  'tm-by-context-picker': {
    Core: TmByContextPickerCore,
    meta: { title: `Naʻa or Naʻe? Te or ʻE? te or ke?`, blurb: `One rule, three pairs: use the pronoun form when a pronoun follows — past, future, and negation after ʻikai.` },
  },
  'equational-subject-picker': {
    Core: EquationalSubjectPickerCore,
    meta: { title: `ʻa before a name?`, blurb: `In "X is a Y," ʻa appears before a name but drops before a pronoun.` },
  },
  'classifier-picker': {
    Core: ClassifierPickerCore,
    meta: { title: 'Classifier Picker', blurb: 'ʻe for things, toko for people, foʻi for single round/whole items.' },
  },
  'auxiliary-picker': {
    Core: AuxiliaryPickerCore,
    meta: { title: `Want / Can / Like`, blurb: `fie + verb, lava ʻo + verb, saiʻia + phrase — pick by what links to the verb.` },
  },
  'should-or-must-picker': {
    Core: ShouldOrMustPickerCore,
    meta: { title: `Should or Must`, blurb: `ʻoku totonu ke (should) vs. kuo pau ke (must).` },
  },
  'aki-suffix-picker': {
    Core: AkiSuffixPickerCore,
    meta: { title: 'ʻaki / -ʻi / -ʻaki', blurb: 'Three sound-alikes, three jobs.' },
  },
  'pehee-picker': {
    Core: PeheePickerCore,
    meta: { title: 'Pehē: Three Jobs', blurb: 'Verb (say/think), adverb (thus), or transitive (do thus to)?' },
  },
  'before-after-picker': {
    Core: BeforeAfterPickerCore,
    meta: { title: 'Before / After Picker', blurb: 'ki muʻa / ki mui / ʻamui / tōmuʻa.' },
  },
  'tae-prefix-picker': {
    Core: TaePrefixPickerCore,
    meta: { title: 'Taʻe- Prefix Picker', blurb: 'Without (noun) / un- (verb-adj) / without doing (clause).' },
  },
  'benefactive-sorter': {
    Core: BenefactiveSorterCore,
    meta: { title: 'Benefactive Sorter', blurb: 'maʻa (ʻe-class) vs moʻo (ho-class) — by what the recipient gets.' },
  },
  'doer-receiver-picker': {
    Core: DoerReceiverPickerCore,
    meta: { title: `his choosing vs. his being chosen`, blurb: `ʻene fili (he does it) vs. hono fili (it's done to him).` },
  },
  'classifier-extended-picker': {
    Core: ClassifierExtendedPickerCore,
    meta: { title: `Counting: ʻe, toko, or foʻi?`, blurb: `ʻe for things, toko for people, foʻi for single round/whole items.` },
  },
  'relative-ai-picker': {
    Core: RelativeAiPickerCore,
    meta: { title: `the place he works IN / came FROM`, blurb: `Pick ai, ki ai, or mei ai by the preposition the plain sentence would use.` },
  },
  'suffix-picker': {
    Core: SuffixPickerCore,
    meta: { title: 'Suffix Picker', blurb: '-ʻanga (place) vs -nga (thing).' },
  },
  'reduplication-effect-sorter': {
    Core: ReduplicationEffectSorterCore,
    meta: { title: 'Reduplication Effect Sorter', blurb: 'Intensify / moderate / pluralize / shift word class.' },
  },
  'register-sorter': {
    Core: RegisterSorterCore,
    meta: { title: 'Register Sorter', blurb: 'Five vocabulary levels by social rank.' },
  },
  'subject-marker-picker': {
    Core: SubjectMarkerPickerCore,
    meta: { title: `Who did it: ʻa, ʻe, or ʻe he?`, blurb: `Intransitive subjects take ʻa; transitive doers take ʻe (name) / ʻe he (common noun).` },
  },
  'pronoun-object-drop-picker': {
    Core: PronounObjectDropPickerCore,
    meta: { title: `When the object loses its ʻa`, blurb: `A name-object keeps ʻa; a pronoun-object drops it.` },
  },
  'time-pair-matcher': {
    Core: TimePairMatcherCore,
    meta: { title: 'Time-Pair Matcher', blurb: 'Pair each ʻane- past with its ʻa- future partner.' },
  },
  'definiteness-flip': {
    Core: DefinitenessFlipCore,
    meta: { title: `Some bread vs. the bread`, blurb: `Change "some" → "the" and watch the sentence rebuild, including the ʻa/ʻe subject.` },
  },
  'cleft-builder': {
    Core: CleftBuilderCore,
    meta: { title: `Say who did it (Ko …)`, blurb: `Front the doer with Ko: "It was Sione who ate it."` },
  },
  'accent-placement-picker': {
    Core: AccentPlacementPickerCore,
    meta: { title: `Where the accent lands`, blurb: `Spot which word in a noun phrase carries the accent — and which sit outside the group.` },
  },
  'verbal-noun-converter': {
    Core: VerbalNounConverterCore,
    meta: { title: `Say "when / because he read it"`, blurb: `Turn "he read it" into a "when/because" clause; pick heʻene, heʻeku, he hoʻo…` },
  },
  'reciprocity-picker': {
    Core: ReciprocityPickerCore,
    meta: { title: `"each other" verbs (fe-…-ʻaki)`, blurb: `Pick the fe-…-ʻaki form for people doing it to each other.` },
  },
  'emotional-article-matrix': {
    Core: EmotionalArticleMatrixCore,
    meta: { title: `Adding feeling: siʻi and siʻa`, blurb: `Choose the emotional "the/a" to add pity or affection.` },
  },

  // ── Phase 3: new exercises (menu + /drill/:id; no chapter anchor) ──
  'sentence-builder': {
    Core: SentenceBuilderCore,
    meta: { title: `Build a whole Tongan sentence`, blurb: `Assemble the sentence from tiles — pick the right ʻa / ʻe / ʻa e / ʻe he markers and the right order.` },
  },
  'pronoun-paradigm': {
    Core: PronounParadigmCore,
    meta: { title: `Name the pronoun`, blurb: `Recall the right preposed pronoun by its cell: singular / dual / plural, "we" with or without you.` },
  },
  'there-is-have': {
    Core: ThereIsHaveCore,
    meta: { title: `There is / I have`, blurb: `ʻi ai for "there is" and "have"; the negative "have" drops ʻi ai, but the negative "there is" keeps it (ʻikai ke ʻi ai). Pick the right opener and tense.` },
  },
  'count-time': {
    Core: CountTimeCore,
    meta: { title: `Count and tell the time`, blurb: `The numbers 1-10 inside their frames: ʻe for things, toko for people, the clock, prices.` },
  },
  'connector-disambiguator': {
    Core: ConnectorDisambiguatorCore,
    meta: { title: `Which connector: and / with / but / because`, blurb: `Three words for "and" (mo, pea, ʻo), two for "but" (ka, kae), ke for purpose, he for reason — choose by what is being joined.` },
  },
  'kinship-possessive': {
    Core: KinshipPossessiveCore,
    meta: { title: `Family: my / your / his`, blurb: `Relatives are ho-class — but parents and children flip to e-class (ʻeku tamai, hoku tokoua).` },
  },
  'vocab-cloze': {
    Core: VocabClozeCore,
    meta: { title: `Fill the blank (vocabulary)`, blurb: `A known frame with one word missing and an English cue — recall the Tongan word.` },
  },

  // ── Coverage drills for previously undrilled TEACH chapters (Ch 18 / 37 / 46) ──
  'definiteness-three-way-picker': {
    Core: DefinitenessThreeWayPickerCore,
    meta: { title: `any basket, a basket, or THE basket?`, blurb: `Three levels: ha (any one), e (a particular one), e + stress on the last vowel (the one you both know).` },
  },
  'postposed-possessive-picker': {
    Core: PostposedPossessivePickerCore,
    meta: { title: `That one is MINE`, blurb: `Ownership after the noun: ʻaʻaku (things you control) vs. ʻoʻoku (things that shelter or define you) — and ʻa hai / ʻo hai for "whose?".` },
  },
  'noun-class-sorter': {
    Core: NounClassSorterCore,
    meta: { title: `Person, place, or thing: which "to"?`, blurb: `kia Mele, ki kolo, ki he motú — names and places skip the article; everything else takes he and the accent.` },
  },
}
