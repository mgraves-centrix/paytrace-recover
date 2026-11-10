# Recording plan — target 2 minutes 40 seconds

## Current review cut

`scripts/build-submission-cut.ps1` produces a 77-second MP4 from the user's local `PayTrace-Cole-Demo.mp4`, with new title cards and a tighter sequence. The first section is a **fictional walkthrough**. A later card explicitly introduces a **separate connected sandbox recording**. The course-view cards are labeled visual previews, not captured proof that the connected buyer visited the new course page. The original clip audio is retained in excerpts; review the full audio and create accurate captions before publishing. The output is written beside the repository under `paytrace-video-submission/` by default, not committed to Git.

The strongest future recording would use one fresh sandbox case to show the new learner course page locked before approval and the same page opening its protected lesson afterward. That recording would replace the visual previews and remove any ambiguity from the final submission video.

This is a script and shot list, not a finished video or evidence that the shots occurred. Record actual application footage with a fictional buyer and PayPal sandbox. Scripted scenes must be labeled. Never show keys, cookies, private URL fragments or unrelated personal information.

| Time | Actual footage | Suggested narration |
| --- | --- | --- |
| 0:00–0:15 | Judge walkthrough and locked purchased course | A completed payment can still leave a customer locked out. PayTrace connects payment evidence to purchased digital access. |
| 0:15–0:40 | Sandbox checkout and its captured purchase | This is PayPal sandbox. We match order, learner, course, amount and currency. A webhook or matching amount alone cannot authorize a change. |
| 0:40–1:05 | Actual AI review and one source citation | Ledger checks payment. Relay follows events. Patch proposes a narrow correction. Prism challenges it. The model explains; the merchant decides. |
| 1:05–1:30 | Exact preview, zero writes, consent and approval | Rehearse before writing and approve only this purchase's change. Changed evidence invalidates approval. We do not charge or refund the buyer. |
| 1:30–1:55 | One grant and external lesson verification | One idempotent grant is recorded. Payment, entitlement and protected lesson are checked separately. A write alone is not recovery proof. |
| 1:55–2:15 | Passport, private buyer lesson and response | Lesson proof, buyer-browser receipt and customer confirmation remain separate stages. |
| 2:15–2:30 | Wrong-order hold or read-only retry | Mismatches stay on hold. Verification retries read again without granting twice. |
| 2:30–2:40 | Project/source and scope | PayTrace Recover: payment confirmed, access checked. This is a sandbox prototype. Source, setup and test limits are documented. |

Trim provider waiting time, but do not splice different purchases into one claimed end-to-end case. Narrate Render execution only if its saved run proves it. Leave the final video under three minutes.

## YouTube metadata draft

Title: **PayTrace Recover | PayPal + AI | Evidence-led access recovery**

Description:

PayTrace Recover investigates missing course access with PayPal sandbox and AI specialist review. Merchants preview and authorize a narrow correction, then the system checks protected lesson access. Technical proof and customer confirmation are separate.

Source and instructions: https://github.com/sagitta414/paytrace-recover

Sandbox prototype. Sample/scripted scenes are labeled. See current repository submission status for tested behavior. No production payment processing is claimed.

## Before upload

- Complete a real sandbox/model run and match every narrated claim to its evidence.
- Keep English narration/captions and duration below 3:00.
- Review the complete export for private data and accidental screen content.
- Use original or appropriately licensed audio and artwork.
- Upload to the intended channel, choose Public visibility and verify the link signed out.
- Enter the actual URL in Devpost. A script or placeholder URL is not a submitted video.
