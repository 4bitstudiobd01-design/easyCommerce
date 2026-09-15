# CarryBee Webhooks — deferred integration

**Status:** NOT implemented. Order status currently advances by polling
`CarrybeeCourierAdapter.trackParcel()` (`GET /api/v2/orders/{consignment_id}/details`).

This note captures everything needed to build the webhook path later without
re-reading the vendor PDF. Source of truth: `CARRYBEE_INTEGRATION.md.pdf` §7,
§9, §10, §11 (kept at repo root).

---

## Why deferred

The current task was "connect + test + book" for Pathao / Steadfast / RedX /
CarryBee. Webhooks are a separate vertical slice: a public controller, a
one-time handshake, signature verification, and an idempotent async processor.
Polling covers status updates until then.

## What exists already

- `CARRYBEE_WEBHOOK_INTEGRATION_SECRET` and `CARRYBEE_WEBHOOK_SIGNING_SECRET`
  stubbed in `backend/.env.example`.
- `CARRYBEE_STATUS_MAP` in `carrybee.adapter.ts` already maps the full
  `order.<status>` event vocabulary to `ConsignmentStatusEnum` — reuse it, do
  not duplicate.
- Adapter header comment points here.

## What to build

### 1. Public webhook controller

`POST` endpoint, e.g. `/api/v1/logistics/webhooks/carrybee` — **no auth guard**
(CarryBee calls it), must be publicly reachable, valid SSL, resolve within
≤ 3 redirects.

### 2. One-time integration handshake (special-cased)

First request CarryBee sends after you set the URL on their dashboard:

```json
{ "event": "webhook.integration" }
```

Response requirements for **this request only**:

- HTTP **202**
- Echo header `X-CB-Webhook-Integration-Header` back with **exactly** the secret
  value CarryBee showed on the Webhook Integration page
  (`CARRYBEE_WEBHOOK_INTEGRATION_SECRET`).
- Do **not** route through normal event processing.

If the handshake fails the webhook is never marked active.

### 3. Signature verification (every real event)

Every subsequent POST carries:

```
X-Carrybee-Webhook-Signature: "{{WEBHOOK_SIGNATURE}}"
```

Validate server-side against `CARRYBEE_WEBHOOK_SIGNING_SECRET` before trusting
the body. **Open question (§11):** the docs describe the header but not the exact
algorithm (HMAC-SHA256 of raw body? shared-secret compare?). Confirm with a
sandbox test-event round trip before writing the check. Until confirmed, do not
ship the verification as "done".

### 4. Ack fast, process async

- Return **202** immediately.
- Push the raw payload onto a BullMQ queue.
- A worker updates the consignment + emits domain events (reuse
  `SyncConsignmentService` / the same status-write path booking uses).
- CarryBee's retry/timeout policy is undocumented (§11) — treat the endpoint as
  needing to be reliably fast and idempotent regardless.

### 5. Idempotency

Dedupe on `(consignment_id, event, timestamptz)` before processing — a unique
index on a `courier_webhook_events` table, or Redis `SETNX` with a short TTL.

### 6. Common payload envelope

```json
{
  "event": "order.<status>",
  "store_id": "a1b2c3d4",
  "consignment_id": "FX1212124433",
  "merchant_order_id": "order-1234",
  "timestamptz": "2025-07-30T10:11:12+00:00"
}
```

Extra fields on some events (see `CARRYBEE_STATUS_MAP` keys / PDF §7.4):

| Event | Extra fields |
|---|---|
| `order.created`, `order.updated` | `collectable_amount`, `cod_fee`, `delivery_fee` |
| `order.delivered` | `collected_amount`, `attempt`, `remarks` |
| `order.partial-delivery` | `collected_amount`, `attempt`, `reason`, `remarks` |
| `order.delivery-failed` | `attempt`, `reason`, `remarks` |
| `order.returned` | `reason`, `remarks` |
| `order.paid-return`, `order.exchange` | `collected_amount`, `reason`, `remarks` |

`reason` / `remarks` are "may or may not contain data" — treat as nullable.

### 7. Open questions to settle in sandbox (PDF §11)

- Exact signing algorithm for `X-Carrybee-Webhook-Signature`.
- Exact payload for `order.paid`, `order.returned-at-sorting`,
  `order.returned-in-transit`, `order.returned-to-merchant` (documented as
  base-envelope-only, but neighbouring "returned" events carry `reason`/`remarks`).
- Webhook retry policy / backoff.

## Suggested layout (from PDF §9 — adapt to this repo's structure)

Webhook pieces belong in the existing `logistics` module, not a new `courier/`
tree. Roughly:

- `logistics.controller.ts` (or a dedicated `logistics-webhook.controller.ts`) —
  the public POST.
- A guard/util for the handshake echo + signature check.
- A `carrybee-webhook.types.ts` discriminated union keyed on `event`.
- A BullMQ processor for idempotent per-event handling.
