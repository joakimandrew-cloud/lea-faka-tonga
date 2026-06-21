import { useState, useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useChapter } from '../contexts/ChapterContext'
import chapters from '../data/chapters.json'
import sentencePatterns from '../data/sentence-patterns.json'
import TeachingPanel from '../components/TeachingPanel'
import SlotBuilder from '../components/SlotBuilder'
import BookChapterContent from '../components/BookChapterContent'
import BookExercises from '../components/BookExercises'
import SentenceLabCore from '../drills/SentenceLabCore'

// ---------------------------------------------------------------------------
// Entry-point → pattern-ID mapping
// ---------------------------------------------------------------------------

const ENTRY_TO_PATTERNS = {
  statement:            ['s01', 's02', 's03', 's04', 's07'],
  location_state:       ['s05', 's06'],
  negation:             ['s12'],
  negation_impersonal:  ['s12'],
  experiencer:          ['s24'],
  noun_subject:         ['s22'],
  command:              ['s08'],
  command_plural:       ['s09'],
  suggestion:           ['s11'],
  prohibition:          ['s10'],
  ko_identification:    ['s18'],
  ko_negation:          ['s13'],
  ko_question_what:     ['s16'],
  ko_question_who:      ['s15'],
  ko_question_where:    ['s17'],
}

/** Patterns taught in this chapter (book_chapters includes chapterNum) */
function getPatternsForChapter(chapterNum) {
  return sentencePatterns.patterns.filter(p =>
    p.data_status === 'complete' &&
    p.book_chapters.includes(chapterNum)
  )
}

