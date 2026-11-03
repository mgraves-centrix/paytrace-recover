# Integration status — 2026-11-02

| Capability | Implemented in source | Configured on Azure demo | Live acceptance recorded |
| --- | --- | --- | --- |
| PayPal sandbox order, capture, fresh read | Yes | Yes | No complete buyer-to-lesson run |
| PayPal signature-verified webhook | Yes, optional | Not confirmed | No live delivery recorded |
| Separate reference course access | Yes | Yes, tenant-scoped package deployed 2026-11-02 | Authenticated tenant-scoped read passed; no completed recovery |
| Azure OpenAI specialist review | Yes | Yes | Fictional evaluation passed; no complete connected case |
| Render Workflows | Yes, task definitions and callbacks | Yes; task IDs and API key configured, authenticated task lookup passed 2026-11-02 | No task run or callback acceptance yet |
| Customer email via Resend | Yes, optional | Not confirmed | No live delivery acceptance |
| Verified OIDC/MFA merchant sign-in | Yes, optional | No | No |
| AG Studio | No | No | No |
| Encrypted daily local backup and restore probe | Yes | Yes | Local restore probe passed; independent copy not configured |
| Independent encrypted Azure Blob backup copy | Yes, optional | No | No remote restore drill |
| Tenant-scoped reference course grants | Yes | Both Azure apps deployed together 2026-11-02 | No completed grant and lesson acceptance |

CI now enforces a platform-stable floor of 87% line and 81% branch coverage. The review target of 90% for both remains open; local all-files runs measured about 87% line and 82% branch. Do not report the coverage target as met.

Configuration is not proof of a completed recovery. The run report and Recovery Passport label saved evidence and missing stages. Do not treat a sample walkthrough, a passing unit test, or a configured credential as live provider acceptance. The reference course service and PayTrace server were deployed as a pair, then `/health`, the unauthenticated 401 boundary, a tenant-scoped authenticated inactive read, and hosted route preflight passed. PayPal sandbox OAuth and the model connection checks passed. Render task IDs were verified against the Render API, and the hosted Render connection check passed; no Workflow task run or callback has completed yet. Old unscoped reference grants are left in legacy tables rather than silently attributed to a tenant; existing cases require a fresh course check and merchant review after migration.
