# Digital-order sample review — 2026-11-08

Change / routes: `/digital-orders.html`, plus entry links in `/focus.html` and `/demo-resources.html`. The connected course flow was not changed.

Visual brief: Keep PayTrace's navy and blue identity. Present a single order as a compact case dashboard: purchase, evidence, scripted specialist findings, an exact proposed assignment, and separate activation proof. Preserve explicit fictional-sample labeling at the hero, payment, actions, and footer.

Desktop / mobile visual review: PASS for the first view at 1280 CSS px and a 390 CSS px mobile view in the in-app browser. The case purpose, sample status, evidence, and next action are legible. The completed state was stepped through and its evidence headline corrected to reflect assignment and activation. Page widths at 320, 390, 768, 1280, and 1600 CSS px show no horizontal document overflow. No external imagery is required for this evidence dashboard.

Interaction and safety review: PASS for the scripted path from payment through investigation, preview, sample approval, one sample assignment, and activation check. The route makes no network calls and says that a provider connector is needed for connected license recovery. The model tests cover mismatched purchase fields, stale preview/approval, and the one-write guard. Generated text is HTML-escaped. A heading receives focus after each step.

Automated checks: `npm test` PASS (343 tests), `npm run check:review-links` PASS (60 local targets), `git diff --check` PASS. New route has the existing strict CSP policy.

Not tested: A live license-provider integration, real buyer confirmation, formal screen-reader session, axe scan, 200% text, 400% zoom, Windows forced colors, and full WCAG 2.2 AA evaluation. The route is a browser-only illustrative sample; it makes no connected-result claim.

Pre-existing gap: The connected app still supports course access as its reference fulfillment integration. General digital orders need provider-specific entitlement reads, approved writes, and independent outcome checks before a live recovery claim.
