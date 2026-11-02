# Integration status — 2026-11-02

| Capability | Implemented in source | Configured on Azure demo | Live acceptance recorded |
| --- | --- | --- | --- |
| PayPal sandbox order, capture, fresh read | Yes | Yes | No complete buyer-to-lesson run |
| PayPal signature-verified webhook | Yes, optional | Not confirmed | No live delivery recorded |
| Separate reference course access | Yes | Yes | Authenticated smoke check only; no completed recovery |
| Azure OpenAI specialist review | Yes | Yes | Fictional evaluation passed; no complete connected case |
| Render Workflows | Yes, task definitions and callbacks | No | No |
| Customer email via Resend | Yes, optional | Not confirmed | No live delivery acceptance |
| Verified OIDC/MFA merchant sign-in | Yes, optional | No | No |
| AG Studio | No | No | No |
| Encrypted daily local backup and restore probe | Yes | Yes | Local restore probe passed; independent copy not configured |
| Independent encrypted Azure Blob backup copy | Yes, optional | No | No remote restore drill |
| Tenant-scoped reference course grants | Yes in this branch | Awaiting coordinated course-service deployment | No connected acceptance |

CI now enforces the measured baseline of 87% line and 82% branch coverage. The review target of 90% for both remains open; the latest local all-files run measured 87.14% line and 82.05% branch. Do not report the coverage target as met.

Configuration is not proof of a completed recovery. The run report and Recovery Passport label saved evidence and missing stages. Do not treat a sample walkthrough, a passing unit test, or a configured credential as live provider acceptance. The reference course service and PayTrace server must deploy their tenant-scoped contract together. Old unscoped reference grants are left in legacy tables rather than silently attributed to a tenant; existing cases require a fresh course check and merchant review after migration.
