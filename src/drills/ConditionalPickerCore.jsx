/**
 * ConditionalPickerCore — Ch 47.
 *
 * Three conditional openers: kapau (uncertain "if"), ka (expected
 * "when/whenever"), ka ne (counterfactual "had/were"). The drill turns
 * on the speaker's confidence in the outcome.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'kapau', label: 'kapau', detail: 'if (uncertain — may not happen)' },
  { id: 'ka',    label: 'ka',    detail: 'when / whenever (expected)' },
  { id: 'ka-ne', label: 'ka ne', detail: 'had / were (counterfactual — didn\u2019t happen)' },
]

const PROMPTS = [
  { tongan: '___ haʻu ʻa Siale, peá ke tala ki ai.',                 english: 'When Siale comes, tell him. (he is expected)',      answer: 'ka',    why: 'Siale is expected to arrive — the question is when, not whether. ka leans toward the event happening.' },
  { tongan: '___ ʻe haʻu ʻa Sēmisi, té u loto mamahi.',              english: 'If Sēmisi comes, I will be upset. (he probably won\u2019t)', answer: 'kapau', why: 'kapau leaves the outcome open. The speaker doesn\u2019t expect Sēmisi to come.' },
  { tongan: '___ ke haʻu ʻanepō, naʻe ʻikai ke hoko ʻa e meʻa ní.',  english: 'Had you come last night, this thing wouldn\u2019t have happened.', answer: 'ka-ne', why: 'Past counterfactual: the listener did NOT come. ka ne (= kapau naʻe) marks the imagined past.' },
  { tongan: '___ ʻi ai ha ngāue, peá ke tala mai.',                  english: 'Whenever there is work, tell me.',                  answer: 'ka',    why: 'A recurring/expected condition — "whenever". ka, not kapau. (ʻi ai is the existential.)' },
  { tongan: '___ u feinga, naʻá ku lava.',                           english: 'Had I tried, I would have succeeded.',              answer: 'ka-ne', why: 'Past counterfactual: I did NOT try. The main clause uses past tense to express the imagined result.' },
  { tongan: '___ ʻi heni ʻa Tēvita, ʻe hiva.',                       english: 'If Tēvita were here, he would sing. (he isn\u2019t)', answer: 'ka-ne', why: 'Present counterfactual: Tēvita is NOT here. ka ne also covers present-untrue conditions.' },
  { tongan: '___ ʻe ʻuhá, te mau nofo ʻi fale.',                     english: 'If it rains, we will stay in the house. (uncertain)', answer: 'kapau', why: 'Uncertain weather — may or may not rain. kapau leaves the outcome genuinely open (and keeps its tense marker ʻe).' },
]

export default function ConditionalPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which conditional opener fills the blank?"
      promptLabel="Sentence"
    />
  )
}
