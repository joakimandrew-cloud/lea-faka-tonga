/**
 * DoerReceiverPickerCore — Ch 29.
 *
 * The deeper principle behind the e/ho class system: ʻe-class marks
 * the DOER, ho-class marks the RECEIVER. Most visible with verbal
 * nouns, where the same verb-noun has two meanings: "ʻene fili" =
 * his choosing (he does it), "hono fili" = his being chosen (it's
 * done to him).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'eclass', label: 'ʻe-class', detail: 'doer (he/she does the action)' },
  { id: 'hoclass', label: 'ho-class', detail: 'receiver (the action is done to him/her)' },
]

const PROMPTS = [
  { tongan: 'ʻeku tokoni',   english: 'my ___ (help)',     answer: 'eclass',  why: 'ʻeku is ʻe-class → I am the doer. The helping done BY me.' },
  { tongan: 'hoku tokoni',   english: 'my ___ (help)',     answer: 'hoclass', why: 'hoku is ho-class → I am the receiver. The helping done TO me.' },
  { tongan: 'ʻene fili',     english: 'his ___ (choose)',  answer: 'eclass',  why: 'ʻene is ʻe-class → he is the doer.' },
  { tongan: 'hono fili',     english: 'his ___ (choose)',  answer: 'hoclass', why: 'hono is ho-class → he is the receiver of the action.' },
  { tongan: 'ʻene tohi',     english: 'his ___ (write)',   answer: 'eclass',  why: 'ʻene → he does the writing. (hono tohi would mean "his being written about".)' },
  { tongan: 'hono tohi',     english: 'his ___ (write)',   answer: 'hoclass', why: 'hono → the writing is ABOUT him; he is its subject, not its author.' },
  { tongan: 'ʻenau ngāue',   english: 'their ___ (work)',  answer: 'eclass',  why: 'Intransitive verb (ngāue): only the doer reading is possible. ʻenau = they-as-doers.' },
  { tongan: 'ʻene hiva',     english: 'his ___ (sing)',    answer: 'eclass',  why: 'ʻene → he sings the song. (hono hiva would mean "the song sung about him".)' },
]

export default function DoerReceiverPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Doer or receiver?"
      promptLabel="Verbal noun"
    />
  )
}
