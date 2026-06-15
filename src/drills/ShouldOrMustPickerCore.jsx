/**
 * ShouldOrMustPickerCore — Ch 23.
 *
 * Two obligation expressions split by force. ʻOku totonu ke = "should /
 * ought to / it is right that" — moral/normal obligation. Kuo pau ke =
 * "must / it is necessary / certain that" — unavoidable obligation or
 * strong probability.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'totonu', label: 'ʻoku totonu ke', detail: 'should / ought to (right thing)' },
  { id: 'pau',    label: 'kuo pau ke',     detail: 'must / certainly (unavoidable)' },
]

const PROMPTS = [
  { tongan: '___ ke u ako.',                          english: 'I should study.',                                   answer: 'totonu', why: 'A moral / proper obligation: should. ʻoku totonu ke.' },
  { tongan: '___ ke u foki ki fale.',                 english: 'I must go home. (it\u2019s necessary)',             answer: 'pau',    why: 'Unavoidable necessity: must. kuo pau ke.' },
  { tongan: '___ ke ke lotu.',                        english: 'You should pray.',                                  answer: 'totonu', why: 'Should = the right thing to do. ʻoku totonu ke.' },
  { tongan: '___ ke vela he ʻahó ní.',                english: 'It is certain to be hot today.',                    answer: 'pau',    why: 'Strong probability / certainty about a fact → kuo pau ke.' },
  { tongan: '___ ke ngāue lahi ʻa Mele.',             english: 'Mele should work hard.',                            answer: 'totonu', why: 'Moral obligation: should. ʻoku totonu ke.' },
  { tongan: '___ ke helaʻia ʻa Sēmisi.',              english: 'Sēmisi must be tired.',                             answer: 'pau',    why: 'Strong inference about a state: must be. kuo pau ke.' },
  { tongan: '___ ke tau foki ki ʻapi.',               english: 'We should return home.',                            answer: 'totonu', why: 'Right / proper thing to do → ʻoku totonu ke.' },
  { tongan: '___ ke ke ngāue.',                       english: 'You must work.',                                    answer: 'pau',    why: 'Necessity → kuo pau ke.' },
]

export default function ShouldOrMustPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Should or must?"
      promptLabel="Sentence"
    />
  )
}
