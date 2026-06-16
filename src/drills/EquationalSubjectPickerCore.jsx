/**
 * EquationalSubjectPickerCore — Ch 16.
 *
 * In equational sentences, the focus marker ʻa appears before a proper
 * noun subject (Mafi) and DROPS before a postposed pronoun (au, koe, ia).
 * The drill tests this binary distinction.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'with-a', label: 'with ʻa' },
  { id: 'no-a',   label: '(no marker)' },
]

const PROMPTS = [
  { tongan: 'Ko e tangata ngāue ___ Mafi.',         english: 'Mafi is a worker.',                       answer: 'with-a', why: 'Mafi is a proper noun → use ʻa before it. Pattern: ko e + predicate + ʻa + name.' },
  { tongan: 'Ko e tangata ngāue ___ au.',           english: 'I am a worker.',                          answer: 'no-a',   why: 'au is a postposed pronoun → ʻa drops. Pattern: ko e + predicate + pronoun (no ʻa).' },
  { tongan: 'Ko e taʻahine mālohi ___ Seini.',      english: 'Seini is a strong girl.',                 answer: 'with-a', why: 'Seini is a proper noun → ʻa appears.' },
  { tongan: 'Ko e tōketā ___ koe?',                 english: 'Are you a doctor?',                       answer: 'no-a',   why: 'koe is a postposed pronoun → ʻa drops.' },
  { tongan: 'Ko e tamasiʻi fiefia ___ Lātū.',       english: 'Lātū is a happy boy.',                    answer: 'with-a', why: 'Lātū is a proper noun → ʻa appears.' },
  { tongan: 'Ko e taʻahine mālohi ___ ia.',         english: 'She is a strong girl.',                   answer: 'no-a',   why: 'ia is a postposed pronoun → ʻa drops.' },
  { tongan: 'Ko fē ___ Sione?',                     english: 'Where is Sione?',                         answer: 'with-a', why: 'Sione is a proper noun → ʻa appears, even with ko fē.' },
  { tongan: 'Ko e tangata fāma ___ au.',            english: 'I am a farmer.',                          answer: 'no-a',   why: 'au pronoun → no ʻa.' },
]

export default function EquationalSubjectPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="With ʻa or without?"
      promptLabel="Equational"
    />
  )
}
