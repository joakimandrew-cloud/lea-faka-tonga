import { Link } from 'react-router-dom'

/**
 * Practice Drills menu.
 *
 * Curation follows plans/Exercise-Recuration-Tracker.md: three CEFR tiers
 * (Beginner / Intermediate / Advanced), ordered WITHIN each tier by how
 * load-bearing the pattern is, NOT by chapter number. Titles and blurbs are
 * the tracker's RENAME table (kept in sync with registry.js meta).
 *
 * Routing: a card links to its bespoke page where one exists (richer lesson
 * aside), otherwise to the generic /drill/:id route which mounts the Core
 * from the registry. emotional-article-matrix and reciprocity-picker are
 * demoted to chapter-only and intentionally absent here.
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
  bars: svg(<><rect x="3" y="14" width="4" height="6" /><rect x="10" y="9" width="4" height="11" /><rect x="17" y="4" width="4" height="16" /></>),
  accent: svg(<><path d="M6 18L12 6l6 12" /><path d="M8.5 13.5h7" /><path d="M14 6l2-2" /></>),
  convert: svg(<><path d="M4 7h8M4 12h8M4 17h8" /><path d="M16 9l4 3-4 3" /></>),
  article: svg(<><rect x="3" y="7" width="8" height="6" rx="1.5" /><rect x="13" y="11" width="8" height="6" rx="1.5" /></>),
  prep: svg(<><path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11z" /><circle cx="12" cy="10" r="2" /></>),
  negate: svg(<><circle cx="12" cy="12" r="8" /><path d="M7 7l10 10" /></>),
  question: svg(<><path d="M4 5h16v11H9l-4 4V5z" /><path d="M10 9.3c0-1.1.9-1.9 2-1.9s2 .8 2 1.9c0 1-1 1.4-1.6 1.9-.3.3-.4.6-.4 1" /><circle cx="12" cy="14.4" r="0.5" fill="currentColor" /></>),
  here: svg(<><circle cx="5" cy="12" r="2.2" fill="currentColor" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.1" /></>),
  marker: svg(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>),
  objdrop: svg(<><path d="M12 4v10" /><path d="M8 11l4 4 4-4" /><path d="M5 20h14" strokeDasharray="2 2" /></>),
  equals: svg(<><circle cx="12" cy="12" r="9" opacity="0.3" /><path d="M7 10h10M7 14h10" /></>),
  aux: svg(<><rect x="3" y="9" width="10" height="6" rx="3" /><rect x="11" y="9" width="10" height="6" rx="3" /></>),
  aspect: svg(<><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>),
  should: svg(<><path d="M12 4v15" /><path d="M5 8h14" /><path d="M5 8l-2 5h4l-2-5z" /><path d="M19 8l-2 5h4l-2-5z" /><path d="M8 20h8" /></>),
  fork: svg(<><path d="M12 20v-6" /><path d="M12 14L6 6" /><path d="M12 14l6-8" /></>),
  plural: svg(<><path d="M4 8l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4" /><path d="M4 16l8 4 8-4" /></>),
  direction: svg(<><path d="M12 3v18M3 12h18" /><path d="M12 3l-2 3M12 3l2 3" /><path d="M12 21l-2-3M12 21l2-3" /><path d="M3 12l3-2M3 12l3 2" /><path d="M21 12l-3-2M21 12l-3 2" /></>),
  temporal: svg(<><circle cx="10" cy="10" r="6" /><path d="M10 6.5V10l2.5 1.5" /><path d="M15 16l5 5" strokeDasharray="2 2" /></>),
  count: svg(<><path d="M5 7v10M9 7v10M13 7v10" /><circle cx="18" cy="12" r="2.6" /></>),
  spatial: svg(<><rect x="3" y="3" width="18" height="18" rx="1" /><rect x="8" y="8" width="8" height="8" rx="1" /></>),
  cleft: svg(<><rect x="3" y="6" width="5" height="12" rx="1" /><path d="M11 9h10M11 13h7M11 17h9" opacity="0.7" /></>),
  relative: svg(<><path d="M16 6H8a4 4 0 0 0 0 8h6" /><path d="M11 11l-3 3 3 3" /></>),
  fan: svg(<><path d="M12 21v-7" /><path d="M12 14L5 5" /><path d="M12 14l7-9" /><path d="M12 14V5" /></>),
  trefoil: svg(<><circle cx="12" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="M12 8v3M12 11l-4.5 5M12 11l4.5 5" /></>),
  weGroup: svg(<><circle cx="9" cy="12" r="5" /><circle cx="15" cy="12" r="5" /></>),
  terminal: svg(<><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M7 10l3 2.5-3 2.5" /><path d="M13 15h4" /></>),
}

// ── Drills by tier (order = frequency / load, not chapter) ──────────────────
const beginner = [
  { id: 'tense-swapper',        ch: 9,  title: `How Tongan marks tense`,                blurb: `Mark past, present, perfect, and future by changing one word in front of the verb.`, action: 'Swap',    icon: ICONS.swap },
  { id: 'first-word-quiz',      ch: 12, title: `Name the sentence from its first word`, blurb: `See only the start and call it: statement, command, negation, or "X is Y".`,          action: 'Name',    icon: ICONS.predict },
  { id: 'skeleton-filler',      ch: 1,  title: `Build a Tongan sentence`,                blurb: `Put the tense marker, pronoun, and verb in the right order.`,                          action: 'Build',   icon: ICONS.blocks },
  { id: 'article-picker',       ch: 8,  title: `a, the, or the-after-a-preposition?`,    blurb: `Choose ha, ʻa e, or he by definiteness and whether a preposition comes first.`,       action: 'Pick',    icon: ICONS.article },
  { id: 'preposition-selector', ch: 7,  title: `ʻi / ki / mei (and the form they take)`, blurb: `at/to/from and its shape: bare before a place, -a before a name, -ate before a pronoun.`, action: 'Pick', icon: ICONS.prep },
  { id: 'possessive-sorter',    ch: 17, title: `Saying "my": ʻeku or hoku?`,             blurb: `Pick ʻeku or hoku for "my," one noun at a time.`,                                       action: 'Sort',    icon: ICONS.possess },
  { id: 'te-or-ke-picker',      ch: 9,  title: `After ʻikai: te or ke?`,                 blurb: `te before a pronoun, ke before a bare verb.`,                                          action: 'Pick',    icon: ICONS.negate },
  { id: 'question-word-picker', ch: 11, title: `Which question word?`,                   blurb: `where / when / how / how-many — the question word sits where the answer would go.`,    action: 'Pick',    icon: ICONS.question },
  { id: 'demonstrative-picker', ch: 6,  title: `here / there / over there`,              blurb: `heni (by me), hena (by you), hē (the spot I point to).`,                               action: 'Pick',    icon: ICONS.here },
  { id: 'modifier-order',       ch: 3,  title: `Where the describing word goes`,         blurb: `Describing words follow the verb (sing well); faʻa is the one that goes before.`,      action: 'Order',   icon: ICONS.flip },
  { id: 'audience-picker',      ch: 5,  title: `Commands: one, two, or many`,            blurb: `Pick the command form by how many you address: bare verb / mo / mou.`,                action: 'Pick',    icon: ICONS.people },
  { id: 'tm-by-context-picker', ch: 15, title: `Naʻa or Naʻe? Te or ʻE?`,               blurb: `Use the pronoun form before a pronoun, the other form before a noun or "ʻikai."`,      action: 'Pick',    icon: ICONS.fork },
  { id: 'clusivity-corner',     ch: 2,  title: `Which "we"?`,                            blurb: `Tongan has four words for "we." Is the listener in the group, and is it two or three-plus?`, action: 'Choose', icon: ICONS.weGroup },
  { id: 'pronoun-paradigm',     ch: 2,  title: `Name the pronoun`,                       blurb: `Recall the right preposed pronoun by its cell: singular / dual / plural, "we" with or without you.`, action: 'Recall', icon: ICONS.people },
  { id: 'count-time',           ch: 20, title: `Count and tell the time`,                blurb: `The numbers 1-10 in their frames: ʻe for things, toko for people, the clock, prices.`, action: 'Count', icon: ICONS.count },
  { id: 'vocab-cloze',          ch: 3,  title: `Fill the blank (vocabulary)`,            blurb: `A known frame with one word missing and an English cue — recall the Tongan word.`, action: 'Recall', icon: ICONS.article },
]

const intermediate = [
  { id: 'subject-marker-picker',        ch: 19, title: `Who did it: ʻa, ʻe, or ʻe he?`,           blurb: `Intransitive subjects take ʻa; transitive doers take ʻe (name) / ʻe he (common noun).`, action: 'Pick',   icon: ICONS.marker },
  { id: 'pronoun-object-drop-picker',   ch: 19, title: `When the object loses its ʻa`,            blurb: `A name-object keeps ʻa; a pronoun-object drops it.`,                                     action: 'Pick',   icon: ICONS.objdrop },
  { id: 'definiteness-flip',            ch: 19, title: `Some bread vs. the bread`,                blurb: `Change "some" → "the" and watch the sentence rebuild, including the ʻa/ʻe subject.`,      action: 'Flip',   icon: ICONS.linked },
  { id: 'equational-subject-picker',    ch: 16, title: `ʻa before a name?`,                       blurb: `In "X is a Y," ʻa appears before a name but drops before a pronoun.`,                    action: 'Pick',   icon: ICONS.equals },
  { id: 'auxiliary-picker',             ch: 21, title: `Want / Can / Like`,                       blurb: `fie + verb, lava ʻo + verb, saiʻia + phrase — pick by what links to the verb.`,          action: 'Pick',   icon: ICONS.aux },
  { id: 'aspect-picker',                ch: 22, title: `Still / Already / Not yet`,               blurb: `Pick the word before the verb: kei, ʻosi, teʻeki ai, lolotonga, toe, toki.`,             action: 'Pick',   icon: ICONS.aspect },
  { id: 'should-or-must-picker',        ch: 23, title: `Should or Must`,                          blurb: `ʻoku totonu ke (should) vs. kuo pau ke (must).`,                                         action: 'Pick',   icon: ICONS.should },
  { id: 'ka-or-kae-picker',             ch: 24, title: `"but": ka or kae`,                        blurb: `ka before a tense-marker/pronoun/preposition, kae before a verb or adjective.`,          action: 'Pick',   icon: ICONS.fork },
  { id: 'plural-marker-picker',         ch: 25, title: `Plural markers`,                          blurb: `ngaahi (general), kau (people), fanga (animals), ʻū (a few), ongo (exactly two).`,       action: 'Pick',   icon: ICONS.plural },
  { id: 'comparative-picker',           ch: 27, title: `More or Most`,                            blurb: `ange (more, + a "than" phrase) vs. taha (most).`,                                        action: 'Pick',   icon: ICONS.bars },
  { id: 'direction-picker',             ch: 28, title: `Which direction`,                         blurb: `mai (toward me), atu (toward you), ange (toward them), hake/hifo (up/down).`,            action: 'Pick',   icon: ICONS.direction },
  { id: 'temporal-conjunction-picker',  ch: 30, title: `if / while / until / when / although`,   blurb: `kapau, lolotonga, kaeʻoua ke, ʻi he…, neongo.`,                                          action: 'Pick',   icon: ICONS.temporal },
  { id: 'classifier-extended-picker',   ch: 31, title: `Counting: ʻe, toko, or foʻi?`,            blurb: `ʻe for things, toko for people, foʻi for single round/whole items.`,                    action: 'Pick',   icon: ICONS.count },
  { id: 'spatial-noun-picker',          ch: 40, title: `inside / under / on top / beside`,        blurb: `loto, lalo, funga, veʻe, tuʻa, mata, mui, tafaʻaki.`,                                    action: 'Pick',   icon: ICONS.spatial },
  { id: 'conditional-picker',           ch: 47, title: `if / when / had-I`,                       blurb: `kapau (uncertain), ka (expected), ka ne (didn't-happen, "had I…").`,                     action: 'Pick',   icon: ICONS.fork },
  { id: 'there-is-have',                ch: 29, title: `There is / I have`,                        blurb: `ʻi ai for "there is" and "have"; the negative drops ʻi ai. Pick the right opener and tense.`, action: 'Pick', icon: ICONS.possess },
  { id: 'connector-disambiguator',      ch: 24, title: `Which connector: mo / pea / ʻo / ka / kae`, blurb: `Three words for "and" (mo, pea, ʻo) and two for "but" (ka, kae) — choose by what is being joined.`, action: 'Pick', icon: ICONS.linked },
  { id: 'kinship-possessive',           ch: 29, title: `Family: my / your / his`,                  blurb: `Relatives are ho-class — but parents and children flip to e-class (ʻeku tamai, hoku tokoua).`, action: 'Pick', icon: ICONS.weGroup },
]

const advanced = [
  { id: 'sentence-builder',          ch: 19, title: `Build a whole Tongan sentence`,        blurb: `The capstone: assemble the sentence from tiles — pick the right ʻa / ʻe / ʻa e / ʻe he markers and the right order.`, action: 'Build', icon: ICONS.blocks },
  { id: 'terminal-builder',          ch: 19, title: `Free-build any sentence`,              blurb: `An open sandbox: pick a sentence type for guidance, or jump straight in. Build any sentence one word at a time, with every structure unlocked.`, action: 'Build', icon: ICONS.terminal },
  { id: 'terminal-builder-classic',  ch: 19, title: `Classic terminal builder`,             blurb: `The original free-build: jump straight into building one word at a time, no opening menu.`, action: 'Build', icon: ICONS.terminal },
  { id: 'verbal-noun-converter',     ch: 45, title: `Say "when / because he read it"`,    blurb: `Turn "he read it" into a "when/because" clause; pick heʻene, heʻeku, he hoʻo…`,        action: 'Convert', icon: ICONS.convert },
  { id: 'doer-receiver-picker',      ch: 29, title: `his choosing vs. his being chosen`,   blurb: `ʻene fili (he does it) vs. hono fili (it's done to him).`,                              action: 'Pick',    icon: ICONS.possess },
  { id: 'cleft-builder',             ch: 36, title: `Say who did it (Ko …)`,               blurb: `Front the doer with Ko: "It was Sione who ate it."`,                                   action: 'Build',   icon: ICONS.cleft },
  { id: 'relative-ai-picker',        ch: 39, title: `the place he works IN / came FROM`,   blurb: `Pick ai, ki ai, or mei ai by the preposition the plain sentence would use.`,           action: 'Pick',    icon: ICONS.relative },
  { id: 'faka-pattern-sorter',       ch: 32, title: `Sort faka- words by job`,            blurb: `faka- does four jobs (manner, cause, every-X, one-particular). Read the word and sort it.`, action: 'Sort', icon: ICONS.grid },
  { id: 'naa-three-way-picker',      ch: 38, title: `Which naʻa? (past / lest / perhaps)`, blurb: `Tell past-tense naʻa from "lest" (after a command) and "perhaps" (clause-initial).`,    action: 'Pick',    icon: ICONS.fan },
  { id: 'te-disambiguator',          ch: 51, title: `The three jobs of te`,                blurb: `Future marker, negation connector after ʻikai, or "one" — by position.`,               action: 'Pick',    icon: ICONS.trefoil },
  { id: 'adjective-flip',            ch: 35, title: `Adjective order: before or after the noun`, blurb: `Most adjectives follow the noun (fale foʻou); a few — fuʻu, kiʻi, ʻuluaki, muʻaki, toe — come before it.`, action: 'Order', icon: ICONS.flip },
  { id: 'accent-placement-picker',   ch: 44, title: `Where the accent lands`,              blurb: `Spot which word in a noun phrase carries the accent — and which sit outside the group.`, action: 'Place',  icon: ICONS.accent },
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
  'definiteness-flip': '/definiteness-flip',
  'cleft-builder': '/cleft-builder',
  'accent-placement-picker': '/accent-placement',
  'verbal-noun-converter': '/verbal-noun',
  'terminal-builder': '/sentence-builder',
  'terminal-builder-classic': '/terminal-build',
}
const routeFor = (id) => BESPOKE[id] || `/drill/${id}`

function DrillCard({ drill, colorIndex }) {
  return (
    <Link to={routeFor(drill.id)} className={`panel-card panel-card-c${(colorIndex % 5) + 1} drill-card reveal`}>
      <span className="panel-card-stripe" aria-hidden="true" />
      <div className="panel-card-body">
        <div className="panel-card-head">
          <span className="panel-card-glyph" aria-hidden="true">{drill.icon}</span>
          <span className="panel-card-ch">Ch {drill.ch}</span>
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

const TIERS = [
  { key: 'beginner',     label: 'Beginner', level: 'A1–A2', note: 'Start here.',                             drills: beginner },
  { key: 'intermediate', label: 'Intermediate', level: 'A2–B1', note: 'The ergative core and the systems built on it.', drills: intermediate },
  { key: 'advanced',     label: 'Advanced', level: 'B1–B2', note: 'Once you reach these chapters.',          drills: advanced },
]

export default function DrillsMenu() {
  const total = TIERS.reduce((n, t) => n + t.drills.length, 0)
  let colorIndex = 0
  return (
    <div className="panel-section drills-board">
      <div className="panel-frame">

        <div className="panel-heading">
          <h1>Practice <span className="dot">·</span> Drills</h1>
          <p className="lead">
            <span className="tongan">Ngāue Fakaʻilo.</span>{' '}
            {total} targeted exercises, each isolating a single grammar pattern. Grouped by level and ordered by how often you will reach for them, not by chapter. Work down from Beginner as the chapters introduce each piece.
          </p>
        </div>

        {TIERS.map((tier) => (
          <div key={tier.key}>
            <div className="panel-subsection-bar">
              <span>{tier.label} <span className="dot">·</span> {tier.level} <span className="dot">·</span> {tier.drills.length} Drills</span>
              <span className="note">{tier.note}</span>
            </div>
            <div className="panel-cards">
              {tier.drills.map((d) => (
                <DrillCard key={d.id} drill={d} colorIndex={colorIndex++} />
              ))}
            </div>
          </div>
        ))}

        <div className="panel-colophon">
          <div><strong>{total} Drills</strong> · One pattern each · Grouped by level, ordered by frequency</div>
          <div className="tonga-sig">Ngāue lelei</div>
        </div>

      </div>
    </div>
  )
}
