// /grammar/tense-markers: how Tongan marks tense, across the whole course.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/components/ArticlePage.jsx renders it in the app, scripts/prerender.mjs
// renders the same blocks as static HTML so a crawler that runs no JS reads
// the whole page.
//
// NOT A COPY OF LESSON 2. /lessons/2 publishes the same four markers, so this
// page has to earn its own URL rather than compete with it. It does that by
// covering only tense, and covering all of it: lesson 1 (the marker + pronoun +
// verb order), lesson 2 (the four markers), lesson 9 (negation switches the
// past and future markers), lesson 15 (a noun subject switches them the same
// way), lesson 22 (the aspect words that sit between marker and verb). Lesson 2
// spends most of its length on the 13 preposed pronouns, which this page names
// once and hands off. No prose is copied across from the lesson.
//
// SOURCES. Every Tongan sentence below is verbatim from book/: Chapter-02.md
// (the four-marker table, the kuo/naʻa contrast, the three forms of "I"),
// Chapter-01.md, Chapter-09.md (negation), Chapter-15.md (noun subjects),
// Chapter-22.md (aspect). Where book/ and src/data/chapters.json differ on an
// accent, book/ wins, since the accent convention is the book's.
//
// ORTHOGRAPHY. Tongan sits inside `*…*` spans with the ASCII apostrophe exactly
// as book/ stores it; both renderers run it through src/lib/okinafy.js, which
// turns an apostrophe-before-a-vowel into the real fakauʻa (U+02BB).

