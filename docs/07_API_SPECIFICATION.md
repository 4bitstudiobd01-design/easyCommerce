# 07_API_SPECIFICATION.md - API Specification

# BitCommerce RESTful API Standard & Endpoint Definitions

**Version:** 0.1.0  
**Status:** Draft  

---

## 1. API Standards & Headers

* Base URL: `https://api.bitcommerce.app/v1`
* Content-Type: `application/json`
* Tenant Header: `X-Tenant-ID: <tenant_id_or_slug>` (automatically inferred on custom storefront domains).
* Authorization: `Bearer <jwt_token>`

---

## 2. Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "The requested product does not exist.",
    "details": []
  }
}
```

---

## 3. High-Level Endpoint Map

### Authentication & Tenant
* `POST /v1/auth/register` - Merchant registration
* `POST /v1/auth/login` - User login
* `POST /v1/auth/refresh` - Exchange a refresh token for a new access token
* `POST /v1/auth/forgot-password` - Request a password reset OTP by email (enumeration-safe: always returns the same generic 200 message whether or not the email exists)
* `POST /v1/auth/reset-password` - Reset password using the emailed OTP (invalidates existing sessions on success)
* `GET /v1/tenant/profile` - Tenant details

### Catalog APIs (Public & Admin)
* `GET /v1/products` - List products (filterable by category, price, search)
* `GET /v1/products/:slug` - Product details
* `POST /v1/admin/products` - Create product (Admin)

### Checkout & Orders
* `POST /v1/cart/checkout` - Initiate checkout & reserve stock
  ```json
  // Request Payload
  {
    "items": [
      { "variantId": "uuid-variant-id", "quantity": 2 }
    ],
    "customer": {
      "name": "Rahim Ahmed",
      "phone": "+8801711000000",
      "address": "House 12, Road 5, Block B",
      "city": "Dhaka",
      "zone": "Mirpur"
    },
    "paymentMethod": "BKASH" | "NAGAD" | "COD"
  }
  ```
* `GET /v1/orders/:id` - Get order status & tracking
* `GET /v1/orders` - Merchant order list. Query: `page`, `limit` (max 100), `search`,
  `status`, `paymentStatus`, `courier`, `branchId`, `channel`, `utmSource`,
  `utmCampaign`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`. The `channel` /
  `utmSource` / `utmCampaign` filters back the Sales-by-Source report drill-down.
* `POST /v1/admin/orders/:id/fulfill` - Trigger courier booking

### Payments — Merchant Dashboard (implemented)
All routes below require `Authorization: Bearer <jwt>` and are scoped to the caller's
tenant server-side. `X-Store-Id` selects the active store for multi-store merchants.
Reads require the `orders:read` permission; export requires `orders:manage`.

* `GET /v1/payments/transactions` - Paginated, filterable, searchable transaction list.
  * Query: `page`, `limit` (max 100), `search`, `status`, `gateway`, `paymentMethod`,
    `dateRange` (`today|yesterday|7d|30d|90d|custom`), `dateFrom`, `dateTo`, `timezone`,
    `minAmount`, `maxAmount`, `currency`, `sortBy`, `sortOrder`.
  * `search` matches transaction number, gateway reference, order number, customer name/phone.
  ```json
  {
    "success": true,
    "data": {
      "data": [{
        "id": "uuid",
        "transactionNumber": "TXN-10245",
        "gatewayTransactionId": "SSLCZ-8F92...",
        "orderId": "uuid",
        "orderNumber": "EC-1024",
        "customer": { "id": "uuid", "name": "Rahim Hossain", "phone": "+8801712345678" },
        "gateway": "SSLCOMMERZ", "gatewayLabel": "SSLCommerz",
        "paymentMethod": "BKASH", "paymentMethodLabel": "bKash",
        "amount": 4500, "refundedAmount": 0, "currency": "BDT",
        "status": "COMPLETED", "isRefundable": true,
        "createdAt": "2025-08-14T04:46:00.000Z", "paidAt": "2025-08-14T04:46:00.000Z"
      }],
      "meta": { "page": 1, "limit": 10, "total": 245, "totalPages": 25 }
    }
  }
  ```
