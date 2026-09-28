// Curated course examples, not a free-form generator. Each new endpoint comes
// verbatim from its named lesson; intermediate steps reveal removable phrases.
// The first path retains Andrew's requested Lessons 1–4 progression.
// Never invoke translation skills without Andrew's explicit permission.
const p = (id, word, gloss, lesson, topic) => ({ id, word, gloss, lesson, topic })
const s = (english, label, note, lesson, parts) => ({ english, label, note, lesson, parts })
const past = p('tense', 'Naʻá', 'past', 1, 'Basic pattern')
const me = p('person', 'ku', 'I', 2, 'Pronouns')
const he = p('person', 'ne', 'he', 2, 'Pronouns')
const future = p('tense', 'Té', 'future', 2, 'Tense markers')
const drink = p('action', 'inu', 'drink', 1, 'Actions')
const water = p('object', 'vai', 'water', 3, 'Verb + object')
const tonight = p('time', 'ʻapō', 'tonight', 4, 'Time words')
const go = p('action', 'ʻalu', 'go', 1, 'Actions')
const town = p('place', 'ki kolo', 'to town', 7, 'Destination')
const companion = p('companion', 'mo Sione', 'with Sione', 10, 'With someone')
const yesterday = p('time', 'ʻaneafi', 'yesterday', 4, 'Time words')
const present = p('tense', 'ʻOkú', 'present', 2, 'Tense markers')
const presentI = [p('tense', 'ʻOku', 'present', 2, 'Tense markers'), p('person', 'ou', 'I', 2, 'Pronouns'), go]
const run = p('action', 'lele', 'run', 1, 'Actions')
const away = p('direction', 'atu', 'away', 28, 'Direction')
const house = p('place', 'ki he falé', 'toward the house', 7, 'Destination')
const walkBase = [present, p('person', 'na', 'they two', 2, 'Pronouns'), p('action', 'lue', 'walk', 28, 'Walking')]
const around = p('direction', 'holo', 'around', 28, 'Direction')
// Lesson 6 teaches the location marker; the complete phrase is quoted in 28.
const village = { ...p('place', 'ʻi he koló', 'in the village', 6, 'Location'), referenceWord: 'ʻi' }
const home = p('place', 'ki ʻapi', 'home', 7, 'Destination')
const workBase = [future, p('person', 'u', 'I', 2, 'Pronouns'), p('action', 'ngāue', 'work', 6, 'Actions')]
const here = p('place', 'heni', 'here', 6, 'Location')
// Lesson 45 teaches the possessive + verbal noun construction; 47 supplies this example.
const imagined = [p('tense', 'Naʻe', 'past', 47, 'Imagined past'), p('negative', 'ʻikai', 'not', 9, 'Negation'), p('ability', 'mei lava', 'would have been able', 47, 'What might have been'), { ...p('event', 'ʻeku haʻú', 'my coming', 45, 'Verbal nouns'), referenceWord: 'ʻeku' }]

export const SENTENCE_GROUPS = [
  { id: 'begin', label: '1. Start small' },
  { id: 'move', label: '2. Add detail' },
  { id: 'connect', label: '3. Connect ideas' },
]

