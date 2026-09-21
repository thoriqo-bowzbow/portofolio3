import type { Role } from './types'

/** Normalised 120×50 marks emitted by scripts/generate-assets.mjs. */
const mark = (name: string) =>
  `/images/project-marks/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.svg`

export const experience: Role[] = [
  {
    organisation: 'Northline',
    context: 'Product studio building booking and logistics platforms for European operators.',
    period: '2022 — Present',
    summary: [
      'I joined as the third engineer and now lead frontend across three concurrent platforms. I own the architecture, the design system and the release process, and I review every interface that ships.',
      'The largest piece of work was rebuilding the booking flow around a single state machine. Availability, pricing, seat selection and payment all read from one source of truth, which removed an entire class of bugs and cut median completion time by roughly a third.',
      'I introduced a shared token layer — colour, type scale, spacing rhythm and motion — so that four products now inherit the same visual language instead of each drifting in its own direction.',
      'Performance work has been continuous rather than a project. Route-level code splitting, a deliberate image policy and a bundle budget enforced in CI took the worst dashboard from a 4.4s to a 1.2s first interaction on a mid-tier laptop.',
      'I run the frontend guild and mentor two engineers, which is mostly an excuse to argue productively about tooling and to make sure nobody is quietly stuck.',
      'Day to day I spend more time in design reviews and specification than I did earlier in my career, and I think that is the right trade for someone at this level.',
      'The thing I am proudest of is not a feature. It is that the frontend has had no unplanned weekend work in two years, because the release process is boring and the tests tell the truth.'
    ],
    projects: [
      {
        name: 'Atlas Booking',
        logo: mark('Atlas Booking'),
        description:
          'The multi-operator reservation platform. Live availability across operators, dynamic pricing rules, seat maps, and a checkout designed to survive intermittent connections — it queues intent locally and reconciles when the network returns, which matters a great deal on a ferry.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/atlas-booking', external: true }
      },
      {
        name: 'Ledger',
        logo: mark('Ledger'),
        description:
          'A reconciliation and dispute console for the finance team. Built for people who spend eight hours a day in it: dense tables that stay readable, keyboard-first navigation, and saved views instead of a filter builder nobody asked for.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/ledger', external: true }
      },
      {
        name: 'Waypoint',
        logo: mark('Waypoint'),
        description:
          'Route planning for operations staff, with a canvas map layer, offline draft routes, and optimistic sync that resolves conflicts by asking rather than guessing.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/waypoint', external: true }
      }
    ]
  },
  {
    organisation: 'Cobalt Labs',
    context: 'Series B SaaS company. Small team, wide surface area, very fast release cadence.',
    period: '2019 — 2022',
    summary: [
      'I was the second frontend hire. The product had grown organically for three years and the interface had drifted into four competing visual languages, so the first six months were spent consolidating rather than adding.',
      'I built the component library that the product was still using four years later, along with the documentation site that kept it honest. Both were deliberately unglamorous: plain, typed, and documented with real examples rather than prop tables alone.',
      'Moving the app from a single bundle to route-level code splitting took dashboard first interaction from 4.1s to 1.3s on a mid-tier laptop. Most of the win came from deleting two charting libraries nobody had audited.',
      'I ran the migration off the older framework incrementally. We shipped to production every week throughout instead of freezing a branch for a quarter — slower on paper, dramatically less risky in practice.',
      'I set up the visual regression suite that still gates releases. It catches the class of change that unit tests never will, and it has paid for itself several times over.',
      'Working at this size meant owning things well outside my job description — release tooling, the design review process, and a fair amount of customer support triage.',
      'The migration is the work I would point at if asked what I am good at. It was unglamorous, incremental, and it never once required a rollback, because every step was small enough to be reversible.'
    ],
    projects: [
      {
        name: 'Console',
        logo: mark('Console'),
        description:
          'The analytics workspace. Composable dashboards, saved views, and a query builder that non-engineers genuinely use — the hardest constraint was making a powerful tool feel forgiving without hiding what it was doing.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/console', external: true }
      },
      {
        name: 'Beacon',
        logo: mark('Beacon'),
        description:
          'Documentation and component playground generated from source at build time, with live prop editing, rendered accessibility notes, and visual snapshots attached to each example.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/beacon', external: true }
      },
      {
        name: 'Relay',
        logo: mark('Relay'),
        description:
          'The notification layer. Delivery preferences per channel, digest batching that respects time zones, and an activity log transparent enough that support could stop answering the same question.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/relay', external: true }
      }
    ]
  },
  {
    organisation: 'Independent practice',
    context: 'Working directly with founders and small product teams on scoped engagements.',
    period: '2017 — 2019',
    summary: [
      'I worked on my own for two years before joining a team, taking projects end to end: scoping, interface design, frontend, deployment, and the awkward conversation when a deadline moved.',
      'The work was unglamorous and extremely varied — marketing sites, storefronts, a booking system for a tour operator, an internal tool for a research consultancy, and one project I would rather not discuss.',
      'I learned to write contracts, estimate honestly and say no. Those turned out to be the most transferable skills of the period, considerably more so than any framework I picked up.',
      'Being the only technical person on a project forced me to explain trade-offs to people who did not care about the implementation, which is a skill I still use daily.',
      'Two clients from this era are still running sites I built, largely untouched. I take that as a compliment about the code rather than a criticism of their ambition.',
      'I would not go back to freelancing full time, but I am glad I did it first. It taught me what a project actually costs, which makes me considerably easier to work with now.'
    ],
    projects: [
      {
        name: 'Harbour Goods',
        logo: mark('Harbour Goods'),
        description:
          'A storefront for an independent furniture maker, with a made-to-order configurator, finish selection, and a checkout that handles deposits against a long lead time.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/harbour-goods', external: true }
      },
      {
        name: 'Kestrel',
        logo: mark('Kestrel'),
        description:
          'A marketing site and content system for a research consultancy, built so that people who do not write HTML could still publish a report without breaking the layout.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/kestrel', external: true }
      },
      {
        name: 'Fieldnote',
        logo: mark('Fieldnote'),
        description:
          'An offline-first note capture tool for site surveyors: annotated photographs, structured observations, and a sync model the field team helped design because they were the ones losing data.',
        link: { label: 'Visit site', href: 'https://kamran.dev/work/fieldnote', external: true }
      }
    ]
  }
]
