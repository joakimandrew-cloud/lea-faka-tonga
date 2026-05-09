import { resolveContextHint } from '../engine/graph-walker'

export default function BranchingPanel({ edges, canFinish, onSelectEdge, onFinish, steps = [] }) {
  if (edges.length === 0 && !canFinish) return null

  // Separate required edges from optional
  const required = edges.filter(e => e.required)
  const optional = edges.filter(e => !e.required)

  const renderEdgeButton = (edge, variant) => {
    const hint = edge.context_hint ? resolveContextHint(edge.context_hint, steps) : null
    const isRequired = variant === 'required'

    return (
      <button
        key={edge.node}
        onClick={() => onSelectEdge(edge)}
        className={`px-4 py-2 border text-sm text-left transition-colors cursor-pointer ${
          isRequired
            ? 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'
            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }`}
      >
        <div>{edge.label}</div>
        {hint && (
          <div className={`text-xs mt-1 ${isRequired ? 'text-[var(--accent)] opacity-70' : 'text-[var(--text-faint)]'}`}>
            {hint}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="border border-[var(--border)] px-6 py-4 mb-6">
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
        What comes next?
      </div>

      {required.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-[var(--text-faint)] mb-2">Required</div>
          <div className="flex flex-wrap gap-2">
            {required.map(edge => renderEdgeButton(edge, 'required'))}
          </div>
        </div>
      )}

      {(optional.length > 0 || canFinish) && (
        <div>
          {required.length > 0 && optional.length > 0 && (
            <div className="text-xs text-[var(--text-faint)] mb-2">Optional</div>
          )}
          <div className="flex flex-wrap gap-2">
            {canFinish && (
              <button
                onClick={onFinish}
                className="px-4 py-2 border border-[var(--accent)] text-[var(--accent)] text-sm hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
              >
                Finish sentence
              </button>
            )}
            {optional.map(edge => renderEdgeButton(edge, 'optional'))}
          </div>
        </div>
      )}
    </div>
  )
}
