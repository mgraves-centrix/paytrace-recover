# Agent decision brief review — 2026-11-08

Change / routes: Merchant case view in `/focus.html`; model-backed specialist instructions in `server/ai.mjs`. The saved review, approval, and grant rules remain unchanged.

Visual brief: Continue the existing PayTrace case dashboard. Insert one compact, scannable decision brief between the case replay and detailed specialist findings. It explains what supports the current decision, what could overturn it, and the next safe evidence/action step without adding a score or pretending an AI inference is a verified fact.

Desktop / mobile visual review: PASS in the in-app browser at 1280 and 390 CSS px for a reviewed fictional case. The initial three-column treatment was too compressed in the case column; it was changed to labeled rows and rechecked. At 320, 390, 768, 1280, and 1600 CSS px, document width did not exceed viewport width. The brief uses text labels as well as color to distinguish holds.

Behavior review: PASS for ready, missing-payment, conflicting-payment, open-objection, stale-review, and historical-write states in focused tests. The brief is derived from current saved records and mandatory checks; it cannot authorize a change. The model prompt now asks each specialist to identify decision-relevant counterevidence or the key missing fact in its uncertainty field. Model outputs remain cited and constrained by the deterministic review gates. Untrusted brief text is escaped before insertion into HTML.

Automated checks: `npm test` PASS (346 tests); `npm run check:review-links` PASS (60 targets); `node --check server/ai.mjs` PASS; `git diff --check` PASS.

Not tested: Live OpenAI responses, a connected PayPal sandbox case through this new brief, formal screen-reader or axe audit, 200% text enlargement, 400% zoom, forced colors, and complete WCAG 2.2 AA evaluation. The viewport checks establish no horizontal overflow, not full accessibility conformance. Screenshots were inspected in the browser session but not saved as repository assets.

Pre-existing gap: The app still needs provider-backed acceptance evidence before describing a specific recovery as connected and verified.
