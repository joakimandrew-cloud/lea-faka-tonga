/**
 * ConnectorDisambiguatorCore — Phase 3E: which connector?
 *
 * Tongan splits the work English does with "and" and "but" across five
 * words. The drill makes the learner choose by the join being made:
 *   - mo  — "with / and", joining two nouns (ʻalu mo Sione);
 *   - pea — "and then", chaining two clauses in sequence (… peá u foki);
 *   - ʻo  — "and", linking verbs into one combined action (ʻalu ʻo vakai);
 *   - ka  — "but", before a tense marker or pronoun;
 *   - kae — "but", before a verb or adjective.
 *
 * Verified against book/Chapter-24.md (ka vs kae by next word), Ch28 L121
 * / Ch44 L245 (ʻo linking verbs: "ō ʻo mamata", "ʻAlu atu ʻo vakai"),
 * Ch30 (pea chaining clauses), and grammar-spec L1501 (the three "and"
 * words and the two "but" words).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'mo',  label: 'mo',  detail: 'with / and — joins two nouns' },
  { id: 'pea', label: 'pea', detail: 'and then — chains clauses in sequence' },
  { id: 'o',   label: 'ʻo',  detail: 'and — links verbs into one action' },
  { id: 'ka',  label: 'ka',  detail: 'but — before a tense marker or pronoun' },
  { id: 'kae', label: 'kae', detail: 'but — before a verb or adjective' },
]

const PROMPTS = [
  { tongan: 'Naʻá ku ʻalu ki kolo ___ Sione.',   english: 'I went to town with Sione.',        answer: 'mo',  why: 'Joining a noun (Sione) to the sentence = mo ("with").' },
  { tongan: 'ʻAlu atu ___ vakai.',                english: 'Go and look.',                      answer: 'o',   why: 'Two verbs joined into one linked action (go-and-look) take ʻo.' },
  { tongan: 'Naʻá ku ngāue ___ u foki.',          english: 'I worked and then I returned.',     answer: 'pea', why: 'Two clauses in sequence ("and then") are chained with pea.' },
  { tongan: 'ʻAlu koe, ___ ke foki mai.',         english: 'Go, but come back.',                answer: 'ka',  why: 'The next word is the pronoun ke, so "but" is ka (ka comes before a tense marker or pronoun).' },
  { tongan: 'ʻOku siʻi ʻa e falé ___ lelei.',     english: 'The house is small but good.',       answer: 'kae', why: 'The next word is the adjective lelei, so "but" is kae (kae comes before a verb or adjective).' },
  { tongan: 'Ko Sione ___ Mele.',                 english: 'Sione and Mele.',                    answer: 'mo',  why: 'Joining two nouns ("Sione and Mele") = mo.' },
  { tongan: 'Naʻa mau ō ___ mamata.',             english: 'We went and watched.',               answer: 'o',   why: 'Linked verbs in one action (went-and-watched) take ʻo: ō ʻo mamata.' },
  { tongan: 'Naʻe ʻuha ___ mau nofo ʻi ʻapi.',    english: 'It rained and then we stayed home.', answer: 'pea', why: 'A new clause following in sequence is introduced by pea.' },
  { tongan: 'Naʻá ku fie ʻalu ___ naʻe ʻikai.',   english: 'I wanted to go but it did not happen.', answer: 'ka', why: 'The next word is the tense marker naʻe, so "but" is ka.' },
  { tongan: 'ʻOku mālohi ___ angalelei.',          english: 'He is strong but kind.',             answer: 'kae', why: 'The next word is the adjective angalelei, so "but" is kae.' },
]

export default function ConnectorDisambiguatorCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which connector fills the blank?"
      promptLabel="and / but?"
    />
  )
}
