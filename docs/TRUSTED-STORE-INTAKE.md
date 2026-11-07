# Trusted store intake

PayTrace Recover can open a case when a store reports a captured PayPal sandbox purchase for the reference digital course. The store provides the buyer-to-course mapping; PayTrace independently rereads the PayPal order and capture before accepting the payment as complete. Intake creates a case and queues investigation. It does **not** grant access or bypass the existing approval and verification rules.

## Try the merchant-operated demo store

Open **Connections → Run demo store checkout**, or visit `/store-demo.html`. Unlock merchant controls, enter a fictional buyer name and a test inbox, then use a **PayPal sandbox buyer account** to approve the $128.00 checkout. The app creates a stable case ID in the PayPal order, captures the approved order, and passes the purchase mapping through the same trusted intake service used by the external-store endpoint. After PayTrace rereads the sandbox capture, the new case opens in the recovery desk. A canceled or pending checkout creates no case; retries use the saved order. This storefront is a simulator hosted inside PayTrace, not evidence that an independent merchant store has been integrated.

## Set up

### Merchant Connection Studio

Open **Connections → Configure store event** or `/connection-studio.html`. Paste one example JSON event from your store. The Studio suggests which fields correspond to PayTrace's purchase contract; when AI is configured, it receives **field paths and primitive types only**, not buyer names, email addresses, order IDs, or values. Review and correct each field, choose cents or dollars, and preview the normalized purchase. Save the mapping as an inactive draft. Before the test checkout, register its purchase intent from the store server as described below and place the returned opaque `paypalCustomId` in PayPal's `custom_id`. To activate the mapping, supply that completed sandbox order in the sample. PayTrace rereads PayPal and requires its capture and checkout binding to match. Editing an active mapping deactivates it until the new version passes that check. The Studio does not grant course access or create a case during setup.

Once active, send the store's JSON event from its **server** to `POST /api/intake/event` with `Authorization: Bearer YOUR_PRIVATE_STORE_KEY` and `Content-Type: application/json`. The event must follow the saved mapping. PayTrace maps it to the canonical purchase below, then runs the same trusted intake and fresh PayPal verification as `/api/intake/purchase`. This is a configurable adapter, not an automatic connection to an independent store: the store must register each purchase before checkout, use the issued `paypalCustomId`, then emit the completed event.

The reference course remains fixed to `course-light` at USD $128. The preview and activation refuse mismatched purchases. Use fictional customer details in test events and keep the private store key out of browser code.

### Direct API setup

1. Open **Connections** in the merchant workspace and unlock merchant controls.
2. Choose **Create store key**. Copy the key immediately into a private environment variable on the **store server**. It is displayed only once. Rotating it revokes the previous key.
3. Before checkout, send the purchase fields below **without `paypalOrderId`** to `POST /api/intake/intent` using the store key. Keep the case ID and purchase ID stable. PayTrace returns an opaque `paypalCustomId`; a repeat with identical fields returns the same value, while changed fields return `409`.
4. Put that exact `paypalCustomId` in the PayPal order's sole purchase unit as `custom_id`, and put the case ID in `reference_id`. The order must have exactly one purchase unit and one completed capture. An order created before intent registration or with another workspace's custom ID cannot be imported.
5. After checkout is captured, send the event below from the store server. Never put the key in browser JavaScript, a mobile app, a repository, or a URL.

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

The `amount` field is in cents. Send the same fields apart from `paypalOrderId` to the intent endpoint first. `201` on intake means the case was created. Repeating the identical event returns the existing case with `status: "duplicate"`. A changed event for the same case ID returns `409`. An invalid mapping, missing registered intent, or PayPal order/capture that does not match is rejected without creating a case. Store requests are server-to-server; browser requests with an `Origin` header are rejected. Keep the `purchaseId` stable for retries.

The current prototype supports one reference product, **The Light & Story Workshop** (`course-light`, USD $128). A production connector should add a merchant-managed product catalog and signed mapping contract before accepting other courses or prices. PayPal reporting discovery is disabled while the sandbox credentials are shared across workspaces; its unlinked rows cannot safely be attributed to a merchant.

## Customer updates

On a case, the merchant can set a promised update time. When it becomes due, PayTrace creates a merchant reminder and queues one customer email attempt if a verified purchase email and email provider are configured. The email truthfully says the update is due and points to the private case; it does not claim that a merchant has written a new message or that access has been restored. Delivery state is recorded separately from the promise. The merchant remains responsible for the substantive update.

## Local verification

Run `npm test` for the intake, idempotence, payment mismatch, reminder, and email-attempt tests. A connected acceptance run also requires real sandbox checkout and capture, the store server event, a course connector, and a merchant review through verification. No store is connected merely by creating the key.
