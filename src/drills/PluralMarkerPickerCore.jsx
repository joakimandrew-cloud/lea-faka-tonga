/**
 * PluralMarkerPickerCore — Ch 25.
 *
 * Five plural markers compete by what kind of noun follows: ngaahi
 * (general default), kau (people), fanga (animals + ki'i + noun),
 * 'ū (small group of things), ongo (exactly two of anything).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ngaahi', label: 'ngaahi', detail: 'general / default' },
  { id: 'kau',    label: 'kau',    detail: 'people' },
  { id: 'fanga',  label: 'fanga',  detail: 'animals; or kiʻi + noun' },
  { id: 'u',      label: 'ʻū',     detail: 'a few things' },
  { id: 'ongo',   label: 'ongo',   detail: 'exactly two (any kind)' },
]

const PROMPTS = [
  { tongan: 'e ___ faiakó',                english: 'the teachers',                       answer: 'kau',    why: 'Teachers are people. People take kau.' },
  { tongan: 'ha ___ moa',                  english: 'some chickens',                      answer: 'fanga',  why: 'Chickens are animals. Animals take fanga.' },
  { tongan: 'e ___ falé',                  english: 'the houses',                         answer: 'ngaahi', acceptAlso: ['u'], why: 'Houses are general things and there are several. ngaahi is the default for any noun.', note: 'For things, ʻū is more or less interchangeable with ngaahi (Churchward 5.8, 5.10), so ʻū is accepted too.' },
  { tongan: 'e ___ tangatá',               english: 'the two men',                        answer: 'ongo',   why: 'Exactly two of anything → ongo. (Even though men are people, the dual takes precedence over kau.)' },
  { tongan: 'ha ___ tohi',                 english: 'a few books',                        answer: 'u',      acceptAlso: ['ngaahi'], why: 'A small group of things → ʻū.', note: 'ʻŪ is the more natural choice for a small handful; the book calls ʻū and ngaahi often interchangeable, so ngaahi is accepted too.' },
  { tongan: 'ha ___ kiʻi kato',            english: 'some little baskets',                answer: 'fanga',  why: 'kiʻi + noun always triggers fanga, even though baskets aren\u2019t animals.' },
  { tongan: 'e ___ fefiné',                english: 'the women',                          answer: 'kau',    why: 'Women are people. People take kau: e kau fefiné. (The special form fafine is used for the dual: e ongo fafiné.)' },
  { tongan: 'ha ___ pulu',                 english: 'some cows',                          answer: 'fanga',  why: 'Cows are animals. fanga.' },
  { tongan: 'ha ___ vaka',                 english: 'two boats',                          answer: 'ongo',   why: 'Two of anything → ongo.' },
  { tongan: 'e ___ akó',                   english: 'the schools',                        answer: 'ngaahi', acceptAlso: ['u'], why: 'kau ako means "students" (people who study). For "schools" (the buildings/institutions) use ngaahi.', note: 'For things, ʻū is more or less interchangeable with ngaahi (Churchward 5.8, 5.10), so ʻū is accepted too.' },
]

export default function PluralMarkerPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which plural marker fills the blank?"
      promptLabel="Phrase"
    />
  )
}
