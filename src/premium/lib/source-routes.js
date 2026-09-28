import { GROUPS, LEVELS } from '@app/data/drills-catalog.js'
import { drillRegistry } from '@app/drills/registry.js'
import { BESPOKE, routeFor } from '@app/lib/drill-routes.js'
import { filterDrillGroups } from './catalog-query.js'

export { GROUPS, LEVELS }

export const REGISTERED_DRILL_IDS = Object.freeze(Object.keys(drillRegistry))
export const REGISTERED_DRILL_ID_SET = new Set(REGISTERED_DRILL_IDS)
export const CATALOG_DRILL_ID_SET = new Set(GROUPS.flatMap(group => [...group.drills, ...group.inChapters]).map(drill => drill.id))
export const UNCATALOGUED_DRILLS = Object.freeze(REGISTERED_DRILL_IDS
  .filter(id => !CATALOG_DRILL_ID_SET.has(id))
  .map(id => ({ id, ...drillRegistry[id].meta })))

// Preserve the richer source destinations, including their teaching asides.
export const PREMIUM_BESPOKE_ROUTES = Object.freeze({ ...BESPOKE })
export const premiumRouteFor = routeFor

export function filteredDrillGroups(query = '', level = 'all') {
  return filterDrillGroups(GROUPS, query, level)
}

export function isRegisteredDrill(id) {
  return REGISTERED_DRILL_ID_SET.has(id)
}
