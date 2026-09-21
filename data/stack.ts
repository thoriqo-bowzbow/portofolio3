import stackIcons from './stack-icons.json'
import type { StackGroup } from './types'

/**
 * The three skill boxes in the About section, migrated from the supplied CV.
 *
 * The icon catalogue is emitted by `scripts/generate-assets.mjs` so the names and
 * slugs here cannot drift from the SVG files on disk.
 *
 * The CV's skill list is split across three boxes rather than presented as one
 * wall, and the group titles name the CV's own categories — the reference's
 * "Loved using" reads oddly above CCTV/NVR/DVR. Every skill the CV lists appears
 * exactly once, and nothing is added.
 */
export const stack: StackGroup[] = [
  { title: 'Networking', items: stackIcons.networking },
  { title: 'Systems & tooling', items: stackIcons.systems },
  { title: 'Support & hardware', items: stackIcons.support }
]
