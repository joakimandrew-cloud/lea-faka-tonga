#!/usr/bin/env node
// Aggregate audits/eva-flags.json into a marker-keyed triage report.
//
// Pass A–D produce many similar findings (same `marker` repeated across
// hundreds of items). Resolution is much more efficient when worked
// per-marker — fixing the master vocab list or one exercise pattern can
// resolve dozens of findings at once.
//
// Output: audits/eva-triage.md — a markdown table per issueType, sorted by
// finding count, with sample evidence and chapters affected.
//
// Run: node lea-faka-tonga-app/scripts/triage-eva-findings.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')
const FLAGS = path.join(REPO_ROOT, 'audits', 'eva-flags.json')
const OUT = path.join(REPO_ROOT, 'audits', 'eva-triage.md')

function aggregate(findings) {
  // Group by (issueType, marker) → { count, chapters, surfaces, samples }
  const groups = new Map()
  for (const f of findings) {
    const key = `${f.issueType}::${f.marker || '(none)'}`
    if (!groups.has(key)) {
      groups.set(key, {
        issueType: f.issueType,
        marker: f.marker || '(none)',
        severity: f.severity,
        minChapter: f.minChapter,
        count: 0,
        chapters: new Set(),
        surfaces: new Set(),
        samples: [],
      })
    }
    const g = groups.get(key)
    g.count++
    g.chapters.add(f.chapter)
    g.surfaces.add(f.surface)
    if (g.samples.length < 3) {
      g.samples.push({
        chapter: f.chapter,
        itemId: f.itemId,
        surface: f.surface,
        evidence: (f.evidence?.text || '').slice(0, 140),
        location: f.surfaceLocation,
      })
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count)
}

function fmtChapters(set) {
  const arr = [...set].sort((a, b) => a - b)
  if (arr.length <= 6) return arr.join(', ')
  return `${arr[0]}…${arr[arr.length - 1]} (${arr.length} chapters)`
}

function severityRank(s) {
  return { blocker: 0, major: 1, minor: 2 }[s] ?? 3
}

function writeReport(groups, totalFindings, totalItems) {
  const lines = []
  lines.push('# EVA Findings Triage')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Total findings: ${totalFindings} across ${totalItems} items`)
  lines.push('')
  lines.push('Workflow: pick a row, decide once for the whole row, fix at')
  lines.push('the source (vocab master, grammar gates, or exercise pattern).')
  lines.push('Each fix resolves every finding sharing that (issueType, marker).')
  lines.push('')

  // Group rows by issueType, sorted by issueType severity then count.
  const byIssue = new Map()
  for (const g of groups) {
    if (!byIssue.has(g.issueType)) byIssue.set(g.issueType, [])
    byIssue.get(g.issueType).push(g)
  }

  // Sort issueTypes by severity then total count (descending).
  const issueTotals = [...byIssue.entries()].map(([issueType, gs]) => ({
    issueType,
    severity: gs[0].severity,
    total: gs.reduce((s, g) => s + g.count, 0),
    groups: gs,
  }))
  issueTotals.sort((a, b) => {
    const sr = severityRank(a.severity) - severityRank(b.severity)
    if (sr !== 0) return sr
    return b.total - a.total
  })

  lines.push('## Summary by issue type')
  lines.push('')
  lines.push('| Issue type | Severity | Findings | Unique markers | Chapters affected |')
  lines.push('|---|---|---|---|---|')
  for (const it of issueTotals) {
    const allChapters = new Set()
    for (const g of it.groups) for (const c of g.chapters) allChapters.add(c)
    lines.push(
      `| ${it.issueType} | ${it.severity} | ${it.total} | ${it.groups.length} | ${allChapters.size} |`
    )
  }
  lines.push('')

  for (const it of issueTotals) {
    lines.push(`## ${it.issueType} — ${it.total} findings, ${it.severity}`)
    lines.push('')
    lines.push('| Marker | Count | Chapters | First sample |')
    lines.push('|---|---|---|---|')
    const top = it.groups.slice(0, 30)
    for (const g of top) {
      const sample = g.samples[0]
      const sampleStr = sample
        ? `\`${(sample.evidence || '').replace(/`/g, '\\`').slice(0, 80)}\` (Ch ${sample.chapter})`
        : ''
      const minStr = g.minChapter ? ` (min Ch ${g.minChapter})` : ''
      lines.push(
        `| \`${g.marker}\`${minStr} | ${g.count} | ${fmtChapters(g.chapters)} | ${sampleStr} |`
      )
    }
    if (it.groups.length > 30) {
      lines.push(`| _...${it.groups.length - 30} more markers..._ | | | |`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function main() {
  const data = JSON.parse(fs.readFileSync(FLAGS, 'utf8'))
  const groups = aggregate(data.findings)
  const md = writeReport(groups, data.findings.length, data.totalItemsScanned)
  fs.writeFileSync(OUT, md + '\n', 'utf8')
  console.log(`Wrote ${path.relative(REPO_ROOT, OUT)}`)
  console.log(`Aggregated ${data.findings.length} findings into ${groups.length} unique (issueType, marker) groups.`)
  console.log('Top 5 by leverage:')
  for (const g of groups.slice(0, 5)) {
    console.log(`  ${g.issueType} :: ${g.marker} → ${g.count} findings across ${g.chapters.size} chapters`)
  }
}

main()
