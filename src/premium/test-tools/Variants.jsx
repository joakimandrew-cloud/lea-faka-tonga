/**
 * Test builds only. The capture variants of the lesson page that the plan
 * 2026-11-05-lesson-page-simplify shot for Andrew: the two structures he did not choose
 * (?structure=b, ?structure=c), Look 2 (?look=2), the tile comparison (?view=tile-compare)
 * and one figure alone (?solo=15.1). A production build never reaches this file.
 */
import { useEffect } from 'react'
import Figure from '../figure-engine/Figure.jsx'
import { Look2Figure, StructureB, StructureC, TileCompare } from './Alternatives.jsx'

function Solo({ figures, id }) {
  const def = figures.find(item => item.id === id)
  useEffect(() => {
    document.documentElement.dataset.solo = 'true'
    return () => { delete document.documentElement.dataset.solo }
  }, [])
  if (!def) return <p>No figure {id}</p>
  return <div className="pl pl-solo"><Figure def={def} autoplay={false} /></div>
}

export default function Variant({ which, figures = [], id, ...page }) {
  if (which === 'look2') return <Look2Figure />
  if (which === 'tile-compare') return <TileCompare />
  if (which === 'solo') return <Solo figures={figures} id={id} />
  if (which === 'b') return <StructureB {...page} figures={figures} />
  if (which === 'c') return <StructureC {...page} def={figures.find(item => item.id === '15.1') || figures[0]} />
  return null
}
