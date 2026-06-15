/**
 * TemporalConjunctionPickerCore — Ch 30.
 *
 * Five conjunctions covering condition, simultaneity, endpoint, moment,
 * and concession. The drill turns the English logical connector into the
 * right Tongan word.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'kapau',     label: 'kapau',     detail: 'if' },
  { id: 'lolotonga', label: 'lolotonga', detail: 'while / during' },
  { id: 'kaeoua',    label: 'kaeʻoua ke', detail: 'until' },
  { id: 'ihe',       label: 'ʻi he',     detail: 'when (with verbal noun)' },
  { id: 'neongo',    label: 'neongo',    detail: 'although' },
]

const PROMPTS = [
  { tongan: '___ té ke foki, té u kuki.',                           english: 'If you return, I will cook.',                       answer: 'kapau',     why: 'kapau introduces a condition that may or may not be met. Always followed by a tense marker or ko.' },
  { tongan: 'Naʻá ku mohe ___ naʻá ne lau tohi.',                    english: 'I slept while she was reading.',                    answer: 'lolotonga', why: 'lolotonga = while / during: one event happens during another.' },
  { tongan: 'Té u ngāue heni ___ nau foki mai.',                     english: 'I will work here until they come back.',           answer: 'kaeoua',    why: 'kaeʻoua ke = until. Marks the endpoint that brings the first action to a close.' },
  { tongan: '___ ʻosi ʻenau hivá, pea nau mohe.',                    english: 'When they finished singing, they slept.',          answer: 'ihe',       why: 'ʻi he + verbal noun = "when [the X-ing] happened". The main clause begins with pea.' },
  { tongan: '___ ʻeku helaʻia, ka té u ngāue pē.',                   english: 'Although I am tired, I will work anyway.',          answer: 'neongo',    why: 'neongo = although / even though. Often paired with ka (but) in the main clause.' },
  { tongan: '___ ʻokú ne fiekaia, té u kuki.',                       english: 'If she is hungry, I will cook.',                    answer: 'kapau',     why: 'A genuine condition (may or may not be true) → kapau.' },
  { tongan: 'Naʻe lele ʻa Mele ___ naʻa mau kai.',                   english: 'Mele ran while we were eating.',                    answer: 'lolotonga', why: 'lolotonga = simultaneous events.' },
  { tongan: 'ʻE nofo ai ___ foki mai ʻa Mele.',                      english: 'She will stay there until Mele comes back.',        answer: 'kaeoua',    why: 'kaeʻoua ke = until: the endpoint sense. (For a completed state, ke is replaced by kuo: kaeʻoua kuo mālohi.)' },
]

export default function TemporalConjunctionPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which conjunction fills the blank?"
      promptLabel="Sentence"
    />
  )
}
