# Integration status — 2026-11-02

| Capability | Implemented in source | Configured on Azure demo | Live acceptance recorded |
| --- | --- | --- | --- |
| PayPal sandbox order, capture, fresh read | Yes | Yes | No complete buyer-to-lesson run |
| PayPal signature-verified webhook | Yes, optional | Not confirmed | No live delivery recorded |
| Separate reference course access | Yes | Yes, tenant-scoped package deployed 2026-11-02 | Authenticated tenant-scoped read passed; no completed recovery |
| Azure OpenAI specialist review | Yes | Yes | Fictional evaluation passed; no complete connected case |
| Render Workflows | Yes, task definitions and callbacks | Yes; task IDs and API key configured, authenticated task lookup passed 2026-11-02 | Fictional `investigate` and merchant-approved `recover` runs completed; no PayPal-connected recovery acceptance yet |
| Customer email via Resend | Yes, optional | Not confirmed | No live delivery acceptance |
| Verified OIDC/MFA merchant sign-in | Yes, optional | No | No |
| AG Studio | No | No | No |
| Encrypted daily local backup and restore probe | Yes | Yes | Local restore probe passed; independent copy not configured |
| Independent encrypted Azure Blob backup copy | Yes, optional | No | No remote restore drill |
| Tenant-scoped reference course grants | Yes | Both Azure apps deployed together 2026-11-02 | No completed grant and lesson acceptance |

CI now enforces a platform-stable floor of 87% line and 81% branch coverage. The review target of 90% for both remains open; local all-files runs measured about 87% line and 82% branch. Do not report the coverage target as met.

Configuration is not proof of a completed PayPal-connected recovery. The run report and Recovery Passport label saved evidence and missing stages. Do not treat a sample walkthrough, a passing unit test, or a configured credential as live provider acceptance. The reference course service and PayTrace server were deployed as a pair, then `/health`, the unauthenticated 401 boundary, a tenant-scoped authenticated inactive read, and hosted route preflight passed. PayPal sandbox OAuth and the model connection checks passed. Render task IDs were verified against the Render API, and the hosted Render connection check passed. An isolated fictional case dispatched `investigate` as Render run `trn-0b54gdbkil5lca4tg00bpc560`; `gatherEvidence`, `consultSpecialists` (`mode=model`), and `recordFindings` completed. A second fictional case, `CL-5674942a-6249-434f-bbfe-bd02f6437bb9`, completed model-backed investigation in run `trn-0b54gdbkit2q69s7s739iboag`, merchant-style approval, and recovery in run `trn-0b54gdbkit86j5td00092qbp0`, ending `verified` with one access write and authenticated local lesson proof. This validates both Workflow dispatch and callback paths for a sample case, not a separate-course PayPal purchase. A separate sandbox case, `CL-77b4df62-0e46-43cc-802b-a35b6707f94b`, created an idempotent PayPal order; capture before buyer approval returned HTTP 400 and left the case unpaid with zero access writes. The PayPal, AI, and Render connection checks passed. One course connector check was temporarily unavailable; three subsequent checks and a direct authenticated inactive entitlement read passed. A buyer-approved PayPal capture, separate-course grant, and protected-lesson acceptance remain untested. Old unscoped reference grants are left in legacy tables rather than silently attributed to a tenant; existing cases require a fresh course check and merchant review after migration.
