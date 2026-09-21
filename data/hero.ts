import type { HeroStory } from './types'

/**
 * The three narrative blocks that the 500vh hero scrolls through.
 *
 * The CV has no narrative prose, so each block is built from one area of the
 * CV's own skill list — support, networking, infrastructure. No claim is made
 * about a project, an employer or a result; the text only names what the CV says
 * the person works with.
 *
 * `numeral` is rendered oversized at low opacity behind each portrait. The
 * portraits are the same original figure studies the rest of the site uses — they
 * are decorative, and are not presented as photographs of anyone.
 */
export const heroStories: HeroStory[] = [
  {
    numeral: '01',
    title: 'Support',
    description:
      'End-user support, helpdesk work and IT asset management. Windows, Linux and macOS desktops, PC and laptop repair, and the day-to-day requests that keep a team working.',
    image: '/images/testimonials/portrait-02.svg',
    actions: [
      { label: 'Contact', href: '#contact' },
      { label: 'Download CV', href: '/cv.pdf', external: true }
    ]
  },
  {
    numeral: '02',
    title: 'Networks',
    description:
      'TCP/IP, subnetting, routing and switching, and LAN and WLAN work on MikroTik and Ruijie Reyee equipment. Structured cabling in UTP and fibre, terminated and tested with a fusion splicer, OTDR and OPM.',
    image: '/images/testimonials/portrait-05.svg',
    actions: [
      { label: 'See the experience', href: '#experience' },
      { label: 'Skills', href: '#about' }
    ]
  },
  {
    numeral: '03',
    title: 'Infrastructure',
    description:
      'Local server administration, backup and recovery, and scripting in Python. Git, CI/CD and Docker where it helps, plus AI and API integration including agentic tools, MCP and plugin work.',
    image: '/images/testimonials/portrait-03.svg',
    actions: [
      { label: 'Contact', href: '#contact' },
      { label: 'Download CV', href: '/cv.pdf', external: true }
    ]
  }
]
