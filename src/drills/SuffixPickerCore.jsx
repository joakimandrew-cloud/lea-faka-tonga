/**
 * SuffixPickerCore, Ch 48.
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
  { tongan: 'mohe + ___',  english: 'a bed, the thing you sleep on',                        answer: 'nga',  why: 'mohenga = bed = a THING. -nga marks the result/object, not the place.' },
  { tongan: 'mohe + ___',  english: 'a sleeping-place, where you sleep',                    answer: 'anga', why: 'moheʻanga = sleeping-place = a PLACE. -ʻanga marks the location.' },
  { tongan: 'ako + ___',   english: 'a school, the place where you go to study',            answer: 'anga', why: 'akoʻanga = a place: the school building. -ʻanga.' },
  { tongan: 'ngāue + ___', english: 'a workplace, the place where you work',                answer: 'anga', why: 'ngāueʻanga = workplace = location. -ʻanga.' },
  { tongan: 'fou + ___',   english: 'a route or method, the means of doing it',             answer: 'nga',  why: 'founga = method or way = a thing/concept, not a physical place. -nga.' },
  { tongan: 'tuʻu + ___',  english: 'a stand, ladder, or rank, a thing or a status',        answer: 'nga',  why: 'tuʻunga = the thing you stand ON, or your rank. -nga.' },
  { tongan: 'tuʻu + ___',  english: 'a standing-place, a physical site to stand on',        answer: 'anga', why: 'tuʻuʻanga = standing-place / site → -ʻanga.' },
  { tongan: 'kai + ___',   english: 'an eating-place, where the eating happens',            answer: 'anga', why: 'kaiʻanga = where you eat. -ʻanga.' },
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
