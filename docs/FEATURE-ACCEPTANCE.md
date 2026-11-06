# Feature acceptance matrix

Updated November 5, 2026 for main `608b8de`. This maps implemented features to representative local tests and the external evidence still needed. A passing local test does not prove a PayPal checkout, model response, Render run, course delivery, or customer email occurred.

| Feature | Local evidence | Connected evidence still needed |
| --- | --- | --- |
| Merchant Today view, queue and case actions | `tests/today-experience.test.mjs`, `tests/focus-actions.test.mjs`, `tests/case-layout-dom.test.mjs` | Unassisted merchant walkthrough on desktop and mobile |
| Exact PayPal purchase matching and payment holds | `tests/paypal-fail-closed.test.mjs`, `tests/paypal-webhook.test.mjs` | Buyer-approved sandbox capture and signed adverse-payment delivery |
| Four AI specialist review and objections | `tests/agent-workbench.test.mjs`, `tests/ai-endpoint.test.mjs` | Model-backed review of the same captured sandbox purchase |
| Exact approval, one correction and retry-safe verification | `tests/recovery-regression.test.mjs`, `tests/acceptance-check.test.mjs` | Merchant-approved single grant and fresh protected-lesson proof |
| Separate course service and buyer-browser receipt | `tests/course-access.test.mjs`, `tests/access-assurance.test.mjs` | External learner opens the purchased lesson in a browser |
| Render investigation and recovery | `tests/recovery-regression.test.mjs`, `tests/backend-hardening.test.mjs` | Saved task runs and callbacks for the same PayPal-connected case |
| Customer progress, replies and private links | `tests/customer-support.test.mjs`, `tests/recovery-passport.test.mjs` | Customer-device walkthrough and actual email delivery |
| Opt-in bounded autopilot | `tests/autopilot.test.mjs`, `tests/automatic-investigation.test.mjs` | Controlled connected policy run; verify holds and revocation |
| Connector mapping and prevention views | `tests/connector-studio.test.mjs`, `tests/prevention-studio.test.mjs` | Independent merchant event source and mapped purchase cohort |
| Team identity, audit and backup operations | `tests/verified-accounts.test.mjs`, `tests/backups.test.mjs` | OIDC/MFA acceptance, off-host backup and restore drill |

The local suite currently passes 321 tests and the repository coverage gate. Azure deployment and route health passed after commit `608b8de`; these checks establish availability, not connected recovery. See [integration status](INTEGRATION-STATUS.md) and the [judge testing guide](JUDGE-TESTING.md) for the current boundary and private acceptance sequence. The read-only `hackathon` evidence mode requires PayPal, AI, approval, one grant and fresh external lesson proof; `connected` additionally requires Render. Neither mode initiates a payment or certifies Devpost eligibility.
