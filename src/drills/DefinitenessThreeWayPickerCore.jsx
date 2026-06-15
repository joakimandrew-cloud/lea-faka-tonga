/**
 * DefinitenessThreeWayPickerCore — Ch 18.
 *
 * Tongan has three levels of definiteness where English has two:
 *   - ha + noun            — indefinite ("a basket — any one will do");
 *   - e + noun             — semi-definite ("a basket — a particular one,
 *                            but not pointed out to the listener");
 *   - e + noun + accent    — fully definite ("the basket — the one you
 *                            both know"); stress shifts to the last vowel
 *                            (kato → kató). This is the definitive accent,
 *                            first introduced here.
 *
 * Same picker mechanic as the Ch 44 accent drill, but with simple
 * one-noun groups: pick the whole article + noun form for the context
 * given in the English cue. Options are grouped per noun so the filled
 * sentence reads exactly as the book prints it.
 *
 * All prompts verified against book/Chapter-18.md: the kato triad
 * (L14-18, "Haʻu mo ha kato / e kato / e kató"), the ika triad
 * (L32-36, "ʻOku ou fiemaʻu ha ika / ʻa e ika / ʻa e iká"), and the
 * generic use of the definite article (L108, "ʻOku lelei ʻa e iká").
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ha-kato',    category: 'kato: basket', label: 'ha kato',   detail: 'a basket: any one will do (indefinite)' },
  { id: 'e-kato',     category: 'kato: basket', label: 'e kato',    detail: 'a basket: a particular one, not yet pointed out (semi-definite)' },
  { id: 'e-kato-def', category: 'kato: basket', label: 'e kató',    detail: 'the basket: the one you both know; stress jumps to the last vowel (definite)' },
  { id: 'ha-ika',     category: 'ika: fish',    label: 'ha ika',    detail: 'some fish: any fish (indefinite)' },
  { id: 'a-e-ika',    category: 'ika: fish',    label: 'ʻa e ika',  detail: 'fish: a particular fish, not identified to the listener (semi-definite)' },
  { id: 'a-e-ika-def', category: 'ika: fish',   label: 'ʻa e iká',  detail: 'the fish: the one you both know about; stress on the last vowel (definite)' },
]

const PROMPTS = [
  { tongan: 'Haʻu mo ___.', english: 'Bring a basket. (any basket will do)',                              answer: 'ha-kato',    why: 'No particular basket in mind → indefinite ha: Haʻu mo ha kato.' },
  { tongan: 'Haʻu mo ___.', english: 'Bring a basket. (I have one in mind, but you may not know which)',  answer: 'e-kato',     why: 'A particular basket, but not singled out for the listener → semi-definite: e kato, with no change in stress.' },
  { tongan: 'Haʻu mo ___.', english: 'Bring the basket. (the one you know about)',                        answer: 'e-kato-def', why: 'Both speaker and listener know which one → fully definite: e plus the definitive accent, stress on the last vowel: kató.' },
  { tongan: 'ʻOku ou fiemaʻu ___.', english: 'I want some fish. (any fish)',                              answer: 'ha-ika',     why: 'Any fish at all → indefinite ha: ʻOku ou fiemaʻu ha ika.' },
  { tongan: 'ʻOku ou fiemaʻu ___.', english: 'I want fish. (a particular fish, but not identified to you)', answer: 'a-e-ika',  why: 'The speaker means one particular fish but has not singled it out → semi-definite ʻa e ika: same spelling as the definite, but normal stress.' },
  { tongan: 'ʻOku ou fiemaʻu ___.', english: 'I want the fish. (the specific fish we both know about)',   answer: 'a-e-ika-def', why: 'Fully definite → the definitive accent moves the stress to the final vowel: ʻa e iká.' },
  { tongan: 'ʻOku lelei ___.', english: 'Fish is good. (fish in general, as a kind of food)',             answer: 'a-e-ika-def', why: 'General statements about a whole category take the definite article AND the definitive accent in Tongan: ʻOku lelei ʻa e iká.' },
]

export default function DefinitenessThreeWayPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which level of definiteness fits the context?"
      promptLabel="Sentence"
    />
  )
}
