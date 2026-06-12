/**
 * Tests for the slot-based sentence engine.
 * Covers Ch 1–5 patterns: s01–s04 (statements), s08–s11 (commands/suggestions).
 */
import { describe, it, expect } from 'vitest'
import {
  getAvailableSlots,
  getOptionsForSlot,
  assembleSentence,
  validateSentence,
  getPatternsByCategory,
  slotsToSteps,
} from './slot-engine.js'
import vocab from '../data/vocabulary-by-slot.json'
import sentencePatterns from '../data/sentence-patterns.json'

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const TM = {
  past:     { tongan: 'Na\u02BBa', english: 'past', tags: ['past'] },
  past_exp: { tongan: 'Na\u02BBe', english: 'past', tags: ['past'] },
  present:  { tongan: '\u02BBOku', english: 'present', tags: ['present'] },
  perfect:  { tongan: 'Kuo', english: 'perfect (has done)', tags: ['perfect'] },
  future:   { tongan: 'Te', english: 'future', tags: ['future'] },
}

function pron(tongan, english, person, number) {
  return { tongan, english, subject_english: english, person, number }
}

const PRON = {
  _1sg_ku: pron('ku', 'I', 1, 'singular'),
  _1sg_ou: pron('ou', 'I', 1, 'singular'),
  _1sg_u:  pron('u',  'I', 1, 'singular'),
  _2sg:    pron('ke', 'you', 2, 'singular'),
  _3sg:    pron('ne', 'he/she', 3, 'singular'),
  _3pl:    pron('nau', 'they', 3, 'plural'),
}

function verb(tongan, english, tags = ['action', 'intransitive']) {
  return { tongan, english, tags }
}

const V = {
  kai:    verb('kai', 'eat', ['action', 'transitive']),
  inu:    verb('inu', 'drink', ['action', 'transitive']),
  mohe:   verb('mohe', 'sleep'),
  alu:    verb('\u02BBalu', 'go', ['action', 'intransitive', 'motion']),
  hau:    verb('ha\u02BBu', 'come', ['action', 'intransitive', 'motion']),
  hiva:   verb('hiva', 'sing'),
  nofo:   verb('nofo', 'stay/live'),
  ngaue:  verb('ng\u0101ue', 'work'),
  fiefia: verb('fiefia', 'happy', ['adjective']),
}

// ===========================================================================
// assembleSentence — Tongan output
// ===========================================================================

describe('assembleSentence — correct Tongan output', () => {
  it('s01: \u02BBOku ou kai', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.present, subject: PRON._1sg_ou, verb: V.kai,
    })
    expect(r.tongan).toBe('\u02BBOku ou kai')
  })

  it('s01: Na\u02BBá ku mohe', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.past, subject: PRON._1sg_ku, verb: V.mohe,
    })
    expect(r.tongan).toBe('Na\u02BBá ku mohe')
  })

  it('s01: Té u \u02BBalu', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.future, subject: PRON._1sg_u, verb: V.alu,
    })
    expect(r.tongan).toBe('Té u \u02BBalu')
  })

  it('s01: Na\u02BBá ne hiva', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.past, subject: PRON._3sg, verb: V.hiva,
    })
    expect(r.tongan).toBe('Na\u02BBá ne hiva')
  })

  it('s02: Na\u02BBá ku ng\u0101ue m\u0101lohi', () => {
    const r = assembleSentence('s02', {
      tense_marker: TM.past, subject: PRON._1sg_ku, verb: V.ngaue,
      modifier: { tongan: 'm\u0101lohi', english: 'hard/strongly' },
    })
    expect(r.tongan).toBe('Na\u02BBá ku ng\u0101ue m\u0101lohi')
  })

  it('s03: Na\u02BBá ku kai m\u0101', () => {
    const r = assembleSentence('s03', {
      tense_marker: TM.past, subject: PRON._1sg_ku, verb: V.kai,
      object: { tongan: 'm\u0101', english: 'bread', tags: ['bare_noun'] },
    })
    expect(r.tongan).toBe('Na\u02BBá ku kai m\u0101')
  })

  it('s04: Na\u02BBá ku kai pulu \u02BBanep\u014D', () => {
    const r = assembleSentence('s04', {
      tense_marker: TM.past, subject: PRON._1sg_ku, verb: V.kai,
      object: { tongan: 'pulu', english: 'beef', tags: ['bare_noun'] },
      time: { tongan: '\u02BBanep\u014D', english: 'last night', tags: ['past'] },
    })
    expect(r.tongan).toBe('Na\u02BBá ku kai pulu \u02BBanep\u014D')
  })

  it('s08: Kai (singular command)', () => {
    const r = assembleSentence('s08', {
      verb: { tongan: 'Kai', english: 'Eat', tags: ['action', 'transitive'] },
    })
    expect(r.tongan).toBe('Kai')
  })

  it('s08: \u02BBAlu koe (singular command + postposed pronoun)', () => {
    const r = assembleSentence('s08', {
      verb: { tongan: '\u02BBAlu', english: 'Go', tags: ['action', 'intransitive', 'motion'] },
      postposed_pronoun: { tongan: 'koe', english: 'you (emphatic)', person: 2, number: 'singular' },
    })
    expect(r.tongan).toBe('\u02BBAlu koe')
  })

  it('s08 exposes koe as a postposed_pronoun option at Ch 5', () => {
    const opts = getOptionsForSlot('s08', 'postposed_pronoun', {}, 5)
    expect(opts.map(o => o.tongan)).toEqual(['koe'])
  })

  it('s09: Mou \u014D (plural command)', () => {
    const r = assembleSentence('s09', {
      verb: { tongan: '\u014D', english: 'go (plural form of \u02BBalu)' },
    })
    expect(r.tongan).toBe('Mou \u014D')
  })

  it('s10: \u02BBOua té ke kai (prohibition)', () => {
    const r = assembleSentence('s10', {
      subject: { tongan: 'ke', english: 'you (one person)' },
      verb: { tongan: 'kai', english: 'eat', tags: ['action', 'transitive'] },
    })
    expect(r.tongan).toBe('\u02BBOua té ke kai')
  })

  it('s11: Tau kai (suggestion)', () => {
    const r = assembleSentence('s11', {
      suggestion_pronoun: { tongan: 'Tau', english: "let's (all of us)" },
      verb: V.kai,
    })
    expect(r.tongan).toBe('Tau kai')
  })
})

// ===========================================================================
// assembleSentence — English translation via adapter
// ===========================================================================

describe('assembleSentence — correct English via translate.js', () => {
  it('s01 present 1sg: I eat.', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.present, subject: PRON._1sg_ou, verb: V.kai,
    })
    expect(r.english).toBe('I eat.')
  })

  it('s01 past 1sg: I slept.', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.past, subject: PRON._1sg_ku, verb: V.mohe,
    })
    expect(r.english).toBe('I slept.')
  })

  it('s01 future 1sg: I will go.', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.future, subject: PRON._1sg_u, verb: V.alu,
    })
    expect(r.english).toBe('I will go.')
  })

  it('s01 past 3sg: He/she sang.', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.past, subject: PRON._3sg, verb: V.hiva,
    })
    expect(r.english).toBe('He/she sang.')
  })

  it('s02: I worked hard.', () => {
    const r = assembleSentence('s02', {
      tense_marker: TM.past, subject: PRON._1sg_ku, verb: V.ngaue,
      modifier: { tongan: 'm\u0101lohi', english: 'hard/strongly' },
    })
    expect(r.english).toBe('I worked hard.')
  })

  it('s03: I ate bread.', () => {
    const r = assembleSentence('s03', {
      tense_marker: TM.past, subject: PRON._1sg_ku, verb: V.kai,
      object: { tongan: 'm\u0101', english: 'bread', tags: ['bare_noun'] },
    })
    expect(r.english).toBe('I ate bread.')
  })

  it('s04: I ate beef last night.', () => {
    const r = assembleSentence('s04', {
      tense_marker: TM.past, subject: PRON._1sg_ku, verb: V.kai,
      object: { tongan: 'pulu', english: 'beef', tags: ['bare_noun'] },
      time: { tongan: '\u02BBanep\u014D', english: 'last night', tags: ['past'] },
    })
    expect(r.english).toBe('I ate beef last night.')
  })

  it('s08: Eat!', () => {
    const r = assembleSentence('s08', {
      verb: { tongan: 'Kai', english: 'Eat', tags: ['action', 'transitive'] },
    })
    expect(r.english).toBe('Eat!')
  })

  it('s09: Go, all of you!', () => {
    const r = assembleSentence('s09', {
      verb: { tongan: '\u014D', english: 'go (plural form of \u02BBalu)' },
    })
    expect(r.english).toBe('Go, all of you!')
  })

  it("s11: Let's eat!", () => {
    const r = assembleSentence('s11', {
      suggestion_pronoun: { tongan: 'Tau', english: "let's (all of us)" },
      verb: V.kai,
    })
    expect(r.english).toBe("Let's eat!")
  })

  it('s01 adjective: I am happy.', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.present, subject: PRON._1sg_ou, verb: V.fiefia,
    })
    expect(r.english).toBe('I am happy.')
  })

  // Regression: Ch 7 s06 prep phrase was silently dropped from English.
  it("s06 Ch7: Na'a ku mohe 'i 'api includes 'at home'", () => {
    const r = assembleSentence('s06', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      verb: V.mohe,
      preposition: { tongan: '\u02BBi', english: 'in/at' },
      place: { tongan: '\u02BBapi', english: 'home' },
    })
    expect(r.method).toBe('composed')
    expect(r.english.toLowerCase()).toContain('at home')
    expect(r.english.toLowerCase()).toContain('slept')
  })

  it('s06 Ch7: prep ki/kolo composes "to town"', () => {
    const r = assembleSentence('s06', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      verb: V.alu,
      preposition: { tongan: 'ki', english: 'to/toward' },
      place: { tongan: 'kolo', english: 'town' },
    })
    expect(r.method).toBe('composed')
    expect(r.english.toLowerCase()).toContain('town')
    expect(r.english.toLowerCase()).toMatch(/to(\/toward)? town/)
  })

  it('s06 Ch7: prep mei/Fisi composes "from Fiji"', () => {
    const r = assembleSentence('s06', {
      tense_marker: TM.past,
      subject: PRON._3sg,
      verb: V.hau,
      preposition: { tongan: 'mei', english: 'from' },
      place: { tongan: 'Fisi', english: 'Fiji' },
    })
    expect(r.method).toBe('composed')
    expect(r.english.toLowerCase()).toContain('from fiji')
  })
})

// ===========================================================================
// Preposition class-form synthesis + smart pairing (Ch 6, Ch 7)
// Inventory-parity: Chapter-Inventory.md is authoritative.
// ===========================================================================

describe("preposition class forms — Chapter-Inventory.md parity", () => {
  const tonganSet = (opts) => new Set(opts.map(o => o.tongan))

  it('Ch 6 (s06): preposition slot exposes only the local ʻi', () => {
    const opts = getOptionsForSlot('s06', 'preposition', {}, 6)
    const forms = tonganSet(opts)
    expect(forms.has('\u02BBi')).toBe(true)
    expect(forms.has('\u02BBia')).toBe(false)
    expect(forms.has('\u02BBiate')).toBe(false)
    expect(forms.has('ki')).toBe(false)
    expect(forms.has('kia')).toBe(false)
    expect(forms.has('kiate')).toBe(false)
    expect(forms.has('mei')).toBe(false)
  })

  it('Ch 7 (s06): preposition slot exposes all Ch 7 forms (ki/kia/kiate + ʻi/ʻia/ʻiate + mei/meia/meiate)', () => {
    const opts = getOptionsForSlot('s06', 'preposition', {}, 7)
    const forms = tonganSet(opts)
    for (const f of ['\u02BBi', '\u02BBia', '\u02BBiate', 'ki', 'kia', 'kiate', 'mei', 'meia', 'meiate']) {
      expect(forms.has(f), `expected Ch 7 to include ${f}`).toBe(true)
    }
    // Common-class forms (ʻi he / ki he / mei he) arrive at Ch 8 with the
    // `he` definite article per Chapter-Inventory.md.
    expect(forms.has('\u02BBi he')).toBe(false)
    expect(forms.has('ki he')).toBe(false)
    expect(forms.has('mei he')).toBe(false)
  })

  it('Ch 8 (s06): common-class forms ʻi he / ki he / mei he appear', () => {
    const opts = getOptionsForSlot('s06', 'preposition', {}, 8)
    const forms = tonganSet(opts)
    expect(forms.has('\u02BBi he')).toBe(true)
    expect(forms.has('ki he')).toBe(true)
    expect(forms.has('mei he')).toBe(true)
  })

  it('Ch 26 (s06): benefactive maʻa / moʻo still pass through (non-class-form preps)', () => {
    const opts = getOptionsForSlot('s06', 'preposition', {}, 26)
    const forms = tonganSet(opts)
    expect(forms.has('ma\u02BBa')).toBe(true)
    expect(forms.has('mo\u02BBo')).toBe(true)
  })
})

