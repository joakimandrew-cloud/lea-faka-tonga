import SourceTopics from '@app/pages/Topics.jsx'
import { useTitle } from '../lib/title.js'
import '../styles/reference.css'

export default function Topics() {
  useTitle('Topics')
  return (
    <div className="premium-reference premium-reference-topics">
      <SourceTopics />
    </div>
  )
}
