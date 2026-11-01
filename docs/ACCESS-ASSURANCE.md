# Payment-to-access assurance

Three connected views extend the existing PayPal sandbox recovery flow. They do not loosen the exact purchase, merchant authorization, or one-write rules.

## Buyer browser receipt

After current payment, entitlement, and protected-lesson proof passes, the private customer page lets the buyer open the purchased lesson. The server returns the protected lesson and a five-minute, one-use challenge bound to the private customer session, case, current case fingerprint, and current technical proof. Browser JavaScript hashes the lesson body and returns only the digest and challenge. The server records a separate browser-reached timestamp after checking them. A replay, wrong session, changed payment or access record, expired proof, or changed lesson digest fails closed. The challenge hash is stored privately; the customer case response never exposes it. The customer must still explicitly confirm that the purchase works, and can still request help.

This proves the protected content reached a browser running the private PayTrace page. It does **not** prove that the buyer read the content, that a native LMS login works, or that a different device can open it. Sample lesson receipts remain labeled as samples. A commercial course connector must provide its own direct buyer-side check before claiming native-platform delivery.

## Access promise monitor

Every sandbox case derives a payment-to-access delivery target from its completed capture time and the merchant's existing 1–60 minute access window. The case desk and private customer page show payment source, target time, technical proof, browser receipt, and the separate customer confirmation. Mismatched payment, account, entitlement, or changed payment status takes precedence over an overdue label. The existing monitor and opt-in sandbox policy can investigate or safely repair eligible overdue cases; the card itself never authorizes a grant. The target is a monitoring window, not a financial guarantee or automatic notification.

## Incident detective

When the existing three-case sandbox cluster is active, the merchant can run a rate-limited, read-only probe of up to five affected cases. Each probe refreshes PayPal capture, course entitlement, and protected lesson through the existing customer self-check path without sending a grant. Fixed hypotheses from Ledger, Relay, Prism, and Patch mark evidence as a supported signal, contradiction, or untested; no cluster is called a proven cause. If a configured OpenAI or Azure OpenAI model is available, it adds short cited perspectives from pseudonymous case IDs and fixed probe states. Model text cannot change the deterministic statuses or authorize a batch action. A model failure leaves the fixed evidence visible.

## Validation and demo

Run `npm test`. The access-assurance tests cover deadline and payment holds; one-use, same-session browser receipts; private HTTP access and same-origin checks; stale proof; incident authorization, read-only behavior, and rate limiting; and AI citation validation. For a connected demonstration, use a real PayPal sandbox capture and course service. Confirm the technical proof, open the lesson from a private customer link, and observe the browser receipt before pressing the separate confirmation button. To show the detective, create three completed sandbox purchases for one course with missing access inside 30 minutes, then run fresh incident checks. The published Azure app must be redeployed before these views appear there.
