import EntryMotif from '../components/EntryMotif.jsx'
import SentenceBuilder from '@app/pages/SentenceBuilder.jsx'
import TerminalBuilder from '@app/pages/TerminalBuilder.jsx'
import { useTitle } from '../lib/title.js'
import '../styles/source-core.css'
import '../styles/source-builders.css'
import '../styles/source-utilities.css'

function keepControlKeysLocal(event) {
  const control = event.target.closest?.('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')
  const consumed = event.key === 'Enter' || event.key === ' ' || /^[1-9]$/.test(event.key)
  if (control && consumed) {
    event.stopPropagation()
  }
}

export default function SourceBuilder({ mode = 'sentence' }) {
  const terminal = mode === 'terminal'
  useTitle(terminal ? 'Terminal Builder' : 'Sentence Builder')
  const Builder = terminal ? TerminalBuilder : SentenceBuilder

  return (
    <section className="source-builder-shell" data-builder-mode={mode}>
      <div className="premium-core premium-core-builder" onKeyDownCapture={keepControlKeysLocal}>
        <Builder entryMark={index => <EntryMotif size={18} index={index} />} />
      </div>
    </section>
  )
}
