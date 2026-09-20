import stackIcons from './stack-icons.json'
import type { StackGroup } from './types'

/**
 * The icon catalogue is emitted by scripts/generate-assets.mjs so the names and
 * slugs here cannot drift from the SVG files on disk.
 */
export const stack: StackGroup[] = [
  { title: 'My professional stack', items: stackIcons.core },
  { title: 'Had an experience with', items: stackIcons.experienced },
  { title: 'Loved using', items: stackIcons.favoured }
]
