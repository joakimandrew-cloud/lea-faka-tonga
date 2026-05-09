/**
 * AudiencePickerCore — Ch 5.
 *
 * Tongan commands take a different form depending on audience size.
 * One person: bare verb. Two people: mo + verb. Three or more: mou + verb.
 * The drill makes the student commit to the audience marker before
 * speaking.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'bare', label: '(no marker)', detail: '1 person' },
  { id: 'mo',   label: 'Mo',          detail: '2 people' },
  { id: 'mou',  label: 'Mou',         detail: '3 or more' },
]

const PROMPTS = [
  { tongan: '___ kai!',   english: 'Eat! (one person)',                 answer: 'bare', why: 'Singular command — bare verb, no audience marker. Result: Kai!' },
  { tongan: '___ hiva!',  english: 'Sing! (a group of three or more)',  answer: 'mou',  why: 'Mou before the verb tells a group of three or more. Result: Mou hiva!' },
  { tongan: '___ nofo!',  english: 'Stay! (you two)',                    answer: 'mo',   why: 'Mo before the verb addresses exactly two people (the dual command). Result: Mo nofo!' },
  { tongan: '___ mohe!',  english: 'Sleep! (one person)',                answer: 'bare', why: 'Bare verb does all the work for a singular command.' },
  { tongan: '___ inu!',   english: 'Drink! (a group of three or more)',  answer: 'mou',  why: 'Mou + verb for groups of three or more.' },
  { tongan: '___ lele!',  english: 'Run! (you two)',                     answer: 'mo',   why: 'Two people: dual command with mo.' },
  { tongan: '___ ako!',   english: 'Study! (you two)',                   answer: 'mo',   why: 'Mo + verb addresses exactly two people.' },
  { tongan: '___ lea!',   english: 'Speak! (one person)',                answer: 'bare', why: 'Singular command — bare verb suffices.' },
]

export default function AudiencePickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which audience marker fills the blank?"
      promptLabel="Command"
    />
  )
}
