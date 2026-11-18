// The words of the /start-here page, moved from
// reviews/start-here-rewrite-2026-11-19/Page-Copy.md (in the project backup) by
// make_content.py there, never retyped (plan 2026-11-19-start-here-rewrite).
//
// A section is { id, heading, blocks }. A block is a paragraph (p), a list (ul, ol)
// or links (links). Inline parts: { t: 'text' } English, { t: 'to' } Tongan,
// { t: 'lesson' } the lesson a list item comes from, shown as a link.
// Tongan keeps the fakaua as the ASCII apostrophe, as the site stores it; the T
// component turns it into U+02BB for display.
export const START_HERE = {
  "heading": "Start here",
  "meta": {
    "title": "Start here: how to study Tongan with this course",
    "description": "How to work through the 52 lessons: take them in order, practise out loud for about thirty minutes a day, and build a few sentences about yourself."
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
              "v": "The course is 52 lessons, and the order is the plan: each lesson builds on the ones before it, so take them one after another from Lesson 1. This page is about how to study them, so that what you read becomes Tongan you can say."
            }
          ]
        }
      ]
    },
    {
      "id": "sounds",
      "heading": "First, the sounds",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Tongan is spelled the way it sounds, so once you know the letters you can read any word aloud. A line over a vowel means the vowel is held longer, and it can change the word. Spend your first session on the alphabet page, saying every example out loud, then open Lesson 1."
            }
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/alphabet",
              "label": "Alphabet & pronunciation"
            },
            {
              "to": "/lessons/1",
              "label": "Lesson 1: The Basic Sentence"
            }
          ]
        }
      ]
    },
    {
      "id": "phrases",
      "heading": "Phrases to learn early",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "A few phrases are worth learning whole before the lesson that explains them, because you will want them as soon as you talk with a speaker."
            }
          ]
        },
        {
          "type": "ul",
          "items": [
            [
              {
                "t": "lesson",
                "v": 7
              },
              {
                "t": "to",
                "v": "'Oku mahino kiate au."
              },
              {
                "t": "text",
                "v": " (I understand.) and "
              },
              {
                "t": "to",
                "v": "'Oku mahino kiate koe?"
              },
              {
                "t": "text",
                "v": " (Do you understand?)"
              }
            ],
            [
              {
                "t": "lesson",
                "v": 12
              },
              {
                "t": "to",
                "v": "Ko e hā 'eni?"
              },
              {
                "t": "text",
                "v": " (What is this?), to ask the name of anything you can point at."
              }
            ],
            [
              {
                "t": "lesson",
                "v": 14
              },
              {
                "t": "to",
                "v": "Mālō e lelei!"
              },
              {
                "t": "text",
                "v": " (Hello.) and "
              },
              {
                "t": "to",
                "v": "Fēfē hake?"
              },
              {
                "t": "text",
                "v": " (How are you?), answered with "
              },
              {
                "t": "to",
                "v": "Sai pē!"
              },
              {
                "t": "text",
                "v": " (Just fine.)"
              }
            ],
            [
              {
                "t": "lesson",
                "v": 14
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
                "v": " to the person staying, both meaning goodbye."
              }
            ]
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/greetings",
              "label": "Greetings, and what to say next"
            }
          ]
        }
      ]
    },
    {
      "id": "routine",
      "heading": "A daily routine",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "About thirty minutes a day, out loud, in this order."
            }
          ]
        },
        {
          "type": "ol",
          "items": [
            [
              {
                "t": "text",
                "v": "Recall before you look, for ten minutes. Read the English of sentences from earlier days, say the Tongan aloud, and only then check. Bring each sentence back the next day, again a few days later, and again after a week. The exercises that give you English to put into Tongan come with their answers, so they work well for this."
              }
            ],
            [
              {
                "t": "text",
                "v": "One new pattern, one change at a time, for ten minutes. Take a model sentence from the lesson you are on, change one word, and say the new sentence aloud. In Lesson 1, "
              },
              {
                "t": "to",
                "v": "Na'á ku kai."
              },
              {
                "t": "text",
                "v": " (I ate.) leads to "
              },
              {
                "t": "to",
                "v": "Na'á ke kai?"
              },
              {
                "t": "text",
                "v": " (Did you eat?) and its answer "
              },
              {
                "t": "to",
                "v": "'Io, na'á ku kai."
              },
              {
                "t": "text",
                "v": " (Yes, I ate.) Read the explanations silently and keep your voice for the sentences."
              }
            ],
            [
              {
                "t": "text",
                "v": "Your own day, for five minutes. Say three things you did and three things you will do, with the verbs you have so far. Lesson 4 gives you the words for when: "
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
                "v": " (I will go tomorrow.)"
              }
            ],
            [
              {
                "t": "text",
                "v": "Your introduction, for five minutes. Say the sentences about yourself from the next section from memory, as one piece."
              }
            ]
          ]
        }
      ]
    },
    {
      "id": "yourself",
      "heading": "A few sentences about yourself",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Build a short introduction as the lessons reach each line. Put your own place, name or work in the blank, add each line when its lesson comes, and say the whole piece every day until it comes out without a pause."
            }
          ]
        },
        {
          "type": "ul",
          "items": [
            [
              {
                "t": "lesson",
                "v": 7
              },
              {
                "t": "to",
                "v": "'Oku ou nofo 'i ___."
              },
              {
                "t": "text",
                "v": " (I live in ___.)"
              }
            ],
            [
              {
                "t": "lesson",
                "v": 11
              },
              {
                "t": "to",
                "v": "Na'á ku ha'u mei ___."
              },
              {
                "t": "text",
                "v": " (I came from ___.)"
              }
            ],
            [
              {
                "t": "lesson",
                "v": 14
              },
              {
                "t": "to",
                "v": "Ko ___ au."
              },
              {
                "t": "text",
                "v": " (I am ___.), with your name in the blank."
              }
            ],
            [
              {
                "t": "lesson",
                "v": 16
              },
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
                "v": " (I am a worker.)"
              }
            ],
            [
              {
                "t": "lesson",
                "v": 21
              },
              {
                "t": "to",
                "v": "'Oku ou sai'ia lahi he lea faka-Tongá."
              },
              {
                "t": "text",
                "v": " (I like the Tongan language a lot.)"
              }
            ]
          ]
        }
      ]
    },
    {
      "id": "move-on",
      "heading": "When to move on",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "Every lesson has exercises and a quiz. Move on when you can do a lesson's exercises out loud without looking at the answers, and keep its sentences coming back in your daily recall."
            }
          ]
        },
        {
          "type": "links",
          "items": [
            {
              "to": "/lessons",
              "label": "All 52 lessons"
            }
          ]
        }
      ]
    },
    {
      "id": "listening",
      "heading": "Listen as well",
      "blocks": [
        {
          "type": "p",
          "parts": [
            {
              "t": "text",
              "v": "In Lesson 1, a yes-or-no question uses the same words as the statement, and only the voice, rising at the end, makes it a question. Reading cannot teach you that rise, so listen to Tongan speakers whenever you can and copy how they say the sentences you already know."
            }
          ]
        }
      ]
    }
  ]
}

export function startHereSection(id) {
  return START_HERE.sections.find(section => section.id === id)
}
