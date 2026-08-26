// /grammar/ko-sentences: the Tongan ko pattern, across the whole course.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/components/ArticlePage.jsx renders it in the app, scripts/prerender.mjs
// renders the same blocks as static HTML so a crawler that runs no JS reads
// the whole page.
//
// NOT A COPY OF LESSON 12. /lessons/12 publishes the identification pattern,
// so this page has to earn its own URL rather than compete with it. It does
// that by following ko everywhere the course uses it: lesson 12 (ko e + noun,
// the demonstratives, the negative), lesson 13 (the four ko question words),
// lesson 16 (a name or a pronoun as subject, and subject-first emphasis),
// lesson 17 (ko in front of a possessive, for what someone is doing now),
// lesson 36 (fronting the subject of an ordinary verb sentence). No prose is
// copied across from any lesson.
//
// SOURCES. Every Tongan sentence below is verbatim from book/: Chapter-12.md,
// Chapter-13.md, Chapter-16.md, Chapter-17.md and Chapter-36.md.
//
// ORTHOGRAPHY. Tongan sits inside `*…*` spans with the ASCII apostrophe
// exactly as book/ stores it; both renderers run it through src/lib/okinafy.js,
// which turns an apostrophe-before-a-vowel into the real fakauʻa (U+02BB).
// Text outside a `*…*` span is English and is left alone, so Tongan in a
// heading, a chip, a link label or an English gloss carries the U+02BB itself.

