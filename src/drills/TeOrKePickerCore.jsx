/**
 * TeOrKePickerCore — Ch 9.
 *
 * Tongan negation splits the connector word by what follows. Use te
 * before a pronoun (ʻikai té u, ʻikai té ke, ʻikai té ne…). Use ke
 * before a verb with no pronoun (impersonals, weather, noun-subject
 * sentences). Pure syntactic rule.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'te', label: 'te', detail: 'before a pronoun' },
  { id: 'ke', label: 'ke', detail: 'before a verb (no pronoun)' },
]

const PROMPTS = [
  { tongan: 'ʻOku ʻikai ___ u fiefia.',         english: 'I am not happy.',                              answer: 'te', why: 'Pronoun u (I) follows → te. ʻikai té u + verb is the standard pronoun-subject negation.' },
  { tongan: 'Naʻe ʻikai ___ matangi.',          english: 'It was not windy.',                            answer: 'ke', why: 'matangi (windy) is a weather verb with no pronoun subject → ke.' },
  { tongan: 'ʻE ʻikai ___ ke ʻalu ki Tonga.',   english: 'You will not go to Tonga.',                    answer: 'te', why: 'Pronoun ke (you) follows → te. (Note: the second ke here is the pronoun, the first slot needs te.)' },
  { tongan: 'ʻOku ʻikai ___ momoko.',           english: 'It is not cold.',                              answer: 'ke', why: 'momoko (cold) is a weather verb with no pronoun subject → ke.' },
  { tongan: 'Naʻe ʻikai ___ nau fiefia.',       english: 'They were not happy.',                         answer: 'te', why: 'Pronoun nau (they) follows → te.' },
  { tongan: 'ʻE ʻikai ___ ʻuha ʻapō.',          english: 'It will not rain tonight.',                    answer: 'ke', why: 'ʻuha (to rain) — no pronoun subject → ke.' },
  { tongan: 'ʻOku ʻikai ___ ne hela.',          english: 'He is not tired.',                             answer: 'te', why: 'Pronoun ne (he/she) follows → te.' },
  { tongan: 'Naʻe ʻikai ___ ʻafua ʻaneafi.',    english: 'It was not fine yesterday.',                   answer: 'ke', why: 'ʻafua (fine weather) — no pronoun subject → ke.' },
]

export default function TeOrKePickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which connector fills the blank?"
      promptLabel="Sentence"
    />
  )
}
