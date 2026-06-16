/**
 * IntroduceYourselfCore — Ch 14.
 *
 * The two set-phrase exchanges for meeting someone: name and age.
 *   Ko hai ho hingoa?  → Ko [name] au.
 *   Ko ho taʻu fiha eni? → Ko hoku taʻu [number] eni.
 *
 * The drill alternates direction. Most items show the spoken line (a
 * question, or a reply) plus an English cue and ask for the matching
 * Tongan line; you tap the correct set phrase. Treat each whole line as
 * a memorised formula, as the chapter does.
 *
 * Every Tongan token is from book/Chapter-14.md: the questions and the
 * Sione/Mele/Siale/Tēvita name replies are verbatim there; the age
 * replies follow the chapter's own "Ko hoku taʻu [number] eni" template
 * (Ch 14), with the numbers from book/Chapter-20.md.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'q-name',  label: 'Ko hai ho hingoa?',         detail: 'What is your name?' },
  { id: 'q-age',   label: 'Ko ho taʻu fiha eni?',       detail: 'How old are you?' },
  { id: 'a-sione', label: 'Ko Sione au.',               detail: 'I am Sione.' },
  { id: 'a-mele',  label: 'Ko Mele au.',                detail: 'I am Mele.' },
  { id: 'a-siale', label: 'Ko Siale au.',               detail: 'I am Siale.' },
  { id: 'a-20',    label: 'Ko hoku taʻu uofulu eni.',   detail: 'I am twenty.' },
  { id: 'a-10',    label: 'Ko hoku taʻu hongofulu eni.', detail: 'I am ten.' },
  { id: 'a-tolu',  label: 'Ko hoku taʻu tolu eni.',     detail: 'I am three.' },
]

const PROMPTS = [
  {
    tongan: 'Ko hai ho hingoa?',
    english: 'Someone asks your name. Your name is Sione.',
    answer: 'a-sione',
    why: '“Ko hai ho hingoa?” (What is your name?) is answered with the ko + name + au pattern: Ko Sione au = “I am Sione.”',
  },
  {
    tongan: 'Ko hai ho hingoa?',
    english: 'Someone asks your name. Your name is Mele.',
    answer: 'a-mele',
    why: 'Same ko + name + au reply, with your own name in the slot: Ko Mele au = “I am Mele.”',
  },
  {
    tongan: 'Ko hai ho hingoa?',
    english: 'Someone asks your name. Your name is Siale.',
    answer: 'a-siale',
    why: 'Ko Siale au = “I am Siale.” The question stays the same; only the name in the ko … au frame changes.',
  },
  {
    tongan: 'Ko ho taʻu fiha eni?',
    english: 'Someone asks your age. You are 20.',
    answer: 'a-20',
    why: '“Ko ho taʻu fiha eni?” (How old are you?) is answered with Ko hoku taʻu [number] eni. For 20: Ko hoku taʻu uofulu eni.',
    note: 'uofulu = 20.',
  },
  {
    tongan: 'Ko ho taʻu fiha eni?',
    english: 'Someone asks your age. You are 10.',
    answer: 'a-10',
    why: 'Same age formula, Ko hoku taʻu [number] eni, with the number for 10 (hongofulu): Ko hoku taʻu hongofulu eni.',
    note: 'hongofulu = 10.',
  },
  // Reverse direction: a reply is spoken; pick the question it answers.
  {
    tongan: 'Ko Mele au.',
    english: 'Mele just said this. Which question was she answering?',
    answer: 'q-name',
    why: 'Ko Mele au (“I am Mele”) names a person, so it answers Ko hai ho hingoa? (What is your name?).',
  },
  {
    tongan: 'Ko hoku taʻu uofulu eni.',
    english: 'Someone just said this. Which question were they answering?',
    answer: 'q-age',
    why: 'Ko hoku taʻu uofulu eni (“I am twenty”) gives a year-count, so it answers Ko ho taʻu fiha eni? (How old are you?).',
  },
  {
    tongan: 'Ko ho taʻu fiha eni?',
    english: 'Someone asks your age. You are 3.',
    answer: 'a-tolu',
    why: 'Ko hoku taʻu [number] eni again, with tolu (3): Ko hoku taʻu tolu eni.',
    note: 'tolu = 3.',
  },
]

export default function IntroduceYourselfCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Tap the correct Tongan line."
      promptLabel="They say"
    />
  )
}
