/**
 * KinshipPossessiveCore — Phase 3G: "my / your / his" for family.
 *
 * Relatives almost all take the ho-class possessive (hoku tokoua = my
 * sibling, hoku kāinga = my relative). Parents and children are the famous
 * exception: they take the 'e-class (ʻeku tamai = my father, ʻeku faʻē =
 * my mother, ʻeku fānau = my children). The drill isolates that exception
 * and pairs it with the person (my / your / his), so the learner picks the
 * possessive by BOTH the kin term's class and the person.
 *
 * Scope note: Tongan's relative-sex sibling vocabulary is NOT taught in the
 * book, so it is deliberately out of scope here — this drill uses only the
 * kin terms and class assignments the book gives (book/Chapter-29.md L70:
 * relatives ho-class, parents/children e-class; possessive forms Ch17 /
 * Ch45 L19-21; ho-class hono Ch29 L154).
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'eku',  label: 'ʻeku', detail: 'my: e-class (parents & children)' },
  { id: 'hoo',  label: 'hoʻo', detail: 'your: e-class' },
  { id: 'ene',  label: 'ʻene', detail: 'his / her: e-class' },
  { id: 'hoku', label: 'hoku', detail: 'my: ho-class (other relatives)' },
  { id: 'ho',   label: 'ho',   detail: 'your: ho-class' },
  { id: 'hono', label: 'hono', detail: 'his / her: ho-class' },
]

const PROMPTS = [
  { tongan: '___ tamai',  english: 'my father',      answer: 'eku',  why: 'Parents are the e-class exception, so "my father" is ʻeku tamai (not hoku).' },
  { tongan: '___ tamai',  english: 'your father',    answer: 'hoo',  why: 'Parents take e-class; second person "your" in the e-class is hoʻo: hoʻo tamai.' },
  { tongan: '___ faʻē',   english: 'my mother',      answer: 'eku',  why: 'Mother is a parent, so e-class: ʻeku faʻē.' },
  { tongan: '___ tamai',  english: 'his father',     answer: 'ene',  why: 'Parents take e-class; third person is ʻene: ʻene tamai.' },
  { tongan: '___ fānau',  english: 'my children',    answer: 'eku',  why: 'Children are the e-class exception alongside parents: ʻeku fānau.' },
  { tongan: '___ tokoua', english: 'my sibling',     answer: 'hoku', why: 'Siblings (like most relatives) are ho-class: hoku tokoua.' },
  { tongan: '___ tokoua', english: 'your sibling',   answer: 'ho',   why: 'Siblings are ho-class; second person "your" in the ho-class is ho: ho tokoua.' },
  { tongan: '___ tokoua', english: 'his sibling',    answer: 'hono', why: 'Siblings are ho-class; third person is hono: hono tokoua.' },
  { tongan: '___ kāinga', english: 'my relative',    answer: 'hoku', why: 'Relatives outside the parent/child line are ho-class: hoku kāinga.' },
  { tongan: '___ kāinga', english: 'his relative',   answer: 'hono', why: 'Relatives are ho-class; third person is hono: hono kāinga.' },
]

export default function KinshipPossessiveCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which possessive fits this relative?"
      promptLabel="Family: my / your / his"
    />
  )
}
