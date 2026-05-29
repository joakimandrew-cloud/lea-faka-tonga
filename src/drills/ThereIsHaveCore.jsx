/**
 * ThereIsHaveCore — Phase 3C: "there is / I have" and its negative.
 *
 * Tongan has no verb "to be" or "to have". Existence and possession both
 * use ʻi ai ("there is"): existence takes ʻi ai + an indefinite noun
 * (ha + noun), possession takes ʻi ai + an indefinite possessive (haʻaku,
 * hao …). The negative DROPS ʻi ai — it is just ʻikai + the indefinite.
 * The drill tests the opener (tense + positive/negative); the possessive
 * is pre-filled so the focus is the construction, not the noun class.
 *
 * Verified against book/Chapter-29.md (ʻi ai haʻo/hao L139; the answer
 * keeps a definite hoku L143; negative ʻOku ʻikai haʻaku, ʻi ai dropped,
 * L119) and the Ch31 existential frame.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'oku-iai',  label: 'ʻOku ʻi ai',  detail: 'there is / have — present' },
  { id: 'nae-iai',  label: 'Naʻe ʻi ai',  detail: 'there was / had — past' },
  { id: 'e-iai',    label: 'ʻE ʻi ai',    detail: 'there will be — future' },
  { id: 'oku-ikai', label: 'ʻOku ʻikai',  detail: 'negative — ʻi ai drops away' },
]

const PROMPTS = [
  { tongan: '___ haʻaku tohi.',        english: 'I have a book.',              answer: 'oku-iai',  why: 'Possession = ʻi ai + an indefinite possessive (haʻaku = "a … of mine"). Present tense ʻOku.' },
  { tongan: '___ haʻaku tohi.',        english: 'I do not have a book.',       answer: 'oku-ikai', why: 'The negative drops ʻi ai entirely: ʻOku ʻikai + the indefinite possessive.' },
  { tongan: '___ haʻaku hele.',        english: 'I had a knife.',              answer: 'nae-iai',  why: 'Past: Naʻe ʻi ai (Naʻe, because the next word ʻi is not a pronoun).' },
  { tongan: '___ ha tōketā ʻi ʻapi.',  english: 'There is a doctor at home.',  answer: 'oku-iai',  why: 'Existence uses the same ʻi ai, now with an indefinite noun (ha + noun).' },
  { tongan: '___ ha kātoanga.',        english: 'There was a celebration.',    answer: 'nae-iai',  why: 'Existential in the past: Naʻe ʻi ai ha kātoanga.' },
  { tongan: '___ haku fale.',          english: 'I do not have a house.',      answer: 'oku-ikai', why: 'Negative have: ʻOku ʻikai (no ʻi ai) + the indefinite possessive haku.' },
  { tongan: '___ hao fale?',           english: 'Do you have a house?',        answer: 'oku-iai',  why: 'A yes/no question keeps ʻi ai: ʻOku ʻi ai hao fale? (Ch 29).' },
  { tongan: '___ ha fakataha ʻapongipongi.', english: 'There will be a meeting tomorrow.', answer: 'e-iai', why: 'Future: ʻE ʻi ai (ʻE before the non-pronoun ʻi).' },
]

export default function ThereIsHaveCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="How does the sentence begin?"
      promptLabel="There is / I have"
    />
  )
}
