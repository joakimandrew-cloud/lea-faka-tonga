/**
 * SameAsLikeCore — Ch 27.
 *
 * Four comparison constructions that the comparative-picker half omits:
 *   tatau mo  — "same as" (equality, + the preposition mo)
 *   ʻo hangē  — "like / as if" (hangē, preceded by ʻo)
 *   ange      — comparative "more", with a "than" phrase
 *   taha      — superlative "most / -est"
 * Read the English; pick the construction that builds the Tongan.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'tatau', label: 'tatau mo', detail: 'same as (equality)' },
  { id: 'hange', label: 'ʻo hangē', detail: 'like / as if' },
  { id: 'ange',  label: 'ange',     detail: 'more (… than)' },
  { id: 'taha',  label: 'taha',     detail: 'most / -est' },
]

const PROMPTS = [
  { tongan: 'ʻOku mālohi ___ ʻa Tēvita ʻia Sēmisi.',          english: 'Tēvita is stronger than Sēmisi.',      answer: 'ange',  why: 'A "than" comparison: adjective + ange, with the ʻi/ʻia phrase naming what is compared to. (Ch 27: "ʻOku mālohi ange ʻa Tēvita ʻia Sēmisi.")' },
  { tongan: 'ʻOku tatau ʻa e tohi ko eni ___ e tohi ko ē.',   english: 'This book is the same as that book.',   answer: 'tatau', why: 'Equality uses tatau + the preposition mo ("with"). (Ch 27: "ʻOku tatau ʻa e tohi ko eni mo e tohi ko ē.")' },
  { tongan: 'Naʻe ngāue ʻa Sēmisi ___ ha fuʻu hōsí.',         english: 'Sēmisi worked like a big horse.',      answer: 'hange', why: 'hangē = "like / as if"; before a verb it is preceded by ʻo, and ha introduces the indefinite noun. (Ch 27: "Naʻe ngāue ʻa Sēmisi ʻo hangē ha fuʻu hōsí.")' },
  { tongan: 'ʻOku lelei ___ e ngāué ʻa Seini.',               english: "Seini's work is the best of all.",     answer: 'taha',  why: 'Superlative ("the best") = adjective + taha, standing alone with no "than" phrase. (Ch 27: "ʻOku lelei taha e ngāué ʻa Seini.")' },
  { tongan: 'ʻOku vave ___ ʻa e lolí ʻi he pasikalá.',        english: 'The truck is faster than the bicycle.', answer: 'ange',  why: 'Comparative ange with a "than" phrase (ʻi he + common noun). (Ch 27: "ʻOku vave ange ʻa e lolí ʻi he pasikalá.")' },
  { tongan: 'Naʻe hiva ʻa Neomai ___ ko e taʻahine.',         english: 'Neomai sang like a young woman.',       answer: 'hange', why: 'hangē introducing a noun directly takes ʻo … ko before the noun. (Ch 27: "Naʻe hiva ʻa Neomai ʻo hangē ko e taʻahine.")' },
  { tongan: 'ʻOku mālohi ___ ʻa Siaosi.',                     english: 'Siaosi is the strongest.',             answer: 'taha',  why: 'Superlative taha: the most within the group, no comparison phrase. (Ch 27: "ʻOku mālohi taha ʻa Siaosi.")' },
  { tongan: 'ʻOku ___ eni mo ē.',                             english: 'This is the same as that.',            answer: 'tatau', why: 'tatau pairs with mo for "the same as"; here with the short demonstratives eni / ē. (Ch 27: "ʻOku tatau eni mo ē.")' },
]

export default function SameAsLikeCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which comparison word builds the Tongan sentence?"
      promptLabel="Sentence"
    />
  )
}
