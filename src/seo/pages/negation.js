// /grammar/negation: how Tongan says "not", across the whole course.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/components/ArticlePage.jsx renders it in the app, scripts/prerender.mjs
// renders the same blocks as static HTML so a crawler that runs no JS reads
// the whole page.
//
// NOT A COPY OF LESSON 9. /lessons/9 publishes the core pattern, so this page
// has to earn its own URL rather than compete with it. It does that by
// covering negation wherever the course teaches it: lesson 9 ('ikai te and
// 'ikai ke, the marker shift, loko and teitei), lesson 15 (negating a sentence
// whose subject is a name), lesson 12 (negating a sentence that has no verb),
// lesson 29 (there is no such thing as "to have", so the negative runs through
// the existential), lesson 43 (the ta'e- prefix and the double negative). No
// prose is copied across from any lesson.
//
// SOURCES. Every Tongan sentence below is verbatim from book/: Chapter-09.md,
// Chapter-15.md, Chapter-12.md, Chapter-29.md and Chapter-43.md.
//
// ORTHOGRAPHY. Tongan sits inside `*…*` spans with the ASCII apostrophe
// exactly as book/ stores it; both renderers run it through src/lib/okinafy.js,
// which turns an apostrophe-before-a-vowel into the real fakauʻa (U+02BB).
// Text outside a `*…*` span is English and is left alone, so Tongan in a
// heading, a chip, a link label or an English gloss carries the U+02BB itself.

