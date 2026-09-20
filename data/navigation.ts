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

export const primaryCta = {
  label: 'Get in touch',
  target: '#contact'
} as const
