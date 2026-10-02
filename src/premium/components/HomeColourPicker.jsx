import { HOME_COLOURS } from '../lib/home-colours.js'

export default function HomeColourPicker({ value, onChange }) {
  return (
    <fieldset className="wr-home-colour" aria-label="Choose the homepage and book colour">
      <legend>Choose a colour</legend>
      <div className="wr-home-colour__options">
        {HOME_COLOURS.map(colour => (
          <label key={colour.id} className="wr-home-colour__option">
            <input
              type="radio"
              name="home-colour"
              value={colour.id}
              checked={value === colour.id}
              onChange={() => onChange(colour.id)}
            />
            <span className="wr-home-colour__choice">
              <span className="wr-home-colour__swatch" data-colour={colour.id} aria-hidden="true">
                <span className="wr-home-colour__check">✓</span>
              </span>
              <span>{colour.label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
