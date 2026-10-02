import charts from '../data/reference-charts.js'
import '../styles/v11-components.css'

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
