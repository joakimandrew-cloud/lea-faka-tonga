/**
 * error-messages — translate the sentence engine's developer-facing
 * exception text ("No walker could accept …", "Terminator … not available
 * in current menu") into copy a language learner can act on.
 *
 * The builder pages catch engine errors and previously rendered e.message
 * raw; learners have no idea what a walker, frame, slot, or terminator is.
 * Callers should console.error the original error (keeping the technical
 * detail for debugging) and render mapErrorToFriendly(e.message) instead.
 *
 * Known engine vocabulary lives in src/engine/multi-walker.js and
 * src/engine/graph-walker.js.
 */

export function mapErrorToFriendly(message) {
  const msg = message || ''

  // multi-walker: 'No walker could accept "kai"' / 'No entry point could accept …'
  // graph-walker: 'Word "…" is not available at node …'
  if (/No (walker|entry point) could accept/i.test(msg) || /is not available at node/i.test(msg)) {
    return 'That word can’t come next here. Pick one of the options shown.'
  }

  // graph-walker: 'Cannot take extension while a required slot is pending' /
  // 'No required slot pending in current frame'
  if (/required slot/i.test(msg)) {
    return 'Finish the current part of the sentence before adding more.'
  }

  // graph-walker: 'Walker is finished; cannot advance / cannot take extension'
  if (/Walker is finished/i.test(msg)) {
    return 'This sentence is already complete. Press “start over” to build a new one.'
  }

  // multi-walker: 'No walker offers extension …' / 'No walker can finish with
  // terminator …'; graph-walker: 'Terminator … not available in current menu'
  if (/not available/i.test(msg) || /No walker (offers|can finish)/i.test(msg)) {
    return 'That option isn’t available right now. Pick one of the options shown.'
  }

  // Fallback for anything unrecognised.
  return 'That choice didn’t work here. Pick one of the options shown, or press “start over”.'
}
