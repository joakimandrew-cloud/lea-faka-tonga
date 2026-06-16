/**
 * SinceAfterCore — Ch 42 time clauses.
 *
 * Two jobs in one picker:
 *   1. "since" vs "after" — talu (mei) opens a clause that has CONTINUED
 *      from a past point; hilí opens an event already FINISHED, with the
 *      main clause following on pea.
 *   2. The focus-marker rule after hilí: a definite common noun takes ʻa
 *      (hilí ʻa e fakatahá), but a pronoun/possessive does not
 *      (hilí ʻeku puké). talu never takes ʻa here — it links onto a
 *      possessive verbal noun.
 *
 * Every Tongan phrase is taken verbatim from book/Chapter-42.md
 * (talu L56-85; hilí L87-99, the ʻa rule at L99).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'talu',   label: 'talu (mei)', detail: 'since / ever since (action has continued)' },
  { id: 'hili',   label: 'hilí',       detail: 'after + pronoun/possessive (no ʻa)' },
  { id: 'hili_a', label: 'hilí ʻa',    detail: 'after + definite common noun (takes ʻa)' },
]

const PROMPTS = [
  {
    tongan: '___ ʻeku haʻú ʻoku teʻeki té u ongoʻi taʻelata.',
    english: 'Since I came, I have never felt homesick.',
    answer: 'talu',
    why: 'talu = "since": the clause describes something that has continued from the moment "I came" up to now. It links straight onto the possessive verbal noun ʻeku haʻú, with no ʻa.',
  },
  {
    tongan: '___ e fakatahá pea mau ō ʻo kai.',
    english: 'After the meeting we went and ate.',
    answer: 'hili_a',
    why: 'hilí = "after" a finished event, and fakataha is a definite common noun, so the focus marker ʻa appears: hilí ʻa e fakatahá. The main clause follows on pea.',
  },
  {
    tongan: '___ ʻeku puké peá u foki ʻo ngāue.',
    english: 'After my sickness I returned to work.',
    answer: 'hili',
    why: 'hilí = "after," but the object is the possessive ʻeku puké (my sickness), so NO ʻa is used: hilí ʻeku puké.',
  },
  {
    tongan: '___ ʻa e pekia ʻa Mosesé.',
    english: 'After the death of Moses.',
    answer: 'hili_a',
    why: 'pekia is a definite common noun here, so hilí takes the focus marker ʻa: hilí ʻa e pekia ʻa Mosesé.',
  },
  {
    tongan: '___ mei he taʻu kuo ʻosí ʻoku ou kei moʻui lelei pē.',
    english: 'Since last year I am still quite healthy.',
    answer: 'talu',
    why: 'talu mei + a noun phrase = "since": healthiness has continued from last year until now. "since," not "after," because the state is ongoing.',
  },
  {
    tongan: '___ hoʻo ʻalú mo e tangi ʻa Seini.',
    english: 'Ever since you went, Seini has cried.',
    answer: 'talu',
    why: 'talu = "ever since." When the talu clause comes first it is often followed by mo + a verbal noun naming the result (mo e tangi ʻa Seini). No ʻa after talu.',
  },
  {
    tongan: '___ ia, naʻe toki lea leva ʻa e faiakó.',
    english: 'After that, the teacher spoke immediately.',
    answer: 'hili',
    why: 'hilí ia = "after that." ia is a pronoun, not a definite common noun, so it takes no focus marker ʻa.',
  },
  {
    tongan: '___ ʻenau folaú mo ʻene hakō.',
    english: 'Ever since they sailed, it has been windy.',
    answer: 'talu',
    why: 'talu = "ever since," linking onto the possessive verbal noun ʻenau folaú, with the result introduced by mo. The wind has continued since the sailing.',
  },
]

export default function SinceAfterCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which opener fills the blank?"
      promptLabel="Time clause"
    />
  )
}
