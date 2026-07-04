# Site-analysis fixes — implement all 6 findings (approved 2026-07-03)

Source: `../business/Site-Analysis-2026-07-03.md` (findings 1–6, Andrew: "implement all findings").
Ruling constraint discovered before work: DECISIONS.md 2026-06-20 — `book/` stores the fakauʻa as ASCII `'` on purpose; display layers normalize at render time (okinafy: `'`+vowel → ʻ, `'`+consonant untouched). So finding #3 = render-time normalization in the app, NOT a book/ rewrite.

- [x] Step 1 — #4 Analytics: GoatCounter snippet (`leafakatonga` code) in index.html, strategy comment removed, SPA route-change counting via an `<Analytics/>` component. (Manual follow-up for Andrew: register the `leafakatonga` code at goatcounter.com — 2 min.)
- [x] Step 2 — #2 Code-split: React.lazy all routes except Landing; drill registry cores → lazy; BookChapterContent glob non-eager (per-chapter chunks); verify landing chunk small.
- [x] Step 3 — #6 Fonts/lang/404: self-host fonts via @fontsource (same families/weights), drop Google Fonts links; `lang="to"` on Tongan em/code in the reader; NotFound page + catch-all route.
- [x] Step 4 — #3 Fakauʻa: shared `okinafy()` util; applied in reader markdown, FlipCards, ReferenceCharts, QuizRunner, landing demo strings. Follow-up flagged (not this pass): PDF/EPUB regeneration with render-time okinafy filter.
- [x] Step 5 — #1 SEO: `scripts/prerender.mjs` postbuild — per-route HTML (static routes + lessons 1–52) with title/description/canonical/og/twitter + JSON-LD, static lesson intro in #root, sitemap.xml, robots.txt, og-image.png; per-route document.title client side.
- [x] Step 6 — #5 Founders: record "BMC supporter export = canonical founders list" in Founding-Presale-Kit.md + DECISIONS.md.
- [x] Step 7 — Verify: vitest, build, preview + curl deep routes (200 + meta), headless screenshots (landing fonts unchanged, lesson shows ʻ), bundle-size diff.
- [ ] Step 8 — Ship: commit+push app repo, watch Actions deploy, live re-verify (deep-route 200, meta, ʻ live, payload), update analysis note statuses, commit vault.
