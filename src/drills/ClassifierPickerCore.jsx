/**
 * ClassifierPickerCore — Ch 20.
 *
 * Tongan numerals attach differently depending on what's being counted.
 * For things, the particle ʻe sits between noun and number (kato ʻe ono
 * = six baskets). For people, toko replaces ʻe (toko hiva = nine
 * people). A third classifier foʻi singles out an individual item —
 * typically round or self-contained objects like fruit, eggs, stones.
 * (Ch 31 extends foʻi into existential and generic contexts; this
 * drill stays at the Ch 20 "one of a kind" level.)
 *
 * VALIDATOR_ALLOW: kau
 * (Ch 20 informally introduces kau as "group of people" in the toko
 * section — "The word kau (group) before a noun marks a group of
 * people: kau faiakó". The formal plural-marker treatment is Ch 25.)
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'e',    label: 'ʻe',    detail: 'for things, between noun and number (kato, tohi, vaka…)' },
  { id: 'toko', label: 'toko',  detail: 'for people' },
  { id: 'foi',  label: 'foʻi',  detail: 'singles out one individual item (fruit, egg, stone…)' },
]

const PROMPTS = [
  { tongan: 'ha kato ___ ono',            english: 'six baskets',                               answer: 'e',    why: 'Baskets are things → ʻe before the number.' },
  { tongan: 'Ko e tamaiki ʻe ___ tolu.',  english: 'Three children.',                           answer: 'toko', why: 'Children are people → toko before the number. After a noun, ʻe still comes first; it is only between toko and the number that ʻe never appears.' },
  { tongan: 'paʻanga ___ taha',           english: 'one dollar',                                answer: 'e',    why: 'Money — a thing → ʻe.' },
  { tongan: 'ha ___ moli',                english: 'a (single) orange',                         answer: 'foi',  why: 'foʻi singles out one individual fruit from the category.' },
  { tongan: 'ha tohi ___ tolu',           english: 'three books',                               answer: 'e',    why: 'Books are things → ʻe.' },
  { tongan: 'ha ___ moa',                 english: 'an egg (a single one)',                     answer: 'foi',  why: 'foʻi for a single self-contained item like an egg.' },
  { tongan: 'ʻOku ___ hiva pē.',          english: 'Only nine (people).',                       answer: 'toko', why: 'Counting people → toko. The clue: people are implied by the context.' },
  { tongan: 'ʻOku ___ fiha e kau akó?',   english: 'How many pupils are there?',                answer: 'toko', why: 'Pupils are people → toko fiha for "how many people".' },
  { tongan: 'ha ___ mā',                  english: 'a loaf of bread',                           answer: 'foi',  why: 'foʻi marks one complete unit — here, one loaf.' },
  { tongan: 'ha vaka ___ ua',             english: 'two boats',                                 answer: 'e',    why: 'Boats are things → ʻe.' },
  { tongan: 'ha hele ___ fā',             english: 'four knives',                               answer: 'e',    why: 'Knives are things → ʻe.' },
]

export default function ClassifierPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which classifier fills the blank?"
      promptLabel="Phrase"
    />
  )
}
