/**
 * ReadItBackCore, Ch 19 (read-it-back: Tongan → English comprehension).
 *
 * A new drill type: nothing else tests pure comprehension. We show a real
 * taught Tongan sentence with NO English gloss, and the options are 3-4
 * ENGLISH meanings. The correct one is the true translation; the distractors
 * are plausible MISREADINGS of the SAME sentence, the classic learner errors
 * the markers exist to prevent:
 *
 *   - who-did-what-to-whom: swapping the ʻe (agent / doer) and ʻa (focus /
 *     receiver) roles. This is the whole point of Ch 19: ʻe always marks the
 *     doer and ʻa the thing acted upon, "no matter where they sit in the
 *     sentence" (Chapter-19.md L193).
 *   - tense: reading Naʻe (past) as future, or Kuo (perfect) as a plain past.
 *   - subject / voice: reading a passive (no ʻe phrase) as active, or reading
 *     a pronoun object as the subject.
 *
 * The Tongan sentences are all real book sentences; each item cites the
 * Chapter-19.md line it was taken from (see `source`). The English option
 * strings are authored here (they are English, not Tongan), each distractor
 * is a sensible wrong meaning of the very sentence shown.
 *
 * Orthography note: the book source uses U+0027 (straight apostrophe) for the
 * ʻokina (e.g. "Na'e"); the app's drill convention is U+02BB (ʻ), matching
 * every other Core file (ʻave, ʻalu, …). The Tongan below uses U+02BB; macrons
 * carry over unchanged. The English glosses are quoted verbatim from the book.
 *
 * Per-prompt options: unlike the marker-picker drills (one shared option pool),
 * each sentence here has its OWN four English meanings, so the options live on
 * each prompt. prompt.english is left empty so no gloss leaks the answer.
 */

import PickerCore from './PickerCore'

