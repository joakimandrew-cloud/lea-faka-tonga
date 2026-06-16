/**
 * ReportingCore — Ch 34.
 *
 * Two ways a speaker steps back from a bare statement:
 *   tokua  — "they say / reportedly": the speaker reports without vouching
 *            for the truth. Position matters: sentence-initial tokua colours
 *            the WHOLE sentence as secondhand; after the verb it colours only
 *            that clause.
 *   ko ia  — inferential "so / therefore": draws a conclusion from what came
 *            before.
 * Read the English, pick the marker the Tongan needs. The tokua items turn on
 * where the word sits, not just whether it is there.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'tokua', label: 'tokua', detail: 'they say / reportedly (secondhand)' },
  { id: 'koia',  label: 'ko ia', detail: 'so / therefore (a conclusion)' },
]

const PROMPTS = [
  { tongan: '___ kuo foki ʻa Sione ki Fisi.',          english: 'It is said that Sione has returned to Fiji.',          answer: 'tokua', why: 'tokua reports without vouching for it. Sitting at the very start, it colours the whole sentence as secondhand.' },
  { tongan: '___, naʻe ʻikai té u ʻalu ki he fakatahá.', english: 'Therefore, I did not go to the meeting.',              answer: 'koia',  why: 'ko ia at the start (with a pause) is inferential: it draws a conclusion, "therefore".' },
  { tongan: 'ʻOku nofo ___ ʻi Haʻapai.',               english: 'She lives, so they say, in Haʻapai.',                  answer: 'tokua', why: 'tokua after the verb still marks the report as secondhand, but here it colours only this clause, not a whole chain.' },
  { tongan: '___, ʻoku totonu ke ke nofo ʻi ʻapi.',     english: 'Therefore, you should stay at home.',                 answer: 'koia',  why: 'ko ia draws the conclusion: given what came before, you should stay home.' },
  { tongan: 'Naʻá ne pehē ___ ko hono ʻapí pē.',        english: 'He said that it was just his own home (so he claims).', answer: 'tokua', why: 'Post-verbal tokua pairs with pehē: pehē introduces what he said, tokua flags that the current speaker has not verified it.' },
  { tongan: '___ kuo ʻalu ʻa Mele ki kolo.',           english: 'Reportedly Mele has gone to town.',                   answer: 'tokua', why: 'Sentence-initial tokua = "reportedly", colouring the whole report. Same frame as "Tokua kuo foki ʻa Sione ki Fisi".' },
  { tongan: '___, naʻe ʻikai té u kai.',               english: 'So, I did not eat.',                                  answer: 'koia',  why: 'ko ia is the inferential "so / therefore", not a report. It concludes rather than attributing to others.' },
  { tongan: 'Position twist: which placement makes ONLY the last clause secondhand, not the whole sentence?', english: 'after the verb (post-verbal)', answer: 'tokua', why: 'tokua at the start colours the whole sentence; after the verb it colours only that clause. ko ia is never a reporting word, so it cannot do either job.' },
]

export default function ReportingCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which marker does the sentence need: the report or the conclusion?"
      promptLabel="Sentence"
    />
  )
}
