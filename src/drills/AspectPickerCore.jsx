/**
 * AspectPickerCore — Ch 22.
 *
 * Aspect markers tell you what stage an action is in: still, already,
 * not yet, currently, again, just, immediately. The drill teaches
 * which marker fits a given English meaning.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'kei',       label: 'kei',       detail: 'still' },
  { id: 'osi',       label: 'ʻosi',      detail: 'already / finished' },
  { id: 'teeki',     label: 'teʻeki',    detail: 'not yet (standalone: teʻeki ai)' },
  { id: 'lolotonga', label: 'lolotonga', detail: 'currently' },
  { id: 'toe',       label: 'toe',       detail: 'again / more' },
  { id: 'toki',      label: 'toki',      detail: 'just / not until' },
  { id: 'leva',      label: 'leva',      detail: 'immediately (after verb)' },
]

const PROMPTS = [
  { tongan: 'ʻOkú ne ___ fiekaia pē.',               english: 'He is still hungry.',                      answer: 'kei',       why: 'kei = still / continuing. The state was true before and remains true now.' },
  { tongan: 'Kuó ne ___ ʻalu.',                      english: 'He has already gone.',                     answer: 'osi',       why: 'ʻosi = already / completed. Pairs naturally with the perfect tense kuo.' },
  { tongan: 'ʻOku ___ té u kai.',                    english: 'I have not eaten yet.',                    answer: 'teeki',     why: 'teʻeki = not yet; before a pronoun it is teʻeki te, with no ai. (The ai is required only in the standalone answer Teʻeki ai.) Anticipates that the action will happen.' },
  { tongan: 'ʻOku ou ___ lau ha tohi.',              english: 'I am currently reading a book.',           answer: 'lolotonga', why: 'lolotonga = currently / in the act of. The action is happening right now at the moment of speaking.' },
  { tongan: 'Naʻá ku ___ sio kia Sione ʻaneafi.',    english: 'I saw Sione again yesterday.',             answer: 'toe',       why: 'toe = again / more. Marks repetition.' },
  { tongan: 'Naʻa mau ___ haʻu.',                    english: 'We just came.',                            answer: 'toki',      why: 'toki = just (recent past) / not until (delayed future). Here, the recent-past sense.' },
  { tongan: 'Naʻá ku foki ___ ki fale.',             english: 'I returned to the house immediately.',     answer: 'leva',      why: 'leva = immediately. Postposed (after the verb), unlike all the others which are preposed.' },
  { tongan: 'ʻE ___ kamata ʻa e fakatahá ʻapongipongi.', english: 'The meeting will not begin until tomorrow.', answer: 'toki',  why: 'toki = not until (delayed future). Same word as recent-past "just"; the tense disambiguates.' },
]

export default function AspectPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which aspect marker fills the blank?"
      promptLabel="Sentence"
    />
  )
}