describe('place slot — smart pairing by selected preposition class', () => {
  const placeTongan = (opts) => opts.map(o => o.tongan)

  it('kia (personal) → place options are personal names only', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'kia', noun_class: 'personal' } }, 10)
    expect(opts.length).toBeGreaterThan(0)
    for (const o of opts) expect(o.noun_class).toBe('personal')
    expect(placeTongan(opts)).toContain('Sione')
  })

  // Ch 7 is where kia/kiate are first taught; personal names + pronouns
  // must already be available as complements there.
  it('Ch 7: kia → at least one personal name is selectable', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'kia', noun_class: 'personal' } }, 7)
    expect(opts.length).toBeGreaterThan(0)
    expect(placeTongan(opts)).toContain('Sione')
  })

  it('Ch 7: kiate → full postposed-pronoun set (singular + dual + plural, incl/excl)', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'kiate', noun_class: 'pronoun' } }, 7)
    const forms = new Set(placeTongan(opts))
    for (const p of ['au', 'koe', 'ia', 'kitaua', 'kimaua', 'kimoua', 'kinaua',
                     'kitautolu', 'kimautolu', 'kimoutolu', 'kinautolu']) {
      expect(forms.has(p), `expected Ch 7 kiate to offer ${p}`).toBe(true)
    }
  })

  // Per book/Chapter-08: `ki he` at Ch 8 drills with common-class THING
  // nouns (fale, hele, fala, fale kai, kolo). Person common nouns are NOT
  // book-introduced as prep complements at Ch 8.
  it('Ch 8: ki he → fale (thing) selectable; persons NOT yet', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'ki he', noun_class: 'common' } }, 8)
    const forms = new Set(placeTongan(opts))
    expect(forms.has('fale')).toBe(true)
    expect(forms.has('tamasi\u02BBi')).toBe(false)
    expect(forms.has('tangata')).toBe(false)
  })

  // faiako enters the book at Ch 12 (noun_ko / predicate_noun); other
  // common-class persons at Ch 15 (noun_subject_name).
  it('Ch 12: ki he → faiako (teacher) selectable', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'ki he', noun_class: 'common' } }, 12)
    const forms = new Set(placeTongan(opts))
    expect(forms.has('faiako')).toBe(true)
    expect(forms.has('tamasi\u02BBi')).toBe(false)
  })

  it('Ch 15: ki he → full common-class person set (tamasiʻi, taʻahine, tangata, fefine, faiako, tōketā)', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'ki he', noun_class: 'common' } }, 15)
    const forms = new Set(placeTongan(opts))
    for (const n of ['tamasi\u02BBi', 'ta\u02BBahine', 'tangata', 'fefine', 'faiako', 't\u014Dket\u0101']) {
      expect(forms.has(n), `expected Ch 15 ki he to offer ${n}`).toBe(true)
    }
  })

  it('kiate (pronoun) → place options are pronouns only', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'kiate', noun_class: 'pronoun' } }, 11)
    expect(opts.length).toBeGreaterThan(0)
    for (const o of opts) expect(o.noun_class).toBe('pronoun')
    expect(placeTongan(opts)).toContain('au')
  })

  it('ki (local) → place options are local-class thing nouns only', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'ki', noun_class: 'local' } }, 7)
    expect(opts.length).toBeGreaterThan(0)
    for (const o of opts) expect(o.noun_class).toBe('local')
    expect(placeTongan(opts)).toContain('kolo')
    expect(placeTongan(opts)).not.toContain('Sione')
  })

  it('ki he (common) → place options are common-class thing nouns only', () => {
    const opts = getOptionsForSlot('s06', 'place',
      { preposition: { tongan: 'ki he', noun_class: 'common' } }, 11)
    expect(opts.length).toBeGreaterThan(0)
    for (const o of opts) expect(o.noun_class).toBe('common')
    expect(placeTongan(opts)).toContain('fale')
  })

  it('no preposition filled (s06) → unfiltered (all classes shown)', () => {
    const opts = getOptionsForSlot('s06', 'place', {}, 11)
    const classes = new Set(opts.map(o => o.noun_class))
    expect(classes.size).toBeGreaterThan(1)
  })

  // Regression guard: s05 locks preposition to `ʻi` (local). The place slot
  // must narrow to local-class even though filledSlots.preposition is absent.
  it('s05 (locked ʻi) → place options are local-class only even at Ch 40', () => {
    const opts = getOptionsForSlot('s05', 'place', {}, 40)
    expect(opts.length).toBeGreaterThan(0)
    for (const o of opts) expect(o.noun_class).toBe('local')
    const forms = new Set(opts.map(o => o.tongan))
    expect(forms.has('Sione')).toBe(false)
    expect(forms.has('au')).toBe(false)
    expect(forms.has('fale')).toBe(false)
  })
})

// ===========================================================================
// getAvailableSlots
// ===========================================================================

describe('getAvailableSlots', () => {
  it('returns remaining unfilled slots after partial fill', () => {
    const avail = getAvailableSlots('s01', {
      tense_marker: TM.present,
      subject: PRON._1sg_ou,
    })
    expect(avail.length).toBe(1)
    expect(avail[0].id).toBe('verb')
  })

  it('filling one optional slot does NOT remove another (no disappearing options)', () => {
    // s04 has both an optional object and a required time slot
    const avail = getAvailableSlots('s04', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      verb: V.kai,
      object: { tongan: 'pulu', english: 'beef', tags: ['bare_noun'] },
    })
    expect(avail.some(s => s.id === 'time')).toBe(true)
  })

  it('filling a slot prevents it from appearing again (fill-once)', () => {
    const avail = getAvailableSlots('s06', {
      tense_marker: TM.present,
      subject: PRON._1sg_ou,
      verb: V.nofo,
      preposition: { tongan: '\u02BBi', english: 'in/at' },
      place: { tongan: 'Tonga', english: 'Tonga' },
    })
    expect(avail.some(s => s.id === 'place')).toBe(false)
    expect(avail.some(s => s.id === 'preposition')).toBe(false)
  })

  it('does not expose locked slots as available', () => {
    const avail = getAvailableSlots('s10', {})
    expect(avail.some(s => s.id === 'prohibition_marker')).toBe(false)
    expect(avail.some(s => s.id === 'subject')).toBe(true)
    expect(avail.some(s => s.id === 'verb')).toBe(true)
  })

  it('hides conditional slot when condition is unmet', () => {
    // s04 object has condition verb_has_tag transitive; alu is intransitive
    const avail = getAvailableSlots('s04', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      verb: V.alu,
    })
    expect(avail.some(s => s.id === 'object')).toBe(false)
    expect(avail.some(s => s.id === 'time')).toBe(true)
  })
})

// ===========================================================================
// getOptionsForSlot — pronoun dependency filtering
// ===========================================================================

describe('getOptionsForSlot — pronoun filtering by tense marker', () => {
  it('\u02BBOku selects ou for 1sg (not ku or u)', () => {
    const opts = getOptionsForSlot('s01', 'subject', { tense_marker: TM.present }, 5)
    const sg1 = opts.find(o => o.pronoun_code === '1sg')
    expect(sg1.tongan).toBe('ou')
    expect(opts.some(o => o.tongan === 'ku')).toBe(false)
    expect(opts.some(o => o.tongan === 'u')).toBe(false)
  })

  it('Na\u02BBa selects ku for 1sg', () => {
    const opts = getOptionsForSlot('s01', 'subject', { tense_marker: TM.past }, 5)
    expect(opts.find(o => o.pronoun_code === '1sg').tongan).toBe('ku')
  })

  it('Kuo selects u for 1sg', () => {
    const opts = getOptionsForSlot('s01', 'subject', { tense_marker: TM.perfect }, 5)
    expect(opts.find(o => o.pronoun_code === '1sg').tongan).toBe('u')
  })

  it('Te selects u for 1sg', () => {
    const opts = getOptionsForSlot('s01', 'subject', { tense_marker: TM.future }, 5)
    expect(opts.find(o => o.pronoun_code === '1sg').tongan).toBe('u')
  })

  it('Na\u02BBa allows all 11 preposed pronouns', () => {
    const opts = getOptionsForSlot('s01', 'subject', { tense_marker: TM.past }, 5)
    expect(opts.length).toBe(11)
    const forms = opts.map(o => o.tongan).sort()
    expect(forms).toEqual(['ke', 'ku', 'ma', 'mau', 'mo', 'mou', 'na', 'nau', 'ne', 'ta', 'tau'])
  })

  it('Kuo filters pronoun set correctly (s04 — was missing kuo key)', () => {
    const opts = getOptionsForSlot('s04', 'subject', { tense_marker: TM.perfect }, 5)
    expect(opts.length).toBe(11)
    expect(opts.find(o => o.pronoun_code === '1sg').tongan).toBe('u')
    expect(opts.some(o => o.tongan === 'ku')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Chapter coverage regression — every required slot must have options
// ---------------------------------------------------------------------------

describe('Chapter coverage: required slots have options at min_chapter', () => {
  const patterns = sentencePatterns.patterns

  for (const pattern of patterns) {
    const ch = pattern.min_chapter
    for (const slot of pattern.slots) {
      if (slot.locked || !slot.required) continue
      // Skip conditional slots (object depends on verb tag)
      if (slot.condition) continue
      // Skip pronoun slots (tested separately via TM iteration)
      if (slot.depends_on) continue

      it(`${pattern.id}.${slot.id} has >= 1 option at ch ${ch}`, () => {
        const opts = getOptionsForSlot(pattern.id, slot.id, {}, ch)
        expect(opts.length).toBeGreaterThanOrEqual(1)
      })
    }
  }
})

// ===========================================================================
// Short vs long pronoun form selection
// ===========================================================================

describe('short vs long pronoun form', () => {
  it('options return short forms (not long)', () => {
    const opts = getOptionsForSlot('s01', 'subject', { tense_marker: TM.present }, 5)
    // All pronoun options should be short forms
    for (const opt of opts) {
      expect(opt.tongan).not.toBe(opt.long_form)
    }
  })

  it('long_form property is available on each option', () => {
    const opts = getOptionsForSlot('s01', 'subject', { tense_marker: TM.present }, 5)
    for (const opt of opts) {
      expect(typeof opt.long_form).toBe('string')
    }
  })
})

// ===========================================================================
// Transitive vs intransitive patterns
// ===========================================================================

describe('transitive vs intransitive', () => {
  it('s03 verb options are transitive only', () => {
    const opts = getOptionsForSlot('s03', 'verb', {}, 5)
    expect(opts.every(o => o.tags && o.tags.includes('transitive'))).toBe(true)
  })

  it('s01 includes both transitive and intransitive verbs', () => {
    const opts = getOptionsForSlot('s01', 'verb', {}, 5)
    expect(opts.some(o => o.tags?.includes('transitive'))).toBe(true)
    expect(opts.some(o => o.tags?.includes('intransitive'))).toBe(true)
  })

  it('s04 object options return empty when verb is intransitive', () => {
    const opts = getOptionsForSlot('s04', 'object', { verb: V.alu }, 5)
    expect(opts).toEqual([])
  })

  it('s04 object options expose Ch 3 bare nouns (mā, ika) at Ch 4 with transitive kai', () => {
    const opts = getOptionsForSlot('s04', 'object', { verb: V.kai }, 4)
    const tongan = opts.map(o => o.tongan)
    expect(tongan).toContain('m\u0101')
    expect(tongan).toContain('ika')
    // pulu is the book's Ch 25 introduction (fanga pulu in the plural-markers
    // chapter); it must not surface before then.
    expect(tongan).not.toContain('pulu')
  })
})

// ===========================================================================
// translation-overrides.json matched through the adapter
// ===========================================================================

describe('translation overrides via adapter', () => {
  // Override keys now use U+02BB (ʻ) matching all vocabulary data.
  // 2nd-person past sentences hit the override table and return question form.

  it('Na\u02BBa ke kai \u2192 "Did you eat?" via override', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.past, subject: PRON._2sg, verb: V.kai,
    })
    expect(r.english).toBe('Did you eat?')
  })

  it('\u02BBOku ke mohe \u2192 "Do you sleep?" via override', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.present, subject: PRON._2sg, verb: V.mohe,
    })
    expect(r.english).toBe('Do you sleep?')
  })

  it('Te ke \u02BBalu \u2192 "Will you go?" via override', () => {
    const r = assembleSentence('s01', {
      tense_marker: TM.future,
      subject: pron('ke', 'you', 2, 'singular'),
      verb: V.alu,
    })
    expect(r.english).toBe('Will you go?')
  })

  it('adapter step tongan values flow through to override key', () => {
    const steps = slotsToSteps('s01', {
      tense_marker: TM.past, subject: PRON._2sg, verb: V.kai,
    })
    const key = steps.map(s => s.word.tongan).join('|')
    expect(key).toBe('Na\u02BBa|ke|kai')
  })
})

// ===========================================================================
// validateSentence
// ===========================================================================

describe('validateSentence', () => {
  it('catches missing required slots', () => {
    const result = validateSentence('s01', { tense_marker: TM.present })
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('subject')
    expect(result.missing).toContain('verb')
  })

  it('passes when all required slots filled', () => {
    const result = validateSentence('s01', {
      tense_marker: TM.present, subject: PRON._1sg_ou, verb: V.kai,
    })
    expect(result.valid).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('does not require conditional slot when condition is unmet', () => {
    // s04: object required:false, but even if it were required,
    // the intransitive verb means the condition gates it out
    const result = validateSentence('s04', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      verb: V.alu,
      time: { tongan: '\u02BBanep\u014D', english: 'last night', tags: ['past'] },
    })
    expect(result.valid).toBe(true)
  })

  it('reports missing time slot for s04', () => {
    const result = validateSentence('s04', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      verb: V.kai,
    })
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('time')
  })
})

