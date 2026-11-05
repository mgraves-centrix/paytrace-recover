# Feature acceptance matrix

Reviewed against the supplied feature inventory and GitHub main `eff16c7`, November 4, 2026. “Local/mocked” means automated checks exist and passed; it does not mean every interaction was manually tested or an external service completed a run. Test paths below are representative coverage families, not certification of every sentence in the inventory.

| Requirement group | Implementation | Representative automated coverage | Remaining evidence |
| --- | --- | --- | --- |
| Today, queue, priorities, filters, case creation | `dist/focus*`, `dist/workspace-model.mjs`, `server/store.mjs` | `workspace-api`, `workspace-model`, `today-experience`, `new-case`, `focus-actions` | Merchant usability acceptance |
| Timeline, private notes, update promises | `dist/communication-desk.mjs`, customer-support store | `communication-desk`, `customer-support`, `update-promise-automation` | Real customer communication and email delivery |
| Exact purchase and access checks | `dist/core.mjs`, PayPal and course adapters | `recovery-regression`, `course-access`, `focus-checkout`, `backend-hardening` | Genuine sandbox checkout and external platform proof |
| Break Point Map and evidence comparison | `dist/breakpoint-map*`, evidence views | `breakpoint-map`, `presentation-evidence` | Connected source evidence in one real sandbox case |
| Four AI specialists, objections, follow-ups | `server/ai.mjs`, agent workbench and case review | `agent-workbench`, `challenge`, `ai-endpoint`, `automatic-investigation` | Rerun configured AI smoke/evaluation; historical Azure results are documented separately |
| Rehearsal, exact approval, idempotent repair | `dist/core.mjs`, `server/service.mjs` | `recovery`, `recovery-regression`, `backend-hardening` | Interrupted external grants and provider acceptance |
| Verification retry, freshness, self-restoration | verification policy and service | `verification-freshness`, `automatic-investigation`, `recovery-regression` | Receiving platform's actual protected-content enforcement |
| Refund/reversal holds and scoped suspension | PayPal webhook/service, course adapter | `paypal-webhook`, `course-access`, `recovery-regression` | Provider-generated adverse payment events |
| Bounded opt-in sandbox autopilot | autopilot policy/service, autonomy views | `autopilot`, `autonomy-api`, `autonomy-overview` | Configured policy run and operational limits |
| Private customer progress/messages/self-check | customer routes and projections | `customer-support`, `customer-progress`, `customer-self-check` | Identity, email and buyer-device acceptance |
| Buyer-browser receipt and customer response | access-assurance and customer service | `access-assurance`, `customer-progress`, `recovery-passport` | Real receiving course browser behavior |
| Seven-stage Passport, flight recorder, reports | `dist/recovery-passport*`, run-report and case intelligence | `recovery-passport`, `run-report`, `case-intelligence`, `acceptance-check` | Six connected checks in one case and separate customer confirmation |
| Analytics, audit, roles and notifications | Recovery Center and account store | `recovery-center`, `recovery-integration`, `verified-accounts` | Live IdP/MFA, external audit checkpoint operations |
| Storefront, trusted intake and mapping | demo-store, connector-studio and store routes | `demo-store-checkout`, `trusted-intake`, `connector-studio` | Independent merchant server and actual sandbox capture |
| Reporting discovery and incident perspectives | PayPal discovery, incident analysis/intelligence | `paypal-discovery`, `intelligence-http`, `intelligence-lab` | Reporting permissions and connected incident evidence |
| Durable jobs, health, encrypted backups | `server/durability.mjs`, backups and health | `backups`, `health-integrity`, `backend-hardening` | Hosted health currently fails; off-host restore drills and deployment review |
| Tracing, release preflight, acceptance | telemetry bootstrap, scripts and CI | `recovery-regression`, `acceptance-check` | Azure alerts and full connected run |
| Public story and project documentation | `dist/project.html`, demo/judge/story and README | Existing `story*`, `presentation-evidence`; browser review and link checks | Accessibility audit and independent usability study |

## Safety acceptance rules

- Missing or mismatched purchase evidence must produce zero grants.
- Approval refers to the exact current preview; changed evidence invalidates authorization.
- A completed write remains unverified until fresh payment, entitlement and protected lesson agree.
- Verification retry must not perform a second access write.
- A self-restored entitlement can pass read-only verification with zero PayTrace grants.
- Customer projections must omit merchant-private information.
- Provider configuration, email acceptance and a passing health response each prove only their own bounded fact.
- Technical verification, browser receipt and human satisfaction remain separate.

The passing local suite supports these requirements within its tested local/mocked scope. It cannot establish production readiness or external service acceptance.
