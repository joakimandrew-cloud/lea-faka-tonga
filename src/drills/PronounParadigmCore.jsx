/**
 * PronounParadigmCore — Phase 3B: recall the preposed pronoun by its cell.
 *
 * Cycles every cell of the preposed (subject) pronoun paradigm — singular,
 * dual, plural, with the inclusive/exclusive split — plus the tense-
 * conditioned first-person singular (ku past / ou present / u perfect &
 * future). The prompt names the cell in English; the learner picks the
 * Tongan form. Verified against book/Chapter-02.md (complete table L252-257,
 * 1sg forms L254, accent note L279-282).
 *
 * (A future enhancement could weight missed cells more heavily — a light
 * SRS; for now the deck reshuffles uniformly, like the other pickers.)
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'u',   label: 'u',   detail: 'I — after kuo / te (perfect, future)' },
  { id: 'ku',  label: 'ku',  detail: 'I — after naʻa (past)' },
  { id: 'ou',  label: 'ou',  detail: 'I — after ʻoku (present)' },
  { id: 'ke',  label: 'ke',  detail: 'you (one person)' },
  { id: 'ne',  label: 'ne',  detail: 'he / she / it' },
  { id: 'ta',  label: 'ta',  detail: 'we two — including you' },
  { id: 'ma',  label: 'ma',  detail: 'we two — not you' },
  { id: 'mo',  label: 'mo',  detail: 'you two' },
  { id: 'na',  label: 'na',  detail: 'they two' },
  { id: 'tau', label: 'tau', detail: 'we (3+) — including you' },
  { id: 'mau', label: 'mau', detail: 'we (3+) — not you' },
  { id: 'mou', label: 'mou', detail: 'you (3+)' },
  { id: 'nau', label: 'nau', detail: 'they (3+)' },
]

const PROMPTS = [
  { tongan: 'Naʻa ___ kai.',  english: 'I ate (past).',                    answer: 'ku',  why: 'First person singular after the PAST marker naʻa is ku: Naʻá ku kai.' },
  { tongan: 'ʻOku ___ kai.',  english: 'I eat (present).',                 answer: 'ou',  why: 'First person singular after the PRESENT marker ʻoku is ou: ʻOku ou kai.' },
  { tongan: 'Kuo ___ kai.',   english: 'I have eaten (perfect).',          answer: 'u',   why: 'First person singular after kuo (and after te) is the bare u: Kuó u kai.' },
  { tongan: 'Naʻa ___ kai.',  english: 'You (one person) ate.',           answer: 'ke',  why: 'Second person singular is ke.' },
  { tongan: 'Naʻa ___ kai.',  english: 'He / she ate.',                    answer: 'ne',  why: 'ne covers he, she and it — Tongan does not mark gender.' },
  { tongan: 'Naʻa ___ kai.',  english: 'We two ate — including you.',      answer: 'ta',  why: 'Dual inclusive (you and I, just the two of us) is ta.' },
  { tongan: 'Naʻa ___ kai.',  english: 'We two ate — not you.',            answer: 'ma',  why: 'Dual exclusive (someone and I, but not you) is ma.' },
  { tongan: 'Naʻa ___ kai.',  english: 'You two ate.',                      answer: 'mo',  why: 'Dual "you two" is mo.' },
  { tongan: 'Naʻa ___ kai.',  english: 'They two ate.',                     answer: 'na',  why: 'Dual "they two" is na.' },
  { tongan: 'Naʻa ___ kai.',  english: 'We (3+) ate — including you.',     answer: 'tau', why: 'Plural inclusive (all of us, you included) is tau.' },
  { tongan: 'Naʻa ___ kai.',  english: 'We (3+) ate — not you.',           answer: 'mau', why: 'Plural exclusive (us, but not you) is mau.' },
  { tongan: 'Naʻa ___ kai.',  english: 'You all (3+) ate.',                answer: 'mou', why: 'Plural "you all" is mou.' },
  { tongan: 'Naʻa ___ kai.',  english: 'They (3+) ate.',                    answer: 'nau', why: 'Plural "they" (three or more) is nau.' },
]

export default function PronounParadigmCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which pronoun fills the blank?"
      promptLabel="Name the pronoun"
    />
  )
}