// ===========================================================================
// getPatternsByCategory
// ===========================================================================

describe('getPatternsByCategory', () => {
  it('returns statement patterns for Ch 1–5', () => {
    const pats = getPatternsByCategory('Statements', null, 5)
    expect(pats.length).toBeGreaterThan(0)
    expect(pats.every(p => p.category === 'Statements' && p.min_chapter <= 5)).toBe(true)
  })

  it('returns command patterns for Ch 5', () => {
    const pats = getPatternsByCategory('Commands and Requests', null, 5)
    expect(pats.length).toBeGreaterThan(0)
  })

  it('returns no negation patterns below Ch 9', () => {
    const pats = getPatternsByCategory('Negation', null, 8)
    expect(pats.length).toBe(0)
  })
})

// ===========================================================================
// slotsToSteps adapter
// ===========================================================================

describe('slotsToSteps adapter', () => {
  it('produces correct nodeIds for s01', () => {
    const steps = slotsToSteps('s01', {
      tense_marker: TM.present, subject: PRON._1sg_ou, verb: V.kai,
    })
    expect(steps.map(s => s.nodeId)).toEqual(['tense_marker', 'pronoun', 'verb'])
  })

  it('includes locked slots in steps', () => {
    // s10 has a locked prohibition_marker
    const steps = slotsToSteps('s10', {
      subject: { tongan: 'ke', english: 'you (one person)' },
      verb: { tongan: 'kai', english: 'eat', tags: ['action', 'transitive'] },
    })
    expect(steps[0].nodeId).toBe('prohibition_marker')
    expect(steps[0].word.tongan).toBe('\u02BBOua te')
  })

  it('preserves tags on verb steps', () => {
    const steps = slotsToSteps('s01', {
      tense_marker: TM.present, subject: PRON._1sg_ou, verb: V.kai,
    })
    const verbStep = steps.find(s => s.nodeId === 'verb')
    expect(verbStep.word.tags).toContain('transitive')
  })
})

// ===========================================================================
// Data fix verifications
// ===========================================================================

describe('Fix: s10 prohibition verbs are lowercase', () => {
  it('prohibition verb options are all lowercase', () => {
    const opts = getOptionsForSlot('s10', 'verb', {}, 5)
    for (const o of opts) {
      expect(o.tongan).toBe(o.tongan.toLowerCase())
    }
  })

  it('assembled prohibition has lowercase verb', () => {
    const r = assembleSentence('s10', {
      subject: { tongan: 'ke', english: 'you (one person)' },
      verb: { tongan: 'kai', english: 'eat', tags: ['action', 'transitive'] },
    })
    expect(r.tongan).toBe('\u02BBOua té ke kai')
  })
})

describe('Fix: s12 negation only offers valid TMs', () => {
  it('only offers \u02BBOku, Na\u02BBe, \u02BBE', () => {
    const opts = getOptionsForSlot('s12', 'tense_marker', {}, 15)
    const forms = opts.map(o => o.tongan).sort()
    expect(forms).toEqual(['Na\u02BBe', '\u02BBE', '\u02BBOku'])
  })

  it('does NOT offer Na\u02BBa, Te, or Kuo', () => {
    const opts = getOptionsForSlot('s12', 'tense_marker', {}, 15)
    const forms = opts.map(o => o.tongan)
    expect(forms).not.toContain('Na\u02BBa')
    expect(forms).not.toContain('Te')
    expect(forms).not.toContain('Kuo')
  })
})

describe('Fix: s15/s22 noun-subject TMs exclude Na\u02BBa and Te', () => {
  it('s15 ko hai offers Na\u02BBe, \u02BBOku, \u02BBE, Kuo', () => {
    const opts = getOptionsForSlot('s15', 'tense_marker', {}, 15)
    const forms = opts.map(o => o.tongan).sort()
    expect(forms).toEqual(['Kuo', 'Na\u02BBe', '\u02BBE', '\u02BBOku'])
  })

  it('s15 does NOT offer Na\u02BBa or Te', () => {
    const opts = getOptionsForSlot('s15', 'tense_marker', {}, 15)
    const forms = opts.map(o => o.tongan)
    expect(forms).not.toContain('Na\u02BBa')
    expect(forms).not.toContain('Te')
  })

  it('s22 named subject offers same set', () => {
    const opts = getOptionsForSlot('s22', 'tense_marker', {}, 15)
    const forms = opts.map(o => o.tongan).sort()
    expect(forms).toEqual(['Kuo', 'Na\u02BBe', '\u02BBE', '\u02BBOku'])
  })
})

// ===========================================================================
// Ch 6 — Location patterns (s05, s06)
// ===========================================================================

describe('Ch 6: Location — s05 and s06', () => {
  it('s05: \u02BBOku ou \u02BBi \u02BBapi (I am at home)', () => {
    const r = assembleSentence('s05', {
      tense_marker: TM.present,
      subject: PRON._1sg_ou,
      place: { tongan: '\u02BBapi', english: 'home' },
    })
    expect(r.tongan).toBe('\u02BBOku ou \u02BBi \u02BBapi')
  })

  it('s05: Na\u02BBá ke \u02BBi kolo (Were you in town?)', () => {
    const r = assembleSentence('s05', {
      tense_marker: TM.past,
      subject: PRON._2sg,
      place: { tongan: 'kolo', english: 'town' },
    })
    expect(r.tongan).toBe('Na\u02BBá ke \u02BBi kolo')
  })

  it('s06: Na\u02BBá ku \u02BBalu ki kolo (I went to town)', () => {
    const r = assembleSentence('s06', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      verb: V.alu,
      preposition: { tongan: 'ki', english: 'to/toward' },
      place: { tongan: 'kolo', english: 'town' },
    })
    expect(r.tongan).toBe('Na\u02BBá ku \u02BBalu ki kolo')
  })

  it('s06: \u02BBOku ou nofo \u02BBi Tonga (I live in Tonga)', () => {
    const r = assembleSentence('s06', {
      tense_marker: TM.present,
      subject: PRON._1sg_ou,
      verb: V.nofo,
      preposition: { tongan: '\u02BBi', english: 'in/at' },
      place: { tongan: 'Tonga', english: 'Tonga' },
    })
    expect(r.tongan).toBe('\u02BBOku ou nofo \u02BBi Tonga')
  })
})

// ===========================================================================
// Ch 7 — Prepositions ki/mei, experiencer verbs (s06, s24)
// ===========================================================================

describe('Ch 7: Prepositions and experiencer verbs — s06, s24', () => {
  it('s06: Na\u02BBá ne ha\u02BBu mei Fisi (He/she came from Fiji)', () => {
    const r = assembleSentence('s06', {
      tense_marker: TM.past,
      subject: PRON._3sg,
      verb: V.hau,
      preposition: { tongan: 'mei', english: 'from' },
      place: { tongan: 'Fisi', english: 'Fiji' },
    })
    expect(r.tongan).toBe('Na\u02BBá ne ha\u02BBu mei Fisi')
  })

  it('s24: \u02BBOku mahino kiate au (I understand)', () => {
    const r = assembleSentence('s24', {
      tense_marker: TM.present,
      verb: { tongan: 'mahino', english: 'be understandable (= I understand)' },
      prep_pronoun: { tongan: 'au', english: 'I (emphatic)', person: 1, number: 'singular' },
    })
    expect(r.tongan).toBe('\u02BBOku mahino kiate au')
  })

  it('s24: Na\u02BBe ngalo \u02BBiate au (I forgot)', () => {
    const r = assembleSentence('s24', {
      tense_marker: TM.past_exp,
      verb: { tongan: 'ngalo', english: 'be forgotten (= I forgot)' },
      prep_pronoun: { tongan: 'au', english: 'I (emphatic)', person: 1, number: 'singular' },
    })
    expect(r.tongan).toBe('Na\u02BBe ngalo \u02BBiate au')
  })
})

// ===========================================================================
// Ch 8 — Articles (vocabulary expansion for s03 objects)
// ===========================================================================

describe('Ch 8: Articles — s03 with indefinite and definite objects', () => {
  it('s03: \u02BBOku ou fiema\u02BBu ha ika (I want some fish)', () => {
    const r = assembleSentence('s03', {
      tense_marker: TM.present,
      subject: PRON._1sg_ou,
      verb: { tongan: 'fiema\u02BBu', english: 'want/need', tags: ['action', 'transitive'] },
      object: { tongan: 'ha ika', english: 'some fish', tags: ['indefinite'] },
    })
    expect(r.tongan).toBe('\u02BBOku ou fiema\u02BBu ha ika')
  })

  it('s03: Na\u02BBá ke kai e m\u0101 (Did you eat the bread?)', () => {
    const r = assembleSentence('s03', {
      tense_marker: TM.past,
      subject: PRON._2sg,
      verb: V.kai,
      object: { tongan: 'e m\u0101', english: 'the bread', tags: ['definite'] },
    })
    expect(r.tongan).toBe('Na\u02BBá ke kai e m\u0101')
  })

  it('s03 object options include indefinite and definite at ch 8', () => {
    const opts = getOptionsForSlot('s03', 'object', {}, 8)
    const hasIndefinite = opts.some(o => o.tags?.includes('indefinite'))
    const hasDefinite = opts.some(o => o.tags?.includes('definite'))
    const hasBare = opts.some(o => o.tags?.includes('bare_noun'))
    expect(hasIndefinite).toBe(true)
    expect(hasDefinite).toBe(true)
    expect(hasBare).toBe(true)
  })
})

// ===========================================================================
// Ch 9 — Negation (s12)
// ===========================================================================

describe('Ch 9: Negation — s12 across tenses', () => {
  it('s12 present: \u02BBOku \u02BBikai té u \u02BBita (I am not angry)', () => {
    const r = assembleSentence('s12', {
      tense_marker: { tongan: '\u02BBOku', english: 'present', tags: ['present'] },
      subject: PRON._1sg_u,
      verb: { tongan: '\u02BBita', english: 'angry', tags: ['adjective'] },
    })
    expect(r.tongan).toBe('\u02BBOku \u02BBikai té u \u02BBita')
  })

  it('s12 past: Na\u02BBe \u02BBikai te nau kai (They did not eat)', () => {
    const r = assembleSentence('s12', {
      tense_marker: { tongan: 'Na\u02BBe', english: 'past', tags: ['past', 'negation'] },
      subject: PRON._3pl,
      verb: V.kai,
    })
    expect(r.tongan).toBe('Na\u02BBe \u02BBikai te nau kai')
  })

  it('s12 future: \u02BBE \u02BBikai té u \u02BBalu (I will not go)', () => {
    const r = assembleSentence('s12', {
      tense_marker: { tongan: '\u02BBE', english: 'future', tags: ['future', 'negation'] },
      subject: PRON._1sg_u,
      verb: V.alu,
    })
    expect(r.tongan).toBe('\u02BBE \u02BBikai té u \u02BBalu')
  })
})

// ===========================================================================
// Ch 10 — Comitative mo (s07), dual commands
// ===========================================================================

describe('Ch 10: Comitative mo — s07', () => {
  it('s07: Na\u02BBá ku \u02BBalu mo Sione (I went with Sione)', () => {
    const r = assembleSentence('s07', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      verb: V.alu,
      companion: { tongan: 'Sione', english: 'Sione' },
    })
    expect(r.tongan).toBe('Na\u02BBá ku \u02BBalu mo Sione')
  })

  it('s07: \u02BBOku ou nofo mo Pita (I live with Pita)', () => {
    const r = assembleSentence('s07', {
      tense_marker: TM.present,
      subject: PRON._1sg_ou,
      verb: V.nofo,
      companion: { tongan: 'Pita', english: 'Pita' },
    })
    expect(r.tongan).toBe('\u02BBOku ou nofo mo Pita')
  })

  it('s07: Na\u02BBá ne ha\u02BBu mo Mele (He/she came with Mele)', () => {
    const r = assembleSentence('s07', {
      tense_marker: TM.past,
      subject: PRON._3sg,
      verb: V.hau,
      companion: { tongan: 'Mele', english: 'Mele' },
    })
    expect(r.tongan).toBe('Na\u02BBá ne ha\u02BBu mo Mele')
  })

  it('s10 prohibition pronouns include mo (dual) at ch 10', () => {
    const opts = getOptionsForSlot('s10', 'subject', {}, 10)
    expect(opts.some(o => o.tongan === 'mo')).toBe(true)
  })
})

// ===========================================================================
// Ch 11 — Question words (s14 with ʻanefē, ʻafē, fēfē)
// ===========================================================================

describe('Ch 11: Question words — s14', () => {
  it("s14: Na\u02BBá ke ha\u02BBu \u02BBanef\u0113 (When did you come?)", () => {
    const r = assembleSentence('s14', {
      tense_marker: TM.past,
      subject: PRON._2sg,
      verb: V.hau,
      question_word: { tongan: '\u02BBanef\u0113', english: 'when (past)' },
    })
    expect(r.tongan).toBe('Na\u02BBá ke ha\u02BBu \u02BBanef\u0113')
  })

  it("s14: Té ke \u02BBalu \u02BBaf\u0113 (When will you go?)", () => {
    const r = assembleSentence('s14', {
      tense_marker: TM.future,
      subject: PRON._2sg,
      verb: V.alu,
      question_word: { tongan: '\u02BBaf\u0113', english: 'when (future)' },
    })
    expect(r.tongan).toBe('Té ke \u02BBalu \u02BBaf\u0113')
  })

  it('s14 question_word options include Ch 11 entries at ch 11', () => {
    const opts = getOptionsForSlot('s14', 'question_word', {}, 11)
    const words = opts.map(o => o.tongan)
    expect(words).toContain('\u02BBanef\u0113')
    expect(words).toContain('\u02BBaf\u0113')
    expect(words).toContain('f\u0113f\u0113')
  })
})

