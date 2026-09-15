# RedX Webhooks — deferred integration

**Status:** NOT implemented. Order status currently advances by polling
`RedxCourierAdapter.trackParcel()` (`GET /parcel/info/{tracking_id}` for status,
`GET /parcel/track/{tracking_id}` for a human-readable timeline — see the 2026-09-15
Track/Get-Info fix).

This note captures everything needed to build the webhook path later without
re-reading the vendor PDF. Source of truth: `REDX_OpenAPI_Integration_Spec.md.pdf`
§4, §7 (9.7-9.9), §8 (kept at repo root), read in full on 2026-09-14/15.

---

## Why deferred

Steps 1–6 of the RedX integration (areas+cache, charge calculator, pickup
store CRUD, Create Parcel fix, Track/Info status fix, Update/Cancel Parcel)
were done first per the doc's own suggested build order, which explicitly
puts the webhook receiver last (§8, step 7). Same reasoning as Pathao's and
CarryBee's deferred webhooks — see [[pathao-webhook-todo]] and
[[carrybee-webhook-todo]] for the sibling docs. Polling covers status updates
until this is built.

## What's different about RedX's webhook vs Pathao's/CarryBee's

RedX's webhook security model is the **weakest of the three** — no signing
secret, no signature header, no handshake verification step:

- **No HMAC / signature header at all.** Unlike Pathao's `X-PATHAO-Signature`
  (a shared-secret header) or CarryBee's `X-Carrybee-Webhook-Signature`, RedX
  has no header-based auth for the callback.
- **The only auth mechanism is a token embedded in the callback URL's own
  query string** (§4.2): `https://example.com/callback?token=<token>`. RedX
  does not support custom headers or a signing secret — the URL itself is the
  credential.
- **No one-time handshake request** (unlike Pathao's `webhook_integration`
  event or CarryBee's `webhook.integration` event) — RedX just starts POSTing
  live events to whatever URL was registered.

## What to build

### 1. Public webhook controller

`POST` endpoint, e.g. `/api/v1/logistics/webhooks/redx?token=<per-env-secret>`
— **no auth guard** (RedX calls it, can't send our JWT). Must be publicly
reachable (no localhost/private IPs in production).

### 2. Token-in-query-string verification (every request)

Since there's no signature header, the query-string token IS the entire
authenticity check (§9.7):

- Generate a long random token per environment (sandbox vs production —
  separate tokens), store it as a secret (e.g. `REDX_WEBHOOK_TOKEN`).
- Validate it **constant-time** (`crypto.timingSafeEqual` or equivalent)
  before processing anything.
- **Never log the full incoming URL** (it contains the token) — log a
  redacted version.
- Mount the route only under HTTPS.
- Don't trust `tracking_number` blindly even after the token checks out —
  look it up against a consignment this tenant actually created before acting
  on it (the token proves "this came from someone who knows our webhook URL,"
  not "this tracking_number is real").
- Rotate the token if it ever leaks (e.g. appears in logs, browser history,
  proxy logs).

### 3. Payload shape

```json
{
  "tracking_number": "<REDX_TRACKING_ID>",
  "timestamp": "<TIMESTAMP>",
  "status": "<STATUS>",
  "message_en": "<MESSAGE_EN>",
  "message_bn": "<MESSAGE_BN>",
  "invoice_number": "<INVOICE_NUMBER>",
  "delivery_type": "<DELIVERY_TYPE>"
}
```

Look up the local shipment by `tracking_number` (RedX's `tracking_id` /
`consignment_id` in our schema) — `invoice_number` is our own
`merchant_invoice_id` and can be used as a fallback lookup key.

### 4. Status values (§4.4) — the webhook subset

| Status | Meaning |
|---|---|
| `ready-for-delivery` | Parcel received from merchant |
| `delivery-in-progress` | Parcel dispatched to rider |
| `delivered` | Parcel delivered by rider |
| `agent-hold` | Parcel on hold with agent |
| `agent-returning` | Parcel return in progress |
| `returned` | Parcel returned |
| `agent-area-change` | Area change requested & in progress |
| `paid` | Parcel amount paid (COD remitted to merchant) |

**Important**: this webhook status vocabulary is a **subset** of the full
`parcel.status` vocabulary seen elsewhere (e.g. `pickup-pending` from Get
Parcel Details is not in this table). `REDX_STATUS_MAP` in `redx.adapter.ts`
already covers both — reuse it, don't duplicate. Log any status not in the
map rather than throwing (RedX may add new ones over time).

### 5. Delivery types (§4.5) — informational, not status

| Type | Meaning |
|---|---|
| `regular` | Regular forward delivery |
| `reverse` | Regular reverse delivery |
| `exchange-delivery` | Forward exchange parcel |
| `exchange-return` | Reverse exchange parcel |
| `partial-delivery` | Partial delivery parcel |
| `partial-return` | Partial return parcel |

### 6. Ack fast, process async, idempotent

- RedX's docs don't specify a retry/timeout policy — assume one exists.
  Return 200 quickly after persisting the raw event.
- Push the payload onto a BullMQ queue; a worker updates the consignment
  through the same path `SyncConsignmentService` / booking already uses.
- Dedupe on something like `(tracking_number, status, timestamp)` before
  processing, to survive RedX retries/duplicates (§9.8).

## Env vars to add when building this

```
REDX_WEBHOOK_TOKEN=        # long random per-environment secret, embedded in the callback URL's query string
```

## Suggested layout (adapt to this repo's structure)

Belongs in the existing `logistics` module, mirroring Pathao's/CarryBee's plan:

- `logistics.controller.ts` (or a dedicated `logistics-webhook.controller.ts`) —
  the public POST, validating the query-string token first.
- A `redx-webhook.types.ts` discriminated union keyed on `status`.
- A BullMQ processor for idempotent per-event handling, reusing
  `REDX_STATUS_MAP` and the same consignment-update path
  `SyncConsignmentService` uses.
