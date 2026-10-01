// The six counted figures, shown on the membership page as secondary evidence
// (DECISIONS 2026-09-30 took them off the homepage). They are constants so the
// page never loads the large data files; src/premium/test/course-figures.test.js recomputes every value
// from its source file, so a change in the data fails that test until the
// figure here is updated. Counts recorded in
// reviews/conversion-redesign-2026-09-29/Baseline.md and Strategy.md (addendum).
export const COURSE_FIGURES = [
  // src/data/chapters.json: 52 lessons. Level names: src/lib/lesson-browser.js (LESSON_TIERS).
  { key: 'lessons', value: 52, label: 'lessons, Basic to Advanced', to: '/lessons' },
  // src/data/book-exercises.json: 1,605 exercise items, each with a non-empty answer.
  { key: 'exercises', value: 1605, label: 'exercise items, each with its answer', to: '/lessons/1#exercises' },
  // src/data/quizzes.json: 52 quizzes of 10 questions; 2,080 of 2,080 answer options carry an explanation.
  { key: 'quiz-questions', value: 520, label: 'quiz questions, every answer explained', to: '/quizzes' },
  // src/data/drills-catalog.js: 30 featured drills in 7 skill groups.
  { key: 'drills', value: 30, label: 'drills, grouped by skill', to: '/drills' },
  // src/data/book-vocabulary.json: 649 vocabulary entries (cards), the /cards deck and the /dictionary list.
  // Entries, not distinct headwords: phrases and separate senses count one each (645 distinct Tongan
  // forms). 601 entries belong to 51 lessons (1 to 52, none for 15); 48 are supplemental (chapter 0).
  { key: 'words', value: 649, label: 'vocabulary entries, as flip cards and in the dictionary', to: '/cards' },
  // public/downloads/Lea-Faka-Tonga.pdf: 674 pages (pdfinfo, 29 September 2026). The test reads
  // the PDF's page tree, so rebuilding the book fails the test until this is updated.
  { key: 'book-pages', value: 674, label: 'pages in the free book', book: true },
]