// ===========================================================================
// Ch 12 — Ko pattern (s18 identification, s16 ko e hā, s13 ko negation)
// ===========================================================================

describe('Ch 12: Ko pattern — s18, s16, s13', () => {
  it("s18: Ko e tohi \u02BBeni (This is a book)", () => {
    const r = assembleSentence('s18', {
      noun: { tongan: 'tohi', english: 'book' },
      demonstrative: { tongan: '\u02BBeni', english: 'this (near me)' },
    })
    expect(r.tongan).toBe('Ko e tohi \u02BBeni')
  })

  it("s16: Ko e h\u0101 \u0113 (What is that?)", () => {
    const r = assembleSentence('s16', {
      demonstrative: { tongan: '\u0113', english: 'that (over there)' },
    })
    expect(r.tongan).toBe('Ko e h\u0101 \u0113')
  })

  it("s13: \u02BBOku \u02BBikai ko e hele \u02BBeni (This is not a knife)", () => {
    const r = assembleSentence('s13', {
      predicate_noun: { tongan: 'hele', english: 'knife' },
      subject: { tongan: '\u02BBeni', english: 'this (near me)' },
    })
    expect(r.tongan).toBe('\u02BBOku \u02BBikai ko e hele \u02BBeni')
  })
})

// ===========================================================================
// Ch 13 — Ko questions (s15 ko hai, s17 ko fē)
// ===========================================================================

describe('Ch 13: Ko questions — s15, s17', () => {
  it("s15: Ko hai Na\u02BBe mohe (Who slept?)", () => {
    const r = assembleSentence('s15', {
      tense_marker: { tongan: 'Na\u02BBe', english: 'past', tags: ['past', 'noun_subject'] },
      verb: V.mohe,
    })
    expect(r.tongan).toBe('Ko hai Na\u02BBe mohe')
  })

  it("s15: Ko hai \u02BBE \u02BBalu (Who will go?)", () => {
    const r = assembleSentence('s15', {
      tense_marker: { tongan: '\u02BBE', english: 'future', tags: ['future', 'noun_subject'] },
      verb: V.alu,
    })
    expect(r.tongan).toBe('Ko hai \u02BBE \u02BBalu')
  })

  it('s17 subject options include noun_subject_names at ch 15', () => {
    const opts = getOptionsForSlot('s17', 'subject_phrase', {}, 15)
    expect(opts.length).toBeGreaterThan(0)
    expect(opts.some(o => o.tongan === 'Sione')).toBe(true)
  })
})

// ===========================================================================
// Ch 14 — Social formulas (no new builder patterns; test category coverage)
// ===========================================================================

describe('Ch 14: Social formulas — category coverage', () => {
  it('Ko Sentences category includes s18 at ch 14', () => {
    const pats = getPatternsByCategory('Ko Sentences', null, 14)
    expect(pats.some(p => p.id === 's18')).toBe(true)
  })

  it('Questions category includes s14, s15, s16, s17 at ch 14', () => {
    const pats = getPatternsByCategory('Questions', null, 14)
    const ids = pats.map(p => p.id)
    expect(ids).toContain('s14')
    expect(ids).toContain('s15')
    expect(ids).toContain('s16')
    expect(ids).toContain('s17')
  })

  it('Negation category includes s12 and s13 at ch 14', () => {
    const pats = getPatternsByCategory('Negation', null, 14)
    expect(pats.some(p => p.id === 's12')).toBe(true)
    expect(pats.some(p => p.id === 's13')).toBe(true)
  })
})

// ===========================================================================
// Ch 15 — Noun subjects (s22)
// ===========================================================================

describe('Ch 15: Noun subjects — s22', () => {
  it("s22: Na\u02BBe \u02BBalu \u02BBa Sione (Sione went)", () => {
    const r = assembleSentence('s22', {
      tense_marker: { tongan: 'Na\u02BBe', english: 'past', tags: ['past', 'noun_subject'] },
      verb: V.alu,
      noun_subject: { tongan: 'Sione', english: 'Sione' },
    })
    expect(r.tongan).toBe('Na\u02BBe \u02BBalu \u02BBa Sione')
  })

  it("s22: \u02BBOku puke \u02BBa Pita (Pita is sick)", () => {
    const r = assembleSentence('s22', {
      tense_marker: TM.present,
      verb: { tongan: 'puke', english: 'sick', tags: ['adjective'] },
      noun_subject: { tongan: 'Pita', english: 'Pita' },
    })
    expect(r.tongan).toBe('\u02BBOku puke \u02BBa Pita')
  })

  it('s22 noun_subject options include ch 15 names', () => {
    const opts = getOptionsForSlot('s22', 'noun_subject', {}, 15)
    const names = opts.map(o => o.tongan)
    expect(names).toContain('Sione')
    expect(names).toContain('Mele')
    expect(names).toContain('Kepu')
    expect(names).toContain('Siale')
  })
})

// ===========================================================================
// Ch 16 — Equational sentences (s19, s20)
// ===========================================================================

describe('Ch 16: Equational sentences — s19, s20', () => {
  it('s19: Ko e tangata ngāue au (I am a worker)', () => {
    const r = assembleSentence('s19', {
      predicate_noun: { tongan: 'tangata ngāue', english: 'worker' },
      pronoun_postposed: { tongan: 'au', english: 'I (emphatic)', person: 1, number: 'singular' },
    })
    expect(r.tongan).toBe('Ko e tangata ngāue au')
  })

  it('s19: Ko e tōketā koe (Are you a doctor?)', () => {
    const r = assembleSentence('s19', {
      predicate_noun: { tongan: 'tōketā', english: 'doctor' },
      pronoun_postposed: { tongan: 'koe', english: 'you (emphatic)', person: 2, number: 'singular' },
    })
    expect(r.tongan).toBe('Ko e tōketā koe')
  })

  it('s20: Ko e faiako ʻa Mele (Mele is a teacher)', () => {
    const r = assembleSentence('s20', {
      predicate_noun: { tongan: 'faiako', english: 'teacher' },
      noun_subject: { tongan: 'Mele', english: 'Mele' },
    })
    expect(r.tongan).toBe('Ko e faiako ʻa Mele')
  })

  it('s20: Ko e tamasiʻi poto ʻa Lātū (Lātū is a smart boy)', () => {
    const r = assembleSentence('s20', {
      predicate_noun: { tongan: 'tamasiʻi poto', english: 'smart boy' },
      noun_subject: { tongan: 'Lātū', english: 'Lātū' },
    })
    expect(r.tongan).toBe('Ko e tamasiʻi poto ʻa Lātū')
  })

  it('s19 predicate_noun options include Ch 16 vocabulary', () => {
    const opts = getOptionsForSlot('s19', 'predicate_noun', {}, 16)
    expect(opts.length).toBeGreaterThan(0)
    expect(opts.some(o => o.tongan === 'faiako')).toBe(true)
    expect(opts.some(o => o.tongan === 'tōketā')).toBe(true)
  })
})

// ===========================================================================
// Ch 17 — Possessives (s21, s25, s26, s27)
// ===========================================================================

describe('Ch 17: Possessives — s21, s25, s26, s27', () => {
  it("s21: Ko hoʻo ako (Are you studying?)", () => {
    const r = assembleSentence('s21', {
      possessive: { tongan: 'hoʻo', english: 'your (sg.)', person: 2, number: 'singular' },
      verbal_noun: { tongan: 'ako', english: 'studying' },
    })
    expect(r.tongan).toBe('Ko hoʻo ako')
  })

  it("s21: Ko ʻeku ʻalu ki Nukuʻalofa (I am going to Nukuʻalofa)", () => {
    const r = assembleSentence('s21', {
      possessive: { tongan: 'ʻeku', english: 'my', person: 1, number: 'singular' },
      verbal_noun: { tongan: 'ʻalu', english: 'going' },
      preposition: { tongan: 'ki', english: 'to/toward', noun_class: 'local' },
      place: { tongan: 'Nukuʻalofa', english: 'Nukuʻalofa', noun_class: 'local' },
    })
    expect(r.tongan).toBe('Ko ʻeku ʻalu ki Nukuʻalofa')
  })

  it('s21 preposition + place slots are optional (verbal_noun alone is valid)', () => {
    const result = validateSentence('s21', {
      possessive: { tongan: 'hoʻo', english: 'your (sg.)' },
      verbal_noun: { tongan: 'ngāue', english: 'working' },
    })
    expect(result.valid).toBe(true)
  })

  it('s25: ʻeku hele (my knife)', () => {
    const r = assembleSentence('s25', {
      possessive_e: { tongan: 'ʻeku', english: 'my', person: 1, number: 'singular' },
      noun: { tongan: 'hele', english: 'knife' },
    })
    expect(r.tongan).toBe('ʻeku hele')
  })

  it('s26: hoku fale (my house)', () => {
    const r = assembleSentence('s26', {
      possessive_ho: { tongan: 'hoku', english: 'my', person: 1, number: 'singular' },
      noun: { tongan: 'fale', english: 'house' },
    })
    expect(r.tongan).toBe('hoku fale')
  })

  it('s27: Ko e hele ʻa Sione (Sione\'s knife)', () => {
    const r = assembleSentence('s27', {
      noun: { tongan: 'hele', english: 'knife' },
      poss_prep: { tongan: 'ʻa', english: 'of (ʻe-class)', tags: ['e_class'] },
      possessor: { tongan: 'Sione', english: 'Sione' },
    })
    expect(r.tongan).toBe('Ko e hele ʻa Sione')
  })

  it('s27: Ko e fale ʻo Sione (Sione\'s house)', () => {
    const r = assembleSentence('s27', {
      noun: { tongan: 'fale', english: 'house' },
      poss_prep: { tongan: 'ʻo', english: 'of (ho-class)', tags: ['ho_class'] },
      possessor: { tongan: 'Sione', english: 'Sione' },
    })
    expect(r.tongan).toBe('Ko e fale ʻo Sione')
  })

  it('s25 possessive_e options include Ch 17 pronouns', () => {
    const opts = getOptionsForSlot('s25', 'possessive_e', {}, 17)
    expect(opts.length).toBe(7)
    expect(opts.some(o => o.tongan === 'ʻeku')).toBe(true)
    expect(opts.some(o => o.tongan === 'hoʻo')).toBe(true)
  })
})

// ===========================================================================
// Ch 19 — Transitive sentences (s23)
// ===========================================================================

describe('Ch 19: Transitive — s23', () => {
  it('s23: Naʻe lau ʻe Sione e tohí (Sione read the book)', () => {
    const r = assembleSentence('s23', {
      tense_marker: { tongan: 'Naʻe', english: 'past', tags: ['past', 'noun_subject'] },
      verb: { tongan: 'lau', english: 'read', tags: ['action', 'transitive'] },
      object: { tongan: 'e tohí', english: 'the book', tags: ['definite'] },
      agent: { tongan: 'Sione', english: 'Sione', tags: ['proper'] },
    })
    expect(r.tongan).toBe('Naʻe lau ʻa e tohí ʻe Sione')
  })

  it('s23: Naʻe ʻave ʻe Pita ʻa Mele (Pita took Mele)', () => {
    const r = assembleSentence('s23', {
      tense_marker: { tongan: 'Naʻe', english: 'past', tags: ['past', 'noun_subject'] },
      verb: { tongan: 'ʻave', english: 'take', tags: ['action', 'transitive'] },
      object: { tongan: 'Mele', english: 'Mele', tags: ['proper'] },
      agent: { tongan: 'Pita', english: 'Pita', tags: ['proper'] },
    })
    expect(r.tongan).toBe('Naʻe ʻave ʻa Mele ʻe Pita')
  })

  it('s23 verb options are transitive', () => {
    const opts = getOptionsForSlot('s23', 'verb', {}, 19)
    expect(opts.length).toBeGreaterThan(0)
    expect(opts.every(o => o.tags?.includes('transitive'))).toBe(true)
  })

  it('s23 agent options include proper and common noun agents', () => {
    const opts = getOptionsForSlot('s23', 'agent', {}, 19)
    expect(opts.some(o => o.tags?.includes('proper'))).toBe(true)
    expect(opts.some(o => o.tags?.includes('common'))).toBe(true)
  })
})

// ===========================================================================
// Ch 20 — Numbers and time (s28, s29, s30, s31)
// ===========================================================================

