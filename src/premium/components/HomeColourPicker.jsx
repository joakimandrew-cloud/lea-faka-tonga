import { HOME_COLOURS } from '../lib/home-colours.js'

// Four small dots under the book (2026-11-17). Each is still a labelled radio button; the label is read out, not printed.
export default function HomeColourPicker({ value, onChange }) {
  return (
    <fieldset className="wr-home-colour" aria-label="Choose the homepage and book colour">
      <legend>Choose a colour</legend>
      <div className="wr-home-colour__options">
        {HOME_COLOURS.map(colour => (
          <label key={colour.id} className="wr-home-colour__option" title={colour.label}>
            <input
              type="radio"
              name="home-colour"
              value={colour.id}
              checked={value === colour.id}
              onChange={() => onChange(colour.id)}
            />
            <span className="wr-home-colour__swatch" data-colour={colour.id} aria-hidden="true" />
            <span className="wr-home-colour__name">{colour.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
