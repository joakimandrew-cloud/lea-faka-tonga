/**
 * PeheePickerCore — Ch 34.
 *
 * Pehē wears two hats and pehe'i is a third related form:
 *   1. pehē as a VERB (to say, to think) — introduces reported speech.
 *   2. pehē as an ADVERB (thus, like this) — describes manner.
 *   3. pehe'i as a TRANSITIVE — to do/treat in this way (takes object).
 *
 * The drill asks the student to identify which job pehē is doing in
 * each sentence.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'verb',  label: 'pehē (verb)',     detail: 'to say / to think' },
  { id: 'adverb', label: 'pehē (adverb)',  detail: 'thus / like this' },
  { id: 'transitive', label: 'pehe\u2019i', detail: 'to do or treat in this way' },
]

const PROMPTS = [
  { tongan: 'Naʻe pehē ʻe Tēvita ʻe foki ʻa Mele.',         english: 'Tēvita said Mele would return.',                answer: 'verb',       why: 'pehē + ʻe + agent (ʻe Tēvita) + reported clause = the verb pattern. "X said that…".' },
  { tongan: 'Naʻe pehē pē mei he kamataʻangá.',              english: 'It was that way from the beginning.',           answer: 'adverb',     why: 'pehē after a TM with no agent phrase, plus the limiter pē = adverbial "thus / that way".' },
  { tongan: 'Tohi pehe\u2019i!',                              english: 'Write it like this!',                            answer: 'transitive', why: 'pehe\u2019i (with the -ʻi suffix) is the transitive form: to do / treat in this way. Used in commands and with direct objects.' },
  { tongan: 'ʻOua té ke pehe\u2019i ʻa e fefiné!',            english: 'Do not treat the woman that way!',              answer: 'transitive', why: 'pehe\u2019i + ʻa + object = transitive pattern.' },
  { tongan: 'ʻOku ou pehē ʻe ʻalu ʻa Sione.',                english: 'I think Sione will go.',                         answer: 'verb',       why: 'pehē after pronoun (ou) introducing a clause — the verb sense.' },
  { tongan: 'ʻOua té ke lea pehē.',                          english: 'Do not talk like that.',                         answer: 'adverb',     why: 'pehē after a verb (lea = speak) describes the manner — adverbial.' },
  { tongan: 'Tuku pehe\u2019i pē ia!',                        english: 'Leave it the way it is!',                        answer: 'transitive', why: 'pehe\u2019i + pronoun (ia) — transitive treatment.' },
]

export default function PeheePickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which form is pehē playing here?"
      promptLabel="Sentence"
    />
  )
}