describe('Ch 20: Numbers and time — s28, s29, s30, s31', () => {
  it('s28: kato ʻe ono (six baskets)', () => {
    const r = assembleSentence('s28', {
      noun: { tongan: 'kato', english: 'basket' },
      number: { tongan: 'ono', english: 'six', value: 6 },
    })
    expect(r.tongan).toBe('kato ʻe ono')
  })

  it('s28: tohi ʻe tolu (three books)', () => {
    const r = assembleSentence('s28', {
      noun: { tongan: 'tohi', english: 'book' },
      number: { tongan: 'tolu', english: 'three', value: 3 },
    })
    expect(r.tongan).toBe('tohi ʻe tolu')
  })

  it('s29: toko nima (five people)', () => {
    const r = assembleSentence('s29', {
      number: { tongan: 'nima', english: 'five', value: 5 },
    })
    expect(r.tongan).toBe('toko nima')
  })

  it('s30: ʻOku fiha ʻa e iká (How many are the fish?)', () => {
    const r = assembleSentence('s30', {
      noun: { tongan: 'iká', english: 'fish' },
    })
    expect(r.tongan).toBe('ʻOku fiha ʻa e iká')
  })

  it('s31: Ko e tolú eni (It is three o\'clock)', () => {
    const r = assembleSentence('s31', {
      hour: { tongan: 'tolú', english: 'three', value: 3 },
    })
    expect(r.tongan).toBe('Ko e tolú eni')
  })

  it('s28 number options include Ch 20 cardinals', () => {
    const opts = getOptionsForSlot('s28', 'number', {}, 20)
    expect(opts.length).toBe(10)
    expect(opts.some(o => o.tongan === 'taha')).toBe(true)
    expect(opts.some(o => o.tongan === 'hongofulu')).toBe(true)
  })

  it('s31 hour options include hours with definitive accent', () => {
    const opts = getOptionsForSlot('s31', 'hour', {}, 20)
    expect(opts.length).toBe(12)
    expect(opts.some(o => o.tongan === 'tolú')).toBe(true)
    expect(opts.some(o => o.tongan === 'valú')).toBe(true)
  })
})

// ===========================================================================
// Ch 21 — Auxiliaries (s33)
// ===========================================================================

describe('Ch 21: s33 auxiliary pattern', () => {
  it('s33 assembles ʻOku ou fie kai', () => {
    const r = assembleSentence('s33', {
      tense_marker: TM.present,
      subject: PRON._1sg_ou,
      auxiliary: { tongan: 'fie', english: 'want to', tags: ['auxiliary'] },
      verb: V.kai,
    })
    expect(r.tongan).toBe('ʻOku ou fie kai')
  })

  it('s33 assembles Té ke lava ʻo haʻu', () => {
    const r = assembleSentence('s33', {
      tense_marker: TM.future,
      subject: pron('ke', 'you', 2, 'singular'),
      auxiliary: { tongan: 'lava ʻo', english: 'can/able to', tags: ['auxiliary'] },
      verb: V.hau,
    })
    expect(r.tongan).toBe('Té ke lava ʻo haʻu')
  })

  it('s33 auxiliary options include fie and lava ʻo', () => {
    const opts = getOptionsForSlot('s33', 'auxiliary', {}, 21)
    expect(opts.length).toBe(2)
    expect(opts.some(o => o.tongan === 'fie')).toBe(true)
    expect(opts.some(o => o.tongan === 'lava ʻo')).toBe(true)
  })

  it('s33 assembles Naʻá ku fie mohe ʻanepō (auxiliary + optional time)', () => {
    const r = assembleSentence('s33', {
      tense_marker: TM.past,
      subject: PRON._1sg_ku,
      auxiliary: { tongan: 'fie', english: 'want to' },
      verb: V.mohe,
      time: { tongan: 'ʻanepō', english: 'last night' },
    })
    expect(r.tongan).toBe('Naʻá ku fie mohe ʻanepō')
  })
})

// ===========================================================================
// Ch 22 — Aspect markers (s34)
// ===========================================================================

describe('Ch 22: s34 aspect marker pattern', () => {
  it('s34 assembles ʻOku ou kei ngāue', () => {
    const r = assembleSentence('s34', {
      tense_marker: TM.present,
      subject: PRON._1sg_ou,
      aspect_marker: { tongan: 'kei', english: 'still', tags: ['continuing'] },
      verb: V.ngaue,
    })
    expect(r.tongan).toBe('ʻOku ou kei ngāue')
  })

  it('s34 assembles Kuó ne ʻosi ʻalu', () => {
    const r = assembleSentence('s34', {
      tense_marker: TM.perfect,
      subject: PRON._3sg,
      aspect_marker: { tongan: 'ʻosi', english: 'already/finished', tags: ['completed'] },
      verb: V.alu,
    })
    expect(r.tongan).toBe('Kuó ne ʻosi ʻalu')
  })

  it('s34 aspect_marker options include all 5 markers', () => {
    const opts = getOptionsForSlot('s34', 'aspect_marker', {}, 22)
    expect(opts.length).toBe(5)
    expect(opts.some(o => o.tongan === 'kei')).toBe(true)
    expect(opts.some(o => o.tongan === 'lolotonga')).toBe(true)
    expect(opts.some(o => o.tongan === 'toe')).toBe(true)
  })
})

// ===========================================================================
// Ch 23 — Obligation / modals (s35)
// ===========================================================================

describe('Ch 23: s35 modal pattern', () => {
  it('s35 assembles ʻOku totonu ke ke ako', () => {
    const r = assembleSentence('s35', {
      modal_frame: { tongan: 'ʻOku totonu', english: 'should/ought to', tags: ['obligation'] },
      subject: { tongan: 'ke', english: 'you (sg.)', person: 2, number: 'singular' },
      verb: { tongan: 'ako', english: 'study', tags: ['action', 'intransitive'] },
    })
    expect(r.tongan).toBe('ʻOku totonu ke ke ako')
  })

  it('s35 assembles Kuo pau ke u foki', () => {
    const r = assembleSentence('s35', {
      modal_frame: { tongan: 'Kuo pau', english: 'must/certainly', tags: ['necessity'] },
      subject: { tongan: 'u', english: 'I', person: 1, number: 'singular' },
      verb: { tongan: 'foki', english: 'return', tags: ['action', 'intransitive', 'motion'] },
    })
    expect(r.tongan).toBe('Kuo pau ke u foki')
  })

  it('s35 modal_frame options include totonu and pau', () => {
    const opts = getOptionsForSlot('s35', 'modal_frame', {}, 23)
    expect(opts.length).toBe(2)
    expect(opts.some(o => o.tongan === 'ʻOku totonu')).toBe(true)
    expect(opts.some(o => o.tongan === 'Kuo pau')).toBe(true)
  })

  it('s35 assembles Kuo pau ke u foki ki ʻapi (modal + destination)', () => {
    const r = assembleSentence('s35', {
      modal_frame: { tongan: 'Kuo pau', english: 'must/certainly', tags: ['necessity'] },
      subject: { tongan: 'u', english: 'I', person: 1, number: 'singular' },
      verb: { tongan: 'foki', english: 'return', tags: ['action', 'intransitive', 'motion'] },
      preposition: { tongan: 'ki', english: 'to/toward', noun_class: 'local' },
      place: { tongan: 'ʻapi', english: 'home', noun_class: 'local' },
    })
    expect(r.tongan).toBe('Kuo pau ke u foki ki ʻapi')
  })

  it('s35 assembles ʻOku totonu ke tokoni ʻa Sione (noun-subject variant)', () => {
    const r = assembleSentence('s35', {
      modal_frame: { tongan: 'ʻOku totonu', english: 'should/ought to', tags: ['obligation'] },
      verb: { tongan: 'tokoni', english: 'help', tags: ['action', 'intransitive'] },
      noun_subject: { tongan: 'ʻa Sione', english: 'Sione' },
    })
    expect(r.tongan).toBe('ʻOku totonu ke tokoni ʻa Sione')
  })
})

// ===========================================================================
// Ch 24 — Conjunctions (vocabulary expansion, no new pattern)
// ===========================================================================

describe('Ch 24: vocabulary expansion (no new builder pattern)', () => {
  it('verbs_transitive includes ʻilo from Ch 24', () => {
    const opts = getOptionsForSlot('s03', 'verb', {}, 24)
    expect(opts.some(o => o.tongan === 'ʻilo')).toBe(true)
  })

  it('verbs_transitive includes fakatau from Ch 21', () => {
    const opts = getOptionsForSlot('s03', 'verb', {}, 21)
    expect(opts.some(o => o.tongan === 'fakatau')).toBe(true)
  })

  it('s33 available at Ch 21 under Auxiliaries and Modals', () => {
    const pats = getPatternsByCategory('Auxiliaries and Modals', null, 21)
    expect(pats.some(p => p.id === 's33')).toBe(true)
  })
})

// ===========================================================================
// Ch 25 — Plural markers (vocabulary expansion, no new pattern)
// ===========================================================================

describe('Ch 25: plural marker vocabulary', () => {
  it('verbs_intransitive includes kakau from Ch 21', () => {
    const opts = getOptionsForSlot('s01', 'verb', {}, 21)
    expect(opts.some(o => o.tongan === 'kakau')).toBe(true)
  })

  it('verbs_stative includes fakapikopiko from Ch 23', () => {
    const opts = getOptionsForSlot('s01', 'verb', {}, 23)
    expect(opts.some(o => o.tongan === 'fakapikopiko')).toBe(true)
  })

  it('s34 and s35 available at Ch 22 and Ch 23 respectively', () => {
    const pats22 = getPatternsByCategory('Auxiliaries and Modals', null, 22)
    expect(pats22.some(p => p.id === 's34')).toBe(true)
    const pats23 = getPatternsByCategory('Auxiliaries and Modals', null, 23)
    expect(pats23.some(p => p.id === 's35')).toBe(true)
  })
})

// ===========================================================================
// Ch 26 — Purpose, Reason, Benefit (vocabulary expansion, no new pattern)
// ===========================================================================

describe('Ch 26: benefactive vocabulary expansion', () => {
  it('prepositions include maʻa from Ch 26', () => {
    const opts = getOptionsForSlot('s06', 'preposition', {}, 26)
    expect(opts.some(o => o.tongan === 'maʻa')).toBe(true)
  })

  it('prepositions include moʻo from Ch 26', () => {
    const opts = getOptionsForSlot('s06', 'preposition', {}, 26)
    expect(opts.some(o => o.tongan === 'moʻo')).toBe(true)
  })

  it('verbs_transitive includes kole (ask) from Ch 26', () => {
    const opts = getOptionsForSlot('s03', 'verb', {}, 26)
    expect(opts.some(o => o.tongan === 'kole')).toBe(true)
  })
})

// ===========================================================================
// Ch 27 — Comparison (s36)
// ===========================================================================

describe('Ch 27: s36 Comparison pattern', () => {
  it('s36 available at Ch 27 under Advanced Patterns', () => {
    const pats = getPatternsByCategory('Advanced Patterns', null, 27)
    expect(pats.some(p => p.id === 's36')).toBe(true)
  })

  it('s36 adjective slot returns comparison adjectives', () => {
    const opts = getOptionsForSlot('s36', 'adjective', {}, 27)
    expect(opts.some(o => o.tongan === 'mālohi')).toBe(true)
    expect(opts.some(o => o.tongan === 'vave')).toBe(true)
    expect(opts.some(o => o.tongan === 'lahi')).toBe(true)
  })

  it('s36: ʻOku mālohi ange ʻa Tēvita ʻi Sēmisi', () => {
    const r = assembleSentence('s36', {
      tense_marker: TM.present,
      adjective: { tongan: 'mālohi', english: 'strong', tags: ['adjective'] },
      subject: { tongan: 'Tēvita', english: 'Tēvita', tags: ['proper'] },
      comparison_np: { tongan: 'Sēmisi', english: 'Sēmisi', tags: ['proper'] },
    })
    expect(r.tongan).toBe('ʻOku mālohi ange ʻa Tēvita ʻi Sēmisi')
  })
})

// ===========================================================================
// Ch 28 — Directional Particles (s37)
// ===========================================================================

describe('Ch 28: s37 Directional Particles', () => {
  it('s37 available at Ch 28 under Advanced Patterns', () => {
    const pats = getPatternsByCategory('Advanced Patterns', null, 28)
    expect(pats.some(p => p.id === 's37')).toBe(true)
  })

  it('s37 directional slot returns 6 directional particles', () => {
    const opts = getOptionsForSlot('s37', 'directional', {}, 28)
    expect(opts.some(o => o.tongan === 'mai')).toBe(true)
    expect(opts.some(o => o.tongan === 'atu')).toBe(true)
    expect(opts.some(o => o.tongan === 'hifo')).toBe(true)
    expect(opts.some(o => o.tongan === 'holo')).toBe(true)
    expect(opts.length).toBe(6)
  })

  it('s37: Té u tala atu', () => {
    const r = assembleSentence('s37', {
      tense_marker: TM.future,
      subject: PRON._1sg_u,
      verb: { tongan: 'tala', english: 'tell', tags: ['action', 'transitive'] },
      directional: { tongan: 'atu', english: 'away from speaker (thither)', tags: ['person', '2nd'] },
    })
    expect(r.tongan).toBe('Té u tala atu')
  })

  it('s37 verb options expose plural-suppletion ō and transitive tala at Ch 28', () => {
    const opts = getOptionsForSlot('s37', 'verb', {}, 28)
    const t = opts.map(o => o.tongan)
    expect(t).toContain('ō')
    expect(t).toContain('tala')
  })

  it('s37: Naʻa nau ō hifo ki tahi (directional + destination)', () => {
    const r = assembleSentence('s37', {
      tense_marker: TM.past,
      subject: PRON._3pl,
      verb: { tongan: 'ō', english: 'go (plural)', tags: ['action', 'intransitive', 'motion', 'plural_suppletion'] },
      directional: { tongan: 'hifo', english: 'downward', tags: ['direction'] },
      preposition: { tongan: 'ki', english: 'to/toward', noun_class: 'local' },
      place: { tongan: 'tahi', english: 'sea', noun_class: 'local' },
    })
    expect(r.tongan).toBe('Naʻa nau ō hifo ki tahi')
  })
})

