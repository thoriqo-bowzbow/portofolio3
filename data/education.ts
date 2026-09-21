import type { Education } from './types'

/**
 * Education, migrated from the supplied CV.
 *
 * The CV lists one entry: SMA Negeri 1 Anjatan, IPS track, July 2020 – May 2023,
 * with an Ujian Sekolah result of 89.14/100. All four values are the CV's own.
 *
 * The reference has no education section, so this is presented inside the existing
 * Experience timeline rather than as a new band — the layout is unchanged and the
 * same `ExperienceRow` renders it. See §3 of the migration report.
 */
export const education: Education[] = [
  {
    institution: 'SMA Negeri 1 Anjatan',
    context: 'IPS',
    period: 'July 2020 — May 2023',
    result: 'Ujian Sekolah 89.14/100'
  }
]
