/**
 * NounClassSorterCore — Ch 46.
 *
 * The full noun classification system on the SorterCore mechanic:
 *   - Personal nouns (people's names, and group words treated like
 *     names) → ʻia / kia / meia, no article;
 *   - Local nouns (place names and quasi-place nouns) → ʻi / ki / mei,
 *     no article;
 *   - Common nouns (everything else) → ʻi he / ki he / mei he, with the
 *     article and the definitive accent.
 *
 * Knowing the class tells you the preposition form — the drill shows the
 * resulting ki-form after each answer.
 *
 * Cards verified against book/Chapter-46.md: the kia Mele / ki kolo /
 * ki he motú and ki he fefiné contrasts (L15-17), kia houʻeiki (L30),
 * ki ngoue (L39), ki tahi vs ki he tahí (L20/L45), and Exercise 1-2
 * answers (kia Lupe, kia Sēmisi as ʻia Sēmisi, ki he faiakó,
 * ki he tamasiʻí, ki Nukuʻalofa, ki Vavaʻu).
 *
 * Gloss is hidden until the learner answers (like FakaSorter): a gloss
 * such as "town" would hand over the category.
 */

import SorterCore from './SorterCore'

const CATEGORIES = [
  { id: 'personal', label: 'Personal', prefix_example: 'kia Mele',    principle: 'a person — ʻia / kia / meia, no article' },
  { id: 'local',    label: 'Local',    prefix_example: 'ki kolo',     principle: 'a place — ʻi / ki / mei, no article' },
  { id: 'common',   label: 'Common',   prefix_example: 'ki he motú',  principle: 'everything else — article he + definitive accent' },
]

const CARDS = [
  { tongan: 'Mele',       english: 'Mele (a woman’s name)',            category: 'personal', kiForm: 'kia Mele',        why: 'A person’s name is self-defining — no article, and ki becomes kia.' },
  { tongan: 'Lupe',       english: 'Lupe (a name)',                          category: 'personal', kiForm: 'kia Lupe',        why: 'A personal name: the preposition takes its -a form, with no article.' },
  { tongan: 'Sēmisi',     english: 'Sēmisi (a name)',                        category: 'personal', kiForm: 'kia Sēmisi',      why: 'A personal name → kia (and ʻia / meia for the other prepositions).' },
  { tongan: 'houʻeiki',   english: 'chiefs, nobility (a group word)',        category: 'personal', kiForm: 'kia houʻeiki',    why: 'Not a proper name, but Tongan treats this group word like one (quasi-personal): kia houʻeiki.' },
  { tongan: 'kolo',       english: 'town (as a general location)',           category: 'local',    kiForm: 'ki kolo',         why: 'A familiar location that needs no further identification → local noun, bare ki and no article.' },
  { tongan: 'Vavaʻu',     english: 'Vavaʻu (an island group)',               category: 'local',    kiForm: 'ki Vavaʻu',       why: 'A place name is already specific → local noun, bare ki.' },
  { tongan: 'Nukuʻalofa', english: 'Nukuʻalofa (the capital)',               category: 'local',    kiForm: 'ki Nukuʻalofa',   why: 'A proper place name → local noun: ki Nukuʻalofa, no article.' },
  { tongan: 'tahi',       english: 'sea (as a general location)',            category: 'local',    kiForm: 'ki tahi',         why: 'Quasi-local: the sea in general needs no article. (A specific body of water becomes common: ki he tahí.)' },
  { tongan: 'ngoue',      english: 'garden, plantation (as a location)',     category: 'local',    kiForm: 'ki ngoue',        why: 'A quasi-place noun referring to a general location → treated as local: ki ngoue.' },
  { tongan: 'tamasiʻi',   english: 'the boy (a specific boy)',               category: 'common',   kiForm: 'ki he tamasiʻí',  why: 'A common noun needs the article and the definitive accent: ki he tamasiʻí.' },
  { tongan: 'motu',       english: 'the island (a specific island)',         category: 'common',   kiForm: 'ki he motú',      why: 'A specific island is a common noun → ki he motú, with article and accent.' },
  { tongan: 'fefine',     english: 'the woman (a specific woman)',           category: 'common',   kiForm: 'ki he fefiné',    why: 'Unlike a name, fefine needs the article to be definite: ki he fefiné.' },
  { tongan: 'faiako',     english: 'the teacher (a specific teacher)',       category: 'common',   kiForm: 'ki he faiakó',    why: 'A common noun → ki he faiakó: article he plus the definitive accent.' },
]

export default function NounClassSorterCore() {
  return (
    <SorterCore
      categories={CATEGORIES}
      cards={CARDS}
      question="Person, place, or common noun?"
      formatRightForm={(card) => card.kiForm}
      rightFormNote={() => 'the form ki takes'}
      hideGloss
    />
  )
}
