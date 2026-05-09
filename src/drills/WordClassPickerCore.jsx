/**
 * WordClassPickerCore — Ch 41.
 *
 * Tongan words shift role by position. The drill shows a word in a
 * specific sentence and asks the student to identify what role it's
 * playing — noun, verb, adjective, or adverb. Same word can be all
 * four in different sentences.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'noun', label: 'noun',      detail: 'a person, place, thing, or concept' },
  { id: 'verb', label: 'verb',      detail: 'an action or state (with TM)' },
  { id: 'adj',  label: 'adjective', detail: 'describing the noun next to it' },
  { id: 'adv',  label: 'adverb',    detail: 'describing how/when/where the verb happens' },
]

const PROMPTS = [
  { tongan: 'Naʻe ʻuha lahi ʻanepō. (focus on ʻuha)',           english: 'It rained hard last night.',                 answer: 'verb', why: 'ʻuha takes a tense marker (Naʻe) → it is acting as a verb meaning "to rain". Without the TM, it would be the noun "rain".' },
  { tongan: 'Naʻa mau lau ha tohi. (focus on tohi)',            english: 'We read a book.',                            answer: 'noun', why: 'tohi here is introduced by ha (an article) → it is a noun ("book"). As a verb, tohi means "to write".' },
  { tongan: 'ʻOku nau nofo matatahi. (focus on matatahi)',      english: 'They live on the coast.',                    answer: 'adv',  why: 'matatahi (coast) sits directly after the verb nofo, modifying it (where they live) → adverbial use.' },
  { tongan: 'Ha tangata tau. (focus on tau)',                    english: 'A fighting man / a soldier.',                answer: 'adj',  why: 'tau (to fight) sits after the noun tangata, describing it → adjectival use.' },
  { tongan: 'Ha ʻā maka. (focus on maka)',                       english: 'A stone fence.',                             answer: 'adj',  why: 'maka (stone) sits after the noun ʻā (fence), specifying material → adjectival use.' },
  { tongan: 'Ha pō māhina. (focus on māhina)',                   english: 'A moonlight night.',                         answer: 'adj',  why: 'māhina (moon) sits after pō (night), describing the kind of night → adjectival.' },
  { tongan: 'ʻOku lāʻā he ʻahó ni. (focus on lāʻā)',             english: 'It is sunny today.',                         answer: 'verb', why: 'lāʻā (sun) takes a tense marker → it is acting as a verb meaning "to be sunny".' },
  { tongan: 'Ha hiva lelei. (focus on hiva)',                    english: 'A good song.',                               answer: 'noun', why: 'hiva (sing/song) is introduced by ha → noun ("song"). The same word, with a TM, would be the verb "sing".' },
]

export default function WordClassPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="What role is the highlighted word playing?"
      promptLabel="Sentence"
    />
  )
}
