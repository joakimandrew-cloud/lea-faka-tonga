export function matchesDrill(drill, query) {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return true
  return [drill.title, drill.blurb, drill.action, `lesson ${drill.ch}`, `ch ${drill.ch}`]
    .some(value => String(value ?? '').toLocaleLowerCase().includes(needle))
}

export function filterDrillGroups(groups, query = '', level = 'all') {
  return groups.map(group => ({
    ...group,
    visible: group.drills.filter(drill => (
      (level === 'all' || drill.level === level) && matchesDrill(drill, query)
    )),
  }))
}

