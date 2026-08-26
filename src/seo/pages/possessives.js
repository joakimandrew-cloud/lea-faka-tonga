// /grammar/possessives: the Tongan possessive system, across the whole course.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/components/ArticlePage.jsx renders it in the app, scripts/prerender.mjs
// renders the same blocks as static HTML so a crawler that runs no JS reads
// the whole page.
//
// NOT A COPY OF LESSON 17. /lessons/17 publishes the two classes and the two
// tables, so this page has to earn its own URL rather than compete with it. It
// does that by following possession across the course: lesson 17 (the two
// classes, the two pronoun sets, the prepositions 'a and 'o), lesson 29 (the
// principle underneath the classes, the indefinite forms, having something,
// what happens after a preposition), lesson 37 (the emphatic forms after the
// noun, and asking whose). No prose is copied across from any lesson.
//
// SOURCES. Every Tongan form below is verbatim from book/: Chapter-17.md,
// Chapter-29.md and Chapter-37.md. The one-line class descriptions are the
// course's own, and Chapter-17.md attributes the underlying division to
// Churchward, which is why no rationale here goes beyond what those chapters
// state.
//
// ORTHOGRAPHY. Tongan sits inside `*…*` spans with the ASCII apostrophe
// exactly as book/ stores it; both renderers run it through src/lib/okinafy.js,
// which turns an apostrophe-before-a-vowel into the real fakauʻa (U+02BB).
// Text outside a `*…*` span is English and is left alone, so Tongan in a
// heading, a chip, a link label or an English gloss carries the U+02BB itself.

