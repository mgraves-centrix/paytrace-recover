# Prepare PayTrace project overview and hackathon submission materials

Judges need a coherent project explanation and a runnable build with honest evidence boundaries. This adds the responsive project overview, reorganized detailed README, requirement-to-test matrix, review findings, Devpost draft, tools disclosure, judge instructions and a 2:40 recording script.

The new `hackathon` evidence mode checks actual saved PayPal sandbox, model review, approval and external lesson proof without requiring optional Render execution. The existing stricter six-source `connected` mode is unchanged. Neither mode initiates payment, approves a correction or certifies official eligibility.

Validation: 279 tests passed with zero failures/skips; project/README checker passed 43 local references. Run `npm ci`, `npm test`, `node scripts/check-project.mjs`, then `npm start` and visit `/project.html` and `/focus.html`. New tests reject scripted/missing source checks, sample payment, stale proof, duplicate grants and payment holds. November 5 dependency audit reported zero vulnerabilities.

External setup remains: Azure hosted preflight failed, a complete real sandbox/model run is not recorded by this review, and video upload/Devpost submission are not complete. Credentials and runtime databases are excluded. No deployment or merge is requested. Leave this PR open for review.
