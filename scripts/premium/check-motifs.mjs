import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { TRACED } from '../../src/premium/components/kupesi-approved.js'
import { APPROVED_MOTIF_KEYS } from '../../src/premium/lib/motif-policy.js'

const site = fileURLToPath(new URL('../../', import.meta.url))
const retiredNames = /(['"`])(?:petal|nested|saw|eye|xbox|diamond|steps)\1/g
const retiredAsset = /(?:cover-tiles|kupesi-tiles)(?:-[\w-]+)?\.(?:js|json|svg)/g

export function inspectMotifSource(name, source) {
  const issues = []
  if (/(?:cover-tiles|kupesi-tiles)/.test(path.basename(name))) issues.push(`${name}: retired artwork file in active source`)
  for (const match of source.matchAll(retiredAsset)) issues.push(`${name}: retired asset reference ${match[0]}`)
  // Scan active decorative components, including ternaries and sequence arrays.
  if (/Kupesi|motif-policy|lesson-colour/.test(source) || /Kupesi|motif-policy|lesson-colour/.test(name)) {
    for (const match of source.matchAll(retiredNames)) issues.push(`${name}: retired motif ${match[0]}`)
  }
  return issues
}

export function verifyApprovedGeometry(shapes, expected) {
  const issues = []
  if (Object.keys(shapes).sort().join() !== Object.keys(expected).sort().join()) issues.push('Approved motif keys changed')
  for (const [name, hash] of Object.entries(expected)) {
    const actual = createHash('sha256').update(JSON.stringify(shapes[name]) ?? '').digest('hex')
    if (actual !== hash) issues.push(`Approved geometry changed: ${name}; explicit owner approval required`)
  }
  return issues
}

export function checkMotifs() {
  const manifest = JSON.parse(fs.readFileSync(path.join(site, 'scripts/premium/approved-motifs.json'), 'utf8'))
  const issues = verifyApprovedGeometry(TRACED, manifest.shapes)
  const allowed = ['nest', 'leaf', 'lens', 'pinwheel']
  if (APPROVED_MOTIF_KEYS.join() !== allowed.join()) issues.push('The four-motif allowlist changed')
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'test') continue
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (/\.(?:[cm]?jsx?|css|svg|json)$/.test(entry.name)) issues.push(...inspectMotifSource(path.relative(site, file), fs.readFileSync(file, 'utf8')))
    }
  }
  walk(path.join(site, 'src/premium'))
  walk(path.join(site, 'public'))
  if (issues.length) throw new Error(`Unapproved website artwork:\n${issues.join('\n')}`)
  return { motifs: allowed, approvedShapes: Object.keys(TRACED).length, retiredReferences: 0 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(checkMotifs(), null, 2))
}
