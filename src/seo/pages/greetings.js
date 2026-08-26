// /greetings: how Tongan says hello, thank you and goodbye.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/components/ArticlePage.jsx renders it in the app, scripts/prerender.mjs
// renders the same blocks as static HTML so a crawler that runs no JS reads
// the whole page.
//
// NOT A COPY OF LESSON 14. /lessons/14 publishes the same formulas, so this
// page has to earn its own URL rather than compete with it. It does that by
// leading with the searched question (what does Malo e lelei mean), answering
// it in the first screen, and covering the greeting exchange end to end,
// including the pieces lesson 14 hands off to other lessons: the imperative
// forms behind the farewells (lesson 5), the ko identification pattern behind
// the name and age questions (lessons 12 and 13), and the possessives inside
// them (lesson 17). No prose is copied across from the lesson.
//
// SOURCES. Every Tongan phrase below is verbatim from book/Chapter-14.md,
// which is a complete sourced lesson on exactly this topic. The three farewell
// rows for one, two and three-or-more people are its own table; the imperative
// pattern behind them (bare verb, mo + verb, mou + verb) is stated there too.
// The one-word answers 'Io and 'Ikai are book/Chapter-09.md and Chapter-14.md.
//
// DELIBERATELY ABSENT. An RNZ article reportedly argues that Malo e lelei was
// popularised by Churchward in the 1950s rather than being traditional. The
// article could not be fetched and the argument is unread, so nothing on this
// page cites it (business/SEO-Plan-2026-08-20.md, sections 3 and 8).
//
// ORTHOGRAPHY. Tongan sits inside `*…*` spans with the ASCII apostrophe
// exactly as book/ stores it; both renderers run it through src/lib/okinafy.js,
// which turns an apostrophe-before-a-vowel into the real fakauʻa (U+02BB).
// Text outside a `*…*` span is English and is left alone, so Tongan in a
// heading, a chip, a link label or an English gloss carries the U+02BB itself.

