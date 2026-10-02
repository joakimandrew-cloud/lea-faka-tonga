import { KupesiTile } from './Kupesi.jsx'
import { APPROVED_MOTIF_KEYS } from '../lib/motif-policy.js'
import '../styles/entry-motif.css'

// Start with the manulua form, then use the other approved banner motifs.
const ENTRY_SEQUENCE = ['pinwheel', ...APPROVED_MOTIF_KEYS.filter(kind => kind !== 'pinwheel')]

export default function EntryMotif({ index = 0, kind, size = 24, className = '' }) {
  const position = ((index % ENTRY_SEQUENCE.length) + ENTRY_SEQUENCE.length) % ENTRY_SEQUENCE.length
  return (
    <span className={`entry-motif ${className}`.trim()} aria-hidden="true">
      <KupesiTile kind={kind ?? ENTRY_SEQUENCE[position]} size={size} />
    </span>
  )
}