export default {
  path: '/grammar/possessives',
  eyebrow: 'Grammar',
  h1: 'Tongan possessives: ʻeku or hoku, and why there are two',
  chips: ['Two classes', 'ʻeku and hoku', 'ʻa and ʻo', 'Doer or receiver'],
  blocks: [
    {
      k: 'p',
      text:
        'My knife is *\'eku hele*. My house is *hoku fale*. Both mean "my", and Tongan chooses ' +
        'between two complete sets of possessives depending on your relationship to the thing, ' +
        'not on the thing itself. The course calls them the ʻe-class and the ho-class after ' +
        'the sound each set carries.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'eku hele', en: 'my knife (I act on it)' },
        { ton: 'hoku fale', en: 'my house (it shelters me)' },
      ],
    },
    {
      k: 'p',
      text:
        'The short version: the ʻe-class is for things you act upon, control, create or ' +
        'consume, and the ho-class is for things that act upon you, shelter you or define you. ' +
        'The image the course uses to anchor it is that ʻe-class is for things upon which you ' +
        'impress yourself, and ho-class is for things which impress themselves upon you.',
    },

    { k: 'h2', text: 'Which class a noun takes' },
    {
      k: 'p',
      text:
        'Your money, your food, your work and your tools are ʻe-class. Your house, your body, ' +
        'your relatives, your clothes and your country are ho-class.',
    },
    {
      k: 'table',
      headers: ['Ho-class (it characterises you)', 'ʻE-class (you control it)'],
      rows: [
        ['Relations: *hoku tokoua* (my sibling)', 'Emotions: *\'eku \'ita* (my anger)'],
        ['Houses and boats: *hoku fale* (my house)', 'Animals: *\'eku moa* (my chicken)'],
        ['Clothes: *hoku tatā* (my hat)', 'Work and activities: *\'eku ngāue* (my work)'],
        ['Countries and lands: *hoku fonua* (my country)', 'Language and speech: *\'ene lea* (his speech)'],
        ['Body parts: *hoku nima* (my hand)', 'Food: *\'eku talo* (my taro)'],
      ],
    },
    {
      k: 'p',
      text:
        'Some words move between the classes with the situation. *\'Eku fala* is the mat I ' +
        'make, because I act on it; *hoku fala* is the mat I sit on, because it holds me up.',
    },
    {
      k: 'note',
      text:
        'Not every noun follows the guide above, and the course says plainly that working out ' +
        'which noun takes which class is a long job for an English speaker rather than ' +
        'something that clicks at once. Some of the exceptions are common: *\'eku tamai* (my ' +
        'father) and *ho\'o fa\'ē* (your mother) are ʻe-class even though they are relatives. ' +
        'The workable strategy is to learn each noun\'s class along with the noun.',
    },

    { k: 'h2', text: 'The two sets of words' },
    {
      k: 'p',
      text:
        'Both sets go in front of the noun they belong to, and both cover the same seven ' +
        'persons, including the two kinds of "our" that Tongan distinguishes: *\'etau* and ' +
        '*hotau* include the person you are talking to, *\'emau* and *homau* leave them out.',
    },
    {
      k: 'table',
      headers: ['Meaning', 'ʻE-class', 'Ho-class'],
      rows: [
        ['my', '*\'eku*', '*hoku*'],
        ['your (one person)', '*ho\'o*', '*ho*'],
        ['his, her, its', '*\'ene*', '*hono*'],
        ['our (including you)', '*\'etau*', '*hotau*'],
        ['our (not you)', '*\'emau*', '*homau*'],
        ['your (several people)', '*ho\'omou*', '*homou*'],
        ['their', '*\'enau*', '*honau*'],
      ],
    },
    {
      k: 'p',
      text:
        'Inside the table above there is a reliable way to tell the two sets apart in writing. ' +
        'Every \u02bbe-class pronoun there carries a fakau\u02bba, the catch in the throat, in its ' +
        'possessive element: *\'eku*, *\'ene*, *\'etau*. None of the ho-class ones does: ' +
        '*hoku*, *hono*, *hotau*. Do not test on the first letter, because the \u02bbe-class ' +
        'second-person forms *ho\'o*, *ho\'omo* and *ho\'omou* also begin with *h*, and each ' +
        'still carries the fakau\u02bba. The test is about this table and not about the whole ' +
        'system: the ho-class preposition is *\'o*, and the emphatic ho-class forms further ' +
        'down this page are *\'o\'oku*, *\'o\'ou* and *\'o\'ona*.',
    },
    {
      k: 'p',
      text:
        'Tongan also has dual forms, for exactly two people: *\'eta* and *hota* (yours and ' +
        'mine), *\'ema* and *homa* (his and mine), *ho\'omo* and *homo* (yours, the two of ' +
        'you), *\'ena* and *hona* (theirs, the two of them).',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko fē hona kote?', en: 'Where are their coats (the two of them)?' },
        { ton: 'Kuo ngalo homa kote.', en: 'We (he and I) have forgotten our coats.' },
      ],
    },

    { k: 'h2', text: 'The idea underneath the two classes' },
    {
      k: 'p',
      text:
        '*\'Eku tokoni* is "my helping", the help I give. *Hoku tokoni* is "my being helped", ' +
        'the help given to me. Same English word "my", opposite roles, and that is the ' +
        'principle the two classes are built on: the ʻe-class marks the possessor as the doer, ' +
        'and the ho-class marks the possessor as the receiver.',
    },
    {
      k: 'table',
      headers: ['ʻE-class (doer)', 'Ho-class (receiver)'],
      rows: [
        ['*\'eku tokoni* my helping', '*hoku tokoni* my being helped'],
        ['*\'ene fili* his choosing', '*hono fili* his being chosen'],
        ['*\'ene tohi* his writing', '*hono tohi* his being written about'],
      ],
    },
    {
      k: 'p',
      text:
        'That principle runs through the ordinary nouns as well, which is what makes the list ' +
        'further up this page more than an arbitrary sorting. You are the doer with your knife ' +
        'and the receiver with your clothes.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Eku vala.', en: 'The clothes I make (I act on them).' },
        { ton: 'Hoku vala.', en: 'The clothes I wear (they cover me).' },
        { ton: '\'Ene hiva.', en: 'The song he sings (he produces it).' },
        { ton: 'Hono hiva.', en: 'The song sung about him (it is about him).' },
      ],
    },
    {
      k: 'p',
      text:
        'When the verb has no object the possessor can only be the doer, so only the ʻe-class ' +
        'applies: *\'ene ngāue* (his working), *\'enau fiefia* (their being happy).',
    },
    {
      k: 'note',
      text:
        'Plants sort themselves by the same test. Crops and fruit are ʻe-class because you ' +
        'tend and harvest them, and trees are ho-class because they stand over you: *\'eku ' +
        'niu* is my coconuts, the fruit, and *hoku niu* is my coconut palms, the trees.',
    },

    { k: 'h2', text: 'Whose it is, when the owner is named' },
    {
      k: 'p',
      text:
        '*Ko e pa\'anga \'a Sione* is "Sione\'s money" and *Ko e fale \'o Sione* is "Sione\'s ' +
        'house". With a name rather than a pronoun, the two classes appear as two ' +
        'prepositions: *\'a* for the ʻe-class and *\'o* for the ho-class. Both translate as ' +
        '"of", and the class rules decide which one you reach for.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e pa\'anga \'a Sione.', en: 'Sione\'s money. (ʻE-class: money is something he controls.)' },
        { ton: 'Ko e fale \'o Sione.', en: 'Sione\'s house. (Ho-class: a house shelters him.)' },
        { ton: 'Ko e vaka \'o Tēvita.', en: 'Tēvita\'s boat.' },
      ],
    },
    {
      k: 'p',
      text:
        'The distinction shows up most sharply with abstract nouns. *Ko e tokoni \'a e faiako* ' +
        'is the help the teacher gives, and *ko e tokoni \'o e fonua* is the help the country ' +
        'receives. The teacher produces it; the country is on the other end of it.',
    },

    { k: 'h2', text: 'Asking whose something is' },
    {
      k: 'p',
      text:
        'The same two prepositions form the question. *Hai* is "who", so *\'a hai* asks whose ' +
        'for an ʻe-class noun and *\'o hai* asks whose for a ho-class noun.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e hele eni \'a hai?', en: 'Whose knife is this?' },
        { ton: 'Ko e fale eni \'o hai?', en: 'Whose house is this?' },
      ],
    },

    { k: 'h2', text: 'That one is MINE' },
    {
      k: 'p',
      text:
        'To put the weight on the owner, Tongan has a second set of possessives that follow the ' +
        'noun instead of preceding it. *Ko e kato ia \'a\'aku* is "that basket is mine", with ' +
        'the emphasis English gives by raising the voice.',
    },
    {
      k: 'table',
      headers: ['Meaning', 'ʻE-class', 'Ho-class'],
      rows: [
        ['mine', '*\'a\'aku*', '*\'o\'oku*'],
        ['yours (one person)', '*\'a\'au*', '*\'o\'ou*'],
        ['his, hers, its', '*\'a\'ana*', '*\'o\'ona*'],
      ],
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e hele ia \'a\'au.', en: 'That knife is yours.' },
        { ton: 'Ko e fale ia \'o\'oku.', en: 'That house is mine.' },
        { ton: 'Ko e kofu ia \'o\'ona.', en: 'That dress is hers.' },
      ],
    },
    {
      k: 'p',
      text:
        'The forms are built out of the possessive preposition doubled and then the pronoun, so ' +
        '*\'a\'aku* is *\'a* plus *\'a* plus *ku*, near enough "of-of-me". The dual and plural ' +
        'forms follow the same classes without the doubling: *\'amautolu* (ours, not yours), ' +
        '*\'amoutolu* (yours, several).',
    },

    { k: 'h2', text: 'Saying you have something' },
    {
      k: 'p',
      text:
        'Tongan has no verb meaning "to have". The job is done by *\'oku \'i ai* ("there is") ' +
        'plus a possessive, and the possessive switches to an indefinite form when the thing is ' +
        'not a specific one: *\'eku* becomes *ha\'aku*, *ho\'o* becomes *ha\'o*, *hoku* becomes ' +
        '*haku*, *ho* becomes *hao*.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Oku \'i ai ha\'o kato?', en: 'Do you have a basket? (Literally "Is there a-your basket?")' },
        { ton: '\'Oku \'ikai ke \'i ai ha\'aku hele.', en: 'I do not have a knife.' },
        { ton: '\'Oku \'i ai \'eku hele \'e ua.', en: 'I have two knives.' },
      ],
    },
    {
      k: 'p',
      text:
        'The indefinite form turns up in the question, where the speaker does not know whether ' +
        'you have one, and in the negative, where you have none. The ordinary definite form ' +
        'comes back in an affirmative answer, because by then the thing is specific.',
    },

    { k: 'h2', text: 'After a preposition' },
    {
      k: 'p',
      text:
        'A ho-class possessive connects straight to *ki*, *\'i* and *mei*, with no article in ' +
        'between: *ki hoku falé* (to my house), *\'i hono lokí* (in his room), *mei homau \'apí* ' +
        '(from our home). Ordinary nouns take the article, so *ki he fale* is "to the house" ' +
        'while *ki hoku fale* is "to my house".',
    },
    {
      k: 'p',
      text:
        'An ʻe-class possessive behaves differently: the article *he* appears between the ' +
        'preposition and the possessive.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'mei he\'eku tamaí', en: 'from my father' },
        { ton: 'ki he \'ene faiakó', en: 'to his teacher' },
        { ton: '\'e he \'enau mātu\'á', en: 'by their parents' },
      ],
    },
    {
      k: 'p',
      text:
        'The second-person ʻe-class forms are the exception and connect directly, with no ' +
        '*he*: *ki ho\'o tohi*, *mei ho\'omou ngāue*.',
    },

    { k: 'h2', text: 'Sort them until the class comes automatically' },
    {
      k: 'p',
      text:
        'Reasoning your way to the right class mid-sentence is slow work, and sorting nouns one ' +
        'at a time is how you stop having to. The doer-and-receiver drill trains the harder ' +
        'half of the system.',
    },
    {
      k: 'next',
      items: [
        { to: '/possessive-sort', label: 'Drill: saying "my", ʻeku or hoku' },
        { to: '/drill/doer-receiver-picker', label: 'Drill: his choosing, or his being chosen' },
        { to: '/drill/kinship-possessive', label: 'Drill: family, my and your and his' },
        { to: '/drill/postposed-possessive-picker', label: 'Drill: that one is MINE' },
        { to: '/lessons/17', label: 'Lesson 17: possessives' },
        { to: '/lessons/29', label: 'Lesson 29: the possessive system in full' },
        { to: '/lessons/37', label: 'Lesson 37: postposed possessives' },
        { to: '/charts', label: 'The grammar charts' },
      ],
    },
  ],
}
