// Landing-page examples use the fixed paradigms taught in Chapters 2 and 3.
// Chapter 2 supplies the four tense + preposed-pronoun forms and kai.
// Chapter 3 supplies ngāue mālohi, hiva lelei, mālohi, and fiekaia.
// Some subjects are swapped within those taught patterns; these are not all
// verbatim quotations. No translation service or sentence engine is involved.
export const TENSES = [
  { id: 'past', label: 'Past' },
  { id: 'present', label: 'Present' },
  { id: 'perfect', label: 'Perfect' },
  { id: 'future', label: 'Future' },
]

export const PREFIXES = {
  they: ["Na'a nau", "'Oku nau", 'Kuo nau', 'Te nau'],
  I: ["Na'á ku", "'Oku ou", "Kuó u", 'Té u'],
  you: ["Na'á ke", "'Okú ke", "Kuó ke", 'Té ke'],
  he: ["Na'á ne", "'Okú ne", "Kuó ne", 'Té ne'],
  she: ["Na'á ne", "'Okú ne", "Kuó ne", 'Té ne'],
}

// Each neighbouring example changes either the person or the main phrase.
// The tense stays selected when moving to another example.
export const SENTENCE_CYCLE = [
  { person: 'they', body: 'ngāue mālohi', kind: 'Verb + detail', english: ['They worked hard.', 'They work hard.', 'They have worked hard.', 'They will work hard.'] },
  { person: 'you', body: 'ngāue mālohi', kind: 'Verb + detail', english: ['You worked hard.', 'You work hard.', 'You have worked hard.', 'You will work hard.'] },
  { person: 'you', body: 'hiva lelei', kind: 'Verb + detail', english: ['You sang well.', 'You sing well.', 'You have sung well.', 'You will sing well.'] },
  { person: 'she', body: 'hiva lelei', kind: 'Verb + detail', english: ['She sang well.', 'She sings well.', 'She has sung well.', 'She will sing well.'] },
  { person: 'she', body: 'mālohi', kind: 'Adjective', english: ['She was strong.', 'She is strong.', 'She has become strong.', 'She will be strong.'] },
  { person: 'he', body: 'mālohi', kind: 'Adjective', english: ['He was strong.', 'He is strong.', 'He has become strong.', 'He will be strong.'] },
  { person: 'he', body: 'fiekaia', kind: 'Adjective', english: ['He was hungry.', 'He is hungry.', 'He has become hungry.', 'He will be hungry.'] },
  { person: 'I', body: 'fiekaia', kind: 'Adjective', english: ['I was hungry.', 'I am hungry.', 'I have become hungry.', 'I will be hungry.'] },
  { person: 'I', body: 'kai', kind: 'Verb', english: ['I ate.', 'I eat.', 'I have eaten.', 'I will eat.'] },
  { person: 'they', body: 'kai', kind: 'Verb', english: ['They ate.', 'They eat.', 'They have eaten.', 'They will eat.'] },
]
