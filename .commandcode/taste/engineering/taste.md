# Engineering preferences

## Stack & tooling
- For frontend work, reaches for Nuxt 3 + Vue 3 + TypeScript + SCSS as the default stack rather than leaving the choice open. Confidence: 0.8
- Uses GSAP with ScrollTrigger for scroll-driven animation, and Lenis for smooth scrolling. Confidence: 0.75
- Avoids unnecessary UI frameworks and prefers hand-authored SCSS over utility/framework CSS; keeps the dependency list deliberately minimal. Confidence: 0.8

## Architecture
- Structures projects modularly: separate components per major section, organised into subfolders (e.g. `layout/`, `sections/`, `ui/`) rather than one large page component. Confidence: 0.85
- Keeps content/data separate from presentation — content lives in dedicated, typed data modules, and presentational components receive it as props. Confidence: 0.85
- Centralises the visual system in SCSS variables, mixins, typography rules and responsive tokens rather than scattering values through components. Confidence: 0.85

## Code quality
- Expects names and labels to match what an element actually does — a link that opens WhatsApp should be labelled "WhatsApp", not left as "Phone" — and treats a stale label surviving a behaviour change as sloppiness. Confidence: 0.65
- Respects `prefers-reduced-motion`; animation must degrade gracefully rather than being assumed. Confidence: 0.85
- Cleans up animation resources properly on unmount — GSAP timelines, ScrollTriggers, event listeners and timers. Confidence: 0.8
- Treats mobile as a deliberately designed layout rather than a shrunken desktop. Confidence: 0.8
- Does not invent behaviour (e.g. motion, effects) merely to make something look interesting — matches the spec or reference instead. Confidence: 0.75

## Visual design
- Likes restrained interactive states for icons and small marks: monochrome/muted at rest, revealing their colour or accent on hover, and animated with a real transition rather than switching instantly. Confidence: 0.75
- Wants that idle-monochrome → hover-colour treatment applied uniformly across the whole set: when a new icon/card is added it must animate exactly like its siblings ("animasi harus sama kaya yang lainnya, diem monokrom, kena sentuhan jadi berwarna"), and a near-equivalent item already in the set should be folded into the same pattern rather than left as an exception. Confidence: 0.7
- Prioritises text legibility over decorative overlap: primary text (e.g. the name/title) must sit in front of decorative graphics, and logos or sculptural foreground art are layered behind the text, never drawn over it. Confidence: 0.8
- Wants scroll-following ("sticky") section titles: the title in a section's left column should stick and travel with its right-hand content until that section ends, then hand over to the next section — and the pattern must be applied consistently to every section sharing that layout, not just the one requested. Confidence: 0.55
- Cares about the readability of secondary/small text as much as the headline — flags anything that looks washed out or low-contrast, and expects an honest assessment with a concrete explanation/fix rather than reassurance that it looks fine. Confidence: 0.6

## Links & external services
- Wants contact links to land in the service the message is actually sent from rather than a generic protocol handler: a Gmail compose link (`mail.google.com/mail/?view=cm…`) instead of `mailto:`, and `wa.me` instead of `tel:` — so one click opens a pre-addressed message. Confidence: 0.7
- Each contact entry should carry the destination service's own brand mark (LinkedIn's "in" glyph, Gmail's M, GitHub's Octocat) and name that service as its label, rather than a generic icon (a plain network/chat glyph) with a vague label like "Code". Confidence: 0.7
- When the official brand colour would defeat the monochrome→colour hover reveal (e.g. GitHub's official black sitting too close to the flattened dormant state), opts for a non-official but recognisable colour so the hover still reads as a colour change — the interaction beats strict brand-guideline compliance. Confidence: 0.55
- Newly added icons must sit at the same optical size as their neighbours; a mark whose path fills its full viewBox is expected to be scaled/re-centred to match rather than left visibly larger. Confidence: 0.5

## Product scope
- Weighs a feature by what it costs to own, not just what it does: when a feature needs a backend/secret/third-party service and its job is already covered by a simpler one-click path (a contact form vs. already-present Gmail/WhatsApp cards), prefers deleting it and keeping the surface small over building the infrastructure. Comfortable removing an entire component that nothing else uses. Confidence: 0.6

## Performance
- Optimises assets and delivery (optimised images, lazy loading where appropriate, no unnecessary dependencies) but treats it as a hard constraint that optimisation must not change the visual result. Confidence: 0.7
