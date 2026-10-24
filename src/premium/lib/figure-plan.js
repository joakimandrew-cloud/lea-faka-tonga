// What each column of a lesson's teaching.paradigm is, for the figure engine
// (reviews/lesson-course-2026-10-24/Direction.md, "The figure engine").
// Numbers and letters only; the Tongan always comes from chapters.json.
// Roles: L English row label · K Tongan row key · F Tongan form (switchable)
// E Tongan example · G English gloss · X English or mixed note · t Tongan note.
export const FIGURE_PLAN = {
  1: { v: 'bespoke' },
  2: { v: 'switch', roles: 'LFFF' },   3: { v: 'rules' },
  4: { v: 'switch', roles: 'FGFG' },   5: { v: 'switch', roles: 'FFG' },
  6: { v: 'ladder', roles: 'FG' },     7: { v: 'switch', roles: 'KFFF' },
  8: { v: 'ladder', roles: 'LXE' },    9: { v: 'ladder', roles: 'LFG' },
  10: { v: 'switch', roles: 'FFF' },   11: { v: 'ladder', roles: 'FG' },
  12: { v: 'ladder', roles: 'LEG' },   13: { v: 'ladder', roles: 'EGE' },
  14: { v: 'rules' },                  15: { v: 'switch', roles: 'FF' },
  16: { v: 'ladder', roles: 'LEG' },   17: { v: 'switch', roles: 'LFF' },
  18: { v: 'ladder', roles: 'LtEG', primary: 2 }, 19: { v: 'ladder', roles: 'LtE' },
  20: { v: 'ladder', roles: 'LF' },    21: { v: 'ladder', roles: 'KXE' },
  22: { v: 'ladder', roles: 'KXG' },   23: { v: 'ladder', roles: 'KGE' },
  24: { v: 'ladder', roles: 'KGX' },   25: { v: 'ladder', roles: 'KXE' },
  26: { v: 'switch', roles: 'FFG' },   27: { v: 'switch', roles: 'FFF' },
  28: { v: 'ladder', roles: 'KXE' },   29: { v: 'switch', roles: 'LFF' },
  30: { v: 'ladder', roles: 'KG' },    31: { v: 'rules' },
  32: { v: 'switch', roles: 'FFG' },   33: { v: 'switch', roles: 'FFX' },
  34: { v: 'rules' },                  35: { v: 'ladder', roles: 'FG' },
  36: { v: 'switch', roles: 'FF' },    37: { v: 'switch', roles: 'LFF' },
  38: { v: 'rules' },                  39: { v: 'switch', roles: 'LFFFF' },
  40: { v: 'ladder', roles: 'KGE' },   41: { v: 'ladder', roles: 'KGGG' },
  42: { v: 'ladder', roles: 'FG' },    43: { v: 'ladder', roles: 'KGX' },
  44: { v: 'ladder', roles: 'LtXE', primary: 3 }, 45: { v: 'switch', roles: 'FFE' },
  46: { v: 'switch', roles: 'LXFF' },  47: { v: 'ladder', roles: 'KXXE' },
  48: { v: 'ladder', roles: 'KGE' },   49: { v: 'ladder', roles: 'KGE' },
  50: { v: 'switch', roles: 'FFG' },   51: { v: 'switch', roles: 'LFF' },
  52: { v: 'switch', roles: 'LFF' },
}
