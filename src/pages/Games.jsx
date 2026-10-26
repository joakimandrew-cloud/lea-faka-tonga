import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import EntryMotif from '@app/premium/components/EntryMotif.jsx'
import T from '@app/premium/components/T.jsx'
import { useTitle } from '@app/premium/lib/title.js'
import { GAMES } from '@app/games/registry.js'

export function GameCard({ game, sample }) {
  return (
    <Link className="catalog-card" to={game.route}>
      <span className="catalog-card-top">
        <span>Game</span>
        <span>{game.words} {game.unit ?? 'words'}</span>
      </span>
      <span className="catalog-sample" aria-hidden="true">
        <span>{sample.q}</span>
        <T>{sample.ton}</T>
      </span>
      <strong>{game.title}</strong>
      <span className="catalog-card-copy">{game.blurb}</span>
      <span className="catalog-card-action">{game.action} <EntryMotif size={20} /></span>
    </Link>
  )
}

export default function Games() {
  useTitle('Games')
  const samples = useMemo(() => GAMES.map(game => game.sample()), [])
  return (
    <div className="catalog-page games-page">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Games · Practice by play</p>
          <h1 className="display">Play with<br />the words.</h1>
          <p>Short games over the course words and the book’s own sentences. Pick one and play a round.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <p className="catalog-count">{GAMES.length} {GAMES.length === 1 ? 'game' : 'games'}</p>
        <div className="catalog-grid" data-testid="games-grid">
          {GAMES.map((game, i) => <GameCard key={game.key} game={game} sample={samples[i]} />)}
        </div>
      </div>
    </div>
  )
}
