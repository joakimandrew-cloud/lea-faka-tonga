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
  { tongan: 'kai',       english: 'to eat', category: 'ordinary',   why: 'kai is the unmarked, neutral word for eating: everyday speech.' },
  { tongan: 'tokoni',    english: 'to eat', category: 'polite',     why: 'In polite contexts, tokoni (ordinary meaning "help") is used as the courteous word for eating. Context disambiguates.' },
  { tongan: 'ʻilo',      english: 'to eat', category: 'honorific',  why: 'When addressing or referring to chiefs, ʻilo (ordinary "know") is the honorific word for eating.' },
  { tongan: 'taumafa',   english: 'to eat', category: 'regal',      why: 'Reserved for the sovereign. Using anything lower would be a serious social error.' },
  { tongan: 'mama',      english: 'to eat', category: 'derogatory', why: 'Humble of oneself (literally "chew"): used to refer to one\u2019s OWN eating when speaking to someone of higher rank.' },

  // ── To go (farewells) ──
  { tongan: 'ʻalu ā',    english: 'goodbye', category: 'ordinary',   why: '"ʻAlu ā!" is the standard, everyday farewell to someone leaving.' },
  { tongan: 'fakaʻau ā', english: 'goodbye', category: 'polite',     why: 'fakaʻau is the polite alternative to ʻalu in farewells.' },
  { tongan: 'meʻa ā',    english: 'goodbye', category: 'honorific',  why: 'meʻa is the honorific verb of motion, used in farewells to a chief.' },
  { tongan: 'hāʻele ā',  english: 'goodbye', category: 'regal',      why: 'hāʻele is reserved for the sovereign.' },

  // ── To be well (greetings) ──
  { tongan: 'lelei',      english: 'well', category: 'ordinary',   why: 'lelei = ordinary "well", as in the standard everyday greeting Mālō e leleí.' },
  { tongan: 'malakilaki', english: 'well', category: 'honorific',  why: 'malakilaki replaces lelei in the formula when addressing or referring to a chief: Mālō e malakilakí.' },
]

export default function RegisterSorterCore() {
  return (
    <SorterCore
      categories={CATEGORIES}
      cards={CARDS}
      question="Which respect level does this word belong to?"
      hideGloss
      formatRightForm={(card) => card.tongan}
      rightFormNote={(card) => card.english.split(': ')[1] || ''}
    />
  )
}