export const SENTENCE_PATHS = [
  {
    id: 'first', group: 'begin', title: 'Eat & drink', range: 'Lessons 1–4',
    description: 'Change the action, the person and the tense. Then add an object and a time.',
    steps: [
      s('I ate.', 'Begin with an action', 'A tense marker, a pronoun, and a verb.', 1, [past, me, p('action', 'kai', 'eat', 1, 'Actions')]),
      s('I drank.', 'Change the verb', '*Inu* means drink. The tense marker places the action in the past.', 1, [past, me, drink]),
      s('He drank.', 'Change the person', '*Ne* can mean he, she, or it. Here, we are talking about him.', 2, [past, he, drink]),
      s('He will drink.', 'Change the tense', '*Té* places the action in the future. The verb stays *inu*.', 2, [future, he, drink]),
      s('He will drink water.', 'Add what he drinks', '*Inu vai*, “drink water”, works as one verb unit.', 3, [future, he, drink, water]),
      s('He will drink water tonight.', 'Add the time', '*ʻApō* means tonight when speaking before nightfall.', 4, [future, he, drink, water, tonight]),
    ],
  },
  {
    id: 'go', group: 'move', title: 'Go', range: 'Through Lesson 10',
    description: 'An action becomes a journey: where, with whom, and when.',
    source: { lesson: 10, section: 'Mo: With, Together With' },
    steps: [
      s('I went.', 'Start with “go”', 'The same three-part pattern, with a different action.', 1, [past, me, go]),
      s('I went to town.', 'Add a destination', '*Ki* introduces where you are going.', 7, [past, me, go, town]),
      s('I went to town with Sione.', 'Add a companion', '*Mo* tells us who came along. It follows the location phrase.', 10, [past, me, go, town, companion]),
      s('I went to town with Sione yesterday.', 'Add the time', 'The time comes last. This complete sentence appears in Lesson 10.', 4, [past, me, go, town, companion, yesterday]),
    ],
  },
  {
    id: 'run', group: 'move', title: 'Run', range: 'Through Lesson 28',
    description: 'Give a movement a direction, then a destination.',
    source: { lesson: 28, section: 'atu: away from the speaker, toward the listener' },
    steps: [
      s('He is running.', 'Start with “run”', 'This example uses the present tense and *ne*: he, she, or it.', 2, [present, he, run]),
      s('He is running away.', 'Add a direction', '*Atu* adds movement away from the speaker. It sits immediately after the verb.', 28, [present, he, run, away]),
      s('He is running (away) toward the house.', 'Add a destination', 'Direction and destination do different jobs: away from here, toward the house.', 7, [present, he, run, away, house]),
    ],
  },
  {
    id: 'walk', group: 'move', title: 'Walk', range: 'Through Lesson 28',
    description: 'Now there are two people, walking around in a place.',
    source: { lesson: 28, section: 'Exercise 2, question and answer 8' },
    steps: [
      s('They (two) are walking.', 'Start with two people', '*Na* means they two. Tongan distinguishes two people from a larger group.', 2, walkBase),
      s('They (two) are walking around.', 'Add a direction', '*Holo* means around or about, rather than toward a fixed destination.', 28, [...walkBase, around]),
      s('They (two) are walking around in the village.', 'Add a location', '*ʻI* tells us where the walking happens.', 6, [...walkBase, around, village]),
    ],
  },
  {
    id: 'reason', group: 'connect', title: 'Because…', range: 'Lesson 26',
    description: 'Go beyond describing an action. Explain why it happens.',
    source: { lesson: 26, section: 'he: for, because' },
    steps: [
      s('I am going.', 'Start with an action', 'The familiar tense–pronoun–verb pattern is still here.', 2, presentI),
      s('I am going home.', 'Add a destination', 'First say where you are going.', 7, [...presentI, home]),
      s('I am going home, because I am tired.', 'Add a whole reason', '*He* joins the action to another clause, with its own tense marker, pronoun and description.', 26, [...presentI, { ...home, word: 'ki ʻapi,' }, p('reason', 'he ʻoku ou helaʻia', 'because I am tired', 26, 'A reason')]),
    ],
  },
  {
    id: 'purpose', group: 'connect', title: 'In order to…', range: 'Lesson 26',
    description: 'Explain what you are going to do, using a second clause.',
    source: { lesson: 26, section: 'koeʻuhi: because, in order that' },
    steps: [
      s('I go.', 'Start with an action', 'A short statement can be the beginning of a much bigger thought.', 2, presentI),
      s('I go in order to see the teacher.', 'Add a purpose', '*Koeʻuhi ke* introduces the purpose. The new clause tells us what the going is for.', 26, [...presentI, p('purpose', 'koeʻuhi ke u sio ki he faiakó', 'in order to see the teacher', 26, 'A purpose')]),
    ],
  },
  {
    id: 'until', group: 'connect', title: 'Until…', range: 'Lesson 30',
    description: 'Link what you will do to something that has not happened yet.',
    source: { lesson: 30, section: 'Until: kaeʻoua ke' },
    steps: [
      s('I will work.', 'Start in the future', '*Té u* means I will. Notice that “I” is *u* here, rather than past-tense *ku*.', 2, workBase),
      s('I will work here.', 'Add a place', '*Heni* tells us the action happens here.', 6, [...workBase, here]),
      s('I will work here until they come back.', 'Add an ending event', '*Kaeʻoua ke* introduces the event that will bring the working to an end.', 30, [...workBase, here, p('until', 'kaeʻoua ke nau foki mai', 'until they come back', 30, 'Until something happens')]),
    ],
  },
  {
    id: 'imagine', group: 'connect', title: 'What if…', range: 'Lesson 47',
    description: 'Later, express what could have happened if things had been different.',
    source: { lesson: 47, section: 'Moderative mei: nearly, would, should, might' },
    steps: [
      s('I would not have been able to come.', 'Imagine a different outcome', 'Later lessons combine negation, ability and a verbal noun to talk about an imagined past.', 47, imagined),
      s('I would not have been able to come if it had not been for the boat.', 'Add what made the difference', '*Ka ne taʻeʻoua* introduces “if it had not been for”. You are now connecting whole ideas.', 47, [...imagined, p('condition', 'ka ne taʻeʻoua ʻa e vaká', 'if it had not been for the boat', 47, 'An imagined condition')]),
    ],
  },
]

// The landing page presents a short linear film, not the entire example library.
// Reuse the same source-checked sentences; only the presentation captions change.
const filmScenes = [
  { id: 'first', title: 'Your first sentence', captions: [
    'Start with three parts: when, who, and the action.',
    'Change the action. The pattern stays the same.',
    'Change who. *Ne* can mean he, she, or it.',
    'Move into the future. The verb stays the same.',
    'Add what he drinks.',
    'Add tonight. *ʻApō* is used before nightfall.',
  ] },
  { id: 'run', title: 'Add movement and place', captions: [
    'Now try a different action: running.',
    'Add a direction: away from the speaker.',
    'Then say where he is going.',
  ] },
  { id: 'reason', title: 'Connect whole ideas', captions: [
    'A new example starts with the same familiar pattern.',
    'Add a destination: home.',
    'Now explain why, with a second part of the sentence.',
  ] },
  { id: 'imagine', title: 'Further on in the course', captions: [
    'Later, describe what could have happened.',
    'From three words to a whole thought about what might have been.',
  ] },
]
export const SENTENCE_FILM = filmScenes.flatMap(scene => {
  const path = SENTENCE_PATHS.find(item => item.id === scene.id)
  return path.steps.map((example, i) => ({ scene: scene.title, example, caption: scene.captions[i], sceneEnd: i === path.steps.length - 1 }))
})
