import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { PassThrough } from 'node:stream'
import React from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import { BESPOKE } from '../../lib/drill-routes.js'
import { STATIC_META } from '../../seo/meta.js'

const root = cwd()
const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document')
const localStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
Object.defineProperty(globalThis, 'document', { configurable: true, value: { hidden: false } })
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => {} } })
after(() => {
  if (documentDescriptor) Object.defineProperty(globalThis, 'document', documentDescriptor)
  else delete globalThis.document
  if (localStorageDescriptor) Object.defineProperty(globalThis, 'localStorage', localStorageDescriptor)
  else delete globalThis.localStorage
})
const source = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const canonicalApp = source('src/App.jsx')
const premiumApp = source('src/premium/App.jsx')
const routePaths = text => [...text.matchAll(/<Route\b[^>]*\bpath="([^"]+)"/g)].map(match => match[1])
const canonicalPatterns = routePaths(canonicalApp).filter(pattern => pattern !== '*')
const premiumPatterns = new Set([
  ...routePaths(premiumApp).filter(pattern => pattern !== '*'),
  ...Object.values(BESPOKE),
  '/hero-lab',
  '/scrub',
  '/hero-scrub',
])

function patternRegex(pattern) {
  if (pattern.endsWith('/*')) return new RegExp(`^${pattern.slice(0, -2).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/.*)?$`)
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
  return new RegExp(`^${escaped}$`)
}

function covered(pathname) {
  return [...premiumPatterns].some(pattern => patternRegex(pattern).test(pathname))
}

function sample(pattern) {
  return pattern
    .replace(':num', '1')
    .replace(':slug', 'kulisi')
    .replace(':id', 'aspect-picker')
}

function distRoutes() {
  const dist = path.join(root, 'dist')
  assert.ok(fs.existsSync(dist), 'production build must run before the release-route test')
  const routes = []
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.name === 'index.html') {
        const relative = path.relative(dist, directory).split(path.sep).join('/')
        routes.push(relative ? `/${relative}` : '/')
      }
    }
  }
  walk(dist)
  return routes.sort()
}

function renderRoute(App, pathname) {
  return new Promise((resolve, reject) => {
    const errors = []
    let html = ''
    let settled = false
    const output = new PassThrough()
    output.setEncoding('utf8')
    output.on('data', chunk => { html += chunk })
    output.on('error', reject)
    output.on('end', () => {
      settled = true
      clearTimeout(timeout)
      if (errors.length) reject(errors[0])
      else resolve(html)
    })
    const stream = renderToPipeableStream(
      React.createElement(MemoryRouter, { initialEntries: [pathname] }, React.createElement(App)),
      {
        onAllReady() { stream.pipe(output) },
        onShellError(error) { reject(error) },
        onError(error) { errors.push(error) },
      },
    )
    const timeout = setTimeout(() => {
      if (!settled) {
        stream.abort()
        reject(new Error(`SSR timed out for ${pathname}`))
      }
    }, 10_000)
  })
}

test('premium routes mechanically cover every clean production route and prerender path', () => {
  const missingCanonical = canonicalPatterns.map(sample).filter(pathname => !covered(pathname))
  assert.deepEqual(missingCanonical, [], `clean production routes missing from premium router: ${missingCanonical.join(', ')}`)

  const generated = distRoutes()
  assert.equal(generated.length, 211, 'current production build generated all 211 routes')
  const missingGenerated = generated.filter(pathname => !covered(pathname))
  assert.deepEqual(missingGenerated, [], `prerender routes missing from premium router: ${missingGenerated.join(', ')}`)

  for (const route of Object.values(BESPOKE)) assert.equal(covered(route), true, `bespoke route retained: ${route}`)
  for (const route of ['/reciprocity', '/emotional-article', '/definiteness-flip']) {
    assert.equal(covered(route), true, `legacy redirect retained: ${route}`)
  }

  assert.equal(canonicalPatterns.includes('/community'), false, 'community was never an active clean production route')
  assert.equal(canonicalPatterns.includes('/changelog'), false, 'changelog was never an active clean production route')
  assert.equal(Object.hasOwn(STATIC_META, '/community'), false)
  assert.equal(Object.hasOwn(STATIC_META, '/changelog'), false)
  assert.equal(generated.includes('/community'), false)
  assert.equal(generated.includes('/changelog'), false)
})

test('the actual premium App renders every generated route without the NotBuilt fallback', async () => {
  const server = await createServer({
    root,
    configFile: path.join(root, 'vite.config.js'),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'silent',
  })
  try {
    const { default: App } = await server.ssrLoadModule('/src/premium/App.jsx')
    const routes = [...new Set([...distRoutes(), ...canonicalPatterns.map(sample)])].sort()
    for (const pathname of routes) {
      const html = await renderRoute(App, pathname)
      assert.ok(html.length > 200, `${pathname} produces a nonempty application shell`)
      assert.doesNotMatch(html, /class="wr-missing|Page not found/, `${pathname} does not fall through to NotBuilt`)
    }

    const control = await renderRoute(App, '/route-parity-negative-control')
    assert.match(control, /class="wr-missing|Page not found/, 'negative control proves the fallback assertion can fail')
  } finally {
    await server.close()
  }
})
