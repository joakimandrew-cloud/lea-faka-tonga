import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkMotifs } from './scripts/premium/check-motifs.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(root, 'src')
const premium = path.join(src, 'premium')

// Imported course tools retain their logic and storage; the approved shell
// supplies their styles. Never suppress the premium layer's own stylesheet.
function courseStyleBridge() {
  const empty = '\0course-css-in-premium'
  return {
    name: 'course-style-bridge',
    enforce: 'pre',
    resolveId(source, importer) {
      if (importer?.startsWith(src + path.sep) && !importer.startsWith(premium + path.sep) && /\.css(?:\?|$)/.test(source)) return empty
      return null
    },
    load(id) { return id === empty ? 'export default undefined' : null },
  }
}

// A test build is the dev server, or a build made with LFT_TEST_BUILD=1. It carries the
// capture flags (?structure, ?band, ?look, ?still, ?solo, ?view, ?tile), the /__proto/lesson
// route and the /scrub hub. A production build leaves __TEST_BUILD__ false, so that code is
// dropped and /scrub stays redirected to the home page (plan 2026-11-05-lesson-page-simplify).
export default defineConfig(({ command }) => ({
  base: '/',
  // eslint-disable-next-line no-undef
  define: { __TEST_BUILD__: JSON.stringify(command === 'serve' || process.env.LFT_TEST_BUILD === '1') },
  plugins: [{ name: 'approved-motifs', buildStart() { checkMotifs() } }, courseStyleBridge(), react(), tailwindcss()],
  resolve: { alias: { '@app': src, '@book': path.join(root, 'book') }, dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'] },
  server: { host: '127.0.0.1' },
  test: { exclude: ['**/node_modules/**', '**/dist/**', 'src/premium/test/**'] },
}))
