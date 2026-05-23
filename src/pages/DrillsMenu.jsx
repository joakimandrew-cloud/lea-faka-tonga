import { Link } from 'react-router-dom'

const foundational = [
  {
    num: '01',
    route: '/tense-swap',
    title: <>Tense<br />Swapper</>,
    desc: 'Watch one verb shift through four tenses.',
    action: 'Swap',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h13l-3-3" />
        <path d="M20 16H7l3 3" />
      </svg>
    ),
  },
  {
    num: '02',
    route: '/first-word',
    title: <>First-Word<br />Quiz</>,
    desc: 'Predict the sentence from its opening particle.',
    action: 'Predict',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1.3-1.3 1.9-2 2.4-.3.3-.5.7-.5 1.1" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    num: '03',
    route: '/adjective-flip',
    title: <>Adjective<br />Flip</>,
    desc: 'Retrain word-order: noun before adjective.',
    action: 'Flip',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9h10l-3-3" />
        <path d="M20 15H10l3 3" />
        <path d="M16 9h4M4 15h2" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    num: '04',
    route: '/skeleton-filler',
    title: <>Skeleton<br />Filler</>,
    desc: 'Fill the slots that shape every Tongan sentence.',
    action: 'Fill',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="10" width="5" height="6" />
        <rect x="10" y="10" width="5" height="6" />
        <rect x="17" y="10" width="4" height="6" />
        <path d="M4 6h16" strokeDasharray="1 3" />
      </svg>
    ),
  },
  {
    num: '05',
    route: '/possessive-sort',
    title: <>Possessive<br />Sorter</>,
    desc: 'ʻeku or hoku? Sort by doer or receiver.',
    action: 'Sort',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16M4 12h16" />
        <circle cx="7" cy="7" r="1.6" fill="currentColor" />
        <circle cx="17" cy="17" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    num: '06',
    route: '/clusivity',
    title: <>Clusivity<br />Corner</>,
    desc: 'Four "we"s. Pick the one that fits.',
    action: 'Choose',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="10" r="3" />
        <circle cx="15" cy="10" r="3" />
        <path d="M4 20c0-3 2.5-5 5-5M20 20c0-3-2.5-5-5-5" />
      </svg>
    ),
  },
]

const advanced = [
  {
    num: '07',
    route: '/faka-sort',
    title: <>Faka-<br />Pattern Sorter</>,
    desc: 'One prefix, four jobs. Match each use.',
    action: 'Sort',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" />
        <rect x="13" y="3" width="8" height="8" />
        <rect x="3" y="13" width="8" height="8" />
        <rect x="13" y="13" width="8" height="8" />
      </svg>
    ),
  },
  {
    num: '08',
    route: '/definiteness-flip',
    title: <>Definiteness<br />Flip</>,
    desc: 'Toggle "some" ↔ "the" — watch the sentence rebuild.',
    action: 'Toggle',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="12" r="3" />
        <circle cx="17" cy="12" r="3" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
  {
    num: '09',
    route: '/cleft-builder',
    title: <>Cleft<br />Builder</>,
    desc: 'Front the subject, hold its place with a pronoun.',
    action: 'Build',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="14" width="4" height="6" />
        <rect x="10" y="9" width="4" height="11" />
        <rect x="17" y="4" width="4" height="16" />
      </svg>
    ),
  },
  {
    num: '10',
    route: '/accent-placement',
    title: <>Accent<br />Placement</>,
    desc: 'Pick where the definitive accent falls.',
    action: 'Place',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18L12 6l6 12" />
        <path d="M8.5 13.5h7" />
        <path d="M14 6l2-2" />
      </svg>
    ),
  },
  {
    num: '11',
    route: '/verbal-noun',
    title: <>Verbal Noun<br />Converter</>,
    desc: 'Convert verb subjects to possessive forms.',
    action: 'Convert',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h8M4 12h8M4 17h8" />
        <path d="M16 9l4 3-4 3" />
      </svg>
    ),
  },
  {
    num: '12',
    route: '/reciprocity',
    title: <>Reciprocity<br />Picker</>,
    desc: 'Build the fe-…-ʻaki sandwich for "each other".',
    action: 'Pick',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 8l-4 4 4 4" />
        <path d="M17 8l4 4-4 4" />
        <path d="M3 12h18" />
      </svg>
    ),
  },
  {
    num: '13',
    route: '/emotional-article',
    title: <>Emotional<br />Article 2×2</>,
    desc: 'Definite × emotional. Pick the right article.',
    action: 'Match',
    icon: (
      <svg className="panel-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" />
        <rect x="13" y="3" width="8" height="8" />
        <rect x="3" y="13" width="8" height="8" />
        <rect x="13" y="13" width="8" height="8" />
        <path d="M17 17a2 2 0 0 1 2-2" strokeDasharray="1 2" />
      </svg>
    ),
  },
]

function DrillCard({ drill, delay }) {
  return (
    <Link
      to={drill.route}
      className="panel-card reveal"
      style={{ transitionDelay: `${delay}s` }}
    >
      <div className="panel-card-body">
        <div className="panel-card-top">
          <span className="panel-card-num">{drill.num}</span>
          {drill.icon}
        </div>
        <div className="panel-card-title">{drill.title}</div>
        <p className="panel-card-desc">{drill.desc}</p>
        <div className="panel-card-foot">
          <span className="panel-card-action">{drill.action}</span>
          <span className="panel-card-arrow">→</span>
        </div>
      </div>
    </Link>
  )
}

export default function DrillsMenu() {
  return (
    <div className="panel-section">
      <div className="panel-frame">

        <div className="panel-heading">
          <h1>Practice <span className="dot">·</span> Drills</h1>
          <p className="lead">
            <span className="tongan">Ngāue Fakaʻilo.</span>{' '}
            Thirteen targeted exercises — each one isolates a single grammar pattern. Start with Foundational drills; come back to Advanced Patterns once you reach those chapters.
          </p>
        </div>

        <div className="panel-subsection-bar">
          <span>Foundational · 6 Drills</span>
          <span className="note">Start here.</span>
        </div>
        <div className="panel-cards cards-6">
          {foundational.map((d, i) => (
            <DrillCard key={d.route} drill={d} delay={0.05 * i} />
          ))}
        </div>

        <div className="panel-subsection-bar">
          <span>Advanced Patterns · 7 Drills</span>
          <span className="note">Most useful after reaching the relevant chapter.</span>
        </div>
        <div className="panel-cards cards-7">
          {advanced.map((d, i) => (
            <DrillCard key={d.route} drill={d} delay={0.05 * i} />
          ))}
        </div>

        <div className="panel-colophon">
          <div><strong>13 Drills</strong> · One pattern each · Mapped to the chapters that introduce them</div>
          <div className="tonga-sig">Ngāue lelei</div>
        </div>

      </div>
    </div>
  )
}
