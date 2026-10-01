import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import {
  AUDIO_MEMBERSHIP_NOTICE,
  EXISTING_SUPPORTER_NOTICE,
  LIFETIME_MEMBERSHIP_NOTICE,
  LIFETIME_MEMBERSHIP_URL,
  MEMBERSHIP_RECORD_NOTICE,
  MEMBERSHIP_RECOVERY_EMAIL,
  MEMBERSHIP_RECOVERY_NOTICE,
} from '../lib/membership-offer.js'
import { COURSE_FIGURES } from '../lib/course-figures.js'

// The membership page and the offer notice (conversion redesign, Step 4).
// The one purchase CTA is the verified US$35 item; the general Buy Me a Coffee
// page stays reachable only as an optional donation; the offer's approved
// sentences appear word for word; nothing pops up or waits. Revised 2026-09-30
// (Offer-Wording.md): the product is named "Lifetime membership", US$99 appears
// only with the audio condition, and "or more" is gone (the item is a fixed US$35).

const site = cwd()
const viteOptions = {
  root: site,
  configFile: path.join(site, 'vite.config.js'),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'silent',
}
const wrap = node => React.createElement(MemoryRouter, null, node)
const hrefs = html => [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'))
// React escapes the apostrophe-free offer text unchanged; compare on decoded text.
const text = html => html.replace(/<[^>]+>/g, ' ').replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replace(/\s+/g, ' ')

test('the membership page carries the approved offer and routes money only to the US$35 item', async () => {
  const server = await createServer(viteOptions)
  try {
    const { default: Membership } = await server.ssrLoadModule('/src/premium/pages/Membership.jsx')
    const { DEFAULT_SUPPORT_URL, supportUrl } = await server.ssrLoadModule('/src/lib/partner-link.js')
    assert.equal(supportUrl(), DEFAULT_SUPPORT_URL, 'the general support route is the plain donation page')
    const html = renderToStaticMarkup(wrap(React.createElement(Membership)))
    const body = text(html)

    for (const sentence of [AUDIO_MEMBERSHIP_NOTICE, LIFETIME_MEMBERSHIP_NOTICE, EXISTING_SUPPORTER_NOTICE, MEMBERSHIP_RECORD_NOTICE, MEMBERSHIP_RECOVERY_NOTICE]) {
      assert.ok(body.includes(sentence), `approved sentence present: ${sentence}`)
    }
    assert.match(body, /Free now\. Yours for life for US\$35\./)
    assert.ok(body.indexOf(LIFETIME_MEMBERSHIP_NOTICE) < body.indexOf(AUDIO_MEMBERSHIP_NOTICE), 'the lede gives US$35 before the US$99 condition')
    assert.ok(body.includes('A donation. One payment of US$35 through Buy Me a Coffee includes Lifetime membership and the audio.'))
    assert.ok(body.includes('The lessons stay open while audio is added. Lifetime membership is US$35 until audio covers every Tongan example, including sentences and exercises; then the website moves to paid membership and Lifetime membership becomes US$99. No launch date has been announced.'))
    assert.ok(body.includes('Lifetime membership is a fixed US$35 through the membership button. The general support page accepts optional donations of any amount, which do not include membership.'))
    assert.match(body, /Secure Lifetime membership US\$35/)
    assert.doesNotMatch(body, /or more|no deadline|never\slose|first\s250/i, 'no retired offer wording')
    assert.doesNotMatch(body, /Why now|Today’s price is US\$35/, 'the repeated standalone price section is gone')
    assert.doesNotMatch(body, /Secure lifetime membership|With lifetime membership/, 'the product name keeps its capital L')
    for (const match of body.matchAll(/US\$99/g)) {
      const around = body.slice(Math.max(0, match.index - 260), match.index + 260)
      assert.match(around, /audio/, 'US$99 always travels with the audio condition')
      assert.doesNotMatch(around, /\b(?:20\d\d|January|February|March|April|May|June|July|August|September|October|November|December)\b/, 'US$99 never with a date')
    }
    // The course figures sit on this page as a compact list, each one linked.
    assert.equal((html.match(/class="mb-figures__item"/g) || []).length, COURSE_FIGURES.length)
    assert.doesNotMatch(html, /wr-inventory/, 'the homepage band is gone')

    const links = hrefs(html)
    const external = links.filter(href => /^https?:/.test(href))
    assert.equal(links.filter(href => href === LIFETIME_MEMBERSHIP_URL).length, 2, 'membership button at the top and at the close')
    assert.deepEqual(external.filter(href => href !== LIFETIME_MEMBERSHIP_URL), [DEFAULT_SUPPORT_URL], 'the only other external link is the general support page')
    assert.match(html, new RegExp(`href="${DEFAULT_SUPPORT_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>General support page`))
    assert.ok(links.includes('/lessons/1'), 'with no progress, the close offers Lesson 1')
    assert.ok(links.includes('/dictionary'))
    assert.ok(links.includes(`mailto:${MEMBERSHIP_RECOVERY_EMAIL}`), 'the recovery address is a link')
    assert.equal(MEMBERSHIP_RECOVERY_NOTICE.split(MEMBERSHIP_RECOVERY_EMAIL).length, 2, 'the recovery sentence names the one address constant exactly once')
    for (const sentence of [MEMBERSHIP_RECORD_NOTICE, MEMBERSHIP_RECOVERY_NOTICE]) {
      assert.doesNotMatch(sentence, /purchase|bought/, 'record and recovery answers say "payment" and "when you paid" (Codex Step 17, finding 3)')
    }

    assert.doesNotMatch(html, /role="dialog"|aria-modal|countdown/i, 'no popup, modal or countdown')
    assert.equal(body.includes('\u2014'), false, 'no em dash in visible text')
  } finally {
    await server.close()
  }
})

test('the shared notice uses approved lifetime copy and preserves the end offer and finish link', async () => {
  const server = await createServer(viteOptions)
  try {
    const { default: MembershipNotice, MembershipEndOffer, MembershipFinishLine } = await server.ssrLoadModule('/src/premium/components/MembershipNotice.jsx')
    const html = renderToStaticMarkup(wrap(React.createElement(MembershipNotice)))
    const body = text(html)
    assert.match(html, /<aside class="membership-notice" aria-labelledby="membership-notice-title">/)
    assert.ok(body.includes('Free preview'))
    assert.ok(body.includes('We’re working on adding audio to every Tongan example. Once it’s complete, lifetime website membership will cost US$99.'))
    assert.ok(body.includes('US$35'))
    assert.doesNotMatch(body, /or more|before the price increases|per year/)
    assert.ok(body.includes(EXISTING_SUPPORTER_NOTICE))
    assert.deepEqual(hrefs(html), [LIFETIME_MEMBERSHIP_URL])

    const end = renderToStaticMarkup(wrap(React.createElement(MembershipEndOffer, {
      id: 'lessons-membership-title', placement: 'end', title: 'All 52 lessons are open during the free preview.', lead: AUDIO_MEMBERSHIP_NOTICE,
    })))
    assert.match(end, /id="lessons-membership-title"/)
    assert.doesNotMatch(end, /id="membership-notice-title"/, 'the lessons-list copy never duplicates the lesson notice id')

    const finish = renderToStaticMarkup(wrap(React.createElement(MembershipFinishLine)))
    assert.deepEqual(hrefs(finish), ['/support'], 'the finish line is a text link, never a checkout button')
    assert.ok(text(finish).includes('If the course is helping you, a one-time donation of US$35 now secures Lifetime membership, including the audio.'))
    assert.ok(text(finish).includes('About Lifetime membership'))

    // No delay and no dismissal memory: neither component sets a timer or writes storage.
    for (const file of ['src/premium/components/MembershipNotice.jsx', 'src/premium/pages/Membership.jsx']) {
      assert.doesNotMatch(fs.readFileSync(path.join(site, file), 'utf8'), /setTimeout|setInterval|localStorage|sessionStorage|onClose=|useState\(/, file)
    }
  } finally {
    await server.close()
  }
})

test('the built /support page is a real page for readers without JavaScript, still out of the index', () => {
  const dist = path.join(site, 'dist')
  assert.ok(fs.existsSync(dist), 'production build must run before this test')
  const page = fs.readFileSync(path.join(dist, 'support/index.html'), 'utf8')
  assert.ok(page.includes(`href="${LIFETIME_MEMBERSHIP_URL}"`), 'static body links to the US$35 item')
  assert.match(page, /<meta name="robots" content="noindex, follow" \/>/)
  assert.match(page, /<title>Lifetime membership, US\$35 \| Lea Faka-Tonga<\/title>/)
  assert.ok(page.includes('Secure Lifetime membership, US$35'), 'static body names the product')
  assert.doesNotMatch(page, /or more now secures|never\slose|first\s250/i)
  const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
  assert.doesNotMatch(sitemap, /\/support</, '/support stays out of the sitemap')
})

test('the Roll of Keepers keeps its acknowledgements and drops the first-250 invitation', async () => {
  const server = await createServer(viteOptions)
  try {
    const { default: Keepers } = await server.ssrLoadModule('/src/premium/pages/Keepers.jsx')
    const { DEFAULT_SUPPORT_URL } = await server.ssrLoadModule('/src/lib/partner-link.js')
    const html = renderToStaticMarkup(wrap(React.createElement(Keepers)))
    const body = text(html)
    for (const kept of ['Keepers of the language', 'The Roll of', 'Every name here helped so that a Tongan family, somewhere, learns their language for free.', 'This wall is being carved.']) {
      assert.ok(body.includes(kept), `acknowledgement kept: ${kept}`)
    }
    assert.ok(body.includes('People who send in a correction can be thanked on this roll.'))
    assert.doesNotMatch(body, /Every name here paid/, 'the lead covers corrections as well as payments (Codex Step 17, finding 5)')
    assert.doesNotMatch(body, /first\s250|Founding Keeper|Add your name/i, 'no obsolete invitation')
    assert.deepEqual(hrefs(html), ['/support', DEFAULT_SUPPORT_URL], 'membership page first, then the optional donation')
    assert.ok(body.includes('About Lifetime membership'))
    assert.equal(body.includes('\u2014'), false, 'no em dash in visible text')
  } finally {
    await server.close()
  }
})

test('the homepage "Stays free" group keeps the outlined PDF and EPUB buttons (Codex Step 17, finding 4)', async () => {
  const server = await createServer(viteOptions)
  try {
    const { default: Home } = await server.ssrLoadModule('/src/premium/pages/Home.jsx')
    const { PDF_URL, EPUB_URL } = await server.ssrLoadModule('/src/premium/components/Chrome.jsx')
    const html = renderToStaticMarkup(wrap(React.createElement(Home)))
    const start = html.indexOf('Stays free, member or not')
    assert.ok(start > 0, 'the group is on the page')
    const group = html.slice(start, html.indexOf('</div></div>', start))
    assert.match(group, /class="wr-home__downloads"/)
    assert.deepEqual(hrefs(group.slice(group.indexOf('wr-home__downloads'))).slice(0, 2), [PDF_URL, EPUB_URL], 'PDF then EPUB, as buttons')
    assert.match(html, /href="\/lessons\/1"[^>]*>Start Lesson 1, free/, 'the hero still leads to Lesson 1')
  } finally {
    await server.close()
  }
})
