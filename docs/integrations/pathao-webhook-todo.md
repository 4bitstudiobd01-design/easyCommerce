# Pathao Webhooks — deferred integration

**Status:** NOT implemented. Order status currently advances by polling
`PathaoCourierAdapter.trackParcel()` (`GET /aladdin/api/v1/orders/{consignment_id}/info`).

This note captures everything needed to build the webhook path later without
re-reading the vendor PDF. Source of truth: `pathaointegrationspec.md.pdf` §8
(kept at repo root), read in full on 2026-09-14.

---

## Why deferred

Steps 1–4 of the Pathao integration (token persistence, store create/list,
location caching, price calculation) were done first as explicitly requested.
Webhooks are their own vertical slice — a public controller, a one-time
handshake, signature verification, and an idempotent async processor. Polling
covers status updates until then. Same reasoning as CarryBee's deferred
webhook — see [[carrybee-webhook-todo]] (`docs/integrations/carrybee-webhook-todo.md`)
for the sibling doc; the two providers' webhook shapes differ in the details
below.

## What exists already

- `PATHAO_WEBHOOK_SECRET` should be stubbed in `backend/.env.example` (a
  merchant-generated secret registered on Pathao's side — NOT the literal
  handshake token below, which is Pathao's own, not per-merchant).
- `PATHAO_STATUS_MAP` in `pathao.adapter.ts` already maps Pathao's
  `order_status_slug` vocabulary to `ConsignmentStatusEnum` for polling —
  webhook events use a very similar vocabulary (see §5 catalog below), reuse
  that map rather than duplicating it if the slugs line up on inspection.

## What to build

### 1. Public webhook controller

`POST` endpoint, e.g. `/api/v1/logistics/webhooks/pathao` — **no auth guard**
(Pathao calls it, can't send our JWT), must be publicly reachable, resolve
within ≤ 3 redirects, valid SSL, **respond within 10 seconds**.

### 2. One-time endpoint verification handshake (special-cased)

Registering the callback URL in the Pathao merchant panel triggers an
immediate verification POST:

```json
{ "event": "webhook_integration" }
```

Response requirements for **this request only**:

- HTTP **202**
- Return a response header **`X-Pathao-Merchant-Webhook-Integration-Secret`**
  whose value is **exactly**:

  ```
  f3992ecc-59da-4cbe-a049-a13da2018d51
  ```

  This is a **literal value from Pathao's own docs page** — it is Pathao's own
  verification token proving the handshake was handled, **not** a
  per-merchant secret and **not** `PATHAO_WEBHOOK_SECRET`. Hardcode it (or put
  it in config as `PATHAO_WEBHOOK_HANDSHAKE_SECRET` for clarity), but do not
  confuse it with the merchant-generated `PATHAO_WEBHOOK_SECRET` used below.
- Do **not** route this through normal event processing.

If the handshake fails the webhook integration is not considered active.

### 3. Signature verification (every real event)

Every subsequent webhook POST carries:

| Header | Value |
|---|---|
| `X-PATHAO-Signature` | The secret **we** provided when registering the webhook (`PATHAO_WEBHOOK_SECRET`) |
| `Content-Type` | `application/json` |

Verify `X-PATHAO-Signature === PATHAO_WEBHOOK_SECRET` server-side before
trusting the payload. Unlike CarryBee (where the signing algorithm is
unconfirmed), Pathao's spec describes this as a direct shared-secret compare,
not an HMAC — but confirm with a live test event before shipping, since the
spec doc is a distillation, not the raw vendor page.

### 4. Ack fast, process async

- Return **202** quickly (well inside the 10s window).
- Push the raw payload onto a BullMQ queue.
- A worker updates the consignment + emits domain events (reuse
  `SyncConsignmentService` / the same status-write path booking and polling
  use, and `PATHAO_STATUS_MAP` for the status translation).
- Do heavy work (emails, notifications) asynchronously — never synchronously
  in the controller.

### 5. Idempotency

Pathao may retry deliveries. Dedupe on `(consignment_id, event, updated_at)`
before processing — a unique index on a `courier_webhook_events` table, or
Redis `SETNX` with a short TTL (same approach as CarryBee's
`(consignment_id, event, timestamptz)`).

### 6. Payload shape

Guaranteed base fields on every event, plus event-specific extras (log
unrecognized `event` values rather than throwing — Pathao may add new types):

```json
{
  "consignment_id": "DL121224VS8TTJ",
  "merchant_order_id": "TS-123",
  "updated_at": "2024-12-27 23:49:43",
  "timestamp": "2024-12-27T17:49:43+00:00",
  "store_id": 130820,
  "event": "order.created",
  "delivery_fee": 83.46
}
```

`order.delivered` example (extra field `collected_amount` instead of `delivery_fee`):

```json
{
  "consignment_id": "DL121224VS8TTJ",
  "merchant_order_id": "TS-123",
  "updated_at": "2024-12-27 23:53:23",
  "timestamp": "2024-12-27T17:49:43+00:00",
  "store_id": 130820,
  "event": "order.delivered",
  "collected_amount": 60
}
```

Look up the local order/shipment by `merchant_order_id` first (that's our own
reference — always send it on order creation), falling back to
`consignment_id`.

### 7. Event catalog

Order Created, Order Updated, Pickup Requested, Assigned For Pickup, Pickup,
Pickup Failed, Pickup Cancelled, At the Sorting Hub, In Transit, Received at
Last Mile Hub, Assigned for Delivery, Delivered, Partial Delivery, Return,
Delivery Failed, On Hold, Payment Invoice, Paid Return, Exchange, Store
Created, Store Updated, Return Id Created, Return In Transit, Returned To
Merchant.

Selectable individually in the merchant panel's Webhook Integration setup, or
"Select All".

## Suggested layout (adapt to this repo's structure)

Belongs in the existing `logistics` module, not a new tree — mirrors CarryBee's plan:

- `logistics.controller.ts` (or a dedicated `logistics-webhook.controller.ts`) —
  the public POST, handling both the handshake and real events.
- A guard/util for the handshake header echo + `X-PATHAO-Signature` check.
- A `pathao-webhook.types.ts` discriminated union keyed on `event`.
- A BullMQ processor for idempotent per-event handling, updating consignments
  through the same path `SyncConsignmentService` uses.

## Env vars to add when building this

```
PATHAO_WEBHOOK_SECRET=            # merchant-generated, registered on Pathao's Webhook Integration page — used for X-PATHAO-Signature
```

(The handshake header value is Pathao's own literal constant — see §2 above —
not something to generate or store per merchant.)
