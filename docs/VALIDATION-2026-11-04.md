# Validation report — November 4, 2026

## Scope

Reviewed current GitHub main at `eff16c73a128db0ff23a9277d431e9ae35c8e815` against the supplied feature inventory. Work is isolated in `work/paytrace-project-review` on `codex/project-review-20261104`; the older backend checkout is preserved. No deployment, production data mutation, payment, real email, or merge was performed.

## Automated results

- Baseline: **276 passed, 0 failed, 0 skipped** on Node v24.11.1.
- Final suite after project/docs changes: **276 passed, 0 failed, 0 skipped**.
- Static references: **18 HTML pages, 209 local references, zero missing targets** (HTML href/src file targets; not dynamic routes or external links).
- Project/README checker: `node scripts/check-project.mjs` validates local reference targets and main heading/anchor structure.
- Local hosted preflight: health and all ten existing app/runtime routes returned HTTP 200. Backend configured; external providers correctly labeled unconfigured in the isolated review environment.
- npm dependency audit: **incomplete**. Two attempts failed with registry `ECONNRESET`; no vulnerability count can be claimed.

Tests cover the supported local/mocked contracts, not every external service or all browser combinations. The [feature matrix](FEATURE-ACCEPTANCE.md) maps the requirements to representative implementations and test families.

## Browser checks

- New project overview renders and links into the sample and working merchant desk.
- All eight interactive sample stages advanced correctly: zero writes before correction, one sample write after correction, proof passing separately from customer confirmation.
- Server-backed matching sample: investigation, preview, explicit consent, approval, apply and protected-lesson verification passed. Approval button remained disabled before the consent checkbox.
- Recovery Center analytics showed one historical and one current verification after the recovery; sample and sandbox counts stayed distinct.
- Center navigation exercised notifications, receipts, priorities, payments, automation, autonomy, audit, operations and team access. Protected sections required the operator gate; no bypass was attempted.
- Creating a private customer preview link without operator access was rejected as intended. Customer private-link/browser-receipt behavior is covered by the passing HTTP/model suite, but was not independently completed with a live buyer in this review.
- Console inspection found no error entries during the inspected local sample and Center flow.
- Project page reviewed at desktop and mobile breakpoints; screenshots retained in review outputs. This is not an accessibility certification.

## Hosted blocker: health check fails

Read-only preflight against `https://paytrace-recover-sagitta.azurewebsites.net` returned **HTTP 503** from `/health`, body `{"ok":false}`. All inspected app pages and runtime returned 200. Runtime reported PayPal, course access, AI and Workflows configured. Configuration proves neither execution nor healthy persistence.

In the reviewed source `/health` returns this response when `store.databaseCheck()` is false; that check uses SQLite `PRAGMA quick_check`. The public response does not expose the underlying diagnostic. It does not establish the precise database fault or prove the deployed code revision equals the reviewed source. Do not suppress the failure, reset the live database, or mark the deployment accepted.

Operator remediation:

1. Inspect the deployed revision, database path, durable volume and private App Service logs.
2. Preserve the database and existing backups before attempting repair; coordinate a maintenance window and stop competing writers.
3. On an isolated snapshot, run SQLite integrity checks and verify a known-good encrypted backup restores successfully. Keep detailed records private.
4. If corruption is confirmed, restore a validated backup into a **new** database path, assess what records/events need reconciliation and obtain the operational decision before switching traffic. Database restore does not reverse external course writes.
5. Check storage/journal mode, single-instance coordination, disk availability and filesystem locking. Do not assume SQLite WAL is safe on shared storage.
6. Re-run `/health`, public route preflight and one complete connected acceptance case. Reconcile provider events/access and check backup/restore status before reopening automatic actions.

No administrative cloud connection or private snapshot was available for this review; repair of the hosted data/volume could not be verified locally.

## Remaining acceptance

A complete real sandbox case must record exact PayPal purchase matching, separate access read, model review, merchant approval, Render recovery and protected lesson proof. Separately validate OIDC/MFA, buyer browser receipt, email delivery, adverse payments and off-host recovery. Existing historical AI/course tests remain historical; this review did not use private provider credentials.

## Changes delivered

- Responsive `/project.html`, linked from landing and judge pages, with seven-stage illustrative Passport, specialist flow, feature overview and explicit evidence limits.
- Reorganized detailed README: PowerShell start, ports/routes, features, architecture, environment setup, acceptance, operations, troubleshooting and known limits.
- Requirement-to-test matrix and this validation report.
- Corrected stale backup scheduling and main-branch wording; added current hosted-health notice to deployment/checklist docs.
- Reusable project/README reference checker.
