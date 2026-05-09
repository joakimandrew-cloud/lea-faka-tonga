/**
 * SpatialNounPickerCore — Ch 40.
 *
 * Eight spatial nouns Tongan places before another noun to express
 * precise spatial relationships. The drill turns the English position
 * (inside / under / on top of / beside / etc.) into the right Tongan
 * noun.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'loto',     label: 'loto',     detail: 'inside / interior' },
  { id: 'lalo',     label: 'lalo',     detail: 'under / underneath' },
  { id: 'tua',      label: 'tuʻa',     detail: 'outside / behind' },
  { id: 'mata',     label: 'mata',     detail: 'in front of' },
  { id: 'funga',    label: 'funga',    detail: 'on top of / surface' },
  { id: 'vee',      label: 'veʻe',     detail: 'right beside (at ground level)' },
  { id: 'mui',      label: 'mui',      detail: 'at the end / far side of' },
  { id: 'tafaaki',  label: 'tafaʻaki', detail: 'at the side of / beside' },
]

const PROMPTS = [
  { tongan: 'Naʻe tuku ʻa e helé ʻi ___ falé.',           english: 'The knife was put inside the house.',          answer: 'loto',  why: 'loto = inside the building. Goes directly before the noun.' },
  { tongan: 'Naʻá ku ʻilo hoku hele ʻi ___ mohengá.',     english: 'I found my knife under the bed.',              answer: 'lalo',  why: 'lalo = under / below.' },
  { tongan: 'Naʻá ku tuʻu pē he ___ falé.',                english: 'I stood just outside the house.',              answer: 'tua',   why: 'tuʻa = outside / behind. Familiar from "outsiders" sense.' },
  { tongan: 'ʻOku nofo mai ʻa e fefiné mei he ___ falé.', english: 'The woman is sitting in front of the house.',  answer: 'mata',  why: 'mata = front. Used most naturally with buildings, villages, and groups of trees.' },
  { tongan: 'ʻOku hilí ʻa e tohí he ___ tēpilé.',          english: 'The book is on top of the table.',             answer: 'funga', why: 'funga = top / surface.' },
  { tongan: 'Tali mai he ___ halá!',                       english: 'Wait for me by the roadside.',                  answer: 'vee',   why: 'veʻe = right beside, at ground level. Variant of vaʻe (foot).' },
  { tongan: 'ʻOku tuku ʻa e meʻakaí he ___ falá.',         english: 'The food is placed on top of the mat.',         answer: 'funga', why: 'funga = on top of / on the surface of.' },
  { tongan: 'ʻOku va\u02BBinga ʻa e fānaú he ___ falé.',   english: 'The children are playing outside the house.',   answer: 'tua',   why: 'tuʻa = outside.' },
  { tongan: 'Naʻe tuku ʻa e pa\u02BBangá he ___ falá.',    english: 'The money was put under the mat.',              answer: 'lalo',  why: 'lalo = under.' },
  { tongan: 'ʻOku nofo ʻa Sione ʻi he ___ tēpilé.',        english: 'Sione is sitting at the end of the table.',     answer: 'mui',     why: 'mui = end / far side. Goes before the noun: mui tēpilé = "end of the table".' },
  { tongan: 'Naʻe ʻalu ʻa e tamasiʻí ki ___ fonuá.',       english: 'The boy went to the far end of the land.',      answer: 'mui',     why: 'mui = end / far side, used for the furthest reach of a place.' },
  { tongan: 'ʻOku tuʻu ʻa e fuʻu ʻakau he ___ falé.',      english: 'The tree stands beside the house.',              answer: 'tafaaki', why: 'tafaʻaki = at the side of / beside.' },
  { tongan: 'Nofo hifo he ___ ʻo Tēvita!',                 english: 'Sit down beside David.',                         answer: 'tafaaki', why: 'tafaʻaki = beside. With a person, takes ʻo (tafaʻaki ʻo Tēvita).' },
]

export default function SpatialNounPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which spatial noun fills the blank?"
      promptLabel="Sentence"
    />
  )
}
