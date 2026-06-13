/**
 * FakaSorter page — Ch 32 drill, standalone route.
 *
 * Wraps FakaSorterCore in the shared DrillFrame. The Core is shared with the
 * chapter-32 inline anchor via the drill registry.
 */

import DrillFrame from '../drills/DrillFrame'
import FakaSorterCore from '../drills/FakaSorterCore'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function FakaSorter() {
  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow('faka-pattern-sorter')}
      title="One prefix, four jobs."
      blurb={
        <>
          The prefix <em>faka-</em> is one of the most productive
          word-builders in Tongan. The same three letters can turn a noun
          into an adverb of manner, an adjective into a causative verb, a
          time-noun into &ldquo;every X,&rdquo; or (with an extra
          <em> -e-</em>) narrow to one particular thing. Sort each
          <em> faka-</em> word into the job it&rsquo;s doing.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">The four jobs of <em>faka-</em></h2>
          <p>
            <strong>Manner / likeness.</strong> Attached to a noun, <em>faka-</em>
            creates an adverb meaning &ldquo;in the manner of.&rdquo;
            <em> faka-Tonga</em> = in the Tongan way. Hyphenated with proper
            names; closed compound otherwise.
          </p>
          <p>
            <strong>Causative.</strong> Attached to an adjective or
            intransitive verb, <em>faka-</em> creates a verb meaning
            &ldquo;to make / to cause.&rdquo; <em>mohe</em> (sleep) becomes
            <em> fakamohe</em> (put to sleep). When the action is reflexive
            (a group does it to itself), the same form is used: <em>fakataha</em>
            (assemble).
          </p>
          <p>
            <strong>Temporal.</strong> Attached to a time noun, <em>faka-</em>
            means &ldquo;every X.&rdquo; <em>faka&#700;aho</em> = daily,
            <em> fakauike</em> = weekly.
          </p>
          <p>
            <strong>Pertaining to one.</strong> The compound prefix
            <em> faka-e-</em> narrows from &ldquo;X-related in general&rdquo;
            to &ldquo;pertaining to ONE particular X.&rdquo; The extra
            <em> -e-</em> is the disambiguator.
          </p>
          <p className="pcs-lesson-foot">
            The trick is reading the base word: noun? adjective? intransitive
            verb? time noun? The answer tells you which job <em>faka-</em>
            is doing.
          </p>
        </>
      }
    >
      <FakaSorterCore />
    </DrillFrame>
  )
}
