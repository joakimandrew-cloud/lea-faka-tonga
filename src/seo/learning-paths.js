export const HOME_HUB = {
  eyebrow: 'A complete 52-lesson Tongan course',
  heading: ['Build your first', 'Tongan sentence.'],
  lead: 'See how the words fit together, change one part, and understand what changed. Begin with the real pattern from Lesson 1.',
}

export const BEGINNER_PATH = {
  eyebrow: 'New to Tongan?',
  heading: 'Learn Tongan, step by step.',
  lead: 'Start with the sounds, build a first sentence, then follow the course in order. Keep the reference pages nearby when you need them.',
  steps: [
    {
      number: '01',
      title: 'Learn the sounds and greetings',
      text: 'Read the alphabet guide, then see the words used when you meet someone.',
      links: [
        { to: '/alphabet', label: 'Alphabet & pronunciation' },
        { to: '/greetings', label: 'Greetings' },
      ],
    },
    {
      number: '02',
      title: 'Build your first sentence',
      text: 'Start Lesson 1, then follow all 52 lessons in order from beginner to advanced.',
      links: [
        { to: '/lessons/1', label: 'Start Lesson 1' },
        { to: '/lessons', label: 'Browse all lessons' },
      ],
    },
    {
      number: '03',
      title: 'Keep references nearby',
      text: 'Look up course vocabulary, themed word lists, or the grammar charts whenever you need them.',
      links: [
        { to: '/dictionary', label: 'Dictionary' },
        { to: '/word-lists', label: 'Word lists' },
        { to: '/charts', label: 'Grammar charts' },
        { to: '/topics', label: 'Topic guides' },
      ],
    },
  ],
}

export const AUDIO_PROGRESS =
  'Audio for every Tongan example is forthcoming. It will take time to complete, so there is no release date yet.'

export const CHARTS_HUB = {
  eyebrow: 'Reference · Pronouns & possessives',
  heading: 'Tongan grammar charts',
  lead: 'Use these eight groups of pronoun and possessive charts while you work through the course. For step-by-step explanations, follow the lessons or browse the topic guides.',
  links: [
    { to: '/lessons/1', label: 'Start Lesson 1' },
    { to: '/lessons', label: 'All lessons' },
    { to: '/topics', label: 'Topic guides' },
  ],
}
