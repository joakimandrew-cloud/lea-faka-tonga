import { motion as Motion } from 'motion/react'
import { Md } from '../lesson/Blocks.jsx'
import { KupesiTile } from '../Kupesi.jsx'

export function QuizChoices({ q, picked, answered, choose, demo = false }) {
  const Choice = demo ? 'div' : 'button'
  return (
<div className="qz-opts" role={demo ? undefined : "radiogroup"} aria-label={demo ? undefined : "Answers"}>
                {q.options.map((o, i) => {
                  const state = !answered ? '' : o.correct ? 'is-right' : i === picked ? 'is-wrong' : 'is-dim'
                  return (
                    <Choice key={o.label} role={demo ? undefined : "radio"} aria-checked={demo ? undefined : i === picked} className={`qz-opt ${state}`} onClick={demo ? undefined : () => choose(i)} disabled={demo ? undefined : answered && state === 'is-dim'}>
                      <kbd className="qz-l">{o.label}</kbd>
                      <span className="qz-ot"><Md text={o.text} /></span>
                      <span className="qz-mark" aria-hidden="true">{state === 'is-right' ? '✓' : state === 'is-wrong' ? '×' : ''}</span>
                    </Choice>
                  )
                })}
              </div>
  )
}

export function QuizExplanation({ q, chosen, still = false }) {
  return (
<Motion.div className={`qz-why ${chosen.correct ? 'ok' : 'no'}`} initial={still ? false : { opacity: 0, y: 12, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} transition={{ duration: still ? 0 : .45, ease: [.16, 1, .3, 1] }}>
                    <div className="qz-why-in">
                      <span className="qz-why-tile" aria-hidden="true"><KupesiTile kind={chosen.correct ? 'leaf' : 'nest'} framed /></span>
                      <div>
                        <p className="qz-why-h">{chosen.correct ? 'Right.' : 'Not this one.'}</p>
                        <p className="qz-why-p"><Md text={chosen.explanation} /></p>
                        {!chosen.correct && (
                          <p className="qz-why-p qz-why-c"><strong>Why the answer is right:</strong> <Md text={q.options.find(o => o.correct).explanation} /></p>
                        )}
                      </div>
                    </div>
                  </Motion.div>
  )
}
