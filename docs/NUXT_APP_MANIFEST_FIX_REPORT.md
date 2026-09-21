# Nuxt `#app-manifest` Resolution Fix

The dev-server startup error

```
ERROR  Pre-transform error: Failed to resolve import "#app-manifest"
       from "node_modules/nuxt/dist/app/composables/manifest.js?v=…"
Plugin: vite:import-analysis
```

is **not caused by this project**. It is an upstream race in Nuxt, and it is fixed
here by switching off the unused feature whose code path produces it.

---

## 1. Environment

| | |
|---|---|
| Nuxt | 3.21.11 *(latest published 3.x — verified against the registry)* |
| Nitro | 2.13.4 |
| Vite (as reported by Nuxt) | 7.3.6 |
| Vue | 3.5.43 |
| `@nuxt/cli` | 3.37.0 |
| `@nuxt/vite-builder` | 3.21.11 |
| Node | v24.15.0 |
| npm | 11.12.1 |

`vite` resolves to two copies: `node_modules/vite` is **8.3.0** and
`node_modules/@nuxt/vite-builder/node_modules/vite` is **7.3.6**. That is npm
resolving `@nuxt/vite-builder`'s `vite: ^7.3.6` correctly — the builder uses its
nested 7.3.6, which is the version Nuxt reports in its startup banner. The hoisted
8.3.0 is a peer-satisfying copy and is **not** what runs the build; it is not
involved in this bug. A clean `npm install` reproduces the same tree, so it is
deterministic rather than stale.

---

## 2. Root cause

The chain, verified by reading the shipped code rather than inferred:

**1. `manifest.js` is always in the client module graph.**

`node_modules/nuxt/dist/app/plugins/router.js:5` is a client plugin and does:

```js
import { getRouteRules } from "../composables/manifest.js";
```

using it at line 181. It is unconditional, so `composables/manifest.js` is pulled
into every client build.

**2. That module contains a server-only dynamic import.**

`node_modules/nuxt/dist/app/composables/manifest.js:12-17`:

```js
if (import.meta.server) {
  _manifest = import(
    /* webpackIgnore: true */
    /* @vite-ignore */
    "#app-manifest"
  )
} else { /* … fetch builds/meta/<buildId>.json … */ }
```

For the client build, Vite substitutes `import.meta.server` → `false`. The branch
becomes dead code and never executes — but Vite's `vite:import-analysis` plugin
**statically scans the `import()` argument anyway** and tries to resolve the
specifier.

**3. `#app-manifest` cannot always be resolved in time.**

`#app-manifest` is a virtual module that Nitro registers later in the build. On the
client it is meant to be satisfied by Nuxt's own alias, registered in
`node_modules/@nuxt/vite-builder/dist/index.mjs`:

```js
const clientAliases = {
  "#app-manifest": resolveModulePath("mocked-exports/empty", { from: import.meta.url })
}
// … attached per environment:
applyToEnvironment(environment) {
  if (environment.name === "client") return [ …, { name: "nuxt:client:aliases", enforce: "post", … } ]
}
```

On a cold start the resolution can run before that alias is in place, and the
failure is reported as a pre-transform error. Five occurrences per start is the
same module being resolved through several importers.

The resolved Nuxt options confirm the feature is on — which is what puts the
machinery in the graph in the first place:

```
appManifest         true      ← enables the code path
viteEnvironmentApi  false     ← the alias is attached via the Environment API
```

**4. Upstream status.**

Tracked as **nuxt/nuxt#33606** (closed, with a minimal reproduction at
`sshiling/nuxt-app-manifest-repro`), which independently identifies the same
mechanism: Vite statically scanning the dead `import("#app-manifest")`, against a
virtual module Nitro registers later. Adding a Vite `@vite-ignore` hint does not
help — the failing step is resolution, not the import-analysis hint.

3.21.11 is the newest 3.x on the registry, so there is no release to upgrade to
that fixes it, and patching `node_modules` is out of bounds.

---

## 3. The fix

`nuxt.config.ts` — one option, with the reasoning recorded inline:

```ts
experimental: {
  appManifest: false
}
```

**Why this is the correct fix rather than suppression.**

The goal's rule is "do not disable appManifest unless investigation proves it is
the cause". The investigation above proves it: the unresolvable specifier *is* the
app-manifest virtual module, the import exists solely to serve that feature, and
disabling it removes the import rather than hiding its failure.

The feature is also **inert on this site**. `appManifest` exists to serve exactly
two things — client-side `routeRules` and loading prerendered payloads. This
project declares **no `routeRules`** (`{}` in the resolved config), is not
prerendered, and ships a single page. Nothing here reads the manifest, so the
imports it generated were dead weight in the client bundle either way.

