// /alphabet: the Tongan alphabet and pronunciation page.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/components/ArticlePage.jsx renders it in the app, scripts/prerender.mjs
// renders the same blocks as static HTML so a crawler that runs no JS reads
// the whole page.
//
// SOURCES. Every Tongan token here is copied from a repo source, never
// invented: book/appendix-a-pronunciation.md (the 17 letters, the vowel table,
// the toloi, the fakauʻa minimal pairs, stress and the definitive accent) and
// concepts G1 to G7 of spec/Grammar-Concepts-for-Students.md (the extra
// minimal pairs, the syllable patterns, the long-vowel stress shift).
//
// ORTHOGRAPHY. Tongan sits inside `*…*` spans and is written with the ASCII
// apostrophe exactly as book/ stores it; both renderers run it through
// src/lib/okinafy.js, which turns an apostrophe-before-a-vowel into the real
// fakauʻa (U+02BB). Text outside a `*…*` span is English and is left alone,
// so any Tongan name appearing in a heading or chip carries the U+02BB itself.

export default {
  path: '/alphabet',
  eyebrow: 'Pronunciation',
  h1: 'The Tongan alphabet, and how every letter sounds',
  chips: ['17 letters', 'Five vowels', 'The fakauʻa', 'Stress'],
  blocks: [
    {
      k: 'p',
      text:
        'Tongan has seventeen letters: the five vowels *a e i o u*, eleven consonants ' +
        '*f h k l m n ng p s t v*, and the *fakau\'a*, the small raised mark that stands for a ' +
        'catch in the throat. A letter always spells the same sound. There are no silent ' +
        'letters, every syllable ends in a vowel, and so does every word. That is the whole ' +
        'system, which is why you can read any Tongan word aloud once you know the letters.',
    },
    {
      k: 'p',
      text:
        'Three things carry meaning that an English speaker is likely to skip: the length of a ' +
        'vowel, the catch in the throat, and where the stress lands. Each one can turn a word ' +
        'into a different word, so this page gives all three their own section.',
    },

    { k: 'h2', text: 'The five vowels' },
    {
      k: 'p',
      text:
        'The vowels hold steady values, closer to Spanish or Italian than to English, where the ' +
        'same letter wanders from one word to the next.',
    },
    {
      k: 'table',
      headers: ['Letter', 'Sounds like', 'In these words'],
      rows: [
        ['*a*', 'the "a" of "father", a little shorter', '*fala, mate*'],
        ['*e*', 'the "e" of "bet", leaning toward "bait"', '*fale, mele*'],
        ['*i*', 'the "i" of "machine"', '*liku, taki*'],
        ['*o*', 'the "o" of "born", further back', '*fono, pito*'],
        ['*u*', 'the "oo" of "root", shorter, with no glide', '*lotu, muka*'],
      ],
    },

    { k: 'h2', text: 'A long vowel is a different word' },
    {
      k: 'p',
      text:
        'A line over a vowel is the macron, *ā ē ī ō ū*, called the ' +
        '*toloi* in Tongan. It means the vowel is held longer. The length is not decoration and ' +
        'not an accent: it changes which word you have said.',
    },
    {
      k: 'table',
      headers: ['Short', '', 'Long', ''],
      rows: [
        ['*kaka*', 'climb', '*kakā*', 'parrot'],
        ['*manava*', 'womb', '*mānava*', 'breathe'],
        ['*mavae*', 'to wean', '*māvae*', 'to depart'],
        ['*pe*', 'or', '*pē*', 'only'],
      ],
    },
    {
      k: 'p',
      text:
        'The same word can take more than one macron and change again: *kaka* is to climb, ' +
        '*kakā* is a parrot, and *kākā* is to cheat.',
    },

    { k: 'h2', text: 'Two vowels together stay two sounds' },
    {
      k: 'p',
      text:
        'When two vowels meet, sound each one clearly. English blurs a vowel pair into a single ' +
        'glide; Tongan does not, and a blurred pair is heard as a different word.',
    },
    {
      k: 'table',
      headers: ['Word', 'Meaning', 'Word', 'Meaning'],
      rows: [
        ['*vai*', 'water', '*vae*', 'divide'],
        ['*toi*', 'hide', '*toe*', 'again'],
        ['*lao*', 'law', '*lau*', 'read'],
        ['*pou*', 'post, pole', '*pō*', 'night'],
        ['*feitu\'u*', 'place', '*fetu\'u*', 'star'],
      ],
    },

    { k: 'h2', text: 'The consonants' },
    {
      k: 'p',
      text:
        'Most of the eleven are near enough to English to read on sight. Four are worth a note ' +
        'before you say your first word.',
    },
    {
      k: 'table',
      headers: ['Letter', 'What to know'],
      rows: [
        ['*ng*', 'One sound, the "ng" of "singer", never the "ng-g" of "finger": *Tonga, ngofua*.'],
        [
          '*k p t*',
          'Unaspirated, said with no puff of air, so they fall between English "k p t" and ' +
            '"g b d": *ketu, pō, taha*.',
        ],
        ['*l*', 'Light, often a single quick flap of the tongue: *lava, mālie*.'],
        ['*f h m n s v*', 'As in English.'],
      ],
    },
    {
      k: 'p',
      text:
        'Two consonants never sit side by side. A vowel always separates them, which is why *ng*, ' +
        'written with two letters, counts as one.',
    },

    { k: 'h2', text: 'The fakauʻa, the catch in the throat' },
    {
      k: 'p',
      text:
        'The *fakau\'a* is a full consonant, as real as *t* or *k*. It is the glottal stop: the ' +
        'little catch in the middle of the English "uh-oh". It is the easiest letter to skip ' +
        'over and one of the most expensive to lose, because it separates pairs of words that ' +
        'are otherwise identical.',
    },
    {
      k: 'table',
      headers: ['With the fakauʻa', '', 'Without it', ''],
      rows: [
        ['*\'anga*', 'shark', '*anga*', 'disposition'],
        ['*\'uma*', 'kiss', '*uma*', 'shoulder'],
        ['*ma\'u*', 'get', '*mau*', 'we (exclusive)'],
        ['*ta\'u*', 'year', '*tau*', 'war'],
        ['*ta\'o*', 'bake', '*tao*', 'spear'],
        ['*to\'a*', 'brave', '*toa*', 'ironwood tree'],
      ],
    },
    {
      k: 'p',
      text:
        'Because it is a letter, it gets its own mark: a small raised comma leaning like an ' +
        'opening quote. In print it often stands in as a plain apostrophe, but it is never ' +
        'punctuation.',
    },
    {
      k: 'note',
      text:
        'You may have seen the same mark called the ʻokina. That is its Hawaiian name. In ' +
        'Tongan it is the *fakau\'a*, from *u\'a*, throat.',
    },

    { k: 'h2', text: 'Syllables' },
    {
      k: 'p',
      text:
        'Every Tongan syllable is one of two shapes: a single vowel, or one consonant followed by ' +
        'one vowel. There is no third shape, so any word breaks apart on sight. *fakataha*, to ' +
        'assemble, is *fa-ka-ta-ha*. *tangata*, man, is *ta-nga-ta*, three syllables and not four, ' +
        'because *ng* is one consonant. *ō*, the plural of "go", is a single vowel and a ' +
        'whole word.',
    },

    { k: 'h2', text: 'Where the stress falls' },
    {
      k: 'p',
      text:
        'Stress lands on the second-to-last syllable: *fá-le* (house), *fo-nú-a* ' +
        '(country), *fa-ka-ma-tá-la* (explanation). Two regular shifts move it.',
    },
    {
      k: 'p',
      text:
        'First, a long final vowel pulls the stress onto itself: *kumā*, rat, is stressed on ' +
        'the final *ā* and not on the *u*.',
    },
    {
      k: 'p',
      text:
        'Second, when a common noun is made definite with the article *e* or *he*, meaning "the", ' +
        'the stress jumps to the last vowel of the phrase. Grammarians call that the definitive ' +
        'accent, and it is doing real work: it is part of how Tongan says "the".',
    },
    {
      k: 'table',
      headers: ['Indefinite', 'Definite'],
      rows: [
        ['*fale*, a house', '*he falé*, the house'],
        ['*fonua*, a country', '*he fonuá*, the country'],
      ],
    },
    {
      k: 'p',
      text:
        'This course marks stress with an acute accent wherever it is not obvious, so you will ' +
        'read *he falé*, *Té u \'alu* (I will go), *Na\'á ku \'alu* (I went). The ' +
        'mark is a reading aid rather than part of everyday Tongan spelling, and it is there to ' +
        'train your ear until the rhythm arrives on its own.',
    },

    { k: 'h2', text: 'Say it out loud, then start reading' },
    {
      k: 'p',
      text:
        'The sound system is the short part of Tongan. Once the letters are steady, the rest of ' +
        'the language is grammar, and the first lesson is a three-word sentence.',
    },
    {
      k: 'next',
      items: [
        { to: '/lessons/1', label: 'Start with lesson 1, the basic sentence' },
        { to: '/lessons', label: 'All 52 lessons, free' },
        { to: '/cards', label: 'Vocabulary flip cards' },
      ],
    },
  ],
}
