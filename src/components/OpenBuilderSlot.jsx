/**
 * OpenBuilderSlot — interactive slot for the stack-based walker.
 *
 * Consumes a walker state (see graph-walker.js §2A.1) and exposes:
 *
 *   - SELECTING state → a flat word picker for the frame's required slot
 *   - IN_PROGRESS state → the extension menu (extensions + terminators,
 *     plus a "done with this extension" button when inside a sub-frame)
 *   - FINISHED state → the final rendered Tongan + English translation
 *
 * Phase history:
 *   - 2D.1 shipped the minimum "ugly is fine" stub so 2E preliminary could
 *     validate the three bug fixes end-to-end.
 *   - 2D.3 removed the bordered-box / bordered-button "form" styling in favor
 *     of the Way of Code text-link-list aesthetic (see way-of-code-design-
 *     spec.md) and wired the 2A.4 definiteness picker to the existing
 *     `setStepDefiniteness` walker API.
 *
 * Notes on component reuse:
 *   - We deliberately do NOT reuse SentenceBar here. SentenceBar calls
 *     translate.js's `buildTonganSentence`, which reads `word.tongan` raw —
 *     without applying Cross-Cutting Rule 3 preposition substitution. If we
 *     used it, the `ki`/`kia` bug would still appear on screen even though
 *     the walker has the correct rendering available via `renderTongan(state)`.
 *     Instead we inline a small sentence display that reads `getRenderedPath`.
 *   - We deliberately do NOT reuse BranchingPanel here. It only supports a
 *     single "Finish sentence" button; Rule 2 requires two terminators (.
 *     and ?) to be offered independently. We inline a minimal menu instead.
 *   - GrammarNotePanel is reused — it only needs flat steps + chapter, and
 *     `getFlatSteps(walkerState)` produces the same shape its matcher expects.
 */

import {
  getWalkerStatus,
  currentFrame,
  getCurrentFrameWords,
  getExtensionMenu,
  getRenderedPath,
  getFlatSteps,
  getNode,
} from '../engine/graph-walker'
import { translateWalkerState } from '../engine/translate'
import GrammarNotePanel from './GrammarNotePanel'