export default function ChapterPractice() {
  const { num } = useParams()
  const chapterNum = parseInt(num, 10)
  const { setChapter } = useChapter()
  const [patternIndex, setPatternIndex] = useState(null)
  const [showHint, setShowHint] = useState(false)

  // Keep global chapter context in sync. Must run in an effect, not the
  // render body: setChapter updates ChapterProvider's state AND writes
  // localStorage, neither of which may happen during render.
  useEffect(() => {
    setChapter(chapterNum)
  }, [chapterNum, setChapter])

  // Hoisted above the early return so every hook runs unconditionally
  // (react-hooks/rules-of-hooks). Safe: getPatternsForChapter doesn't read
  // `chapter`, and the result is discarded on the not-found path anyway.
  const chapterPatterns = useMemo(() => getPatternsForChapter(chapterNum), [chapterNum])

  const chapter = chapters.find(c => c.chapter === chapterNum)
  if (!chapter) {
    return <div className="text-[var(--text-muted)]">Lesson not found.</div>
  }

  const selectedPattern = patternIndex !== null ? chapterPatterns[patternIndex] : null

  const prevCh = chapterNum > 1 ? chapterNum - 1 : null
  const nextCh = chapterNum < 52 ? chapterNum + 1 : null
  const prevChapter = prevCh ? chapters.find(c => c.chapter === prevCh) : null
  const nextChapter = nextCh ? chapters.find(c => c.chapter === nextCh) : null

  const handlePatternSelect = (index) => {
    setPatternIndex(index)
    setShowHint(false)
  }

  const handleNextPattern = () => {
    if (patternIndex < chapterPatterns.length - 1) {
      setPatternIndex(patternIndex + 1)
      setShowHint(false)
    } else {
      setPatternIndex(null)
    }
  }

  const handleBackToList = () => {
    setPatternIndex(null)
    setShowHint(false)
  }

  return (
    <div className="reading-page">
      {/* Chapter header */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-[var(--accent)] text-2xl font-bold">{chapterNum}</span>
          <h1 className="text-xl text-[var(--text-strong)]">{chapter.title}</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {chapter.topics.map((topic, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 border border-[var(--border)] text-[var(--text-muted)]"
            >
              {topic}
            </span>
          ))}
        </div>

        <div className="flex gap-3 text-sm">
          {prevCh && (
            <Link
              to={`/lessons/${prevCh}`}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              onClick={() => setPatternIndex(null)}
            >
              &larr; Lesson {prevCh}
            </Link>
          )}
          {nextCh && (
            <Link
              to={`/lessons/${nextCh}`}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              onClick={() => setPatternIndex(null)}
            >
              Lesson {nextCh} &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Full book chapter content */}
      <BookChapterContent chapterNum={chapterNum} />

      {/* This chapter's own book exercises, rendered interactively in place of
          the static ### Exercises / ### Answers sections (stripped above). */}
      <BookExercises chapterNum={chapterNum} />

      {/* Teaching summary (shown only when no book content exists) */}
      {!chapterNum && chapter.teaching && <TeachingPanel teaching={chapter.teaching} />}

      {/* ── PRACTICE: THIS CHAPTER'S PATTERNS ── */}
      {chapterPatterns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm text-[var(--accent)] uppercase tracking-widest border-b border-[var(--border)] pb-2 mb-4">
            Practice
          </h2>

          {selectedPattern ? (
            <div>
              {/* Progress + navigation */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[var(--accent)] text-sm">{selectedPattern.title}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    Pattern {patternIndex + 1} of {chapterPatterns.length}
                  </div>
                </div>
                <button
                  onClick={handleBackToList}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  &larr; All patterns
                </button>
              </div>

              {/* Hint toggle */}
              <div className="mb-4">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  {showHint ? 'Hide hint' : 'Show hint'}
                </button>
                {showHint && selectedPattern.examples?.length > 0 && (
                  <div className="mt-2 border-l-2 border-[var(--accent)]/50 pl-3">
                    {selectedPattern.examples.map((ex, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-[var(--accent)] font-tongan">{ex.tongan}</span>
                        <span className="text-[var(--text-muted)] ml-2">{ex.english}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SlotBuilder */}
              <SlotBuilder
                key={`drill-${selectedPattern.id}-${chapterNum}`}
                patternId={selectedPattern.id}
                maxChapter={chapterNum}
                onBack={handleBackToList}
                onNext={patternIndex < chapterPatterns.length - 1 ? handleNextPattern : null}
              />
            </div>
          ) : (
            /* Pattern list */
            <div className="space-y-1">
              {chapterPatterns.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => handlePatternSelect(i)}
                  className="block w-full text-left px-4 py-3 border border-[var(--accent)]/20 hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors cursor-pointer"
                >
                  <div className="text-[var(--text)] mb-1">{p.title}</div>
                  <div className="text-sm text-[var(--text-muted)]">{p.label_en}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No own-pattern practice → the Sentence Lab. Chapters that teach
          morphology / phonology / fixed formulas / register (faka-, suffixes,
          reduplication, the definitive accent, greetings, respect language…)
          have no NEW buildable sentence frame; instead of faking one, we anchor
          the Sentence Lab here. It seeds from structures ALREADY taught by this
          chapter, so the learner gets real swap-a-word practice with no
          invented Tongan. (Coverage-cliff ruling, DECISIONS.md 2026-06-13.) */}
      {chapterPatterns.length === 0 && (
        <div className="mb-8">
          <h2 className="text-sm text-[var(--accent)] uppercase tracking-widest border-b border-[var(--border)] pb-2 mb-4">
            Practice
          </h2>
          <p className="text-[var(--text-muted)] mb-4">
            This lesson builds on structures you have already learned. Take a sentence you
            can already make and swap a word to watch the English meaning change.
          </p>
          <SentenceLabCore chapterNum={chapterNum} />
        </div>
      )}

      {/* ── Bottom chapter navigation (Continue to next) ── */}
      {(nextChapter || prevChapter) && (
        <div className="mt-16 pt-8 border-t border-[var(--border)] text-center">
          {nextChapter && (
            <Link
              to={`/lessons/${nextCh}`}
              onClick={() => { setPatternIndex(null); window.scrollTo(0, 0) }}
              className="inline-block w-full sm:w-auto text-left border border-[var(--accent)] rounded-lg px-7 py-4 hover:bg-[var(--accent-faint)] transition-colors"
            >
              <div className="text-[var(--accent)] text-[15px] font-medium">
                Continue to Lesson {nextCh} &rarr;
              </div>
              <div className="text-[var(--text-muted)] text-sm mt-0.5">{nextChapter.title}</div>
            </Link>
          )}
          {prevChapter && (
            <Link
              to={`/lessons/${prevCh}`}
              onClick={() => { setPatternIndex(null); window.scrollTo(0, 0) }}
              className="block mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              &larr; Back to Lesson {prevCh}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
