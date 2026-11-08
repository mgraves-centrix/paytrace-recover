# Case command view · visual brief and review

Date: 2026-11-08. Route: `focus.html` when a case is open. Shared frontend standards: v1.1.

The merchant needs to identify the next safe action, see what the payment and access records establish, and follow the case through preview, approval, and verification. The intended feel is calm, precise, and capable. Keep PayTrace navy and blue; reserve green for confirmed facts and amber for missing access. The case itself is the visual subject: a four-stage rail, a compact purchase identity, and a three-part evidence path. No decorative image or invented metric is needed. At narrow widths, put the decision before the evidence and keep every stage visible. Motion only indicates a genuinely working agent and stops under reduced motion.

Reference: the user-supplied photo of the live case screen dated 2026-11-08. Preserve the existing product shell and the honest distinction between sample and sandbox evidence; improve the hierarchy, navigation, type scale, and contrast of the case view.

Review record:

- PASS — Visual inspection in the local in-app browser at desktop (default width), 768px, 390px, and 320px. The current stage, case state, next action, evidence flow, and agent status have distinct hierarchy. At 768px and below, the next-action panel precedes evidence. No horizontal document overflow at 390px or 320px.
- PASS — All four stages remain visible at 320px. Section links jump to the correct content; the selected section link updates. The case approval and refresh controls remain the existing server-backed actions.
- PASS — `npm test`, `node --check dist/focus-case-design.mjs`, and `git diff --check`.
- NOT TESTED — Automated accessibility scan, screen reader, forced-colors rendering, 200% text enlargement, 400% browser zoom, and text-spacing override. These need a browser/accessibility pass before any WCAG conformance claim.
- NOT TESTED — The authenticated Azure case during a running model workflow. The local visual review used a fictional sample case. The design does not change model, payment, approval, or grant logic.

The previous case screen had small secondary labels and crowded first-view sections. The changed view raises the new labels and navigation to at least 12px and keeps the existing below-the-fold records available through the full-record disclosure. Older, untouched panels may still contain smaller text; this change does not assert that the whole app meets the shared standard.

Case-origin follow-up (2026-11-08): The case header, dashboard worklist, and full queue now distinguish a completed PayPal sandbox capture from a pending sandbox checkout and a fictional sample. The connected label explicitly says that no live charge was made. The local browser review covered the sample state at desktop and 390px mobile, including no horizontal overflow; the connected state was checked through source classification and rendering tests, not a fresh provider checkout.

Full-record follow-up (2026-11-08): The expanded evidence and audit area now presents four compact dossiers: decision evidence, AI investigation, recovery and verification, and audit/customer context. Source records and decision gates retain their existing controls and honest sample labels. The first dossier opens from the existing “Inspect checks” shortcut; opening the full record alone leaves all four dossiers collapsed so the user can choose a path. Late-mounted timeline and chapter records are placed in the audit dossier. PASS: local in-app browser visual review at desktop and 390px, disclosure interaction and group contents, no document overflow at 390px, 339 automated tests, syntax and diff checks. NOT TESTED: authenticated connected-case rendering, automated accessibility scan, screen reader, zoom/text-spacing, and forced-colors review. No payment, approval, or access-grant behavior changed.