export default function OpenBuilderSlot({
  walkerState,
  entryPoint,
  onSelectWord,
  onTakeExtension,
  onFinishFrame,
  onFinishSentence,
  onSetDefiniteness,
  onReset,
}) {
  if (!walkerState) return null

  const status = getWalkerStatus(walkerState)
  const frame = currentFrame(walkerState)
  const depth = walkerState.frames.length
  const isFinished = status === 'FINISHED'
  const rendered = getRenderedPath(walkerState)
  const flatSteps = getFlatSteps(walkerState)

  // Phase 2D.3 — definiteness picker eligibility.
  //
  // The picker appears only for steps where (a) the word is a common noun and
  // (b) the word has a `definitive_accent_form` field (tagged by 2B.4). Steps
  // without the accent form are filtered out silently — showing a picker that
  // produces no visible change would be a UX lie. We index by flat step index
  // so the caller can call `setStepDefiniteness(state, flatIndex, level)`
  // directly without reconstructing the frame-relative position.
  //
  // `current` is the step's active definiteness level or `null` when unset.
  // The 2-state UI picker ('default' | 'definite') collapses the API's
  // three-value model ('indefinite' | 'semi_definite' | 'definite') until
  // indefinite article-shifting (`ki ha fale`) lands in a follow-up slice —
  // surfacing 'indefinite' now would render identically to 'semi_definite'
  // for prep-phrase complements (both emit the semi-definite class form),
  // which would be dishonest.
  const eligibleDefiniteness = isFinished
    ? []
    : flatSteps
        .map((step, flatIndex) => ({
          flatIndex,
          word: step.word,
          current: step.definiteness ?? null,
        }))
        .filter(
          e =>
            e.word?.noun_class === 'common' && e.word?.definitive_accent_form
        )

  // Rule 2 punctuation mapping for the four possible outcomes:
  //   FINISH_QUESTION                      → '?'
  //   FINISH_STATEMENT on a Commands flow  → '!'   (command, command_plural,
  //                                                 prohibition, suggestion)
  //   FINISH_STATEMENT on anything else    → '.'
  // Entry point category is the authoritative signal — grammar-graph.json
  // groups all imperative/hortative flows under the "Commands" category.
  // See spec/Phase-2-Engine-Plan.md §2E.3 pass criterion: "Commands
  // render with !".
  const statementPunct = entryPoint?.category === 'Commands' ? '!' : '.'
  const terminatorPunct = isFinished
    ? walkerState.terminator === 'FINISH_QUESTION'
      ? '?'
      : statementPunct
    : ''

  const tonganString =
    rendered.map(s => s.renderedTongan).join(' ') + terminatorPunct

  const translation = isFinished ? translateWalkerState(walkerState) : null

  return (
    <div>
      <SentenceDisplay
        rendered={rendered}
        tonganString={tonganString}
        isFinished={isFinished}
        translation={translation}
        eligibleDefiniteness={eligibleDefiniteness}
        onSetDefiniteness={onSetDefiniteness}
      />

      {depth > 1 && <FrameBreadcrumb frames={walkerState.frames} />}

      {status === 'SELECTING' && (
        <WordPicker
          nodeId={frame.currentNodeId}
          words={getCurrentFrameWords(walkerState)}
          onSelect={onSelectWord}
        />
      )}

      {status === 'IN_PROGRESS' && (
        <ExtensionMenu
          menu={getExtensionMenu(walkerState)}
          depth={depth}
          statementPunct={statementPunct}
          onTakeExtension={onTakeExtension}
          onFinishFrame={onFinishFrame}
          onFinishSentence={onFinishSentence}
        />
      )}

      {isFinished && (
        <div className="mb-8">
          <button
            onClick={onReset}
            className="text-sm text-[var(--text-muted)] italic hover:text-[var(--accent-hover)] underline decoration-[var(--text-muted)] underline-offset-4 cursor-pointer transition-colors"
          >
            start over
          </button>
        </div>
      )}

      <div className="mt-8">
        <GrammarNotePanel steps={flatSteps} chapter={walkerState.chapter} />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Sentence display                                                           */
/* -------------------------------------------------------------------------- */

function SentenceDisplay({
  rendered,
  tonganString,
  isFinished,
  translation,
  eligibleDefiniteness,
  onSetDefiniteness,
}) {
  // Empty state — keep the vertical space stable so the picker below doesn't
  // jump when the first word is chosen.
  if (rendered.length === 0) {
    return (
      <div className="mb-10 min-h-[2.5rem]">
        <div className="text-[var(--text-muted)] italic text-sm">
          Start building your sentence by choosing a word below.
        </div>
      </div>
    )
  }

  return (
    <div className="mb-10">
      {/* Hero line — the full rendered Tongan sentence. Rule 3 preposition
          substitutions, 2A.4 definitive accent, and the 2A.5 lowercase-after-
          connector pass are all already applied by getRenderedPath. */}
      <div className="font-tongan text-2xl text-[var(--text-strong)] leading-relaxed">
        {tonganString}
      </div>

      {/* English translation — finished only. Literal gloss sits just beneath
          the Tongan in muted text; the composed natural translation appears
          below, lighter. We suppress the literal line when it's identical to
          the composed text (no sense saying the same thing twice). */}
      {isFinished && translation && translation.text && (
        <div className="text-sm mt-3 text-[var(--text-muted)] italic">
          {translation.text}
        </div>
      )}
      {isFinished &&
        translation &&
        translation.literal &&
        translation.literal !== translation.text && (
          <div className="text-xs mt-1 text-[var(--text-faint)] italic">
            literally: {translation.literal}
          </div>
        )}

      {/* Phase 2D.3 — definiteness picker. Only eligible common-noun steps
          (tagged with `definitive_accent_form`) get a row. 2-state toggle:
          `default` (no accent) / `definite` (accent shifted to final vowel).
          Hidden post-finish because setStepDefiniteness throws on finished
          walkers — the eligibleDefiniteness array is already empty in that
          case so this block won't render. */}
      {eligibleDefiniteness.length > 0 && onSetDefiniteness && (
        <div className="mt-5 space-y-1.5">
          {eligibleDefiniteness.map(({ flatIndex, word, current }) => {
            const isDefault = current === null || current === undefined
            const isDefinite = current === 'definite'
            return (
              <div
                key={flatIndex}
                className="flex items-center gap-3 text-xs text-[var(--text-muted)]"
              >
                <span className="font-tongan italic text-[var(--text)]">
                  {word.tongan}
                </span>
                <span className="text-[var(--text-faint)]">·</span>
                <button
                  onClick={() => onSetDefiniteness(flatIndex, null)}
                  className={`cursor-pointer transition-colors ${
                    isDefault
                      ? 'text-[var(--text-strong)] underline decoration-[var(--text-muted)] underline-offset-4'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                  }`}
                >
                  default
                </button>
                <button
                  onClick={() => onSetDefiniteness(flatIndex, 'definite')}
                  className={`cursor-pointer transition-colors ${
                    isDefinite
                      ? 'text-[var(--text-strong)] underline decoration-[var(--text-muted)] underline-offset-4'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                  }`}
                >
                  definite
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Frame breadcrumb — shows the stack depth so the user knows where they are  */
/* -------------------------------------------------------------------------- */

function FrameBreadcrumb({ frames }) {
  return (
    <div className="text-xs text-[var(--text-muted)] mb-3">
      {frames.map((f, i) => {
        const label =
          i === 0
            ? 'Main clause'
            : (getNode(f.parentExtension)?.label || f.parentExtension)
        return (
          <span key={i}>
            {i > 0 && <span className="mx-2 text-[var(--text-faint)]">›</span>}
            <span className={i === frames.length - 1 ? 'text-[var(--accent)]' : ''}>
              {label}
            </span>
          </span>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Word picker — SELECTING state                                              */
/* -------------------------------------------------------------------------- */

function WordPicker({ nodeId, words, onSelect }) {
  const node = getNode(nodeId)

  return (
    <div className="mb-10">
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">
        {node?.label || nodeId.replace(/_/g, ' ')}
      </div>
      {node?.description && (
        <div className="text-sm text-[var(--text-faint)] italic mb-4">
          {node.description}
        </div>
      )}

      {words.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] italic">
          No words available at this node for the current chapter.
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          {words.map((w, i) => (
            <button
              key={`${w.tongan}-${i}`}
              onClick={() => onSelect(w)}
              className="text-left cursor-pointer group"
            >
              <span className="font-tongan text-lg text-[var(--text)] group-hover:text-[var(--accent-hover)] group-hover:underline decoration-[var(--text-muted)] underline-offset-4 transition-colors">
                {w.tongan}
              </span>
              <span className="text-sm text-[var(--text-muted)] italic ml-2">
                {w.english}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Extension menu — IN_PROGRESS state                                         */
/* -------------------------------------------------------------------------- */

function ExtensionMenu({
  menu,
  depth,
  statementPunct,
  onTakeExtension,
  onFinishFrame,
  onFinishSentence,
}) {
  const { extensions, terminators } = menu
  const canStatement = terminators.some(t => t.node === 'FINISH_STATEMENT')
  const canQuestion = terminators.some(t => t.node === 'FINISH_QUESTION')
  const inSubFrame = depth > 1

  if (
    extensions.length === 0 &&
    terminators.length === 0 &&
    !inSubFrame
  ) {
    return null
  }

  return (
    <div className="mb-10">
      {/* Terminators + done-with-frame — "ready to finish" row */}
      {(terminators.length > 0 || inSubFrame) && (
        <div className="mb-6">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.15em] mb-3">
            {inSubFrame ? 'Done with extension' : 'Finish'}
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            {canStatement && !inSubFrame && (
              <button
                onClick={() => onFinishSentence('FINISH_STATEMENT')}
                className="text-base text-[var(--text)] hover:text-[var(--accent-hover)] hover:underline decoration-[var(--text-muted)] underline-offset-4 cursor-pointer transition-colors"
              >
                End with {statementPunct}
              </button>
            )}
            {canQuestion && !inSubFrame && (
              <button
                onClick={() => onFinishSentence('FINISH_QUESTION')}
                className="text-base text-[var(--text)] hover:text-[var(--accent-hover)] hover:underline decoration-[var(--text-muted)] underline-offset-4 cursor-pointer transition-colors"
              >
                End with ?
              </button>
            )}
            {inSubFrame && (
              <button
                onClick={onFinishFrame}
                className="text-base text-[var(--text)] hover:text-[var(--accent-hover)] hover:underline decoration-[var(--text-muted)] underline-offset-4 cursor-pointer transition-colors"
              >
                Done with this extension
              </button>
            )}
          </div>
        </div>
      )}

      {/* Extensions — "tell me more" row */}
      {extensions.length > 0 && (
        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.15em] mb-3">
            Tell me more
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            {extensions.map(edge => (
              <button
                key={edge.node}
                onClick={() => onTakeExtension(edge.node)}
                className="text-base text-[var(--text-muted)] italic hover:text-[var(--accent-hover)] hover:underline decoration-[var(--text-muted)] underline-offset-4 cursor-pointer transition-colors"
              >
                {edge.label || edge.node.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
