import type { NavItem } from './types'

/**
 * Nav targets map 1:1 onto the section ids in pages/index.vue, which is what
 * makes the eased anchor travel in composables/useAnchorNav.ts work.
 */
export const navigation: NavItem[] = [
  { label: 'About', target: '#about' },
  { label: 'Experience', target: '#experience' },
  { label: 'Projects', target: '#projects' },
  { label: 'Testimonials', target: '#reviews' },
  { label: 'Contact', target: '#contact' }
]

/**
 * The header's primary action. It opens the request modal rather than navigating,
 * matching the reference, where "Get in touch" dispatches `openRequestModal`. The
 * contact section remains a standalone surface and is still reachable from the
 * "Contact" nav item.
 */
export const primaryCta = {
  label: 'Get in touch'
} as const