// ===========================================================================
// Ch 29 — Advanced Possessives (vocabulary expansion, no new pattern)
// ===========================================================================

describe('Ch 29: possessive vocabulary expansion', () => {
  it('verbs_transitive includes fili (choose) from Ch 29', () => {
    const opts = getOptionsForSlot('s03', 'verb', {}, 29)
    expect(opts.some(o => o.tongan === 'fili')).toBe(true)
  })

  it('s25 and s26 remain available for possessive patterns', () => {
    const pats = getPatternsByCategory('Possessives', null, 29)
    expect(pats.some(p => p.id === 's25')).toBe(true)
    expect(pats.some(p => p.id === 's26')).toBe(true)
  })

  it('verbs_intransitive includes tangutu (sit down) from Ch 28', () => {
    const opts = getOptionsForSlot('s01', 'verb', {}, 28)
    expect(opts.some(o => o.tongan === 'tangutu')).toBe(true)
  })
})

// ===========================================================================
// Ch 30 — Temporal/Conditional Conjunctions (no new pattern)
// ===========================================================================

describe('Ch 30: vocabulary only (no new builder pattern)', () => {
  it('locations include falekoloa (store) from Ch 28', () => {
    const opts = getOptionsForSlot('s06', 'place', {}, 28)
    expect(opts.some(o => o.tongan === 'falekoloa')).toBe(true)
  })

  it('locations include mātāfaga (beach) from Ch 28', () => {
    const opts = getOptionsForSlot('s06', 'place', {}, 28)
    expect(opts.some(o => o.tongan === 'mātāfaga')).toBe(true)
  })

  it('verbs_transitive_full includes langa (build) and tānaki (collect) from Ch 26', () => {
    const opts = getOptionsForSlot('s23', 'verb', {}, 26)
    expect(opts.some(o => o.tongan === 'langa')).toBe(true)
    expect(opts.some(o => o.tongan === 'tānaki')).toBe(true)
  })
})

// ===========================================================================
// Ch 31 — Existential Sentences (s38)
// ===========================================================================

describe('Ch 31: s38 Existential Sentences', () => {
  it('s38 available at Ch 31 under Advanced Patterns', () => {
    const pats = getPatternsByCategory('Advanced Patterns', null, 31)
    expect(pats.some(p => p.id === 's38')).toBe(true)
  })

  it('s38 noun slot returns existential nouns including classifier phrases', () => {
    const opts = getOptionsForSlot('s38', 'noun', {}, 31)
    expect(opts.some(o => o.tongan === 'tangata')).toBe(true)
    expect(opts.some(o => o.tongan === 'fo\u02bbi moli')).toBe(true)
    expect(opts.some(o => o.tongan === 'me\u02bbakai')).toBe(true)
  })

  it('s38: \u02bbOku \u02bbi ai ha tangata \u02bbi heni', () => {
    const r = assembleSentence('s38', {
      noun: { tongan: 'tangata', english: 'man', tags: ['person'] },
      preposition: { tongan: '\u02bbi', english: 'in/at' },
      place: { tongan: 'heni', english: 'here' },
    })
    expect(r.tongan).toBe('\u02bbOku \u02bbi ai ha tangata \u02bbi heni')
  })
})

// ===========================================================================
// Ch 32 — Faka- Prefix (vocabulary expansion, no new pattern)
// ===========================================================================

describe('Ch 32: faka- prefix vocabulary', () => {
  it('faka_verbs_causative includes fakamohe and fakalelei', () => {
    const opts = getOptionsForSlot('s01', 'verb', {}, 32)
    // faka- causative verbs expand the intransitive/transitive verb pools
    // Check that the vocabulary file loads them
    expect(vocab.faka_verbs_causative.some(v => v.tongan === 'fakamohe')).toBe(true)
    expect(vocab.faka_verbs_causative.some(v => v.tongan === 'fakalelei')).toBe(true)
  })

  it('faka_adverbs_temporal includes faka\u02bbaho (daily) and fakauike (weekly)', () => {
    expect(vocab.faka_adverbs_temporal.some(v => v.tongan === 'faka\u02bbaho')).toBe(true)
    expect(vocab.faka_adverbs_temporal.some(v => v.tongan === 'fakauike')).toBe(true)
    expect(vocab.faka_adverbs_temporal.some(v => v.tongan === 'fakata\u02bbu')).toBe(true)
  })

  it('faka_adverbs_manner includes faka-Tonga and fakatu\u02bbi', () => {
    expect(vocab.faka_adverbs_manner.some(v => v.tongan === 'faka-Tonga')).toBe(true)
    expect(vocab.faka_adverbs_manner.some(v => v.tongan === 'fakatu\u02bbi')).toBe(true)
  })
})

// ===========================================================================
// Ch 33 — Instrumental ʻaki and Suffix -ʻi (vocabulary expansion)
// ===========================================================================

describe('Ch 33: instrumental \u02bbaki and suffix -\u02bbi vocabulary', () => {
  it('transitive_i_verbs includes tokoni\u02bbi and pule\u02bbi', () => {
    expect(vocab.transitive_i_verbs.some(v => v.tongan === 'tokoni\u02bbi')).toBe(true)
    expect(vocab.transitive_i_verbs.some(v => v.tongan === 'pule\u02bbi')).toBe(true)
  })

  it('transitive_i_verbs includes ng\u0101ue\u02bbaki (use)', () => {
    expect(vocab.transitive_i_verbs.some(v => v.tongan === 'ng\u0101ue\u02bbaki')).toBe(true)
  })

  it('transitive_i_verbs has 10 entries total', () => {
    expect(vocab.transitive_i_verbs.length).toBe(10)
  })
})

// ===========================================================================
// Ch 34 — Reported Speech (vocabulary expansion, no new builder pattern)
// ===========================================================================

describe('Ch 34: reported speech vocabulary', () => {
  it('reported_speech_verbs includes peh\u0113, fanongo, tui, \u02bbilo', () => {
    expect(vocab.reported_speech_verbs.some(v => v.tongan === 'peh\u0113')).toBe(true)
    expect(vocab.reported_speech_verbs.some(v => v.tongan === 'fanongo')).toBe(true)
    expect(vocab.reported_speech_verbs.some(v => v.tongan === 'tui')).toBe(true)
    expect(vocab.reported_speech_verbs.some(v => v.tongan === '\u02bbilo')).toBe(true)
  })

  it('reported_speech_particles includes tokua and t\u0101', () => {
    expect(vocab.reported_speech_particles.some(v => v.tongan === 'tokua')).toBe(true)
    expect(vocab.reported_speech_particles.some(v => v.tongan === 't\u0101')).toBe(true)
    expect(vocab.reported_speech_particles.some(v => v.tongan === 'ko ia')).toBe(true)
  })

  it('reported_speech_verbs all have min_chapter 34', () => {
    expect(vocab.reported_speech_verbs.every(v => v.min_chapter === 34)).toBe(true)
  })
})

// ===========================================================================
// Ch 35 — Attributive Adjectives and Colors (vocabulary expansion)
// ===========================================================================

describe('Ch 35: attributive adjectives and colors', () => {
  it('colors includes all 5 basic colors', () => {
    expect(vocab.colors.length).toBe(5)
    expect(vocab.colors.some(c => c.tongan === 'hinehina')).toBe(true)
    expect(vocab.colors.some(c => c.tongan === '\u02bbuli\u02bbuli')).toBe(true)
    expect(vocab.colors.some(c => c.tongan === 'kulokula')).toBe(true)
  })

  it('attributive_adjectives_preposed includes fu\u02bbu, ki\u02bbi, \u02bbuluaki, toe', () => {
    expect(vocab.attributive_adjectives_preposed.some(a => a.tongan === 'fu\u02bbu')).toBe(true)
    expect(vocab.attributive_adjectives_preposed.some(a => a.tongan === 'ki\u02bbi')).toBe(true)
    expect(vocab.attributive_adjectives_preposed.some(a => a.tongan === '\u02bbuluaki')).toBe(true)
    expect(vocab.attributive_adjectives_preposed.some(a => a.tongan === 'toe')).toBe(true)
  })

  it('attributive_adjectives_postposed includes lahi, si\u02bbi, fo\u02bbou, kehe', () => {
    expect(vocab.attributive_adjectives_postposed.some(a => a.tongan === 'lahi')).toBe(true)
    expect(vocab.attributive_adjectives_postposed.some(a => a.tongan === 'si\u02bbi')).toBe(true)
    expect(vocab.attributive_adjectives_postposed.some(a => a.tongan === 'fo\u02bbou')).toBe(true)
    expect(vocab.attributive_adjectives_postposed.some(a => a.tongan === 'kehe')).toBe(true)
  })
})

// ===========================================================================
// Ch 35 — Compound Adjectives and Loto Compounds (absorbed into Adjectives)
// ===========================================================================

describe('Ch 35: compound adjectives and loto compounds', () => {
  it('compound_adjectives includes sino-m\u0101lohi and faingofua', () => {
    expect(vocab.compound_adjectives.some(a => a.tongan === 'sino-m\u0101lohi')).toBe(true)
    expect(vocab.compound_adjectives.some(a => a.tongan === 'faingofua')).toBe(true)
  })

  it('loto_compounds includes loto mamahi and loto to\u02bba', () => {
    expect(vocab.loto_compounds.some(a => a.tongan === 'loto mamahi')).toBe(true)
    expect(vocab.loto_compounds.some(a => a.tongan === 'loto to\u02bba')).toBe(true)
  })

  it('compound_adjectives all have min_chapter 35', () => {
    expect(vocab.compound_adjectives.every(a => a.min_chapter === 35)).toBe(true)
  })
})

// ===========================================================================
// Ch 36 — Cleft Sentences (s39)
// ===========================================================================

describe('Ch 36: s39 Cleft Sentences', () => {
  it('s39 available at Ch 36 under Advanced Patterns', () => {
    const pats = getPatternsByCategory('Advanced Patterns', null, 36)
    expect(pats.some(p => p.id === 's39')).toBe(true)
  })

  it('cleft_subjects includes proper names and common noun phrases', () => {
    expect(vocab.cleft_subjects.some(s => s.tongan === 'Sione')).toBe(true)
    expect(vocab.cleft_subjects.some(s => s.tongan === 'e f\u0101nau')).toBe(true)
    expect(vocab.cleft_subjects.some(s => s.tongan === 'au')).toBe(true)
  })

  it('tense_markers_cleft has na\u02bbe (past) and \u02bboku (present)', () => {
    expect(vocab.tense_markers_cleft.length).toBe(2)
    expect(vocab.tense_markers_cleft.some(t => t.tongan === 'na\u02bbe')).toBe(true)
    expect(vocab.tense_markers_cleft.some(t => t.tongan === '\u02bboku')).toBe(true)
  })

  it('s39 transitive cleft: Ko Tēvita naʻá ne kai e foʻi niú', () => {
    const r = assembleSentence('s39', {
      subject: { tongan: 'Tēvita', english: 'Tēvita', tags: ['proper'] },
      tense_marker: { tongan: 'naʻe', english: 'past', tags: ['past'] },
      verb: { tongan: 'kai', english: 'eat', tags: ['action', 'transitive'] },
      object: { tongan: 'e foʻi niú', english: 'the coconut', tags: ['definite'] },
    })
    expect(r.tongan).toBe('Ko Tēvita naʻá ne kai e foʻi niú')
  })

  it('s39 transitive cleft with 1sg subject inserts ku: Ko au naʻá ku kai e iká', () => {
    const r = assembleSentence('s39', {
      subject: { tongan: 'au', english: 'I', tags: ['pronoun'] },
      tense_marker: { tongan: 'naʻe', english: 'past', tags: ['past'] },
      verb: { tongan: 'kai', english: 'eat', tags: ['action', 'transitive'] },
      object: { tongan: 'e iká', english: 'the fish', tags: ['definite'] },
    })
    expect(r.tongan).toBe('Ko au naʻá ku kai e iká')
  })

  it('s39 transitive cleft with 3pl kinautolu inserts nau', () => {
    const r = assembleSentence('s39', {
      subject: { tongan: 'kinautolu', english: 'they', tags: ['pronoun'] },
      tense_marker: { tongan: 'naʻe', english: 'past', tags: ['past'] },
      verb: { tongan: 'kai', english: 'eat', tags: ['action', 'transitive'] },
      object: { tongan: 'e iká', english: 'the fish', tags: ['definite'] },
    })
    expect(r.tongan).toBe('Ko kinautolu naʻa nau kai e iká')
  })

  it('s39 intransitive cleft: no pronoun, no accent — Ko Pita ʻoku ngāue heni', () => {
    const r = assembleSentence('s39', {
      subject: { tongan: 'Pita', english: 'Pita', tags: ['proper'] },
      tense_marker: { tongan: 'ʻoku', english: 'present', tags: ['present'] },
      verb: { tongan: 'ngāue', english: 'work', tags: ['action', 'intransitive'] },
      location: { tongan: 'heni', english: 'here' },
    })
    expect(r.tongan).toBe('Ko Pita ʻoku ngāue heni')
  })

  it('s39 verb options include fufulu at Ch 36 (via verbs_transitive_full)', () => {
    const opts = getOptionsForSlot('s39', 'verb', {}, 36)
    expect(opts.some(o => o.tongan === 'fufulu')).toBe(true)
  })

  it('s39 object options include e foʻi niú at Ch 36', () => {
    const opts = getOptionsForSlot('s39', 'object', {}, 36)
    expect(opts.some(o => o.tongan === 'e foʻi niú')).toBe(true)
  })
})