export default {
  path: '/grammar/ko-sentences',
  eyebrow: 'Grammar',
  h1: 'The Tongan ko pattern: saying what something is',
  chips: ['ko e + noun', 'No verb', 'ko hai, ko e hā', 'Fronting'],
  blocks: [
    {
      k: 'p',
      text:
        '*Ko e hele \'eni* means "this is a knife". There is no verb in it and no tense marker ' +
        'either, which makes it a different animal from every sentence built on *\'oku* and ' +
        '*na\'e*. *Ko* does the work English gives to "is" when the job is naming something ' +
        'rather than reporting what it did.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e hele \'eni.', en: 'This is a knife.' },
        { ton: 'Ko e fala \'eni.', en: 'This is a mat.' },
        { ton: 'Ko e hele ē.', en: 'That is a knife.' },
      ],
    },
    {
      k: 'p',
      text:
        'The shape is *ko e*, then the noun, then a pointing word if you want one. That pattern ' +
        'answers "what is this?", "who are you?" and "where is it?", it has its own set of ' +
        'question words, and it can be turned round to put the emphasis somewhere else. This ' +
        'page takes those in order.',
    },

    { k: 'h2', text: 'The basic shape' },
    {
      k: 'p',
      text:
        'The *e* after *ko* is the definite article you already know from *e tohi* (the book). ' +
        'Together, *ko e* works as a unit meaning "it is a" or "this is a".',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e tohi \'eni.', en: 'This is a book.' },
        { ton: 'Ko e kato ē.', en: 'That is a basket.' },
        { ton: 'Ko e vaka.', en: 'It is a boat.' },
      ],
    },
    {
      k: 'p',
      text:
        'A *ko* sentence says what something is, so there is no action to place in time and no ' +
        'tense marker to place it with.',
    },

    { k: 'h2', text: 'Pointing at things: ʻeni, ʻena, ē' },
    {
      k: 'p',
      text:
        'Three pointing words attach to the end of a *ko* sentence, and they sort themselves by ' +
        'distance the way *heni*, *hena* and *hē* do for places.',
    },
    {
      k: 'table',
      headers: ['Word', 'Meaning', 'Distance'],
      rows: [
        ['*\'eni*', 'this', 'near me'],
        ['*\'ena*', 'that', 'near you'],
        ['*ē*', 'that', 'over there, or general pointing'],
      ],
    },
    {
      k: 'p',
      text:
        'On their own with *ko*, they make the short statements you say while actually pointing ' +
        'at something.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko\'eni.', en: 'Here it is. (Literally "it-is this-here")' },
        { ton: 'Ko ē!', en: 'There it is!' },
        { ton: 'Ko\'ena.', en: 'There it is (near you).' },
      ],
    },
    {
      k: 'p',
      text:
        'In everyday speech *ē* often covers all three jobs, especially in quick exchanges.',
    },

    { k: 'h2', text: 'Asking what something is' },
    {
      k: 'p',
      text:
        '*Ko e hā ē?* is "what is that?", and the answer comes back in the same pattern it was ' +
        'asked in. *Hā* is the word for "what".',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e hā ē?', en: 'What is that?' },
        { ton: 'Ko e ki\'i kato.', en: 'It is a small basket.' },
        { ton: 'Ko e hā \'eni?', en: 'What is this?' },
        { ton: 'Ko e kato.', en: 'It is a basket.' },
      ],
    },

    { k: 'h2', text: 'Saying who someone is' },
    {
      k: 'p',
      text:
        '*Ko e faiako \'a Lisiate* is "Lisiate is the teacher". The name goes at the end with ' +
        '*\'a* in front of it, the same focus marker that introduces a noun subject in an ' +
        'ordinary verb sentence.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e faiako \'a Lisiate.', en: 'Lisiate is the teacher.' },
        { ton: 'Ko e ta\'ahine mālohi \'a Seini.', en: 'Seini is a strong girl.' },
        { ton: 'Ko e tangata ngāue \'a Mafi?', en: 'Is Mafi a worker?' },
      ],
    },
    {
      k: 'p',
      text:
        'Swap the name for a pronoun and the *\'a* goes away. The pronoun follows the thing being ' +
        'said about it.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e tangata ngāue au.', en: 'I am a worker.' },
        { ton: 'Ko e tōketā koe?', en: 'Are you a doctor?' },
        { ton: 'Ko e ta\'ahine mālohi ia.', en: 'She is a strong girl.' },
      ],
    },
    {
      k: 'note',
      text:
        'The third-person pronoun here is *ia*, not the *ne* used in verb sentences. *\'Okú ne ' +
        'kai* is "he eats", with *ne* in front of the verb; *Ko e faiako ia* is "he is a ' +
        'teacher", with *ia* after the noun.',
    },
    {
      k: 'table',
      headers: ['With a name', 'With a pronoun'],
      rows: [
        ['*Ko e tangata ngāue \'a Mafi.* Mafi is a worker.', '*Ko e tangata ngāue au.* I am a worker.'],
        ['*Ko e ta\'ahine mālohi \'a Seini.* Seini is a strong girl.', '*Ko e ta\'ahine mālohi ia.* She is a strong girl.'],
      ],
    },

    { k: 'h2', text: 'Turning it round for emphasis' },
    {
      k: 'p',
      text:
        '*Ko Lisiate ko e faiako* is the same statement with the person put first, and it ' +
        'spotlights him: Lisiate, and nobody else. The pattern uses *ko* twice, once to ' +
        'introduce the subject and once to introduce what is said about him.',
    },
    {
      k: 'table',
      headers: ['Normal order', 'Subject first'],
      rows: [
        ['*Ko e faiako \'a Lisiate.*', '*Ko Lisiate ko e faiako.*'],
        ['*Ko e tangata mālohi \'a Peau.*', '*Ko Peau ko e tangata mālohi.*'],
      ],
    },
    {
      k: 'p',
      text:
        'Both English translations read "Lisiate is the teacher" and "Peau is a strong man", so ' +
        'the difference lives in the Tongan rather than in the translation. In speech it is ' +
        'carried by context and stress.',
    },

    { k: 'h2', text: 'Saying it is not' },
    {
      k: 'p',
      text:
        'A positive *ko* sentence has no tense marker, and negating it brings one in. *\'Oku ' +
        '\'ikai* goes in front of the *ko*, wrapping the whole identification.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Oku \'ikai ko e hele \'eni.', en: 'This is not a knife.' },
        { ton: '\'Oku \'ikai ko e faiako ia.', en: 'He or she is not a teacher.' },
        { ton: 'Na\'e \'ikai ko e faiako \'a Fehoko.', en: 'Fehoko was not a teacher.' },
      ],
    },

    { k: 'h2', text: 'The four questions built on ko' },
    {
      k: 'p',
      text:
        'Where a tense-marker question asks about an action, a *ko* question asks about an ' +
        'identity: who someone is, what a thing is, which one, and why.',
    },
    {
      k: 'table',
      headers: ['Question', 'Meaning', 'Example'],
      rows: [
        ['*Ko hai ...?*', 'Who?', '*Ko hai \'oku hiva?* Who is singing?'],
        ['*Ko e hā ...?*', 'What?', '*Ko e hā \'a e me\'a \'okú ke fiema\'u?* What do you want?'],
        ['*Ko fē ...?*', 'Where? Which?', '*Ko fē \'a e kato?* Where is the basket?'],
        ['*Ko e hā ... ai?*', 'Why?', '*Ko e hā na\'á ke \'alu ai ki Nuku\'alofa?* Why did you go to Nukuʻalofa?'],
      ],
    },
    {
      k: 'p',
      text:
        'The answer to a *ko hai* question comes back on *ko* as well: *Ko au* (me), *Ko e ' +
        'faiako* (the teacher), *Ko Sione* (Sione).',
    },
    {
      k: 'note',
      text:
        'Both *\'oku \'i fē* and *ko fē* translate as "where", and they differ in what the ' +
        'speaker assumes. *\'Oku \'i fē* is used when the thing may be far off; *ko fē* is used ' +
        'when you suppose it is somewhere within sight.',
    },

    { k: 'h2', text: 'ko in front of a verb sentence' },
    {
      k: 'p',
      text:
        '*Ko Tēvita na\'á ne kai e fo\'i niú* means "it was Tēvita who ate the coconut". The ' +
        'plain version, *Na\'e kai \'e Tēvita e fo\'i niú*, puts the weight on the eating. ' +
        'Moving the subject to the front with *ko* puts it on the person, and a pronoun stays ' +
        'behind after the tense marker to hold his place.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e kai \'e Tēvita e fo\'i niú.', en: 'Tēvita ate the coconut.' },
        { ton: 'Ko Tēvita na\'á ne kai e fo\'i niú.', en: 'It was Tēvita who ate the coconut.' },
        { ton: 'Ko Mele na\'á ne fufulu \'a e valá.', en: 'It was Mele who washed the clothes.' },
      ],
    },
    {
      k: 'p',
      text:
        'When the verb takes no object, no pronoun is needed and the tense marker connects ' +
        'straight to the verb.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko Pita \'oku ngāue heni.', en: 'It is Pita who works here.' },
        { ton: 'Ko e fānau na\'e hiva.', en: 'It was the children who sang.' },
      ],
    },

    { k: 'h2', text: 'ko for what someone is doing right now' },
    {
      k: 'p',
      text:
        '*Ko ho\'o ngāue?* asks "are you working?", and it is the polite thing to say to ' +
        'someone you find at work. The pattern is *ko* plus a possessive plus a verb used as a ' +
        'noun, so it says, near enough, "it is your working?"',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko ho\'o ngāue?', en: 'Are you working?' },
        { ton: 'Ko ho\'o lālanga?', en: 'Are you weaving?' },
        { ton: 'Ko \'eku \'alu ki Nuku\'alofa.', en: 'I am going to Nukuʻalofa. (Literally "it is my going to Nukuʻalofa.")' },
      ],
    },
    {
      k: 'p',
      text:
        'With *ko*, the action is happening at this moment. With *\'oku*, the same words ' +
        'usually read as something more general: *Ko e fai \'eku huo* is "I am hoeing, right ' +
        'now", and *\'Oku fai \'eku huo* is closer to "I hoe", as an activity in general.',
    },

    { k: 'h2', text: 'Hear it at the start of a sentence' },
    {
      k: 'p',
      text:
        'The useful habit is hearing *ko* at the front and knowing at once which kind of ' +
        'sentence has started, so you are not waiting for a tense marker that is not coming. ' +
        'The drills below train exactly that.',
    },
    {
      k: 'next',
      items: [
        { to: '/first-word', label: 'Drill: name the sentence type from its first word' },
        { to: '/drill/ko-question-picker', label: 'Drill: ko hai, ko e hā, ko fē' },
        { to: '/drill/equational-subject-picker', label: 'Drill: does a name need ʻa here?' },
        { to: '/cleft-builder', label: 'Drill: front the doer with Ko' },
        { to: '/lessons/12', label: 'Lesson 12: the ko pattern' },
        { to: '/lessons/13', label: 'Lesson 13: ko questions' },
        { to: '/lessons/16', label: 'Lesson 16: equational sentences' },
        { to: '/grammar/word-order', label: 'Tongan word order: the verb comes first' },
      ],
    },
  ],
}
