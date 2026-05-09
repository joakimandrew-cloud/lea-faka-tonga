/**
 * ReciprocityPickerCore — Ch 49.
 *
 * The fe-...-ʻaki wrapper turns a verb into its reciprocal form ("X
 * each other"). Given an English meaning ("they love each other") and
 * a base verb (ʻofa = love), pick the correct fe-...-ʻaki form.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'feofaaki',     label: 'feʻofaʻaki',     detail: 'love one another' },
  { id: 'fetokoniaki',  label: 'fetokoniʻaki',   detail: 'help each other' },
  { id: 'feleaaki',     label: 'feleaʻaki',      detail: 'speak to each other' },
  { id: 'fetalanoaaki', label: 'fetalanoaʻaki',  detail: 'converse with one another' },
  { id: 'fetohiaki',    label: 'fetohiʻaki',     detail: 'write to each other' },
  { id: 'fealuaki',     label: 'feʻaluʻaki',     detail: 'go back and forth' },
]

const PROMPTS = [
  { tongan: 'ʻOku nau ___.',                  english: 'They love one another. (base: ʻofa)',                            answer: 'feofaaki',     why: 'fe- + ʻofa + -ʻaki → feʻofaʻaki. Reciprocal pattern always wraps the base verb with both prefix and suffix.' },
  { tongan: 'ʻOkú ma ___.',                   english: 'We two help each other. (base: tokoni)',                          answer: 'fetokoniaki',  why: 'fe- + tokoni + -ʻaki → fetokoniʻaki. Subject must be dual or plural for reciprocals.' },
  { tongan: 'ʻOku totonu ke ta ___.',         english: 'We (two) should speak to each other. (base: lea)',                answer: 'feleaaki',     why: 'fe- + lea + -ʻaki → feleaʻaki.' },
  { tongan: 'Naʻa nau ___ ʻi he efiafí.',     english: 'They talked to one another in the evening. (base: talanoa)',     answer: 'fetalanoaaki', why: 'fe- + talanoa + -ʻaki → fetalanoaʻaki.' },
  { tongan: 'ʻOku tau ___ tuʻo lahi.',         english: 'We (incl.) write to each other often. (base: tohi)',              answer: 'fetohiaki',    why: 'fe- + tohi + -ʻaki → fetohiʻaki.' },
  { tongan: 'Naʻa nau ___ ʻi Tonga.',          english: 'They went back and forth in Tonga. (base: ʻalu)',                 answer: 'fealuaki',     why: 'fe- + ʻalu + -ʻaki → feʻaluʻaki. With movement verbs, this gives the back-and-forth (reciprocative) sense.' },
]

export default function ReciprocityPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which fe-…-ʻaki form fits?"
      promptLabel="Reciprocal sentence"
    />
  )
}
