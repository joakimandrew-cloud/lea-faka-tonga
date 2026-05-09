/**
 * ClassifierExtendedPickerCore — Ch 31.
 *
 * Builds on Ch 20's ʻe / toko split by adding foʻi for round, single,
 * complete objects. Now three classifiers compete: ʻe (general
 * things), toko (people), foʻi (single round/complete items, also
 * abstract "one X").
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'e',    label: 'ʻe',    detail: 'general things (counted)' },
  { id: 'toko', label: 'toko',  detail: 'people' },
  { id: 'foi',  label: 'foʻi',  detail: 'a single round/complete item' },
]

const PROMPTS = [
  { tongan: 'ha ___ niu',                  english: 'a single coconut (the fruit)',         answer: 'foi',  why: 'foʻi singles out one self-contained item — especially round things like fruit, eggs, stones.' },
  { tongan: 'ha kato ___ ono',             english: 'six baskets',                          answer: 'e',    why: 'Counting general things → ʻe before the number.' },
  { tongan: 'Ko e tamaiki ___ tolu.',      english: 'Three children.',                      answer: 'toko', why: 'Counting people → toko.' },
  { tongan: 'ha ___ moa',                  english: 'an egg',                               answer: 'foi',  why: 'foʻi for a single round item.' },
  { tongan: 'ha ___ maka',                 english: 'a stone (a single one)',               answer: 'foi',  why: 'foʻi singles out one stone.' },
  { tongan: 'ha tohi ___ tolu',            english: 'three books',                          answer: 'e',    why: 'Counting things → ʻe.' },
  { tongan: 'ha ___ moli',                 english: 'an orange (one piece of fruit)',       answer: 'foi',  why: 'foʻi for a single piece of fruit.' },
  { tongan: 'ʻOku ___ hiva pē.',           english: 'Only nine (people).',                  answer: 'toko', why: 'Counting people → toko.' },
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
