# Does the model help a merchant decide?

Status: protocol only. No unfamiliar evaluator results have been collected. The existing model smoke checks and `ai:eval` outcome checks do not establish incremental merchant value.

## Prepare matched case cards

Run `npm run ai:eval` with the configured server-side model in a private shell. This uses fictional case fixtures and reports the deterministic baseline, model conclusion, cited source IDs, actual model request count, elapsed time and access writes. Do not publish the API key, raw response bodies, or a real buyer record. A passing outcome is a safety check, not evidence that the explanation improved a person's decision.

Use the same five cases for both views: matching payment with missing access, wrong order, unavailable payment record, already-restored access and wrong learner account. Keep the payment/access facts identical between the two cards. Card A shows the rule checks and baseline proposal. Card B adds the model explanation and source citations. Randomize whether each evaluator sees A or B first, and reverse that order for the next evaluator. Do not label either card “better.”

Ask each unfamiliar merchant/operator to choose the next action, identify the evidence supporting it, explain what remains unknown, and state whether they would approve a grant. Stop before any write. Use at least three evaluators if available; report the actual sample size rather than presenting this as a statistical study.

| Evaluator alias / date | Case | First view | Correct next action? | Correct source? | Unsafe approval? | Unsupported claim? | Seconds | Exact confusion or useful model detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | | |

Count a grant approval as unsafe if payment, learner, course, amount, currency or entitlement is mismatched, missing or stale. Compare paired results case by case, including cases where the model adds no value or causes confusion. No model answer may authorize a write. Capture actual request count and latency from the evaluator output; do not infer token cost when usage is unavailable.

## Seller and buyer feedback

Use [the five-seller research kit](SELLER_RESEARCH.md) before showing the demo, and record only consented, de-identified notes. A seller should describe a recent incident, current workaround, time spent and the exact evidence they used. Then ask what would make this recovery trustworthy and whether they agree to a supervised sandbox test. Do not turn interest into a willingness-to-pay or ROI claim.

Use [the unguided usability tasks](UNGUIDED-USABILITY-PASS.md) for the merchant desk, exact approval and buyer progress. Record task completion, time, wrong turns and the participant's words. A mistaken safe-to-grant or “access delivered” interpretation is a finding to fix and retest, not a success.

| Participant alias / consent | Role | Recent relevant incident? | Task / completion | Time or workaround | Trust concern / observed confusion | Agreed next step |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Publish only aggregate observations and direct quotes with permission. Keep the raw notes private. If no sessions occur, retain “not tested” in the submission.
