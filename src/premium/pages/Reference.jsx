import SourceReferenceCharts from '@app/pages/ReferenceCharts.jsx'
import { useTitle } from '../lib/title.js'
import '../styles/reference.css'

export default function Reference() {
  useTitle('Grammar charts')
  return (
    <div className="premium-reference premium-reference-charts">
      <SourceReferenceCharts />
    </div>
  )
}
