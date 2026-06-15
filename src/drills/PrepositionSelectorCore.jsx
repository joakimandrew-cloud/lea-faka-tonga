/**
 * PrepositionSelectorCore — Ch 7.
 *
 * Tongan prepositions ʻi / ki / mei change form based on what kind of
 * noun follows: bare before a place (local noun), -a before a person's
 * name, -ate before a pronoun. The drill asks the student to read both
 * the meaning (which preposition?) and the noun class (which form?).
 *
 * VALIDATOR_ALLOW: Naʻe
 * (Ch 7 introduces Naʻe in the impersonal-verb prompt "Naʻe ngalo ʻiate
 * au"; the formal Naʻe rule is Ch 9, but Ch 7 prose itself shows it for
 * verbs like ngalo and mahino that have no pronoun subject.)
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'i',     label: 'ʻi',     detail: 'at/in + place' },
  { id: 'ki',    label: 'ki',     detail: 'to + place' },
  { id: 'mei',   label: 'mei',    detail: 'from + place' },
  { id: 'ia',    label: 'ʻia',    detail: 'at + person' },
  { id: 'kia',   label: 'kia',    detail: 'to + person' },
  { id: 'meia',  label: 'meia',   detail: 'from + person' },
  { id: 'iate',  label: 'ʻiate',  detail: 'at + pronoun' },
  { id: 'kiate', label: 'kiate',  detail: 'to + pronoun' },
  { id: 'meiate',label: 'meiate', detail: 'from + pronoun' },
]

const PROMPTS = [
  { tongan: 'Naʻá ku ʻalu ___ Vavaʻu.',          english: 'I went to Vavaʻu.',                  answer: 'ki',     why: 'Vavaʻu is a place name (local noun) → bare ki.' },
  { tongan: 'Naʻá ne haʻu ___ Fisi.',            english: 'She came from Fiji.',                answer: 'mei',    why: 'Fiji is a place name → bare mei. (Pronoun subject ne, since noun-subject construction is Ch 15.)' },
  { tongan: 'ʻOku ou nofo ___ Tonga.',           english: 'I live in Tonga.',                   answer: 'i',      why: 'Tonga is a place → bare ʻi (location).' },
  { tongan: 'Naʻá ku lea ___ Sione.',            english: 'I spoke to Sione.',                  answer: 'kia',    why: 'Sione is a person\u2019s name (personal noun) → ki takes -a → kia.' },
  { tongan: 'Naʻá ne sio ___ Lupe.',             english: 'She saw Lupe.',                      answer: 'kia',    why: 'sio takes ki for its target. Lupe is a name → kia. Tongan says "look TO Lupe". (Naʻa before pronoun ne: Naʻe is for noun subjects only.)' },
  { tongan: 'Naʻá ne haʻu ___ Tēvita.',          english: 'He came from Tēvita.',               answer: 'meia',   why: 'Tēvita is a name → mei takes -a → meia.' },
  { tongan: 'Naʻá ku tokoni ___ ia.',            english: 'I helped him.',                      answer: 'kiate',  why: 'ia is a postposed pronoun → ki takes -ate → kiate.' },
  { tongan: 'ʻOku mahino ___ au.',               english: 'I understand. (Lit. is clear to me)', answer: 'kiate', why: 'mahino takes ki for the experiencer. au is a pronoun → kiate.' },
  { tongan: 'Naʻe ngalo ___ au.',                english: 'I forgot. (Lit. was forgotten in me)', answer: 'iate', why: 'ngalo takes ʻi for the experiencer. au is a pronoun → ʻi takes -ate → ʻiate.' },
  { tongan: 'ʻOku ou ʻofa lahi ___ koe.',        english: 'I love you very much.',              answer: 'iate',   why: 'ʻofa takes ʻi. koe is a pronoun → ʻiate.' },
  { tongan: 'Naʻá ne haʻu ___ kimautolu.',       english: 'He came from us.',                   answer: 'meiate', why: 'kimautolu is a pronoun → mei takes -ate → meiate.' },
  { tongan: 'Naʻá ku mohe ___ fale mohe.',       english: 'I slept in the dormitory.',          answer: 'i',      why: 'fale mohe behaves as a familiar local noun → bare ʻi.' },
]

export default function PrepositionSelectorCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which preposition form fills the blank?"
      promptLabel="Sentence"
    />
  )
}
