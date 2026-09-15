# Paperfly Webhooks — deferred integration

**Status:** NOT implemented. Order status currently advances by polling
`PaperflyCourierAdapter.trackParcel()` (`POST /API-Order-Tracking`, whose
response has no single status field — see `deriveStatus()` in the adapter,
which reads the furthest-reached lifecycle-stage key instead).

This note captures everything needed to build the webhook path later without
re-reading the vendor PDF. Source of truth: `paperflyintegrationguide.md.pdf`
§4, §5, §6 (kept at repo root), read in full on 2026-09-15.

---

## Why deferred

Steps 1–2 of the Paperfly integration (real Auth+Create+Track+Cancel Order,
Exchange Order) were done first. Webhooks are their own vertical slice — a
public controller, signature verification, and an idempotent async processor.
Same reasoning as Pathao's/RedX's/CarryBee's deferred webhooks — see
[[pathao-webhook-todo]], [[redx-webhook-todo]], [[carrybee-webhook-todo]] for
the sibling docs. Polling covers status updates until this is built.

## The biggest open question: the signature header name is UNKNOWN

Unlike the other three providers, **Paperfly's own docs don't state the exact
header name** the webhook secret key arrives in (§4 says only: "The secret
key is sent in the request header of each webhook call... exact header name
wasn't shown in the UI text — check the panel or ask Paperfly support for the
header name"). Do not guess a header name and ship signature verification
against it — confirm it first, either:

- by registering a test webhook URL from the Merchant Panel (Developer Guide
  → Webhooks → Configuration) and inspecting a real incoming request, or
- by asking Paperfly support directly.

Until confirmed, treat any header-name assumption in code as unverified and
flag it loudly (e.g. a `// TODO: confirm this is the right header — see
docs/integrations/paperfly-webhook-todo.md` comment), not as a settled fact.

## What to build

### 1. Public webhook controller

`POST` endpoint, e.g. `/api/v1/logistics/webhooks/paperfly` — **no auth
guard** (Paperfly calls it, can't send our JWT).

### 2. Configuration (done by a human, not code)

Merchant Panel → Developer Guide → Webhooks → Configuration: register a
**Webhook Endpoint URL** and a **Secret Key**, then select which events to
subscribe to (§4 event catalog below).

### 3. Signature verification (once the header name is confirmed)

- Compare the incoming header value against the configured secret,
  constant-time.
- Respond **HTTP 200** to acknowledge receipt — that's the whole ack contract
  per the docs (no special status code like Pathao's 202 + echo header, or
  CarryBee's 202 + echo header for its one-time handshake — Paperfly has no
  documented one-time handshake event at all, unlike Pathao/CarryBee).
- **Timeout: 30 seconds. Failed deliveries are retried up to 3 times** — this
  is Paperfly's own documented retry policy, more specific than Pathao's/
  RedX's/CarryBee's undocumented "assume retries happen."

### 4. Ack fast, process async, idempotent

- Return 200 quickly, do heavier work (DB update, notifications) via a queue
  (BullMQ) rather than inline — the 30s window is generous but still a
  budget, and 3 retries means duplicates are expected, not hypothetical.
- Dedupe by `merchant_order_reference + event + timestamp` (§5's own
  recommendation) before acting on an event.

### 5. Payload shape

```json
{
  "event": "parcel.created",
  "timestamp": "2025-12-24T17:28:24+00:00",
  "data": {
    "order_number": "Z-241225-174131-A1-A7",
    "merchant_order_reference": "test12121212",
    "barcode": "231814375965",
    "package_price": 10,
    "recipient": {
      "name": "Shamim Ahammed Shamim",
      "phone": "01685048848",
      "address": "house 1/2, road 6, Kaderabad Housing, Mohammadpur"
    },
    "special_instruction": ""
  }
}
```

`data`'s exact shape likely varies per event type (delivery/return events
probably carry different fields) — the doc itself says so. Validate loosely:
require only `event`, `timestamp`, and a generic `data` object at the schema
level, don't assume this exact shape holds for every event type.

All timestamps are ISO 8601 (UTC).

### 6. Full event catalog (§4)

| Category | Events |
|---|---|
| Order Lifecycle | `parcel.created`, `parcel.invoiced`, `parcel.cancelled` |
| Pickup & Transit | `parcel.picked_up`, `parcel.in_transit`, `parcel.received_at_point` (incl. Pathao point) |
| Delivery | `parcel.assigned_for_delivery`, `parcel.delivered`, `parcel.partial`, `parcel.exchange`, `parcel.on_hold` |
| Returns | `parcel.return`, `parcel.return_transit`, `parcel.return_to_merchant` |

Map these onto `ConsignmentStatusEnum` — note the event names use underscores
(`parcel.picked_up`) while `deriveStatus()` in the adapter works off the
Track Order response's differently-named keys (`Pick`, `inTransit`, etc.);
these are two separate vocabularies for the same lifecycle, don't assume they
line up 1:1 without checking a real payload for each.

## Env vars to add when building this

```
PAPERFLY_WEBHOOK_SECRET=   # the secret key registered in the Merchant Panel's Webhook Configuration
```

## Open items to resolve before shipping this (from the doc's own §6)

- **The exact webhook signature header name** (the blocking unknown above).
- Whether `paperflykey` is also required on the webhook call itself (unlikely
  — webhooks are Paperfly calling us, not us calling them — but not
  explicitly ruled out either).
- Rate limits, if any, on re-registering/updating the webhook config.

## Suggested layout (adapt to this repo's structure)

Belongs in the existing `logistics` module, mirroring Pathao's/RedX's/
CarryBee's plan:

- `logistics.controller.ts` (or a dedicated `logistics-webhook.controller.ts`) —
  the public POST, validating the signature header (once confirmed) first.
- A `paperfly-webhook.types.ts` loose schema (event/timestamp/data only,
  per §5's "validate loosely" note above).
- A BullMQ processor for idempotent per-event handling, updating consignments
  through the same path `SyncConsignmentService` uses.
