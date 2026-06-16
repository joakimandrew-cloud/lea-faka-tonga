/**
 * AkiSuffixPickerCore — Ch 33.
 *
 * Three sound-alike grammatical pieces with different jobs: ʻaki (free
 * preposition meaning "with / by means of"), -ʻi (transitive suffix
 * making intransitives transitive), -ʻaki (suffix making nouns/verbs
 * into "use as"). The drill teaches the student to read context and
 * pick the right tool.
 */

import PickerCore from './PickerCore'

// `fill` is the hyphen-free string PickerCore drops into the sentence blank
// (renderTongan prefers `fill` over `label`). The base verb butts straight up
// against `___` with no space, so a suffix fill joins on-screen: e.g.
// "tokoni___" + fill "ʻi" renders as "tokoniʻi". `label` keeps the hyphen for
// the option button only, where the leading dash signals "this is a suffix".
const OPTIONS = [
  { id: 'aki-prep',   label: 'ʻaki',  fill: 'ʻaki', detail: 'separate word: with / by means of' },
  { id: 'i-suffix',   label: '-ʻi',   fill: 'ʻi',   detail: 'suffix: transitivize a verb' },
  { id: 'aki-suffix', label: '-ʻaki', fill: 'ʻaki', detail: 'suffix: use as / treat as' },
]

const PROMPTS = [
  { tongan: 'Fufulu ___ ho falá e vai māfaná.',     english: 'Wash your mat with warm water.',                  answer: 'aki-prep',   why: 'ʻaki here is a separate word meaning "with / by means of" (the instrument is warm water).' },
  { tongan: 'Naʻá ku tokoni___ ʻa Seini.',           english: 'I helped Seini.',                                 answer: 'i-suffix',   why: 'The suffix -ʻi turns intransitive tokoni into transitive tokoniʻi, which takes a direct object marked by ʻa.' },
  { tongan: 'ʻOku mau ngāue___ ʻene ʻu falá.',       english: 'We are using his mats.',                          answer: 'aki-suffix', why: 'ngāue (work) + -ʻaki = ngāueʻaki = "to use". The -ʻaki suffix attaches to make "use as" verbs.' },
  { tongan: 'ʻOkú ne pule___ ʻa e ngāué.',            english: 'He manages the work.',                            answer: 'i-suffix',   why: 'pule + -ʻi = puleʻi (to manage as transitive). Without -ʻi, pule takes ki: pule ki he ngāué.' },
  { tongan: 'ʻOku ngaohi ʻeni ___ ʻa e niu.',         english: 'This is made of coconut.',                        answer: 'aki-prep',   why: 'After verbs of making, ʻaki marks the material → "of / out of". Separate word.' },
  { tongan: 'Naʻá ku tāpuni___ e katō.',              english: 'I closed the basket completely.',                 answer: 'i-suffix',   why: 'Adding -ʻi to an already-transitive verb (tāpuni) emphasizes that the action was carried through to completion.' },
  { tongan: 'Tau fai___ pē hoʻo fakakaukau.',         english: 'We will go along with your opinion.',              answer: 'aki-suffix', why: 'fai + -ʻaki = faiʻaki = "manage with / let suffice". The -ʻaki suffix again.' },
]

export default function AkiSuffixPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which form fills the blank?"
      promptLabel="Sentence"
    />
  )
}
