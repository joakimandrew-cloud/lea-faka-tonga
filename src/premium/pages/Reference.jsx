import SourceReferenceCharts from '@app/pages/ReferenceCharts.jsx'
import { Link } from 'react-router-dom'
import { useTitle } from '../lib/title.js'
import { CHARTS_HUB } from '@app/seo/learning-paths.js'
import '../styles/reference.css'

export default function Reference() {
  useTitle('Grammar charts')
  return (
    <div className="premium-reference premium-reference-charts">
      <header className="section-heading">
        <p className="section-eyebrow">{CHARTS_HUB.eyebrow}</p>
        <h1>{CHARTS_HUB.heading}</h1>
        <p className="section-lead">{CHARTS_HUB.lead}</p>
      </header>
      <nav className="charts-jump" aria-label="Continue learning">
        <span>Keep learning</span>
        <div>
          {CHARTS_HUB.links.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </div>
      </nav>
      <SourceReferenceCharts />
    </div>
  )
}