* `GET /v1/payments/transactions/summary` - KPIs, donut overview, top methods, gateways.
  Accepts the same filters (except `page`/`limit`); the `status` filter is deliberately
  **not** applied so the paid/pending/refunded split stays visible while the table is narrowed.
  `changePercent` is `null` when the previous period is zero.
* `GET /v1/payments/transactions/export` - CSV of the **entire filtered set** (not one page),
  capped at 10,000 rows (`X-Export-Row-Count`, `X-Export-Truncated` headers). Requires `orders:manage`.
* `GET /v1/payments/transactions/:id` - Full payment details incl. refunds and lifecycle timeline.
  Returns `404` for another tenant's payment so existence is never leaked.
* `GET /v1/payments/gateways` - The merchant's gateways. Never returns credentials.
* `POST /v1/payments/transactions/seed-demo-data` - Seeds demo data; disabled in production.

### Marketing — Pixels, Tracking & Attribution (Merchant Dashboard)

All routes require `Authorization: Bearer <jwt>` and are scoped to the caller's tenant
server-side. `X-Store-Id` selects the active store. Reads require `marketing:read`;
writes require `marketing:manage` (RBAC matrix: Store Owner = Manage, Store Manager =
Manage, Accountant/Fulfilment = none). Credential fields (`accessToken`, `apiSecret`,
`testEventCode`) are **write-only** — accepted on create/update, never returned; a
`hasCredentials: boolean` flag is returned instead.

**Dashboard**
* `GET /v1/marketing/dashboard` - KPI cards only (`marketing:read`): **Connected
  Pixels** `{count, total}` = CONNECTED vs all `MarketingPixel` rows; **Active Pixels**
  = `CONNECTED && isActive`; **Events Today / Events Failed / Success Rate** from
  `MarketingEventLog`. Store scope resolved server-side from the JWT + `X-Store-Id`
  (no `X-Tenant-Id` needed). `integrations` returns `[]` (legacy, unused).

**Pixels (multi-instance)**
* `GET /v1/marketing/pixels` - List every configured pixel instance for the store.
  ```json
  {
    "success": true,
    "data": [{
      "id": "uuid",
      "provider": "META",
      "label": "Retargeting Pixel",
      "pixelId": "1234567890",
      "hasCredentials": true,
      "capiEnabled": true,
      "pageScopeMode": "RULES",
      "status": "CONNECTED",
      "isActive": true,
      "lastEventAt": "2026-09-09T04:46:00.000Z",
      "pageRules": [
        { "id": "uuid", "matchType": "PAGE_TYPE", "pageType": "PRODUCT", "include": true },
        { "id": "uuid", "matchType": "URL_PATTERN", "urlPattern": "/product/clearance-*", "include": false }
      ]
    }]
  }
  ```
* `POST /v1/marketing/pixels` - Create a pixel instance. Same provider may be created
  more than once; `label` must be unique per `(store, provider)`.
  ```json
  // Request
  {
    "provider": "META",
    "label": "Retargeting Pixel",
    "pixelId": "1234567890",
    "credentials": { "accessToken": "EAAB...", "testEventCode": "TEST12345" },
    "capiEnabled": true,
    "pageScopeMode": "RULES",
    "isActive": true
  }
  ```
  * `409` if `label` collides with an existing pixel of the same provider in the store.
* `GET /v1/marketing/pixels/:id` - One pixel with its page rules. `404` for another
  tenant's pixel (existence never leaked).
* `PUT /v1/marketing/pixels/:id` - Partial update (label, pixelId, credentials,
  `capiEnabled`, `pageScopeMode`, `isActive`, `status`). Omitting `credentials` leaves
  the stored secret untouched; `credentials: null` clears all; a single field sent as
  `""` / `null` clears just that field (merged over the stored bag).
* `DELETE /v1/marketing/pixels/:id` - Remove a pixel instance. Its `MarketingEventLog`
  history is retained with `pixelId` set null; its page rules cascade-delete.
* `POST /v1/marketing/pixels/:id/test` - Fire a single simulated event through this
  pixel (browser + CAPI if enabled) and return the resulting log row(s).
  ```json
  // Request
  { "eventName": "Purchase", "orderRef": "#ORD-TEST", "customPayload": { } }
  ```
