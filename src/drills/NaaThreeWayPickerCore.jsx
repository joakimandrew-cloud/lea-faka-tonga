/**
 * NaaThreeWayPickerCore — Ch 38.
 *
 * The word naʻa wears three different hats in Tongan:
 *   1. The past tense marker (Ch 1) — naʻa + pronoun + verb.
 *   2. A WARNING ("lest / or else") after a command (Ch 38).
 *   3. An UNCERTAINTY marker ("perhaps / maybe") at the start of a
 *      clause, before a tense marker or ko (Ch 38).
 *
 * Position and surrounding context disambiguate. The drill builds the
 * student's pause to ask "which naʻa is this?" before guessing the
 * meaning.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'past',    label: 'past TM',     detail: 'naʻa + pronoun + verb (Ch 1)' },
  { id: 'warning', label: 'warning',     detail: 'lest / or else (after a command)' },
  { id: 'maybe',   label: 'uncertainty', detail: 'perhaps (clause-initial, before a TM or ko)' },
]

const PROMPTS = [
  { tongan: '___ ku kai.',                          english: 'I ate.',                                       answer: 'past',    why: 'naʻa + pronoun (ku) + verb. The classic past tense pattern. Position: sentence-initial, followed by a pronoun.' },
  { tongan: 'Lele mai ___ ke tōmui.',                english: 'Run here lest you be late.',                   answer: 'warning', why: 'naʻa AFTER a command (Lele mai) introduces a feared consequence: "lest". The first clause is the imperative.' },
  { tongan: '___ kuó ke hela.',                      english: 'Perhaps you are tired.',                       answer: 'maybe',   why: 'naʻa at the START of a clause, BEFORE a tense marker (kuo): uncertainty / "perhaps". Distinct from past TM, which is followed by a pronoun.' },
  { tongan: 'Mou ako mālohi ___ mou tō he siví.',    english: 'Study hard, lest you fail the exam.',          answer: 'warning', why: 'After a command (Mou ako mālohi), naʻa marks the warning: what the student should avoid.' },
  { tongan: '___ ko hono falé ení.',                 english: 'Perhaps this is his house.',                   answer: 'maybe',   why: 'naʻa at the start of a clause, before ko, signals uncertainty.' },
  { tongan: '___ ne ʻalu.',                          english: 'He went.',                                     answer: 'past',    why: 'naʻa + pronoun (ne) + verb. Past tense, pronoun-subject pattern.' },
  { tongan: 'Hola ___ ke lavea.',                    english: 'Run away lest you get hurt.',                  answer: 'warning', why: 'After the command Hola (run away), naʻa introduces what to avoid: getting hurt.' },
  { tongan: '___ ʻoku moʻoní ia.',                   english: 'Perhaps he is right.',                         answer: 'maybe',   why: 'Sentence-initial naʻa before a tense marker (ʻoku) → uncertainty.' },
]

export default function NaaThreeWayPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which job is naʻa doing here?"
      promptLabel="Sentence"
    />
  )
}
