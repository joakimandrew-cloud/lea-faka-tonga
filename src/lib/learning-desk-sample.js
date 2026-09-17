import bookExercises from '../data/book-exercises.json'

// This homepage sample selects a tracked item from the generated course data.
// Its surrounding teaching text is verbatim from Lesson 1; no course data is
// regenerated or changed here.
const exercise = bookExercises['1'].find(entry => entry.id === 'ch1-ex4')

export const learningDeskSample = {
  item: exercise.items.find(item => item.id === 'ch1-ex4-1'),
  instructions: exercise.instructions,
  introduction: 'Change the pronoun to change who did the action.',
  explanation: 'In this pattern, the preposed pronoun goes between the tense marker and the verb. It tells you who did the action.',
  pronouns: [
    { word: '*ke*', meaning: 'you (one person)' },
    { word: '*ku*', meaning: 'I' },
  ],
  completed: "*Na'á ku kai.*",
  translation: 'I ate.',
}
