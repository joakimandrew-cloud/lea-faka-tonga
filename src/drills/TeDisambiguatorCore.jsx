/**
 * TeDisambiguatorCore — Ch 51.
 *
 * The word te wears three different hats:
 *   1. Future tense marker (Ch 2) — té + pronoun + verb (Té u ʻalu).
 *   2. Negation connector (Ch 9) — ʻikai te + pronoun (ʻOku ʻikai té u).
 *   3. Impersonal pronoun (Ch 51) — te / kita meaning "one" in general.
 *
 * Position and surrounding context disambiguate. Sentence-initial te is
 * the future TM; te right after ʻikai is the connector; te following
 * ke (subordinator) or other contexts is impersonal.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'future',  label: 'future TM',  detail: 'té + pronoun + verb (Lesson 2)' },
  { id: 'neg',     label: 'negation connector', detail: 'after ʻikai (Lesson 9)' },
  { id: 'impersonal', label: 'impersonal',  detail: '"one" in general (Lesson 51)' },
]

const PROMPTS = [
  { tongan: '___ u ʻalu.',                                           english: 'I will go.',                                         answer: 'future',     why: 'te at the start of the sentence + pronoun u + verb = future tense. The Lesson 2 pattern.' },
  { tongan: 'ʻOku ʻikai ___ u kai.',                                 english: 'I am not eating.',                                   answer: 'neg',        why: 'te right after ʻikai is the negation connector. ʻikai te + pronoun is the standard negative skeleton.' },
  { tongan: 'ʻOku ʻikai totonu ke ___ tokanga pē kiate kita.',       english: 'One should not attend only to oneself.',             answer: 'impersonal', why: 'te here is the impersonal pronoun "one": not the future TM and not the negation connector. Paired with kita (postposed "oneself").' },
  { tongan: '___ ke ako.',                                           english: 'You will study.',                                    answer: 'future',     why: 'Sentence-initial té + pronoun ke = future tense.' },
  { tongan: 'ʻE ʻikai ___ nau haʻu.',                                english: 'They will not come.',                                answer: 'neg',        why: 'te after ʻikai → negation connector. (The future-negative also embeds te here.)' },
  { tongan: 'ʻOkú te fie ʻalu ka ʻoku ʻikai ___ lava.',              english: 'One wants to go but one cannot.',                    answer: 'impersonal', why: 'Both te tokens here are the impersonal pronoun. Notice the overall meaning is general (about anyone), not future-specific.' },
  { tongan: '___ tau hiva.',                                         english: 'We will sing.',                                      answer: 'future',     why: 'Sentence-initial té + pronoun tau (we incl.) = future.' },
]

export default function TeDisambiguatorCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which job is te doing here?"
      promptLabel="Sentence"
    />
  )
}
