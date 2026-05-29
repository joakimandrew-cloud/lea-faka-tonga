/**
 * VocabClozeCore — Phase 3H: vocabulary in a known frame.
 *
 * A familiar sentence frame with one content word blanked and the English
 * cue beside it; the learner recalls the Tongan word. The grammar of the
 * frame is already settled, so the test is pure vocabulary recall in
 * context (the way words are actually met). This seed deck blanks common
 * verbs from the early chapters; the frames reuse patterns already taught
 * (TM + pronoun + verb + object).
 *
 * (A future enhancement could weight missed words and pull from a larger
 * frequency list — a light SRS; for now the deck reshuffles uniformly.)
 * Words/frames verified against book/Chapter-01..03 and Chapter-19 L114
 * (inu ʻa e vai), Chapter-44 (sio ki …).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'kai',   label: 'kai',   detail: 'eat' },
  { id: 'inu',   label: 'inu',   detail: 'drink' },
  { id: 'alu',   label: 'ʻalu',  detail: 'go' },
  { id: 'lau',   label: 'lau',   detail: 'read' },
  { id: 'hiva',  label: 'hiva',  detail: 'sing' },
  { id: 'mohe',  label: 'mohe',  detail: 'sleep' },
  { id: 'ngaue', label: 'ngāue', detail: 'work' },
  { id: 'sio',   label: 'sio',   detail: 'look, see' },
]

const PROMPTS = [
  { tongan: 'Naʻa ku ___ ʻa e mā.',          english: '(ate) the bread',           answer: 'kai',   why: 'kai = eat. Naʻa ku kai ʻa e mā = "I ate the bread".' },
  { tongan: 'Naʻa ku ___ ʻa e vai.',         english: '(drank) the water',         answer: 'inu',   why: 'inu = drink. Naʻa ku inu ʻa e vai = "I drank the water".' },
  { tongan: 'Naʻa ku ___ ki kolo.',          english: '(went) to town',            answer: 'alu',   why: 'ʻalu = go. Naʻa ku ʻalu ki kolo = "I went to town".' },
  { tongan: 'ʻOkú ne ___ ʻa e tohi.',        english: '(reads) the book',          answer: 'lau',   why: 'lau = read. ʻOkú ne lau ʻa e tohi = "he reads the book".' },
  { tongan: 'Naʻa nau ___ ʻi he fale lotu.', english: '(sang) in the church',      answer: 'hiva',  why: 'hiva = sing (it also means "nine"; context decides). Naʻa nau hiva = "they sang".' },
  { tongan: 'ʻOku ou ___.',                  english: 'I am (sleeping)',           answer: 'mohe',  why: 'mohe = sleep. ʻOku ou mohe = "I am sleeping".' },
  { tongan: 'ʻOku mau ___ mālohi.',          english: 'we (work) hard',            answer: 'ngaue', why: 'ngāue = work. ʻOku mau ngāue mālohi = "we work hard".' },
  { tongan: 'Naʻa ku ___ ki he tahi.',       english: '(looked) at the sea',       answer: 'sio',   why: 'sio = look/see. Naʻa ku sio ki he tahi = "I looked at the sea".' },
]

export default function VocabClozeCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which word fills the blank?"
      promptLabel="Fill the blank"
    />
  )
}
