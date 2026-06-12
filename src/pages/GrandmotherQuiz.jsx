import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'
import '../styles/quiz.css'

// Lead-magnet diagnostic. Real comprehension, gentle scoring. The point is the
// emotional realization + the opt-in, not a graded exam.
// Email endpoint is configurable; empty = local thank-you (no backend needed).
const EMAIL_ACTION = '' // TODO: Buttondown/Formspree POST endpoint

const QUESTIONS = [
  { ton: 'Kuo ke kai?', q: 'What did she just ask you?',
    options: ['Have you eaten?', 'Where are you going?', 'Did you sleep well?', 'Are you cold?'], answer: 0 },
  { ton: 'Haʻu ʻo kai.', q: 'What is she telling you to do?',
    options: ['Come and eat.', 'Go and play.', 'Sit and wait.', 'Come and sing.'], answer: 0 },
  { ton: 'ʻOku ou ʻofa atu kiate koe.', q: 'What did she just say to you?',
    options: ['I love you.', 'I forgive you.', 'I’m waiting for you.', 'I remember you.'], answer: 0 },
  { ton: 'ʻAlu ʻo fakamālō ki he ʻOtua.', q: 'What is she asking of you?',
    options: ['Go and give thanks to God.', 'Go and pray for rain.', 'Go to church now.', 'Go and sing a hymn.'], answer: 0 },
  { ton: 'ʻOku ou fiefia ʻiate koe.', q: 'What is she telling you?',
    options: ['I’m proud of you.', 'I’m worried about you.', 'I missed you.', 'I’m here for you.'], answer: 0 },
  { ton: 'Nofo ā, ʻofa atu.', q: 'She’s leaving. What did she say?',
    options: ['Goodbye — I love you.', 'Come back soon.', 'Sleep well now.', 'Be careful out there.'], answer: 0 },
]

const RESULTS = [
  { min: 0, band: 'She’s speaking, and her words are slipping away.',
    body: 'You caught almost none of it — and that’s not your fault. A language doesn’t die on the islands; it fades in the diaspora, one family at a time. The good news: you can start mending the thread today, and the first real sentence to your grandmother is closer than you think.' },
  { min: 3, band: 'You catch fragments. The thread is fraying.',
    body: 'You understand pieces — a word here, a phrase there — but the whole sentences are getting away from you. That gap is exactly what this course was built to close, in order, from the first sentence to the language of respect. Start now, while you still have the people to practise with.' },
  { min: 5, band: 'You understand more than you think.',
    body: 'You followed almost all of it. You’re not starting from zero — you’re closer than most. Now learn to answer her back: to hold a real conversation, to read the funeral program, to use the respect words at church. The whole arc is waiting, free.' },
]

const Logo = () => (
  <svg className="logo-mark" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
    <polygon points="0,0 50,0 0,50" /><polygon points="100,0 50,0 100,50" />
    <polygon points="100,100 50,100 100,50" /><polygon points="0,100 50,100 0,50" />
    <polygon points="25,25 50,25 25,50" /><polygon points="75,25 50,25 75,50" />
    <polygon points="75,75 50,75 75,50" /><polygon points="25,75 50,75 25,50" />
    <polygon points="37.5,37.5 50,37.5 37.5,50" /><polygon points="62.5,37.5 50,37.5 62.5,50" />
    <polygon points="62.5,62.5 50,62.5 62.5,50" /><polygon points="37.5,62.5 50,62.5 37.5,50" />
  </svg>
)

export default function GrandmotherQuiz() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const q = QUESTIONS[idx]
  const result = [...RESULTS].reverse().find(r => score >= r.min) || RESULTS[0]

  const choose = (i) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setScore(s => s + 1)
  }
  const next = () => {
    if (idx + 1 < QUESTIONS.length) { setIdx(idx + 1); setPicked(null) }
    else setFinished(true)
  }
  const submitEmail = (e) => {
    if (EMAIL_ACTION) return
    e.preventDefault(); setSent(true)
  }

  return (
    <div className="v11-landing quiz-page">
      <div className="top-band">
        <Link to="/" className="top-brand" style={{ textDecoration: 'none' }}>
          <Logo /><span className="wordmark">Lea Faka-Tonga</span>
        </Link>
        <div className="top-sub">A 60-Second Test · Can You Still Understand Your Grandmother?</div>
      </div>

      {!finished ? (
        <section className="quiz-stage">
          <div className="quiz-progress">
            <span>Question {String(idx + 1).padStart(2, '0')} / {String(QUESTIONS.length).padStart(2, '0')}</span>
            <div className="quiz-bar"><span style={{ width: `${((idx) / QUESTIONS.length) * 100}%` }} /></div>
          </div>

          <div className="quiz-card">
            <span className="quiz-grandma">She says:</span>
            <h1 className="quiz-phrase">{q.ton}</h1>
            <p className="quiz-q">{q.q}</p>
            <div className="quiz-options">
              {q.options.map((o, i) => {
                let cls = 'quiz-opt'
                if (picked !== null) {
                  if (i === q.answer) cls += ' correct'
                  else if (i === picked) cls += ' wrong'
                  else cls += ' dim'
                }
                return (
                  <button key={o} className={cls} onClick={() => choose(i)} disabled={picked !== null}>
                    <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span>{o}</span>
                  </button>
                )
              })}
            </div>
            {picked !== null && (
              <div className="quiz-next-row">
                <span className="quiz-feedback">{picked === q.answer ? 'Tonu — correct.' : `It was: ${q.options[q.answer]}`}</span>
                <button className="cta-btn" onClick={next}>
                  {idx + 1 < QUESTIONS.length ? 'Next →' : 'See your result →'}
                </button>
              </div>
            )}
          </div>
          <Link to="/chapters/1" className="quiz-skip">Skip the test — just start learning →</Link>
        </section>
      ) : (
        <section className="quiz-stage">
          <div className="quiz-result">
            <span className="quiz-score">{score} / {QUESTIONS.length}</span>
            <h1 className="quiz-result-band">{result.band}</h1>
            <p className="quiz-result-body">{result.body}</p>

            <div className="quiz-result-cta">
              <Link to="/chapters/1" className="cta-btn">Start the free course →</Link>
              <Link to="/support" className="cta-secondary">Why it’s free →</Link>
            </div>

            <div className="quiz-signup">
              {!sent ? (
                <form {...(EMAIL_ACTION ? { action: EMAIL_ACTION, method: 'post', target: '_blank' } : {})} onSubmit={submitEmail}>
                  <p className="quiz-signup-label">Want the 7-day <em>Grandmother Sprint</em> — your first real conversation in a week?</p>
                  <div className="quiz-signup-row">
                    <input type="email" name="email" required placeholder="your@email"
                      value={email} onChange={e => setEmail(e.target.value)} aria-label="Email" />
                    <button type="submit" className="cta-btn">Send me the Sprint →</button>
                  </div>
                </form>
              ) : (
                <p className="quiz-signup-label">Mālō ʻaupito — the Sprint is on its way. <em>Tauhi ʻa e lea.</em></p>
              )}
            </div>

            <p className="quiz-share">
              Know someone who’s forgetting? <Link to="/quiz">Send them the test.</Link>
            </p>
          </div>
        </section>
      )}

      <div className="offer-sec">
        <div className="panel-frame">
          <div className="colophon">
            <div><strong>Lea Faka-Tonga</strong> · The book is free · Built in the open</div>
            <Link to="/" style={{ color: 'var(--red)', textDecoration: 'none' }}>← Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