export default {
  path: '/grammar/negation',
  eyebrow: 'Grammar',
  h1: 'How to say "not" in Tongan: ʻikai',
  chips: ['ʻikai te', 'ʻikai ke', 'naʻe and ʻe', 'taʻe-'],
  blocks: [
    {
      k: 'p',
      text:
        '*\'Oku ou fiefia* is "I am happy". *\'Oku \'ikai té u fiefia* is "I am not happy". ' +
        'The word for "not" is *\'ikai*, and it goes in near the front of the sentence, between ' +
        'the tense marker and whatever follows it. Nothing at the end of the sentence moves.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Oku ou fiefia.', en: 'I am happy.' },
        { ton: '\'Oku \'ikai té u fiefia.', en: 'I am not happy. (Literally "is not I happy")' },
      ],
    },
    {
      k: 'p',
      text:
        'One extra word rides along with *\'ikai*, and it is either *te* or *ke*. Which one you ' +
        'get depends on what comes next, and that single choice is most of what makes Tongan ' +
        'negation feel unfamiliar at first. The rest of this page is that choice, what it does ' +
        'to the tense markers, and the two other places negation turns up.',
    },

    { k: 'h2', text: 'With a pronoun: ʻikai te' },
    {
      k: 'p',
      text:
        'When the subject is a pronoun, *\'ikai te* goes between the tense marker and the ' +
        'pronoun. The positive sentence runs marker, pronoun, verb; the negative runs marker, ' +
        '*\'ikai te*, pronoun, verb.',
    },
    {
      k: 'table',
      headers: ['Positive', 'Negative'],
      rows: [
        ['*\'Oku ou fiefia.* I am happy.', '*\'Oku \'ikai té u fiefia.* I am not happy.'],
        ['*\'Okú ke mohe.* You are sleeping.', '*\'Oku \'ikai té ke mohe.* You are not sleeping.'],
        ['*\'Okú ne \'ita.* He is angry.', '*\'Oku \'ikai té ne \'ita.* He is not angry.'],
        ['*\'Oku mau hela\'ia.* We are tired.', '*\'Oku \'ikai te mau hela\'ia.* We are not tired.'],
        ['*\'Oku nau fiekaia.* They are hungry.', '*\'Oku \'ikai te nau fiekaia.* They are not hungry.'],
      ],
    },
    {
      k: 'p',
      text:
        'After *te*, the word for "I" is *u*, the same form it takes with the future marker in ' +
        '*té u \'alu* (I will go). Every other pronoun keeps its usual shape.',
    },
    {
      k: 'note',
      text:
        'The *te* in *\'ikai te* is not the future tense marker. It is a connecting word that ' +
        'appears only in the negative, in front of a pronoun, and it has no English translation ' +
        'of its own. It still follows the stress rule from lesson 2: *te* joins with a ' +
        'one-syllable pronoun as a single spoken unit, which is why this course writes *\'ikai ' +
        'té u*, *\'ikai té ke* and *\'ikai té ne* with the accent.',
    },
    {
      k: 'p',
      text:
        'Descriptive words fill the verb slot in Tongan, so an adjective negates exactly the ' +
        'same way an action verb does.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Oku \'ikai té ne hela\'ia.', en: 'He is not tired.' },
        { ton: '\'Oku \'ikai te nau \'ita.', en: 'They are not angry.' },
        { ton: '\'Oku \'ikai té ne ngāue mālohi.', en: 'He does not work hard.' },
      ],
    },

    { k: 'h2', text: 'With no pronoun: ʻikai ke' },
    {
      k: 'p',
      text:
        '*Na\'e matangi \'anepō* is "it was windy last night", and there is no pronoun in it, ' +
        'because no person is doing anything. To negate a sentence like that, the link word is ' +
        '*ke* rather than *te*.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e matangi \'anepō.', en: 'It was windy last night.' },
        { ton: 'Na\'e \'ikai ke matangi \'anepō.', en: 'It was not windy last night.' },
        { ton: '\'Oku \'ikai ke \'uha.', en: 'It is not raining.' },
        { ton: '\'E \'ikai ke momoko \'apongipongi.', en: 'It will not be cold tomorrow.' },
      ],
    },
    {
      k: 'p',
      text:
        'The rule in one line: *\'ikai te* in front of a pronoun, *\'ikai ke* in front of a ' +
        'verb. It is the same split you already meet in the tense markers themselves, where one ' +
        'form is used before pronouns and another everywhere else.',
    },

    { k: 'h2', text: 'The past and future markers change shape' },
    {
      k: 'p',
      text:
        'A positive past sentence opens *na\'á ku*, because *na\'a* is the form used directly ' +
        'in front of a pronoun. In the negative the word after the tense marker is *\'ikai*, ' +
        'which is not a pronoun, so the marker becomes *na\'e*. The future does the same thing: ' +
        '*té u* in the positive, *\'e \'ikai té u* in the negative.',
    },
    {
      k: 'table',
      headers: ['Tense', 'Negative', 'English'],
      rows: [
        ['Present', '*\'Oku \'ikai té u fiefia.*', 'I am not happy.'],
        ['Past', '*Na\'e \'ikai té u fiefia.*', 'I was not happy.'],
        ['Future', '*\'E \'ikai té u fiefia.*', 'I will not be happy.'],
      ],
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e \'ikai té u tokoni kia Sione.', en: 'I did not help Sione.' },
        { ton: '\'E \'ikai té ke nofo \'i Tonga.', en: 'You will not stay in Tonga.' },
        { ton: 'Na\'e \'ikai te mau kai ika \'anepō.', en: 'We did not eat fish last night.' },
      ],
    },
    {
      k: 'note',
      text:
        'You may also hear *he \'ikai te* where *\'e \'ikai te* is expected in a future ' +
        'negative. It gives the denial stronger emphasis, and it means the same thing.',
    },

    { k: 'h2', text: 'When the subject is a name' },
    {
      k: 'p',
      text:
        '*Na\'e \'ikai ke \'alu \'a Sione* is "Sione did not go". A name is not a pronoun, so ' +
        'it takes *\'ikai ke*, and it stays after the verb with its usual *\'a* in front of it.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'e \'ikai ke \'alu \'a Sione.', en: 'Sione did not go.' },
        { ton: '\'Oku \'ikai ke puke \'a Pita.', en: 'Pita is not sick.' },
      ],
    },
    {
      k: 'table',
      headers: ['Tense', 'Pronoun subject', 'Noun subject'],
      rows: [
        ['Present', '*\'Oku \'ikai té ne \'alu.*', '*\'Oku \'ikai ke \'alu \'a Sione.*'],
        ['Past', '*Na\'e \'ikai té ne \'alu.*', '*Na\'e \'ikai ke \'alu \'a Sione.*'],
        ['Future', '*\'E \'ikai té ne \'alu.*', '*\'E \'ikai ke \'alu \'a Sione.*'],
      ],
    },

    { k: 'h2', text: 'Saying what something is not' },
    {
      k: 'p',
      text:
        '*Ko e hele \'eni* is "this is a knife", a sentence with no verb and no tense marker at ' +
        'all. To negate it, *\'oku \'ikai* is placed in front of the *ko*, which wraps the ' +
        'whole identification in a negative frame and brings in a tense marker the positive ' +
        'sentence never had.',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Ko e hele \'eni.', en: 'This is a knife.' },
        { ton: '\'Oku \'ikai ko e hele \'eni.', en: 'This is not a knife.' },
        { ton: '\'Oku \'ikai ko e faiako ia.', en: 'He or she is not a teacher.' },
        { ton: 'Na\'e \'ikai ko e faiako \'a Fehoko.', en: 'Fehoko was not a teacher.' },
      ],
    },
    {
      k: 'p',
      text:
        'The last line shows the past doing what it does everywhere else on this page: *na\'e*, ' +
        'because *\'ikai* follows.',
    },

    { k: 'h2', text: 'Saying you do not have something' },
    {
      k: 'p',
      text:
        'Tongan has no verb meaning "to have". Possession is said with *\'oku \'i ai* ("there ' +
        'is") and a possessive, so the negative of "I have" is the negative of "there is".',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Oku \'i ai ha\'o kato?', en: 'Do you have a basket? (Literally "Is there a-your basket?")' },
        { ton: '\'Oku \'ikai ke \'i ai ha\'aku hele.', en: 'I do not have a knife. (Literally "There is not a knife of mine.")' },
      ],
    },

    { k: 'h2', text: 'ʻIkai on its own' },
    {
      k: 'p',
      text:
        'Asked *Na\'á ke kai?* (Did you eat?), you can answer with the single word *\'Ikai.* ' +
        'That is the same word doing duty as a complete reply, and it is the counterpart of ' +
        '*\'Io* (yes).',
    },
    {
      k: 'ex',
      items: [
        { ton: 'Na\'á ke kai?', en: 'Did you eat?' },
        { ton: '\'Ikai.', en: 'No.' },
      ],
    },

    { k: 'h2', text: 'Not too, and not at all' },
    {
      k: 'p',
      text:
        'Two words tune the strength of a negative. *Loko* weakens it to "not too" or "not ' +
        'particularly", and it sits after *ke*. *Teitei* strengthens it to "at all" or ' +
        '"certainly not", and it sits after the pronoun.',
    },
    {
      k: 'ex',
      items: [
        { ton: '\'Oku \'ikai ke loko lelei \'a e ika.', en: 'The fish is not too good.' },
        { ton: '\'Oku \'ikai ke loko momoko.', en: 'It is not too cold.' },
        { ton: '\'E \'ikai té u teitei \'alu.', en: 'I am certainly not going.' },
        { ton: 'Na\'e \'ikai té u teitei kai.', en: 'I absolutely did not eat.' },
      ],
    },
    {
      k: 'p',
      text:
        'Neither word appears outside a negative in this sense: *loko* follows a negative and ' +
        '*teitei* sits inside one.',
    },

    { k: 'h2', text: 'The other negative: taʻe-' },
    {
      k: 'p',
      text:
        '*\'Oku ta\'e tokanga \'a Sione* means "Sione is inattentive", and it negates the same ' +
        'sentence that *\'oku \'ikai ke tokanga* negates. The difference is mechanical: ' +
        '*\'ikai* is a separate word that sits between the tense marker and the verb with *ke* ' +
        'or *te* linking it, while *ta\'e-* attaches directly to the word it negates, the way ' +
        'English "un-" does.',
    },
    {
      k: 'table',
      headers: ['With ʻikai', 'With taʻe-', 'English'],
      rows: [
        ['*\'Oku \'ikai ke tokanga \'a Sione.*', '*\'Oku ta\'e tokanga \'a Sione.*', 'Sione is inattentive.'],
        ['*Na\'e \'ikai ke fe\'unga \'ene ngāué.*', '*Na\'e ta\'e fe\'unga \'ene ngāué.*', 'His work was inadequate.'],
      ],
    },
    {
      k: 'p',
      text:
        'The *ta\'e-* form often carries a slightly stronger or more definite negative tone. ' +
        'Put the two negatives in one sentence and they cancel, giving an emphatic positive: ' +
        '*\'E \'ikai té u ta\'e fai e ngāué ni* is "I will certainly do this work", built out of ' +
        '"I will not not-do this work".',
    },

    { k: 'h2', text: 'Drill the one choice that matters' },
    {
      k: 'p',
      text:
        'The *te* and *ke* split is the one thing on this page you have to reach for without ' +
        'thinking, so it is worth drilling on its own until the choice stops being a ' +
        'decision.',
    },
    {
      k: 'next',
      items: [
        { to: '/drill/te-or-ke-picker', label: 'Drill: after ʻikai, te or ke?' },
        { to: '/drill/tm-by-context-picker', label: 'Drill: naʻa or naʻe, te or ʻe' },
        { to: '/drill/tae-prefix-picker', label: 'Drill: taʻe-, without and un-' },
        { to: '/lessons/9', label: 'Lesson 9: the negative' },
        { to: '/lessons/15', label: 'Lesson 15: noun subjects' },
        { to: '/lessons/43', label: 'Lesson 43: the taʻe- prefix and advanced negation' },
        { to: '/grammar/tense-markers', label: 'Tongan tense markers explained' },
      ],
    },
  ],
}
