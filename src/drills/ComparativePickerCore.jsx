/**
 * ComparativePickerCore — Ch 27.
 *
 * Two suffixes do all the comparison work in Tongan: ange (more) for
 * comparatives, taha (most) for superlatives. The drill teaches the
 * student to read English context and pick the right one.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ange', label: 'ange', detail: 'more (comparative)' },
  { id: 'taha', label: 'taha', detail: 'most (superlative)' },
]

const PROMPTS = [
  { tongan: 'ʻOku mālohi ___ ʻa Tēvita ʻia Sēmisi.',   english: 'Tēvita is stronger than Sēmisi.',           answer: 'ange', why: 'Comparing two people → ange. The "than" phrase ʻia Sēmisi marks the standard of comparison.' },
  { tongan: 'ʻOku lelei ___ ʻa e ngāué ʻa Seini.',      english: "Seini's work is the best of all.",         answer: 'taha', why: 'Best of all (no "than" phrase, just "most") → taha.' },
  { tongan: 'ʻOku vave ___ ʻa e lolí ʻi he pasikalá.',  english: 'The truck is faster than the bicycle.',     answer: 'ange', why: 'Comparing two things → ange. ʻi he pasikalá is the "than" phrase.' },
  { tongan: 'ʻOku mālohi ___ ʻa Lōpeti.',                english: 'Lōpeti is the strongest.',                  answer: 'taha', why: 'Strongest of all → taha. No specific comparison, just "the most".' },
  { tongan: 'ʻOku lahi ___ ʻa e falé ni ʻi he fale ko iá.', english: 'This house is bigger than that house.',  answer: 'ange', why: 'Comparing two houses → ange.' },
  { tongan: 'ʻOku sai ___ ʻa e meʻakaí ʻa Mele.',         english: "Mele's food is the best.",                  answer: 'taha', why: 'Superlative ("the best") → taha.' },
  { tongan: 'ʻOku lōloa ___ ʻa Sione ʻia Tēvita.',         english: 'Sione is taller than Tēvita.',              answer: 'ange', why: 'Comparative ("taller than") → ange.' },
]

export default function ComparativePickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Comparative or superlative?"
      promptLabel="Sentence"
    />
  )
}
