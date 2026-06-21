/**
 * BenefactiveSorterCore — Ch 26.
 *
 * The "for" preposition splits the same way as possessives. maʻa
 * marks ʻe-class beneficiaries (food, money, things you control).
 * moʻo marks ho-class beneficiaries (houses, boats, things that
 * shelter or carry you). Same doer/receiver principle as Ch 17.
 */

import SorterCore from './SorterCore'

const CATEGORIES = [
  { id: 'maa', label: 'maʻa',  prefix_example: 'maʻa Tēvita', principle: 'for (ʻe-class: food, money, tools)' },
  { id: 'moo', label: 'moʻo',  prefix_example: 'moʻo Tēvita', principle: 'for (ho-class: houses, boats, land)' },
]

const CARDS = [
  { tongan: 'kato ika',   english: 'a basket of fish (food)',           category: 'maa', why: 'Fish is food → ʻe-class. Use maʻa for the recipient. "This basket of fish is for Tēvita."' },
  { tongan: 'fale',       english: 'a house',                            category: 'moo', why: 'A house shelters its occupant → ho-class. Use moʻo. "The house being built for them."' },
  { tongan: 'paʻanga',    english: 'money',                              category: 'maa', why: 'Money is something you control / spend → ʻe-class. maʻa.' },
  { tongan: 'vaka',       english: 'a boat',                             category: 'moo', why: 'A boat carries / shelters you → ho-class. moʻo.' },
  { tongan: 'meʻakai',    english: 'food',                               category: 'maa', why: 'Food is something you eat / consume → ʻe-class. maʻa.' },
  { tongan: 'kupenga',    english: 'a fishing net (a tool)',             category: 'maa', why: 'A tool you wield → ʻe-class. maʻa.' },
  { tongan: 'kelekele',   english: 'land / a piece of land',             category: 'moo', why: 'Land defines / characterises you → ho-class. moʻo.' },
  { tongan: 'kofu',       english: 'clothing',                           category: 'maa', why: 'Clothes are something you wear / put on → ʻe-class (Lesson 26 table). maʻa. When the class is doubtful, maʻa is the safer default (Churchward 16.45).' },
]

export default function BenefactiveSorterCore() {
  return (
    <SorterCore
      categories={CATEGORIES}
      cards={CARDS}
      question="Which beneficiary marker fits?"
      formatRightForm={(card) => card.category === 'maa' ? `${card.tongan} maʻa Tēvita` : `${card.tongan} moʻo Tēvita`}
      rightFormNote={() => 'the correct beneficiary marker'}
    />
  )
}
