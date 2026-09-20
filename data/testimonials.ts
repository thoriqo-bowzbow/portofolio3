import type { Testimonial } from './types'

const portrait = (n: number) => `/images/testimonials/portrait-${String(n).padStart(2, '0')}.svg`

export const testimonialsIntro =
  'The most useful feedback I get is specific: a screen that confused someone, a handover that went smoothly, a deadline that was met without drama. Here is some of it.'

export const testimonials: Testimonial[] = [
  {
    name: 'Ines Marques',
    role: 'Head of Product, Northline',
    quote:
      'Kamran is the rare engineer who argues about the product, not just the implementation. He rewrote our booking flow and somehow shipped fewer features while making the product feel twice as capable.',
    portrait: portrait(1)
  },
  {
    name: 'Tomas Berg',
    role: 'Engineering Manager, Cobalt Labs',
    quote:
      'He left behind a component library with documentation good enough that new hires read it voluntarily. That is the highest praise I can give a frontend engineer.',
    portrait: portrait(2)
  },
  {
    name: 'Priya Raghunathan',
    role: 'Design Lead, Northline',
    quote:
      'Working with Kamran made my designs better. He would push back with a reason and a prototype, and he was usually right. The spacing system we built together outlived the project.',
    portrait: portrait(3)
  },
  {
    name: 'Daniel Osei',
    role: 'Founder, Harbour Goods',
    quote:
      'I came in with a vague idea and a small budget. He scoped it honestly, built exactly what was needed, and the storefront has run for years without anyone touching it.',
    portrait: portrait(4)
  },
  {
    name: 'Marta Kowalczyk',
    role: 'CTO, Cobalt Labs',
    quote:
      'The migration he ran was the least dramatic rewrite I have witnessed. Weekly releases, no freeze, no rollback. He simply made the risky thing routine.',
    portrait: portrait(5)
  },
  {
    name: 'Yusuf Karim',
    role: 'Senior Engineer, Northline',
    quote:
      'He is generous with context. Every review came with the reasoning behind it, so you left knowing why rather than just what to change. I learned more from six months of his reviews than from most courses.',
    portrait: portrait(6)
  }
]
