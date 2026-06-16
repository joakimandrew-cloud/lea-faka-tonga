/**
 * TaePrefixPickerCore — Ch 43.
 *
 * The taʻe- prefix attaches to nouns ("without"), verbs/adjectives
 * ("un- / not"), or whole phrases ("without doing"). The drill makes
 * the student read the base word and English meaning to pick the right
 * sense.
 */

import PickerCore from './PickerCore'

// `fill` is the string PickerCore drops into the sentence blank (renderTongan
// prefers `fill` over `label`). Every blank takes the prefix taʻe; the base
// word/clause is printed right after the blank with a space, so the on-screen
// result joins as real spaced Tongan, e.g. blank "taʻe" + printed "su" →
// "taʻe su" (Shumway L117 writes the prefix spaced). `label` keeps the longer
// teaching tag for the option button only.
const OPTIONS = [
  { id: 'without',     label: 'taʻe- + noun',          fill: 'taʻe', detail: 'without (the noun)' },
  { id: 'un',          label: 'taʻe- + verb/adjective', fill: 'taʻe', detail: 'un- / not (negative state)' },
  { id: 'without-doing', label: 'taʻe- + clause',      fill: 'taʻe', detail: 'without (someone) doing (something)' },
]

const PROMPTS = [
  { tongan: 'Naʻe ʻalu ___ su ʻa Maikolo.',                              english: 'Maikolo went without shoes.',                  answer: 'without',     why: 'taʻe + noun (su = shoes) = "without shoes". Marks the absence of a thing.' },
  { tongan: 'ʻOku ___ mahino ʻenau leá.',                                english: 'Their speech is unintelligible.',              answer: 'un',          why: 'taʻe + verb/adjective (mahino = clear) = "unclear / unintelligible". Negative state.' },
  { tongan: 'Naʻe ʻalu ʻa Tēvita ___ té ne tala mai.',                   english: 'Tēvita went without telling me.',              answer: 'without-doing', why: 'taʻe + te + pronoun + verb introduces a whole "without doing X" clause.' },
  { tongan: 'ʻOku ngāue ___ totongi ʻa Sēmisi.',                         english: 'Sēmisi is working without pay.',               answer: 'without',     why: 'taʻe + noun (totongi = pay) = "without pay".' },
  { tongan: 'ʻOku ___ feʻunga ʻene ngāué.',                              english: 'His work is inadequate.',                      answer: 'un',          why: 'taʻe + adjective (feʻunga = suitable) = "unsuitable / inadequate".' },
  { tongan: 'Naʻá ku ngāue kia Sēmisi ___ té u maʻu ha meʻa.',           english: 'I worked for Sēmisi without receiving anything.', answer: 'without-doing', why: 'taʻe + té u + verb = whole-clause "without me getting anything".' },
  { tongan: 'ʻOku ___ tokanga ʻa Sione.',                                english: 'Sione is inattentive.',                        answer: 'un',          why: 'taʻe + adjective (tokanga = attentive) = "inattentive / careless".' },
  { tongan: 'Ko e tangata ___ ʻofa moʻoni ʻa Tēvita.',                   english: 'Tēvita is a truly unkind man.',                answer: 'un',          why: 'taʻe + ʻofa (loving) = taʻe ʻofa "unkind". The moʻoni intensifies "truly".' },
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
