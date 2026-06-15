/**
 * ArticlePickerCore — Ch 8.
 *
 * Three slots compete: ha (indefinite), ʻa e (definite, anywhere except
 * after ʻi/ki/mei), he (definite, after ʻi/ki/mei). The drill forces the
 * student to read both meaning (definite or not?) and position (after
 * a preposition or not?).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ha',  label: 'ha',   detail: 'a / some (indefinite)' },
  { id: 'ae',  label: 'ʻa e', detail: 'the (no preceding ʻi/ki/mei)' },
  { id: 'he',  label: 'he',   detail: 'the (after ʻi/ki/mei)' },
]

const PROMPTS = [
  { tongan: 'ʻOku ou fiemaʻu ___ vai.',                english: 'I want some water.',                  answer: 'ha', why: 'Indefinite: any water at all → ha.' },
  { tongan: 'Naʻá ke kai ___ mā?',                     english: 'Did you eat the bread?',              answer: 'ae', why: 'Definite, no preposition before the article → focus marker ʻa + article e = ʻa e.' },
  { tongan: 'Té u ʻalu ki ___ fale.',                  english: 'I will go to the house.',             answer: 'he', why: 'After ki (and ʻi, mei), the definite article takes the form he: ki he fale.' },
  { tongan: 'ʻOkú ke fiemaʻu ___ ika?',                english: 'Do you want some fish?',              answer: 'ha', why: 'A question about an unspecified fish: indefinite → ha.' },
  { tongan: 'Naʻá ku nofo ʻi ___ fale kai.',           english: 'I stayed in the cafeteria.',          answer: 'he', why: 'After ʻi, definite uses he, not ʻa e. ʻi he fale kai.' },
  { tongan: 'ʻOku ou fiemaʻu ___ talo.',               english: 'I want the taro. (a specific amount)', answer: 'ae', why: 'Definite object, no preposition before the article → ʻa e.' },
  { tongan: 'Naʻa mau haʻu mei ___ kolo.',             english: 'We came from the town.',              answer: 'he', why: 'After mei, the definite article is he. mei he kolo.' },
  { tongan: 'Naʻá ku kai ___ talo.',                   english: 'I ate some taro.',                    answer: 'ha', why: 'Indefinite: some taro, not "the taro" → ha.' },
  { tongan: 'Tokoni ki ___ faiako.',                   english: 'Help the teacher.',                   answer: 'he', why: 'After ki, definite article is he → ki he faiako.' },
  { tongan: 'Naʻa mau fiemaʻu ___ kava.',              english: 'We wanted some kava.',                answer: 'ha', why: 'Indefinite: some kava → ha. (No specific bowl in mind.)' },
]

export default function ArticlePickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which article fills the blank?"
      promptLabel="Sentence"
    />
  )
}
