/**
 * The exits a drill's end card offers: { backTo, lessonNum }.
 *
 * Its own file so DrillFrame can provide it and DeckComplete can read it
 * without either importing the other's component. Null wherever no frame
 * supplies it, which is the in-chapter case: a drill embedded in Lesson 7
 * should not end by offering the way out of Lesson 7. (UX-09, 2026-09-03.)
 */
import { createContext } from 'react'

export const DrillEndLinks = createContext(null)

export default DrillEndLinks
