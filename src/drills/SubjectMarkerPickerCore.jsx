/**
 * SubjectMarkerPickerCore — Ch 19.
 *
 * Tongan's central syntactic split. Intransitive subjects take ʻa,
 * transitive subjects take ʻe (or ʻe he before a common noun + def
 * article). The drill makes the student commit to the marker by
 * reading whether the verb has a separate object.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'a',     label: 'ʻa',    detail: 'intransitive subject (no object)' },
  { id: 'e',     label: 'ʻe',    detail: 'transitive subject (proper noun)' },
  { id: 'e-he',  label: 'ʻe he', detail: 'transitive subject (common noun + article)' },
]

const PROMPTS = [
  { tongan: 'Naʻe nofo ___ Lupe ʻi kolo.',         english: 'Lupe lived in town.',                            answer: 'a',    why: 'No object → intransitive → ʻa. (Lupe is a proper noun, but that doesn\u2019t matter for intransitives.)' },
  { tongan: 'Naʻe ui ___ Pita ʻa e tamasiʻí.',     english: 'Pita called the boy.',                            answer: 'e',    why: 'Object present (e tamasiʻí) → transitive → ʻe. Pita is a proper noun → just ʻe, no article.' },
  { tongan: 'Kuo kumi ___ faiakó ʻa e kulī.',      english: 'The teacher has searched for the dog.',           answer: 'e-he', why: 'Object present (e kulī) → transitive → ʻe. Subject is a common noun (faiakó) → ʻe + he = ʻe he.' },
  { tongan: 'ʻE foki ___ Mele ʻapongipongi.',      english: 'Mele will return tomorrow.',                       answer: 'a',    why: 'No object → intransitive → ʻa.' },
  { tongan: 'Naʻe tāmateʻi ___ Sione ʻa e moá.',   english: 'Sione killed the chicken.',                        answer: 'e',    why: 'Object present (e moá) → transitive → ʻe before proper noun.' },
  { tongan: 'Naʻe lea ___ Mafi.',                  english: 'Mafi spoke.',                                      answer: 'a',    why: 'lea (speak) here has no object → intransitive → ʻa.' },
  { tongan: 'Naʻe lau ___ tamasiʻí ʻa e tohí.',    english: 'The boy read the book.',                           answer: 'e-he', why: 'Object (e tohí) + common-noun subject (tamasiʻí) → ʻe he.' },
  { tongan: 'Naʻe lele ___ tamasiʻí.',             english: 'The boy ran.',                                     answer: 'a',    why: 'No object → intransitive → ʻa, even though the subject is a common noun.' },
]

export default function SubjectMarkerPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which subject marker fills the blank?"
      promptLabel="Sentence"
    />
  )
}
