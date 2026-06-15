/**
 * AccentPlacementPickerCore — Ch 44.
 *
 * The definitive accent rule: stress falls on the LAST vowel of the
 * entire definite noun group. The drill makes the student identify
 * the boundary of the noun group — adjectives and relative clauses
 * extend the group; adverbs and time words do not.
 *
 * Same picker mechanic as the others: read the sentence, pick which
 * word's last vowel takes the accent.
 *
 * Boundary items (verified against book/Chapter-44.md) stop the drill
 * from collapsing into "always click the last word":
 *   - adverbs like ʻaneafi sit OUTSIDE the group, so the accent stays on
 *     the noun, not the trailing adverb (Ch44 "Adverbs do not extend the
 *     group", L113-120);
 *   - but a relative clause EXTENDS the group, so its last word — even
 *     ʻaneafi — takes the accent (Ch44 L128-132);
 *   - indefinite (ha) and semi-definite (e / he) groups take NO definitive
 *     accent at all (Ch44 Exercise 1, L302-304 / answers L356-357).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'fale',     label: 'fale',     detail: 'last vowel of "fale"' },
  { id: 'ako',      label: 'ako',      detail: 'last vowel of "ako"' },
  { id: 'foou',     label: 'foʻou',    detail: 'last vowel of "foʻou"' },
  { id: 'aneafi',   label: 'ʻaneafi',  detail: 'last vowel of "ʻaneafi"' },
  { id: 'lahi',     label: 'lahi',     detail: 'last vowel of "lahi"' },
  { id: 'meakai',   label: 'meʻakai',  detail: 'last vowel of "meʻakai"' },
  { id: 'fakataha', label: 'fakataha', detail: 'last vowel of "fakataha"' },
  { id: 'meangaue', label: 'meʻangāue', detail: 'last vowel of "meʻangāue"' },
  { id: 'tangata',  label: 'tangata',  detail: 'last vowel of "tangata"' },
  { id: 'tohi',     label: 'tohi',     detail: 'last vowel of "tohi"' },
  { id: 'kato',     label: 'kato',     detail: 'last vowel of "kato"' },
  { id: 'none',     label: 'No accent', detail: 'indefinite (ha) or semi-definite (e / he) takes no definitive accent' },
]

const PROMPTS = [
  // ── Bare and extending noun groups: the accent caps the group's last word ──
  { tongan: 'Naʻá ku ʻalu ki he fale.', english: 'I went to the house.', answer: 'fale', why: 'The noun group is just "e fale": accent on the last vowel of fale → falé.' },
  { tongan: 'Naʻá ku ʻalu ki he fale ako.', english: 'I went to the school.', answer: 'ako', why: 'The noun group extends to include the qualifier ako: "e fale ako". The accent moves to the LAST word of the group → akó.' },
  { tongan: 'Naʻá ku ʻalu ki he fale ako foʻou.', english: 'I went to the new school.', answer: 'foou', why: 'The group is now "e fale ako foʻou" (three-word group). The accent moves all the way to the last word → foʻoú.' },
  { tongan: 'Naʻá ku sio ki he meʻangāue foʻou.', english: 'I looked at the new tool.', answer: 'foou', why: 'meʻangāue + foʻou = one noun group. The adjective foʻou is INSIDE the group, so the accent moves to its end → foʻoú.' },
  { tongan: 'Naʻá ku kai ʻa e meʻakai.', english: 'I ate the food.', answer: 'meakai', why: 'Just one word in the noun group: accent on meʻakai → meʻakaí.' },
  { tongan: 'Naʻe ʻalu ʻa e tangata lahi.', english: 'The big man went.', answer: 'lahi', why: 'tangata + lahi = noun group with an adjective. Accent on the last word → lahí.' },

  // ── Boundary: a word that sits OUTSIDE the noun group takes no accent ──
  { tongan: 'Naʻá ke ʻalu ki he fakataha ʻaneafi?', english: 'Did you go to the meeting yesterday?', answer: 'fakataha', why: 'ʻaneafi (yesterday) is an ADVERB modifying the verb ʻalu, not the noun: it sits OUTSIDE the noun group. The accent stays on the group’s last word → fakatahá.' },
  { tongan: 'Naʻe ʻalu ʻa e tangata ʻaneafi.', english: 'The man went yesterday.', answer: 'tangata', why: 'The subject group is "ʻa e tangata"; ʻaneafi is an adverb outside it. The accent caps the group, not the last word of the sentence → tangatá.' },
  { tongan: 'Naʻá ku sio ki he meʻangāue ʻaneafi.', english: 'I looked at the tool yesterday.', answer: 'meangaue', why: 'Here ʻaneafi is a bare adverb, outside the group, so the accent stays on meʻangāué. Compare the new-tool sentence, where the adjective foʻou is INSIDE the group and pulls the accent to its own end.' },

  // ── Boundary: a relative clause EXTENDS the group, so its last word takes the accent ──
  { tongan: 'Naʻá ke ʻalu ki he fakataha naʻe fai ʻaneafi?', english: 'Did you go to the meeting that was held yesterday?', answer: 'aneafi', why: 'Now "naʻe fai ʻaneafi" is a relative clause qualifying fakataha, so ʻaneafi is INSIDE the noun group and ends it → ʻaneafí. Contrast the bare-adverb version, where ʻaneafi takes no accent.' },

  // ── Boundary: indefinite / semi-definite groups take NO definitive accent ──
  { tongan: 'Naʻá ne kumi ha tohi.', english: 'He looked for a book.', answer: 'none', why: 'ha marks an INDEFINITE noun ("a book, any book"). Indefinite groups never take the definitive accent: no word in the sentence carries it.' },
  { tongan: 'Naʻá ne lau e tohi.', english: 'He read a (particular) book.', answer: 'none', why: 'e tohi here is SEMI-definite: a particular book, but not one singled out for the listener. Semi-definite groups take no accent; only the fully definite "ʻa e tohí" would.' },
  { tongan: 'Naʻá ne lau ʻa e tohi.', english: 'He read the book.', answer: 'tohi', why: 'ʻa e tohi is fully DEFINITE ("the book we both know"). Now the definitive accent appears, on the group’s last vowel → tohí.' },
  { tongan: 'ʻOku ou fiemaʻu ha kato.', english: 'I want a basket. (any basket)', answer: 'none', why: 'ha marks an INDEFINITE noun: no particular basket in mind, so no word takes the definitive accent (Ch 44 Exercise 2; the three levels are taught in Ch 18).' },
  { tongan: 'Haʻu mo e kato.', english: 'Bring the basket. (the one you know about)', answer: 'kato', why: 'Fully DEFINITE: both of you know which basket, so the accent appears → e kató (Ch 18). With the "particular but not singled out" reading, the same written sentence would stay unaccented: the gloss decides.' },
]

export default function AccentPlacementPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Where does the definitive accent fall?"
      promptLabel="Sentence"
    />
  )
}
