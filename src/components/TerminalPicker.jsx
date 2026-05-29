/**
 * TerminalPicker — shared picker components for the terminal-style sentence
 * builders.
 *
 * Extracted from TerminalBuilder.jsx so both the original `/terminal-build`
 * page and the merged `/sentence-builder` page render the same inline
 * drum-roller (desktop) and tap-to-open dropdown (mobile) over the
 * multi-walker `getPickerData` group shape. Styling lives in the `.tb-*`
 * rules in src/index.css. Non-component helpers (useIsTouchPrimary,
 * expandAddMoreGroup) live in ../lib/terminal-picker-utils.
 */

import { useEffect, useRef, useState } from 'react'

// ── Inline Picker ─────────────────────────────────────────────────────────

export function InlinePicker({ groups, groupIdx, itemIdx, onGroupChange, onItemChange, onConfirm }) {
  // Hooks must run unconditionally, so they precede the empty-groups guard
  // below. `group`/`activeItem` are computed defensively for the same reason.
  const tabRowRef = useRef(null)
  const listRef = useRef(null)
  const group = groups[groupIdx] || groups[0]
  const activeItem = group ? (group.items[itemIdx] || group.items[0]) : null

  // The default landing row (first tab, first item) is now the most-likely
  // next word (engine orders groups/words by corpus frequency), so we label it
  // as a suggestion — pressing Enter accepts it with zero arrow keys. The tag
  // only shows when there's an actual choice to make, and disappears the
  // moment the user navigates away from the default.
  const isSuggestion =
    groupIdx === 0 && itemIdx === 0 &&
    (groups.length > 1 || (group && group.items.length > 1))

  // Keep the active tab visible when the category row overflows the
  // picker width — otherwise the selected pill could scroll off-edge
  // as the user cycles with ←/→.
  useEffect(() => {
    const row = tabRowRef.current
    if (!row) return
    const tab = row.children[groupIdx]
    if (tab && tab.scrollIntoView) {
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [groupIdx])

  // Keep the active word row visible inside the capped-height list as
  // the user arrows ↑/↓ past what's initially rendered. `block: 'nearest'`
  // means rows already in view don't trigger a scroll — the list only
  // moves when the active row would otherwise clip.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const row = list.children[itemIdx]
    if (row && row.scrollIntoView) {
      row.scrollIntoView({ block: 'nearest' })
    }
  }, [itemIdx, groupIdx])

  // Nothing to pick (rare transient state) — the sentence-line cursor
  // stands in instead. Guard runs after the hooks above so hook order is
  // stable across renders.
  if (groups.length === 0 || !group) return null

  return (
    <span className="tb-picker">
      <span className="tb-picker-tabrow">
        {groups.length > 1 && <span className="tb-picker-edge" aria-hidden>{'◀'}</span>}
        <span className="tb-picker-tabs" ref={tabRowRef}>
          {groups.map((g, gi) => (
            <button
              type="button"
              key={g.label + gi}
              onClick={(e) => {
                e.stopPropagation()
                onGroupChange(gi)
              }}
              className={`tb-picker-tab ${gi === groupIdx ? 'is-active' : ''}`}
              tabIndex={-1}
            >
              {g.label}
            </button>
          ))}
        </span>
        {groups.length > 1 && <span className="tb-picker-edge" aria-hidden>{'▶'}</span>}
      </span>

      <span className="tb-picker-list" ref={listRef}>
        {group.items.map((item, i) => {
          const isActive = i === itemIdx
          return (
            <button
              type="button"
              key={item.display + i}
              onClick={(e) => {
                e.stopPropagation()
                if (isActive) onConfirm()
                else onItemChange(i)
              }}
              className={`tb-picker-row ${isActive ? 'is-active' : ''}`}
              tabIndex={-1}
            >
              <span className="tb-picker-caret" aria-hidden>{isActive ? '▸' : ''}</span>
              <span className="tb-picker-word">{item.display}</span>
              {item.hint && <span className="tb-picker-gloss">{item.hint}</span>}
            </button>
          )
        })}
      </span>

      {/* Fixed-height hint strip. Shows the active item's hint for now;
          when per-group example strings land in multi-walker, swap this
          to `group.hint`. The &nbsp; fallback keeps the picker from
          jumping when an item has no hint. */}
      <span className="tb-picker-footer">
        {isSuggestion && <span className="tb-picker-suggest-tag">suggested</span>}
        {activeItem?.hint || ' '}
      </span>
    </span>
  )
}

