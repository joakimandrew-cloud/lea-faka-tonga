import EntryMotif from '../components/EntryMotif.jsx'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supportUrl } from '@app/lib/partner-link.js'
import { useTitle } from '../lib/title.js'
import '../styles/services.css'

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
    options: ['Goodbye, I love you.', 'Come back soon.', 'Sleep well now.', 'Be careful out there.'], answer: 0 },
]

const RESULTS = [
  { min: 0, band: 'She’s speaking, and her words are slipping away.',
    body: 'You caught almost none of it, and that’s not your fault. A language doesn’t die on the islands; it fades in the diaspora, one family at a time. The good news: you can start mending the thread today, and the first real sentence to your grandmother is closer than you think.' },
  { min: 3, band: 'You catch fragments. The thread is fraying.',
    body: 'You understand pieces (a word here, a phrase there) but the whole sentences are getting away from you. That gap is exactly what this course was built to close, in order, from the first sentence to the language of respect. Start now, while you still have the people to practise with.' },
  { min: 5, band: 'You understand more than you think.',
    body: 'You followed almost all of it. You’re not starting from zero: you’re closer than most. Now learn to answer her back: to hold a real conversation, to read the funeral program, to use the respect words at church. The whole arc is waiting, free.' },
]

export default function GrandmotherQuiz() {
  useTitle('Can you understand your grandmother?')
  const supportHref = supportUrl()
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const question = QUESTIONS[idx]
  const result = [...RESULTS].reverse().find(item => score >= item.min) || RESULTS[0]

  const choose = (answer) => {
    if (picked !== null) return
    setPicked(answer)
    if (answer === question.answer) setScore(current => current + 1)
  }

  const next = () => {
    if (idx + 1 < QUESTIONS.length) {
      setIdx(current => current + 1)
      setPicked(null)
    } else {
      setFinished(true)
    }
  }

  return (
    <div className="service-page service-grandmother">
      <header className="service-hero service-quiz-hero">
        <div className="wrap service-hero-inner">
          <p className="eyebrow">A 60-second test</p>
          <h1 className="display">Can you still understand<br /><span>your grandmother?</span></h1>
        </div>
      </header>

      <div className="wrap service-body service-quiz-body">
        {!finished ? (
          <section className="grandmother-stage" aria-labelledby="grandmother-question">
            <div className="grandmother-progress">
              <span>Question {String(idx + 1).padStart(2, '0')} / {String(QUESTIONS.length).padStart(2, '0')}</span>
              <div className="grandmother-progress-track" aria-hidden="true">
                <span style={{ width: `${(idx / QUESTIONS.length) * 100}%` }} />
              </div>
            </div>

            <div className="grandmother-card">
              <p className="grandmother-kicker">She says:</p>
              <p className="grandmother-phrase" lang="to">{question.ton}</p>
              <h2 id="grandmother-question">{question.q}</h2>
              <div className="grandmother-options" role="group" aria-labelledby="grandmother-question">
                {question.options.map((option, optionIndex) => {
                  let className = 'grandmother-option'
                  if (picked !== null) {
                    if (optionIndex === question.answer) className += ' is-correct'
                    else if (optionIndex === picked) className += ' is-wrong'
                    else className += ' is-dim'
                  }
                  return (
                    <button
                      key={option}
                      type="button"
                      className={className}
                      onClick={() => choose(optionIndex)}
                      disabled={picked !== null}
                    >
                      <span className="grandmother-option-letter" aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span>
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>

              {picked !== null && (
                <div className="grandmother-next">
                  <p role="status">{picked === question.answer ? 'Tonu: correct.' : `It was: ${question.options[question.answer]}`}</p>
                  <button type="button" className="btn btn-primary" onClick={next}>
                    {idx + 1 < QUESTIONS.length ? 'Next →' : 'See your result →'}
                  </button>
                </div>
              )}
            </div>

            <Link to="/lessons/1" state={{ fromStart: true }} className="grandmother-skip">
              Skip the test, just start learning <EntryMotif size={18} index={1} />
            </Link>
          </section>
        ) : (
          <section className="grandmother-result" aria-labelledby="grandmother-result-title">
            <p className="grandmother-score">{score} / {QUESTIONS.length}</p>
            <h2 id="grandmother-result-title" className="display">{result.band}</h2>
            <p className="grandmother-result-body">{result.body}</p>
            <div className="service-actions">
              <Link to="/lessons/1" state={{ fromStart: true }} className="btn btn-primary">Start the free course <EntryMotif size={20} /></Link>
              <a href={supportHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Support the work</a>
            </div>
            <p className="grandmother-share">
              Know someone who’s forgetting? <Link to="/quiz">Send them the test.</Link>
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
