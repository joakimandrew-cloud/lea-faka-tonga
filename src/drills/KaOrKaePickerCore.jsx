/**
 * KaOrKaePickerCore — Ch 24.
 *
 * Tongan splits "but" by the next word's class. Use ka before a tense
 * marker, pronoun, or preposition. Use kae before a verb, adjective, or
 * adverb. The drill is purely syntactic — once the rule clicks the
 * student's pause goes away.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ka',  label: 'ka',  detail: 'before TM / pronoun / preposition' },
  { id: 'kae', label: 'kae', detail: 'before verb / adjective / adverb' },
]

const PROMPTS = [
  { tongan: 'ʻOku ou saiʻia he hivá, ___ ʻoku ʻikai té u saiʻia he ngāué.', english: 'I like singing, but I don\u2019t like working.',   answer: 'ka',  why: 'Next word is ʻoku: a tense marker. Tense markers take ka.' },
  { tongan: 'Naʻe ʻalu ʻa Sione ___ nofo ʻa Mele.',                          english: 'Sione went but Mele stayed.',                   answer: 'kae', why: 'Next word is nofo: a verb. Verbs take kae.' },
  { tongan: 'ʻAlu koe, ___ ke foki mai he fā.',                              english: 'Go, but come back at four.',                    answer: 'ka',  why: 'Next word is ke: a pronoun. Pronouns take ka.' },
  { tongan: 'Naʻe haʻu ʻa Pita ___ puke ʻa Tēvita.',                         english: 'Pita came but Tēvita was sick.',                answer: 'kae', why: 'Next word is puke: an adjective/stative. Adjectives take kae.' },
  { tongan: 'Naʻe hiva ʻa Sēmisi ___ fanongo ʻa Ana.',                       english: 'Sēmisi sang while Ana listened.',               answer: 'kae', why: 'Next word is fanongo: a verb. Verbs take kae. (Here kae also reads as "while".)' },
  { tongan: 'ʻOku ou fie mohe, ___ kuo pau ke u ngāue.',                     english: 'I want to sleep, but I have to work.',          answer: 'ka',  why: 'Next word is kuo: a tense marker. Tense markers take ka.' },
  { tongan: 'Naʻe lele ʻa e tamasiʻí ___ tangi ʻa e taʻahiné.',              english: 'The boy ran but the girl cried.',               answer: 'kae', why: 'Next word is tangi: a verb. Verbs take kae.' },
  { tongan: 'Naʻe ako ʻa Lupe, ___ naʻa nau ʻalu.',                          english: 'Lupe studied, but they went.',                  answer: 'ka',  why: 'Next word is naʻa: a tense marker. Tense markers take ka.' },
]

export default function KaOrKaePickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question={'Which form of "but" fills the blank?'}
      promptLabel="Sentence"
    />
  )
}
