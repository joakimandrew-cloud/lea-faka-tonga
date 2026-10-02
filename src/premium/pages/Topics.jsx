import SourceTopics from '@app/pages/Topics.jsx'
import { useTitle } from '../lib/title.js'
import EntryMotif from '../components/EntryMotif.jsx'
import '../styles/reference.css'
import '../styles/topics.css'

export default function Topics() {
  useTitle('Topics')
  return (
    <div className="premium-reference premium-reference-topics">
      <SourceTopics entryMark={index => <EntryMotif index={index} />} />
    </div>
  )
}
