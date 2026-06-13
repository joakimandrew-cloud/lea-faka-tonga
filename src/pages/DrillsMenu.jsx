import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Practice Drills menu — grouped browser (exercise-overwhelm review, 2026-06-13).
 *
 * Curation: audits/Exercise-Overwhelm-Review.md (X01–X04) cut the board from
 * 49 cards to 28, judge-verified. Presentation option B: cards are grouped by
 * SKILL FAMILY (not CEFR tier), each group shows its first row at rest with a
 * "view all" expander, and the drills that live only inside book chapters
 * appear as quiet dotted-leader rows per group — discoverable, not shouting.
 * A search box and level chips narrow the board further.
 *
 * Routing: a card links to its bespoke page where one exists (richer lesson
 * aside), otherwise to the generic /drill/:id route which mounts the Core
 * from the registry. Chapter-only rows always use routeFor() too, so a
 * bespoke page (e.g. /skeleton-filler) keeps serving its richer version.
 */

// ── Icons ─────────────────────────────────────────────────────────────────
// Inline-SVG line glyphs, 24×24, in the existing card style (stroke
// currentColor, 1.5, round caps). One per mechanic; a few are shared by
// closely-related drills.
const svg = (children) => (
  <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const ICONS = {
  swap: svg(<><path d="M4 8h13l-3-3" /><path d="M20 16H7l3 3" /></>),
  predict: svg(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1.3-1.3 1.9-2 2.4-.3.3-.5.7-.5 1.1" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></>),
  blocks: svg(<><rect x="3" y="10" width="5" height="6" /><rect x="10" y="10" width="5" height="6" /><rect x="17" y="10" width="4" height="6" /><path d="M4 6h16" strokeDasharray="1 3" /></>),
  flip: svg(<><path d="M4 9h10l-3-3" /><path d="M20 15H10l3 3" /><path d="M16 9h4M4 15h2" strokeDasharray="2 2" /></>),
  possess: svg(<><path d="M12 4v16M4 12h16" /><circle cx="7" cy="7" r="1.6" fill="currentColor" /><circle cx="17" cy="17" r="1.6" fill="currentColor" /></>),
  people: svg(<><circle cx="9" cy="10" r="3" /><circle cx="15" cy="10" r="3" /><path d="M4 20c0-3 2.5-5 5-5M20 20c0-3-2.5-5-5-5" /></>),
  grid: svg(<><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /></>),
  linked: svg(<><circle cx="7" cy="12" r="3" /><circle cx="17" cy="12" r="3" /><path d="M10 12h4" /></>),
  accent: svg(<><path d="M6 18L12 6l6 12" /><path d="M8.5 13.5h7" /><path d="M14 6l2-2" /></>),
  convert: svg(<><path d="M4 7h8M4 12h8M4 17h8" /><path d="M16 9l4 3-4 3" /></>),
  article: svg(<><rect x="3" y="7" width="8" height="6" rx="1.5" /><rect x="13" y="11" width="8" height="6" rx="1.5" /></>),
  prep: svg(<><path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11z" /><circle cx="12" cy="10" r="2" /></>),
  question: svg(<><path d="M4 5h16v11H9l-4 4V5z" /><path d="M10 9.3c0-1.1.9-1.9 2-1.9s2 .8 2 1.9c0 1-1 1.4-1.6 1.9-.3.3-.4.6-.4 1" /><circle cx="12" cy="14.4" r="0.5" fill="currentColor" /></>),
  marker: svg(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>),
  aux: svg(<><rect x="3" y="9" width="10" height="6" rx="3" /><rect x="11" y="9" width="10" height="6" rx="3" /></>),
  aspect: svg(<><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>),
  fork: svg(<><path d="M12 20v-6" /><path d="M12 14L6 6" /><path d="M12 14l6-8" /></>),
  plural: svg(<><path d="M4 8l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4" /><path d="M4 16l8 4 8-4" /></>),
  direction: svg(<><path d="M12 3v18M3 12h18" /><path d="M12 3l-2 3M12 3l2 3" /><path d="M12 21l-2-3M12 21l2-3" /><path d="M3 12l3-2M3 12l3 2" /><path d="M21 12l-3-2M21 12l-3 2" /></>),
  temporal: svg(<><circle cx="10" cy="10" r="6" /><path d="M10 6.5V10l2.5 1.5" /><path d="M15 16l5 5" strokeDasharray="2 2" /></>),
  count: svg(<><path d="M5 7v10M9 7v10M13 7v10" /><circle cx="18" cy="12" r="2.6" /></>),
  cleft: svg(<><rect x="3" y="6" width="5" height="12" rx="1" /><path d="M11 9h10M11 13h7M11 17h9" opacity="0.7" /></>),
  relative: svg(<><path d="M16 6H8a4 4 0 0 0 0 8h6" /><path d="M11 11l-3 3 3 3" /></>),
  fan: svg(<><path d="M12 21v-7" /><path d="M12 14L5 5" /><path d="M12 14l7-9" /><path d="M12 14V5" /></>),
  terminal: svg(<><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M7 10l3 2.5-3 2.5" /><path d="M13 15h4" /></>),
}

const LEVELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

// ── The 28 menu drills, grouped by skill family ────────────────────────────
// level keys feed the filter chips; order within a group = reach-for-it-first.
const GROUPS = [
  {
    key: 'build',
    name: 'Build the sentence',
    note: 'Assemble and recognize whole sentences.',
    drills: [
      { id: 'first-word-quiz',  ch: 12, level: 'beginner', title: `Name the sentence from its first word`, blurb: `See only the start and call it: statement, command, negation, or "X is Y".`, action: 'Name', icon: ICONS.predict },
      { id: 'modifier-order',   ch: 3,  level: 'beginner', title: `Where the describing word goes`,        blurb: `Describing words follow the verb (sing well); faʻa is the one that goes before.`, action: 'Order', icon: ICONS.flip },
      { id: 'sentence-builder', ch: 19, level: 'advanced', title: `Build a whole Tongan sentence`,         blurb: `The capstone: assemble the sentence from tiles — pick the right ʻa / ʻe / ʻa e / ʻe he markers and the right order.`, action: 'Build', icon: ICONS.blocks },
      { id: 'cleft-builder',    ch: 36, level: 'advanced', title: `Say who did it (Ko …)`,                 blurb: `Front the doer with Ko: "It was Sione who ate it."`, action: 'Build', icon: ICONS.cleft },
      { id: 'terminal-builder', ch: 19, level: 'advanced', title: `Free-build any sentence`,               blurb: `An open sandbox: pick a sentence type for guidance, or jump straight in, with every structure unlocked.`, action: 'Build', icon: ICONS.terminal },
    ],
    inChapters: [
      { id: 'skeleton-filler', ch: 1,  label: 'Order the tense marker, pronoun, and verb' },
      { id: 'adjective-flip',  ch: 35, label: 'Adjective order: before or after the noun' },
      { id: 'word-class-picker', ch: 41, label: 'Same word, different role: noun, verb, adjective, adverb' },
    ],
  },
  {
    key: 'tense',
    name: 'Tense & the verb',
    note: 'The marker system every sentence starts from.',
    drills: [
      { id: 'tense-swapper',        ch: 9,  level: 'beginner',     title: `How Tongan marks tense`,                 blurb: `Mark past, present, perfect, and future by changing one word in front of the verb.`, action: 'Swap', icon: ICONS.swap },
      { id: 'tm-by-context-picker', ch: 15, level: 'beginner',     title: `Naʻa or Naʻe? Te or ʻE? te or ke?`,      blurb: `One rule, three pairs: use the pronoun form when a pronoun follows — past, future, and negation after ʻikai.`, action: 'Pick', icon: ICONS.fork },
      { id: 'aspect-picker',        ch: 22, level: 'intermediate', title: `Still / Already / Not yet`,              blurb: `Pick the word before the verb: kei, ʻosi, teʻeki ai, lolotonga, toe, toki.`, action: 'Pick', icon: ICONS.aspect },
      { id: 'auxiliary-picker',     ch: 21, level: 'intermediate', title: `Want / Can / Like`,                      blurb: `fie + verb, lava ʻo + verb, saiʻia + phrase — pick by what links to the verb.`, action: 'Pick', icon: ICONS.aux },
      { id: 'naa-three-way-picker', ch: 38, level: 'advanced',     title: `Which naʻa? (past / lest / perhaps)`,    blurb: `Tell past-tense naʻa from "lest" (after a command) and "perhaps" (clause-initial).`, action: 'Pick', icon: ICONS.fan },
    ],
    inChapters: [
      { id: 'te-or-ke-picker',  ch: 9,  label: 'After ʻikai: te or ke? (the focused deck)' },
      { id: 'audience-picker',  ch: 10, label: 'Commands: one, two, or many' },
      { id: 'te-disambiguator', ch: 51, label: 'The three jobs of te' },
      { id: 'time-pair-matcher', ch: 4, label: 'Pair each ʻane- past with its ʻa- future partner' },
    ],
  },
  {
    key: 'markers',
    name: 'Markers, articles & counting',
    note: `Who did it, which one, and how many — the ʻa / ʻe / ha / he machinery.`,
    drills: [
      { id: 'article-picker',             ch: 8,  level: 'beginner',     title: `a, the, or the-after-a-preposition?`, blurb: `Choose ha, ʻa e, or he by definiteness and whether a preposition comes first.`, action: 'Pick', icon: ICONS.article },
      { id: 'subject-marker-picker',      ch: 19, level: 'intermediate', title: `Who did it: ʻa, ʻe, or ʻe he?`,       blurb: `Intransitive subjects take ʻa; transitive doers take ʻe (name) / ʻe he (common noun).`, action: 'Pick', icon: ICONS.marker },
      { id: 'plural-marker-picker',       ch: 25, level: 'intermediate', title: `Plural markers`,                      blurb: `ngaahi (general), kau (people), fanga (animals), ʻū (a few), ongo (exactly two).`, action: 'Pick', icon: ICONS.plural },
      { id: 'classifier-extended-picker', ch: 31, level: 'intermediate', title: `Counting: ʻe, toko, or foʻi?`,        blurb: `ʻe for things, toko for people, foʻi for single round/whole items.`, action: 'Pick', icon: ICONS.count },
      { id: 'count-time',                 ch: 20, level: 'beginner',     title: `Count and tell the time`,             blurb: `The numbers 1-10 in their frames: ʻe for things, toko for people, the clock, prices.`, action: 'Count', icon: ICONS.count },
    ],
    inChapters: [
      { id: 'definiteness-three-way-picker', ch: 18, label: 'any basket, a basket, or THE basket?' },
      { id: 'definiteness-flip',             ch: 19, label: 'Some bread vs. the bread — watch the sentence rebuild' },
      { id: 'pronoun-object-drop-picker',    ch: 19, label: 'When the object loses its ʻa' },
      { id: 'equational-subject-picker',     ch: 16, label: 'ʻa before a name?' },
      { id: 'noun-class-sorter',             ch: 46, label: 'Person, place, or thing: which "to"?' },
      { id: 'classifier-picker',             ch: 20, label: 'The classifier introduction: ʻe / toko / foʻi' },
      { id: 'emotional-article-matrix',      ch: 52, label: 'Adding feeling: siʻi and siʻa' },
    ],
  },
  {
    key: 'possession',
    name: 'Pronouns, possession & having',
    note: `Who you mean and what is theirs — the e-class / ho-class system.`,
    drills: [
      { id: 'pronoun-paradigm',      ch: 2,  level: 'beginner',     title: `Name the pronoun`,                  blurb: `Recall the right preposed pronoun by its cell: singular / dual / plural, "we" with or without you.`, action: 'Recall', icon: ICONS.people },
      { id: 'possessive-sorter',     ch: 17, level: 'beginner',     title: `Saying "my": ʻeku or hoku?`,        blurb: `Pick ʻeku or hoku for "my," one noun at a time.`, action: 'Sort', icon: ICONS.possess },
      { id: 'doer-receiver-picker',  ch: 29, level: 'advanced',     title: `his choosing vs. his being chosen`, blurb: `ʻene fili (he does it) vs. hono fili (it's done to him).`, action: 'Pick', icon: ICONS.possess },
      { id: 'verbal-noun-converter', ch: 45, level: 'advanced',     title: `Say "when / because he read it"`,   blurb: `Turn "he read it" into a "when/because" clause; pick heʻene, heʻeku, he hoʻo…`, action: 'Convert', icon: ICONS.convert },
      { id: 'there-is-have',         ch: 31, level: 'intermediate', title: `There is / I have`,                 blurb: `ʻi ai for "there is" and "have"; the negative "have" drops ʻi ai. Pick the right opener and tense.`, action: 'Pick', icon: ICONS.possess },
    ],
    inChapters: [
      { id: 'clusivity-corner',            ch: 2,  label: 'Which "we"? — in the group or not, two or more' },
      { id: 'kinship-possessive',          ch: 29, label: 'Family: my / your / his' },
      { id: 'postposed-possessive-picker', ch: 37, label: 'That one is MINE: ʻaʻaku vs. ʻoʻoku' },
      { id: 'benefactive-sorter',          ch: 26, label: 'maʻa or moʻo — for whose benefit' },
    ],
  },
  {
    key: 'place',
    name: 'Questions, place & direction',
    note: 'Asking, locating, and pointing the verb the right way.',
    drills: [
      { id: 'question-word-picker', ch: 11, level: 'beginner',     title: `Which question word?`,                  blurb: `where / when / how / how-many — the question word sits where the answer would go.`, action: 'Pick', icon: ICONS.question },
      { id: 'preposition-selector', ch: 7,  level: 'beginner',     title: `ʻi / ki / mei (and the form they take)`, blurb: `at/to/from and its shape: bare before a place, -a before a name, -ate before a pronoun.`, action: 'Pick', icon: ICONS.prep },
      { id: 'direction-picker',     ch: 28, level: 'intermediate', title: `Which direction`,                       blurb: `mai (toward me), atu (toward you), ange (toward them), hake/hifo (up/down).`, action: 'Pick', icon: ICONS.direction },
      { id: 'relative-ai-picker',   ch: 39, level: 'advanced',     title: `the place he works IN / came FROM`,     blurb: `Pick ai, ki ai, or mei ai by the preposition the plain sentence would use.`, action: 'Pick', icon: ICONS.relative },
    ],
    inChapters: [
      { id: 'demonstrative-picker', ch: 6,  label: 'here / there / over there: heni, hena, hē' },
      { id: 'spatial-noun-picker',  ch: 40, label: 'inside / under / on top / beside' },
      { id: 'ko-question-picker',   ch: 13, label: 'ko hai / ko e hā / ko fē — the ko-questions' },
      { id: 'ai-substitution',      ch: 7,  label: 'Replace the place with ai / ki ai / mei ai' },
      { id: 'before-after-picker',  ch: 42, label: 'ki muʻa / ki mui / ʻamui / tōmuʻa' },
      { id: 'farewell-picker',      ch: 14, label: 'Who leaves, who stays — pick the farewell' },
    ],
  },
  {
    key: 'joining',
    name: 'Joining & shaping',
    note: 'Connect clauses, build words, and place the accent.',
    drills: [
      { id: 'connector-disambiguator',     ch: 26, level: 'intermediate', title: `Which connector: and / with / but / because`, blurb: `Three words for "and" (mo, pea, ʻo), two for "but" (ka, kae), ke for purpose, he for reason.`, action: 'Pick', icon: ICONS.linked },
      { id: 'temporal-conjunction-picker', ch: 30, level: 'intermediate', title: `if / while / until / when / although`,        blurb: `kapau, lolotonga, kaeʻoua ke, ʻi he…, neongo.`, action: 'Pick', icon: ICONS.temporal },
      { id: 'faka-pattern-sorter',         ch: 32, level: 'advanced',     title: `Sort faka- words by job`,                     blurb: `faka- does four jobs (manner, cause, every-X, one-particular). Read the word and sort it.`, action: 'Sort', icon: ICONS.grid },
      { id: 'accent-placement-picker',     ch: 44, level: 'advanced',     title: `Where the accent lands`,                      blurb: `Spot which word in a noun phrase carries the accent — and whether the group takes one at all.`, action: 'Place', icon: ICONS.accent },
    ],
    inChapters: [
      { id: 'ka-or-kae-picker',            ch: 24, label: '"but": ka or kae — the focused deck' },
      { id: 'conditional-picker',          ch: 47, label: 'if / when / had-I: kapau, ka, ka ne' },
      { id: 'should-or-must-picker',       ch: 23, label: 'Should or Must: totonu ke vs. pau ke' },
      { id: 'comparative-picker',          ch: 27, label: 'More or Most: ange vs. taha' },
      { id: 'aki-suffix-picker',           ch: 33, label: 'ʻaki / -ʻi / -ʻaki — three sound-alikes' },
      { id: 'tae-prefix-picker',           ch: 43, label: 'taʻe-: without / un- / without doing' },
      { id: 'suffix-picker',               ch: 48, label: '-ʻanga (place) vs. -nga (thing)' },
      { id: 'reduplication-effect-sorter', ch: 50, label: 'What doubling does: intensify, moderate, pluralize' },
      { id: 'pehee-picker',                ch: 34, label: 'Pehē: say, thus, or do-thus-to' },
      { id: 'reciprocity-picker',          ch: 49, label: '"each other" verbs (fe-…-ʻaki)' },
      { id: 'register-sorter',             ch: 53, label: 'Five vocabulary levels by social rank' },
    ],
  },
]

// Drills with a richer bespoke page keep their own route; the rest use the
// generic /drill/:id route that mounts the registry Core.
const BESPOKE = {
  'tense-swapper': '/tense-swap',
  'first-word-quiz': '/first-word',
  'skeleton-filler': '/skeleton-filler',
  'possessive-sorter': '/possessive-sort',
  'clusivity-corner': '/clusivity',
  'adjective-flip': '/adjective-flip',
  'faka-pattern-sorter': '/faka-sort',
  'cleft-builder': '/cleft-builder',
  'accent-placement-picker': '/accent-placement',
  'verbal-noun-converter': '/verbal-noun',
  'terminal-builder': '/sentence-builder',
}
const routeFor = (id) => BESPOKE[id] || `/drill/${id}`

// How many cards a group shows before "view all" (≈ one row on desktop).
const AT_REST = 4

function DrillCard({ drill, colorIndex }) {
  return (
    <Link to={routeFor(drill.id)} className={`panel-card panel-card-c${(colorIndex % 5) + 1} drill-card reveal`}>
      <span className="panel-card-stripe" aria-hidden="true" />
      <div className="panel-card-body">
        <div className="panel-card-head">
          <span className="panel-card-glyph" aria-hidden="true">{drill.icon}</span>
          <span className="panel-card-ch">Ch {drill.ch} · {LEVELS[drill.level]}</span>
        </div>
        <div className="panel-card-title">{drill.title}</div>
        <p className="panel-card-desc">{drill.blurb}</p>
      </div>
      <div className="panel-card-foot">
        <span className="panel-card-tag">{drill.action}</span>
        <span className="panel-card-arrow" aria-hidden="true">→</span>
      </div>
    </Link>
  )
}

const matches = (drill, query) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    drill.title.toLowerCase().includes(q) ||
    drill.blurb.toLowerCase().includes(q) ||
    `ch ${drill.ch}`.includes(q)
  )
}

export default function DrillsMenu() {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [expanded, setExpanded] = useState({})   // groupKey → true (show all cards)
  const [chaptersOpen, setChaptersOpen] = useState({}) // groupKey → true (show in-chapter rows)

  const filtering = query.trim() !== '' || level !== 'all'
  const total = GROUPS.reduce((n, g) => n + g.drills.length, 0)

  let colorIndex = 0
  let shownTotal = 0

  const sections = GROUPS.map((group) => {
    const visible = group.drills.filter(d => (level === 'all' || d.level === level) && matches(d, query))
    shownTotal += visible.length
    // While filtering, show every match; at rest, collapse to one row.
    const isExpanded = filtering || expanded[group.key]
    const cards = isExpanded ? visible : visible.slice(0, AT_REST)
    const hiddenCount = visible.length - cards.length
    return { group, visible, cards, hiddenCount }
  })

  return (
    <div className="panel-section drills-board">
      <div className="panel-frame">

        <div className="panel-heading">
          <h1>Practice <span className="dot">·</span> Drills</h1>
          <p className="lead">
            <span className="tongan">Ngāue Fakaʻilo.</span>{' '}
            {total} targeted exercises, each isolating a single grammar pattern, grouped by the skill they build. More drills live inside the book chapters at the exact moment each pattern is taught — every group lists its own.
          </p>
        </div>

        <div className="drills-filter">
          <input
            type="search"
            className="drills-search"
            placeholder="Search drills (e.g., tense, possessive, counting)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search drills"
          />
          <div className="drills-chips" role="group" aria-label="Filter by level">
            {[['all', 'All'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`drills-chip${level === key ? ' is-active' : ''}`}
                onClick={() => setLevel(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtering && shownTotal === 0 && (
          <p className="drills-empty">No drills match — try a different word, or clear the level filter.</p>
        )}

        {sections.map(({ group, visible, cards, hiddenCount }) => {
          if (filtering && visible.length === 0) return null
          return (
            <div key={group.key}>
              <div className="panel-subsection-bar">
                <span>{group.name} <span className="dot">·</span> {visible.length} Drill{visible.length === 1 ? '' : 's'}</span>
                <span className="note">{group.note}</span>
              </div>
              <div className="panel-cards">
                {cards.map((d) => (
                  <DrillCard key={d.id} drill={d} colorIndex={colorIndex++} />
                ))}
              </div>
              <div className="drills-group-foot">
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    className="drills-more"
                    onClick={() => setExpanded(e => ({ ...e, [group.key]: true }))}
                  >
                    View all {visible.length} →
                  </button>
                )}
                {!filtering && group.inChapters.length > 0 && (
                  <button
                    type="button"
                    className="drills-chapters-toggle"
                    onClick={() => setChaptersOpen(o => ({ ...o, [group.key]: !o[group.key] }))}
                    aria-expanded={!!chaptersOpen[group.key]}
                  >
                    {chaptersOpen[group.key] ? '− In the chapters' : `+ In the chapters · ${group.inChapters.length} more`}
                  </button>
                )}
              </div>
              {!filtering && chaptersOpen[group.key] && (
                <ul className="drills-toc">
                  {group.inChapters.map((row) => (
                    <li key={row.id}>
                      <Link to={routeFor(row.id)} className="drills-toc-row">
                        <span className="drills-toc-label">{row.label}</span>
                        <span className="drills-toc-leader" aria-hidden="true" />
                        <span className="drills-toc-ch">Ch {row.ch}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}

        <div className="panel-colophon">
          <div><strong>{total} Drills</strong> · One pattern each · Grouped by skill · The rest live in their chapters</div>
          <div className="tonga-sig">Ngāue lelei</div>
        </div>

      </div>
    </div>
  )
}
