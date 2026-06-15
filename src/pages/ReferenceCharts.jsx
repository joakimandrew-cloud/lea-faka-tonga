import { useState } from 'react'
import '../styles/v11-components.css'

const charts = [
  {
    id: 'preposed',
    title: 'Preposed Pronouns',
    description: 'Subject markers that follow tense particles (na\u2019a, \u2019oku, kuo, te).',
    tables: [
      {
        headers: ['', 'Singular', 'Dual', 'Plural'],
        rows: [
          ['1st excl.', 'ku / ou / u', 'ma', 'mau'],
          ['1st incl.', '\u2013', 'ta', 'tau'],
          ['2nd', 'ke', 'mo', 'mou'],
          ['3rd', 'ne', 'na', 'nau'],
        ],
      },
    ],
    notes: [
      'ku: after na\u2019a (past)',
      'ou: after \u2019oku (present)',
      'u: after kuo (perfect), te (future)',
    ],
  },
  {
    id: 'postposed',
    title: 'Postposed Pronouns',
    description: 'Emphatic and object forms. Used for emphasis or after prepositions.',
    tables: [
      {
        headers: ['', 'Singular', 'Dual', 'Plural'],
        rows: [
          ['1st excl.', 'au', 'kimaua', 'kimautolu'],
          ['1st incl.', '\u2013', 'kitaua', 'kitautolu'],
          ['2nd', 'koe', 'kimoua', 'kimoutolu'],
          ['3rd', 'ia', 'kinaua', 'kinautolu'],
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'definite',
    title: 'Definite Possessives',
    description: 'Used before nouns to show possession. \u2019e-class is for things you control or produce; ho-class is for inherent or permanent things.',
    tables: [
      {
        label: '\u2019e-class',
        sublabel: 'actions, thoughts, children, food, tools',
        headers: ['', 'Singular', 'Dual', 'Plural'],
        rows: [
          ['1st excl.', '\u2019eku', '\u2019ema', '\u2019emau'],
          ['1st incl.', '\u2013', '\u2019eta', '\u2019etau'],
          ['2nd', 'ho\u2019o', '\u2019emo', 'ho\u2019omou'],
          ['3rd', '\u2019ene', '\u2013', '\u2019enau'],
        ],
      },
      {
        label: 'ho-class',
        sublabel: 'body parts, relatives, house, land',
        headers: ['', 'Singular', 'Dual', 'Plural'],
        rows: [
          ['1st excl.', 'hoku', 'homa', 'homau'],
          ['1st incl.', '\u2013', 'hota', 'hotau'],
          ['2nd', 'ho', 'homo', 'homou'],
          ['3rd', 'hono', 'hona', 'honau'],
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'indefinite',
    title: 'Indefinite Possessives',
    description: 'Used with indefinite nouns: "a ... of mine" rather than "my ..."',
    tables: [
      {
        label: '\u2019e-class',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', 'ha\u2019aku', 'ha\u2019amau'],
          ['1st incl.', '\u2013', 'ha\u2019atau'],
          ['2nd', 'ha\u2019o', 'ha\u2019amou'],
          ['3rd', 'ha\u2019ane', 'ha\u2019anau'],
        ],
      },
      {
        label: 'ho-class',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', 'haku', 'hamau'],
          ['1st incl.', '\u2013', 'hatau'],
          ['2nd', 'hao', 'hamou'],
          ['3rd', 'hano', 'hanau'],
        ],
      },
    ],
    notes: [
      '\u2019a hai? whose? (\u2019e-class)',
      '\u2019o hai? whose? (ho-class)',
    ],
  },
  {
    id: 'postposed-poss',
    title: 'Postposed Possessives',
    description: 'Used after the noun: "the book is mine" rather than "my book"',
    tables: [
      {
        label: '\u2019e-class',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', '\u2019a\u2019aku', '\u2019a\u2019amau'],
          ['1st incl.', '\u2013', '\u2019a\u2019atau'],
          ['2nd', '\u2019a\u2019au', '\u2019a\u2019amou'],
          ['3rd', '\u2019a\u2019ana', '\u2019a\u2019anau'],
        ],
      },
      {
        label: 'ho-class',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', '\u2019o\u2019oku', '\u2019o\u2019omau'],
          ['1st incl.', '\u2013', '\u2019o\u2019otau'],
          ['2nd', '\u2019o\u2019ou', '\u2019o\u2019omou'],
          ['3rd', '\u2019o\u2019ona', '\u2019o\u2019onau'],
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'beneficiary',
    title: 'Beneficiary Pronouns',
    description: 'Express "for someone": who the action benefits.',
    tables: [
      {
        label: '\u2019e-class (ma\u2019a + pronoun)',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', 'ma\u2019aku', 'ma\u2019amau'],
          ['1st incl.', '\u2013', 'ma\u2019atau'],
          ['2nd', 'ma\u2019au', 'ma\u2019amou'],
          ['3rd', 'ma\u2019ana', 'ma\u2019anau'],
        ],
      },
      {
        label: 'ho-class (mo\u2019o + pronoun)',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', 'mo\u2019oku', '\u2013'],
          ['1st incl.', '\u2013', 'mo\u2019otau'],
          ['2nd', 'mo\u2019ou', '\u2013'],
          ['3rd', 'mo\u2019ona', 'mo\u2019onau'],
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'emotional',
    title: 'Emotional Possessives',
    description: 'Express pity or affection: "my poor ..." or "my dear ..."',
    tables: [
      {
        headers: ['Person', '\u2019e-class', 'ho-class'],
        rows: [
          ['1st sing.', 'si\u2019eku', 'si\u2019oku'],
          ['2nd sing.', 'si\u2019o', 'si\u2019o'],
          ['3rd sing.', 'si\u2019ene', 'si\u2019ono'],
          ['1st incl. pl.', 'si\u2019etau', 'si\u2019otau'],
          ['1st excl. pl.', 'si\u2019emau', 'si\u2019omau'],
          ['2nd pl.', 'si\u2019omou', 'si\u2019omou'],
          ['3rd pl.', 'si\u2019enau', 'si\u2019onau'],
        ],
      },
    ],
    notes: [
      'si\u2019a: emotional indefinite article ("a poor/dear ...")',
    ],
  },
  {
    id: 'impersonal',
    title: 'Impersonal Forms',
    description: 'Generic "one" / "oneself" forms used for general statements.',
    tables: [
      {
        headers: ['Type', '\u2019e-class', 'ho-class'],
        rows: [
          ['Pronoun', 'kita', 'kita'],
          ['Definite possessive', '\u2019ete', 'hoto'],
          ['Indefinite possessive', 'ha\u2019ate', 'hato'],
          ['Postposed possessive', '\u2019a\u2019ata', '\u2019o\u2019ota'],
          ['Beneficiary', 'ma\u2019ata', 'mo\u2019ota'],
        ],
      },
    ],
    notes: [],
  },
]

export default function ReferenceCharts() {
  const [selected, setSelected] = useState(charts[0].id)
  const chart = charts.find(c => c.id === selected)

  return (
    <div className="ref">

      <div className="ref-tabs">
        {charts.map(c => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`ref-tab${selected === c.id ? ' is-active' : ''}`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {chart && (
        <div className="ref-chart">
          <div>
            <h2 className="ref-chart-title">{chart.title}</h2>
            {chart.description && (
              <p className="ref-chart-desc">{chart.description}</p>
            )}
          </div>

          {chart.tables.map((table, ti) => (
            <div key={ti} className="ref-table-group">
              {table.label && (
                <div>
                  <div className="ref-sublabel">{table.label}</div>
                  {table.sublabel && (
                    <div className="ref-sublabel-hint">{table.sublabel}</div>
                  )}
                </div>
              )}
              <div className="ref-table-wrap">
                <table className="ref-table">
                  <thead>
                    <tr>
                      {table.headers.map((h, hi) => (
                        <th key={hi}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={cell === '\u2013' ? 'is-empty' : undefined}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {chart.notes.length > 0 && (
            <div className="ref-notes">
              {chart.notes.map((note, ni) => (
                <div key={ni}>{note}</div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
