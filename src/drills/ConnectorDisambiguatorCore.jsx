/**
 * ConnectorDisambiguatorCore — Phase 3E: which connector?
 *
 * Tongan splits the work English does with "and", "but", and "because"
 * across several small words. The drill makes the learner choose by the
 * join being made:
 *   - mo  — "with / and", joining two nouns (ʻalu mo Sione);
 *   - pea — "and then", chaining two clauses in sequence (… peá u foki);
 *   - ʻo  — "and", linking verbs into one combined action (ʻalu ʻo vakai);
 *   - ka  — "but", before a tense marker or pronoun;
 *   - kae — "but", before a verb or adjective;
 *   - ke  — "so that / to", introducing a purpose clause;
 *   - he  — "because", introducing a reason.
 *
 * Chapter placements (items carry minChapter / maxChapter and are
 * filtered by the chapterNum prop, like TenseSwapperCore):
 *   - Ch 10 (comitative mo): mo against the Ch 7 prepositions ʻi / ki /
 *     mei — the contrast Chapter 10's own Exercise 3 drills. The ʻi/ki/mei
 *     items are chapter-only warm-ups (maxChapter 23) and never reach the
 *     later placements or the menu's full deck.
 *   - Ch 24: mo / pea / ʻo / ka / kae.
 *   - Ch 26: adds ke (purpose) and he (reason).
 *   - Menu (/drill/:id, no chapterNum): the full connector deck.
 *
 * Verified against book/Chapter-10.md L16/L24/L35/L86 (mo; Exercise 3
 * mixes ʻi/ki/mei/mo), book/Chapter-24.md (ka vs kae by next word),
 * Ch28 L121 / Ch44 L245 (ʻo linking verbs: "ō ʻo mamata", "ʻAlu atu ʻo
 * vakai"), Ch30 (pea chaining clauses), book/Chapter-26.md L14/L22/L63/L65
 * (ke purpose clauses, he reason clauses), and grammar-spec L1501 (the
 * three "and" words and the two "but" words).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'mo',  minChapter: 10, label: 'mo',  detail: 'with / and — joins two nouns' },
  { id: 'i',   minChapter: 7,  maxChapter: 23, label: 'ʻi',  detail: 'in / at — marks a place' },
  { id: 'ki',  minChapter: 7,  maxChapter: 23, label: 'ki',  detail: 'to / toward — marks a destination' },
  { id: 'mei', minChapter: 7,  maxChapter: 23, label: 'mei', detail: 'from — marks a starting point' },
  { id: 'pea', minChapter: 24, label: 'pea', detail: 'and then — chains clauses in sequence' },
  { id: 'o',   minChapter: 24, label: 'ʻo',  detail: 'and — links verbs into one action' },
  { id: 'ka',  minChapter: 24, label: 'ka',  detail: 'but — before a tense marker or pronoun' },
  { id: 'kae', minChapter: 24, label: 'kae', detail: 'but — before a verb or adjective' },
  { id: 'ke',  minChapter: 26, label: 'ke',  detail: 'so that / to — introduces a purpose clause' },
  { id: 'he',  minChapter: 26, label: 'he',  detail: 'because — gives the reason' },
]

const PROMPTS = [
  // ── Comitative mo (Ch 10) ──────────────────────────────────────────────
  { tongan: 'Naʻá ku ʻalu ki kolo ___ Sione.',   english: 'I went to town with Sione.',        answer: 'mo',  minChapter: 10, why: 'Joining a noun (Sione) to the sentence = mo ("with").' },
  { tongan: 'Ko Sione ___ Mele.',                 english: 'Sione and Mele.',                    answer: 'mo',  minChapter: 10, why: 'Joining two nouns ("Sione and Mele") = mo.' },
  { tongan: 'ʻOku ou nofo ʻi Vavaʻu ___ Mele.',   english: 'I live in Vavaʻu with Mele.',        answer: 'mo',  minChapter: 10, why: 'The companion (Mele) is joined with mo; the place already has its ʻi.' },
  { tongan: 'ʻOku ou ako ___ Seini.',             english: 'I study with Seini.',                answer: 'mo',  minChapter: 10, why: 'Accompaniment ("together with Seini") = mo, directly before the name.' },
  { tongan: 'Naʻá ne ʻalu ___ au.',               english: 'He went with me.',                   answer: 'mo',  minChapter: 10, why: 'mo does not change before a pronoun — mo au ("with me"), unlike ki/ʻi/mei, which become kiate/ʻiate/meiate.' },

  // ── Ch-10-only warm-ups: mo against the Ch 7 prepositions ─────────────
  { tongan: 'ʻOku ou nofo ___ Tonga mo Mele.',    english: 'I live in Tonga with Mele.',         answer: 'i',   minChapter: 10, maxChapter: 23, why: 'The place ("in Tonga") takes ʻi; the companion is already marked by mo.' },
  { tongan: 'Naʻa mau haʻu ___ Haʻapai mo Tēvita.', english: 'We came from Haʻapai with Tēvita.', answer: 'mei', minChapter: 10, maxChapter: 23, why: '"From Haʻapai" is a starting point — mei. mo marks the companion, not the place.' },
  { tongan: 'Naʻá ne ʻalu ___ tahi mo Seini ʻaneafi.', english: 'He went to the sea with Seini yesterday.', answer: 'ki', minChapter: 10, maxChapter: 23, why: 'The destination ("to the sea") takes ki; mo joins the companion.' },

  // ── pea / ʻo / ka / kae (Ch 24) ───────────────────────────────────────
  { tongan: 'ʻAlu atu ___ vakai.',                english: 'Go and look.',                      answer: 'o',   minChapter: 24, why: 'Two verbs joined into one linked action (go-and-look) take ʻo.' },
  { tongan: 'Naʻá ku ngāue ___ u foki.',          english: 'I worked and then I returned.',     answer: 'pea', minChapter: 24, why: 'Two clauses in sequence ("and then") are chained with pea.' },
  { tongan: 'ʻAlu koe, ___ ke foki mai.',         english: 'Go, but come back.',                answer: 'ka',  minChapter: 24, why: 'The next word is the pronoun ke, so "but" is ka (ka comes before a tense marker or pronoun).' },
  { tongan: 'ʻOku siʻi ʻa e falé ___ lelei.',     english: 'The house is small but good.',       answer: 'kae', minChapter: 24, why: 'The next word is the adjective lelei, so "but" is kae (kae comes before a verb or adjective).' },
  { tongan: 'Naʻa mau ō ___ mamata.',             english: 'We went and watched.',               answer: 'o',   minChapter: 24, why: 'Linked verbs in one action (went-and-watched) take ʻo: ō ʻo mamata.' },
  { tongan: 'Naʻe ʻuha ___ mau nofo ʻi ʻapi.',    english: 'It rained and then we stayed home.', answer: 'pea', minChapter: 24, why: 'A new clause following in sequence is introduced by pea.' },
  { tongan: 'Naʻá ku fie ʻalu ___ naʻe ʻikai.',   english: 'I wanted to go but it did not happen.', answer: 'ka', minChapter: 24, why: 'The next word is the tense marker naʻe, so "but" is ka.' },
  { tongan: 'ʻOku mālohi ___ angalelei.',          english: 'He is strong but kind.',             answer: 'kae', minChapter: 24, why: 'The next word is the adjective angalelei, so "but" is kae.' },

  // ── ke (purpose) and he (reason) — Ch 26 ──────────────────────────────
  { tongan: 'Té u kole kia Mele ___ ne haʻu.',    english: 'I will ask Mele to come.',           answer: 'ke',  minChapter: 26, why: '"That she come" is a purpose clause — introduced by ke: Té u kole kia Mele ke ne haʻu.' },
  { tongan: 'Kuo nau ō mai ___ lau ʻa e tohí.',   english: 'They have come to read the book.',   answer: 'ke',  minChapter: 26, why: '"To read the book" states the purpose of coming — ke. (ʻo would just chain the two actions.)' },
  { tongan: 'ʻOku ou ʻalu ki ʻapi, ___ ʻoku ou helaʻia.', english: 'I am going home, because I am tired.', answer: 'he', minChapter: 26, why: 'The second clause gives the reason — he ("for, because") introduces it.' },
  { tongan: 'ʻOua té ke ʻalu, ___ ʻoku ʻuha.',    english: 'Do not go, because it is raining.',  answer: 'he',  minChapter: 26, why: 'The reason for the prohibition is introduced by he: … he ʻoku ʻuha.' },
]

// Keep items whose chapter window contains chapterNum. With no chapterNum
// (menu / standalone route), show the full connector deck — items capped
// with maxChapter are chapter-embedded warm-ups and stay out of it.
const inScope = (item, chapterNum) => {
  if (chapterNum == null) return item.maxChapter == null
  if (item.minChapter != null && chapterNum < item.minChapter) return false
  if (item.maxChapter != null && chapterNum > item.maxChapter) return false
  return true
}

export default function ConnectorDisambiguatorCore({ chapterNum }) {
  const options = OPTIONS.filter(o => inScope(o, chapterNum))
  const prompts = PROMPTS.filter(p => inScope(p, chapterNum))
  const early = chapterNum != null && chapterNum < 24
  return (
    <PickerCore
      options={options}
      prompts={prompts}
      question={early ? 'Which preposition fills the blank?' : 'Which connector fills the blank?'}
      promptLabel={early ? 'Preposition' : 'Connector'}
    />
  )
}
