/**
 * VerbalNounConverterCore — Ch 45.
 *
 * The verbal-noun construction: a normal verb sentence like "Naʻá ne lau
 * ʻa e tohí" becomes a temporal/causal clause "ʻi heʻene lau ʻa e tohí"
 * (when/because he read the book). The preposed pronoun (ne) becomes an
 * 'e-class possessive (ʻene → heʻene) — the doer becomes the "owner" of
 * the verbal noun.
 *
 * The drill turns the original pronoun into the right possessive form and
 * tests the contraction rule: after ʻi he, only ʻeku, ʻene and ʻetau
 * contract to heʻeku / heʻene / heʻetau; hoʻo, ʻenau, ʻemau, hoʻomou stay
 * as separate words (he hoʻo, he ʻenau, …). Verified against
 * book/Chapter-45.md (5-pronoun table + Note L25; impersonal heʻene
 * L109-112) and spec/grammar-spec.md L6835-6844 (tau→heʻetau contracts,
 * mou→he hoʻomou does not). Picker mechanic.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'heeku',   label: 'heʻeku',    detail: 'my (I → ʻeku, contracts)' },
  { id: 'hoo',     label: 'he hoʻo',   detail: 'your sg. (you → hoʻo, no contraction)' },
  { id: 'heene',   label: 'heʻene',    detail: 'his/her (he/she → ʻene, contracts)' },
  { id: 'heetau',  label: 'heʻetau',   detail: 'our incl. (we → ʻetau, contracts)' },
  { id: 'henau',   label: 'he ʻenau',  detail: 'their (they → ʻenau, no contraction)' },
  { id: 'hemau',   label: 'he ʻemau',  detail: 'our excl. (we → ʻemau, no contraction)' },
  { id: 'homou',   label: 'he hoʻomou', detail: 'your pl. (you all → hoʻomou, no contraction)' },
]

const PROMPTS = [
  { tongan: 'Naʻá ne lau ʻa e tohí. → ʻi ___ lau ʻa e tohí',         english: 'when he read the book',            answer: 'heene',  why: 'Pronoun ne (he/she) → possessive ʻene → after ʻi he it contracts to heʻene. Pattern: ʻi heʻene + verb.' },
  { tongan: 'Naʻá ku tohi ʻa e tohí. → ʻi ___ tohi ʻa e tohí',       english: 'when I wrote the book',            answer: 'heeku',  why: 'Pronoun ku (I) → possessive ʻeku → contracts to heʻeku. ʻeku is one of the three forms that contract.' },
  { tongan: 'Naʻa nau kai ʻa e meʻakaí. → ʻi ___ kai ʻa e meʻakaí',  english: 'when they ate the food',           answer: 'henau',  why: 'Pronoun nau (they) → possessive ʻenau → no contraction; it stays as the two words he ʻenau.' },
  { tongan: 'Naʻá ke ngāue ʻi he ngoué. → ʻi ___ ngāue ʻi he ngoué', english: 'when you worked in the garden',     answer: 'hoo',    why: 'Pronoun ke (you sg.) → possessive hoʻo → no contraction; it stays as he hoʻo. Only ʻeku, ʻene and ʻetau contract.' },
  { tongan: 'Naʻa mau tā ʻa e falé. → ʻi ___ tā ʻa e falé',          english: 'when we (excl.) built the house',  answer: 'hemau',  why: 'Pronoun mau (we excl.) → possessive ʻemau → no contraction (stays as he ʻemau).' },
  { tongan: 'Naʻa tau fai ʻa e ngāué. → ʻi ___ fai ʻa e ngāué',      english: 'when we (incl.) did the work',     answer: 'heetau', why: 'Pronoun tau (we incl.) → possessive ʻetau → contracts to heʻetau, the third contracting form alongside heʻeku and heʻene.' },
  { tongan: 'Naʻa mou hiva. → ʻi ___ hiva',                          english: 'when you (all) sang',              answer: 'homou',  why: 'Pronoun mou (you pl.) → possessive hoʻomou → no contraction; it stays as he hoʻomou.' },
  { tongan: 'Naʻá ne tanu ʻa e ʻakaú. → ʻi ___ tanu ʻa e ʻakaú',     english: 'when he planted the tree',         answer: 'heene',  why: 'ne → ʻene → heʻene again, this time with the verb tanu (plant). The contraction is the same.' },
  { tongan: 'Naʻá ku ngāue. → ʻi ___ ngāue',                         english: 'when I worked',                    answer: 'heeku',  why: 'ku → ʻeku → heʻeku, here with an intransitive verb and no object. The possessive still contracts.' },
  { tongan: 'Naʻa tau ako. → ʻi ___ ako',                            english: 'when we (incl.) studied',          answer: 'heetau', why: 'tau → ʻetau → heʻetau. Watch this one: like ʻeku and ʻene, ʻetau contracts after ʻi he.' },
  { tongan: 'Naʻe ʻuha. → ʻi ___ ʻuha',                              english: 'when it rained',                   answer: 'heene',  why: 'Impersonal weather verbs have no real subject, but the verbal noun still takes a fixed heʻene ("its") — ʻi heʻene ʻuha (Ch 45).' },
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