export default {
  path: '/grammar/tense-markers',
  eyebrow: 'Grammar',
  h1: 'Tongan tense markers: naʻa, ʻoku, kuo and te',
  chips: ['Four markers', 'The verb never changes', 'naʻe and ʻe', 'Negation'],
  blocks: [
    {
      k: 'p',
      text:
        'Tongan shows tense with one small word in front of the verb. The verb itself never ' +
        'changes: *kai* is "eat", "ate" and "eaten" all at once, and the word in front of it ' +
        'says which one you mean. There are four of these markers, and they all fill the same ' +
        'slot, so swapping one for another moves the sentence through time and leaves ' +
        'everything else standing.',
    },
    {
      k: 'table',
      headers: ['Marker', 'Tense', 'Example', 'Meaning'],
      rows: [
        ['*na\'a*', 'past', '*Na\'á ke kai.*', 'You ate.'],
        ['*\'oku*', 'present', '*\'Okú ke kai.*', 'You eat.'],
        ['*kuo*', 'perfect', '*Kuó ke kai.*', 'You have eaten.'],
        ['*te*', 'future', '*Té ke kai.*', 'You will eat.'],
      ],
    },
    {
      k: 'p',
      text:
        'That is the answer in full. The rest of this page is the four markers one at a time, ' +
        'the two of them that change shape, and what happens to the pattern in the negative.',
    },

    { k: 'h2', text: 'The verb does not move and does not change' },
    {
      k: 'p',
      text:
        'English carries tense inside the verb, which is why "eat" becomes "ate" and "eaten" and ' +
        'why irregular verbs have to be memorised one at a time. Tongan puts the tense in a ' +
        'separate word and leaves the verb alone. A Tongan sentence opens with the marker, then ' +
        'the pronoun, then the verb, in that order.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'á ku kai.', en: 'I ate.' },
        { ton: '\'Oku ou kai.', en: 'I eat.' },
      ],
    },
    {
      k: 'p',
      text:
        'Nothing about *kai* tells you the tense, and nothing ever will: no ending is added to it ' +
        'and no vowel inside it shifts. That is why there is no conjugation table on this page. ' +
        'Learn the four markers and every verb in the language is already conjugated.',
    },

    { k: 'h2', text: 'naʻa, the past' },
    {
      k: 'p',
      text:
        '*Na\'a* puts an event behind you and says nothing at all about how things stand now. It ' +
        'is the marker a story runs on.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'á ke mohe.', en: 'You slept. (A past event, with no comment on the present.)' },
      ],
    },

    { k: 'h2', text: 'ʻoku, the present' },
    {
      k: 'p',
      text:
        'With an action verb, *\'oku* usually reads as a habit rather than as this exact ' +
        'moment: *\'Oku ou kai.* is "I eat", something you do regularly. Tongan has a separate ' +
        'way to say an action is in progress right now. With a descriptive word, *\'oku* ' +
        'describes a state that holds at the moment of speaking.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Okú ke mohe.', en: 'You sleep. (A general statement about what you do.)' },
      ],
    },

    { k: 'h2', text: 'kuo, the perfect, and the one thing to get right' },
    {
      k: 'p',
      text:
        'This is the one place in the system worth slowing down for. Both markers describe ' +
        'something that has already happened, so the choice is not about when. It is about what ' +
        'the speaker is pointing at. *Na\'a* points at the event. *Kuo* points at the state the ' +
        'event left behind, which makes it the answer to a different question: what is different ' +
        'now?',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'á ku ha\'u.', en: 'I came. (A past event.)' },
        { ton: 'Kuó u ha\'u.', en: 'I have arrived. (I was not here before. Now I am here.)' },
      ],
    },
    {
      k: 'p',
      text:
        'The same contrast holds with any verb. Sleeping is the clearest case, because the ' +
        'change of state is easy to picture.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'a nau mohe.', en: 'They slept. (Reports a past event.)' },
        { ton: 'Kuo nau mohe.', en: 'They have fallen asleep. (They were awake before. Now they are asleep.)' },
      ],
    },

    { k: 'h2', text: 'te, the future' },
    {
      k: 'p',
      text:
        '*Te* marks what has not happened yet, and behaves like the other three: it takes the ' +
        'front slot and the verb stays put.',
    },
    {
      k: 'ex',
      items: [{ ton: 'Té ke \'alu.', en: 'You will go.' }],
    },

    { k: 'h2', text: 'When the marker changes shape: naʻe and ʻe' },
    {
      k: 'p',
      text:
        'The four forms above are the ones used when a pronoun follows the marker. Two of them ' +
        'take a second shape when no pronoun follows: past *na\'a* becomes *na\'e*, and future ' +
        '*te* becomes *\'e*. It is one rule, and it turns up in two ordinary places.',
    },
    {
      k: 'p',
      text:
        'The first is a subject that is a name rather than a pronoun. The name moves after the ' +
        'verb and takes *\'a*, and the marker switches shape.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e hiva \'a Sione.', en: 'Sione sang.' },
        { ton: '\'E hiva \'a Tēvita.', en: 'Tēvita will sing.' },
      ],
    },
    {
      k: 'p',
      text:
        'A weather verb has no subject at all, and takes the same shape for the same reason: ' +
        'nothing follows the marker.',
    },
    {
      k: 'ex',
      items: [{ ton: 'Na\'e \'uha.', en: 'It rained.' }],
    },

    { k: 'h2', text: 'Saying it did not happen' },
    {
      k: 'p',
      text:
        'The second consequence is the negative. To negate a sentence, *\'ikai te* goes between ' +
        'the tense marker and the pronoun, and the past and future markers move to their ' +
        '*na\'e* and *\'e* forms.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Oku \'ikai té u fiefia.', en: 'I am not happy.' },
        { ton: 'Na\'e \'ikai té u kai.', en: 'I did not eat.' },
      ],
    },
    {
      k: 'p',
      text:
        'When there is no pronoun to negate, the connector is *ke* instead of *te*, which is ' +
        'the same rule seen from the other side: *te* before a pronoun, *ke* before a bare verb.',
    },
    {
      k: 'ex',
      items: [{ ton: '\'Oku \'ikai ke \'uha.', en: 'It is not raining.' }],
    },

    { k: 'h2', text: 'Still, already, not yet' },
    {
      k: 'p',
      text:
        'Tense says when. A second small word, sitting between the marker and the verb, says ' +
        'what stage the action has reached: *kei* for still, *\'osi* for already, *te\'eki ai* ' +
        'for not yet, *toe* for again. The tense marker keeps its own job while this happens.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Okú ne kei mohe pē.', en: 'He is still sleeping.' },
        { ton: 'Kuó ne \'osi \'alu.', en: 'He has already gone.' },
      ],
    },

    { k: 'h2', text: 'The one pronoun that changes with the marker' },
    {
      k: 'p',
      text:
        'Pronouns sit between the marker and the verb and keep their form throughout, with a ' +
        'single exception. The word for "I" takes three shapes depending on which marker comes ' +
        'before it.',
    },
    {
      k: 'table',
      headers: ['Marker', '"I"', 'Example', 'Meaning'],
      rows: [
        ['*na\'a*', '*ku*', '*Na\'á ku kai.*', 'I ate.'],
        ['*\'oku*', '*ou*', '*\'Oku ou kai.*', 'I eat.'],
        ['*kuo*', '*u*', '*Kuó u kai.*', 'I have eaten.'],
        ['*te*', '*u*', '*Té u kai.*', 'I will eat.'],
      ],
    },
    {
      k: 'p',
      text:
        'No other pronoun does this. The full set, including the dual forms and the two ' +
        'different words for "we", is lesson 2.',
    },

    { k: 'h2', text: 'Practise the swap' },
    {
      k: 'p',
      text:
        'Reading the four markers takes a minute. Reaching for the right one without stopping to ' +
        'think takes practice, so the drill below runs the swap until it is automatic, and the ' +
        'lessons behind it teach each piece in order.',
    },
    {
      k: 'next',
      items: [
        { to: '/tense-swap', label: 'Swap the marker and watch the tense change' },
        { to: '/lessons/1', label: 'Lesson 1: the basic sentence' },
        { to: '/lessons/2', label: 'Lesson 2: the four markers and every pronoun' },
        { to: '/lessons/9', label: 'Lesson 9: the negative' },
        { to: '/lessons/15', label: 'Lesson 15: noun subjects' },
        { to: '/lessons/22', label: 'Lesson 22: still, already, not yet' },
        { to: '/charts', label: 'The grammar charts' },
      ],
    },
  ],
}
