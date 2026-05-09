/**
 * VerbalNounConverterCore — Ch 45.
 *
 * The verbal-noun construction: a normal verb sentence like "Naʻá ne
 * lau ʻa e tohí" becomes a temporal/causal clause "ʻi heʻene lau ʻa
 * e tohí" (when/because he read the book). The preposed pronoun (ne)
 * becomes a possessive pronoun (heʻene) — the doer becomes the
 * "owner" of the verbal noun.
 *
 * The drill turns the original pronoun into the right possessive
 * form. Picker mechanic.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'heeku', label: 'heʻeku',   detail: 'my (after I → ku)' },
  { id: 'hoo',   label: 'he hoʻo',   detail: 'your (after you → ke)' },
  { id: 'heene', label: 'heʻene',   detail: 'his/her (after he/she → ne)' },
  { id: 'henau', label: 'he ʻenau', detail: 'their (after they → nau)' },
  { id: 'hemau', label: 'he ʻemau', detail: 'our excl. (after mau)' },
]

const PROMPTS = [
  { tongan: 'Naʻá ne lau ʻa e tohí. → ʻi ___ lau ʻa e tohí',                 english: 'when he read the book',                  answer: 'heene', why: 'Pronoun ne (he/she) → possessive ʻene → after ʻi he it contracts to heʻene. Pattern: ʻi heʻene + verb.' },
  { tongan: 'Naʻá ku tohi ʻa e tohí. → ʻi ___ tohi ʻa e tohí',                english: 'when I wrote the book',                   answer: 'heeku', why: 'Pronoun ku (I) → possessive ʻeku → contracts to heʻeku. The contraction happens with both ʻeku and ʻene.' },
  { tongan: 'Naʻa nau kai ʻa e meʻakaí. → ʻi ___ kai ʻa e meʻakaí',          english: 'when they ate the food',                  answer: 'henau', why: 'Pronoun nau (they) → possessive ʻenau → no contraction (stays as he ʻenau). Only ʻeku and ʻene contract with ʻi he.' },
  { tongan: 'Naʻá ke ngāue ʻi he ngoué. → ʻi ___ ngāue ʻi he ngoué',          english: 'when you worked in the garden',           answer: 'hoo',   why: 'Pronoun ke (you sg.) → possessive hoʻo → no contraction (stays as he hoʻo). Only ʻeku and ʻene contract with ʻi he.' },
  { tongan: 'Naʻa mau tā ʻa e falé. → ʻi ___ tā ʻa e falé',                  english: 'when we (excl.) built the house',         answer: 'hemau', why: 'Pronoun mau (we excl.) → possessive ʻemau → no contraction (stays as he ʻemau).' },
  { tongan: 'Naʻá ne hiva ʻi he fale lotú. → ʻi ___ hiva ʻi he fale lotú',    english: 'when he sang in the church',              answer: 'heene', why: 'Same pattern as the first prompt — ne → heʻene.' },
  { tongan: 'Naʻá ku ofo ʻi he ngāué. → ʻi ___ ofo ʻi he ngāué',              english: 'when I was surprised at the work',         answer: 'heeku', why: 'ku → heʻeku. The contraction is the standard form for first-person.' },
]

export default function VerbalNounConverterCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which possessive form fills the blank?"
      promptLabel="Convert to verbal noun"
    />
  )
}