* `POST /v1/marketing/pixels/test-all` - Fire a `PageView` through every
  connected+active pixel; returns a per-pixel pass/fail summary.

**Per-pixel page-targeting rules**
* `GET /v1/marketing/pixels/:id/page-rules` - List rules for one pixel.
* `PUT /v1/marketing/pixels/:id/page-rules` - Replace the full rule set for one pixel
  (atomic). Only meaningful when `pageScopeMode = RULES`.
  ```json
  // Request
  {
    "rules": [
      { "matchType": "PAGE_TYPE", "pageType": "PRODUCT", "include": true },
      { "matchType": "PAGE_TYPE", "pageType": "CHECKOUT", "include": true },
      { "matchType": "URL_PATTERN", "urlPattern": "/product/clearance-*", "include": false }
    ]
  }
  ```
  * `pageType` ∈ `HOME|PRODUCT|COLLECTION|CATEGORY|CART|CHECKOUT|THANK_YOU|SEARCH|BLOG|OTHER`.
  * `urlPattern`: leading-slash path glob, case-insensitive, `*` = one segment,
    `**` = any depth. `400` on an invalid pattern.

**Standard-event master switches**
* `GET /v1/marketing/events` - The five standard event configs and their `isActive`.
* `PATCH /v1/marketing/events/:eventName` - Toggle one event on/off store-wide.
  ```json
  { "isActive": false }
  ```

**Sales-by-Source report & ad spend (Phase A — ships first)**
* `GET /v1/analytics/traffic-sources` - *(existing route, widened)* now accepts an
  optional `groupBy` = `channel` (default, unchanged) | `source` (by `utmSource`,
  falling back to `channel` when null) | `campaign` (by `utmCampaign`). Row shape gains
  a `dimension` + `dimensionValue` pair; `channel` callers are unaffected.
* `GET /v1/marketing/attribution/source-sales` - The Sales-by-Source table: grouped
  traffic rows joined to `MarketingAdSpend` for the same dimension + overlapping
  period.
  * Query: `groupBy` (`channel|source|campaign`), `dateRange`/`dateFrom`/`dateTo`,
    `page`, `limit`.
  * Query: `groupBy` (`channel|source|campaign`), `dateFrom`/`dateTo`.
  ```json
  {
    "success": true,
    "data": {
      "rows": [{
        "dimension": "source", "dimensionValue": "facebook",
        "sessions": 1240, "orders": 96, "revenue": 432000, "currency": "BDT",
        "conversionRate": 7.7,
        "spend": 90000, "roas": 4.8, "cpa": 937.5
      }],
      "deliveryHealth": [
        { "pixelId": "uuid", "provider": "META", "label": "Main Meta Pixel",
          "purchaseSent": 92, "purchaseFailed": 4 }
      ]
    }
  }
  ```
  * `roas` / `cpa` are `null` when `spend` is 0 or no `MarketingAdSpend` row overlaps.
  * `deliveryHealth` is one entry per `capiEnabled` pixel — the count of
    `transport = SERVER` `Purchase` event-log rows in the window, `SENT` vs `FAILED`.
* `GET /v1/marketing/ad-spend` - List the merchant's ad-spend entries.
  Query: `dimension`, `dateRange`/`dateFrom`/`dateTo`. `marketing:read`.
* `PUT /v1/marketing/ad-spend` - Upsert one spend entry (`marketing:manage`). Entries
  are **per calendar month** — `periodStart` = 1st, `periodEnd` = last day. With no
  `id`, an existing row for the same `(dimension, dimensionValue, exact period)` is
  overwritten rather than duplicated, so re-saving a month edits it in place.
  ```json
  { "dimension": "SOURCE", "dimensionValue": "facebook",
    "periodStart": "2026-09-01", "periodEnd": "2026-09-30",
    "amount": 90000, "currency": "BDT", "note": "Eid campaign" }
  ```
* `DELETE /v1/marketing/ad-spend/:id` - Remove one entry (`marketing:manage`).

