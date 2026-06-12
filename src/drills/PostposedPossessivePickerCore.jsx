/**
 * PostposedPossessivePickerCore — Ch 37.
 *
 * Possessive pronouns AFTER the noun, used to stress ownership: "That
 * basket is MINE." Same doer/receiver class split as the preposed
 * possessives (mirrors DoerReceiverPickerCore):
 *   - ʻaʻaku — mine, ʻe-class (things you act on or control);
 *   - ʻoʻoku — mine, ho-class (things that shelter or define you);
 *   - ʻa hai? / ʻo hai? — "whose?", by the same class split.
 *
 * The deck also covers the predicative use ("ʻOku ʻaʻaku ʻa e kató" —
 * the postposed possessive standing in as the verb).
 *
 * All prompts verified against book/Chapter-37.md: "Ko e kato ia ʻaʻaku"
 * (L12), "Ko e fale ia ʻoʻoku" (L65), "ʻOku ʻaʻaku ʻa e kató" / "ʻOku
 * ʻoʻoku ʻa e falé" (L157-159), "Ko e hele eni ʻa hai?" (L98), "Ko e
 * fale eni ʻo hai?" / "Ko e vaka eni ʻo hai?" (L106-108), and the
 * ʻa hai / ʻo hai table with paʻanga (L117).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'aaku', label: 'ʻaʻaku', detail: 'mine — ʻe-class (things you act on or control)' },
  { id: 'ooku', label: 'ʻoʻoku', detail: 'mine — ho-class (things that shelter or define you)' },
  { id: 'ahai', label: 'ʻa hai', detail: 'whose? — asking about an ʻe-class thing' },
  { id: 'ohai', label: 'ʻo hai', detail: 'whose? — asking about a ho-class thing' },
]

const PROMPTS = [
  { tongan: 'Ko e kato ia ___.',   english: 'That basket is mine.',   answer: 'aaku', why: 'A basket is something you carry and use → ʻe-class, so "mine" after the noun is ʻaʻaku.' },
  { tongan: 'Ko e fale ia ___.',   english: 'That house is mine.',    answer: 'ooku', why: 'A house shelters you → ho-class, so "mine" after the noun is ʻoʻoku.' },
  { tongan: 'ʻOku ___ ʻa e kató.', english: 'The basket is mine.',    answer: 'aaku', why: 'The postposed possessive can stand in as the verb: ʻOku ʻaʻaku ʻa e kató. The basket stays ʻe-class.' },
  { tongan: 'ʻOku ___ ʻa e falé.', english: 'The house is mine.',     answer: 'ooku', why: 'Predicative use again, but a house is ho-class: ʻOku ʻoʻoku ʻa e falé.' },
  { tongan: 'Ko e hele eni ___?',  english: 'Whose knife is this?',   answer: 'ahai', why: 'A knife is a tool you wield → ʻe-class, so "whose?" is ʻa hai.' },
  { tongan: 'Ko e fale eni ___?',  english: 'Whose house is this?',   answer: 'ohai', why: 'A house shelters its owner → ho-class, so "whose?" is ʻo hai.' },
  { tongan: 'Ko e vaka eni ___?',  english: 'Whose boat is this?',    answer: 'ohai', why: 'A boat carries and shelters you, like a house → ho-class: ʻo hai.' },
  { tongan: 'Ko e paʻanga eni ___?', english: 'Whose money is this?', answer: 'ahai', why: 'Money is something you control and spend → ʻe-class: ʻa hai.' },
]

export default function PostposedPossessivePickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which postposed form fills the blank?"
      promptLabel="Whose is it?"
    />
  )
}
