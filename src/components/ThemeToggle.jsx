// The Light / Dark pill, lifted out of Layout.jsx on 2026-09-03 (UX-03) so
// /lessons, which renders outside <Layout />, can carry the identical control
// in the identical place. Same markup, same .theme-seg class; only the state
// moved, into lib/use-theme.js.
import { useTheme } from '../lib/use-theme'

export default function ThemeToggle() {
  const [dark, setDark] = useTheme()

  return (
    <div className="theme-seg" role="group" aria-label="Theme">
      <span
        className={!dark ? 'on' : ''}
        onClick={() => setDark(false)}
      >
        Light
      </span>
      <span
        className={dark ? 'on' : ''}
        onClick={() => setDark(true)}
      >
        Dark
      </span>
    </div>
  )
}
