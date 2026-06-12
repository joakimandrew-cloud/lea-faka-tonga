/**
 * QuestionWordPickerCore — Ch 11.
 *
 * The Tongan rule: the question word sits where the answer would go.
 * The drill shows a sentence with a blank that maps to a particular kind
 * of answer (place, past time, future time, manner, etc.) and asks the
 * student to pick the right interrogative.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'i-fe',   label: 'ʻi fē',   detail: 'where (at)' },
  { id: 'ki-fe',  label: 'ki fē',   detail: 'where (to)' },
  { id: 'mei-fe', label: 'mei fē',  detail: 'where (from)' },
  { id: 'anefe',  label: 'ʻanefē',  detail: 'when (past)' },
  { id: 'afe',    label: 'ʻafē',    detail: 'when (future)' },
  { id: 'fiha',   label: 'fiha',    detail: 'how many / what time' },
  { id: 'fefe',   label: 'fēfē',    detail: 'how / in what state' },
]

const PROMPTS = [
  { tongan: 'Naʻá ke nofo ___ ʻanepō?',               english: 'Where did you stay last night?',  answer: 'i-fe',  why: 'Asks about location (at). The answer would be ʻi + place → ʻi fē.' },
  { tongan: 'Té ke ʻalu ___?',                        english: 'Where are you going?',             answer: 'ki-fe', why: 'Destination (to). Answer is ki + place → ki fē.' },
  { tongan: 'Naʻá ke haʻu ___?',                      english: 'Where did you come from?',         answer: 'mei-fe', why: 'Source (from). Answer is mei + place → mei fē.' },
  { tongan: 'Naʻá ne foki mai ___?',                  english: 'When did he/she return?',          answer: 'anefe', why: 'Past return → past "when" word ʻanefē. (Future would use ʻafē.)' },
  { tongan: 'Te mau haʻu ___?',                       english: 'When will we come?',               answer: 'afe',   why: 'Future tense (te mau) → future "when" word ʻafē.' },
  { tongan: 'Te tau kamata ngāue he ___?',            english: 'At what time shall we start work?', answer: 'fiha', why: 'Asking about clock time → fiha (sits in the time slot, paired with he).' },
  { tongan: 'ʻOkú ke ___?',                           english: 'How are you?',                     answer: 'fefe',  why: 'fēfē fills the verb slot, asking about state. The greeting Fēfē hake? builds on this.' },
  { tongan: 'Naʻa nau ako ___?',                      english: 'When did they study?',             answer: 'anefe', why: 'Past (Naʻa nau) → past "when" word ʻanefē, sitting where the time word would.' },
]

export default function QuestionWordPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which question word fills the blank?"
      promptLabel="Sentence"
    />
  )
}
