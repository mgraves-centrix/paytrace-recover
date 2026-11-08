# Maya walkthrough visual brief — 2026-11-08

Audience and task: a judge or first-time merchant following one fictional buyer from purchase through a checked recovery. Feeling: human, precise, reassuring. Preserve PayTrace's navy/blue identity and the existing eight-step interactive route.

Composition: a brief story premise sits above the step rail. Each chapter pairs Maya's short narrative with a case-evidence visualization; the right panel shows her voice, the question facing the merchant, and the four control gates. Chapter accents move from purchase blue to mismatch amber, investigation violet, correction blue, and verified green. Color never carries the state alone: text, counts, and checkmarks remain.

The evidence module uses real HTML/CSS rather than an image. Its sample marker stays adjacent to the evidence. The four specialist findings remain in the disclosure, and the fictional/no-provider-call boundary stays visible. Desktop keeps the rail; mobile uses a step selector and a persistent next action.

No new media, fonts, provider calls, or data claims. Motion is a short chapter entrance and is removed for reduced-motion users.

## Review record

| Check | Result |
| --- | --- |
| First and final chapters, desktop and mobile | PASS: narrative, buyer quote, merchant question, and next action remain legible. |
| 320, 390, 768, 1280, 1600 CSS px | PASS: no document horizontal overflow in the final chapter. |
| Fictional/connected distinction | PASS: sample marker, fictional boundary, and separate connected acceptance statement remain. |
| Screen-reader smoke test, text zoom, forced colors, contrast measurement | NOT TESTED in this pass. Source includes semantic headings, hidden decorative avatar, reduced-motion and forced-color styles; these are not a conformance claim. |
| Live provider sequence | NOT TESTED: this is a fictional sample route. |
