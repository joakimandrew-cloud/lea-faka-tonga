/**
 * TaePrefixPickerCore — Ch 43.
 *
 * The taʻe- prefix attaches to nouns ("without"), verbs/adjectives
 * ("un- / not"), or whole phrases ("without doing"). The drill makes
 * the student read the base word and English meaning to pick the right
 * sense.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'without',     label: 'taʻe- + noun',          detail: 'without (the noun)' },
  { id: 'un',          label: 'taʻe- + verb/adjective', detail: 'un- / not (negative state)' },
  { id: 'without-doing', label: 'taʻe- + clause',      detail: 'without (someone) doing (something)' },
]

const PROMPTS = [
  { tongan: 'Naʻe ʻalu ___ ʻa Maikolo.',                                english: 'Maikolo went without shoes. (taʻe su)',                  answer: 'without',     why: 'taʻe + noun (su = shoes) = "without shoes". Marks the absence of a thing.' },
  { tongan: 'ʻOku ___ ʻenau leá.',                                       english: 'Their speech is unintelligible. (taʻe mahino)',          answer: 'un',          why: 'taʻe + verb/adjective (mahino = clear) = "unclear / unintelligible". Negative state.' },
  { tongan: 'Naʻe ʻalu ʻa Tēvita ___ té ne tala mai.',                   english: 'Tēvita went without telling me. (taʻe te ne…)',          answer: 'without-doing', why: 'taʻe + te + pronoun + verb introduces a whole "without doing X" clause.' },
  { tongan: 'ʻOku ngāue ___ ʻa Sēmisi.',                                 english: 'Sēmisi is working without pay. (taʻe totongi)',          answer: 'without',     why: 'taʻe + noun (totongi = pay) = "without pay".' },
  { tongan: 'ʻOku ___ ʻene ngāué.',                                       english: 'His work is inadequate. (taʻe feʻunga)',                 answer: 'un',          why: 'taʻe + adjective (feʻunga = suitable) = "unsuitable / inadequate".' },
  { tongan: 'Naʻá ku ngāue kia Sēmisi ___ té u maʻu ha meʻa.',           english: 'I worked for Semisi without receiving anything.',        answer: 'without-doing', why: 'taʻe + te u + verb = whole-clause "without me getting anything".' },
  { tongan: 'ʻOku ___ ʻa Sione.',                                        english: 'Sione is inattentive. (taʻe tokanga)',                   answer: 'un',          why: 'taʻe + adjective (tokanga = attentive) = "inattentive / careless".' },
  { tongan: 'Ko e tangata ___ moʻoni ʻa Tēvita.',                        english: 'Tēvita is a truly unkind man. (taʻeʻofa moʻoni)',        answer: 'un',          why: 'taʻe + ʻofa (loving) = taʻeʻofa "unkind". The moʻoni intensifies "truly".' },
]

export default function TaePrefixPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="What is taʻe- doing here?"
      promptLabel="Sentence"
    />
  )
}
