import type { Profile } from './types'

const logo = (name: string) => ({
  name,
  src: `/icons/stack/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.svg`
})

export const profile: Profile = {
  displayName: 'Kamran',
  fullName: 'Kamran Yusupov',
  role: 'Frontend Engineer',
  location: 'Lisbon, Portugal',
  positioning: 'Frontend engineer who ships interfaces that feel inevitable.',

  intro:
    'I am a Frontend Engineer. I build interfaces where the type, the spacing and the motion all agree with each other — for eight years across product teams, design systems and more rewrites than I care to count.',

  /**
   * Body copy is authored as short fragments, each rendered as its own <p> with
   * no margin. Consecutive fragments therefore read as continuous prose while
   * inking in one line at a time as they cross the reveal line — the reference's
   * signature line-by-line wave (RECON §3, §7.3).
   */
  bio: [
    'I grew up taking things apart.',
    'Radios first, then the family computer, then websites.',
    'I studied information systems at a university that taught Java and very little else.',

    'My first two years of work were spent building admin forms nobody enjoyed using.',
    'That taught me more about interface design than any course did.',

    'The turning point was a project where I was finally allowed to own the whole front end.',
    'I found that what I cared about most was not the code.',
    'It was the moment a screen stops feeling like software and starts feeling like a tool.',

    'Since then I have worked on booking flows, dashboards, marketplaces and consoles.',
    'The domains change; the questions do not.',
    'What is this screen for? What should the eye find first? What can I remove?',

    'I care about performance as a design property.',
    'A page that arrives late has already failed, however good it looks in a screenshot.',

    'I have a strong preference for boring technology.',
    'Most of what I know came from reading other people\u2019s code,',
    'and from listening carefully when someone told me a screen felt wrong.',

    'I like working close to designers.',
    'The best interfaces I have been part of came out of conversations where neither of us',
    'was defending a position, only trying to make the thing better.',

    'Documentation is part of the work, not a chore after it.',
    'Accessibility is not a phase at the end — if a keyboard user cannot finish the flow,',
    'the feature is not finished.',

    'If you are building something where the details matter and the timeline is honest,',
    'I would like to hear about it.'
  ],

  logoStrips: [
    {
      afterParagraph: 2,
      logos: ['TypeScript', 'Vue', 'Nuxt', 'Sass'].map(logo)
    },
    {
      afterParagraph: 8,
      logos: ['Vite', 'Webpack', 'GSAP', 'Storybook'].map(logo)
    },
    {
      afterParagraph: 14,
      logos: ['Figma', 'Accessibility', 'Design Systems', 'Testing'].map(logo)
    },
    {
      afterParagraph: 19,
      logos: ['GraphQL', 'PostgreSQL', 'Docker', 'Playwright'].map(logo)
    }
  ],

  footerBlurb:
    'A conventional footer would put a sitemap, a newsletter form and four social icons here. This site has all of that above, so instead here is the line I keep coming back to.',

  quote: {
    text: 'Make it work, make it right, make it fast.',
    attribution: 'Kent Beck'
  },

  credits: {
    builtWith: 'Nuxt, TypeScript, SCSS, GSAP',
    updated: 'September 2026'
  }
}
