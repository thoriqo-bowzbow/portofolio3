# Workflow & communication preferences

## Before implementing
- Does not start coding blindly: performs reconnaissance and writes the planning/analysis docs first. Confidence: 0.85
- Measures or inspects the real reference/source rather than guessing whenever inspection is possible. Confidence: 0.85
- Explicitly marks values that cannot be reliably determined as UNKNOWN instead of inventing them. Confidence: 0.85

## Version control & git
- Pushes to GitHub over HTTPS rather than SSH; states the method explicitly when delegating a push. Confidence: 0.8
- Provides credentials (e.g. a personal access token) inline in the request so the push can be executed immediately. Confidence: 0.65
- Wants commits grouped by feature ("sesuai fiturnya") — multiple scoped commits rather than one blanket commit for all pending changes. Confidence: 0.75
- Asks for the pending changes to be reviewed (diffs and new files) before they are staged and committed, rather than committed blindly. Confidence: 0.7
- When an issue is raised but not yet resolved, prefers to commit and push as-is ("apa adanya") and fix it in a later pass, rather than blocking the commit until everything is perfect. Confidence: 0.7
- Also has a fast-path mode where they explicitly ask to skip the review step and go straight to staging, committing and pushing ("langsung git add, git commit, git push tanpa review"). In that mode they accept the pushed code is unverified and will be checked later, so the agent should not pause to review diffs or block on build/typecheck. Confidence: 0.65
- Commit messages follow Conventional Commits with a scoped type (`fix(hero)`, `fix(a11y)`, `feat(scroll)`, `chore(taste)`) plus a substantive wrapped body that explains the cause, the reasoning and the trade-offs — not a one-line message. Confidence: 0.65
- Commits end with a `Co-authored-by: CommandCodeBot <noreply@commandcode.ai>` trailer. Confidence: 0.6
- Works directly on the `main` branch and pushes to `origin/main` after committing, rather than pushing a feature branch or opening a PR. Confidence: 0.6
- Expects commits to be authored consistently with the repo's previous commits; has no global git identity configured, so identity is set repo-locally to the existing author rather than invented. Confidence: 0.55

## Communication
- Writes requests in Indonesian (Bahasa Indonesia) and expects responses in the same language. Confidence: 0.8
- Gives terse, one-line goal instructions (e.g. "review, add, commit, lalu push ke github saya") and expects the agent to work out the details and run the whole review → verify → commit → push pipeline autonomously, without follow-up clarification questions. Confidence: 0.6
- Delegates technical/architectural decisions to the agent: asks "menurut kamu … cocok untuk saya?" and expects an opinionated, situation-specific recommendation (one concrete pick) justified with trade-offs against the alternatives, rather than a neutral menu of options or being asked to choose. Confidence: 0.5

## Verification
- Expects the agent to actually use the visual/browser tooling that is available (agent-browser, ffmpeg, vision) to confirm visual changes itself — screenshots, computed styles, rendered output — instead of declaring a visual result unverifiable or handing the check back to the user. Confidence: 0.8
- Does not declare a goal complete until it is verified end-to-end — production build succeeds, no critical console/runtime errors, no obvious layout or overflow bugs — rather than stopping at a working MVP. Confidence: 0.85
- Documents remaining known deviations and limitations in writing rather than silently ignoring them. Confidence: 0.85
- Expects the repository to be runnable by another developer without undocumented manual setup steps. Confidence: 0.8
- Verifies responsive behaviour across an explicit set of named viewports and device sizes rather than spot-checking a single width. Confidence: 0.7

## Delivery structure
- Breaks a large build into explicit ordered phases with defined outputs (recon → foundation → build → motion → responsive → visual QA → production hardening) rather than delivering it in one pass. Confidence: 0.65

## Content & assets
- Uses original content and assets; does not copy protected text, photographs, logos or illustrations. Confidence: 0.85