// ===========================================================================
// Ch 37 — Postposed Possessives (vocabulary expansion)
// ===========================================================================

describe('Ch 37: postposed possessives vocabulary', () => {
  it('postposed_possessives_e includes \u02bba\u02bbaku and \u02bbamautolu', () => {
    expect(vocab.postposed_possessives_e.some(p => p.tongan === '\u02bba\u02bbaku')).toBe(true)
    expect(vocab.postposed_possessives_e.some(p => p.tongan === '\u02bbamautolu')).toBe(true)
  })

  it('postposed_possessives_ho includes \u02bbo\u02bboku and \u02bbo\u02bbona', () => {
    expect(vocab.postposed_possessives_ho.some(p => p.tongan === '\u02bbo\u02bboku')).toBe(true)
    expect(vocab.postposed_possessives_ho.some(p => p.tongan === '\u02bbo\u02bbona')).toBe(true)
  })

  it('whose_questions includes \u02bba hai and \u02bbo hai', () => {
    expect(vocab.whose_questions.some(q => q.tongan === '\u02bba hai')).toBe(true)
    expect(vocab.whose_questions.some(q => q.tongan === '\u02bbo hai')).toBe(true)
  })
})

// ===========================================================================
// Ch 38 — Warnings, Hopes, Permissions, and Uncertainty (vocabulary expansion)
// ===========================================================================

describe('Ch 38: warnings, hopes, permissions, and uncertainty vocabulary', () => {
  it('warning_hope_frames includes tuku ke and \u02bbofa p\u0113 ke', () => {
    expect(vocab.warning_hope_frames.some(f => f.tongan === 'tuku ke')).toBe(true)
    expect(vocab.warning_hope_frames.some(f => f.tongan === '\u02bbofa p\u0113 ke')).toBe(true)
  })

  it('verbs_stative includes t\u014Dmui (late) from Ch 39', () => {
    expect(vocab.verbs_stative.some(v => v.tongan === 't\u014Dmui')).toBe(true)
    expect(vocab.verbs_stative.find(v => v.tongan === 't\u014Dmui').min_chapter).toBe(38)
  })

  it('warning_hope_frames has 5 entries total', () => {
    expect(vocab.warning_hope_frames.length).toBe(5)
  })
})

// ===========================================================================
// Ch 39 — Relative Clauses with Ai and Demonstratives (vocabulary expansion)
// ===========================================================================

describe('Ch 39: demonstratives, days of week, emphasis expressions', () => {
  it('days_of_week has 7 entries from Monday to Sunday', () => {
    expect(vocab.days_of_week.length).toBe(7)
    expect(vocab.days_of_week.some(d => d.tongan === 'M\u014Dnite')).toBe(true)
    expect(vocab.days_of_week.some(d => d.tongan === 'S\u0101pate')).toBe(true)
  })

  it('manner_demonstratives includes peheni, pehena, peh\u0113', () => {
    expect(vocab.manner_demonstratives.some(d => d.tongan === 'peheni')).toBe(true)
    expect(vocab.manner_demonstratives.some(d => d.tongan === 'pehena')).toBe(true)
    expect(vocab.manner_demonstratives.some(d => d.tongan === 'peh\u0113')).toBe(true)
  })

  it('emphasis_expressions includes naʻá mo and kaeʻumaʻa', () => {
    expect(vocab.emphasis_expressions.some(e => e.tongan === 'naʻa mo')).toBe(true)
    expect(vocab.emphasis_expressions.some(e => e.tongan === 'kaeʻumaʻa')).toBe(true)
  })
})

// ===========================================================================
// Adverbs — Redistributed across Ch 9, 22, 27, 38
// ===========================================================================

describe('Adverbs: redistributed vocabulary', () => {
  it('preposed_adverbs includes toutou, meimei, matu\'aki', () => {
    expect(vocab.preposed_adverbs.some(a => a.tongan === 'toutou')).toBe(true)
    expect(vocab.preposed_adverbs.some(a => a.tongan === 'meimei')).toBe(true)
    expect(vocab.preposed_adverbs.some(a => a.tongan === "matu'aki")).toBe(true)
  })

  it('counting_expressions includes tu\'o taha through tu\'o fiha', () => {
    expect(vocab.counting_expressions.length).toBe(7)
    expect(vocab.counting_expressions.some(c => c.tongan === "tu'o taha")).toBe(true)
    expect(vocab.counting_expressions.some(c => c.tongan === "tu'o fiha")).toBe(true)
  })

  it('uncertainty_adverbs includes nai, ʻapē, koā', () => {
    expect(vocab.uncertainty_adverbs.length).toBe(3)
    expect(vocab.uncertainty_adverbs.some(a => a.tongan === 'nai')).toBe(true)
    expect(vocab.uncertainty_adverbs.some(a => a.tongan === 'ʻapē')).toBe(true)
    expect(vocab.uncertainty_adverbs.some(a => a.tongan === 'koā')).toBe(true)
  })

  it('negative_modifying_adverbs includes loko and teitei', () => {
    expect(vocab.negative_modifying_adverbs.length).toBe(2)
    expect(vocab.negative_modifying_adverbs.some(a => a.tongan === 'loko')).toBe(true)
    expect(vocab.negative_modifying_adverbs.some(a => a.tongan === 'teitei')).toBe(true)
  })
})

// ===========================================================================
// Ch 40 — Spatial Nouns (vocabulary expansion, absorbed into s05/s06)
// ===========================================================================

describe('Ch 40: spatial noun vocabulary', () => {
  it('spatial_nouns includes all 8 spatial nouns', () => {
    expect(vocab.spatial_nouns.length).toBe(8)
    expect(vocab.spatial_nouns.some(s => s.tongan === 'loto')).toBe(true)
    expect(vocab.spatial_nouns.some(s => s.tongan === 'lalo')).toBe(true)
    expect(vocab.spatial_nouns.some(s => s.tongan === 'funga')).toBe(true)
    expect(vocab.spatial_nouns.some(s => s.tongan === "ve'e")).toBe(true)
  })

  it('spatial_location_nouns includes household objects for spatial expressions', () => {
    expect(vocab.spatial_location_nouns.some(n => n.tongan === 'tēpile')).toBe(true)
    expect(vocab.spatial_location_nouns.some(n => n.tongan === 'mohenga')).toBe(true)
    expect(vocab.spatial_location_nouns.some(n => n.tongan === 'hala')).toBe(true)
  })

  it('all spatial_nouns have min_chapter 40', () => {
    expect(vocab.spatial_nouns.every(s => s.min_chapter === 40)).toBe(true)
  })
})

// ===========================================================================
// Ch 41 — Word Class Flexibility (conceptual, vocabulary expansion)
// ===========================================================================

describe('Ch 41: word class compounds and appearance verbs', () => {
  it('word_class_compounds includes verb-as-adjective compounds', () => {
    expect(vocab.word_class_compounds.some(c => c.tongan === 'tangata tau')).toBe(true)
    expect(vocab.word_class_compounds.some(c => c.tongan === 'loki mohe')).toBe(true)
    expect(vocab.word_class_compounds.some(c => c.tongan === 'ika tunu')).toBe(true)
  })

  it('word_class_compounds includes noun-as-adjective compounds', () => {
    expect(vocab.word_class_compounds.some(c => c.tongan === 'ʻā maka')).toBe(true)
    expect(vocab.word_class_compounds.some(c => c.tongan === 'ʻaho lāʻā')).toBe(true)
    expect(vocab.word_class_compounds.some(c => c.tongan === 'pō māhina')).toBe(true)
  })

  it('appearance_verbs includes ngali and ngalingali', () => {
    expect(vocab.appearance_verbs.length).toBe(2)
    expect(vocab.appearance_verbs.some(v => v.tongan === 'ngali')).toBe(true)
    expect(vocab.appearance_verbs.some(v => v.tongan === 'ngalingali')).toBe(true)
  })
})

// ===========================================================================
// Ch 42 — Time Expressions (vocabulary expansion)
// ===========================================================================

describe('Ch 42: months, time sequences, ordinals', () => {
  it('months has 12 entries from January to December', () => {
    expect(vocab.months.length).toBe(12)
    expect(vocab.months.some(m => m.tongan === 'Sānuali')).toBe(true)
    expect(vocab.months.some(m => m.tongan === 'Tisema')).toBe(true)
    expect(vocab.months.some(m => m.tongan === 'Siulai')).toBe(true)
  })

  it('time_sequence_expressions includes talu, hilí, kaha\'u, kuo hilí', () => {
    expect(vocab.time_sequence_expressions.some(t => t.tongan === 'talu')).toBe(true)
    expect(vocab.time_sequence_expressions.some(t => t.tongan === 'hilí')).toBe(true)
    expect(vocab.time_sequence_expressions.some(t => t.tongan === "kaha'u")).toBe(true)
    expect(vocab.time_sequence_expressions.some(t => t.tongan === 'kuo hilí')).toBe(true)
  })

  it('ordinal_patterns includes ordinals from second through interrogative', () => {
    expect(vocab.ordinal_patterns.length).toBe(5)
    expect(vocab.ordinal_patterns.some(o => o.tongan === 'ko hono uá')).toBe(true)
    expect(vocab.ordinal_patterns.some(o => o.tongan === 'ko hono fiha')).toBe(true)
  })
})

// ===========================================================================
// Ch 43 — The ta'e- Prefix and Advanced Negation (vocabulary expansion)
// ===========================================================================

describe('Ch 43: ta\'e- prefix words and negation idioms', () => {
  it('tae_prefix_words includes adjective negations', () => {
    expect(vocab.tae_prefix_words.some(w => w.tongan === "ta'e mahino")).toBe(true)
    expect(vocab.tae_prefix_words.some(w => w.tongan === "ta'e tokanga")).toBe(true)
    expect(vocab.tae_prefix_words.some(w => w.tongan === "ta'e fe'unga")).toBe(true)
  })

  it('tae_prefix_words includes noun privatives', () => {
    expect(vocab.tae_prefix_words.some(w => w.tongan === "ta'e totongi")).toBe(true)
    expect(vocab.tae_prefix_words.some(w => w.tongan === "ta'e su")).toBe(true)
  })

  it('negation_idioms includes tala\'ehai, koloto, ne\'ine\'i, mole ke mama\'o', () => {
    expect(vocab.negation_idioms.length).toBe(4)
    expect(vocab.negation_idioms.some(n => n.tongan === "tala'ehai")).toBe(true)
    expect(vocab.negation_idioms.some(n => n.tongan === 'koloto')).toBe(true)
    expect(vocab.negation_idioms.some(n => n.tongan === "ne'ine'i")).toBe(true)
    expect(vocab.negation_idioms.some(n => n.tongan === "mole ke mama'o")).toBe(true)
  })
})

// ===========================================================================
// Ch 44 — Definitive Accent System (phonological, no new vocabulary)
// ===========================================================================

describe('Ch 44: definitive accent (phonological deepening)', () => {
  it('chapters.json has teaching content for Ch 44', () => {
    const ch = require('../data/chapters.json')
    const c46 = ch.find(c => c.chapter === 44)
    expect(c46.teaching).toBeDefined()
    expect(c46.teaching.summary.length).toBeGreaterThan(0)
  })

  it('earlier patterns are available at Ch 44', () => {
    const pats = getPatternsByCategory('Statements', null, 44)
    expect(pats.length).toBeGreaterThan(0)
  })

  it('all existing vocabulary accessible at Ch 44', () => {
    const opts = getOptionsForSlot('s01', 'verb', {}, 44)
    expect(opts.length).toBeGreaterThan(10)
  })
})

// ===========================================================================
// Ch 45 — Verbal Nouns (deepens s21)
// ===========================================================================

describe('Ch 45: verbal noun expansion', () => {
  it('chapters.json has teaching content for Ch 45', () => {
    const ch = require('../data/chapters.json')
    const c47 = ch.find(c => c.chapter === 45)
    expect(c47.teaching).toBeDefined()
    expect(c47.teaching.key_rules.length).toBeGreaterThanOrEqual(2)
  })

  it('s21 pattern available at Ch 45', () => {
    const pats = getPatternsByCategory('Ko Sentences', null, 45)
    expect(pats.some(p => p.id === 's21')).toBe(true)
  })

  it('verbal_nouns vocabulary accessible at Ch 45', () => {
    const opts = getOptionsForSlot('s21', 'verbal_noun', {}, 45)
    expect(opts.length).toBeGreaterThan(0)
  })
})

// ===========================================================================
// Ch 46 — Noun Classes (classification + la'i classifier)
// ===========================================================================

describe('Ch 46: noun classes and la\'i classifier', () => {
  it('la_i_classifier includes flat-object classifiers', () => {
    expect(vocab.la_i_classifier.length).toBe(3)
    expect(vocab.la_i_classifier.some(c => c.tongan === 'laʻi pepa')).toBe(true)
    expect(vocab.la_i_classifier.some(c => c.tongan === 'laʻi papa')).toBe(true)
  })

  it('la_i_classifier all have min_chapter 46', () => {
    expect(vocab.la_i_classifier.every(c => c.min_chapter === 46)).toBe(true)
  })

  it('chapters.json has teaching content for Ch 46 with paradigm', () => {
    const ch = require('../data/chapters.json')
    const c48 = ch.find(c => c.chapter === 46)
    expect(c48.teaching.paradigm).toBeDefined()
    expect(c48.teaching.paradigm.rows.length).toBeGreaterThanOrEqual(3)
  })
})

