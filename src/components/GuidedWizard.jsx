import { useState } from 'react'
import grammarGraph from '../data/grammar-graph.json'
import SentenceBar from './SentenceBar'
import {
  buildPreSeededSteps,
  getAvailableTenses,
} from '../engine/pronoun-resolver'

// ─── Category & flow definitions ─────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'yourself',
    label: 'About yourself',
    description: 'Actions, feelings, location',
    nextStep: 'self_what',
  },
  {
    id: 'someone_else',
    label: 'About someone else',
    description: 'By pronoun or by name',
    nextStep: 'other_how',
  },
  {
    id: 'thing',
    label: 'About a thing or place',
    description: 'Identify, describe, or locate something',
    nextStep: 'thing_what',
  },
  {
    id: 'command',
    label: 'Tell someone what to do',
    description: 'Commands, suggestions, prohibitions',
    nextStep: 'command_type',
  },
  {
    id: 'question',
    label: 'Ask a question',
    description: 'Who, what, where, or yes/no',
    nextStep: 'question_type',
  },
]

// All wizard questions keyed by step ID
const STEPS = {
  // ─── About yourself ───
  self_what: {
    question: 'What about yourself?',
    choices: [
      { label: 'Something you do', description: 'An action: I eat, I go, I study', next: 'tense', sets: { flow: 'statement', person: 1, number: 'singular', inclusive: false } },
      { label: 'How you feel', description: 'A state: I am happy, tired, hungry', next: 'tense', sets: { flow: 'statement', person: 1, number: 'singular', inclusive: false } },
      { label: 'Where you are', description: 'I am at home, I was in town', next: 'tense', sets: { flow: 'location_state', person: 1, number: 'singular', inclusive: false } },
      { label: "Something you don't do or aren't", description: "Negation: I don't eat, I'm not tired", next: 'tense', sets: { flow: 'negation', person: 1, number: 'singular', inclusive: false } },
      { label: 'Something you understand or forgot', description: 'Experiencer: I understand, I forgot', next: 'tense', sets: { flow: 'experiencer', person: 1, number: 'singular', inclusive: false } },
    ],
  },

  // ─── About someone else ───
  other_how: {
    question: 'How do you refer to this person?',
    choices: [
      { label: 'By pronoun (he, she, they, we...)', description: 'Using a pronoun like he/she, they, we', next: 'other_who' },
      { label: 'By name (Sione, Mele...)', description: 'A proper name or description — word order changes', next: 'other_name_what', sets: { flow: 'noun_subject' } },
    ],
  },
  other_who: {
    question: 'Who are you talking about?',
    choices: [
      { label: 'He or she', description: 'One other person', next: 'other_what', sets: { person: 3, number: 'singular', inclusive: false } },
      { label: 'You (one person)', description: 'Talking to someone about themselves', next: 'other_what', sets: { person: 2, number: 'singular', inclusive: false } },
      { label: 'They (a group)', description: 'Three or more people', next: 'other_what', sets: { person: 3, number: 'plural', inclusive: false } },
      { label: 'We (our group, not the listener)', description: 'We — excluding the person you\'re talking to', next: 'other_what', sets: { person: 1, number: 'plural', inclusive: false } },
    ],
    expandable: {
      label: 'More pronoun options...',
      choices: [
        { label: 'We (all of us, including you)', description: 'We — including the person you\'re talking to', next: 'other_what', sets: { person: 1, number: 'plural', inclusive: true } },
        { label: 'You (two people)', description: 'Addressing exactly two people', next: 'other_what', sets: { person: 2, number: 'dual', inclusive: false } },
        { label: 'They two', description: 'Exactly two other people', next: 'other_what', sets: { person: 3, number: 'dual', inclusive: false } },
        { label: 'We two (not the listener)', description: 'Us two — excluding the person you\'re talking to', next: 'other_what', sets: { person: 1, number: 'dual', inclusive: false } },
        { label: 'We two (including you)', description: 'The two of us — including the person you\'re talking to', next: 'other_what', sets: { person: 1, number: 'dual', inclusive: true } },
        { label: 'You (a group)', description: 'Addressing three or more people', next: 'other_what', sets: { person: 2, number: 'plural', inclusive: false } },
      ],
    },
    teaching: {
      title: 'Pronouns in Tongan',
      text: "Tongan distinguishes between 'we including you' (tau) and 'we not including you' (mau). It also has separate forms for exactly two people (dual) versus three or more (plural).",
    },
  },
  other_what: {
    question: 'What are you saying about them?',
    choices: [
      { label: 'Something they do', description: 'An action: he eats, they work, she sings', next: 'tense', sets: { flow: 'statement' } },
      { label: 'How they feel', description: 'A state: he is happy, they are tired', next: 'tense', sets: { flow: 'statement' } },
      { label: 'Where they are', description: 'She is at home, they were in town', next: 'tense', sets: { flow: 'location_state' } },
      { label: "Something they don't do", description: "He doesn't eat, they are not happy", next: 'tense', sets: { flow: 'negation' } },
    ],
  },
  other_name_what: {
    question: 'What are you saying about this person?',
    choices: [
      { label: 'Something they do or how they feel', description: 'Sione eats, the boy is happy, Mary ran', next: 'tense', sets: { flow: 'noun_subject' } },
      { label: "Something they don't do", description: "Sione doesn't eat, the boy is not hungry", next: 'tense', sets: { flow: 'negation', nameNegation: true } },
    ],
  },

  // ─── About a thing or place ───
  thing_what: {
    question: 'What do you want to say?',
    choices: [
      { label: 'Say what something is', description: 'This is a book, that is a knife', resolve: 'ko_identification' },
      { label: 'Say what something is NOT', description: 'This is not a knife, that is not a book', resolve: 'ko_negation' },
      { label: 'Ask what something is', description: 'What is this? What is that?', resolve: 'ko_question_what' },
    ],
    teaching: {
      title: 'Ko sentences',
      text: "In Tongan, to identify something you use 'ko e' followed by a noun. There is no verb 'to be' — the pattern itself carries the meaning of 'is'.",
    },
  },

  // ─── Tell someone what to do ───
  command_type: {
    question: 'What kind of direction?',
    choices: [
      { label: 'Give a command (one person)', description: "Tell one person to do something — just say the verb", resolve: 'command' },
      { label: 'Give a command (group)', description: 'Tell a group to do something — starts with mou', resolve: 'command_plural' },
      { label: 'Suggest doing something together', description: "Let's eat, let's go — starts with tau or ta", resolve: 'suggestion' },
      { label: "Say don't do that", description: "Tell someone not to do something — starts with 'oua te", resolve: 'prohibition' },
    ],
    teaching: {
      title: 'Commands in Tongan',
      text: "Commands are simple in Tongan — just say the verb! No tense marker, no pronoun needed. To be polite, add mu\u02BBa (please) at the end.",
    },
  },

  // ─── Ask a question ───
  question_type: {
    question: 'What kind of question?',
    choices: [
      { label: 'What is this?', description: "Ask what something is — ko e hā", resolve: 'ko_question_what' },
      { label: 'Who is doing something?', description: 'Ask who — ko hai', resolve: 'ko_question_who' },
      { label: 'Where is someone?', description: "Ask where someone is — ko fē", resolve: 'ko_question_where' },
      { label: 'A yes/no question', description: "Did you eat? Is she happy? — same as a statement, but with ? intonation", next: 'yesno_who' },
    ],
  },
  yesno_who: {
    question: 'Who is the question about?',
    choices: [
      { label: 'Yourself (I)', description: 'Did I...? Am I...?', next: 'yesno_what', sets: { person: 1, number: 'singular', inclusive: false } },
      { label: 'The other person (you)', description: 'Did you...? Are you...?', next: 'yesno_what', sets: { person: 2, number: 'singular', inclusive: false } },
      { label: 'He or she', description: 'Did he/she...? Is he/she...?', next: 'yesno_what', sets: { person: 3, number: 'singular', inclusive: false } },
      { label: 'They / we', description: 'Did they...? Did we...?', next: 'other_who_then_yesno' },
    ],
  },
  other_who_then_yesno: {
    question: 'Who specifically?',
    choices: [
      { label: 'They (a group)', next: 'yesno_what', sets: { person: 3, number: 'plural', inclusive: false } },
      { label: 'We (our group)', next: 'yesno_what', sets: { person: 1, number: 'plural', inclusive: false } },
      { label: 'We (all of us, including you)', next: 'yesno_what', sets: { person: 1, number: 'plural', inclusive: true } },
    ],
  },
  yesno_what: {
    question: 'What are you asking about?',
    choices: [
      { label: 'An action', description: 'Did you eat? Will she go?', next: 'tense', sets: { flow: 'statement', forceQuestion: true } },
      { label: 'A feeling or state', description: 'Are you happy? Were they tired?', next: 'tense', sets: { flow: 'statement', forceQuestion: true } },
      { label: 'A location', description: 'Were you at home? Is she in town?', next: 'tense', sets: { flow: 'location_state', forceQuestion: true } },
    ],
  },

  // ─── Tense (shared final step for most flows) ───
  tense: {
    question: 'When does this happen?',
    // Choices are dynamically generated based on the selected flow's available tenses
    dynamic: true,
    teaching: {
      title: 'Time in Tongan',
      text: "Tongan marks when something happens at the very start of the sentence with a tense marker. There's no word like 'did' or 'will' added to the verb \u2014 instead, the first word tells you when. Na\u02BBa/Na\u02BBe = past, \u02BBOku = present or habitual, Kuo = already completed, Te = future.",
    },
  },
}

