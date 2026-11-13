// The words of the /start-here page, moved from
// reviews/start-here-page-2026-11-13/Page-Copy.md (in the project backup) by a script,
// never retyped (plan 2026-11-13-start-here-page, Step 3). Plain JavaScript with no
// imports, so scripts/prerender.mjs reads the same strings under node.
//
// A section is { id, heading, blocks }. A block is a paragraph (p), a list (ul, ol),
// the first sentences (examples), the test for moving on (test) or links (links).
// Inline parts: { t: 'text' } English, { t: 'to' } Tongan, { t: 'src' } a source.
// Tongan keeps the fakaua as the ASCII apostrophe, as the site stores it; the T
// component turns it into U+02BB for display.
export const START_HERE = {
  "heading": "Start here: a first road into Tongan",
  "meta": {
    "title": "Start here: a first road into Tongan",
    "description": "A suggested order for your first pass through the course: six sentences to learn whole, a daily routine, and stages 0 to 4 that each end in a test."
  },
  "sections": [
    {
      "id": "intro",
      "heading": null,
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "This page is a suggested order for your first pass through the course. In the first lessons, Tongan shows tense with a separate word in a fixed place and the verb does not change form to show tense, so a sentence pattern learned once keeps working as you add words to it. You make a few patterns automatic, out loud, on sentences about your own day, pull a handful of pieces forward from later lessons, and then take the lessons in order."
            }
          ]
        },
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Nobody has measured how long this road takes, so the stages carry no dates. Stages 0 to 4 each end in a test you run yourself, and you move on when you pass it."
            }
          ]
        }
      ]
    },
    {
      "id": "first-sentences",
      "heading": "Six sentences to learn first",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Learn these whole first, before the grammar inside them is taught, because they keep a speaker talking to a beginner."
            }
          ]
        },
        {
          "type": "examples",
          "items": [
            {
              "to": "'Oku 'ikai ke mahino kiate au.",
              "meaning": "I don't understand.",
              "source": "Shumway, Lesson 51"
            },
            {
              "to": "'Oku mahino kiate au.",
              "meaning": "I understand.",
              "source": "Lesson 7"
            },
            {
              "to": "'Oku ou lolotonga ako e lea faka-Tongá.",
              "meaning": "I am currently learning Tongan.",
              "source": "Shumway, Word Studies"
            },
            {
              "to": "Ko e hā 'eni?",
              "meaning": "What is this?",
              "source": "Lesson 12"
            },
            {
              "to": "Hei'ilo!",
              "meaning": "I don't know.",
              "source": "Shumway, Lesson 72"
            },
            {
              "to": "Tatali hifo mu'a!",
              "meaning": "Wait a little please!",
              "source": "Shumway, Word Studies"
            }
          ]
        },
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Four of them come from Eric Shumway's Intensive Course in Tongan rather than from our lessons."
            }
          ]
        }
      ]
    },
    {
      "id": "routine",
      "heading": "The daily routine",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Give it about thirty minutes a day, in this order."
            }
          ]
        },
        {
          "type": "ol",
          "items": [
            [
              {
                "t": "text",
                "v": "Recall before you look, for ten minutes. Look only at the English of sentences from earlier days, say the Tongan aloud, then check. Lessons 1 to 21 each have an English-to-Tongan exercise with answers for this. Bring each sentence back the next day, some days later, and after a week."
              }
            ],
            [
              {
                "t": "text",
                "v": "One new pattern, one swap at a time, for ten minutes. Take a model sentence from the lesson, change one word, and say the new sentence aloud: "
              },
              {
                "t": "to",
                "v": "Na'á ku kai."
              },
              {
                "t": "text",
                "v": " (I ate.), "
              },
              {
                "t": "to",
                "v": "Na'á ke kai?"
              },
              {
                "t": "text",
                "v": " (Did you eat?), "
              },
              {
                "t": "to",
                "v": "'Io, na'á ku kai."
              },
              {
                "t": "text",
                "v": " (Yes, I ate.) "
              },
              {
                "t": "src",
                "v": "Lesson 1"
              },
              {
                "t": "text",
                "v": ". Read the explanations silently and keep your voice for the sentences."
              }
            ],
            [
              {
                "t": "text",
                "v": "Your own day, for five minutes. Say three things you did and three you will do, on the models "
              },
              {
                "t": "to",
                "v": "Na'á ku mohe 'aneafi."
              },
              {
                "t": "text",
                "v": " (I slept yesterday.) and "
              },
              {
                "t": "to",
                "v": "Té u 'alu 'apongipongi."
              },
              {
                "t": "text",
                "v": " (I will go tomorrow.) "
              },
              {
                "t": "src",
                "v": "Lesson 4"
              },
              {
                "t": "text",
                "v": ", with verbs from the lessons' word lists."
              }
            ],
            [
              {
                "t": "text",
                "v": "Your island, for five minutes. An island is a short piece about yourself, memorised and practised until it comes out whole. You build it in Stage 3, and from then on you say it from memory every day against a clock."
              }
            ]
          ]
        },
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "The routine supplies no listening: nothing in it brings you Tongan by ear."
            }
          ]
        }
      ]
    },
    {
      "id": "stage-0",
      "heading": "Stage 0: Sounds and first words",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Start with the alphabet page: Tongan is spelled the way it sounds, so once you know the letters you can read any word aloud. A line over a vowel means it is held longer, which changes the word: "
            },
            {
              "t": "to",
              "v": "kaka"
            },
            {
              "t": "text",
              "v": " is \"climb\" and "
            },
            {
              "t": "to",
              "v": "kakā"
            },
            {
              "t": "text",
              "v": " is \"parrot\". Stress falls on the second-to-last syllable by default, and the book prints an acute accent wherever the stress is not obvious, as in "
            },
            {
              "t": "to",
              "v": "Té u 'alu"
            },
            {
              "t": "text",
              "v": " (I will go) "
            },
            {
              "t": "src",
              "v": "Appendix A"
            },
            {
              "t": "text",
              "v": ". That accent is a reading aid, and Tongan you meet outside the course may carry no marks at all."
            }
          ]
        },
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Then learn the greetings as Lesson 14 gives them: "
            },
            {
              "t": "to",
              "v": "Mālō e lelei!"
            },
            {
              "t": "text",
              "v": " answered by "
            },
            {
              "t": "to",
              "v": "'Io, mālō e lelei!"
            },
            {
              "t": "text",
              "v": ", "
            },
            {
              "t": "to",
              "v": "Fēfē hake?"
            },
            {
              "t": "text",
              "v": " answered by "
            },
            {
              "t": "to",
              "v": "Sai pē!"
            },
            {
              "t": "text",
              "v": ", and the farewells "
            },
            {
              "t": "to",
              "v": "'Alu ā!"
            },
            {
              "t": "text",
              "v": " to the person leaving and "
            },
            {
              "t": "to",
              "v": "Nofo ā!"
            },
            {
              "t": "text",
              "v": " to the person staying "
            },
            {
              "t": "src",
              "v": "Lesson 14"
            },
            {
              "t": "text",
              "v": ". Add the pattern for thanks, as in "
            },
            {
              "t": "to",
              "v": "Mālō e ngāue!"
            },
            {
              "t": "text",
              "v": " (Thanks for working.) "
            },
            {
              "t": "src",
              "v": "Lesson 14"
            },
            {
              "t": "text",
              "v": "."
            }
          ]
        },
        {
          "type": "test",
          "parts": [
            {
              "t": "text",
              "v": "Move on when you can read ten example sentences of Lesson 1 aloud and say where the stress falls in each word."
            }
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/alphabet",
              "label": "The alphabet and how every letter sounds"
            },
            {
              "to": "/greetings",
              "label": "Greetings, and what to say next"
            }
          ]
        }
      ]
    },
    {
      "id": "stage-1",
      "heading": "Stage 1: The pattern, kept narrow (Lessons 1 to 3)",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Learn the four tense markers, three persons (I, you, he or she), the twelve verbs of Lesson 1 and the describing words of Lesson 3, with the yes-or-no question and its answers in "
            },
            {
              "t": "to",
              "v": "'io"
            },
            {
              "t": "text",
              "v": " and "
            },
            {
              "t": "to",
              "v": "'ikai"
            },
            {
              "t": "text",
              "v": " "
            },
            {
              "t": "src",
              "v": "Lesson 1"
            },
            {
              "t": "text",
              "v": ". In these four, only the marker changes: "
            },
            {
              "t": "to",
              "v": "Na'á ke kai."
            },
            {
              "t": "text",
              "v": " (You ate.), "
            },
            {
              "t": "to",
              "v": "'Okú ke kai."
            },
            {
              "t": "text",
              "v": " (You eat.), "
            },
            {
              "t": "to",
              "v": "Kuó ke kai."
            },
            {
              "t": "text",
              "v": " (You have eaten.), "
            },
            {
              "t": "to",
              "v": "Té ke kai."
            },
            {
              "t": "text",
              "v": " (You will eat.) "
            },
            {
              "t": "src",
              "v": "Lesson 2"
            },
            {
              "t": "text",
              "v": ". The one word that changes with the marker is \"I\" ("
            },
            {
              "t": "to",
              "v": "ku"
            },
            {
              "t": "text",
              "v": " after "
            },
            {
              "t": "to",
              "v": "na'a"
            },
            {
              "t": "text",
              "v": ", "
            },
            {
              "t": "to",
              "v": "ou"
            },
            {
              "t": "text",
              "v": " after "
            },
            {
              "t": "to",
              "v": "'oku"
            },
            {
              "t": "text",
              "v": ", "
            },
            {
              "t": "to",
              "v": "u"
            },
            {
              "t": "text",
              "v": " after "
            },
            {
              "t": "to",
              "v": "kuo"
            },
            {
              "t": "text",
              "v": " and "
            },
            {
              "t": "to",
              "v": "te"
            },
            {
              "t": "text",
              "v": ") "
            },
            {
              "t": "src",
              "v": "Lesson 2"
            },
            {
              "t": "text",
              "v": ". A describing word goes where the verb goes: "
            },
            {
              "t": "to",
              "v": "'Oku ou fiekaia."
            },
            {
              "t": "text",
              "v": " (I am hungry.) "
            },
            {
              "t": "src",
              "v": "Lesson 3"
            },
            {
              "t": "text",
              "v": "."
            }
          ]
        },
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Leave the rest of Lesson 2's pronoun table for Stage 5, apart from "
            },
            {
              "t": "to",
              "v": "tau"
            },
            {
              "t": "text",
              "v": ", which opens an invitation: "
            },
            {
              "t": "to",
              "v": "Tau kai."
            },
            {
              "t": "text",
              "v": " (Let's eat.) "
            },
            {
              "t": "src",
              "v": "Lesson 2"
            },
            {
              "t": "text",
              "v": "."
            }
          ]
        },
        {
          "type": "test",
          "parts": [
            {
              "t": "text",
              "v": "Move on when you can say the Tongan for every item with I, you, he or she in the English-to-Tongan exercises of Lessons 1 to 3 without looking."
            }
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/lessons/1",
              "label": "Lesson 1: The Basic Sentence"
            },
            {
              "to": "/lessons/2",
              "label": "Lesson 2: Tense Markers and Pronouns"
            },
            {
              "to": "/lessons/3",
              "label": "Lesson 3: Descriptive Words"
            },
            {
              "to": "/drill/tense-swap",
              "label": "Drill: change the tense with one word"
            }
          ]
        }
      ]
    },
    {
      "id": "stage-2",
      "heading": "Stage 2: When, where, not, and the question words (Lessons 4, 6, 7, 9 and 11, with pieces of 5, 8 and 10)",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "The time word goes last. Places take "
            },
            {
              "t": "to",
              "v": "'i"
            },
            {
              "t": "text",
              "v": " (at), "
            },
            {
              "t": "to",
              "v": "ki"
            },
            {
              "t": "text",
              "v": " (to) and "
            },
            {
              "t": "to",
              "v": "mei"
            },
            {
              "t": "text",
              "v": " (from): "
            },
            {
              "t": "to",
              "v": "'Oku ou nofo 'i 'api."
            },
            {
              "t": "text",
              "v": " (I live at home.), "
            },
            {
              "t": "to",
              "v": "Té u 'alu ki Tonga."
            },
            {
              "t": "text",
              "v": " (I will go to Tonga.) "
            },
            {
              "t": "src",
              "v": "Lessons 6 and 7"
            },
            {
              "t": "text",
              "v": ". For \"not\" with a pronoun, put "
            },
            {
              "t": "to",
              "v": "'ikai te"
            },
            {
              "t": "text",
              "v": " between the marker and the pronoun, and in the past and the future the marker takes its second form: "
            },
            {
              "t": "to",
              "v": "'Oku 'ikai té u fiefia."
            },
            {
              "t": "text",
              "v": " (I am not happy.), "
            },
            {
              "t": "to",
              "v": "Na'e 'ikai té u fiefia."
            },
            {
              "t": "text",
              "v": " (I was not happy.) "
            },
            {
              "t": "src",
              "v": "Lesson 9"
            },
            {
              "t": "text",
              "v": ". Lesson 11 puts a question word where the answer would go."
            }
          ]
        },
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Take three pieces from the lessons this stage does not take whole. Lesson 5 gives the bare verb as a command, with "
            },
            {
              "t": "to",
              "v": "mu'a"
            },
            {
              "t": "text",
              "v": " as its \"please\": "
            },
            {
              "t": "to",
              "v": "Ha'u mu'a!"
            },
            {
              "t": "text",
              "v": " (Please come!) "
            },
            {
              "t": "src",
              "v": "Lesson 5"
            },
            {
              "t": "text",
              "v": ". Lesson 8 gives "
            },
            {
              "t": "to",
              "v": "ha"
            },
            {
              "t": "text",
              "v": " for \"some\" and "
            },
            {
              "t": "to",
              "v": "e"
            },
            {
              "t": "text",
              "v": " or "
            },
            {
              "t": "to",
              "v": "he"
            },
            {
              "t": "text",
              "v": " for \"the\" "
            },
            {
              "t": "src",
              "v": "Lesson 8"
            },
            {
              "t": "text",
              "v": ". Lesson 10 gives the word for \"with\": "
            },
            {
              "t": "to",
              "v": "Na'á ku 'alu mo Sione."
            },
            {
              "t": "text",
              "v": " (I went with Sione.) "
            },
            {
              "t": "src",
              "v": "Lesson 10"
            },
            {
              "t": "text",
              "v": "."
            }
          ]
        },
        {
          "type": "test",
          "parts": [
            {
              "t": "text",
              "v": "Move on when you can answer four questions aloud in full sentences: "
            },
            {
              "t": "to",
              "v": "Na'á ke 'i fē?"
            },
            {
              "t": "text",
              "v": " (Where have you been?), "
            },
            {
              "t": "to",
              "v": "Té ke 'alu ki fē 'apongipongi?"
            },
            {
              "t": "text",
              "v": " (Where will you go tomorrow?), "
            },
            {
              "t": "to",
              "v": "Na'á ke ha'u mei fē?"
            },
            {
              "t": "text",
              "v": " (Where did you come from?) and "
            },
            {
              "t": "to",
              "v": "'Okú ke fēfē?"
            },
            {
              "t": "text",
              "v": " (How are you?) "
            },
            {
              "t": "src",
              "v": "Lessons 6, 7 and 11"
            },
            {
              "t": "text",
              "v": "."
            }
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/lessons/4",
              "label": "Lesson 4: Time Words"
            },
            {
              "to": "/lessons/5",
              "label": "Lesson 5: Commands and Emphasis"
            },
            {
              "to": "/lessons/6",
              "label": "Lesson 6: Location"
            },
            {
              "to": "/lessons/7",
              "label": "Lesson 7: Prepositions"
            },
            {
              "to": "/lessons/8",
              "label": "Lesson 8: Articles"
            },
            {
              "to": "/lessons/9",
              "label": "Lesson 9: The Negative"
            },
            {
              "to": "/lessons/10",
              "label": "Lesson 10: The word for \"with\""
            },
            {
              "to": "/lessons/11",
              "label": "Lesson 11: Question Words"
            }
          ]
        }
      ]
    },
    {
      "id": "stage-3",
      "heading": "Stage 3: Naming things and yourself (Lessons 12 to 14, the pronoun sentences of 16, a few phrases from 17)",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "to",
              "v": "Ko e hā 'eni?"
            },
            {
              "t": "text",
              "v": " and its answer "
            },
            {
              "t": "to",
              "v": "Ko e kato."
            },
            {
              "t": "text",
              "v": " (It's a basket.) let you ask any speaker for the name of a thing "
            },
            {
              "t": "src",
              "v": "Lesson 12"
            },
            {
              "t": "text",
              "v": ", and Lesson 13 adds the questions for who, where and why. Lesson 14 gives the question for a name, answered on the model "
            },
            {
              "t": "to",
              "v": "Ko Sione au."
            },
            {
              "t": "text",
              "v": " (I am Sione.) "
            },
            {
              "t": "src",
              "v": "Lesson 14"
            },
            {
              "t": "text",
              "v": ". Take possession as whole phrases for now, such as "
            },
            {
              "t": "to",
              "v": "hoku fale"
            },
            {
              "t": "text",
              "v": " (my house) "
            },
            {
              "t": "src",
              "v": "Lesson 17"
            },
            {
              "t": "text",
              "v": "."
            }
          ]
        },
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Build your island here, with your own name, place or work in each blank:"
            }
          ]
        },
        {
          "type": "ul",
          "items": [
            [
              {
                "t": "to",
                "v": "Ko ___ au."
              },
              {
                "t": "text",
                "v": " (I am ___.) "
              },
              {
                "t": "src",
                "v": "Lesson 14"
              }
            ],
            [
              {
                "t": "to",
                "v": "Na'á ku ha'u mei ___."
              },
              {
                "t": "text",
                "v": " (I came from ___.) "
              },
              {
                "t": "src",
                "v": "Lesson 11"
              }
            ],
            [
              {
                "t": "to",
                "v": "'Oku ou nofo 'i ___."
              },
              {
                "t": "text",
                "v": " (I live in ___.) "
              },
              {
                "t": "src",
                "v": "Lesson 7"
              }
            ],
            [
              {
                "t": "to",
                "v": "Ko e ___ au."
              },
              {
                "t": "text",
                "v": " (I am a ___.), as in "
              },
              {
                "t": "to",
                "v": "Ko e tangata ngāue au."
              },
              {
                "t": "text",
                "v": " (I am a worker.) "
              },
              {
                "t": "src",
                "v": "Lesson 16"
              }
            ],
            [
              {
                "t": "to",
                "v": "'Oku ou lolotonga ako e lea faka-Tongá."
              },
              {
                "t": "text",
                "v": " (I am currently learning Tongan.) "
              },
              {
                "t": "src",
                "v": "Shumway, Word Studies"
              }
            ],
            [
              {
                "t": "to",
                "v": "'Oku ou sai'ia lahi he lea faka-Tongá."
              },
              {
                "t": "text",
                "v": " (I like the Tongan language a lot.) "
              },
              {
                "t": "src",
                "v": "Lesson 21"
              }
            ]
          ]
        },
        {
          "type": "test",
          "parts": [
            {
              "t": "text",
              "v": "Move on when you can say the island from memory without a pause."
            }
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/lessons/12",
              "label": "Lesson 12: saying what something is"
            },
            {
              "to": "/lessons/14",
              "label": "Lesson 14: Greetings and Social Formulas"
            },
            {
              "to": "/lessons/16",
              "label": "Lesson 16: Equational Sentences"
            }
          ]
        }
      ]
    },
    {
      "id": "stage-4",
      "heading": "Stage 4: Pieces pulled forward (Lessons 21 to 24, 26, 28 and 29)",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Learn each of these on its model and leave the rest of its lesson for later."
            }
          ]
        },
        {
          "type": "ul",
          "items": [
            [
              {
                "t": "text",
                "v": "Want to: "
              },
              {
                "t": "to",
                "v": "'Oku ou fie ako."
              },
              {
                "t": "text",
                "v": " (I want to study.) "
              },
              {
                "t": "src",
                "v": "Lesson 21"
              }
            ],
            [
              {
                "t": "text",
                "v": "Can and cannot: "
              },
              {
                "t": "to",
                "v": "'Oku ou lava 'o kakau."
              },
              {
                "t": "text",
                "v": " (I can swim.), "
              },
              {
                "t": "to",
                "v": "'Oku 'ikai té u lava 'o 'alu."
              },
              {
                "t": "text",
                "v": " (I cannot go.) "
              },
              {
                "t": "src",
                "v": "Lesson 21"
              }
            ],
            [
              {
                "t": "text",
                "v": "Still, already, not yet: "
              },
              {
                "t": "to",
                "v": "'Oku ou kei feinga pē."
              },
              {
                "t": "text",
                "v": " (I am still trying.), "
              },
              {
                "t": "to",
                "v": "Kuó ne 'osi 'alu."
              },
              {
                "t": "text",
                "v": " (He has already gone.), "
              },
              {
                "t": "to",
                "v": "Te'eki ai."
              },
              {
                "t": "text",
                "v": " (Not yet.) "
              },
              {
                "t": "src",
                "v": "Lesson 22"
              }
            ],
            [
              {
                "t": "text",
                "v": "Must: "
              },
              {
                "t": "to",
                "v": "Kuo pau ke u foki ki fale."
              },
              {
                "t": "text",
                "v": " (I must go back to the house.) "
              },
              {
                "t": "src",
                "v": "Lesson 23"
              }
            ],
            [
              {
                "t": "text",
                "v": "And then, because: "
              },
              {
                "t": "to",
                "v": "Na'á ku ako peá u foki ki 'api."
              },
              {
                "t": "text",
                "v": " (I studied and then went home.), "
              },
              {
                "t": "to",
                "v": "'Oku ou 'alu ki 'api, he 'oku ou hela'ia."
              },
              {
                "t": "text",
                "v": " (I am going home, because I am tired.) "
              },
              {
                "t": "src",
                "v": "Lessons 24 and 26"
              }
            ],
            [
              {
                "t": "text",
                "v": "Toward me, toward you: "
              },
              {
                "t": "to",
                "v": "Té u tala atu."
              },
              {
                "t": "text",
                "v": " (I will tell you.) "
              },
              {
                "t": "src",
                "v": "Lesson 28"
              },
              {
                "t": "text",
                "v": ". Lesson 28 also gives the sentence for \"Bring me the book.\""
              }
            ],
            [
              {
                "t": "text",
                "v": "Have: "
              },
              {
                "t": "to",
                "v": "'Oku 'i ai ha'o kato?"
              },
              {
                "t": "text",
                "v": " (Do you have a basket?), "
              },
              {
                "t": "to",
                "v": "'Oku 'i ai hao fale?"
              },
              {
                "t": "text",
                "v": " (Do you have a house?) "
              },
              {
                "t": "src",
                "v": "Lesson 29"
              }
            ]
          ]
        },
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Learn the \"have\" sentences as they stand: their two words for \"your\" belong to the two possession classes of Lesson 17."
            }
          ]
        },
        {
          "type": "test",
          "parts": [
            {
              "t": "text",
              "v": "Move on when you can say ten true sentences about yourself, each built on one of the first six models by changing the verb or the place, with words from the lessons."
            }
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/lessons/21",
              "label": "Lesson 21: Auxiliary Verbs"
            },
            {
              "to": "/lessons/29",
              "label": "Lesson 29: The Possessive System in Full"
            }
          ]
        }
      ]
    },
    {
      "id": "stage-5",
      "heading": "Stage 5: Widen, then take the lessons in order",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Go back for what was skipped: the parts of Lessons 5, 8 and 10 not yet taken, and the rest of Lesson 2's pronoun table, such as "
            },
            {
              "t": "to",
              "v": "mau"
            },
            {
              "t": "text",
              "v": " (we, not you) "
            },
            {
              "t": "src",
              "v": "Lesson 2"
            },
            {
              "t": "text",
              "v": ". Take Lesson 15, which puts a noun subject after the verb with "
            },
            {
              "t": "to",
              "v": "'a"
            },
            {
              "t": "text",
              "v": ", as in "
            },
            {
              "t": "to",
              "v": "Na'e hiva 'a Sione."
            },
            {
              "t": "text",
              "v": " (Sione sang.) "
            },
            {
              "t": "src",
              "v": "Lesson 15"
            },
            {
              "t": "text",
              "v": ", then Lesson 19's marker for the doer, Lesson 17's two classes of possession and Lesson 18's rule for the accent. Then go on in order from Lesson 15, where the pieces you pulled forward come round again in full."
            }
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/lessons/15",
              "label": "Lesson 15: Noun Subjects"
            },
            {
              "to": "/lessons",
              "label": "All 52 lessons"
            }
          ]
        }
      ]
    },
    {
      "id": "limits",
      "heading": "What a page cannot give",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "A page cannot give sound, and the yes-or-no question of Lesson 1 is made by intonation alone. Reading aloud from the marked spelling gives you the letters, the lengths and the stress; the intonation has to come from a speaker or a recording. Nobody has tried this road with a learner."
            }
          ]
        }
      ]
    }
  ]
}

// The lessons a source names, as numbers: "Lessons 6, 7 and 11" gives [6, 7, 11].
// A source led by Shumway, Churchward or an appendix names no lesson of this course.
export function sourceLessons(source) {
  if (!/^Lessons? \d/.test(source)) return []
  return [...source.matchAll(/\d+/g)].map(match => Number(match[0]))
}

export function startHereSection(id) {
  return START_HERE.sections.find(section => section.id === id)
}
