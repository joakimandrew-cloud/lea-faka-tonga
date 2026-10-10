// /questions: four questions people ask before they start learning Tongan.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/components/ArticlePage.jsx renders it in the app, scripts/prerender.mjs
// renders the same blocks as static HTML so a crawler that runs no JS reads
// the whole page.
//
// WHY ONE PAGE. The four questions share one reader, the person deciding
// whether and how to start, so they sit together and hand off to Lesson 1
// once. The hello question is answered on /greetings, which already ranks for
// it. Ruled 2026-10-10 (reviews/paa-questions-2026-10-10/Ruling.md in the
// project vault); the reasoning is in Answer-Map.md beside it.
//
// WHAT STAYS OUT, ON PURPOSE.
//   No other product is named (rulings of 2026-06-18 and 2026-07-02).
//   No difficulty ranking, hours-to-fluency figure or comparison with another
//     language: the course holds no research on any of them.
//   No FAQ markup: Google stopped showing FAQ rich results in 2026.
//   No claim that a learner can listen now: audio is forthcoming.
//   "Free" is tied to the free preview everywhere except the book, which
//     stays free. When the preview ends, this is the file to change.
//
// SOURCES. Each answer states only what a course file says.
//   Hard to learn: book/appendix-a-pronunciation.md (spelled the way it
//     sounds, seventeen letters); book/Chapter-01.md, "What a Verb Is" (the
//     verb does not change form to show tense); book/Chapter-02.md, "Two Kinds
//     of We"; book/Chapter-17.md, "Two classes of possession".
//   Learn to speak: book/Chapter-01.md, opening paragraph and "The Pattern"
//     (both example sentences are verbatim from there); book/Introduction.md;
//     the audio line follows AUDIO_PROGRESS in src/seo/learning-paths.js.
//   Free online, and the app question: src/seo/meta.js (the /lessons and
//     /quizzes entries) and book/Introduction.md, "Use the website with the
//     book" (the book is free and will remain free).
//
// ORTHOGRAPHY. Tongan sits inside `*…*` spans or an `ex` block with the ASCII
// apostrophe exactly as book/ stores it; both renderers run it through
// src/lib/okinafy.js, which turns it into the real fakauʻa (U+02BB).

export default {
  path: '/questions',
  eyebrow: 'Before you start',
  h1: 'Learning Tongan: questions answered',
  blocks: [
    { k: 'h2', text: 'Is Tongan a hard language to learn?' },
    {
      k: 'p',
      text:
        'Some of Tongan is more regular than an English speaker might expect, and some of it ' +
        'takes real work. Tongan is spelled the way it sounds: a letter always stands for the ' +
        'same sound, so once you know the 17 letters you can read any Tongan word aloud. A ' +
        'Tongan verb does not change form to show tense; the tense marker in front of the verb ' +
        'tells you when the action happened. The work is in what English does not have, such ' +
        'as two kinds of "we" depending on whether the listener is included, and two classes ' +
        'of possessive chosen by your relationship to the thing rather than by the thing itself.',
    },

    { k: 'h2', text: 'Where can I learn to speak Tongan?' },
    {
      k: 'p',
      text:
        'You can start online at leafakatonga.org, a 52-lesson Tongan course that teaches you ' +
        'to build sentences yourself, beginning in Lesson 1 with a three-part pattern: tense ' +
        'marker, pronoun, verb. Each lesson explains one part of the language in plain words, ' +
        'and the pronunciation guide shows how each letter sounds, so you can say the printed ' +
        'examples aloud as you go. Audio for the Tongan examples is forthcoming and has no ' +
        'release date yet, so practise with Tongan speakers whenever you can.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'á ke kai?', en: 'Did you eat?' },
        { ton: 'Na\'á ku kai.', en: 'I ate.' },
      ],
    },

    { k: 'h2', text: 'Is there a free way to learn Tongan online?' },
    {
      k: 'p',
      text:
        'Yes. During the free preview, all 52 lessons of Lea Faka-Tonga are open in your ' +
        'browser. It is a complete Tongan course taken in order, from a three-part sentence in ' +
        'Lesson 1 to advanced grammar, and each lesson has explanations in plain words, ' +
        'exercises and a ten-question quiz that explains the answer. The full book is a free ' +
        'download as a PDF or EPUB, and the book stays free.',
    },

    { k: 'h2', text: 'What app teaches Tongan?' },
    {
      k: 'p',
      text:
        'Lea Faka-Tonga teaches Tongan in your web browser, on a phone or a computer, with ' +
        'nothing to install. It is a 52-lesson course that runs from the basic sentence to ' +
        'advanced grammar, and each lesson has worked examples, practice built into the page ' +
        'and a ten-question quiz, with drills, flip cards and a searchable dictionary ' +
        'alongside. All 52 lessons are open during the free preview with no signup, and the ' +
        'book is free as a PDF or EPUB.',
    },

    { k: 'h2', text: 'Start with Lesson 1' },
    {
      k: 'p',
      text:
        'Lesson 1 teaches the three-part pattern and shows you how to use it to make ' +
        'statements and ask questions about past actions. Later lessons add to what you ' +
        'already understand, so the order matters more than the pace.',
    },
    {
      k: 'next',
      items: [
        { to: '/lessons/1', label: 'Lesson 1: the basic sentence' },
        { to: '/alphabet', label: 'The 17 letters and how each one sounds' },
        { to: '/greetings', label: 'How to say hello in Tongan' },
        { to: '/grammar/possessives', label: 'The two classes of possessive' },
        { to: '/lessons', label: 'All 52 lessons, open during the free preview' },
        { to: '/help', label: 'Download the free book as a PDF or EPUB' },
      ],
    },
  ],
}
