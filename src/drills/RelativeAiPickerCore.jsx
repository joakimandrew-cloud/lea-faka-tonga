/**
 * RelativeAiPickerCore — Ch 39.
 *
 * In a relative clause, ai (or ki ai / mei ai) refers back to the
 * noun being described. Which form depends on which preposition the
 * original (non-relative) sentence would have used. Bare ai replaces
 * ʻi-phrases; ki ai replaces ki-phrases; mei ai replaces mei-phrases.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'ai',     label: 'ai',     detail: 'replaces ʻi + place (location at)' },
  { id: 'ki-ai',  label: 'ki ai',  detail: 'replaces ki + place / kia + person (destination)' },
  { id: 'mei-ai', label: 'mei ai', detail: 'replaces mei + place (origin)' },
]

const PROMPTS = [
  { tongan: 'Ko e falé eni ʻokú ne ngāue ___.',                english: 'This is the house he works in.',                answer: 'ai',     why: 'The non-relative would be "ʻokú ne ngāue ʻi he falé". ʻi survives only in the bare ai form.' },
  { tongan: 'Ko e koló ia naʻá ku haʻu ___.',                  english: 'That is the village I came from.',              answer: 'mei-ai', why: 'The non-relative would be "naʻá ku haʻu mei he koló". mei survives in the back-reference.' },
  { tongan: 'Ko e tamasiʻí ia naʻá ku lea ___.',               english: 'That is the boy I spoke to.',                   answer: 'ki-ai',  why: '"naʻá ku lea kia (or ki he) tamasiʻí" → ki survives in the back-reference. People and places both collapse to ki ai.' },
  { tongan: 'Ko e fale lotú eni ʻoku mau lotu ___.',           english: 'This is the church we pray in.',                answer: 'ai',     why: 'Location ʻi → bare ai. "ʻoku mau lotu ʻi he fale lotú".' },
  { tongan: 'Ko e motú ia naʻá ku haʻu ___.',                  english: 'That is the island I came from.',                answer: 'mei-ai', why: 'Origin (mei) → mei ai.' },
  { tongan: 'Ko e meʻá ia naʻá ku fakakaukau ___.',            english: 'That is the thing I thought about.',             answer: 'ki-ai',  why: 'fakakaukau takes ki for its target → ki ai in the back-reference.' },
  { tongan: 'Ko e maketí eni ʻoku faʻa nofo ___ ʻa Mele.',     english: 'This is the market that Mele often stays at.',   answer: 'ai',     why: 'Location ʻi (faʻa nofo ʻi he maketí) → bare ai.' },
]

export default function RelativeAiPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which ai-form completes the relative clause?"
      promptLabel="Sentence"
    />
  )
}
