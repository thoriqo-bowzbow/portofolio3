import type { HeroStory } from './types'

/**
 * The three narrative blocks that the 500vh hero scrolls through.
 * `numeral` is rendered oversized at low opacity behind each portrait.
 */
export const heroStories: HeroStory[] = [
  {
    numeral: '01',
    title: 'Craft',
    description:
      'Interfaces are a series of small decisions nobody notices when they are right. Spacing, contrast, the weight of a border, how long a transition should take — I sweat all of it, because that is where the quality actually lives.',
    image: '/images/testimonials/portrait-02.svg',
    actions: [
      { label: 'Book a call', href: '#contact' },
      { label: 'Download CV', href: '/cv.pdf', external: true }
    ]
  },
  {
    numeral: '02',
    title: 'Systems',
    description:
      'I have built design systems from nothing and rescued ones that had drifted. The work is less about components and more about agreeing what a good decision looks like, then making that decision cheap to repeat.',
    image: '/images/testimonials/portrait-05.svg',
    actions: [
      { label: 'See the work', href: '#experience' },
      { label: 'How I work', href: '#about' }
    ]
  },
  {
    numeral: '03',
    title: 'Speed',
    description:
      'Performance is a design property, not a cleanup task. I measure early, budget deliberately and treat every kilobyte as a decision someone has to justify. Fast pages feel considered.',
    image: '/images/testimonials/portrait-03.svg',
    actions: [
      { label: 'Get in touch', href: '#contact' },
      { label: 'Read the notes', href: '#projects' }
    ]
  }
]
