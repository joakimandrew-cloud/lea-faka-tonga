/**
 * PronounObjectDropPickerCore — Ch 19.
 *
 * In transitive sentences, noun objects take ʻa: Naʻe ui ʻe Pita ʻa
 * Mele. But pronoun objects DROP ʻa: Naʻe ui ia ʻe Pita. The drill
 * teaches the binary: noun object keeps ʻa, pronoun object drops it.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'with-a', label: 'with ʻa',     detail: 'before a noun object' },
  { id: 'no-a',   label: '(no marker)', detail: 'before a pronoun object' },
]

const PROMPTS = [
  { tongan: 'Naʻe ui ʻe Pita ___ Mele.',           english: 'Pita called Mele.',           answer: 'with-a', why: 'Mele is a noun object (proper noun) → keep ʻa. Standard transitive pattern.' },
  { tongan: 'Naʻe ui ___ ia ʻe Pita.',             english: 'Pita called her.',         answer: 'no-a',   why: 'ia is a pronoun object → ʻa drops. Pronoun sits directly after the verb without ʻa.' },
  { tongan: 'Té u ʻave ___ kinautolu.',            english: 'I will take them.',              answer: 'no-a',   why: 'kinautolu is a postposed pronoun → ʻa drops.' },
  { tongan: 'Té u ʻave ___ Sēmisi.',               english: 'I will take Sēmisi.',               answer: 'with-a', why: 'Sēmisi is a name → keep ʻa.' },
  { tongan: 'ʻOkú ne manatuʻi lelei ___ koe.',     english: 'He remembers you well.',         answer: 'no-a',   why: 'koe is a pronoun → ʻa drops.' },
  { tongan: 'Naʻe ʻave ___ Pita ʻe Tēvita.',       english: 'Tēvita took Pita.',                 answer: 'with-a', why: 'Pita is a name (object) → keep ʻa.' },
  { tongan: 'Kuo ui ___ kinautolu ʻe Mele.',       english: 'Mele has called them.',          answer: 'no-a',   why: 'kinautolu is a pronoun → ʻa drops.' },
]

export default function PronounObjectDropPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="With ʻa or without?"
      promptLabel="Sentence"
    />
  )
}
