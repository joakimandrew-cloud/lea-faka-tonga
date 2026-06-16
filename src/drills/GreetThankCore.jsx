/**
 * GreetThankCore, Ch 14.
 *
 * The greeting cycle as fixed social formulas: the opening greeting and
 * its echoed reply, the "how are you / just fine" exchange, the mālō-e-X
 * thanks family, and ʻIo as the universal acknowledgement. The drill is
 * situational, read the social moment, pick the right set phrase.
 * (Farewells are a separate drill.)
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'malo-lelei',   label: 'Mālō e lelei!',       detail: 'Hello.' },
  { id: 'io-malo-lelei', label: 'ʻIo, mālō e lelei!',  detail: 'Hello. (reply, echoing the greeting)' },
  { id: 'fefe-hake',    label: 'Fēfē hake?',          detail: 'How are you?' },
  { id: 'sai-pe',       label: 'Sai pē!',             detail: 'Just fine.' },
  { id: 'malo-ofa',     label: 'Mālō e ʻofa!',        detail: 'Thank you for your kindness.' },
  { id: 'malo-tokoni',  label: 'Mālō e tokoni mai!',  detail: "Thanks for your help." },
  { id: 'malo-lava',    label: 'Mālō e lava mai!',    detail: 'Thanks for coming.' },
  { id: 'io',           label: 'ʻIo!',                detail: 'Yes / acknowledged.' },
]

const PROMPTS = [
  {
    tongan: 'You meet someone and want to say hello.',
    english: 'Opening greeting',
    answer: 'malo-lelei',
    why: 'Mālō e lelei! is the standard greeting, literally "the being-in-good-health is worthy of praise."',
  },
  {
    tongan: 'Someone has just greeted you with Mālō e lelei! Greet them back.',
    english: 'Reply to a greeting',
    answer: 'io-malo-lelei',
    why: 'The standard reply repeats the greeting, opened with ʻIo: ʻIo, mālō e lelei!',
  },
  {
    tongan: 'After greeting a friend, you want to ask how they are getting along.',
    english: 'Asking how someone is',
    answer: 'fefe-hake',
    why: 'Fēfē hake? = "How are you?", fēfē (how) plus hake (up/along), "How are you getting along?"',
  },
  {
    tongan: 'A friend asks you Fēfē hake? You are doing well.',
    english: 'Answering "how are you?"',
    answer: 'sai-pe',
    why: 'Sai pē! = "Just fine", sai (good/well) plus pē (just, only). It is a fixed response, not a full sentence.',
  },
  {
    tongan: 'Someone has shown you great kindness. Thank them.',
    english: 'Saying thank you',
    answer: 'malo-ofa',
    why: 'Mālō e ʻofa! = "Thank you for your kindness", literally "the kindness is worthy of praise."',
  },
  {
    tongan: 'A neighbour helped you carry something. Thank them for the help.',
    english: 'Thanks for help',
    answer: 'malo-tokoni',
    why: 'The same mālō e pattern names what you are grateful for: Mālō e tokoni mai! = "Thanks for your help."',
  },
  {
    tongan: 'A visitor has just arrived at your home. Greet them with thanks for coming.',
    english: 'Greeting a visitor on arrival',
    answer: 'malo-lava',
    why: 'Mālō e lava mai! is the usual greeting to a visitor on arrival: "Thanks for coming."',
  },
  {
    tongan: 'Someone greets you with Mālō e ngāue! (Thanks for working.) Give the proper one-word acknowledgement.',
    english: 'Universal acknowledgement',
    answer: 'io',
    why: 'ʻIo is the universal acknowledgement, "It is as you say." It is the proper first word in response to any greeting, compliment, or thanks.',
  },
]

export default function GreetThankCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which formula fits the situation?"
      promptLabel="Situation"
    />
  )
}
