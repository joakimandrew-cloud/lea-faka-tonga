import referenceCharts from '../../src/data/reference-charts.js'
import { TOPIC_PAGES, QUESTIONS_PAGE } from '../../src/lib/topic-pages.js'
import {
  AUDIO_PROGRESS,
  BEGINNER_PATH,
  CHARTS_HUB,
  HOME_HUB,
} from '../../src/seo/learning-paths.js'

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const BLOCK_STYLE =
  'max-width:68rem;margin:0 auto;padding:3rem 1.25rem;' +
  'color:var(--text,#171717);background:var(--bg,#fff);' +
  "font-family:Inter,Arial,sans-serif;line-height:1.6;font-size:1rem"
const H1_STYLE = 'font-size:2.25rem;line-height:1.1;margin:0 0 1rem;font-weight:800'
const H2_STYLE = 'font-size:1.35rem;line-height:1.25;margin:2rem 0 .6rem;font-weight:750'
const P_STYLE = 'margin:0 0 1rem'
const LIST_STYLE = 'margin:1rem 0 1.5rem;padding-left:1.35rem'
const link = (href, label) =>
  `<a href="${escapeHtml(href)}" style="color:#a7290d;text-decoration:underline">${escapeHtml(label)}</a>`

function shell(content) {
  return `<main style="${BLOCK_STYLE}">${content}</main>`
}

export function renderHomeHub() {
  const steps = BEGINNER_PATH.steps.map(step => (
    `<li>` +
    `<h2 style="${H2_STYLE}">${escapeHtml(step.number)} · ${escapeHtml(step.title)}</h2>` +
    `<p style="${P_STYLE}">${escapeHtml(step.text)}</p>` +
    `<p style="${P_STYLE}">${step.links.map(item => link(item.to, item.label)).join(' &middot; ')}</p>` +
    `</li>`
  )).join('')

  return shell(
    `<article>` +
    `<p style="${P_STYLE}">${escapeHtml(HOME_HUB.eyebrow)}</p>` +
    `<h1 style="${H1_STYLE}">${escapeHtml(HOME_HUB.heading.join(' '))}</h1>` +
    `<p style="${P_STYLE}">${escapeHtml(HOME_HUB.lead)}</p>` +
    `<p style="${P_STYLE}">${link('/lessons/1', 'Start Lesson 1, free')} All 52 lessons are open during the free preview.</p>` +
    `<p style="${P_STYLE}">${link('/downloads/Lea-Faka-Tonga.pdf', 'Download the free PDF')} &middot; ` +
    `${link('/downloads/Lea-Faka-Tonga.epub', 'Download the free EPUB')}</p>` +
    `<section aria-labelledby="static-learning-paths">` +
    `<p style="${P_STYLE}">${escapeHtml(BEGINNER_PATH.eyebrow)}</p>` +
    `<h2 id="static-learning-paths" style="${H2_STYLE}">${escapeHtml(BEGINNER_PATH.heading)}</h2>` +
    `<p style="${P_STYLE}">${escapeHtml(BEGINNER_PATH.lead)}</p>` +
    `<ol style="${LIST_STYLE}">${steps}</ol>` +
    `<p style="${P_STYLE}">${escapeHtml(AUDIO_PROGRESS)}</p>` +
    `</section>` +
    `</article>`
  )
}

export function renderLessonsHub(chapters) {
  const lessons = chapters.map(chapter => (
    `<li>` +
    `<h2 style="${H2_STYLE}">${link(`/lessons/${chapter.chapter}`, `Lesson ${chapter.chapter}: ${chapter.title}`)}</h2>` +
    `<p style="${P_STYLE}">${escapeHtml(chapter.topics.slice(0, 2).join(' · '))}</p>` +
    `</li>`
  )).join('')

  return shell(
    `<article>` +
    `<p style="${P_STYLE}">The full course · Beginner to advanced</p>` +
    `<h1 style="${H1_STYLE}">52 lessons. One clear path.</h1>` +
    `<p style="${P_STYLE}">Every lesson has worked examples, exercises and a 10-question quiz. Start at the beginning or find the lesson you need.</p>` +
    `<p style="${P_STYLE}">All 52 lessons are open during the free preview.</p>` +
    `<ol style="${LIST_STYLE}">${lessons}</ol>` +
    `</article>`
  )
}

function renderChartTable(table) {
  const label = table.label
    ? `<h3 style="${H2_STYLE}">${escapeHtml(table.label)}</h3>` +
      (table.sublabel ? `<p style="${P_STYLE}">${escapeHtml(table.sublabel)}</p>` : '')
    : ''
  const head = table.headers.map(cell => `<th scope="col">${escapeHtml(cell)}</th>`).join('')
  const body = table.rows.map(row => (
    `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
  )).join('')
  return `${label}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

export function renderChartsHub(charts = referenceCharts) {
  const sections = charts.map(chart => (
    `<section>` +
    `<h2 style="${H2_STYLE}">${escapeHtml(chart.title)}</h2>` +
    (chart.description ? `<p style="${P_STYLE}">${escapeHtml(chart.description)}</p>` : '') +
    chart.tables.map(renderChartTable).join('') +
    (chart.notes.length ? `<ul style="${LIST_STYLE}">${chart.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>` : '') +
    `</section>`
  )).join('')

  return shell(
    `<article>` +
    `<p style="${P_STYLE}">${escapeHtml(CHARTS_HUB.eyebrow)}</p>` +
    `<h1 style="${H1_STYLE}">${escapeHtml(CHARTS_HUB.heading)}</h1>` +
    `<p style="${P_STYLE}">${escapeHtml(CHARTS_HUB.lead)}</p>` +
    `<nav aria-label="Continue learning" style="${P_STYLE}">${CHARTS_HUB.links.map(item => link(item.to, item.label)).join(' &middot; ')}</nav>` +
    sections +
    `</article>`
  )
}

export function renderTopicsHub(topics = TOPIC_PAGES) {
  const cards = topics.map(topic => (
    `<li>` +
    `<h2 style="${H2_STYLE}">${link(topic.to, topic.label)}</h2>` +
    `<p style="${P_STYLE}">${escapeHtml(topic.blurb)}</p>` +
    `</li>`
  )).join('')

  return shell(
    `<article>` +
    `<p style="${P_STYLE}">Reference · Read in any order</p>` +
    `<h1 style="${H1_STYLE}">Topics</h1>` +
    `<p style="${P_STYLE}">Seven pages that answer one common question each, outside the lesson order. Read one on its own, and it ends by pointing into the lessons that cover it. Not started yet? Read the ${link(QUESTIONS_PAGE.to, QUESTIONS_PAGE.link)}.</p>` +
    `<p style="${P_STYLE}">${link('/charts', 'Grammar charts')}</p>` +
    `<ul style="${LIST_STYLE}">${cards}</ul>` +
    `</article>`
  )
}
