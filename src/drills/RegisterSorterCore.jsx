/**
 * RegisterSorterCore — Ch 53.
 *
 * Tongan respect language has up to five vocabulary levels for the
 * same concept. This drill takes words for "to eat" / "to go" /
 * "to be well" and asks the student to identify which level each
 * belongs to.
 *
 * Five levels: ordinary (everyday), polite (general courtesy),
 * honorific (chiefs / officials), regal (sovereign / God), derogatory
 * (used of self when speaking up).
 */

import SorterCore from './SorterCore'

const CATEGORIES = [
  { id: 'ordinary',   label: 'Ordinary',   principle: 'everyday, neutral' },
  { id: 'polite',     label: 'Polite',     principle: 'general courtesy' },
  { id: 'honorific',  label: 'Honorific',  principle: 'for chiefs / high officials' },
  { id: 'regal',      label: 'Regal',      principle: 'for the sovereign or God' },
  { id: 'derogatory', label: 'Derogatory', principle: 'humble, of oneself before higher rank' },
]

const CARDS = [
  // ── To eat ──
  { tongan: 'kai',       english: '"to eat": everyday speech',                category: 'ordinary',   why: 'kai is the unmarked, neutral word for eating.' },
  { tongan: 'tokoni',    english: '"to eat": polite (literally "help")',      category: 'polite',     why: 'In polite contexts, tokoni (ordinary meaning "help") is used as the courteous word for eating. Context disambiguates.' },
  { tongan: 'ʻilo',      english: '"to eat": to a chief (lit. "know")',       category: 'honorific',  why: 'When addressing or referring to chiefs, ʻilo (ordinary "know") is the honorific word for eating.' },
  { tongan: 'taumafa',   english: '"to eat": to the sovereign',               category: 'regal',      why: 'Reserved for the sovereign. Using anything lower would be a serious social error.' },
  { tongan: 'mama',      english: '"to eat": humble of oneself (lit. "chew")', category: 'derogatory', why: 'Used to refer to one\u2019s OWN eating when speaking to someone of higher rank.' },

  // ── To go (farewells) ──
  { tongan: 'ʻalu ā',    english: '"goodbye": everyday',                       category: 'ordinary',   why: '"ʻAlu ā!" is the standard farewell to someone leaving.' },
  { tongan: 'fakaʻau ā', english: '"goodbye": polite',                         category: 'polite',     why: 'fakaʻau is the polite alternative to ʻalu in farewells.' },
  { tongan: 'meʻa ā',    english: '"goodbye": to a chief',                     category: 'honorific',  why: 'meʻa is the honorific verb of motion for chiefs.' },
  { tongan: 'hāʻele ā',  english: '"goodbye": to the sovereign',               category: 'regal',      why: 'Reserved for the sovereign.' },

  // ── To be well (greetings) ──
  { tongan: 'lelei',      english: '"well": Mālō e leleí (everyday hello)',   category: 'ordinary',   why: 'lelei = ordinary "well", as in the standard greeting Mālō e leleí.' },
  { tongan: 'malakilaki', english: '"well": Mālō e malakilakí (to a chief)',  category: 'honorific',  why: 'malakilaki replaces lelei in the formula when addressing or referring to a chief.' },
]

export default function RegisterSorterCore() {
  return (
    <SorterCore
      categories={CATEGORIES}
      cards={CARDS}
      question="Which respect level does this word belong to?"
      formatRightForm={(card) => card.tongan}
      rightFormNote={(card) => card.english.split(': ')[1] || ''}
    />
  )
}
