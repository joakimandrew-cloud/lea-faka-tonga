/**
 * DrillFrame — wraps a drill Core in chrome appropriate to its mount.
 *
 * Currently a plain passthrough in both modes — no styling of its own:
 *   mode='full'    : standalone-route mode. Page wrappers (src/pages/*)
 *                    supply their own header + lesson aside.
 *   mode='compact' : in-chapter embedded mode. Vertical rhythm comes from
 *                    ChapterDrillAnchor's wrapper, not from this frame.
 *
 * The `mode` prop is accepted (and ignored) so call sites keep working and
 * mount-specific chrome can be reintroduced here later without touching them.
 */

export default function DrillFrame({ children }) {
  return <div>{children}</div>
}
