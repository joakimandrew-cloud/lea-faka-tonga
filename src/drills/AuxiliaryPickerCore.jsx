/**
 * AuxiliaryPickerCore — Ch 21.
 *
 * Three auxiliaries occupy three different slots: fie (want) sits
 * directly before the verb, lava ʻo (be able to) requires the linking
 * ʻo before the next verb, saiʻia (like) takes a he/ʻia phrase
 * naming what's liked.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'fie',   label: 'fie',     detail: 'want to (+ verb)' },
  { id: 'lava',  label: 'lava ʻo', detail: 'be able to (+ ʻo + verb)' },
  { id: 'saiia', label: 'saiʻia',  detail: 'like (+ he/ʻia + thing/person)' },
]

const PROMPTS = [
  { tongan: 'ʻOku ou ___ mohe.',                english: 'I want to sleep.',                          answer: 'fie',   why: 'fie sits between pronoun and verb. "want to + verb".' },
  { tongan: 'ʻOku ou ___ ʻo kakau.',            english: 'I can swim.',                               answer: 'lava',  why: 'lava ʻo + verb = be able to. The ʻo links lava to the action.' },
  { tongan: 'ʻOkú ke ___ he meʻakai?',          english: 'Do you like the food?',                     answer: 'saiia', why: 'saiʻia takes a he-phrase naming what is liked. With definite common nouns, ʻi drops before he, so just "saiʻia he".' },
  { tongan: 'ʻOku ou ___ ako lea faka-Tongá.',  english: 'I want to study Tongan.',                   answer: 'fie',   why: 'fie + verb (ako) — "want to study".' },
  { tongan: 'Té ke ___ ʻo haʻu ʻapongipongi?',  english: 'Will you be able to come tomorrow?',        answer: 'lava',  why: 'lava ʻo + verb in the future tense.' },
  { tongan: 'ʻOku ou ___ ʻia Seini.',           english: 'I like Seini.',                             answer: 'saiia', why: 'With proper names, saiʻia takes ʻia (the personal form of ʻi).' },
  { tongan: 'ʻOku mau ___ ʻalu ki kolo.',       english: 'We want to go to town.',                    answer: 'fie',   why: 'fie + verb → "want to go".' },
  { tongan: 'Naʻe ___ ʻa Sēmisi ʻo hiva lelei.', english: 'Sēmisi was able to sing well.',            answer: 'lava',  why: 'lava ʻo with a noun-subject construction (ʻa Sēmisi).' },
]

export default function AuxiliaryPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which auxiliary fills the blank?"
      promptLabel="Sentence"
    />
  )
}
