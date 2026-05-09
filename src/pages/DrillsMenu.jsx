import { Link } from 'react-router-dom'

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const foundational = [
  {
    num: '01', route: '/tense-swap', color: 'c5',
    en: 'Tense Swapper', tongan: 'Fetongi ʻo e Taimi',
    desc: 'One sentence, four tenses, two polarities. Watch the verb stay still while the particle changes.',
    icon: <><path d="M4 8h12l-3-3M20 16H8l3 3" /></>,
  },
  {
    num: '02', route: '/first-word', color: 'c6',
    en: 'First-Word Quiz', tongan: 'Sivi ʻo e Fuofua Lea',
    desc: 'See only the opening particle. Predict the shape of the sentence. This is the reflex fluent speakers use.',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M8 12a4 4 0 0 1 8 0M12 8v8" /></>,
  },
  {
    num: '03', route: '/adjective-flip', color: 'c8',
    en: 'Adjective Flip', tongan: 'Fokotuʻu Tonu',
    desc: 'English says "big boat." Tongan says vaka lahi. Click the words in order. Retrain your word-order reflex.',
    icon: <><path d="M4 8h8l-3-3M20 16h-8l3 3" /><path d="M15 8h5M4 16h5" strokeDasharray="2 2" /></>,
  },
  {
    num: '04', route: '/skeleton-filler', color: 'c9',
    en: 'Skeleton Filler', tongan: 'Fakakakato Lea',
    desc: 'Every Tongan sentence is a shape with slots. Fill the slots, see the pattern. Seven shapes, infinite sentences.',
    icon: <><rect x="3" y="10" width="5" height="5" /><rect x="10" y="10" width="5" height="5" /><rect x="17" y="10" width="4" height="5" /><path d="M4 6h16" strokeDasharray="1 3" /></>,
  },
  {
    num: '05', route: '/possessive-sort', color: 'c7',
    en: 'Possessive Sorter', tongan: 'Vaheʻi ʻo e Lea',
    desc: 'ʻeku or hoku? Sort each noun into its possessive class. Build intuition for the doer / receiver principle.',
    icon: <><path d="M12 3v18M3 12h18" /><circle cx="7" cy="7" r="1.5" /><circle cx="17" cy="17" r="1.5" /></>,
  },
  {
    num: '06', route: '/clusivity', color: 'c10',
    en: 'Clusivity Corner', tongan: 'ʻO Kitautolu mo Kimautolu',
    desc: 'Tongan has four "we"s. Is the listener included? Two people or three? Train the pause that makes you pick the right one.',
    icon: <><circle cx="9" cy="10" r="3" /><circle cx="15" cy="10" r="3" /><path d="M4 20c0-3 2.5-5 5-5M20 20c0-3-2.5-5-5-5M12 13v7" /></>,
  },
]

const advanced = [
  {
    num: '07', route: '/faka-sort', color: 'c11',
    en: 'Faka- Pattern Sorter', tongan: 'Vaheʻi ʻo e Faka-',
    desc: 'One prefix, four jobs. Manner, causative, temporal, or pertaining-to-one? Sort each faka- word into the work it does.',
    icon: <><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /></>,
  },
  {
    num: '08', route: '/definiteness-flip', color: 'c12',
    en: 'Definiteness Flip', tongan: 'Fetongi ʻo e ʻUluaki Lea',
    desc: 'Toggle "some" ↔ "the" and watch the whole Tongan sentence rebuild. The ergative pivot at the heart of Chapter 19.',
    icon: <><circle cx="7" cy="12" r="3" /><circle cx="17" cy="12" r="3" /><path d="M10 12h4" /><path d="M17 8v8M7 8v8" strokeDasharray="2 2" /></>,
  },
  {
    num: '09', route: '/cleft-builder', color: 'c13',
    en: 'Cleft Builder', tongan: 'Tumu ʻo e Sentenisi',
    desc: 'Build a cleft sentence tile by tile: Ko + subject + naʻá + ne + verb. Front the subject, hold its place with the resumptive pronoun.',
    icon: <><rect x="3" y="14" width="4" height="6" /><rect x="10" y="9" width="4" height="11" /><rect x="17" y="4" width="4" height="16" /><path d="M3 10l4-4 4 2 4-6" /></>,
  },
  {
    num: '10', route: '/accent-placement', color: 'c14',
    en: 'Accent Placement', tongan: 'Fetuʻutaki ʻo e Fakamamafa',
    desc: 'The definitive accent lands on the last word of the noun group — not the noun itself. Pick where it falls in each phrase.',
    icon: <><path d="M6 18L12 6l6 12" /><path d="M8.5 13.5h7" /><path d="M14 6l2-2" /></>,
  },
  {
    num: '11', route: '/verbal-noun', color: 'c15',
    en: 'Verbal Noun Converter', tongan: 'Fetongi Leaʻaki',
    desc: 'When a verb phrase nominalizes, its subject becomes a possessive: heʻeku, heʻene, he ʻenau. Convert the pronoun to the right form.',
    icon: <><path d="M4 6h8M4 12h8M4 18h8" /><path d="M16 8l4 4-4 4" /></>,
  },
  {
    num: '12', route: '/reciprocity', color: 'c16',
    en: 'Reciprocity Picker', tongan: 'Fili ʻo e Fetokoniʻaki',
    desc: 'Build the fe-…-ʻaki sandwich for "each other" actions. Prefix, stem, suffix — three moving parts, one reciprocal verb.',
    icon: <><path d="M7 8l-4 4 4 4" /><path d="M17 8l4 4-4 4" /><path d="M3 12h18" /></>,
  },
  {
    num: '13', route: '/emotional-article', color: 'c17',
    en: 'Emotional Article 2×2', tongan: 'Kupu ʻo e Ongo',
    desc: 'e / ha / siʻi / siʻa. Definite × emotional. Read the scenario and pick the article that matches both axes.',
    icon: <><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /><path d="M17 17c0-1.1.9-2 2-2" strokeDasharray="1 2" /></>,
  },
]

function DrillCard({ drill, delay }) {
  return (
    <Link to={drill.route} className={`menu-card ${drill.color} reveal`} style={{ transitionDelay: `${delay}s` }}>
      <span className="menu-card-num">{drill.num}</span>
      <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        {drill.icon}
      </svg>
      <div className="menu-card-title-en">{drill.en}</div>
      <div className="menu-card-title-tongan">{drill.tongan}</div>
      <p className="menu-card-desc">{drill.desc}</p>
      <div className="menu-card-arrow">Begin <ArrowIcon /></div>
    </Link>
  )
}

export default function DrillsMenu() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <h1 className="dashboard-hero-title reveal d2">Practice Drills</h1>
        <p className="dashboard-hero-sub reveal d3">
          <span className="tongan">Ngāue Fakaʻilo.</span>{' '}
          Thirteen targeted exercises — each one isolates a single grammar pattern. Start with Foundational drills; come back to Advanced Patterns once you reach those chapters.
        </p>
      </section>

      <div className="drills-section-label reveal d3">Foundational</div>
      <div className="menu-grid">
        {foundational.map((d, i) => (
          <DrillCard key={d.route} drill={d} delay={0.05 * i} />
        ))}
      </div>

      <div className="drills-section-label reveal" style={{ marginTop: '2.5rem' }}>
        Advanced Patterns
        <span className="drills-section-note">Most useful after reaching the relevant chapter.</span>
      </div>
      <div className="menu-grid">
        {advanced.map((d, i) => (
          <DrillCard key={d.route} drill={d} delay={0.05 * i} />
        ))}
      </div>
    </div>
  )
}
