import { loadNuxtConfig } from '@nuxt/kit'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const config = await loadNuxtConfig({ cwd: root })

const interesting = [
  'appManifest',
  'viteEnvironmentApi',
  'clientNodeCompat',
  'payloadExtraction',
  'renderJsonPayloads',
  'ssr'
]

console.log('=== resolved experimental / build options ===')
for (const key of interesting) {
  const value = key === 'ssr' ? config.ssr : config.experimental?.[key]
  console.log(`${key.padEnd(24)} ${JSON.stringify(value)}`)
}

console.log('')
console.log('=== routeRules ===')
console.log(JSON.stringify(config.routeRules ?? null))
console.log('')
console.log('=== nitro ===')
console.log(JSON.stringify({ compressPublicAssets: config.nitro?.compressPublicAssets }))
