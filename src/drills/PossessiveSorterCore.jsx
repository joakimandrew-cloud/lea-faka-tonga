import SorterCore from './SorterCore'

const CATEGORIES = [
  {
    id: 'e_class',
    label: 'e_class',
    prefix_example: 'ʻeku X',
    principle: 'I do it / I make it / I dominate it',
  },
  {
    id: 'ho_class',
    label: 'ho_class',
    prefix_example: 'hoku X',
    principle: 'I am associated with it',
  },
]

const CARDS = [
  // ── Easy ho_class ──
  { tongan: 'fale',     english: 'house',     category: 'ho_class', why: 'A house is older than you and will outlast you. You live inside it; you don\u2019t produce it with your body. Dwelling places are ho_class.' },
  { tongan: 'faʻē',     english: 'mother',    category: 'ho_class', why: 'Your mother existed before you did. Family elders are always ho_class — you are the associated one, not the maker.' },
  { tongan: 'tamai',    english: 'father',    category: 'ho_class', why: 'Same logic as faʻē. Parents exist independent of you. You are their child, associated by relation.' },
  { tongan: 'nima',     english: 'hand',      category: 'ho_class', why: 'Body parts ARE you. You don\u2019t do your hand; your hand is the thing that does. All body parts are ho_class.' },
  { tongan: 'tokoua',   english: 'sibling',   category: 'ho_class', why: 'Family members exist independent of you. Siblings, parents, spouses — ho_class. The principle is association, not creation.' },
  { tongan: 'fonua',    english: 'land',      category: 'ho_class', why: 'Land is eternal; you belong to it, not the other way around. A classic ho_class noun.' },

  // ── Easy e_class ──
  { tongan: 'tohi',     english: 'book',      category: 'e_class', why: 'You read it, own it, handle it. Books are objects you act upon — the reading is yours, the book depends on that. e_class.' },
  { tongan: 'hele',     english: 'knife',     category: 'e_class', why: 'Tools you wield are e_class. The knife cuts because YOU cut with it. Your action dominates.' },
  { tongan: 'kato',     english: 'basket',    category: 'e_class', why: 'Woven and used. You made it (or someone did), and it serves your purpose. e_class.' },
  { tongan: 'meʻakai',  english: 'food',      category: 'e_class', why: 'You prepare it, you eat it, it becomes you. Food is maximally "dependent on the doer." e_class.' },

  // ── Surprising e_class (these teach the rule) ──
  { tongan: 'ika',      english: 'fish',      category: 'e_class', why: 'Counterintuitive to English speakers: fish are e_class because you catch and eat them — they\u2019re dependents in your food chain. This is the Tongan ontological move: the "my" depends on what you DO with the noun, not its inherent category.' },
  { tongan: 'moa',      english: 'chicken',   category: 'e_class', why: 'Same logic as ika. You raise chickens, you eat their eggs, you cook them. You dominate the relationship. e_class.' },
  { tongan: 'faiako',   english: 'teacher',   category: 'e_class', why: 'The most surprising case. "My teacher" is `ʻeku faiako`, not `hoku faiako`. Why? Because in the relationship "my teacher," YOU are the principal — the teaching exists for your sake. The teacher is the receiver of your studentship. This cracks the rule open.' },
  { tongan: 'tamasiʻi', english: 'boy',       category: 'e_class', why: 'A child of yours is e_class — you are the responsible party, the dependency flows to the child. (Strangers\u2019 children or boys in general may sit differently — the class reflects the possession relationship, not the noun itself.)' },

  // ── A tricky ho_class to balance ──
  { tongan: 'vaka',     english: 'boat',      category: 'ho_class', why: 'Boats are ho_class — they\u2019re substantial possessions that existed before this use of them. Contrast with `hele` (knife, e_class): both are tools, but the boat is more "dwelling than wielding." Tongan treats durable, immovable-ish things as ho_class.' },
  { tongan: 'kofu',     english: 'clothes',   category: 'ho_class', why: 'Clothes are ho_class — they\u2019re external to you, something you put on. Notice the contrast with meʻakai (food, e_class): food becomes you; clothes stay separate. The principle is integration vs association.' },
]

export default function PossessiveSorterCore() {
  return (
    <SorterCore
      categories={CATEGORIES}
      cards={CARDS}
      question="Which class of possession?"
      formatRightForm={(card) => card.category === 'e_class' ? `ʻeku ${card.tongan}` : `hoku ${card.tongan}`}
      formatWrongForm={(card) => card.category === 'e_class' ? `hoku ${card.tongan}` : `ʻeku ${card.tongan}`}
      rightFormNote={(card) => `the correct form for "my ${card.english}"`}
      wrongFormNote={() => 'would be wrong'}
    />
  )
}
