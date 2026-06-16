/**
 * ClassifierExtendedPickerCore — Ch 31.
 *
 * Extends Ch 20's foʻi into Ch 31's existential (ʻoku ʻi ai ha …) and
 * generic patterns: foʻi singles out one self-contained item even inside
 * the "there is/are" frame, and contrasts a single unit with the bare
 * noun (ha foʻi lea vs ha lea). ʻe (general counted things) and toko
 * (people) stay live as distractors so the picker isn't trivially foʻi.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'e',    label: 'ʻe',    detail: 'general things (counted)' },
  { id: 'toko', label: 'toko',  detail: 'people' },
  { id: 'foi',  label: 'foʻi',  detail: 'a single round/complete item' },
]

const PROMPTS = [
  { tongan: 'ʻOku ʻi ai ha ___ moli ʻi fale?',      english: 'Is there an orange in the house?',  answer: 'foi',  why: 'Inside the existential ʻoku ʻi ai ha …, foʻi still singles out one self-contained fruit.' },
  { tongan: 'ha kato ___ ono',                       english: 'six baskets',                       answer: 'e',    why: 'Counting general things → ʻe before the number.' },
  { tongan: 'ʻOku ʻi ai ha ___ siaine ʻi he kato?', english: 'Is there a banana in the basket?',  answer: 'foi',  why: 'foʻi marks one individual banana even within the "there is" frame.' },
  { tongan: 'Ko e tamaiki ʻe ___ tolu.',            english: 'Three children.',                   answer: 'toko', why: 'Counting people → toko. After a noun, ʻe still precedes toko; ʻe only disappears between toko and the number.' },
  { tongan: 'ʻOku ʻi ai ha ___ mango ʻi he kato?',  english: 'Is there a mango in the basket?',   answer: 'foi',  why: 'foʻi singles out one mango inside the existential ʻoku ʻi ai ha … pattern.' },
  { tongan: 'ha tohi ___ tolu',                      english: 'three books',                       answer: 'e',    why: 'Counting things → ʻe.' },
  { tongan: 'ha ___ lea',                            english: 'a single word',                     answer: 'foi',  why: 'ha foʻi lea is one specific word; bare ha lea could mean a word, a statement, or a language.' },
  { tongan: 'ha ___ meʻa',                           english: 'one (single) thing',                answer: 'foi',  why: 'foʻi singles out one item from a larger category: ha foʻi meʻa is one (single) thing.' },
  { tongan: 'ʻOku ___ hiva pē.',                    english: 'Only nine (people).',               answer: 'toko', why: 'Counting people → toko.' },
]

export default function ClassifierExtendedPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which classifier fills the blank?"
      promptLabel="Phrase"
    />
  )
}
