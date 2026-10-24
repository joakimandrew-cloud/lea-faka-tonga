// The one flagged picture placement (reviews/lesson-course-2026-10-24/Direction.md,
// "Pictures"): the teacher's clap pose beside the finish burst in the done
// state, shown only with ?pictures=1. Off by default; the recommendation to
// Andrew at Step 5 is none.
export const FINISH_PICTURE = {
  src: '/lesson-pictures/teacher-clap-240.png',
  width: 240,
  height: 450,
  source: 'video/shorts/art/characters/teacher/poses/clap.png',
  sourceSha256: '69bda7652ea4b9ae7d8eb16333d35c2199317a1bab45281399db072a56e73d7f',
}

/** True when the page was opened with ?pictures=1. Read once on mount; false on the server. */
export function picturesOn() {
  try { return new URLSearchParams(globalThis.window?.location?.search || '').get('pictures') === '1' } catch { return false }
}
