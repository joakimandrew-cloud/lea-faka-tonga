/**
 * ThereIsHaveCore — "there is / I have" and its negative.
 *
 * Tongan has no verb "to be" or "to have". Existence and possession both
 * use ʻi ai ("there is"): existence takes ʻi ai + an indefinite noun
 * (ha + noun), possession takes ʻi ai + an indefinite possessive (haʻaku,
 * hao …). The NEGATIVE is the SAME for both meanings: the full existential
 * negative ʻikai ke ʻi ai. So "there is no one" is ʻOku ʻikai ke ʻi ai ha
 * taha and "I do not have a book" is ʻOku ʻikai ke ʻi ai haʻaku tohi. In
 * casual speech this is often shortened to just ʻoku ʻikai, and that short
 * form is also correct; but the course teaches and drills the full form, so
 * this drill always expects (and never marks wrong) the full ke ʻi ai opener.
 *
 * Sources: Churchward Ch.9 §5 (ʻOku ʻikai ha faiako, the short form as the
 * rule) and §9b (ʻOku ʻikai ke ʻi ai ha faiako, the full form); Shumway L94
 * note 2 ("the two negative forms, meaning the same thing, occur equally as
 * often", on a possessive example). Owner ruling: DECISIONS.md 2026-06-15.
 * The drill tests the opener (tense + positive/negative); the possessive or
 * noun is pre-filled so the focus is the construction.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'oku-iai',  label: 'ʻOku ʻi ai',  detail: 'there is / have: present' },
  { id: 'nae-iai',  label: 'Naʻe ʻi ai',  detail: 'there was / had: past' },
  { id: 'e-iai',    label: 'ʻE ʻi ai',    detail: 'there will be: future' },
  { id: 'oku-ikai-ke-iai', label: 'ʻOku ʻikai ke ʻi ai', detail: 'there is no / have no: present' },
  { id: 'nae-ikai-ke-iai', label: 'Naʻe ʻikai ke ʻi ai', detail: 'there was no / had no: past' },
  { id: 'e-ikai-ke-iai',   label: 'ʻE ʻikai ke ʻi ai',   detail: 'there will be no: future' },
]

const PROMPTS = [
  { tongan: '___ haʻaku tohi.',        english: 'I have a book.',              answer: 'oku-iai',  why: 'Possession = ʻi ai + an indefinite possessive (haʻaku = "a … of mine"). Present tense ʻOku.' },
  { tongan: '___ haʻaku tohi.',        english: 'I do not have a book.',       answer: 'oku-ikai-ke-iai', why: 'The negative is the full ʻOku ʻikai ke ʻi ai, the same for both "have" and "there is". In casual speech you may hear it shortened to ʻoku ʻikai, but the course drills the full form.' },
  { tongan: '___ haʻaku hele.',        english: 'I had a knife.',              answer: 'nae-iai',  why: 'Past: Naʻe ʻi ai (Naʻe, because the next word ʻi is not a pronoun).' },
  { tongan: '___ ha tōketā ʻi ʻapi.',  english: 'There is a doctor at home.',  answer: 'oku-iai',  why: 'Existence uses the same ʻi ai, now with an indefinite noun (ha + noun).' },
  { tongan: '___ ha kātoanga.',        english: 'There was a celebration.',    answer: 'nae-iai',  why: 'Existential in the past: Naʻe ʻi ai ha kātoanga.' },
  { tongan: '___ haku fale.',          english: 'I do not have a house.',      answer: 'oku-ikai-ke-iai', why: 'Same full negative for possession: ʻOku ʻikai ke ʻi ai + the indefinite possessive haku.' },
  { tongan: '___ hao fale?',           english: 'Do you have a house?',        answer: 'oku-iai',  why: 'A yes/no question keeps ʻi ai: ʻOku ʻi ai hao fale?' },
  { tongan: '___ ha fakataha ʻapongipongi.', english: 'There will be a meeting tomorrow.', answer: 'e-iai', why: 'Future: ʻE ʻi ai (ʻE before the non-pronoun ʻi).' },
  { tongan: '___ ha meʻakai ʻi fale.',  english: 'There is no food in the house.', answer: 'oku-ikai-ke-iai', why: 'Negative existential, present: ʻOku ʻikai ke ʻi ai ha meʻakai ʻi fale.' },
  { tongan: '___ ha vaka.',            english: 'There was no boat.',          answer: 'nae-ikai-ke-iai', why: 'Negative existential, past: Naʻe ʻikai ke ʻi ai ha vaka.' },
  { tongan: '___ ha tangata ʻi heni.', english: 'There will be no one here.',  answer: 'e-ikai-ke-iai', why: 'Negative existential, future: ʻE ʻikai ke ʻi ai ha tangata ʻi heni.' },
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
