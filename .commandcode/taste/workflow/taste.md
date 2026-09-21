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

## Communication
- Writes requests in Indonesian (Bahasa Indonesia) and expects responses in the same language. Confidence: 0.7
- Gives terse, one-line goal instructions (e.g. "review, add, commit, lalu push ke github saya") and expects the agent to work out the details and run the whole review → verify → commit → push pipeline autonomously, without follow-up clarification questions. Confidence: 0.6

## Verification
- Does not declare a goal complete until it is verified end-to-end — production build succeeds, no critical console/runtime errors, no obvious layout or overflow bugs — rather than stopping at a working MVP. Confidence: 0.85
- Documents remaining known deviations and limitations in writing rather than silently ignoring them. Confidence: 0.85
- Expects the repository to be runnable by another developer without undocumented manual setup steps. Confidence: 0.8
- Verifies responsive behaviour across an explicit set of named viewports and device sizes rather than spot-checking a single width. Confidence: 0.7

## Delivery structure
- Breaks a large build into explicit ordered phases with defined outputs (recon → foundation → build → motion → responsive → visual QA → production hardening) rather than delivering it in one pass. Confidence: 0.65

## Content & assets
- Uses original content and assets; does not copy protected text, photographs, logos or illustrations. Confidence: 0.85
