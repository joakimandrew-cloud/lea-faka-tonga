/**
 * CountTimeCore — Phase 3C/3D: count and tell the time.
 *
 * Recall the Tongan numeral 1-10 inside the frames that carry it: ʻe +
 * number for things (kato ʻe nima = five baskets), ʻe toko + number for
 * people (tamaiki ʻe toko tolu = three children), the price frame
 * (paʻanga ʻe ua = two dollars), and the clock frame (Ko e valu eni = it
 * is eight o'clock). The classifier itself (ʻe / toko / foʻi) is drilled
 * separately by classifier-extended-picker; here the blank is the NUMBER.
 *
 * Verified against book/Chapter-20.md: numerals 1-10 (L14-23), ʻe + number
 * (L80), ʻe toko + number for people (L121-126), price (L108), clock
 * "Ko e X eni" (L157-167), "ʻOku toko hiva pē" (L124, where hiva = nine).
 * The definitive pronunciation accent on the clock form (tolú/valú) is
 * left off — placing it is the accent-placement drill's job.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'taha',      label: 'taha',      detail: 'one (1)' },
  { id: 'ua',        label: 'ua',        detail: 'two (2)' },
  { id: 'tolu',      label: 'tolu',      detail: 'three (3)' },
  { id: 'fa',        label: 'fā',        detail: 'four (4)' },
  { id: 'nima',      label: 'nima',      detail: 'five (5)' },
  { id: 'ono',       label: 'ono',       detail: 'six (6)' },
  { id: 'fitu',      label: 'fitu',      detail: 'seven (7)' },
  { id: 'valu',      label: 'valu',      detail: 'eight (8)' },
  { id: 'hiva',      label: 'hiva',      detail: 'nine (9) — also "sing/song"' },
  { id: 'hongofulu', label: 'hongofulu', detail: 'ten (10)' },
]

const PROMPTS = [
  { tongan: 'kato ʻe ___',          english: 'five baskets',          answer: 'nima',      why: 'For things, the numeral attaches with ʻe: kato ʻe nima.' },
  { tongan: 'tamaiki ʻe toko ___',  english: 'three children',        answer: 'tolu',      why: 'For people, the counter is toko before the number: tamaiki ʻe toko tolu.' },
  { tongan: 'Ko e ___ eni.',        english: 'It is eight o’clock.', answer: 'valu',  why: 'The clock frame is Ko e + hour + eni: Ko e valu eni = "it is eight o’clock".' },
  { tongan: 'paʻanga ʻe ___',       english: 'two dollars',           answer: 'ua',        why: 'Prices use ʻe + number: paʻanga ʻe ua.' },
  { tongan: 'tohi ʻe ___',          english: 'ten books',             answer: 'hongofulu', why: 'Ten is hongofulu: tohi ʻe hongofulu.' },
  { tongan: 'paʻanga ʻe ___',       english: 'one dollar',            answer: 'taha',      why: 'One is taha: paʻanga ʻe taha.' },
  { tongan: 'kato ʻe ___',          english: 'six baskets',           answer: 'ono',       why: 'Six is ono: kato ʻe ono.' },
  { tongan: 'kakai ʻe toko ___',    english: 'four people',           answer: 'fa',        why: 'People take toko: kakai ʻe toko fā.' },
  { tongan: 'tohi ʻe ___',          english: 'seven books',           answer: 'fitu',      why: 'Seven is fitu: tohi ʻe fitu.' },
  { tongan: 'ʻOku toko ___ pē.',    english: 'There are only nine (people).', answer: 'hiva', why: 'Nine is hiva; after toko (people) it can only mean nine, not "sing": ʻOku toko hiva pē.' },
]

export default function CountTimeCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which number fills the blank?"
      promptLabel="Count / tell the time"
    />
  )
}