// Each prompt: a real Ch-19 Tongan sentence, its own four English meanings,
// the correct id, a why that names what the markers actually signal, and the
// book line the Tongan was taken from.
const PROMPTS = [
  {
    // Chapter-19.md L31: "Naʻe ʻave ʻe Pita ʻa Mele. Pita took Mele."
    source: 'Ch 19 L31',
    tongan: 'Naʻe ʻave ʻe Pita ʻa Mele.',
    english: '',
    options: [
      { id: 'a', label: 'Pita took Mele.' },
      { id: 'b', label: 'Mele took Pita.' },
      { id: 'c', label: 'Pita will take Mele.' },
      { id: 'd', label: 'Pita and Mele left.' },
    ],
    answer: 'a',
    why: 'ʻe Pita marks Pita as the doer (agent); ʻa Mele marks Mele as the one acted upon. So Pita is the taker, Mele the taken. Naʻe is past, not future.',
  },
  {
    // Chapter-19.md L188 + L190/L193: object-first order, same meaning , 
    // "ʻe Tēvita always means 'by Tēvita' … no matter where they sit."
    source: 'Ch 19 L190',
    tongan: 'Naʻe tāmateʻi ʻa Kōlaiate ʻe Tēvita.',
    english: '',
    options: [
      { id: 'a', label: 'Tēvita killed Kōlaiate.' },
      { id: 'b', label: 'Kōlaiate killed Tēvita.' },
      { id: 'c', label: 'Tēvita and Kōlaiate fought.' },
      { id: 'd', label: 'Tēvita will kill Kōlaiate.' },
    ],
    answer: 'a',
    why: 'Even though the object Kōlaiate comes first, ʻe Tēvita still marks the doer and ʻa Kōlaiate the one acted upon. Word order is only emphasis here; the markers fix the roles (Lesson 19: the meaning is the same as "Naʻe tāmateʻi ʻe Tēvita ʻa Kōlaiate").',
  },
  {
    // Chapter-19.md L83: "Naʻe kai ʻe Sione ʻa e mā. Sione ate the bread."
    source: 'Ch 19 L83',
    tongan: 'Naʻe kai ʻe Sione ʻa e mā.',
    english: '',
    options: [
      { id: 'a', label: 'Sione ate the bread.' },
      { id: 'b', label: 'The bread ate Sione.' },
      { id: 'c', label: 'Sione ate bread.' },
      { id: 'd', label: 'Sione will eat the bread.' },
    ],
    answer: 'a',
    why: 'ʻe Sione = the doer, ʻa e mā = the definite object (the bread). The article e + accented mā makes it "the bread", not just "bread"; the indefinite "ate bread" would be the fused intransitive kai mā with ʻa Sione instead.',
  },
  {
    // Chapter-19.md L92: "Naʻá ku lau ʻa e tohí. I read the book."
    source: 'Ch 19 L92',
    tongan: 'Naʻá ku lau ʻa e tohí.',
    english: '',
    options: [
      { id: 'a', label: 'I read the book.' },
      { id: 'b', label: 'You read the book.' },
      { id: 'c', label: 'The book read to me.' },
      { id: 'd', label: 'I will read the book.' },
    ],
    answer: 'a',
    why: 'The pronoun ku is "I" (the doer, before the verb); ʻa e tohí is the object (the book). Naʻá is past. ku is never "you" (that would be ke).',
  },
  {
    // Chapter-19.md L121 (active) vs L122 (passive: no ʻe phrase).
    source: 'Ch 19 L122',
    tongan: 'Naʻe langa ʻa e falé.',
    english: '',
    options: [
      { id: 'a', label: 'The house was built.' },
      { id: 'b', label: 'The house built it.' },
      { id: 'c', label: 'He built the house.' },
      { id: 'd', label: 'The house is being built.' },
    ],
    answer: 'a',
    why: 'There is no ʻe phrase, so no doer is named: this is the passive-equivalent. ʻa e falé is the thing acted upon. With a doer it would be active, "Naʻe langa ʻe Sione ʻa e falé" = Sione built the house.',
  },
  {
    // Chapter-19.md L162: "ʻOkú ne manatuʻi lelei koe. He remembers you well."
    source: 'Ch 19 L162',
    tongan: 'ʻOkú ne manatuʻi lelei koe.',
    english: '',
    options: [
      { id: 'a', label: 'He remembers you well.' },
      { id: 'b', label: 'You remember him well.' },
      { id: 'c', label: 'He remembered you well.' },
      { id: 'd', label: 'He forgets you.' },
    ],
    answer: 'a',
    why: 'ne is the doer ("he"); koe is the postposed pronoun object ("you"), with ʻa dropped before it. ʻOku is present tense, so "remembers", not "remembered".',
  },
  {
    // Chapter-19.md L49: "Kuo fai ʻe he faiakó ʻa e lesoní?
    //                     Has the teacher given the lesson?"
    source: 'Ch 19 L49',
    tongan: 'Kuo fai ʻe he faiakó ʻa e lesoní?',
    english: '',
    options: [
      { id: 'a', label: 'Has the teacher given the lesson?' },
      { id: 'b', label: 'Has the lesson taught the teacher?' },
      { id: 'c', label: 'Will the teacher give the lesson?' },
      { id: 'd', label: 'The teacher gave the lesson.' },
    ],
    answer: 'a',
    why: 'ʻe he faiakó is the common-noun doer (the agent ʻe + article he); ʻa e lesoní is the object. Kuo is the perfect ("has … done"), and the ? makes it a question, not a statement.',
  },
  {
    // Chapter-19.md L51: "Naʻe tohi ʻe he tamasiʻí ʻa e tohí.
    //                     The boy wrote the book."
    source: 'Ch 19 L51',
    tongan: 'Naʻe tohi ʻe he tamasiʻí ʻa e tohí.',
    english: '',
    options: [
      { id: 'a', label: 'The boy wrote the book.' },
      { id: 'b', label: 'The book wrote the boy.' },
      { id: 'c', label: 'The boy read the book.' },
      { id: 'd', label: 'The boy will write the book.' },
    ],
    answer: 'a',
    why: 'ʻe he tamasiʻí marks the boy as the writer (doer); ʻa e tohí is what gets written. The verb is tohi (write), not lau (read), and Naʻe is past.',
  },
]

export default function ReadItBackCore() {
  return (
    <PickerCore
      prompts={PROMPTS}
      question="What does this sentence mean?"
      promptLabel="Read it back"
      hideGloss
    />
  )
}
