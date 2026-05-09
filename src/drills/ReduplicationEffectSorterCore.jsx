/**
 * ReduplicationEffectSorterCore — Ch 50.
 *
 * Tongan reduplication produces several different effects depending on
 * the base word. The drill sorts reduplicated words into their effect
 * categories: intensification, moderation, plurality/repetition, or
 * part-of-speech change.
 */

import SorterCore from './SorterCore'

const CATEGORIES = [
  { id: 'intensify', label: 'Intensification',  principle: 'amplifies / strengthens the meaning' },
  { id: 'moderate',  label: 'Moderation',       principle: 'softens to "somewhat / a little"' },
  { id: 'plural',    label: 'Plurality',        principle: 'more than one, repetition, sustained' },
  { id: 'shift',     label: 'Part-of-speech shift', principle: 'changes word class (noun→adj, etc.)' },
]

const CARDS = [
  { tongan: 'ʻuliʻuli',     english: 'black (from ʻuli "dirty")',                  category: 'intensify', why: 'Reduplication of ʻuli (dirty) intensifies → ʻuliʻuli = "very dirty / black".' },
  { tongan: 'māmāfana',     english: 'lukewarm (from māfana "warm")',              category: 'moderate',  why: 'Reduplication softens → "somewhat warm / lukewarm".' },
  { tongan: 'kupukupu',     english: 'segments (from kupu "single segment")',       category: 'plural',    why: 'Reduplication signals plurality / multiple instances.' },
  { tongan: 'luoluo',       english: 'full of holes (from luo "hole")',            category: 'shift',     why: 'Noun → adjective. luo (hole, noun) becomes luoluo (holey, adjective).' },
  { tongan: 'katakata',     english: 'smile (from kata "laugh")',                  category: 'moderate',  why: 'Reduplication softens → "laugh slightly / smile". Smile = a soft laugh.' },
  { tongan: 'mokomoko',     english: 'cool (from momoko "cold")',                  category: 'moderate',  why: 'Softens "cold" to "cool" — somewhat cold, not fully cold.' },
  { tongan: 'mamata',       english: 'to look / watch (from mata "face / eye")',   category: 'shift',     why: 'Noun → verb. mata (face, noun) becomes mamata (look, verb).' },
  { tongan: 'havilivili',   english: 'breeze (from havili "strong wind")',         category: 'moderate',  why: 'Softens strong wind → gentle breeze.' },
  { tongan: 'tositosi',     english: 'peck repeatedly (from tosi "peck once")',    category: 'plural',    why: 'Marks repeated action — peck again and again.' },
  { tongan: 'totototo',     english: 'blood-red (from toto "blood")',              category: 'shift',     why: 'Noun → adjective. toto (blood, noun) becomes totototo (blood-red, adjective).' },
]

export default function ReduplicationEffectSorterCore() {
  return (
    <SorterCore
      categories={CATEGORIES}
      cards={CARDS}
      question="What effect does the reduplication have?"
      formatRightForm={(card) => card.tongan}
      rightFormNote={(card) => `means "${card.english.split(' (')[0]}"`}
    />
  )
}
