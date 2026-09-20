import type { Highlight } from './types'

const img = (n: number) => `/images/highlights/hl-${String(n).padStart(2, '0')}.svg`

/**
 * Ten tiles filling a 4-column mosaic. `featured` tiles occupy a 2×2 cell —
 * exactly two are featured so the grid resolves in the reference's proportions.
 */
export const highlights: Highlight[] = [
  {
    title: 'Atlas Booking',
    description:
      'A multi-operator reservation platform rebuilt around a single state machine. Availability, dynamic pricing and payment all read from one source of truth, which removed an entire class of bugs and made the flow legible to the people maintaining it.',
    image: img(1),
    link: { label: 'Visit site', href: 'https://example.com', external: true },
    featured: true
  },
  {
    title: 'Ledger',
    description: 'Reconciliation console for finance teams.',
    image: img(2),
    link: { label: 'Visit site', href: 'https://example.com', external: true }
  },
  {
    title: 'Console',
    description: 'Composable analytics workspace.',
    image: img(3),
    link: { label: 'Visit site', href: 'https://example.com', external: true }
  },
  {
    title: 'Harbour Goods',
    description: 'Made-to-order storefront.',
    image: img(4),
    link: { label: 'Visit site', href: 'https://example.com', external: true }
  },
  {
    title: 'Waypoint',
    description: 'Canvas route planning with offline drafts.',
    image: img(5),
    link: { label: 'Visit site', href: 'https://example.com', external: true }
  },
  {
    title: 'Beacon',
    description: 'Generated component documentation.',
    image: img(6),
    link: { label: 'Visit site', href: 'https://example.com', external: true }
  },
  {
    title: 'Fieldnote',
    description:
      'An offline-first capture tool for site surveyors. Photographs are annotated on device, queued locally and reconciled when a connection returns — with a conflict model the field team helped design.',
    image: img(7),
    link: { label: 'Visit site', href: 'https://example.com', external: true },
    featured: true
  },
  {
    title: 'Relay',
    description: 'Realtime notification and digest layer.',
    image: img(8),
    link: { label: 'Visit site', href: 'https://example.com', external: true }
  },
  {
    title: 'Kestrel',
    description: 'Editable marketing and content system.',
    image: img(9),
    link: { label: 'Visit site', href: 'https://example.com', external: true }
  },
  {
    title: 'Driftwood',
    description: 'Booking and payments for a small tour operator. Dispatched entirely in six weeks.',
    image: img(10),
    link: { label: 'Visit site', href: 'https://example.com', external: true }
  }
]
