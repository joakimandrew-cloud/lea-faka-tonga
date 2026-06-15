/**
 * DemonstrativePickerCore — Ch 6.
 *
 * Tongan splits "here / there" three ways by person: heni (near me),
 * hena (near you), hē (where I'm pointing). The drill is purely
 * deictic — read the scenario, pick the right marker.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'heni', label: 'heni', detail: 'near me (the speaker)' },
  { id: 'hena', label: 'hena', detail: 'near you (the listener)' },
  { id: 'he',   label: 'hē',   detail: 'over there / where I point' },
]

const PROMPTS = [
  { tongan: 'Tau nofo ___.',         english: "Let's stay here. (where I am)",                       answer: 'heni', why: 'heni = "here" near the speaker. The speaker is talking about their own location.' },
  { tongan: 'Mohe ʻi ___!',          english: "Sleep there! (where you are)",                         answer: 'hena', why: 'hena = "there" near the listener. The location belongs to whoever is being addressed.' },
  { tongan: 'Té u tangutu pē ___.',  english: "I'll just sit over there. (gesturing to a third spot)", answer: 'he',  why: 'hē points wherever the speaker indicates: neither near speaker nor near listener.' },
  { tongan: 'Nofo ʻi ___!',          english: "Sit there! (where I'm pointing)",                       answer: 'he',   why: 'hē when the speaker is pointing at a place neither near themselves nor near the listener.' },
  { tongan: 'Tau hiva ___.',         english: "Let's sing here. (where the speaker is)",               answer: 'heni', why: 'heni = "here" near me.' },
  { tongan: 'Tau nofo ʻi ___.',      english: "Let's stay there. (near you)",                          answer: 'hena', why: 'hena = "there" near the listener.' },
  { tongan: 'Kai ʻi ___!',           english: "Eat over there! (gesturing to a place)",                answer: 'he',   why: 'hē for a place the speaker is pointing to.' },
]

export default function DemonstrativePickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which place demonstrative fills the blank?"
      promptLabel="Sentence"
    />
  )
}
