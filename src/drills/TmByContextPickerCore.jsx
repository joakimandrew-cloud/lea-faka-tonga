/**
 * TmByContextPickerCore — Ch 15 (+ the Ch 9 te/ke connector, merged 2026-06-13).
 *
 * One rule, three pairs. Tongan past and future TMs each have two forms:
 * naʻa / te before a pronoun, naʻe / ʻe everywhere else (before a verb
 * with noun subject, before negation, etc.). The same pronoun-next logic
 * governs the negation connector after ʻikai: te before a pronoun, ke
 * before a bare verb (weather, impersonals).
 *
 * The te/ke prompts were merged in from TeOrKePickerCore per the
 * exercise-overwhelm review (X02): that Core stays registered for its
 * Ch 9 chapter embed; this merged deck is the single menu surface for
 * the whole pronoun-form rule. Option ids te-conn/ke-conn keep the
 * connector te distinct from the future marker Te.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'naa',     label: 'Naʻa', detail: 'past, before a pronoun' },
  { id: 'nae',     label: 'Naʻe', detail: 'past, elsewhere (noun subject, negation, impersonal)' },
  { id: 'te',      label: 'Te',   detail: 'future, before a pronoun' },
  { id: 'e',       label: 'ʻE',   detail: 'future, elsewhere' },
  { id: 'te-conn', label: 'te',   detail: 'after ʻikai, before a pronoun' },
  { id: 'ke-conn', label: 'ke',   detail: 'after ʻikai, before a verb (no pronoun)' },
]

const PROMPTS = [
  // ── Tense-marker form by what follows (Ch 15) ──
  { tongan: '___ ku ʻalu.',                   english: 'I went.',                                  answer: 'naa', why: 'Past + pronoun (ku follows immediately) → Naʻa.' },
  { tongan: '___ ʻalu ʻa Sione.',             english: 'Sione went. (noun subject)',               answer: 'nae', why: 'Past + verb-first with noun subject (no pronoun) → Naʻe. The pronoun-form Naʻa is only used when a pronoun follows directly.' },
  { tongan: '___ u ʻalu.',                    english: 'I will go.',                               answer: 'te',  why: 'Future + pronoun (u) → Te.' },
  { tongan: '___ ʻalu ʻa Mele.',              english: 'Mele will go. (noun subject)',             answer: 'e',   why: 'Future + verb-first with noun subject → ʻE. The pronoun-form Te is only used when a pronoun follows directly.' },
  { tongan: '___ ʻikai té u kai.',            english: 'I did not eat.',                           answer: 'nae', why: 'Past + ʻikai (negation, not a pronoun) → Naʻe. The pronoun-form Naʻa only fits when a pronoun follows directly; here ʻikai sits between.' },
  { tongan: '___ hiva ʻa Tēvita.',            english: 'Tēvita will sing.',                        answer: 'e',   why: 'Future + noun subject → ʻE. Pair with the post-verb "ʻa Tēvita" subject construction.' },
  { tongan: '___ ne haʻu.',                   english: 'He came.',                                 answer: 'naa', why: 'Past + pronoun (ne, accent shifts to Naʻá) → Naʻa.' },
  { tongan: '___ kai ʻa Pita.',               english: 'Pita ate.',                                answer: 'nae', why: 'Past + noun-subject construction → Naʻe.' },

  // ── The same rule after ʻikai: te / ke connector (Ch 9, merged in) ──
  { tongan: 'ʻOku ʻikai ___ u fiefia.',       english: 'I am not happy.',                          answer: 'te-conn', why: 'After ʻikai, the pronoun u (I) follows → te. ʻikai té u + verb is the standard pronoun-subject negation.' },
  { tongan: 'Naʻe ʻikai ___ matangi.',        english: 'It was not windy.',                        answer: 'ke-conn', why: 'matangi (windy) is a weather verb with no pronoun subject → ke after ʻikai.' },
  { tongan: 'ʻE ʻikai ___ ke ʻalu ki Tonga.', english: 'You will not go to Tonga.',                answer: 'te-conn', why: 'After ʻikai, the pronoun ke (you) follows → te. (The second ke here is the pronoun; the blank needs the connector te.)' },
  { tongan: 'ʻOku ʻikai ___ momoko.',         english: 'It is not cold.',                          answer: 'ke-conn', why: 'momoko (cold) is a weather verb with no pronoun subject → ke after ʻikai.' },
  { tongan: 'Naʻe ʻikai ___ nau fiefia.',     english: 'They were not happy.',                     answer: 'te-conn', why: 'After ʻikai, the pronoun nau (they) follows → te.' },
  { tongan: 'ʻE ʻikai ___ ʻuha ʻapō.',        english: 'It will not rain tonight.',                answer: 'ke-conn', why: 'ʻuha (to rain) — no pronoun subject → ke after ʻikai.' },
  { tongan: 'ʻOku ʻikai ___ ne hela.',        english: 'He is not tired.',                         answer: 'te-conn', why: 'After ʻikai, the pronoun ne (he/she) follows → te.' },
  { tongan: 'Naʻe ʻikai ___ ʻafua ʻaneafi.',  english: 'It was not fine yesterday.',               answer: 'ke-conn', why: 'ʻafua (fine weather) — no pronoun subject → ke after ʻikai.' },
]

export default function TmByContextPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which word fills the blank?"
      promptLabel="Sentence"
    />
  )
}
