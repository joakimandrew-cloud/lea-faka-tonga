import { useState, useEffect } from 'react'

export default function SentenceChallenge({ section }) {
  const { challenges, slots, pattern } = section
  const slotKeys = pattern.structure

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selections, setSelections] = useState({})
  const [result, setResult] = useState(null)
  const [wrongSlots, setWrongSlots] = useState([])
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState({})
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setCurrentIndex(0)
    setSelections({})
    setResult(null)
    setWrongSlots([])
    setScore(0)
    setAttempts({})
    setFinished(false)
  }, [section.id])

  const challenge = challenges[currentIndex]
  if (!challenge) return null

  const handleChange = (slotKey, value) => {
    setSelections(prev => ({ ...prev, [slotKey]: value }))
    if (result === 'wrong') {
      setResult(null)
      setWrongSlots([])
    }
  }

  const handleCheck = () => {
    const answer = challenge.answer
    const wrong = []
    for (let i = 0; i < slotKeys.length; i++) {
      const selected = selections[slotKeys[i]] || ''
      const correct = answer[i]
      if (selected !== correct) wrong.push(slotKeys[i])
    }

    if (wrong.length === 0) {
      setResult('correct')
      if (!attempts[currentIndex]) {
        setScore(prev => prev + 1)
      }
    } else {
      setResult('wrong')
      setWrongSlots(wrong)
      setAttempts(prev => ({ ...prev, [currentIndex]: true }))
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 >= challenges.length) {
      setFinished(true)
      return
    }
    setCurrentIndex(prev => prev + 1)
    setSelections({})
    setResult(null)
    setWrongSlots([])
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelections({})
    setResult(null)
    setWrongSlots([])
    setScore(0)
    setAttempts({})
    setFinished(false)
  }

  const allSelected = slotKeys.every(key => selections[key] && selections[key] !== '')

  if (finished) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl text-[var(--accent)] mb-4">
          {score}/{challenges.length} correct
        </div>
        <p className="text-[var(--text-muted)] mb-8">
          {score === challenges.length
            ? 'Perfect score!'
            : score >= challenges.length / 2
              ? 'Good work. Keep practicing.'
              : 'Keep going. Review the grammar notes and try again.'}
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="text-xs text-[var(--text-muted)]">
          {currentIndex + 1} / {challenges.length}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-lg text-[var(--text)] mb-2">{challenge.english}</div>
        <div className="text-sm text-[var(--text-muted)]">{challenge.hint}</div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {slotKeys.map(key => {
          const slot = slots[key]
          const isWrong = wrongSlots.includes(key)

          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {slot.label}
              </label>
              <select
                value={selections[key] || ''}
                onChange={e => handleChange(key, e.target.value)}
                disabled={result === 'correct'}
                className={`px-4 py-2 bg-[var(--bg-tone)] border text-[var(--text)] font-tongan appearance-none cursor-pointer transition-colors focus:outline-none min-w-[180px] disabled:opacity-60 ${
                  isWrong
                    ? 'border-[var(--clay)]'
                    : result === 'correct'
                      ? 'border-[var(--accent)]'
                      : 'border-[var(--border)] hover:border-[var(--accent)] focus:border-[var(--accent)]'
                }`}
              >
                <option value="">Select...</option>
                {slot.options.map(opt => (
                  <option key={opt.tongan} value={opt.tongan}>
                    {opt.tongan} ({opt.english})
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mb-6">
        {result !== 'correct' && (
          <button
            onClick={handleCheck}
            disabled={!allSelected}
            className="px-6 py-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Check
          </button>
        )}
        {result === 'correct' && (
          <button
            onClick={handleNext}
            className="px-6 py-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
          >
            {currentIndex + 1 >= challenges.length ? 'Finish' : 'Next'}
          </button>
        )}
      </div>

      {result === 'correct' && (
        <div className="border border-[var(--accent-faint)] bg-[var(--accent-faint)] px-4 py-3 text-[var(--accent)] text-sm">
          Correct!
        </div>
      )}

      {result === 'wrong' && challenge.feedback_on_wrong && (
        <div className="border border-[var(--clay)] opacity-80 bg-[var(--bg-tone)] px-4 py-3 text-[var(--clay)] text-sm font-tongan">
          {challenge.feedback_on_wrong}
        </div>
      )}
    </div>
  )
}
