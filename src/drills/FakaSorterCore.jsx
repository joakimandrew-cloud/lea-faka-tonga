/**
 * FakaSorterCore — Ch 32 drill, "what does faka- do here?"
 *
 * faka- is one prefix doing four jobs. The student sees a faka- word
 * and sorts it into its function bin. The drill cements the four-way
 * distinction the chapter sets up in its summary table.
 */

import SorterCore from './SorterCore'

const CATEGORIES = [
  {
    id: 'manner',
    label: 'Manner / likeness',
    principle: 'in the manner of, -ish, -wise',
  },
  {
    id: 'causative',
    label: 'Causative',
    principle: 'cause to be / make happen',
  },
  {
    id: 'temporal',
    label: 'Temporal',
    principle: 'every X (every day, every week)',
  },
  {
    id: 'pertaining-to-one',
    label: 'Pertaining to one',
    principle: 'narrows to ONE particular X (faka-e-)',
  },
]

const CARDS = [
  // ── Manner / likeness ──
  { tongan: 'faka-Tonga',  english: 'in the Tongan way',   category: 'manner', why: 'Tonga is a proper place name. faka- + place name = manner adverb. Hyphenated because the base is a proper name.' },
  { tongan: 'faka-Pālangi', english: 'in the European way', category: 'manner', why: 'Pālangi (European) is a proper noun. Same pattern as faka-Tonga: faka- + place/people name produces a manner adverb.' },
  { tongan: 'fakatuʻi',    english: 'kingly, royal',        category: 'manner', why: 'tuʻi means "king" (a common noun). faka- + common noun = manner/likeness. Closed compound, no hyphen.' },
  { tongan: 'fakaako',     english: 'pertaining to school', category: 'manner', why: 'ako means "school, learning". faka- here gives the "in the manner of / pertaining to" sense for the category in general.' },

  // ── Causative ──
  { tongan: 'fakamohe',    english: 'put to sleep',        category: 'causative', why: 'mohe is an intransitive verb meaning "to sleep". faka- + intransitive verb = causative: cause someone to sleep.' },
  { tongan: 'fakalelei',   english: 'mend, make good',     category: 'causative', why: 'lelei means "good" (an adjective). faka- + adjective = causative: cause to be good, i.e. mend.' },
  { tongan: 'fakatotonu',  english: 'straighten',          category: 'causative', why: 'totonu means "straight, correct". faka- makes it transitive-causative: cause to be straight, straighten out.' },
  { tongan: 'fakafoʻou',   english: 'renew',               category: 'causative', why: 'foʻou means "new". faka- + adjective = "make X". fakafoʻou = make new, restore.' },
  { tongan: 'fakataha',    english: 'assemble, gather',    category: 'causative', why: 'taha means "one". faka- + intransitive with no object = reflexive causative: cause oneself (collectively) to become one. The group does it to itself.' },
  { tongan: 'fakamamaʻo',  english: 'depart, move away',   category: 'causative', why: 'mamaʻo means "far, distant". Reflexive causative: cause oneself to be far. Subject acts on itself.' },

  // ── Temporal "every X" ──
  { tongan: 'fakaʻaho',    english: 'daily',                category: 'temporal', why: 'ʻaho means "day" (a time noun). faka- + time noun = "every X". fakaʻaho = every day = daily.' },
  { tongan: 'fakauike',    english: 'weekly',               category: 'temporal', why: 'uike means "week". faka- + time noun = "every week" = weekly. Sits as an adverb after the verb.' },
  { tongan: 'fakataʻu',    english: 'yearly',               category: 'temporal', why: 'taʻu means "year". Same time-noun pattern: faka- creates the adverb meaning "every year".' },
  { tongan: 'fakamāhina',  english: 'monthly',              category: 'temporal', why: 'māhina means "month". faka- + time noun = monthly. The four time-noun forms (ʻaho, uike, māhina, taʻu) all behave the same way.' },

  // ── Pertaining to one (faka-e-) ──
  { tongan: 'fakaekolo',   english: 'pertaining to ONE particular village', category: 'pertaining-to-one', why: 'kolo means "village". The compound prefix faka-e- narrows to one specific village, vs fakakolo which would mean "village-related in general". The extra -e- is the disambiguator.' },
  { tongan: 'fakaefonua',  english: 'pertaining to ONE particular country', category: 'pertaining-to-one', why: 'fonua means "country, land". faka-e-fonua singles out one country. Without the -e-, fakafonua would be the manner/general form.' },
]

export default function FakaSorterCore() {
  return (
    <SorterCore
      categories={CATEGORIES}
      cards={CARDS}
      question="What is faka- doing here?"
      formatRightForm={(card) => card.tongan}
      rightFormNote={(card) => `means "${card.english}"`}
    />
  )
}
