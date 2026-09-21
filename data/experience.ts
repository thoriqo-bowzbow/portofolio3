import type { Role } from './types'

/**
 * Employment history, migrated from the supplied CV.
 *
 * Three roles, in the CV's own order, with the CV's own employer names, job
 * titles and dates. Nothing is added: the CV lists each role as a title, an
 * employer and a date range, with **no description of the work performed**, so
 * `summary` carries an explicit TODO rather than invented responsibilities.
 *
 * The CV lists no projects for any role, so every `projects` array is empty. The
 * section, its layout and its reveal behaviour are unchanged — the project grid
 * simply has nothing to render yet.
 */
export const experience: Role[] = [
  {
    organisation: 'PT. Wahana Harta Nusantara',
    context: 'IT Support',
    period: 'April — September 2026',
    summary: [
      'TODO(content): the CV lists this role and its dates without a description. Add the responsibilities and outcomes here.'
    ],
    projects: []
  },
  {
    organisation: 'Venous Group',
    context: 'Network Engineer & Technical Lead',
    period: 'June 2024 — December 2025',
    summary: [
      'TODO(content): the CV lists this role and its dates without a description. Add the responsibilities and outcomes here.'
    ],
    projects: []
  },
  {
    organisation: 'CV. Kahe Group',
    context: 'Admin Operasional',
    period: 'October 2023 — June 2024',
    summary: [
      'TODO(content): the CV lists this role and its dates without a description. Add the responsibilities and outcomes here.'
    ],
    projects: []
  }
]
