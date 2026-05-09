/**
 * TmByContextPickerCore — Ch 15.
 *
 * Tongan past and future TMs each have two forms: naʻa / te before a
 * pronoun, naʻe / ʻe everywhere else (before a verb with noun subject,
 * before negation, etc.). The drill makes the rule reflexive.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'naa', label: 'Naʻa', detail: 'past, before a pronoun' },
  { id: 'nae', label: 'Naʻe', detail: 'past, elsewhere (noun subject, negation, impersonal)' },
  { id: 'te',  label: 'Te',   detail: 'future, before a pronoun' },
  { id: 'e',   label: 'ʻE',   detail: 'future, elsewhere' },
]

const PROMPTS = [
  { tongan: '___ ku ʻalu.',                   english: 'I went.',                                  answer: 'naa', why: 'Past + pronoun (ku follows immediately) → Naʻa.' },
  { tongan: '___ ʻalu ʻa Sione.',             english: 'Sione went. (noun subject)',               answer: 'nae', why: 'Past + verb-first with noun subject (no pronoun) → Naʻe. The pronoun-form Naʻa is only used when a pronoun follows directly.' },
  { tongan: '___ u ʻalu.',                    english: 'I will go.',                               answer: 'te',  why: 'Future + pronoun (u) → Te.' },
  { tongan: '___ ʻalu ʻa Mele.',              english: 'Mele will go. (noun subject)',             answer: 'e',   why: 'Future + verb-first with noun subject → ʻE. The pronoun-form Te is only used when a pronoun follows directly.' },
  { tongan: '___ ʻikai té u kai.',            english: 'I did not eat.',                           answer: 'nae', why: 'Past + ʻikai (negation, not a pronoun) → Naʻe. The pronoun-form Naʻa only fits when a pronoun follows directly; here ʻikai sits between.' },
  { tongan: '___ hiva ʻa Tēvita.',            english: 'Tēvita will sing.',                        answer: 'e',   why: 'Future + noun subject → ʻE. Pair with the post-verb "ʻa Tēvita" subject construction.' },
  { tongan: '___ ne haʻu.',                   english: 'He came.',                                 answer: 'naa', why: 'Past + pronoun (ne, accent shifts to Naʻá) → Naʻa.' },
  { tongan: '___ kai ʻa Pita.',               english: 'Pita ate.',                                answer: 'nae', why: 'Past + noun-subject construction → Naʻe.' },
]

export default function TmByContextPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which tense marker fills the blank?"
      promptLabel="Sentence"
    />
  )
}
