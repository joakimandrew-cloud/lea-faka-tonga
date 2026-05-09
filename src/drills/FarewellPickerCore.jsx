/**
 * FarewellPickerCore — Ch 14.
 *
 * Tongan farewells split by who is leaving and who is staying. ʻAlu ā
 * to the one leaving, Nofo ā to the one staying, Mohe ā to someone
 * going to bed. Plus the dual / plural variants.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'alu',     label: 'ʻAlu ā!',    detail: 'said to the one leaving' },
  { id: 'nofo',    label: 'Nofo ā!',    detail: 'said to the one staying' },
  { id: 'mohe',    label: 'Mohe ā!',    detail: 'said to someone going to bed' },
  { id: 'mo-o',    label: 'Mo ō ā!',    detail: 'said to two people leaving' },
  { id: 'mou-o',   label: 'Mou ō ā!',   detail: 'said to a group leaving' },
  { id: 'mou-nofo',label: 'Mou nofo ā!', detail: 'said to a group staying' },
]

const PROMPTS = [
  { tongan: '___',  english: 'You are leaving. Say goodbye to the one staying behind.',                     answer: 'nofo',     why: 'Nofo ā = "stay well". Said TO the one staying when YOU are the one leaving.' },
  { tongan: '___',  english: 'A friend is heading out the door. Say goodbye to them.',                       answer: 'alu',      why: 'ʻAlu ā = "go well". Said TO the one leaving.' },
  { tongan: '___',  english: 'Your child is going to bed. Say goodnight.',                                   answer: 'mohe',     why: 'Mohe ā = "sleep well". Used for someone going to sleep.' },
  { tongan: '___',  english: 'Two friends are leaving together. Say goodbye to them.',                       answer: 'mo-o',     why: 'Mo ō ā = dual leaving. Mo (you-two) + ō (plural form of ʻalu) + ā (politeness softener).' },
  { tongan: '___',  english: 'A group of three or more is staying. You\u2019re leaving. Say goodbye.',       answer: 'mou-nofo', why: 'Mou nofo ā = plural staying. Mou (3+ "you") + nofo + ā.' },
  { tongan: '___',  english: 'A group of three or more is leaving. Say goodbye to them.',                    answer: 'mou-o',    why: 'Mou ō ā = plural leaving. Mou + ō (plural form of ʻalu) + ā.' },
  { tongan: '___',  english: 'You\u2019re heading out. Say goodbye to the friend staying.',                  answer: 'nofo',     why: 'Same logic as before — say to the STAYING person what to do (nofo = stay).' },
  { tongan: '___',  english: 'A guest is leaving your house. Say goodbye.',                                  answer: 'alu',      why: 'They\u2019re the one leaving → ʻalu ā.' },
]

export default function FarewellPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which farewell fits the situation?"
      promptLabel="Situation"
    />
  )
}
