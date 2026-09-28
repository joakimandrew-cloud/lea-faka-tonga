import { TRACED } from '../components/kupesi-approved.js'

// Decorative website motifs approved by Andrew. No legacy aliases or fallback.
export const APPROVED_MOTIF_KEYS = Object.freeze(['nest', 'leaf', 'lens', 'pinwheel'])

export function approvedMotif(kind, invert = false) {
  if (!APPROVED_MOTIF_KEYS.includes(kind)) {
    throw new RangeError(`Unapproved website motif: ${kind}`)
  }
  return TRACED[invert ? `${kind}-inv` : kind]
}
