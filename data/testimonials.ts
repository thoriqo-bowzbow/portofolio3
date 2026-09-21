import type { Testimonial } from './types'

/**
 * Testimonials — intentionally empty.
 *
 * The supplied CV lists no referees, clients or quotations, and the previous
 * contents were invented for the demo identity (named people at invented
 * employers). Fabricated testimonials are the single most damaging thing a
 * portfolio can carry, so the list is empty and the section says so.
 *
 * The layout is unchanged: the heading, the subtitle, and the **"Leave yours"**
 * action and its review modal all remain, so the section is still a working
 * invitation for real reviewers rather than a hole in the page.
 *
 * To fill it: add entries below. `Testimonial` is
 * `{ name, role, quote, portrait }`, and the staircase reads best with six.
 * Portraits come from `/images/testimonials/portrait-01…06.svg`.
 */
export const testimonials: Testimonial[] = []

/**
 * Shown above the mosaic. Rewritten for the empty state: the previous copy
 * claimed the site was already displaying feedback.
 */
export const testimonialsIntro =
  'Reviews are collected here as clients and colleagues send them. Nothing is published without permission, and nothing on this page is written on anyone else’s behalf.'
