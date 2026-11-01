# Trusted store intake

PayTrace Recover can open a case when a store reports a captured PayPal sandbox purchase for the reference digital course. The store provides the buyer-to-course mapping; PayTrace independently rereads the PayPal order and capture before accepting the payment as complete. Intake creates a case and queues investigation. It does **not** grant access or bypass the existing approval and verification rules.

## Set up

1. Open **Connections** in the merchant workspace and unlock merchant controls.
2. Choose **Create store key**. Copy the key immediately into a private environment variable on the **store server**. It is displayed only once. Rotating it revokes the previous key.
3. Configure the store checkout to put the new PayTrace case ID in the PayPal order's sole purchase unit as `custom_id`. The order must have exactly one purchase unit and one completed capture. The case ID in the intake event must match that `custom_id` exactly.
4. After checkout is captured, send the event below from the store server. Never put the key in browser JavaScript, a mobile app, a repository, or a URL.

```http
POST /api/intake/purchase HTTP/1.1
Host: paytrace-recover-sagitta.azurewebsites.net
Authorization: Bearer YOUR_PRIVATE_STORE_KEY
Content-Type: application/json

{
  "caseId": "CL-STORE-1001",
  "purchaseId": "store-order-1001",
  "paypalOrderId": "PAYPAL_SANDBOX_ORDER_ID",
  "learnerId": "learner-1001",
  "customerName": "Alex Rivera",
  "email": "alex@example.com",
  "courseId": "course-light",
  "amount": 12800,
  "currency": "USD"
}
```

The `amount` field is in cents. `201` means the case was created. Repeating the identical event returns the existing case with `status: "duplicate"`. A changed event for the same case ID returns `409`. An invalid mapping or a PayPal order/capture that does not match is rejected without creating a case. Store requests are server-to-server; browser requests with an `Origin` header are rejected. Keep the `purchaseId` stable for retries.

The current prototype supports one reference product, **The Light & Story Workshop** (`course-light`, USD $128). A production connector should add a merchant-managed product catalog and signed mapping contract before accepting other courses or prices. PayPal reporting discovery remains read-only and cannot infer learner identity or course entitlement by itself.

## Customer updates

On a case, the merchant can set a promised update time. When it becomes due, PayTrace creates a merchant reminder and queues one customer email attempt if a verified purchase email and email provider are configured. The email truthfully says the update is due and points to the private case; it does not claim that a merchant has written a new message or that access has been restored. Delivery state is recorded separately from the promise. The merchant remains responsible for the substantive update.

## Local verification

Run `npm test` for the intake, idempotence, payment mismatch, reminder, and email-attempt tests. A connected acceptance run also requires real sandbox checkout and capture, the store server event, a course connector, and a merchant review through verification. No store is connected merely by creating the key.
