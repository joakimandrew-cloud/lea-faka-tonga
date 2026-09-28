import vocabulary from '../data/book-vocabulary.json'
import { okinafy } from './okinafy'
import { buildVocabLists } from './vocab-lists'

const built = buildVocabLists(vocabulary, okinafy)

export const meaningGroups = built.meaningGroups
export const otherMeanings = built.otherMeanings
export const lists = built.lists
export const deckForLists = built.deckForLists
