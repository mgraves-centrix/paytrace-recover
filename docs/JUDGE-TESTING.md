# Judge testing instructions

## Working build

Use Node.js 24 or newer. Download the repository, open a terminal in the folder containing `package.json`, then run:

```powershell
npm ci
npm test
npm start
```

Open `http://127.0.0.1:4358/judge.html`, then `/focus.html`. Pages and API share one server; no build step is required. Stop with Ctrl+C. If the port is occupied, change both `PORT` and `PUBLIC_URL` as shown in the README. PowerShell uses `cd "path"`, without `/d`.

Do not use `node serve.cjs` as the backend demonstration: it serves the separate static simulation.

## Local evaluation without credentials

Select Maya's matching sample. Review evidence, preview the correction, tick the exact approval checkbox, approve and apply/verify. Inspect the write count and protected lesson result. Try a mismatched sample and confirm it cannot authorize a grant. These exercise actual backend rules with fictional provider records, not PayPal/model execution.

`/demo.html` explains the eight-stage journey using scripts. Its state is separate from the persisted merchant case. Private customer details require an authorized private link; the generic customer entry page exposes no case.

## Connected PayPal and AI evaluation

Privately configure PayPal sandbox, the separate course adapter, the actual AI model and operator access using `.env.example`. Use dedicated sandbox accounts only. Judges need either their own provider setup or a restricted team-managed testing environment. Arrange special access privately; do not commit passwords, operator keys or session cookies.

See [course contract](COURSE-ACCESS.md), [integration guide](BUILD-README.md) and [verified merchant setup](RELEASE-CANDIDATE.md). The included reference course service is a demo adapter, not a commercial LMS.

1. Check service connections. This establishes reachability, not recovery.
2. Create a new sandbox purchase, complete checkout, and inspect the exact captured order, learner, course, amount and currency.
3. Run model-backed review, inspect citations/objections, rehearse and approve the exact correction.
4. Apply once, verify fresh payment/access/protected-content records, and retain the run report.
5. Run the read-only evidence check while proof is current.
6. Separately check customer access, browser receipt and human confirmation.

## Evidence modes

Set the private `PAYTRACE_ACCEPTANCE_URL`, `PAYTRACE_ACCEPTANCE_CASE_ID` and `PAYTRACE_ACCEPTANCE_COOKIE` settings documented in the release guide. A cookie is a credential; never publish it.

```powershell
npm run acceptance:check -- --mode=hackathon
```

This project-specific check requires real sandbox payment, model review, exact approval, one grant and fresh external lesson proof. Optional Render execution is excluded. It assesses saved evidence; it does not perform checkout, approval or grants, and it is not an official eligibility decision.

```powershell
npm run acceptance:check -- --mode=connected
```

The existing stricter mode additionally requires all six sources including Render recovery. Refund and failed-verification modes remain separate. No mode certifies originality, eligibility, video submission or future access.

## Current limits

The November 4 Azure database failure was repaired on a preserved copy. The latest documented deployment returned HTTP 200 from `/health` and the updated merchant and customer pages; see [integration status](INTEGRATION-STATUS.md). Recheck health before a live demonstration because availability can change.

No buyer-approved PayPal sandbox capture through model review, approved course grant, and protected lesson acceptance has been recorded. The local sample flow is not proof of that connected sequence.