// Teaching for after pronoun is auto-resolved
const PRONOUN_TEACHING = {
  title: 'Your sentence so far',
  getText(tenseMarkerTongan, pronounTongan, person) {
    const pronounLabels = {
      1: "'I'", 2: "'you'", 3: "'he/she'",
    }
    const label = pronounLabels[person] || 'the subject'
    return `"${tenseMarkerTongan}" marks the tense. "${pronounTongan}" means ${label} \u2014 the pronoun form changes depending on the tense marker.`
  },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GuidedWizard({ onResolve, savedState, onStateChange }) {
  const [history, setHistory] = useState(savedState?.history || [])
  const [answers, setAnswers] = useState(savedState?.answers || {})
  const [previewSteps, setPreviewSteps] = useState(savedState?.previewSteps || [])
  const [expanded, setExpanded] = useState(false)
  const [teachingOpen, setTeachingOpen] = useState(true)

  // Persist state for back-navigation from DynamicBuilder
  const persistState = (h, a, p) => {
    onStateChange?.({ history: h, answers: a, previewSteps: p })
  }

  // Current step: category selection if no history, else last step
  const currentStepId = history.length === 0 ? null : history[history.length - 1]
  const currentStep = currentStepId ? STEPS[currentStepId] : null

  // Resolve: find entry point and build pre-seeded steps, then hand off
  const resolveEntryPoint = (entryPointId, extraAnswers = {}) => {
    const merged = { ...answers, ...extraAnswers }
    const ep = grammarGraph.entry_points.find(e => e.id === entryPointId)
    if (!ep) return

    // Entry points with no tense/pronoun (ko, commands) — resolve immediately
    const result = {
      entryPoint: { ...ep, startNodeId: ep.start_node },
      preSeededSteps: [],
      forceQuestion: merged.forceQuestion || false,
    }

    onResolve(result)
  }

  const resolveWithPreSeed = (tense, extraAnswers = {}) => {
    const merged = { ...answers, ...extraAnswers }
    const flow = merged.flow
    const ep = grammarGraph.entry_points.find(e => e.id === flow)
    if (!ep) return

    const built = buildPreSeededSteps(
      flow,
      tense,
      merged.person ?? null,
      merged.number ?? null,
      merged.inclusive ?? false,
    )

    if (!built) return

    onResolve({
      entryPoint: { ...ep, startNodeId: ep.start_node },
      preSeededSteps: built.steps,
      forceQuestion: merged.forceQuestion || false,
    })
  }

  const handleCategorySelect = (category) => {
    const newHistory = [category.nextStep]
    const newAnswers = { category: category.id }
    setHistory(newHistory)
    setAnswers(newAnswers)
    setExpanded(false)
    setTeachingOpen(true)
    persistState(newHistory, newAnswers, [])
  }

  const handleChoice = (choice) => {
    // Merge any data this choice sets
    const newAnswers = { ...answers, ...(choice.sets || {}) }

    // Direct resolve (no tense step needed)
    if (choice.resolve) {
      resolveEntryPoint(choice.resolve, choice.sets)
      return
    }

    if (choice.next === 'tense') {
      // Moving to tense selection — we need the flow to know available tenses
      const flow = newAnswers.flow
      if (flow) {
        const tenses = getAvailableTenses(flow)
        if (tenses.length === 0) {
          // No tense needed (shouldn't happen, but handle gracefully)
          resolveEntryPoint(flow, choice.sets)
          return
        }
      }
    }

    const newHistory = [...history, choice.next]
    setHistory(newHistory)
    setAnswers(newAnswers)
    setExpanded(false)
    setTeachingOpen(true)
    persistState(newHistory, newAnswers, previewSteps)
  }

  const handleTenseSelect = (tenseInfo) => {
    resolveWithPreSeed(tenseInfo.tense)
  }

  const handleBack = () => {
    if (history.length <= 1) {
      // Go back to category selection
      setHistory([])
      setAnswers({})
      setPreviewSteps([])
      persistState([], {}, [])
    } else {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      setExpanded(false)
      setTeachingOpen(true)
      persistState(newHistory, answers, [])
    }
  }

  const handleStartOver = () => {
    setHistory([])
    setAnswers({})
    setPreviewSteps([])
    persistState([], {}, [])
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Category selection (root)
  if (history.length === 0) {
    return (
      <div>
        <h1 className="text-xl text-[var(--accent)] font-bold tracking-wide mb-6">WHAT DO YOU WANT TO SAY?</h1>
        <div className="space-y-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat)}
              className="block w-full text-left px-5 py-4 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--text)]">{cat.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{cat.description}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Dynamic tense step
  if (currentStep?.dynamic && currentStepId === 'tense') {
    const tenses = getAvailableTenses(answers.flow)

    return (
      <div>
        <WizardHeader onBack={handleBack} onStartOver={handleStartOver} />
        <Breadcrumbs history={history} answers={answers} />

        {previewSteps.length > 0 && (
          <SentenceBar steps={previewSteps} isFinished={false} onUndo={() => {}} onReset={() => {}} />
        )}

        <div className="mb-4">
          <h2 className="text-[var(--text)] mb-4">{currentStep.question}</h2>
        </div>

        {currentStep.teaching && (
          <TeachingPanel
            teaching={currentStep.teaching}
            open={teachingOpen}
            onToggle={() => setTeachingOpen(!teachingOpen)}
          />
        )}

        <div className="space-y-2">
          {tenses.map(t => (
            <button
              key={t.tense}
              onClick={() => handleTenseSelect(t)}
              className="block w-full text-left px-5 py-4 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--text)]">{t.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {t.description}
                <span className="ml-2 font-tongan">{t.tongan}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Regular step with static choices
  if (!currentStep) {
    return (
      <div>
        <p className="text-[var(--text-muted)]">Something went wrong. <button onClick={handleStartOver} className="text-[var(--accent)] underline cursor-pointer">Start over</button></p>
      </div>
    )
  }

  return (
    <div>
      <WizardHeader onBack={handleBack} onStartOver={history.length > 1 ? handleStartOver : null} />
      <Breadcrumbs history={history} answers={answers} />

      {previewSteps.length > 0 && (
        <SentenceBar steps={previewSteps} isFinished={false} onUndo={() => {}} onReset={() => {}} />
      )}

      <div className="mb-4">
        <h2 className="text-[var(--text)] mb-4">{currentStep.question}</h2>
      </div>

      {currentStep.teaching && (
        <TeachingPanel
          teaching={currentStep.teaching}
          open={teachingOpen}
          onToggle={() => setTeachingOpen(!teachingOpen)}
        />
      )}

      <div className="space-y-2">
        {currentStep.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleChoice(choice)}
            className="block w-full text-left px-5 py-4 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors cursor-pointer"
          >
            <div className="text-[var(--text)]">{choice.label}</div>
            {choice.description && (
              <div className="text-xs text-[var(--text-muted)] mt-1">{choice.description}</div>
            )}
          </button>
        ))}
      </div>

      {/* Expandable extra choices */}
      {currentStep.expandable && (
        <div className="mt-3">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="text-sm text-[var(--accent)]/70 hover:text-[var(--accent)] transition-colors cursor-pointer"
            >
              {currentStep.expandable.label}
            </button>
          ) : (
            <div className="space-y-2 mt-2 border-l-2 border-[var(--border)] pl-3">
              {currentStep.expandable.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(choice)}
                  className="block w-full text-left px-5 py-3 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors cursor-pointer"
                >
                  <div className="text-[var(--text)] text-sm">{choice.label}</div>
                  {choice.description && (
                    <div className="text-xs text-[var(--text-muted)] mt-1">{choice.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function WizardHeader({ onBack, onStartOver }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl text-[var(--accent)] font-bold tracking-wide">WHAT DO YOU WANT TO SAY?</h1>
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          &larr; Back
        </button>
        {onStartOver && (
          <button
            onClick={onStartOver}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  )
}

function Breadcrumbs({ history, answers }) {
  if (history.length <= 1) return null

  const crumbs = history.slice(0, -1).map(stepId => {
    const step = STEPS[stepId]
    return step?.question?.replace('?', '') || stepId
  })

  return (
    <div className="flex flex-wrap gap-2 mb-4 text-xs text-[var(--text-faint)]">
      {crumbs.map((crumb, i) => (
        <span key={i}>{crumb} &rarr;</span>
      ))}
    </div>
  )
}

function TeachingPanel({ teaching, open, onToggle }) {
  return (
    <div className="border-l-2 border-[var(--accent)]/40 bg-[var(--accent-faint)] px-4 py-3 mb-4">
      <button
        onClick={onToggle}
        className="text-xs text-[var(--accent)]/80 uppercase tracking-wider cursor-pointer flex items-center gap-1"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>&rsaquo;</span>
        {teaching.title}
      </button>
      {open && (
        <div className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          {teaching.text}
        </div>
      )}
    </div>
  )
}
