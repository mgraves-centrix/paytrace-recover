# Learner course delivery review · 2026-11-10

Scope: `/course.html`, the private customer-page link, course case labeling, and the 77-second submission review cut. Shared frontend standards version 1.1. Light theme; Codex in-app browser.

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Private entry | PASS | An unauthenticated course visit showed only the private-link guidance. The live private case API returned 401 without a session. |
| Locked state | PASS | A private fictional case without verified access rendered the same first lesson as locked; no lesson body was present. |
| Ready and open state | PASS | A verified private case rendered “Access ready”; clicking Open fetched protected lesson text through `/api/customer/lesson`. |
| Safety boundary | PASS | The course-service key is absent from browser code. The existing lesson endpoint checks current proof and exact course identity; the route and customer endpoints retain CSP, frame, and session protections. |
| Visual and reflow | PASS for tested sizes | Reviewed rendered 1280px desktop and 320px mobile views. At 320px, document scroll width was 305px, body text 16px, and the primary action 48px high. |
| Automated behavior | PASS | `npm test` (354 tests); focused customer/security tests (14 tests); `node --check`; `git diff --check`. |
| Video export | PASS for file integrity and sampled frames | 77.25-second H.264/AAC MP4. Sampled visual frames were reviewed. Fictional, connected, and visual-preview sections have distinct labels. |
| Live static release | PASS for route and health checks | `/course.html`, `/course.css`, `/course.mjs`, and the customer link returned 200; `/health` remained 200. No restart was requested. The server-side mode projection and CSP header change await a full Node release; the page has its own CSP meta policy and a conservative label fallback. |
| Audio and captions | NOT TESTED | The source audio is retained with short fades, but narration quality and exact words could not be listened to here. Accurate captions were not produced. Review both before publication. |
| Live connected buyer visit to new course page | NOT TESTED | The browser check used local in-memory fictional fixtures; the recorded connected case predates the new course page. |
| Full accessibility conformance | NOT TESTED | No automated axe runner or screen-reader smoke test was available for this route. 200% text enlargement, 400% zoom, forced colors, and text-spacing overrides remain to be manually checked. No WCAG conformance claim is made. |

The video is a review cut. Its course cards are labeled visual previews; the connected footage is a separate recorded case. Replace those previews with a fresh one-case course journey and add checked captions for the final submission.
