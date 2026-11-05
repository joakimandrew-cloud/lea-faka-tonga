/**
 * The people marks: flat, in the site's own colours, the same three in every lesson. The
 * speaker has a speech-bubble tail, the listener a fixed listening mark, the third person
 * neither (DECISIONS.md 2026-09-24 and 2026-09-26, without the painted cast). A red frame
 * around a mark means it is in the group the word means. A mark never moves or changes for
 * decoration.
 */
const BODY = 'M4 47 V41 C4 32 12 27 22 27 C32 27 40 32 40 41 V47 a4 4 0 0 1 -4 4 H8 a4 4 0 0 1 -4 -4 Z'

export function PersonMark({ who, w = 44, frame = 0 }) {
  const h = (w * 52) / 44
  return (
    <svg className={`pm pm-${who}`} width={w} height={h} viewBox="0 0 44 52" aria-hidden="true">
      {frame > 0 && <rect className="pm-frame" x="-3.5" y="-3.5" width="51" height="59" rx="10" style={{ opacity: frame }} />}
      <circle className="pm-fill" cx="22" cy="13.5" r="10.5" />
      <path className="pm-fill" d={BODY} />
      {who === 'speaker' && (
        <path className="pm-bubble" d="M33.5 1.25 h4.5 a4.75 4.75 0 0 1 4.75 4.75 v.5 a4.75 4.75 0 0 1 -4.75 4.75 h-2.75 l-4.25 4 .75 -4.25 a4.75 4.75 0 0 1 -2.75 -4.5 v-.5 a4.75 4.75 0 0 1 4.5 -4.75 Z" />
      )}
      {who === 'listener' && (
        <g className="pm-listen">
          <path d="M9.5 8.5 a7.5 7.5 0 0 0 0 10" />
          <path d="M5 5.5 a12.5 12.5 0 0 0 0 16" />
        </g>
      )}
    </svg>
  )
}
