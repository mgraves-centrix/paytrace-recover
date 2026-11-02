# Recovery Passport

The Recovery Passport turns one saved case into a readable evidence receipt. In the merchant workspace, open a case, scroll to **Run report**, and choose **Open Recovery Passport**. The merchant view shows seven distinct stages: payment, specialist review, decision, correction, protected lesson, buyer-browser receipt, and customer confirmation. Each stage names its saved source and check time. Merchant-only references and cited source IDs remain in that view. The JSON download is a snapshot, not a new provider check.

The customer's existing private case link shows a compact Passport summary above the conversation. The customer can expand the timeline without seeing payment capture IDs, workflow IDs, internal source IDs, or merchant-only notes. A recorded access write is labeled *recorded*, not *verified*. Technical lesson proof requires current case evidence; browser receipt and customer confirmation are separate steps. A stale proof or a request for more help changes the Passport's outcome.

When a Render job exists, the merchant Passport displays the real run ID and the saved gather/analyze/record or repair/verify stage states. A run ID alone never marks correction or verification successful. Without a run, the Passport says so explicitly. The Azure demo currently has no Render Workflow configured.

Use a completed PayPal sandbox buyer checkout and a separate course-access service to demonstrate connected payment and lesson evidence. The local sample story is intentionally labeled as a server demo. Run `npm test` for status, privacy, escaping, route scope, and regression checks. A complete connected acceptance still needs a real buyer-approved sandbox capture, a matching store event, and a customer confirmation on the private case.
