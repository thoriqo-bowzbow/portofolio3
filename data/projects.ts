import type { Highlight } from './types'

/**
 * Selected work — intentionally empty.
 *
 * The supplied CV lists no projects, case studies, clients or delivered work, and
 * this repository must not invent any. The section, its four-column mosaic and its
 * reveal behaviour are all kept; the grid simply has no tiles until real projects
 * are added.
 *
 * To fill it: add entries below. `Highlight` is
 * `{ title, description, image, link?, featured? }`, and the mosaic resolves best
 * with exactly two `featured: true` tiles.
 */
export const highlights: Highlight[] = []
