/**
 * SeemLookCore — Ch 41.
 *
 * Three appearance senses that share a root:
 *   ngali       — firmer "seems / looks", placed before an adjective.
 *   ngali mo    — the suitability sense, "is fitting for", followed by mo + a clause.
 *   ngalingali  — tentative "looks as if", followed by a full clause.
 * The blank is always the appearance word; pick by what follows it
 * (an adjective vs. a clause) and by how sure the speaker is.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ngali',      label: 'ngali',      detail: 'seems / looks (firmer) + adjective' },
  { id: 'ngali-mo',   label: 'ngali mo',   detail: 'is fitting for (suitability)' },
  { id: 'ngalingali', label: 'ngalingali', detail: 'looks as if (tentative) + full clause' },
]

const PROMPTS = [
  { tongan: 'ʻOku ___ faingataʻa ʻa e ngāué.',          english: 'The work looks difficult.',                       answer: 'ngali',      why: 'ngali + the adjective faingataʻa: a firm read on how the work appears.' },
  { tongan: 'ʻOku ___ totonu ʻene maʻu ʻa e ʻapí.',     english: 'His getting the home seems right.',                answer: 'ngali',      why: 'ngali sits before the adjective totonu to say how the situation appears.' },
  { tongan: 'ʻOku ___ feʻunga ʻa e meʻakaí.',           english: 'The food looks like enough.',                      answer: 'ngali',      why: 'ngali + the stative feʻunga ("enough"): firm appearance + adjective.' },
  { tongan: 'ʻOku ___ ia ke ne fai pehē.',              english: 'It is fitting for him to do it that way.',         answer: 'ngali-mo',   why: 'The suitability sense: ngali mo + ia, "it is fitting for him". The blank carries the mo.' },
  { tongan: 'ʻOku ___ ʻe ʻuha he ʻahó ni.',             english: 'It looks like it will rain today.',                answer: 'ngalingali', why: 'A tentative guess about the weather, followed by the clause ʻe ʻuha: ngalingali, not the firmer ngali.' },
  { tongan: 'ʻOku ___ ʻe ʻikai ke lava ʻa e ngāué.',    english: 'It looks like the work will not get done.',        answer: 'ngalingali', why: 'ngalingali as a verb is followed by a full clause (ʻe ʻikai ke lava...); the speaker is unsure.' },
  { tongan: 'ʻOku ___ sai ange ʻa e fakakaukau ko iá.', english: 'That idea seems better.',                          answer: 'ngalingali', why: 'A hedged judgement ("seems better") over a clause: the tentative ngalingali.' },
  { tongan: 'Naʻe ___ faingataʻa ʻa e halá.',           english: 'The road appeared to be difficult.',              answer: 'ngalingali', why: 'ngalingali can stand right before the adjective faingataʻa as a preposed modifier: "appeared to be difficult", weaker than a flat ngali.' },
]

export default function SeemLookCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which appearance word fills the blank?"
      promptLabel="Sentence"
    />
  )
}
