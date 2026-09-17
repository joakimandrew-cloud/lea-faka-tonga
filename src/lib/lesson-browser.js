import { okinafy } from './okinafy'

export const LESSON_GROUPS = [
  {
    key: 'foundations',
    name: 'Foundations',
    verbPhrase: 'Build the sentence',
    lead: 'Tense markers, pronouns, verbs, modifiers, time, commands, and location.',
  },
  {
    key: 'core-grammar',
    name: 'Core Grammar',
    verbPhrase: 'Connect ideas',
    lead: 'Prepositions, articles, negation, comitative mo, question words, the ko pattern, and everyday greetings.',
  },
  {
    key: 'structure-possession',
    name: 'Structure & Possession',
    verbPhrase: 'Mark the subject',
    lead: 'Noun subjects, equational sentences, possessives, definiteness, transitive word order, plus numbers and time.',
  },
  {
    key: 'expanding-sentences',
    name: 'Expanding Sentences',
    verbPhrase: 'Add nuance',
    lead: 'Auxiliaries, aspect, obligation, conjunctions, plurals, purpose, comparison, directionals, and conditionals.',
  },
  {
    key: 'shaping-meaning',
    name: 'Shaping Meaning',
    verbPhrase: 'Refine expression',
    lead: 'Existentials, faka- prefix, instrumental ʻaki, reported speech, compound adjectives, clefts, postposed possessives, modal nuances, relative clauses, and spatial nouns.',
  },
  {
    key: 'advanced-patterns',
    name: 'Advanced Patterns',
    verbPhrase: 'Master the patterns',
    lead: 'Word class flexibility, advanced time and definitive accent, verbal nouns, noun classes, conditionals, productive suffixes and prefixes, reduplication, special pronouns, and emotional and respectful registers.',
  },
]

export const LESSON_TIERS = [
  {
    key: 'basic',
    name: 'Basic',
    blurb: 'Build the sentence.',
    groupKeys: ['foundations', 'core-grammar', 'structure-possession'],
  },
  {
    key: 'intermediate',
    name: 'Intermediate',
    blurb: 'Expand and refine.',
    groupKeys: ['expanding-sentences', 'shaping-meaning'],
  },
  {
    key: 'advanced',
    name: 'Advanced',
    blurb: 'Productive morphology and register.',
    groupKeys: ['advanced-patterns'],
  },
]

const GROUP_LEVEL = Object.fromEntries(
  LESSON_TIERS.flatMap(tier => tier.groupKeys.map(group => [group, tier.key])),
)

const MIXED_TONGAN_TERMS = [
  'fe-...-ʻaki', 'lolotonga', 'faka-', 'taʻe-', '-ʻanga', 'ngaahi', 'totonu',
  'ʻaʻaku', 'ʻoʻoku', 'ʻanefe', 'kapau', 'hingoā', 'mou', 'ʻikai', 'pehē',
  'ʻaupito', 'ʻofa', 'ʻosi', 'ʻeni', 'ʻena', 'ʻafe', 'ʻaki', 'lava', 'tuku',
  'kiate', 'meiate', 'fie', 'kuo', 'naʻa', 'naʻe', 'ʻoku', 'siʻi', 'siʻa',
  'fuʻu', 'kiʻi', 'meia', 'taha', 'ange', 'lolotonga', 'taʻu', 'fiha', 'nga',
  '-ʻi', '-nga', 'fe-', 'ʻia', 'faka-Tonga', 'ko', 'mo', 'ki', 'mei', 'ha',
  'ʻe', 'ʻa', 'ʻi', 'ʻo', 'ke', 'ku', 'te', 'e', 'he', 'ho', 'fie', 'kei',
  'pea', 'kau', 'mai', 'atu', 'ai', 'hai', 'fe', 'pau', 'ʻanga', 'loto', 'lalo', 'kia', 'ka', 'kita',
]

// Glosses are English prose, so only source-known Tongan names and terms are
// eligible. Keeping this list separate prevents English words such as “he”
// from being styled as Tongan merely because they are also Tongan particles.
const GLOSS_TONGAN_TERMS = [
  'Vavaʻu', 'Tēvita', 'Sēmisi', 'Nukuʻalofa', 'Sione', 'Mele', 'Lupe', 'Siale',
  'nofo', 'ako', 'māfana',
]

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function termPattern(term) {
  return escapePattern(term).replaceAll('ʻ', "[ʻ'‘’ʼ`]")
}

function makeTermPattern(terms) {
  const alternatives = [...new Set(terms)]
    .sort((a, b) => b.length - a.length)
    .map(termPattern)
    .join('|')
  return new RegExp(`(?<![\\p{L}\\p{M}])(${alternatives})(?![\\p{L}\\p{M}])`, 'giu')
}

const MIXED_PATTERN = makeTermPattern(MIXED_TONGAN_TERMS)
const GLOSS_PATTERN = makeTermPattern(GLOSS_TONGAN_TERMS)

export function lessonLevel(lesson) {
  return GROUP_LEVEL[lesson.group] || null
}

export function normalizeLessonSearch(value) {
  return okinafy(String(value ?? '')).normalize('NFC').trim().toLocaleLowerCase()
}

export function matchesLesson(lesson, query) {
  const normalizedQuery = normalizeLessonSearch(query)
  if (!normalizedQuery) return true
  const searchable = [lesson.title, ...(Array.isArray(lesson.topics) ? lesson.topics.slice(0, 2) : [])]
    .map(normalizeLessonSearch)
    .join(' ')
  return searchable.includes(normalizedQuery)
}

export function filterLessons(lessons, { query = '', level = 'all' } = {}) {
  return lessons.filter(lesson => {
    const inLevel = level === 'all' || lessonLevel(lesson) === level
    return inLevel && matchesLesson(lesson, query)
  })
}

export function groupLessons(lessons) {
  const grouped = Object.fromEntries(LESSON_GROUPS.map(group => [group.key, []]))
  for (const lesson of lessons) {
    if (grouped[lesson.group]) grouped[lesson.group].push(lesson)
  }
  return grouped
}

export function resolveOpenGroupKeys(manualOpenGroups, matchedGroupKeys, searchActive) {
  const resolved = new Set(manualOpenGroups)
  if (searchActive) {
    for (const key of matchedGroupKeys) resolved.add(key)
  }
  return resolved
}

// Returns text segments rather than markup. React callers can safely turn the
// tagged segments into <span lang="to"> nodes without HTML injection, while
// joining every segment always reproduces the source string exactly.
export function splitMixedTonganText(value, scope = 'mixed') {
  const text = String(value ?? '')
  const pattern = scope === 'gloss' ? GLOSS_PATTERN : MIXED_PATTERN
  const segments = []
  let end = 0
  pattern.lastIndex = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > end) segments.push({ text: text.slice(end, match.index), tongan: false })
    segments.push({ text: match[0], tongan: true })
    end = match.index + match[0].length
  }
  if (end < text.length) segments.push({ text: text.slice(end), tongan: false })
  if (segments.length === 0 && text) segments.push({ text, tongan: false })
  return segments
}
