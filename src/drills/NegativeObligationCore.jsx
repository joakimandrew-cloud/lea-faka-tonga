/**
 * NegativeObligationCore, Ch 23.
 *
 * The should-or-must picker only drills the positive obligation frames.
 * This fills the gap: negating obligation. Three patterns to choose between:
 *   - ʻoku ʻikai totonu ke  → present "should not" (ʻikai inserted between TM and totonu)
 *   - naʻe ʻikai totonu ke  → past "should not have" (negatives take naʻe)
 *   - ʻoku totonu ke ʻoua naʻa → emphatic prohibition embedded in the ke clause
 * Read the English, pick the frame that fills the blank.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'present', label: 'ʻoku ʻikai totonu ke',     detail: 'should not (present)' },
  { id: 'past',    label: 'naʻe ʻikai totonu ke',     detail: 'should not have (past)' },
  { id: 'oua',     label: 'ʻoku totonu ke ʻoua naʻa', detail: "shouldn't (emphatic)" },
]

const PROMPTS = [
  { tongan: '___ u lea.',           english: 'I should not speak.',              answer: 'present', why: 'Plain present "should not": ʻikai slots between the tense marker ʻoku and totonu, ʻOku ʻikai totonu ke u lea.' },
  { tongan: '___ ke nofo heni.',    english: 'You should not stay here.',        answer: 'present', why: 'Present "should not" with the "you" pronoun ke after totonu ke, ʻOku ʻikai totonu ke ke nofo heni.' },
  { tongan: '___ u haʻu.',          english: 'I should not come.',               answer: 'present', why: 'Present negation of an obligation: ʻOku ʻikai totonu ke u haʻu.' },
  { tongan: '___ ke mohe.',         english: 'You should not sleep.',            answer: 'present', why: 'Plain "should not": ʻOku ʻikai totonu ke ke mohe (from the all-patterns table).' },
  { tongan: '___ ʻi heni ʻa Pita.', english: 'Pita should not have been here.',  answer: 'past',    why: 'Past "should have" takes naʻe, like all negatives, Naʻe ʻikai totonu ke ʻi heni ʻa Pita.' },
  { tongan: '___ ʻi heni ʻa Tēvita.', english: 'Tēvita should not have been here.', answer: 'past', why: 'Past negative obligation with a noun subject, Naʻe ʻikai totonu ke ʻi heni ʻa Tēvita.' },
  { tongan: 'ʻOku totonu ke ___ ke ʻita.',     english: "You shouldn't be angry.",  answer: 'oua', why: 'Emphatic prohibition: ʻoua naʻa is embedded in the ke clause, ʻOku totonu ke ʻoua naʻá ke ʻita.' },
  { tongan: 'ʻOku totonu ke ___ haʻu ʻa Mele.', english: 'Mele should not come.',    answer: 'oua', why: 'Emphatic "should not" with a noun subject, ʻOku totonu ke ʻoua naʻa haʻu ʻa Mele.' },
]

export default function NegativeObligationCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which negative-obligation frame fills the blank?"
      promptLabel="Sentence"
    />
  )
}
