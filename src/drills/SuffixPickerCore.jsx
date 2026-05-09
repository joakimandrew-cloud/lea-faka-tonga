/**
 * SuffixPickerCore — Ch 48.
 *
 * Two productive Tongan suffixes that look almost identical: -ʻanga
 * marks a PLACE (or means / source), -nga marks the THING / RESULT.
 * mohe + -ʻanga = mohe'anga (sleeping-place); mohe + -nga = mohenga
 * (bed). The drill teaches the place-vs-thing distinction.
 */

import PickerCore from './PickerCore'

const OPTIONS = [
  { id: 'anga', label: '-ʻanga', detail: 'place / source / means' },
  { id: 'nga',  label: '-nga',   detail: 'result / thing produced' },
]

const PROMPTS = [
  { tongan: 'mohe + ___ = mohenga',          english: 'a bed (the thing you sleep on)',                       answer: 'nga',  why: 'mohenga = bed = a THING. -nga marks the result/object, not the place.' },
  { tongan: 'mohe + ___ = moheʻanga',        english: 'a sleeping-place (where you sleep)',                   answer: 'anga', why: 'moheʻanga = sleeping-place = a PLACE. -ʻanga marks the location.' },
  { tongan: 'ako + ___ = akoʻanga',          english: 'a school / seat of learning (where you study)',         answer: 'anga', why: 'akoʻanga = a place — the school building. -ʻanga.' },
  { tongan: 'ngāue + ___ = ngāueʻanga',      english: 'a workplace (where you work)',                          answer: 'anga', why: 'ngāueʻanga = workplace = location. -ʻanga.' },
  { tongan: 'fou + ___ = founga',            english: 'a route / method (the means)',                          answer: 'nga',  why: 'founga = method or way = a thing/concept, not a physical place. -nga.' },
  { tongan: 'tuʻu + ___ = tuʻunga',          english: 'a stand / ladder / rank (a thing or status)',          answer: 'nga',  why: 'tuʻunga = the thing you stand ON, or your rank. -nga.' },
  { tongan: 'tuʻu + ___ = tuʻuʻanga',        english: 'a standing-place (a physical site)',                    answer: 'anga', why: 'tuʻuʻanga = standing-place / site → -ʻanga.' },
  { tongan: 'kai + ___ = kaiʻanga',          english: 'an eating-place',                                       answer: 'anga', why: 'kaiʻanga = where you eat. -ʻanga.' },
]

export default function SuffixPickerCore() {
  return (
    <PickerCore
      options={OPTIONS}
      prompts={PROMPTS}
      question="Which suffix gives the right meaning?"
      promptLabel="Word build"
    />
  )
}
