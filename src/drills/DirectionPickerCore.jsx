/**
 * DirectionPickerCore — Ch 28.
 *
 * Six directional particles attach to verbs to show which way the
 * action moves. Three are person-based (mai/atu/ange — toward me /
 * toward you / toward someone else); three are physical (hake/hifo/holo
 * — up / down / around). The drill turns the English direction into
 * the right particle.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'mai',  label: 'mai',  detail: 'toward me (1st person)' },
  { id: 'atu',  label: 'atu',  detail: 'toward you (2nd person)' },
  { id: 'ange', label: 'ange', detail: 'toward him/her (3rd)' },
  { id: 'hake', label: 'hake', detail: 'up' },
  { id: 'hifo', label: 'hifo', detail: 'down' },
  { id: 'holo', label: 'holo', detail: 'around / about' },
]

const PROMPTS = [
  { tongan: 'Haʻu ___!',                            english: 'Come here! (toward me)',                                 answer: 'mai',  why: 'mai pulls action toward the speaker.' },
  { tongan: 'ʻAlu ___!',                            english: 'Go away! (away from me, toward you)',                    answer: 'atu',  why: 'atu pushes action away from the speaker, toward the listener.' },
  { tongan: 'Tala ___ ke haʻu!',                    english: 'Tell him to come! (sending the message to a third person)', answer: 'ange', why: 'ange directs action toward a third person — neither speaker nor listener.' },
  { tongan: 'Naʻe tō ___ ʻa e kató mei he lolí.',   english: 'The basket fell down from the truck.',                   answer: 'hifo', why: 'hifo marks downward movement.' },
  { tongan: 'Sio ___ ki he laní!',                  english: 'Look up at the sky!',                                    answer: 'hake', why: 'hake marks upward movement / direction.' },
  { tongan: 'Naʻa mau ō ___ ʻo mamata.',            english: 'We went around and looked.',                              answer: 'holo', why: 'holo marks movement around / in various directions, no fixed destination.' },
  { tongan: 'Foki ___!',                            english: 'Come back! (to where I am)',                              answer: 'mai',  why: 'foki + mai = come back here. mai because the destination is the speaker.' },
  { tongan: 'Téu tala ___.',                        english: 'I will tell you. (sending the telling toward you)',       answer: 'atu',  why: 'atu when the action is directed at the listener (the "you" in the sentence).' },
  { tongan: 'ʻOkú ne ʻave ___ ʻa e kató ki he faiakó.', english: 'She is taking the basket to the teacher.',            answer: 'ange', why: 'ange because the destination is a third person (the teacher).' },
]

export default function DirectionPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which directional particle fills the blank?"
      promptLabel="Sentence"
    />
  )
}
