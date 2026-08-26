import { Link } from 'react-router-dom'
import { TOPIC_PAGES } from '../lib/topic-pages'

/**
 * The uppercase strip of standalone topic pages.
 *
 * It lived inline in the Layout footer and carried two of the seven, which left
 * the five added on 2026-08-26 with no internal link pointing at them. Lifted
 * out here so the homepage can render the identical strip: "/" is <Landing />
 * outside <Layout />, so it cannot reach anything Layout owns. Same reason
 * lib/nav-links.js was lifted out.
 *
 * Styling is unchanged from the Layout version: Inter, 11px, tracked
 * uppercase, middot separated. Seven entries wrap to more than one line, so
 * the separator is bound to the link before it with a non-breaking space and
 * never starts a line, and the strip carries its own line-height.
 *
 * `className` sets the ink. Layout passes the theme-following muted colour;
 * the homepage passes nothing and takes its colour from the landing palette
 * (.v11-landing .topic-strip), because that band is always light and the
 * theme-following variable would go invisible on it in dark mode.
 */
export default function TopicLinks({ className = '', style }) {
  return (
    <div
      className={`topic-strip ${className}`.trim()}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '11px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        lineHeight: 1.9,
        ...style,
      }}
    >
      {TOPIC_PAGES.map((t, i) => (
        <span key={t.to}>
          <Link to={t.to} className="hover:text-[var(--accent)] transition-colors">
            {t.strip}
          </Link>
          {i + 1 < TOPIC_PAGES.length && <>&nbsp;&middot;{' '}</>}
        </span>
      ))}
    </div>
  )
}
