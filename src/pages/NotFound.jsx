import { Link } from 'react-router-dom'

// Catch-all for unknown routes (site-analysis fix #6). Deep links to real
// routes never land here — they resolve via the prerendered pages or the
// 404.html bounce; this is for genuinely wrong URLs.
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold mb-2">
        Page not found
      </p>
      <h1 className="text-2xl text-[var(--text-strong)] font-semibold mb-3">
        That page isn&rsquo;t part of the course.
      </h1>
      <p className="text-[var(--text-muted)] mb-6 max-w-md">
        The lesson list has everything, in order. Or start from the beginning.
      </p>
      <div className="flex gap-3">
        <Link to="/lessons" className="px-4 py-2 bg-[var(--accent)] text-white font-semibold">
          All lessons
        </Link>
        <Link to="/" className="px-4 py-2 border border-[var(--border)] text-[var(--text-strong)]">
          Home
        </Link>
      </div>
    </div>
  )
}
