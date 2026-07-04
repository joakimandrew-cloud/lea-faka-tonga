import '../styles/v11-components.css'

const charts = [
  {
    id: 'preposed',
    title: 'Preposed Pronouns',
    description: 'Subject markers that follow tense particles (na\u02BBa, \u02BBoku, kuo, te).',
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
      'ku: after na\u02BBa (past)',
      'ou: after \u02BBoku (present)',
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
    description: 'Used before nouns to show possession. \u02BBe-class is for things you control or produce; ho-class is for inherent or permanent things.',
    tables: [
      {
        label: '\u02BBe-class',
        sublabel: 'actions, thoughts, children, food, tools',
        headers: ['', 'Singular', 'Dual', 'Plural'],
        rows: [
          ['1st excl.', '\u02BBeku', '\u02BBema', '\u02BBemau'],
          ['1st incl.', '\u2013', '\u02BBeta', '\u02BBetau'],
          ['2nd', 'ho\u02BBo', 'ho\u02BBomo', 'ho\u02BBomou'],
          ['3rd', '\u02BBene', '\u02BBena', '\u02BBenau'],
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
        label: '\u02BBe-class',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', 'ha\u02BBaku', 'ha\u02BBamau'],
          ['1st incl.', '\u2013', 'ha\u02BBatau'],
          ['2nd', 'ha\u02BBo', 'ha\u02BBamou'],
          ['3rd', 'ha\u02BBane', 'ha\u02BBanau'],
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
      '\u02BBa hai? whose? (\u02BBe-class)',
      '\u02BBo hai? whose? (ho-class)',
    ],
  },
  {
    id: 'postposed-poss',
    title: 'Postposed Possessives',
    description: 'Used after the noun: "the book is mine" rather than "my book"',
    tables: [
      {
        label: '\u02BBe-class',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', '\u02BBa\u02BBaku', '\u02BBa\u02BBamau'],
          ['1st incl.', '\u2013', '\u02BBa\u02BBatau'],
          ['2nd', '\u02BBa\u02BBau', '\u02BBa\u02BBamou'],
          ['3rd', '\u02BBa\u02BBana', '\u02BBa\u02BBanau'],
        ],
      },
      {
        label: 'ho-class',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', '\u02BBo\u02BBoku', '\u02BBo\u02BBomau'],
          ['1st incl.', '\u2013', '\u02BBo\u02BBotau'],
          ['2nd', '\u02BBo\u02BBou', '\u02BBo\u02BBomou'],
          ['3rd', '\u02BBo\u02BBona', '\u02BBo\u02BBonau'],
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
        label: '\u02BBe-class (ma\u02BBa + pronoun)',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', 'ma\u02BBaku', 'ma\u02BBamau'],
          ['1st incl.', '\u2013', 'ma\u02BBatau'],
          ['2nd', 'ma\u02BBau', 'ma\u02BBamou'],
          ['3rd', 'ma\u02BBana', 'ma\u02BBanau'],
        ],
      },
      {
        label: 'ho-class (mo\u02BBo + pronoun)',
        headers: ['', 'Singular', 'Plural'],
        rows: [
          ['1st excl.', 'mo\u02BBoku', 'mo\u02BBomau'],
          ['1st incl.', '\u2013', 'mo\u02BBotau'],
          ['2nd', 'mo\u02BBou', 'mo\u02BBomou'],
          ['3rd', 'mo\u02BBona', 'mo\u02BBonau'],
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
        headers: ['Person', '\u02BBe-class', 'ho-class'],
        rows: [
          ['1st sing.', 'si\u02BBeku', 'si\u02BBoku'],
          ['2nd sing.', 'si\u02BBo', 'si\u02BBo'],
          ['3rd sing.', 'si\u02BBene', 'si\u02BBono'],
          ['1st excl. pl.', 'si\u02BBemau', 'si\u02BBomau'],
          ['1st incl. pl.', 'si\u02BBetau', 'si\u02BBotau'],
          ['2nd pl.', 'si\u02BBomou', 'si\u02BBomou'],
          ['3rd pl.', 'si\u02BBenau', 'si\u02BBonau'],
        ],
      },
    ],
    notes: [
      'si\u02BBa: emotional indefinite article ("a poor/dear ...")',
    ],
  },
  {
    id: 'impersonal',
    title: 'Impersonal Forms',
    description: 'Generic "one" / "oneself" forms used for general statements.',
    tables: [
      {
        headers: ['Type', '\u02BBe-class', 'ho-class'],
        rows: [
          ['Pronoun', 'kita', 'kita'],
          ['Definite possessive', '\u02BBete', 'hoto'],
          ['Indefinite possessive', 'ha\u02BBate', 'hato'],
          ['Postposed possessive', '\u02BBa\u02BBata', '\u02BBo\u02BBota'],
          ['Beneficiary', 'ma\u02BBata', 'mo\u02BBota'],
        ],
      },
    ],
    notes: [],
  },
]

export default function ReferenceCharts() {
  // Stacked "book page": every chart flows down the page in the chapter
  // reading voice (black ink, book-style grid tables), like a reference
  // section lifted from the book. No tabs, no colour. (2026-06-16)
  return (
    <div className="reading-page">
      <div className="ref">
        {charts.map(chart => (
          <section key={chart.id} className="ref-chart">
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
          </section>
        ))}
      </div>
    </div>
  )
}
