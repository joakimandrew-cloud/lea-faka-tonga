// /grammar/word-order: how a Tongan sentence is ordered, across the whole
// course.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/components/ArticlePage.jsx renders it in the app, scripts/prerender.mjs
// renders the same blocks as static HTML so a crawler that runs no JS reads
// the whole page.
//
// NOT A COPY OF ANY ONE LESSON. Word order is spread across the course, which
// is what gives this page its own URL: lesson 1 (marker, pronoun, verb),
// lesson 15 (a noun subject moves after the verb and takes 'a, and the marker
// changes shape), lesson 19 (an object arrives, the doer takes 'e, and either
// noun may come first), lesson 12 (a sentence with no verb at all), lesson 36
// (fronting for emphasis). No prose is copied across from any lesson.
//
// SOURCES. Every Tongan sentence below is verbatim from book/: Chapter-15.md
// (noun subjects, the na'a/na'e rule, the dropped ne, question words, weather
// verbs), Chapter-19.md (transitive order, 'e and 'a, the general-versus-
// specific object, leaving the doer out, flexible order), Chapter-01.md and
// Chapter-02.md (the pronoun sentence), Chapter-12.md (the ko sentence).
// Churchward's two-axis classification of verbs is cited by Chapter-19.md
// itself and is named here only as the course names it.
//
// ORTHOGRAPHY. Tongan sits inside `*…*` spans with the ASCII apostrophe
// exactly as book/ stores it; both renderers run it through src/lib/okinafy.js,
// which turns an apostrophe-before-a-vowel into the real fakauʻa (U+02BB).
// Text outside a `*…*` span is English and is left alone, so Tongan in a
// heading, a chip, a link label or an English gloss carries the U+02BB itself.