export default {
  path: '/greetings',
  eyebrow: 'Words and phrases',
  h1: 'Tongan greetings: Mālō e lelei, and what to say next',
  chips: ['Mālō e lelei', 'Fēfē hake?', 'Mālō e ʻofa', 'Two goodbyes'],
  blocks: [
    {
      k: 'p',
      text:
        'The everyday Tongan hello is *Mālō e lelei*, and the reply is the same words back. ' +
        'It is warmer than it looks in a phrasebook. *Mālō* means "worthy of praise" or ' +
        '"congratulations", *e* is the definite article, and *lelei* means "well" or "good", ' +
        'so the greeting says something closer to "the being-in-good-health is worthy of ' +
        'praise" than to "hi".',
    },
    {
      k: 'table',
      headers: ['Tongan', 'English', 'When you use it'],
      rows: [
        ['*Mālō e lelei!*', 'Hello.', 'Meeting anyone.'],
        ['*\'Io, mālō e lelei!*', 'Hello.', 'Answering the greeting.'],
        ['*Fēfē hake?*', 'How are you?', 'Straight after the hello.'],
        ['*Sai pē!*', 'Just fine.', 'Answering that question.'],
        ['*Mālō e \'ofa!*', 'Thank you for your kindness.', 'Thanking someone.'],
        ['*\'Alu ā!*', 'Goodbye.', 'To the person who is leaving.'],
        ['*Nofo ā!*', 'Goodbye.', 'To the person who is staying.'],
      ],
    },
    {
      k: 'p',
      text:
        'That table is the whole exchange in outline. The rest of this page takes each line ' +
        'apart, because the grammar inside these formulas is worth seeing: the two goodbyes ' +
        'are ordinary commands, and the questions about your name and your age are built on a ' +
        'sentence pattern the course teaches in full.',
    },

    { k: 'h2', text: 'Saying hello, and answering' },
    {
      k: 'p',
      text:
        'The reply to *Mālō e lelei* is *Mālō e lelei*, usually with *\'io* (yes) in front of ' +
        'it.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Mālō e lelei!', en: 'Hello.' },
        { ton: '\'Io, mālō e lelei!', en: 'Hello. (Literally "Yes, congratulations on being well.")' },
      ],
    },
    {
      k: 'p',
      text:
        'That *\'io* is the right first word in response to any greeting, compliment or ' +
        'farewell. It can stand on its own or lead into something more specific, and a useful ' +
        'way to hear it is "it is as you say".',
    },
    {
      k: 'note',
      text:
        'One consequence catches English speakers out. Tongan answers a negative question with ' +
        '*\'io* where English would say "no", because the *\'io* confirms what was asked: ' +
        '*Na\'e \'ikai té ke \'alu?* (Didn\'t you go?) is answered *\'Io, na\'e \'ikai té u ' +
        '\'alu.* (No, I didn\'t go.)',
    },

    { k: 'h2', text: 'Asking how someone is' },
    {
      k: 'p',
      text:
        'The follow-up question is *Fēfē hake?* and the stock answer is *Sai pē!* Neither one ' +
        'is a full sentence with a tense marker; both are fixed formulas.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Fēfē hake?', en: 'How are you?' },
        { ton: 'Sai pē!', en: 'Just fine.' },
      ],
    },
    {
      k: 'p',
      text:
        '*Fēfē* is the question word "how", which the course teaches with the other question ' +
        'words. *Hake* means "up" or "upward", which gives the question the sense of "how are ' +
        'you getting along?", and it is used especially of someone who has been unwell. In the ' +
        'answer, *sai* means "good, well, fine" and *pē* means "just" or "only".',
    },

    { k: 'h2', text: 'Saying thank you' },
    {
      k: 'p',
      text:
        'Thanks in Tongan is the same *mālō* again, with the thing you are grateful for after ' +
        'it. *Mālō e \'ofa* says "the kindness is worthy of praise", where *\'ofa* is love or ' +
        'kindness.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Mālō e \'ofa!', en: 'Thank you for your kindness.' },
        { ton: 'Mālō e tokoni mai!', en: 'Thanks for your help.' },
        { ton: 'Mālō e lava mai!', en: 'Thanks for coming. (The usual greeting to a visitor who has just arrived.)' },
      ],
    },
    {
      k: 'p',
      text:
        'The pattern keeps going with whatever fits the moment. *Mālō e ngāue!* thanks someone ' +
        'for working, and the answer to any of these is *\'Io!*',
    },

    { k: 'h2', text: 'Good morning, in a formal setting' },
    {
      k: 'p',
      text:
        'A longer greeting is used in formal settings, and it is worth memorising whole rather ' +
        'than assembling.',
    },
    {
      k: 'ex',
      items: [
        {
          ton: 'Mālō \'etau lava ki he pongipongi ni.',
          en: 'Good morning. (Literally "Congratulations on our surviving to this morning.")',
        },
      ],
    },
    {
      k: 'p',
      text:
        'Swap the time word for another part of the day and the formula still works: *efiafi ' +
        'ni* for this afternoon or evening, *pō ni* for tonight. The *\'etau* inside it is a ' +
        'possessive pronoun meaning "our", including the person you are speaking to.',
    },

    { k: 'h2', text: 'Which goodbye depends on who is leaving' },
    {
      k: 'p',
      text:
        '*\'Alu ā!* and *Nofo ā!* both translate as "goodbye", and you do not get to pick. The ' +
        'person who is leaving and the person who is staying are told different things, and ' +
        'someone going to bed is told a third.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Alu ā!', en: 'Goodbye. (Said to the person who is leaving.)' },
        { ton: 'Nofo ā!', en: 'Goodbye. (Said to the person who is staying.)' },
        { ton: 'Mohe ā!', en: 'Goodnight. (Said to someone going to bed.)' },
      ],
    },
    {
      k: 'p',
      text:
        'Each one is an ordinary command with *ā* on the end: *\'alu* is "go", *nofo* is ' +
        '"stay", *mohe* is "sleep". So you are telling the leaver to go, and the person left ' +
        'behind to stay.',
    },
    {
      k: 'h3',
      text: 'What the *ā* is doing',
    },
    {
      k: 'p',
      text:
        '*Ā* is a tonal adverb, meaning a word concerned with the tone of what is said. ' +
        'It has no direct English translation. Without it, *\'Alu!* ' +
        'is a bare order, "Go." With it, *\'Alu ā!* softens into a warm farewell, "go well". ' +
        'Depending on the tone of voice, *ā* can make words less abrupt and more polite, or ' +
        'less casual and more emphatic.',
    },
    {
      k: 'p',
      text:
        'In speech a friendly *ē* often follows, and it changes nothing about the meaning.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Alu ā ē!', en: 'Goodbye.' },
        { ton: 'Nofo ā ē!', en: 'Goodbye.' },
      ],
    },
    {
      k: 'h3',
      text: 'Saying it to more than one person',
    },
    {
      k: 'p',
      text:
        'Tongan commands change shape for two people and for three or more, and the farewells ' +
        'follow suit: the bare verb for one, *mo* plus the verb for two, *mou* plus the verb ' +
        'for three or more. The plural of "go" is *ō*, not *\'alu*.',
    },
    {
      k: 'table',
      headers: ['Farewell', 'To one person', 'To two people', 'To three or more'],
      rows: [
        ['To those leaving', '*\'Alu ā!*', '*Mo ō ā!*', '*Mou ō ā!*'],
        ['To those staying', '*Nofo ā!*', '*Mo nofo ā!*', '*Mou nofo ā!*'],
      ],
    },

    { k: 'h2', text: 'Please, excuse me, and sorry' },
    {
      k: 'p',
      text:
        'Two words soften a request, and both go at the front of it. *Fakamolemole* is "pardon" ' +
        'or "excuse me". *Kātaki* is "please", literally "endure", and on its own it also does ' +
        'the work of "sorry".',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Fakamolemole, ha\'u ki heni.', en: 'Excuse me, come here.' },
        { ton: 'Kātaki, nofo hē.', en: 'Please, sit over there.' },
        { ton: 'Kātaki!', en: 'Sorry.' },
      ],
    },

    { k: 'h2', text: 'Using someone\'s name' },
    {
      k: 'p',
      text:
        'When you address a person by name, *\'e* goes in front of the name. It marks direct ' +
        'address, the job English does with a pause and a comma.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'E Sione, ha\'u!', en: 'Sione, come.' },
        { ton: '\'E Mele, nofo ā!', en: 'Mele, goodbye.' },
      ],
    },
    {
      k: 'p',
      text:
        'It is sometimes dropped in casual speech, and it is always correct to include it. This ' +
        'vocative *\'e* is a separate word from the future tense marker *\'e*, which is ' +
        'spelled identically and sits in a different place in the sentence, and it is separate ' +
        'again from the article *e*, which has no fakau\u02bba at all.',
    },

    { k: 'h2', text: 'Name and age' },
    {
      k: 'p',
      text:
        'Two questions turn up early in almost every first conversation, and both are built on ' +
        '*ko*, the word Tongan uses to identify one thing as another.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko hai ho hingoa?', en: 'What is your name? (Literally "Who is your name?")' },
        { ton: 'Ko Sione au.', en: 'I am Sione.' },
        { ton: 'Ko ho ta\'u fiha eni?', en: 'How old are you? (Literally "Is your year how-many this?")' },
        { ton: 'Ko hoku ta\'u uofulu eni.', en: 'I am twenty years old.' },
      ],
    },
    {
      k: 'p',
      text:
        '*Hingoa* is "name", *ta\'u* is "year" or "age", and *fiha* is "how many". *Ho* is ' +
        '"your" and *hoku* is "my", both from the possessive system taught in lesson 17. Until ' +
        'you get there, these four lines work perfectly well learned whole.',
    },

    { k: 'h2', text: 'The whole exchange, start to finish' },
    {
      k: 'p',
      text:
        'Put together, a first meeting runs like this.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Mālō e lelei!', en: 'Hello.' },
        { ton: '\'Io, mālō e lelei!', en: 'Hello.' },
        { ton: 'Fēfē hake?', en: 'How are you?' },
        { ton: 'Sai pē!', en: 'Just fine.' },
        { ton: 'Ko hai ho hingoa?', en: 'What is your name?' },
        { ton: 'Ko Mele au.', en: 'I am Mele.' },
        { ton: 'Ko ho ta\'u fiha eni?', en: 'How old are you?' },
        { ton: 'Ko hoku ta\'u uofulu eni.', en: 'I am twenty.' },
        { ton: '\'Alu ā ē!', en: 'Goodbye.' },
        { ton: 'Nofo ā ē!', en: 'Goodbye.' },
      ],
    },
    {
      k: 'p',
      text:
        'Every line there uses grammar the course teaches in order: the *ko* identification ' +
        'pattern, the *\'io* acknowledgement, question words, postposed pronouns, and command ' +
        'forms of the verb.',
    },

    { k: 'h2', text: 'Practise the exchange' },
    {
      k: 'p',
      text:
        'Greetings stick faster when you answer them under a little pressure rather than read ' +
        'them down a list, so the drills below run the exchange both ways round.',
    },
    {
      k: 'next',
      items: [
        { to: '/drill/greet-thank', label: 'Drill: greet, thank, and respond' },
        { to: '/drill/farewell-picker', label: 'Drill: who leaves, who stays, pick the farewell' },
        { to: '/drill/introduce-yourself', label: 'Drill: introduce yourself, name and age' },
        { to: '/lessons/14', label: 'Lesson 14: greetings and social formulas' },
        { to: '/grammar/possessives', label: 'Lesson 17 and the possessives inside these phrases' },
        { to: '/alphabet', label: 'How to pronounce the words on this page' },
        { to: '/lessons', label: 'All 52 lessons, free' },
      ],
    },
  ],
}
