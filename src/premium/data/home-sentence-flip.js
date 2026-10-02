// Curated, source-backed homepage sequence. Keep raw book apostrophes here;
// HomeSentenceDemo applies the site's Tongan display normalization at render time.
export const HOME_SENTENCE_FAMILIES = [
  {
    "id": "basic",
    "title": "Build the pattern",
    "lessonLabel": "Lessons 1–3",
    "theme": "red",
    "steps": [
      {
        "id": "basic-pattern",
        "phase": "pattern",
        "cue": "Start with the pattern",
        "english": "You ate.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 91,
          "quote": "| *na'a* | past | *Na'á ke kai.* | You ate. |",
          "appLine": 87
        },
        "change": {
          "kind": "entry",
          "parts": [
            "tense",
            "person",
            "predicate",
            "punctuation"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-present-you",
        "phase": "time",
        "cue": "Change when",
        "english": "You eat.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Okú"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 92,
          "quote": "| *'oku* | present | *'Okú ke kai.* | You eat. |",
          "appLine": 14
        },
        "change": {
          "kind": "single",
          "parts": [
            "tense"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-perfect-you",
        "phase": "time",
        "cue": "Change when",
        "english": "You have eaten.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Kuó"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 93,
          "quote": "| *kuo* | perfect | *Kuó ke kai.* | You have eaten. |",
          "appLine": 44
        },
        "change": {
          "kind": "single",
          "parts": [
            "tense"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-future-you",
        "phase": "time",
        "cue": "Change when",
        "english": "You will eat.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Té"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 94,
          "quote": "| *te* | future | *Té ke kai.* | You will eat. |",
          "appLine": 36
        },
        "change": {
          "kind": "single",
          "parts": [
            "tense"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-future-i",
        "phase": "person",
        "cue": "Change who",
        "english": "I will eat.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Té"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "u"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 109,
          "quote": "| *te* | *u* | *Té u kai.* | I will eat. |",
          "appLine": 105
        },
        "change": {
          "kind": "single",
          "parts": [
            "person"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-perfect-i",
        "phase": "time",
        "cue": "Change when",
        "english": "I have eaten.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Kuó"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "u"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 108,
          "quote": "| *kuo* | *u* | *Kuó u kai.* | I have eaten. |",
          "appLine": 104
        },
        "change": {
          "kind": "single",
          "parts": [
            "tense"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-present-i",
        "phase": "time",
        "cue": "Change when",
        "english": "I eat.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Oku"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ou"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 107,
          "quote": "| *'oku* | *ou* | *'Oku ou kai.* | I eat. |",
          "appLine": 22
        },
        "change": {
          "kind": "linked",
          "parts": [
            "tense",
            "person"
          ],
          "linked": [
            {
              "part": "person",
              "because": "form-after-tense"
            }
          ]
        },
        "note": "The word for “I” changes with the tense marker."
      },
      {
        "id": "basic-past-i",
        "phase": "time",
        "cue": "Change when",
        "english": "I ate.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ku"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 106,
          "quote": "| *na'a* | *ku* | *Na'á ku kai.* | I ate. |",
          "appLine": 102
        },
        "change": {
          "kind": "linked",
          "parts": [
            "tense",
            "person"
          ],
          "linked": [
            {
              "part": "person",
              "because": "form-after-tense"
            }
          ]
        },
        "note": "The word for “I” changes with the tense marker."
      },
      {
        "id": "basic-past-drink",
        "phase": "action",
        "cue": "Change the action",
        "english": "I drank.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ku"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "inu"
          }
        ],
        "source": {
          "lesson": 1,
          "line": 92,
          "quote": "*Na'á ku inu.* I drank.",
          "appLine": 92
        },
        "change": {
          "kind": "single",
          "parts": [
            "predicate"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-drink-you",
        "phase": "person",
        "cue": "Change who",
        "english": "You drank.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "inu"
          }
        ],
        "source": {
          "lesson": 1,
          "line": 94,
          "quote": "*Na'á ke inu.* You drank.",
          "appLine": 94
        },
        "change": {
          "kind": "single",
          "parts": [
            "person"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-present-action",
        "phase": "description",
        "cue": "New example",
        "english": "I eat.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Oku"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ou"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 2,
          "line": 107,
          "quote": "| *'oku* | *ou* | *'Oku ou kai.* | I eat. |",
          "appLine": 22
        },
        "change": {
          "kind": "reset",
          "parts": [
            "tense",
            "person",
            "predicate"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-strong",
        "phase": "description",
        "cue": "Describe instead",
        "english": "I am strong.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Oku"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ou"
          },
          {
            "id": "predicate",
            "label": "DESCRIPTION",
            "text": "mālohi"
          }
        ],
        "source": {
          "lesson": 3,
          "line": 10,
          "quote": "*'Oku ou mālohi.* I am strong. (Lit. \"Present I strong\")",
          "appLine": 10
        },
        "change": {
          "kind": "single",
          "parts": [
            "predicate"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-weak",
        "phase": "description",
        "cue": "Change the description",
        "english": "I am weak.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Oku"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ou"
          },
          {
            "id": "predicate",
            "label": "DESCRIPTION",
            "text": "vaivai"
          }
        ],
        "source": {
          "lesson": 3,
          "line": 12,
          "quote": "*'Oku ou vaivai.* I am weak. (Lit. \"Present I weak\")",
          "appLine": 12
        },
        "change": {
          "kind": "single",
          "parts": [
            "predicate"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "basic-work-hard",
        "phase": "detail",
        "cue": "New example",
        "english": "I worked hard.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ku"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "ngāue"
          },
          {
            "id": "detail",
            "label": "DETAIL",
            "text": "mālohi"
          }
        ],
        "source": {
          "lesson": 3,
          "line": 60,
          "quote": "*Na'á ku ngāue mālohi.* I worked hard.",
          "appLine": 60
        },
        "change": {
          "kind": "reset",
          "parts": [
            "tense",
            "person",
            "predicate",
            "detail"
          ],
          "linked": []
        },
        "note": "After an action, mālohi adds the detail “hard”."
      },
      {
        "id": "basic-work-very-hard",
        "phase": "detail",
        "cue": "Add more detail",
        "english": "I worked very hard.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ku"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "ngāue"
          },
          {
            "id": "detail",
            "label": "DETAIL",
            "text": "mālohi"
          },
          {
            "id": "detail2",
            "label": "DETAIL",
            "text": "'aupito"
          }
        ],
        "source": {
          "lesson": 3,
          "line": 101,
          "quote": "*Na'á ku ngāue mālohi 'aupito.* I worked very hard.",
          "appLine": 101
        },
        "change": {
          "kind": "single",
          "parts": [
            "detail2"
          ],
          "linked": []
        },
        "note": ""
      }
    ]
  },
  {
    "id": "negative",
    "title": "Make it negative",
    "lessonLabel": "Lesson 9",
    "theme": "deep-red",
    "steps": [
      {
        "id": "negative-positive-i",
        "phase": "pattern",
        "cue": "Start positive",
        "english": "I am happy.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Oku"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ou"
          },
          {
            "id": "predicate",
            "label": "DESCRIPTION",
            "text": "fiefia"
          }
        ],
        "source": {
          "lesson": 9,
          "line": 10,
          "quote": "*'Oku ou fiefia.* I am happy.",
          "appLine": 10
        },
        "change": {
          "kind": "entry",
          "parts": [
            "tense",
            "person",
            "predicate",
            "punctuation"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "negative-present-i",
        "phase": "negative",
        "cue": "Add not",
        "english": "I am not happy.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Oku"
          },
          {
            "id": "negative",
            "label": "NOT",
            "text": "'ikai té"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "u"
          },
          {
            "id": "predicate",
            "label": "DESCRIPTION",
            "text": "fiefia"
          }
        ],
        "source": {
          "lesson": 9,
          "line": 12,
          "quote": "*'Oku 'ikai té u fiefia.* I am not happy. (Lit. \"Is not I happy\")",
          "appLine": 12
        },
        "change": {
          "kind": "linked",
          "parts": [
            "person",
            "negative"
          ],
          "linked": [
            {
              "part": "person",
              "because": "form-after-connector"
            }
          ]
        },
        "note": "After the negative connector, “I” takes the form u."
      },
      {
        "id": "negative-past-i",
        "phase": "time",
        "cue": "Change when",
        "english": "I was not happy.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'e"
          },
          {
            "id": "negative",
            "label": "NOT",
            "text": "'ikai té"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "u"
          },
          {
            "id": "predicate",
            "label": "DESCRIPTION",
            "text": "fiefia"
          }
        ],
        "source": {
          "lesson": 9,
          "line": 59,
          "quote": "| Past | *Na'e 'ikai té u fiefia.* | I was not happy. |",
          "appLine": 59
        },
        "change": {
          "kind": "single",
          "parts": [
            "tense"
          ],
          "linked": []
        },
        "note": "Before 'ikai, the past marker is na'e and the future marker is 'e."
      },
      {
        "id": "negative-future-i",
        "phase": "time",
        "cue": "Change when",
        "english": "I will not be happy.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'E"
          },
          {
            "id": "negative",
            "label": "NOT",
            "text": "'ikai té"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "u"
          },
          {
            "id": "predicate",
            "label": "DESCRIPTION",
            "text": "fiefia"
          }
        ],
        "source": {
          "lesson": 9,
          "line": 60,
          "quote": "| Future | *'E 'ikai té u fiefia.* | I will not be happy. |",
          "appLine": 60
        },
        "change": {
          "kind": "single",
          "parts": [
            "tense"
          ],
          "linked": []
        },
        "note": "Before 'ikai, the past marker is na'e and the future marker is 'e."
      },
      {
        "id": "negative-angry-he",
        "phase": "description",
        "cue": "New example",
        "english": "He is angry.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Okú"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ne"
          },
          {
            "id": "predicate",
            "label": "DESCRIPTION",
            "text": "'ita"
          }
        ],
        "source": {
          "lesson": 9,
          "line": 46,
          "quote": "| *'Okú ne 'ita.* He is angry. | *'Oku 'ikai té ne 'ita.* He is not angry. |",
          "appLine": 46
        },
        "change": {
          "kind": "reset",
          "parts": [
            "tense",
            "negative",
            "person",
            "predicate"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "negative-not-angry-he",
        "phase": "negative",
        "cue": "Add not",
        "english": "He is not angry.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Oku"
          },
          {
            "id": "negative",
            "label": "NOT",
            "text": "'ikai té"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ne"
          },
          {
            "id": "predicate",
            "label": "DESCRIPTION",
            "text": "'ita"
          }
        ],
        "source": {
          "lesson": 9,
          "line": 46,
          "quote": "| *'Okú ne 'ita.* He is angry. | *'Oku 'ikai té ne 'ita.* He is not angry. |",
          "appLine": 46
        },
        "change": {
          "kind": "linked",
          "parts": [
            "tense",
            "negative"
          ],
          "linked": [
            {
              "part": "tense",
              "because": "stress-shift"
            }
          ]
        },
        "note": "The tense stays present; the stress mark moves to té."
      },
      {
        "id": "negative-work-hard-he",
        "phase": "action",
        "cue": "New example",
        "english": "He does not work hard.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Oku"
          },
          {
            "id": "negative",
            "label": "NOT",
            "text": "'ikai té"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ne"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "ngāue"
          },
          {
            "id": "detail",
            "label": "DETAIL",
            "text": "mālohi"
          }
        ],
        "source": {
          "lesson": 9,
          "line": 80,
          "quote": "*'Oku 'ikai té ne ngāue mālohi.* He does not work hard.",
          "appLine": 80
        },
        "change": {
          "kind": "reset",
          "parts": [
            "predicate",
            "detail"
          ],
          "linked": []
        },
        "note": ""
      }
    ]
  },
  {
    "id": "questions",
    "title": "Ask a question",
    "lessonLabel": "Lessons 1, 6 & 11",
    "theme": "charcoal",
    "steps": [
      {
        "id": "questions-statement",
        "phase": "pattern",
        "cue": "Start with a statement",
        "english": "You ate.",
        "punctuation": ".",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 1,
          "line": 129,
          "quote": "*Na'á ke kai.* = You ate.",
          "appLine": 55
        },
        "change": {
          "kind": "entry",
          "parts": [
            "tense",
            "person",
            "predicate",
            "punctuation"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "questions-yes-no",
        "phase": "question",
        "cue": "Ask it",
        "english": "Did you eat?",
        "punctuation": "?",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "kai"
          }
        ],
        "source": {
          "lesson": 1,
          "line": 130,
          "quote": "*Na'á ke kai?* = Did you eat?",
          "appLine": 3
        },
        "change": {
          "kind": "single",
          "parts": [
            "punctuation"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "questions-drink",
        "phase": "action",
        "cue": "Change the action",
        "english": "Did you drink?",
        "punctuation": "?",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "inu"
          }
        ],
        "source": {
          "lesson": 1,
          "line": 143,
          "quote": "*Na'á ke inu?* Did you drink?",
          "appLine": 143
        },
        "change": {
          "kind": "single",
          "parts": [
            "predicate"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "questions-where-sleep",
        "phase": "where",
        "cue": "New example",
        "english": "Where did you sleep?",
        "punctuation": "?",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "mohe"
          },
          {
            "id": "detail",
            "label": "WHERE",
            "text": "'i fē"
          }
        ],
        "source": {
          "lesson": 6,
          "line": 69,
          "quote": "*Na'á ke mohe 'i fē?* Where did you sleep?",
          "appLine": 72
        },
        "change": {
          "kind": "reset",
          "parts": [
            "predicate",
            "detail"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "questions-where-stay",
        "phase": "action",
        "cue": "Change the action",
        "english": "Where did you stay?",
        "punctuation": "?",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "nofo"
          },
          {
            "id": "detail",
            "label": "WHERE",
            "text": "'i fē"
          }
        ],
        "source": {
          "lesson": 11,
          "line": 12,
          "quote": "*Na'á ke nofo 'i fē?* Where did you stay?",
          "appLine": 12
        },
        "change": {
          "kind": "single",
          "parts": [
            "predicate"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "questions-where-from",
        "phase": "where",
        "cue": "New example",
        "english": "Where did you come from?",
        "punctuation": "?",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Na'á"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "ha'u"
          },
          {
            "id": "detail",
            "label": "WHERE",
            "text": "mei fē"
          }
        ],
        "source": {
          "lesson": 11,
          "line": 20,
          "quote": "*Na'á ke ha'u mei fē?* Where did you come from?",
          "appLine": 20
        },
        "change": {
          "kind": "reset",
          "parts": [
            "predicate",
            "detail"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "questions-where-running",
        "phase": "where",
        "cue": "New example",
        "english": "Where are you running to?",
        "punctuation": "?",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "Té"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "ACTION",
            "text": "lele"
          },
          {
            "id": "detail",
            "label": "WHERE",
            "text": "ki fē"
          }
        ],
        "source": {
          "lesson": 11,
          "line": 14,
          "quote": "*Té ke lele ki fē?* Where are you running to?",
          "appLine": 14
        },
        "change": {
          "kind": "reset",
          "parts": [
            "tense",
            "predicate",
            "detail"
          ],
          "linked": []
        },
        "note": ""
      },
      {
        "id": "questions-how-are-you",
        "phase": "how",
        "cue": "New example",
        "english": "How are you?",
        "punctuation": "?",
        "parts": [
          {
            "id": "tense",
            "label": "WHEN",
            "text": "'Okú"
          },
          {
            "id": "person",
            "label": "WHO",
            "text": "ke"
          },
          {
            "id": "predicate",
            "label": "HOW",
            "text": "fēfē"
          }
        ],
        "source": {
          "lesson": 11,
          "line": 102,
          "quote": "*'Okú ke fēfē?* How are you? (Lit. \"You are how?\")",
          "appLine": 100
        },
        "change": {
          "kind": "reset",
          "parts": [
            "tense",
            "predicate",
            "detail"
          ],
          "linked": []
        },
        "note": ""
      }
    ]
  }
]

export const HOME_SENTENCE_FRAMES = HOME_SENTENCE_FAMILIES.flatMap((family, familyIndex) =>
  family.steps.map((step, stepIndex) => ({ ...step, familyId: family.id, familyIndex, stepIndex })),
)

export const PHASE_LABELS = {
  pattern: 'Pattern',
  time: 'Time',
  person: 'Person',
  action: 'Action',
  description: 'Description',
  detail: 'Detail',
  negative: 'Negative',
  question: 'Question',
  where: 'Where',
  how: 'How',
}

export function sentenceForStep(step) {
  return `${step.parts.map(part => part.text).join(' ')}${step.punctuation}`
}
