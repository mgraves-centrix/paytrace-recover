# PayTrace specialists in Microsoft Foundry

The four PayTrace specialists run in the PayTrace server, using the existing Azure OpenAI `gpt-4o-mini` deployment on `automation-jl107`. They are **not hosted or invoked by Foundry Agent Service**. The dedicated Foundry project registers them as [external agents](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/register-external-agent) so the team can find each specialist and inspect attributed telemetry. Registration is metadata only; it does not change a payment, approve a grant, or move case evidence to a new model endpoint. External-agent registration is a preview feature.

| Azure item | Value |
| --- | --- |
| Subscription | Visual Studio Enterprise Subscription |
| Resource group | `rg-paytrace-foundry` |
| Foundry resource | `paytrace-foundry-jl107` |
| Project | `paytrace-recover` |
| Project endpoint | `https://paytrace-foundry-jl107.services.ai.azure.com/api/projects/paytrace-recover` |
| Connected telemetry | `paytrace-recover-insights` in `provenance-pilot-rg` |

Open [Microsoft Foundry](https://ai.azure.com/), select the **PayTrace Recover** project, then **Build → Agents**. The external registrations are `paytrace-ledger`, `paytrace-relay`, `paytrace-patch`, and `paytrace-prism`. Ledger checks exact payment identity; Relay reconstructs the delivery sequence; Patch proposes the smallest access correction; Prism challenges the evidence and records remaining uncertainty. The corresponding implementation is in `server/ai.mjs`, and the safety gates remain in the PayTrace server and core.

The App Service already exports to the same Application Insights resource connected to this project. The `gen_ai.agent.id` attribute on each specialist span matches its registration. The spans contain only the fixed agent ID, fixed step name, duration, and generic success or failure. They do **not** include prompts, customer messages, learner identities, order or capture IDs, secrets, or provider error bodies. Foundry traces will appear only after this code is deployed and a configured model-backed review runs; registration alone proves neither runtime activity nor a connected PayPal recovery.

For Darius, App Service Website Contributor does not grant Foundry project access. A team member who needs to inspect these registered agents needs **Foundry User** scoped to this project; that role can also create and edit project agents. A **Reader** role on the parent Foundry resource makes it discoverable. Viewing traces may additionally require **Log Analytics Reader** on the connected Application Insights resource. Grant those roles only to the intended Azure identity, then have the user sign out and back in. See [Foundry RBAC](https://learn.microsoft.com/en-us/azure/foundry/concepts/rbac-foundry) and [tracing access](https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/trace-agent-setup).

To verify after deployment: run one model-backed investigation in the private sandbox workspace, confirm the PayTrace case remains subject to its usual review and approval gates, then open each external agent's **Traces** tab in Foundry. Allow a few minutes for Application Insights ingestion. A missing trace should first be checked against the App Insights connection, the deployed code version, and the exact `gen_ai.agent.id` value.
