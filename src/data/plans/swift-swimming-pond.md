# Fix: Table text appears smaller than surrounding book prose

## Context

In the React app's chapter reader, text inside tables renders noticeably smaller (~14px) than the surrounding chapter prose (17px). This makes reference tables — verb paradigms, possessive pronoun grids, particle charts — harder to read than the rest of the chapter. The user wants table text rendered at the same size as the body prose.

## Root cause

Two rules collide in `lea-faka-tonga-app/src/components/BookChapterContent.jsx` and `lea-faka-tonga-app/src/index.css`:

- `index.css:633` — the `.reading-page` wrapper (applied around chapter markdown in `ChapterPractice.jsx`) sets the prose base to `font-size: 17px`.
- `BookChapterContent.jsx:86` — the markdown `table` component override renders `<table className="border-collapse text-sm">`. Tailwind's `text-sm` is `font-size: 0.875rem` (~14px against the 16px root), and it applies directly to the `<table>`, so every `<th>` and `<td>` inherits 14px regardless of the 17px set on `.reading-page`.

Tailwind utility specificity wins over the wrapper's base size because `text-sm` puts an explicit `font-size` on a descendant element, while `.reading-page` only sets the base on the ancestor that children inherit from.

## Fix

Single-line edit in `lea-faka-tonga-app/src/components/BookChapterContent.jsx:86`:

```jsx
// before
<table className="border-collapse text-sm">{children}</table>

// after
<table className="border-collapse">{children}</table>
```

Removing `text-sm` lets tables inherit the 17px base from `.reading-page`, matching surrounding paragraphs and list items. The existing `overflow-x-auto` wrapper at line 85 already handles wide tables on narrow viewports, so growing table text won't break layout — it'll just trigger horizontal scroll when needed (the same behavior the page already has).

### Out of scope (intentionally not touching)

- `<pre>` block at `BookChapterContent.jsx:80` also uses `text-sm`. Code blocks reasonably stay slightly smaller, and the user only flagged tables. Leaving as-is.
- Print PDF / EPUB / static `lea-faka-tonga.html` are separate pipelines (Pandoc + LaTeX templates, epub-style.css). They have their own table styling and are not affected by this React-app change.

## Verification

1. `cd lea-faka-tonga-app && npm run dev`
2. Open a chapter known to contain tables — Chapter 4 (pronouns), Chapter 16 (possessives), or Chapter 30 (numerals) are all good candidates.
3. Confirm table cell text now visually matches the surrounding paragraph text in size. Spot-check that headers still render in the accent color and remain bold (those are set via separate Tailwind classes on `<th>`, untouched by this change).
4. Resize to a narrow viewport and confirm the `overflow-x-auto` scroll still kicks in for wider tables.
5. Run `npm run check:style` from `lea-faka-tonga-app/` to confirm no lint regressions.

## Files modified

- `lea-faka-tonga-app/src/components/BookChapterContent.jsx` (one line, table component override)