export default {
  path: '/grammar/word-order',
  eyebrow: 'Grammar',
  h1: 'Tongan word order: the verb comes first',
  chips: ['Verb first', 'ʻa and ʻe', 'Pronouns move', 'Flexible order'],
  blocks: [
    {
      k: 'p',
      text:
        '*Na\'e \'alu \'a Sione* is "Sione went", and read straight through it runs "past, go, ' +
        'Sione". That is the pattern this page is about: tense marker, then verb, then the ' +
        'person doing the action. English puts the subject first and the verb second, and in ' +
        'this pattern Tongan puts the verb before the noun that does it. Two other shapes sit ' +
        'alongside it, and both turn up further down: a pronoun subject moves in front of the ' +
        'verb, and a *ko* sentence has no verb at all.'
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e \'alu \'a Sione.', en: 'Sione went.' },
        { ton: 'Na\'e kai \'e Sione \'a e mā.', en: 'Sione ate the bread.' },
      ],
    },
    {
      k: 'p',
      text:
        'The second sentence adds an object, and two markers appear: *\'e* in front of the doer ' +
        'and *\'a* in front of the thing the action lands on. Those two markers, plus the rule ' +
        'that pronouns behave differently from names, carry most of the work in the patterns ' +
        'below. The rest of this page is each piece in turn.',
    },

    { k: 'h2', text: 'A pronoun sits in front of the verb' },
    {
      k: 'p',
      text:
        'When the subject is a pronoun rather than a name, it does not follow the verb. It goes ' +
        'between the tense marker and the verb, so the sentence reads marker, pronoun, verb.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'á ne \'alu.', en: 'He went.' },
        { ton: 'Na\'e \'alu \'a Sione.', en: 'Sione went.' },
      ],
    },
    {
      k: 'p',
      text:
        'Those two sentences say the same kind of thing about different subjects, and the ' +
        'subject has moved from one side of the verb to the other. That is the first thing to ' +
        'get comfortable with, because everything else on this page follows from it.',
    },

    { k: 'h2', text: 'A name goes after the verb, and takes ʻa' },
    {
      k: 'p',
      text:
        'Three things change together when the subject is a name instead of a pronoun. The name ' +
        'moves after the verb, the marker *\'a* appears in front of it, and the tense marker ' +
        'changes shape.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e lele \'a Mele.', en: 'Mele ran.' },
        { ton: 'Kuo ha\'u \'a Seini.', en: 'Seini has arrived.' },
        { ton: '\'Oku nofo \'a Sēmisi \'i kolo.', en: 'Sēmisi lives in town.' },
      ],
    },
    {
      k: 'p',
      text:
        '*\'A* is a focus marker, which means it marks the noun closest in thought to the ' +
        'action of the verb. In a sentence with no object, the subject is the only noun ' +
        'connected to the verb, so *\'a* marks the subject. Later on this page an object turns ' +
        'up and *\'a* shifts to it.',
    },
    {
      k: 'table',
      headers: ['Pronoun subject', 'Noun subject'],
      rows: [
        ['*Na\'á ne \'alu.* He went.', '*Na\'e \'alu \'a Sione.* Sione went.'],
        ['*\'Okú ne mohe.* He sleeps.', '*\'Oku mohe \'a Pita.* Pita sleeps.'],
        ['*Té ne hiva.* He will sing.', '*\'E hiva \'a Tēvita.* Tēvita will sing.'],
      ],
    },

    { k: 'h2', text: 'Why the past marker changes from naʻa to naʻe' },
    {
      k: 'p',
      text:
        'Look down the table above and the past marker is *na\'á* on the left and *na\'e* on ' +
        'the right, and the future marker is *té* on the left and *\'e* on the right. One rule ' +
        'covers both pairs: *na\'a* and *te* are the forms used immediately before a pronoun, ' +
        'and *na\'e* and *\'e* are used everywhere else.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'á ku \'alu.', en: 'I went.' },
        { ton: 'Na\'e \'alu \'a Sione.', en: 'Sione went.' },
        { ton: 'Té ke lea.', en: 'You will speak.' },
        { ton: '\'E lea \'a Mele.', en: 'Mele will speak.' },
      ],
    },
    {
      k: 'p',
      text:
        'The present marker *\'oku* and the perfect marker *kuo* have no second form the way ' +
        '*na\'a* and *te* do, so there is no marker to swap: *\'Oku \'alu \'a Sione* and ' +
        '*Kuo hiva \'a Tēvita* keep the same marker their pronoun versions use.',
    },

    { k: 'h2', text: 'The word for "he" disappears when a name is present' },
    {
      k: 'p',
      text:
        'You do not say the pronoun and the name together. Once a noun subject is in the ' +
        'sentence, the third-person singular pronoun *ne* drops out and the noun takes over its ' +
        'job entirely.',
    },
    {
      k: 'table',
      headers: ['With pronoun', 'With noun subject'],
      rows: [
        ['*\'Okú ne \'alu.* He is going.', '*\'Oku \'alu \'a Sione.* Sione is going.'],
        ['*Na\'á ne mohe.* He slept.', '*Na\'e mohe \'a Pita.* Pita slept.'],
        ['*Kuó ne hiva.* He has sung.', '*Kuo hiva \'a Tēvita.* Tēvita has sung.'],
      ],
    },
    {
      k: 'note',
      text:
        'This applies to the third person only. "I went" is *na\'á ku \'alu* and stays that ' +
        'way; first-person and second-person pronouns are not replaced by a noun-subject ' +
        'construction.',
    },

    { k: 'h2', text: 'When the action lands on something' },
    {
      k: 'p',
      text:
        'Compare *Na\'e lea \'a Sione* (Sione spoke) with *Na\'e lau \'e Sione \'a e tohí* ' +
        '(Sione read the book). Nothing is being spoken at in the first sentence, so the verb ' +
        'has no object and the subject takes *\'a*. The second has an object, the book, and the ' +
        'subject switches to *\'e*.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e lea \'a Sione.', en: 'Sione spoke. (No object.)' },
        { ton: 'Na\'e lau \'e Sione \'a e tohí.', en: 'Sione read the book. (The book is the object.)' },
      ],
    },
    {
      k: 'p',
      text:
        'A verb with no object is called intransitive and a verb with an object is called ' +
        'transitive, and the labels are worth knowing only because the marker on the subject ' +
        'depends on which kind you have. The choice is fixed: the subject of a verb with an ' +
        'object takes *\'e*, never *\'a*. *Na\'e \'alu \'e Sione* is wrong, because *\'alu* ' +
        '(go) takes no object, and the sentence is *Na\'e \'alu \'a Sione*. One qualifier, ' +
        'taken up in Lesson 19: when the object is general and carries no article, it fuses ' +
        'with the verb into a single unit, and the subject goes back to *\'a*.',
    },
    {
      k: 'table',
      headers: ['Kind of verb', 'Marker on the subject', 'Example'],
      rows: [
        ['No object', '*\'a*', '*Na\'e lea \'a Sione.*'],
        ['Has an object', '*\'e*', '*Na\'e lau \'e Sione \'a e tohí.*'],
      ],
    },
    {
      k: 'p',
      text:
        'Because *\'e* marks the doer, grammar books call it the agent marker. In front of a ' +
        'name it stands alone, and in front of an ordinary noun it picks up the article *he*, ' +
        'the same way the prepositions *ki he*, *\'i he* and *mei he* do.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e \'ave \'e Pita \'a Mele.', en: 'Pita took Mele.' },
        { ton: 'Na\'e tohi \'e he tamasi\'í \'a e tohí.', en: 'The boy wrote the book.' },
      ],
    },
    {
      k: 'note',
      text:
        'The agent marker *\'e* is a separate word from the future tense marker *\'e* and from ' +
        'the *\'e* placed in front of a name you are speaking to. All three are spelled alike ' +
        'and sit in different places in the sentence.',
    },

    { k: 'h2', text: 'The whole pattern in one line' },
    {
      k: 'p',
      text:
        'With both a doer and a thing done to, the tense marker and verb come first, and the ' +
        'two nouns follow: the doer marked *\'e*, the thing done to marked *\'a*. Either noun ' +
        'may come first, and the examples on this page put the doer first.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e kai \'e Sione \'a e mā.', en: 'Sione ate the bread.' },
        { ton: 'Na\'á ku lau \'a e tohí.', en: 'I read the book.' },
        { ton: 'Té ke \'ave \'a Mele?', en: 'Are you taking Mele?' },
      ],
    },
    {
      k: 'p',
      text:
        'The last two show the pronoun rule holding: a pronoun subject is still in front of the ' +
        'verb, and the object follows the verb as usual.',
    },

    { k: 'h2', text: 'Either noun can come first' },
    {
      k: 'p',
      text:
        'When the doer and the thing done to are both nouns, either may be placed first after ' +
        'the verb, and the sentence means the same thing.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e tāmate\'i \'e Tēvita \'a Kōlaiate.', en: 'Tēvita killed Kōlaiate.' },
        { ton: 'Na\'e tāmate\'i \'a Kōlaiate \'e Tēvita.', en: 'Kōlaiate was killed by Tēvita.' },
      ],
    },
    {
      k: 'p',
      text:
        'The markers carry the roles, so the order is free to carry the emphasis instead. ' +
        '*\'E Tēvita* means "by Tēvita" wherever it sits, and *\'a Kōlaiate* means "Kōlaiate, ' +
        'the one it happened to" wherever it sits. The difference between the two sentences is ' +
        'the same kind of difference English gets from turning an active sentence around into a ' +
        'passive one.',
    },

    { k: 'h2', text: 'Leaving the doer out' },
    {
      k: 'p',
      text:
        'Drop the *\'e* phrase from a sentence like that and what remains is the Tongan ' +
        'equivalent of an English passive. The verb itself is not altered, because Tongan has ' +
        'no separate passive verb form; the sentence is the same transitive sentence with ' +
        'nobody named as the doer.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e langa \'e Sione \'a e falé.', en: 'Sione built the house.' },
        { ton: 'Na\'e langa \'a e falé.', en: 'The house was built.' },
        { ton: 'Kuo kai \'e he kulī \'a e moá.', en: 'The dog has eaten the chicken.' },
        { ton: 'Kuo kai \'a e moá.', en: 'The chicken has been eaten.' },
      ],
    },

    { k: 'h2', text: 'Where a question word goes' },
    {
      k: 'p',
      text:
        'Compare *\'Oku nofo \'a \'Ana \'i \'api* (\'Ana lives at home) with *\'Oku nofo \'i fē ' +
        '\'a \'Ana?* (Where does \'Ana live?). The question word has taken the slot the answer ' +
        'would occupy, between the verb and the noun subject, which pushes the subject to the ' +
        'end.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Oku lele ki fē \'a Mele?', en: 'Where is Mele running to?' },
        { ton: 'Na\'e \'alu ki fē \'a Tēvita?', en: 'Where did Tēvita go?' },
      ],
    },
    {
      k: 'p',
      text:
        'Tongan adds no helper verb to ask a question, and does not swap the subject and verb ' +
        'the way English does with "does" and "did". The question word stands where the answer ' +
        'would have stood.',
    },

    { k: 'h2', text: 'Sentences with no subject, and sentences with no verb' },
    {
      k: 'p',
      text:
        'Weather sentences have no subject at all. *Na\'e \'uha* is "it rained" and *\'Oku ' +
        'lā\'ā* is "it is sunny", each one a tense marker and a verb and nothing else. English ' +
        'needs the word "it" in that slot and Tongan does not.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e \'uha.', en: 'It rained.' },
        { ton: '\'Oku lā\'ā.', en: 'It is sunny.' },
      ],
    },
    {
      k: 'p',
      text:
        'There is also a whole sentence type with no verb and no tense marker, built on *ko*, ' +
        'used for saying what something is: *Ko e fala \'eni* is "this is a mat". That pattern ' +
        'has its own page, linked below.',
    },

    { k: 'h2', text: 'Build one and see' },
    {
      k: 'p',
      text:
        'Word order is the part of Tongan that stops being difficult once your hands have built ' +
        'a few sentences rather than only read them, so the builder below assembles one tile ' +
        'by tile and the picker drills the one choice that decides the shape.',
    },
    {
      k: 'next',
      items: [
        { to: '/sentence-builder', label: 'Build a Tongan sentence word by word' },
        { to: '/drill/subject-marker-picker', label: 'Drill: ʻa, ʻe, or ʻe he' },
        { to: '/first-word', label: 'Drill: name the sentence type from its first word' },
        { to: '/lessons/1', label: 'Lesson 1: the basic sentence' },
        { to: '/lessons/15', label: 'Lesson 15: noun subjects' },
        { to: '/lessons/19', label: 'Lesson 19: word order when the verb has an object' },
        { to: '/grammar/ko-sentences', label: 'Sentences with no verb: the ko pattern' },
        { to: '/grammar/tense-markers', label: 'Tongan tense markers explained' },
      ],
    },
  ],
}
