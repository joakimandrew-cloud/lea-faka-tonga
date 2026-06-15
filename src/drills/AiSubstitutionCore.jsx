/**
 * AiSubstitutionCore — Ch 7.
 *
 * The particle ai stands in for a noun after a preposition. Which form
 * the answer takes (ki ai / ʻi ai / mei ai) depends on which preposition
 * was in the question — the preposition stays, the noun becomes ai.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ki-ai',  label: 'ki ai',  detail: 'replaces ki + place / kia + person' },
  { id: 'i-ai',   label: 'ʻi ai',  detail: 'replaces ʻi + place' },
  { id: 'mei-ai', label: 'mei ai', detail: 'replaces mei + place' },
]

const PROMPTS = [
  { tongan: 'Té ke ʻalu ki Vavaʻu? ʻIo, té u ʻalu ___.',           english: 'Will you go to Vavaʻu? Yes, I will go there.',  answer: 'ki-ai',  why: 'The question used ki Vavaʻu: preposition ki stays, place → ai.' },
  { tongan: 'ʻOkú ne ʻi Tonga? ʻIo, ʻokú ne ___.',                  english: 'Is he in Tonga? Yes, he is there.',             answer: 'i-ai',   why: 'The question used ʻi Tonga: preposition ʻi stays, place → ai.' },
  { tongan: 'Naʻá ke haʻu mei Fisi? ʻIo, naʻá ku haʻu ___.',        english: 'Did you come from Fiji? Yes, I came from there.', answer: 'mei-ai', why: 'The question used mei Fisi: preposition mei stays, place → ai.' },
  { tongan: 'Té ke lea kia Mele? ʻIo, té u lea ___.',               english: 'Will you speak to Mele? Yes, I will speak to her.', answer: 'ki-ai', why: 'kia Mele had ki underneath. Preposition stays as ki + ai. Both places (ki Tonga) and people (kia Mele) collapse to ki ai.' },
  { tongan: 'Naʻá ne ʻalu mei ʻapi? ʻIo, naʻá ne ʻalu ___.',        english: 'Did she leave from home? Yes, she left from there.', answer: 'mei-ai', why: 'mei ʻapi → mei ai. Preposition stays, location is replaced.' },
  { tongan: 'ʻOkú ke ʻi kolo? ʻIo, ʻoku ou ___.',                   english: 'Are you in town? Yes, I am there.',             answer: 'i-ai',   why: 'ʻi kolo → ʻi ai. The location word becomes ai; ʻi survives.' },
  { tongan: 'Naʻá ke tokoni kia Seini? ʻIo, naʻá ku tokoni ___.',   english: 'Did you help Seini? Yes, I helped her.',         answer: 'ki-ai',  why: 'tokoni takes ki/kia. Person → ai, preposition stays as ki ai.' },
]

export default function AiSubstitutionCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which ai-form completes the answer?"
      promptLabel="Q & A"
    />
  )
}