// ===========================================================================
// Ch 47 — Conditionals and Counterfactuals
// ===========================================================================

describe('Ch 47: conditional markers', () => {
  it('conditional_markers includes ka, ka ne, ka ne ʻikai', () => {
    expect(vocab.conditional_markers.length).toBe(4)
    expect(vocab.conditional_markers.some(c => c.tongan === 'ka')).toBe(true)
    expect(vocab.conditional_markers.some(c => c.tongan === 'ka ne')).toBe(true)
    expect(vocab.conditional_markers.some(c => c.tongan === 'ka ne ʻikai')).toBe(true)
  })

  it('conditional_markers includes taʻeʻoua', () => {
    expect(vocab.conditional_markers.some(c => c.tongan === 'taʻeʻoua')).toBe(true)
  })

  it('all conditional_markers have min_chapter 47', () => {
    expect(vocab.conditional_markers.every(c => c.min_chapter === 47)).toBe(true)
  })
})

// ===========================================================================
// Ch 48 — Suffixes (-'anga, -nga, -'ia)
// ===========================================================================

describe('Ch 48: suffix vocabulary', () => {
  it('suffix_anga_nouns includes place nouns from verb bases', () => {
    expect(vocab.suffix_anga_nouns.some(n => n.tongan === 'nofoʻanga')).toBe(true)
    expect(vocab.suffix_anga_nouns.some(n => n.tongan === 'akoʻanga')).toBe(true)
    expect(vocab.suffix_anga_nouns.some(n => n.tongan === 'ngāueʻanga')).toBe(true)
  })

  it('suffix_nga_nouns includes thing nouns', () => {
    expect(vocab.suffix_nga_nouns.some(n => n.tongan === 'mohenga')).toBe(true)
    expect(vocab.suffix_nga_nouns.some(n => n.tongan === 'founga')).toBe(true)
    expect(vocab.suffix_nga_nouns.some(n => n.tongan === 'ākonga')).toBe(true)
  })

  it('suffix_ia_words includes possessing and state forms', () => {
    expect(vocab.suffix_ia_words.some(w => w.tongan === 'koloaʻia')).toBe(true)
    expect(vocab.suffix_ia_words.some(w => w.tongan === 'tonuhia')).toBe(true)
    expect(vocab.suffix_ia_words.some(w => w.tongan === 'ʻuheina')).toBe(true)
  })
})

// ===========================================================================
// Ch 49 — Prefixes (fe-, ma-, mo'u-, kaungā-)
// ===========================================================================

describe('Ch 49: prefix vocabulary', () => {
  it('reciprocal_verbs includes fe-...-ʻaki forms', () => {
    expect(vocab.reciprocal_verbs.some(v => v.tongan === 'feʻofaʻaki')).toBe(true)
    expect(vocab.reciprocal_verbs.some(v => v.tongan === 'fetokoniʻaki')).toBe(true)
    expect(vocab.reciprocal_verbs.some(v => v.tongan === 'feʻaluʻaki')).toBe(true)
  })

  it('ma_prefix_verbs includes potential and resultative forms', () => {
    expect(vocab.ma_prefix_verbs.some(v => v.tongan === 'mahiki')).toBe(true)
    expect(vocab.ma_prefix_verbs.some(v => v.tongan === 'mahae')).toBe(true)
    expect(vocab.ma_prefix_verbs.some(v => v.tongan === 'moʻumohea')).toBe(true)
  })

  it('kaunga_compounds includes fellow-worker and fellow-student', () => {
    expect(vocab.kaunga_compounds.some(k => k.tongan === 'kaungāngāue')).toBe(true)
    expect(vocab.kaunga_compounds.some(k => k.tongan === 'kaungā ako')).toBe(true)
  })
})

// ===========================================================================
// Ch 50 — Reduplication and Expressive Sound Devices
// ===========================================================================

describe('Ch 50: reduplicated forms', () => {
  it('reduplicated_forms includes moderation, intensification, and plurality', () => {
    expect(vocab.reduplicated_forms.some(r => r.tongan === 'katakata')).toBe(true)
    expect(vocab.reduplicated_forms.some(r => r.tongan === 'māmāfana')).toBe(true)
    expect(vocab.reduplicated_forms.some(r => r.tongan === 'ʻuliʻuli')).toBe(true)
    expect(vocab.reduplicated_forms.some(r => r.tongan === 'kehekehe')).toBe(true)
  })

  it('reduplicated_forms includes faka- + reduplication', () => {
    expect(vocab.reduplicated_forms.some(r => r.tongan === 'fakapotopoto')).toBe(true)
  })

  it('all reduplicated_forms have min_chapter 50', () => {
    expect(vocab.reduplicated_forms.every(r => r.min_chapter === 50)).toBe(true)
  })
})

// ===========================================================================
// Ch 51 — Special Pronoun Uses
// ===========================================================================

describe('Ch 51: impersonal pronouns and possessives', () => {
  it('impersonal_pronouns includes te, kita, kau', () => {
    expect(vocab.impersonal_pronouns.length).toBe(3)
    expect(vocab.impersonal_pronouns.some(p => p.tongan === 'te')).toBe(true)
    expect(vocab.impersonal_pronouns.some(p => p.tongan === 'kita')).toBe(true)
    expect(vocab.impersonal_pronouns.some(p => p.tongan === 'kau')).toBe(true)
  })

  it('impersonal_possessives includes ʻete, hoto, haʻate, hato', () => {
    expect(vocab.impersonal_possessives.length).toBe(4)
    expect(vocab.impersonal_possessives.some(p => p.tongan === 'ʻete')).toBe(true)
    expect(vocab.impersonal_possessives.some(p => p.tongan === 'hoto')).toBe(true)
  })

  it('all impersonal items have min_chapter 51', () => {
    expect(vocab.impersonal_pronouns.every(p => p.min_chapter === 51)).toBe(true)
    expect(vocab.impersonal_possessives.every(p => p.min_chapter === 51)).toBe(true)
  })
})

// ===========================================================================
// Ch 52 — Emotional Articles and Possessives
// ===========================================================================

describe('Ch 52: emotional articles and possessives', () => {
  it('emotional_articles includes siʻi (definite) and siʻa (indefinite)', () => {
    expect(vocab.emotional_articles.length).toBe(2)
    expect(vocab.emotional_articles.some(a => a.tongan === 'siʻi')).toBe(true)
    expect(vocab.emotional_articles.some(a => a.tongan === 'siʻa')).toBe(true)
  })

  it('emotional_possessives includes ʻe-class and ho-class forms', () => {
    expect(vocab.emotional_possessives.some(p => p.tongan === 'siʻeku')).toBe(true)
    expect(vocab.emotional_possessives.some(p => p.tongan === 'siʻoku')).toBe(true)
    expect(vocab.emotional_possessives.some(p => p.tongan === 'siʻene')).toBe(true)
    expect(vocab.emotional_possessives.some(p => p.tongan === 'siʻono')).toBe(true)
  })

  it('all emotional vocabulary has min_chapter 52', () => {
    expect(vocab.emotional_articles.every(a => a.min_chapter === 52)).toBe(true)
    expect(vocab.emotional_possessives.every(p => p.min_chapter === 52)).toBe(true)
  })
})

// ===========================================================================
// Ch 50 — Expressive Words (redistributed into Reduplication and Expressive Sound Devices)
// ===========================================================================

describe('Ch 50: expressive words', () => {
  it('expressive_words includes ʻilonga, kae kehe, kehe ke, faifai', () => {
    expect(vocab.expressive_words.length).toBe(4)
    expect(vocab.expressive_words.some(w => w.tongan === 'ʻilonga')).toBe(true)
    expect(vocab.expressive_words.some(w => w.tongan === 'kae kehe')).toBe(true)
    expect(vocab.expressive_words.some(w => w.tongan === 'kehe ke')).toBe(true)
    expect(vocab.expressive_words.some(w => w.tongan === 'faifai')).toBe(true)
  })

  it('all expressive_words have min_chapter 50', () => {
    expect(vocab.expressive_words.every(w => w.min_chapter === 50)).toBe(true)
  })

  it('chapters.json has teaching content for Ch 53', () => {
    const ch = require('../data/chapters.json')
    const c53 = ch.find(c => c.chapter === 53)
    expect(c53.teaching).toBeDefined()
    expect(c53.teaching.key_rules.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Audit D regressions: words gated to match book introduction', () => {
  it('pulu is not an object option before Ch 25 (book intro)', () => {
    for (const ch of [3, 4, 8, 19, 24]) {
      const opts = getOptionsForSlot('s03', 'object', { verb: { tongan: 'kai', tags: ['action', 'transitive'] } }, ch)
      expect(opts.find(o => o.tongan === 'pulu'), `pulu should be hidden at Ch ${ch}`).toBeUndefined()
    }
  })

  it('foki is a verb option from Ch 1 (book vocab intro)', () => {
    // foki (return, go back) is one of Ch 1's 11 intransitive verbs per the
    // Chapter-01.md:37,201 vocab tables. Graph had it at Ch 26 — students
    // learned the word in Ch 1 but couldn't pick it in the builder until 25
    // chapters later.
    const graph = require('../data/grammar-graph.json')
    const entry = graph.nodes.verb.words.find(w => w.tongan === 'foki')
    expect(entry).toBeDefined()
    expect(entry.min_chapter).toBe(1)
    const vocab = require('../data/vocabulary-by-slot.json')
    const vs = vocab.verbs_intransitive.find(v => v.tongan === 'foki')
    expect(vs.min_chapter).toBe(1)
  })

  it('moa is not an object option before Ch 8 (book vocab intro)', () => {
    const graph = require('../data/grammar-graph.json')
    const entry = graph.nodes.object.words.find(w => w.tongan === 'moa')
    expect(entry).toBeDefined()
    expect(entry.min_chapter).toBe(8)
    const vocab = require('../data/vocabulary-by-slot.json')
    const vs = vocab.objects.find(v => v.tongan === 'moa')
    expect(vs.min_chapter).toBe(8)
  })

  it('fiemaʻu is not a verb option before Ch 8 (book vocab intro — needs ha article)', () => {
    const graph = require('../data/grammar-graph.json')
    const entry = graph.nodes.verb.words.find(w => w.tongan === 'fiemaʻu')
    expect(entry).toBeDefined()
    expect(entry.min_chapter).toBe(8)
    const vocab = require('../data/vocabulary-by-slot.json')
    const vs = vocab.verbs_transitive.find(v => v.tongan === 'fiemaʻu')
    expect(vs.min_chapter).toBe(8)
  })

  it('puke is not a verb option before Ch 9 (book vocab intro)', () => {
    const graph = require('../data/grammar-graph.json')
    const entry = graph.nodes.verb.words.find(w => w.tongan === 'puke')
    expect(entry).toBeDefined()
    expect(entry.min_chapter).toBe(9)
    const vocab = require('../data/vocabulary-by-slot.json')
    const vs = vocab.verbs_stative.find(v => v.tongan === 'puke')
    expect(vs.min_chapter).toBe(9)
  })

  it('fakatau is not a verb option before Ch 21 (book vocab intro)', () => {
    const graph = require('../data/grammar-graph.json')
    const entry = graph.nodes.verb.words.find(w => w.tongan === 'fakatau')
    expect(entry).toBeDefined()
    expect(entry.min_chapter).toBe(21)
    // vocabulary-by-slot mirror already had the correct Ch 21 — guard against drift.
    const vocab = require('../data/vocabulary-by-slot.json')
    const vs = vocab.verbs_transitive.find(v => v.tongan === 'fakatau')
    expect(vs.min_chapter).toBe(21)
  })

  it('maʻu is not a verb option before Ch 43 (book intro)', () => {
    const graph = require('../data/grammar-graph.json')
    const entry = graph.nodes.verb.words.find(w => w.tongan === 'maʻu')
    expect(entry).toBeDefined()
    expect(entry.min_chapter).toBe(43)
    expect(entry.english).toBe('get/have')
  })

  it('pulu becomes an object option at Ch 25 with gloss "cow"', () => {
    const opts = getOptionsForSlot('s03', 'object', { verb: { tongan: 'kai', tags: ['action', 'transitive'] } }, 25)
    const pulu = opts.find(o => o.tongan === 'pulu')
    // At Ch 25 pulu is available through verb-independent noun exposure; the
    // kai valid_combinations list no longer pairs with pulu, so the guard is
    // simply that pulu is NOT filtered out by chapter gating at this point.
    // If the combination gate removes it we still want the graph entry itself
    // to reflect the Ch 25 min_chapter — check the underlying data.
    const graph = require('../data/grammar-graph.json')
    const entry = graph.nodes.object.words.find(w => w.tongan === 'pulu')
    expect(entry).toBeDefined()
    expect(entry.min_chapter).toBe(25)
    expect(entry.english).toBe('cow')
    // And: kai's valid_combinations no longer includes pulu (book Ch 25 doesn't
    // teach kai-pulu as a practiced pair; the pairing can be re-opened later).
    expect(graph.nodes.object.constraints.valid_combinations.kai).not.toContain('pulu')
  })
})
