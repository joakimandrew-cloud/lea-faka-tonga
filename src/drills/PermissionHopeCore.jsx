/**
 * PermissionHopeCore, Ch 38.
 *
 * Three ke-idioms that sit on the same subordinator but do different jobs:
 *   tuku ke  , "let / allow" (grant permission)
 *   ʻofa pē ke, "may / I hope that" (express a hope)
 *   fai mo ke, "hurry up and" (urge someone to act quickly)
 * Read the sentence and its meaning, then pick which entry point fits.
 *
 * Every Tongan sentence is taken verbatim from book/Chapter-38.md
 * (line numbers cited per item below).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'tuku',  label: 'tuku ke',    detail: 'let / allow' },
  { id: 'ofa',   label: 'ʻofa pē ke', detail: 'may / I hope that' },
  { id: 'fai',   label: 'fai mo ke',  detail: 'hurry up and' },
]

const PROMPTS = [
  // tuku ke (allow), L12, L18, L20, L26, L28
  { tongan: '___ ʻalu ʻa e fefiné.',          english: 'Let the woman go.',                 answer: 'tuku', why: 'tuku ke = "let" in the sense of "allow / permit". Here the speaker is permitting the woman to go.' },
  { tongan: '___ u fakamahino atu.',          english: 'Let me explain it to you.',         answer: 'tuku', why: 'tuku ke grants permission. With a following pronoun the ke contracts: Tuku ké u.' },
  { tongan: '___ ʻalu ia.',                   english: 'Let him go.',                        answer: 'tuku', why: 'tuku ke = "allow him to go". Note this is "let" as permission, not "let us go".' },
  { tongan: '___ nau ō kinautolu.',           english: 'Let them go.',                       answer: 'tuku', why: 'tuku ke + pronoun + verb: the ke is followed by nau, then the verb ō.' },
  { tongan: '___ ke nofo heni.',              english: 'Let yourself stay here.',           answer: 'tuku', why: 'tuku ke for granting permission. It does NOT cover "let" as a suggestion (for "let us sing", Tongan uses tau hiva instead).' },

  // ʻofa (pē) ke (hope / may), L42, L48, L50
  { tongan: '___ moʻui lelei ʻa e fonuá ni.', english: 'May this country prosper.',          answer: 'ofa',  why: 'ʻofa ke expresses a hope or wish, equivalent to English "may". The verb ʻofa ordinarily means "to love".' },
  { tongan: '___ tau aʻusia e taʻu foʻoú.',   english: 'May we all live until the new year.', answer: 'ofa', why: 'ʻofa pē ke expresses an earnest hope. The pē adds a warmer, more heartfelt tone.' },
  { tongan: '___ mou fiefia ʻi homau kiʻi motú.', english: 'May you all be happy on our little island.', answer: 'ofa', why: 'ʻofa pē ke = "I hope that / may". The hope is directed at the listeners (mou).' },

  // fai mo ke (hurry up and), L153, L155
  { tongan: '___ fakaʻosi ʻo ka tau ō!',      english: 'Hurry and finish so we can go.',     answer: 'fai',  why: 'fai mo ke = "hurry up and", it urges someone to act quickly. It always addresses the second person.' },
  { tongan: '___ ngāue naʻa poʻulí!',         english: 'Get a move on and work before it gets dark.', answer: 'fai', why: 'fai mo ke = "get a move on and". The structure is fai mo ke + verb.' },
]

export default function PermissionHopeCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which ke-idiom fills the blank?"
      promptLabel="Sentence"
    />
  )
}