**Event log & attribution reporting**
* `GET /v1/marketing/logs` - Paginated `MarketingEventLog` (newest first),
  `marketing:read`. Each row carries `pixelLabel` (resolved), `provider`, `eventName`,
  `transport`, `status`, `httpStatus`, `errorMessage`, `orderRef`, `utmSource`,
  `createdAt`.
  * Query: `page`, `limit` (max 100), `pixelId`, `provider`, `eventName`, `transport`
    (`BROWSER|SERVER`), `status` (`SENT|FAILED`), `dateFrom`, `dateTo`.

*(A dedicated `GET /v1/marketing/attribution/orders` per-order pixel-attribution table
was folded into the Sales-by-Source drill-down (row → filtered order list) + the
`deliveryHealth` strip. `GET /v1/marketing/attribution/summary` is likewise covered by
`source-sales`. Revisit if order-level pixel attribution is explicitly requested.)*

**Storefront (public, unauthenticated)**
* `GET /v1/storefront/:slug/pixels` - The active pixels + their page rules for a store,
  **without** any credential material — consumed by the storefront pixel loader to
  decide which `<script>` tags to inject and which events to fire per page. `tenantId`
  resolved server-side from `:slug`. Response:
  `{ pixels: [{ id, provider, pixelId, pageScopeMode, pageRules[] }], eventConfig: { <EventName>: boolean } }`
  — `eventConfig` is the store-wide master switch per standard event; a name missing
  from the map means "on".
* `POST /v1/marketing/events/ingest` - Public browser-event beacon (fires alongside the
  existing `POST /v1/tracking/visit`). Records a `MarketingEventLog` row with
  `transport = BROWSER` and, when `capiEnabled`, enqueues the server-side mirror.
  ```json
  { "sessionId": "uuid", "storeSlug": "mystore", "pixelId": "uuid",
    "eventName": "ViewContent", "pagePath": "/product/silk-panjabi",
    "payload": { "content_ids": ["prod-101"], "value": 3250, "currency": "BDT" } }
  ```

**Server-side dispatch (internal)**
* Not a public route. Three triggers feed it:
  * `CreateOrderService` enqueues a `Purchase` job on the `marketing-capi` BullMQ
    queue after an order is saved (best-effort; a lost job never fails checkout).
    `MarketingCapiProcessor` fans it to every `capiEnabled` pixel whose page rules
    allow `/checkout/success`; 4 attempts with exponential backoff.
  * the public `POST /v1/marketing/events/ingest` beacon → for `capiEnabled` pixels,
    mirrors `PageView` / `ViewContent` / `AddToCart` / `InitiateCheckout`
    server-side (fire-and-forget; a failure is a `FAILED` log row, no retry).
  * `POST /v1/marketing/pixels/:id/test` → a real server round-trip when the pixel
    has credentials, so a merchant can verify each provider connection.
* For each, `DispatchServerEventService` decrypts credentials, checks the provider
  adapter's `canDispatch`, POSTs (Meta CAPI / TikTok Events API / GA4 Measurement
  Protocol / Google Ads — PII SHA-256 hashed first), and writes a `MarketingEventLog`
  row with `transport = SERVER`, `status`, `httpStatus`, `errorMessage`, hashed
  `payloadJson`. It never throws.

### Payment & Courier Webhooks
* `POST /v1/webhooks/payments/bkash` - bKash callback listener
  ```json
  // Callback Payload
  {
    "paymentID": "TR00239102",
    "status": "Completed",
    "trxID": "9A8B7C6D",
    "amount": "1250.00"
  }
  ```
* `POST /v1/webhooks/courier/steadfast` - Delivery status updates

---

## 4. Standard HTTP Status Codes

* `200 OK`: Successful read or update operation.
* `201 Created`: Entity created successfully.
* `400 Bad Request`: Validation error or malformed payload.
* `401 Unauthorized`: Missing or invalid JWT token.
* `403 Forbidden`: Insufficient RBAC permission.
* `404 Not Found`: Resource does not exist under tenant context.
* `422 Unprocessable Entity`: Business logic rule failed (e.g., insufficient stock).
* `500 Internal Error`: Unexpected server failure.