// ── Mobile Picker ─────────────────────────────────────────────────────────
//
// Two-stage dropdown: panel button → POS list → word list → confirm. The
// panel lives below the sentence line (the sentence shows the blinking
// cursor instead). When there's only one group (common in branching mode
// — e.g. the merged "Tense Marker" after `he`) the POS step is skipped
// and the word list opens directly.
//
// Desktop parity note: the inline drum-roller uses the parent's groupIdx/
// itemIdx state because it needs to track keyboard focus for arrow keys.
// MobilePicker has no keyboard input, so it manages its own local stage
// and lets the parent's indices stay at defaults. onConfirm accepts the
// picked item directly to sidestep setState-then-confirm batching.

export function MobilePicker({ groups, onConfirm }) {
  const [stage, setStage] = useState('closed') // 'closed' | 'pos' | 'word'
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0)

  if (groups.length === 0) return null

  const openMenu = () => {
    setStage(groups.length === 1 ? 'word' : 'pos')
    setSelectedGroupIdx(0)
  }

  const pickGroup = (gi) => {
    setSelectedGroupIdx(gi)
    setStage('word')
  }

  const pickItem = (item) => {
    onConfirm(item)
    setStage('closed')
  }

  const group = groups[selectedGroupIdx] || groups[0]

  return (
    <span className="relative inline-flex flex-col items-start">
      <button
        type="button"
        onClick={openMenu}
        aria-label="Pick the next word"
        className="tb-mobile-trigger"
      >
        <span>pick</span>
        <span aria-hidden>{'▾'}</span>
      </button>

      {stage !== 'closed' && (
        <>
          {/* Outside-tap dismissal. z-index below the menu so taps on items
              don't fall through to the backdrop. */}
          <span
            onClick={() => setStage('closed')}
            className="fixed inset-0 z-40 bg-transparent"
            aria-hidden
          />
          <span className="tb-mobile-menu">
            <span className="tb-mobile-menu-header">
              {stage === 'word' && groups.length > 1 ? (
                <button type="button" onClick={() => setStage('pos')}>
                  {'←'} back
                </button>
              ) : <span />}
              <span>{stage === 'pos' ? 'Pick a category' : group.label}</span>
              <button
                type="button"
                onClick={() => setStage('closed')}
                aria-label="Close"
              >
                {'✕'}
              </button>
            </span>

            {stage === 'pos' && groups.map((g, gi) => (
              <button
                key={g.label + gi}
                type="button"
                onClick={() => pickGroup(gi)}
                className="tb-mobile-menu-item"
                style={{ fontStyle: 'normal' }}
              >
                {g.label} <span className="tb-mobile-menu-item-hint">{g.items.length}</span>
                {gi === 0 && groups.length > 1 && (
                  <span className="tb-picker-suggest-tag">suggested</span>
                )}
              </button>
            ))}

            {stage === 'word' && group.items.map((it, i) => {
              // First option in the default (first) category is the engine's
              // most-likely pick — surface it as a suggestion.
              const isSuggestion = selectedGroupIdx === 0 && i === 0 && group.items.length > 1
              return (
                <button
                  key={it.display + i}
                  type="button"
                  onClick={() => pickItem(it)}
                  className="tb-mobile-menu-item"
                >
                  <span>{it.display}</span>
                  {isSuggestion && <span className="tb-picker-suggest-tag">suggested</span>}
                  {it.hint && (
                    <span className="tb-mobile-menu-item-hint">{it.hint}</span>
                  )}
                </button>
              )
            })}
          </span>
        </>
      )}
    </span>
  )
}
