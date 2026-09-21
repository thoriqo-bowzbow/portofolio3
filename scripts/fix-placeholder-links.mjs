/**
 * Replaces the `https://example.com` placeholders in the project/experience data
 * with per-project URLs under the site's own domain.
 *
 * Each link is rewritten from the project `name` that precedes it, so the result
 * is stable and reviewable rather than nineteen identical filler hosts.
 *
 *   node scripts/fix-placeholder-links.mjs [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const write = process.argv.includes('--write')

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

let total = 0

for (const rel of ['data/experience.ts', 'data/projects.ts']) {
  const file = join(root, rel)
  let src = readFileSync(file, 'utf8')
  let count = 0

  // Walk the file, tracking the most recent project name so each link knows which
  // project it belongs to. `experience.ts` keys projects on `name`, `projects.ts`
  // on `title`; both are matched.
  src = src.replace(
    /(name|title): '([^']+)'([\s\S]*?)href: 'https:\/\/example\.com'/g,
    (m, key, name, between) => {
      count++
      return `${key}: '${name}'${between}href: 'https://kamran.dev/work/${slug(name)}'`
    }
  )

  total += count
  console.log(`${rel}: ${count} link(s) rewritten`)
  if (write) writeFileSync(file, src)
}

console.log(write ? `\nwrote ${total} link(s)` : `\n${total} link(s) would change — pass --write to apply`)
