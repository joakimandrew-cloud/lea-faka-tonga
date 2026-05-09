/**
 * AccentPlacementPickerCore — Ch 44.
 *
 * The definitive accent rule: stress falls on the LAST vowel of the
 * entire definite noun group. The drill makes the student identify
 * the boundary of the noun group — adjectives and relative clauses
 * extend the group; adverbs and time words don\u2019t.
 *
 * Same picker mechanic as the others: read the sentence, pick which
 * word\u2019s last vowel takes the accent.
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
]

const PROMPTS = [
  { tongan: 'Naʻá ku ʻalu ki he fale.', english: 'I went to the house.', answer: 'fale', why: 'The noun group is just "e fale" — accent on the last vowel of fale → falé.' },
  { tongan: 'Naʻá ku ʻalu ki he fale ako.', english: 'I went to the school.', answer: 'ako', why: 'The noun group extends to include the qualifier ako: "e fale ako". The accent moves to the LAST word of the group → akó.' },
  { tongan: 'Naʻá ku ʻalu ki he fale ako foʻou.', english: 'I went to the new school.', answer: 'foou', why: 'The group is now "e fale ako foʻou" (three-word group). The accent moves all the way to the last word → foʻoú.' },
  { tongan: 'Naʻá ke ʻalu ki he fakataha ʻaneafi?', english: 'Did you go to the meeting yesterday?', answer: 'fakataha', why: 'fakataha (meeting) is the noun; ʻaneafi (yesterday) is an ADVERB modifying the verb, NOT the noun. The accent stays on fakataha → fakatahá.' },
  { tongan: 'Naʻá ku sio ki he meʻangāue foʻou.', english: 'I looked at the new tool.', answer: 'foou', why: 'meʻangāue + foʻou = noun group. Accent at the end → foʻoú.' },
  { tongan: 'Naʻá ku kai ʻa e meʻakai.', english: 'I ate the food.', answer: 'meakai', why: 'Just one word in the noun group — accent on meʻakai → meʻakaí.' },
  { tongan: 'Naʻe ʻalu ʻa e tangata lahi.', english: 'The big man went.', answer: 'lahi', why: 'tangata + lahi = noun group with adjective. Accent on the last word → lahí.' },
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
