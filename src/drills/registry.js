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

export const drillRegistry = {
  // ── Six existing drills ─────────────────────────────────────
  'tense-swapper': {
    Core: TenseSwapperCore,
    meta: { title: 'Tense Swapper', blurb: 'Swap the particle. The verb stays still.' },
  },
  'first-word-quiz': {
    Core: FirstWordQuizCore,
    meta: { title: 'First-Word Quiz', blurb: 'Predict the sentence shape from its opener.' },
  },
  'possessive-sorter': {
    Core: PossessiveSorterCore,
    meta: { title: 'Possessive Sorter', blurb: 'ʻeku or hoku? Doer or receiver?' },
  },
  'adjective-flip': {
    Core: AdjectiveFlipCore,
    meta: { title: 'Adjective Flip', blurb: 'Click words in Tongan order. Noun leads.' },
  },
  'skeleton-filler': {
    Core: SkeletonFillerCore,
    meta: { title: 'Skeleton Filler', blurb: 'Fill the slots; the pattern tells you what goes where.' },
  },
  'clusivity-corner': {
    Core: ClusivityCornerCore,
    meta: { title: 'Clusivity Corner', blurb: 'Four "we"s. Pick the one that includes (or excludes) the listener.' },
  },

  // ── New-shape sorter ────────────────────────────────────────
  'faka-pattern-sorter': {
    Core: FakaSorterCore,
    meta: { title: 'Faka- Pattern Sorter', blurb: 'One prefix, four jobs. Which is faka- doing here?' },
  },

  // ── New-shape pickers (PickerCore variants) ─────────────────
  'preposition-selector': {
    Core: PrepositionSelectorCore,
    meta: { title: 'Preposition Selector', blurb: 'ʻi / ki / mei plus the right form for the noun class.' },
  },
  'ai-substitution': {
    Core: AiSubstitutionCore,
    meta: { title: 'Ai Substitution', blurb: 'Replace a noun after a preposition with the matching ai-form.' },
  },
  'article-picker': {
    Core: ArticlePickerCore,
    meta: { title: 'Article Picker', blurb: 'ha, ʻa e, or he? Definiteness × position.' },
  },
  'question-word-picker': {
    Core: QuestionWordPickerCore,
    meta: { title: 'Question-Word Picker', blurb: 'The question word sits where the answer goes. Which one?' },
  },
  'ka-or-kae-picker': {
    Core: KaOrKaePickerCore,
    meta: { title: 'Ka or Kae?', blurb: 'Tongan splits "but" by the next word\u2019s class.' },
  },
  'plural-marker-picker': {
    Core: PluralMarkerPickerCore,
    meta: { title: 'Plural Marker Picker', blurb: 'ngaahi / kau / fanga / ʻū / ongo by noun type.' },
  },
  'conditional-picker': {
    Core: ConditionalPickerCore,
    meta: { title: 'Conditional Picker', blurb: 'kapau / ka / ka ne — by the speaker\u2019s confidence.' },
  },
  'modifier-order': {
    Core: ModifierOrderCore,
    meta: { title: 'Modifier Order', blurb: 'Modifiers go after the verb. (faʻa is the one that doesn\u2019t.)' },
  },
  'audience-picker': {
    Core: AudiencePickerCore,
    meta: { title: 'Audience Picker', blurb: 'Pick the right command form: bare / mo / mou.' },
  },
  'demonstrative-picker': {
    Core: DemonstrativePickerCore,
    meta: { title: 'Demonstrative Picker', blurb: 'heni (near me) / hena (near you) / hē (over there).' },
  },
  'te-or-ke-picker': {
    Core: TeOrKePickerCore,
    meta: { title: 'Te or Ke?', blurb: 'After ʻikai: te before pronouns, ke before verbs.' },
  },
  'aspect-picker': {
    Core: AspectPickerCore,
    meta: { title: 'Aspect Picker', blurb: 'kei / ʻosi / teʻeki ai / lolotonga / toe / toki / leva.' },
  },
  'comparative-picker': {
    Core: ComparativePickerCore,
    meta: { title: 'Comparative or Superlative?', blurb: 'ange (more) vs taha (most).' },
  },
  'direction-picker': {
    Core: DirectionPickerCore,
    meta: { title: 'Direction Picker', blurb: 'mai / atu / ange / hake / hifo / holo.' },
  },
  'temporal-conjunction-picker': {
    Core: TemporalConjunctionPickerCore,
    meta: { title: 'Temporal Conjunction Picker', blurb: 'kapau / lolotonga / kaeʻoua ke / ʻi he / neongo.' },
  },
  'naa-three-way-picker': {
    Core: NaaThreeWayPickerCore,
    meta: { title: 'Naʻa: Three Jobs', blurb: 'Past TM, warning "lest", or uncertainty "perhaps"?' },
  },
  'spatial-noun-picker': {
    Core: SpatialNounPickerCore,
    meta: { title: 'Spatial Noun Picker', blurb: 'loto / lalo / tuʻa / mata / funga / veʻe.' },
  },
  'word-class-picker': {
    Core: WordClassPickerCore,
    meta: { title: 'Word Class Identifier', blurb: 'Same word, different role: noun, verb, adjective, or adverb?' },
  },
  'te-disambiguator': {
    Core: TeDisambiguatorCore,
    meta: { title: 'Te: Three Jobs', blurb: 'Future TM, negation connector, or impersonal "one"?' },
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
    meta: { title: 'Tense Marker by Context', blurb: 'naʻa vs naʻe, te vs ʻe — by what comes next.' },
  },
  'equational-subject-picker': {
    Core: EquationalSubjectPickerCore,
    meta: { title: 'Equational Subject', blurb: 'ʻa before names, no marker before pronouns.' },
  },
  'classifier-picker': {
    Core: ClassifierPickerCore,
    meta: { title: 'Classifier Picker', blurb: 'ʻe for things, toko for people.' },
  },
  'auxiliary-picker': {
    Core: AuxiliaryPickerCore,
    meta: { title: 'Auxiliary Picker', blurb: 'fie / lava ʻo / saiʻia by the role they play.' },
  },
  'should-or-must-picker': {
    Core: ShouldOrMustPickerCore,
    meta: { title: 'Should or Must?', blurb: 'ʻoku totonu ke (should) vs kuo pau ke (must).' },
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
    meta: { title: 'Doer or Receiver?', blurb: 'ʻene fili (his choosing) vs hono fili (his being chosen).' },
  },
  'classifier-extended-picker': {
    Core: ClassifierExtendedPickerCore,
    meta: { title: 'Classifier Picker (extended)', blurb: 'ʻe / toko / foʻi by what\u2019s being counted.' },
  },
  'relative-ai-picker': {
    Core: RelativeAiPickerCore,
    meta: { title: 'Relative Ai Picker', blurb: 'Pick the right ai-form by which preposition the original used.' },
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
    meta: { title: 'Subject Marker Picker', blurb: 'ʻa / ʻe / ʻe he by transitivity.' },
  },
  'pronoun-object-drop-picker': {
    Core: PronounObjectDropPickerCore,
    meta: { title: 'Pronoun Object Drop', blurb: 'With ʻa before names, no marker before pronouns.' },
  },
  'time-pair-matcher': {
    Core: TimePairMatcherCore,
    meta: { title: 'Time-Pair Matcher', blurb: 'Pair each ʻane- past with its ʻa- future partner.' },
  },
  'definiteness-flip': {
    Core: DefinitenessFlipCore,
    meta: { title: 'Definiteness Flip', blurb: 'Toggle "some" ↔ "the" and watch the Tongan sentence rebuild.' },
  },
  'cleft-builder': {
    Core: CleftBuilderCore,
    meta: { title: 'Cleft Builder', blurb: 'Build the cleft tile-by-tile: ko + subject + TM + ne + verb.' },
  },
  'accent-placement-picker': {
    Core: AccentPlacementPickerCore,
    meta: { title: 'Accent Placement', blurb: 'Where does the definitive accent fall in the noun group?' },
  },
  'verbal-noun-converter': {
    Core: VerbalNounConverterCore,
    meta: { title: 'Verbal Noun Converter', blurb: 'Pronoun → possessive (heʻeku / heʻene / he ʻenau).' },
  },
  'reciprocity-picker': {
    Core: ReciprocityPickerCore,
    meta: { title: 'Reciprocity Picker', blurb: 'Build the fe-…-ʻaki form for "X each other".' },
  },
  'emotional-article-matrix': {
    Core: EmotionalArticleMatrixCore,
    meta: { title: 'Emotional Article 2×2', blurb: 'Definite × emotional. e / ha / siʻi / siʻa.' },
  },
}
