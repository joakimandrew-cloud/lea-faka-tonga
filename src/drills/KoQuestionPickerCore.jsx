/**
 * KoQuestionPickerCore — Ch 13.
 *
 * The ko-question family: ko hai (who), ko e hā (what), ko fē (where/which),
 * ko e hā ... ai (why). Each opens an identification-style question that
 * mirrors the equational ko pattern.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ko-hai',    label: 'ko hai',     detail: 'who' },
  { id: 'ko-e-ha',   label: 'ko e hā',    detail: 'what' },
  { id: 'ko-fe',     label: 'ko fē',      detail: 'where / which' },
  { id: 'ko-e-ha-ai',label: 'ko e hā … ai', detail: 'why' },
]

const PROMPTS = [
  { tongan: '___ ʻoku hiva?',                        english: 'Who is singing?',                              answer: 'ko-hai',     why: 'ko hai asks about a person\u2019s identity.' },
  { tongan: '___ ʻa e meʻa ʻokú ke fiemaʻu?',        english: 'What do you want?',                            answer: 'ko-e-ha',    why: 'ko e hā + meʻa = "what is the thing?". Used for asking about things.' },
  { tongan: '___ ʻa e kato?',                        english: 'Where is the basket?',                         answer: 'ko-fe',      why: 'ko fē asks for the location of something within view (uses the ko pattern, not the verbal pattern).' },
  { tongan: '___ naʻá ke ʻalu ___ ki Nukuʻalofa?',   english: 'Why did you go to Nukuʻalofa?',                 answer: 'ko-e-ha-ai', why: 'ko e hā at the front + ai after the verb = "why?". The ai refers back to the unknown reason.' },
  { tongan: '___ naʻe mohe?',                        english: 'Who slept?',                                   answer: 'ko-hai',     why: 'Asking about a person → ko hai.' },
  { tongan: '___ ē?',                                english: 'What is that?',                                answer: 'ko-e-ha',    why: 'Short identification question: ko e hā ē (what + that) is the standard "what is that?".' },
  { tongan: '___ naʻe ʻita ___?',                    english: 'Why was he angry?',                            answer: 'ko-e-ha-ai', why: 'Same why-pattern: ko e hā + verb + ai.' },
  { tongan: '___ ʻa e vaka?',                        english: 'Where is the boat?',                           answer: 'ko-fe',      why: 'Locating an object within view → ko fē.' },
]

export default function KoQuestionPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which ko-question opener fills the blank(s)?"
      promptLabel="Question"
    />
  )
}
