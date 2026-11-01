# The focused recovery experience

The merchant desk now begins with **Today in recovery**: decisions to make, customers waiting, and outcomes to verify. It uses the existing workspace pulse and case records. Counts can overlap because one case may need both a customer reply and a technical verification. Full queue-health metrics and CSV export remain in one disclosure; the original full recovery desk, queue, and agent panels are one click deeper in another. Case creation and the guided tour remain available above them. An unavailable pulse shows a retry state instead of implying the queue is clear.

Each case has a decision brief in the merchant rail. It summarizes the current payment, exact purchase, specialist review, lesson proof, and the only access change under consideration. Its summary is advisory; the existing server-side approval, fresh checks, and idempotent grant path control the actual action. A missing or changed record never becomes a passed purchase check in the brief.

The merchant can set a **customer-visible next update time** alongside the case decision. The private customer page shows the same time and the merchant's role. Promised updates due within 24 hours appear in Today's customer lane; a late promise is labeled overdue. A customer-visible merchant message clears an overdue promise, while internal notes and earlier interim updates do not. Saving a time does not send a message or guarantee email delivery.

Three completed sandbox purchases for the same course with missing access inside 30 minutes produce a **possible incident** banner. The signal is not a root-cause diagnosis. It pauses automatic grants and links to the Intelligence Lab; individual evidence checks and merchant review remain necessary.

Open `/demo.html` for an eight-step **fictional walkthrough** from checkout to customer confirmation. Its sample functions exercise the same order of local state transitions: payment, review, preview, approval, one grant, verification, then confirmation. It does not call PayPal, run model agents, send messages, or change external course access. The judge page and merchant navigation link to it. A connected recovery is assessed separately through the run report.

The shared `product-unity.css` layer aligns colors, focus treatment, cards, and responsive navigation across the merchant desk, Intelligence Lab, customer view, and walkthrough. It does not replace each screen's task-specific layout.

Run `npm test` for the pure Today, decision, and journey checks plus the existing payment and customer-support regression suite. Live cross-device visual acceptance and a connected sandbox journey are separate release checks.