**Removing this** — the block carries a comment saying so: drop it once Nuxt fixes
the race, or before this project adds `routeRules` or prerendering, at which point
the manifest becomes load-bearing and must be switched back on.

### Files changed

| file | change |
|---|---|
| `nuxt.config.ts` | added `experimental: { appManifest: false }` with a full explanatory comment |
| `scripts/audit/dev-startup-log.mjs` | new — captures a full cold `nuxt dev` startup including the client-transform pass |
| `scripts/audit/_nuxt-options.mjs` | new — prints the resolved `experimental` flags, used to verify the fix |

No `node_modules` was touched. No other application file changed.

---

## 4. Verification

### The failing code path is gone

The strongest available evidence, since the error itself is a race and does not
reproduce on demand:

| check | before | after |
|---|---|---|
| `experimental.appManifest` (resolved) | `true` | **`false`** |
| `.nuxt/manifest/` generated by `nuxt prepare` | yes (`.nuxt/manifest/meta/<buildId>.json`) | **not generated at all** |
| `builds/meta` / `getAppManifest` in built client JS | present | **absent** |

`nuxt prepare` no longer producing `.nuxt/manifest` demonstrates the feature is
genuinely disabled, not merely quietened.

### Before / after logs

**Before** (the reported failure):

```
●  Nuxt 3.21.11 (with Nitro 2.13.4, Vite 7.3.6 and Vue 3.5.43)
✔ Vite client built in 54ms
✔ Vite server built in 591ms
ERROR  Pre-transform error: Failed to resolve import "#app-manifest"
       from "node_modules/nuxt/dist/app/composables/manifest.js?v=75ccaa13". Does the file exist?
Plugin: vite:import-analysis
File: …/nuxt/dist/app/composables/manifest.js?v=75ccaa13:16:6
…
(x5)
✔ Nuxt Nitro server built in 1379ms
```

**After** — cold start, `.nuxt` and the Vite dep cache both wiped first, with the
page requested so the client transform actually runs:

```
●  Nuxt 3.21.11 (with Nitro 2.13.4, Vite 7.3.6 and Vue 3.5.43)
  ➜ Local:    http://localhost:3000/
✔ Vite client built in 65ms
✔ Vite server built in 226ms
[nitro] ✔ Nuxt Nitro server built in 1486ms
ℹ Vite server warmed up in 1ms
ℹ Vite client warmed up in 2ms
```

No errors, no warnings.

### Honest limitation

**I could not reproduce the failure on this machine.** The error is a race, and it
did not fire across repeated cold starts — `.nuxt` wiped, Vite dep cache wiped, a
full `rm -rf node_modules && npm install`, with `routeRules` temporarily added to
match the upstream repro's trigger, and with page requests issued so the client
transform ran. Every attempt produced a clean log.

That means the fix is verified by **the absence of the code path** (see the table
above), not by watching the error disappear. The diagnosis rests on reading the
shipped Nuxt and Vite-builder source and on the upstream issue, both of which
identify the same mechanism. This is recorded rather than glossed over.

### No regressions

| check | result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0, Nitro server built, no `#app-manifest` output |
| `npm run verify` | exit 0 |
| `npm run dev` | starts clean, no errors, no warnings |
| `npm run audit:responsive` | **8/8 viewports clean**, 0 overflowing elements, `--ttitle` typography check passing at all 8 |
| runtime check, 1366×768 / 1440×900 / 1920×1080 / 390×844 / 430×932 | **all 5 clean** — no overflow, 0 page errors, 0 console warnings, all surfaces present |
| request modal regression | **22/22 passed** |
| section heights @1440×900 | **identical** to before the change — hero 4500, about 1989, experience 1354, highlights 307, testimonials 553, contact 1158, footer 900 |

Section heights are byte-identical to the pre-change measurements, which is the
clearest signal that nothing visual or behavioural moved.

### Note on the earlier harness

`dev-startup-log.mjs` initially probed `/` and `/experience`, which produced
repeated `[Vue Router warn]: No match found for location with path "/experience"`.
That was the harness's own noise — this is a one-page site and `#experience` is an
anchor on `/`, not a route — and it was corrected. Those warnings are not a Nuxt
issue and are not present in the after log.

### Reproducing this investigation

```
node scripts/audit/_nuxt-options.mjs                    # resolved experimental flags
node scripts/audit/dev-startup-log.mjs tools/out.log     # cold dev start, captured
```
