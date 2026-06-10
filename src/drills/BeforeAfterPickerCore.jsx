/**
 * BeforeAfterPickerCore — Ch 42.
 *
 * Four time-relation expressions built from spatial words: ki muʻa
 * (before), ki mui (after / afterward), ʻamui (later on), tōmuʻa
 * (first of all, before anything else). Position varies — ki muʻa /
 * ki mui / ʻamui are postposed; tōmuʻa is preposed.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ki-mua',  label: 'ki muʻa', detail: 'before / ahead (postposed)' },
  { id: 'ki-mui',  label: 'ki mui',  detail: 'after / afterward (postposed)' },
  { id: 'amui',    label: 'ʻamui',   detail: 'later on / in the future (postposed)' },
  { id: 'tomua',   label: 'tōmuʻa',  detail: 'first of all (preposed)' },
]

const PROMPTS = [
  { tongan: 'Naʻá ku haʻu au ___ he onó.',                       english: 'I came before six o\u2019clock.',                       answer: 'ki-mua', why: 'ki muʻa = before (in time). Postposed.' },
  { tongan: 'Naʻe toki haʻu ʻa Siale ___ ʻia ʻAna.',              english: 'Siale came after Ana.',                                 answer: 'ki-mui', why: 'ki mui = after / afterward. Postposed, with ʻia + person to mark whom Siale came after.' },
  { tongan: 'Tau toki ʻilo ___.',                                  english: 'We will find out later on.',                            answer: 'amui',   why: 'ʻamui = later on / in the future. Sits at the end.' },
  { tongan: 'Té u ___ tala hono koví peá u toki tala hono leleí.', english: 'I will first tell its bad side and then tell its good side.', answer: 'tomua', why: 'tōmuʻa = first of all. Preposed (before the verb), unlike the others.' },
  { tongan: 'ʻOku ʻi ai ha ngaahi meʻa lahi ʻe hoko ___.',         english: 'There are many things that will happen in the future.', answer: 'amui',   why: 'ʻamui = in the future / later on.' },
  { tongan: 'Mou teuteu ___, naʻa mou tōmui.',                     english: 'Get ready ahead of time, lest you be late.',           answer: 'ki-mua', why: 'ki muʻa = ahead / before. Postposed after the verb.' },
  { tongan: 'Te nau ___ ō kinautolu.',                             english: 'They will go first.',                                   answer: 'tomua',  why: 'tōmuʻa preposed before the verb (ō here).' },
  { tongan: 'Naʻá ku toki ʻilo ___ kuo lavea ʻa e tamasiʻí.',     english: 'I just found out afterward that the boy was hurt.',     answer: 'ki-mui', why: 'ki mui = afterward (in time).' },
]

export default function BeforeAfterPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which time-relation phrase fills the blank?"
      promptLabel="Sentence"
    />
  )
}
