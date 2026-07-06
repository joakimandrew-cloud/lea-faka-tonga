# Site-analysis fixes — REVERTED 2026-07-03; staged redo pending

First attempt shipped all 6 findings in one commit (`eb34148`) and broke styling wherever
CSS rode a lazy chunk (homepage module cards askew, /drills fully unstyled). Reverted
(`cba07e0` + `637de1e`, deploy run 28689279208 ✓); live site verified restored.
Findings still valid; full postmortem: `../business/Site-Analysis-2026-07-03.md`.
Reference implementation preserved at `eb34148` — cherry-pick, don't rewrite.

## Staged redo (one step = one commit = one deploy = full-route visual sweep before the next)

- [x] Step 1 — Non-chunking fixes: fakauʻa render-time okinafy + tests, GoatCounter snippet
      + RouteChrome counting, @fontsource self-hosted fonts, lang="to", in-app 404.
      (Cherry-pick from `eb34148`, minus App.jsx lazy-loading.) Visual sweep: every route type.
      ✅ Shipped 2026-07-06: RouteChrome trimmed to counting-only (title sync stays in Step 2 with
      meta.js); ChapterDrillAnchor/DrillPage Suspense wrappers and the BookChapterContent lazy glob
      left OUT (they belong to Step 3). Verified on preview: lesson 1 fakauʻa 121:2, 172 lang="to"
      spans, 0 external font requests, in-app 404 renders; full 8-route sweep at 1440+390 clean;
      okinafy tests 7/7; only the 6 documented pre-existing test failures remain.
- [ ] Step 2 — SEO: scripts/prerender.mjs + src/seo/meta.js + robots/sitemap/og-image
      (additive post-build; bundle untouched). Verify deep-route 200s + meta live.
- [ ] Step 3 — Code-split, carefully: set `build.cssCodeSplit: false` FIRST (one CSS file,
      cascade identical to today), then lazy chapters → drill registry → routes, one slice
      per deploy, screenshot-diff /  /lessons/1  /drills  /cards  /charts  /quizzes/1
      /support at each slice. Never dismiss an odd-looking screenshot as "animation timing" —
      re-capture with animations settled instead.
