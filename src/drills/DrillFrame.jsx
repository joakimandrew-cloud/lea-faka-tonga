/**
 * DrillFrame — wraps a drill Core in chrome appropriate to its mount.
 *
 * mode='full'    : standalone-route mode. Page wrappers (src/pages/*) supply
 *                  their own header + lesson aside outside this frame, so
 *                  the frame itself is a thin passthrough.
 * mode='compact' : in-chapter embedded mode. No header, no lesson aside —
 *                  the chapter prose just above is the lesson. Adds a
 *                  light vertical rhythm so the drill sits cleanly in flow.
 */

export default function DrillFrame({ mode = 'compact', children }) {
  if (mode === 'compact') {
    return <div className="drill-frame-compact">{children}</div>
  }
  return <div className="drill-frame-full">{children}</div>
}
