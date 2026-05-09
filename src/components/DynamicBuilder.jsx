import { useState, useEffect } from 'react'
import { useChapter } from '../contexts/ChapterContext'
import {
  getNode,
  getAvailableWords,
  getAvailableEdges,
  canFinish as checkCanFinish,
  getBranchingOptions,
  hasRequiredEdge,
  getUnifiedNextWords,
  advanceCandidates,
  getSentenceCompleteness
} from '../engine/graph-walker'
import SentenceBar from './SentenceBar'
import BranchingPanel from './BranchingPanel'
import GrammarNotePanel from './GrammarNotePanel'

// Phase 2A.2: a "terminator" edge is one of FINISH_STATEMENT or
// FINISH_QUESTION (the legacy single FINISH was split per Cross-Cutting
// Rule 2). The legacy linear builder doesn't yet distinguish between the
// two — it still asks "statement or question?" via the punctuation phase
// — but it must treat both edge ids as completion signals when computing
// branching/punctuation phases.
function isTerminatorEdgeId(nodeId) {
  return nodeId === 'FINISH_STATEMENT' || nodeId === 'FINISH_QUESTION'
}

export default function DynamicBuilder({
  entryPoint,
  freeMode = false,
  initialStep = null,
  initialSteps = null,
  onBackToWizard = null,
  forceQuestion = false,
  unresolvedMode = false,
  initialCandidates = null
}) {
  const { chapter: contextChapter } = useChapter()
  const chapter = freeMode ? 999 : contextChapter

  // Merge initialSteps (array) and initialStep (single) for backwards compat
  const seedSteps = initialSteps || (initialStep ? [initialStep] : [])

  // steps: [{nodeId, word: {tongan, english, tags, ...}}, ...]
  const [steps, setSteps] = useState(seedSteps.length > 0 ? [...seedSteps] : [])
  const [currentNodeId, setCurrentNodeId] = useState(null)
  // phases: 'resolving', 'selecting', 'branching', 'punctuation', 'finished'
  const [phase, setPhase] = useState(unresolvedMode ? 'resolving' : 'selecting')
  const [isQuestion, setIsQuestion] = useState(false)

  // Deferred routing state
  const [candidates, setCandidates] = useState(initialCandidates || null)
  const [resolvedEntryPoint, setResolvedEntryPoint] = useState(entryPoint)

  // Compute next state from the last step in a step array
  const computeNextState = (fromSteps) => {
    const ep = resolvedEntryPoint || entryPoint
    if (!ep) return { nodeId: null, phase: 'resolving' }
    if (fromSteps.length === 0) {
      return { nodeId: ep.start_node || ep.startNodeId, phase: 'selecting' }
    }
    const lastStep = fromSteps[fromSteps.length - 1]
    const edges = getAvailableEdges(lastStep.nodeId, chapter, fromSteps)
    const nonFinishEdges = edges.filter(e => !isTerminatorEdgeId(e.node))
    const requiredEdges = nonFinishEdges.filter(e => e.required)

    if (requiredEdges.length === 1) {
      return { nodeId: requiredEdges[0].node, phase: 'selecting' }
    } else if (nonFinishEdges.length === 0 && edges.some(e => isTerminatorEdgeId(e.node))) {
      return { nodeId: null, phase: 'punctuation' }
    } else {
      return { nodeId: null, phase: 'branching' }
    }
  }

  // Initialize: figure out starting state from seed steps
  useEffect(() => {
    if (unresolvedMode && initialCandidates) {
      // Start in resolving phase — candidates drive the flow
      setPhase('resolving')
      setCandidates(initialCandidates)
      return
    }
    const { nodeId, phase: newPhase } = computeNextState(seedSteps)
    setCurrentNodeId(nodeId)
    setPhase(newPhase)
  }, [entryPoint?.id, initialStep?.word?.tongan, initialSteps?.length])

  const currentNode = currentNodeId ? getNode(currentNodeId) : null
  const availableWords = currentNodeId
    ? getAvailableWords(currentNodeId, chapter, steps)
    : []

  // For the resolving phase, compute merged words from candidates
  const unifiedData = (phase === 'resolving' && candidates)
    ? getUnifiedNextWords(candidates, chapter)
    : null

  // Auto-advance through fixed nodes (nodes with exactly one available word)
  useEffect(() => {
    if (phase === 'selecting' && availableWords.length === 1) {
      handleSelectWord(availableWords[0])
    }
  }, [currentNodeId, phase])

  // Auto-advance in resolving phase when only one word available
  useEffect(() => {
    if (phase === 'resolving' && unifiedData && unifiedData.words.length === 1) {
      handleResolvingSelect(unifiedData.words[0])
    }
  }, [phase, unifiedData?.words?.length])

  // Auto-advance punctuation when forceQuestion is set
  useEffect(() => {
    if (phase === 'punctuation' && forceQuestion) {
      handlePunctuation(true)
    }
  }, [phase, forceQuestion])

  const lastNodeId = steps.length > 0 ? steps[steps.length - 1].nodeId : null
  const branchingEdges = lastNodeId ? getBranchingOptions(lastNodeId, chapter, steps) : []
  const canFinishSentence = lastNodeId ? checkCanFinish(lastNodeId, chapter, steps) : false
  const hasRequired = lastNodeId ? hasRequiredEdge(lastNodeId, chapter, steps) : false

  // Sentence completeness indicator
  const completeness = lastNodeId
    ? getSentenceCompleteness(lastNodeId, chapter, steps)
    : 'incomplete'

  // Handle word selection during the resolving phase
  const handleResolvingSelect = (word) => {
    const advanced = advanceCandidates(candidates, word, chapter)
    if (advanced.length === 0) return

    // Update steps from the first surviving candidate (they all share the same steps)
    const newSteps = advanced[0].steps
    setSteps(newSteps)

    if (advanced.length === 1) {
      // Resolved! Transition to normal flow
      const resolved = advanced[0]
      setResolvedEntryPoint(resolved.entryPoint)
      setCandidates(null)

      if (resolved.phase === 'selecting' && resolved.currentNodeId) {
        setCurrentNodeId(resolved.currentNodeId)
        setPhase('selecting')
      } else if (resolved.phase === 'branching') {
        setCurrentNodeId(null)
        setPhase('branching')
      } else if (resolved.phase === 'punctuation') {
        setCurrentNodeId(null)
        setPhase('punctuation')
      }
    } else {
      // Still ambiguous — stay in resolving
      setCandidates(advanced)
    }
  }

  // When a word is selected from the dropdown (normal resolved flow)
  const handleSelectWord = (word) => {
    const newSteps = [...steps, { nodeId: currentNodeId, word }]
    setSteps(newSteps)

    const edges = getAvailableEdges(currentNodeId, chapter, newSteps)
    const nonFinishEdges = edges.filter(e => !isTerminatorEdgeId(e.node))
    const requiredEdges = nonFinishEdges.filter(e => e.required)

    if (requiredEdges.length === 1) {
      setCurrentNodeId(requiredEdges[0].node)
      setPhase('selecting')
    } else if (nonFinishEdges.length === 0 && edges.some(e => isTerminatorEdgeId(e.node))) {
      setPhase('punctuation')
    } else {
      setCurrentNodeId(null)
      setPhase('branching')
    }
  }

  const handleSelectEdge = (edge) => {
    setCurrentNodeId(edge.node)
    setPhase('selecting')
  }

  const handleFinish = () => {
    setCurrentNodeId(null)
    setPhase('punctuation')
  }

  const handlePunctuation = (question) => {
    setIsQuestion(question)
    setPhase('finished')
  }

  const handleUndo = () => {
    if (steps.length === 0) return

    if (phase === 'finished') {
      setCurrentNodeId(null)
      setPhase('branching')
      return
    }

    // Can't undo past the seed steps
    if (steps.length <= seedSteps.length) {
      if (onBackToWizard) {
        onBackToWizard()
      }
      return
    }

    const newSteps = steps.slice(0, -1)
    setSteps(newSteps)

    if (newSteps.length <= seedSteps.length) {
      // Back to seed boundary — recompute from seeds
      const resetTo = seedSteps.length > 0 ? [...seedSteps] : []
      setSteps(resetTo)

      // If we were in unresolved mode, go back to resolving
      if (unresolvedMode && initialCandidates) {
        setCandidates(initialCandidates)
        setResolvedEntryPoint(null)
        setPhase('resolving')
      } else {
        const { nodeId, phase: newPhase } = computeNextState(resetTo)
        setCurrentNodeId(nodeId)
        setPhase(newPhase)
      }
    } else {
      const removedNodeId = steps[steps.length - 1].nodeId
      setCurrentNodeId(removedNodeId)
      setPhase('selecting')
    }
  }

  const handleReset = () => {
    if (unresolvedMode && initialCandidates) {
      setSteps([...seedSteps])
      setCandidates(initialCandidates)
      setResolvedEntryPoint(null)
      setPhase('resolving')
      return
    }

    if (seedSteps.length > 0) {
      setSteps([...seedSteps])
      const { nodeId, phase: newPhase } = computeNextState(seedSteps)
      setCurrentNodeId(nodeId)
      setPhase(newPhase)
    } else {
      setSteps([])
      const ep = resolvedEntryPoint || entryPoint
      setCurrentNodeId(ep.start_node || ep.startNodeId)
      setPhase('selecting')
    }
  }

  return (
    <div>
      <SentenceBar
        steps={steps}
        isFinished={phase === 'finished'}
        isQuestion={isQuestion}
        onUndo={handleUndo}
        onReset={handleReset}
        completeness={completeness}
      />

      {/* Resolving phase — deferred routing dropdown */}
      {phase === 'resolving' && unifiedData && unifiedData.words.length > 1 && (
        <div className="mb-6">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {unifiedData.nodeLabel || 'Choose next word'}
          </div>
          {unifiedData.nodeDescription && (
            <div className="text-xs text-[var(--text-faint)] mb-3">{unifiedData.nodeDescription}</div>
          )}
          <select
            value=""
            onChange={e => {
              const word = unifiedData.words.find(w => w.tongan === e.target.value)
              if (word) handleResolvingSelect(word)
            }}
            className="w-full px-4 py-2 bg-[var(--bg-tone)] border border-[var(--accent)] text-[var(--text)] font-tongan appearance-none cursor-pointer hover:border-[var(--accent-hover)] transition-colors focus:outline-none focus:border-[var(--accent-hover)] min-w-[180px]"
          >
            <option value="">Select next word...</option>
            {unifiedData.words.map(word => (
              <option key={word.tongan} value={word.tongan}>
                {word.tongan} ({word.english})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Word selection dropdown (normal resolved flow) */}
      {phase === 'selecting' && currentNode && (
        <div className="mb-6">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {currentNode.label}
          </div>
          {currentNode.description && (
            <div className="text-xs text-[var(--text-faint)] mb-3">{currentNode.description}</div>
          )}
          <select
            value=""
            onChange={e => {
              const word = availableWords.find(w => w.tongan === e.target.value)
              if (word) handleSelectWord(word)
            }}
            className="w-full px-4 py-2 bg-[var(--bg-tone)] border border-[var(--accent)] text-[var(--text)] font-tongan appearance-none cursor-pointer hover:border-[var(--accent-hover)] transition-colors focus:outline-none focus:border-[var(--accent-hover)] min-w-[180px]"
          >
            <option value="">Select {currentNode.label.toLowerCase()}...</option>
            {availableWords.map(word => (
              <option key={word.tongan} value={word.tongan}>
                {word.tongan} ({word.english})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Branching panel */}
      {phase === 'branching' && (
        <BranchingPanel
          edges={branchingEdges}
          canFinish={canFinishSentence && !hasRequired}
          onSelectEdge={handleSelectEdge}
          onFinish={handleFinish}
          steps={steps}
        />
      )}

      {/* Punctuation choice — statement or question (skip if forceQuestion) */}
      {phase === 'punctuation' && !forceQuestion && (
        <div className="border border-[var(--border)] px-6 py-4 mb-6">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Statement or question?
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handlePunctuation(false)}
              className="px-5 py-2 border border-[var(--accent)] text-[var(--accent)] text-sm hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
            >
              Statement <span className="text-lg ml-1">.</span>
            </button>
            <button
              onClick={() => handlePunctuation(true)}
              className="px-5 py-2 border border-[var(--accent)] text-[var(--accent)] text-sm hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
            >
              Question <span className="text-lg ml-1">?</span>
            </button>
          </div>
        </div>
      )}

      {/* Finished */}
      {phase === 'finished' && (
        <div className="mb-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-[var(--accent)] text-[var(--accent)] text-sm hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
          >
            Build another sentence
          </button>
        </div>
      )}

      {/* Grammar notes */}
      {steps.length > 0 && (
        <div className="mt-6">
          <GrammarNotePanel steps={steps} chapter={chapter} />
        </div>
      )}
    </div>
  )
}
