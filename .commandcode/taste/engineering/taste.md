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
- Respects `prefers-reduced-motion`; animation must degrade gracefully rather than being assumed. Confidence: 0.85
- Cleans up animation resources properly on unmount — GSAP timelines, ScrollTriggers, event listeners and timers. Confidence: 0.8
- Treats mobile as a deliberately designed layout rather than a shrunken desktop. Confidence: 0.8
- Does not invent behaviour (e.g. motion, effects) merely to make something look interesting — matches the spec or reference instead. Confidence: 0.75
