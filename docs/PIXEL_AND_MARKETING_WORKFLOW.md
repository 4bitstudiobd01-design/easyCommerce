# PIXEL_AND_MARKETING_WORKFLOW.md — Build Checklist

**Scope:** Option C — multi-instance pixels + per-page targeting (page-type **and**
URL-pattern) + **browser + server-side for every event** + order attribution.
**Design:** `docs/06_DATABASE_DESIGN.md` §3.9b · `docs/07_API_SPECIFICATION.md`
"Marketing — Pixels, Tracking & Attribution" · `docs/10_MARKETING_PIXEL_IMPLEMENTATION_PLAN.md`

**How to use this file:** each task is a checkbox. Mark `[x]` when the task is done,
built, and (where it has code) type-checks. Do **not** run a full `npm run build`
without explicit approval — verify with `npx tsc --noEmit`.

---

## Decisions locked (from the 2026-09-09 discussion)

1. **Single source of truth = `MarketingPixel` table.** `stores.*PixelId` /
   `*CapiToken` / `*TestEventCode` become read-only legacy, data-migrated once, dropped
   in the final phase.
2. **Page targeting = both** `PAGE_TYPE` and `URL_PATTERN`, with include/exclude rules.
3. **Encryption is already solved** — reuse the existing shared AES-256-GCM helper
   pattern (`CredentialsCryptoService` in logistics / `omnichannel-crypto.util.ts`).
   Key comes from `CREDENTIALS_ENCRYPTION_KEY` env, falls back to `JWT_SECRET` in dev.
   **No new key, no new crypto code** — a thin marketing-scoped wrapper only.
4. **All providers get browser + server-side**, wired for whichever a merchant can
   supply credentials for; each is tested only when its credentials are present.
   Meta CAPI, TikTok Events API, GA4 Measurement Protocol, Google Ads (OAuth +
   developer token) — all built, each gated on "has credentials".
5. **All standard events get browser + server-side** — `PageView`, `ViewContent`,
   `AddToCart`, `InitiateCheckout`, `Purchase`. Nothing is browser-only.
6. **`urlPattern` glob = hand-rolled** (~30 lines, `*` = one segment, `**` = any
   depth). No new dependency.
7. **eCommerce branch only** — no changes outside the `ecommerce` branch's scope.

---

## Phase A — Source-wise Sales Report + ROAS (ship first)  ·  status: backend done, frontend pending

Independent of everything below — needs only data that already exists
(`storefront_sessions` + `orders.channel/utmSource/utmMedium/utmCampaign`). This is the
"which order came from which platform" report (MKT-003), moved ahead of the pixel
rebuild because it is the highest value for the least work.

### Backend
- [x] A.1 Extend `tracking/services/get-traffic-sources.service.ts`: accept a
      `groupBy` param (`channel | source | campaign`). `channel` = today's behaviour;
      `source` = `GROUP BY COALESCE(NULLIF(utmSource,''), channel)`; `campaign` =
      same with `utmCampaign`. Join + `sessionId` matching to `orders` unchanged. Row
      shape gains `dimension` + `dimensionValue`; `channel` kept as a back-compat alias.
- [x] A.2 `GET /v1/analytics/traffic-sources` — optional `groupBy` query param added to
      `AnalyticsQueryDto` + controller passes it through. `docs/07` documents the
      widened row shape. Existing callers (no `groupBy`) unchanged.
- [x] A.3 `MarketingAdSpend` entity + `marketing_ad_spends` table — `id`, `tenantId`,
      `storeId`, `dimension` (`CHANNEL|SOURCE|CAMPAIGN` enum), `dimensionValue`,
      `periodStart`/`periodEnd` (date), `amount` (numeric 14,2), `currency` (default
      BDT), `note`, `createdAt`, `updatedAt`. Indexes `(tenantId, storeId)` +
      `(tenantId, storeId, dimension, periodStart)`. Migration hand-written
      (generator carried unrelated drift) + run.
- [x] A.4 Ad-spend CRUD services (`list-ad-spend`, `upsert-ad-spend`,
      `delete-ad-spend`, one file each). Routes `GET/PUT /v1/marketing/ad-spend`,
      `DELETE /v1/marketing/ad-spend/:id` behind `PermissionsGuard` +
      `@RequirePermissions` (`marketing:read` to read, `marketing:manage` to write).
      `marketing:read` / `marketing:manage` added to `StaffPermissionType` +
      `ALL_PERMISSIONS`. `StaffModule` imported for `GetMyPermissionsService`.
- [x] A.5 `get-source-sales-report.service.ts` — reuses `GetTrafficSourcesService`
      (via `TrackingModule` import), joins grouped rows in memory to `MarketingAdSpend`
      for the same dimension + overlapping period. Returns `sessions`, `orders`,
      `revenue`, `conversionRate`, `spend`, `currency`, `roas` (null when spend 0/absent),
      `cpa` (null when spend 0/absent or 0 orders). Route
      `GET /v1/marketing/attribution/source-sales` (`marketing:read`), window = explicit
      dates or trailing 7 days. Full `AppModule` boot verified (`APP_DI_OK`).

### Frontend (`frontend/src/features/marketing/`)
- [ ] A.6 New **"Sales by Source"** tab on the Marketing page: dimension switch
      (Channel / Source / Campaign), table — dimension, Sessions, Orders, Revenue,
      Conv Rate, Spend, ROAS, CPA. Reuse `ChannelBadge` for the source column.
- [ ] A.7 Inline ad-spend entry: per row, an editable Spend cell + period picker that
      calls `upsert-ad-spend`; ROAS/CPA recompute on save.
- [ ] A.8 Per-row drill-down → the merchant order list filtered by that
      `channel` / `utmSource` / `utmCampaign` (order list already supports these
      filters — verify `list-merchant-orders.service`).
- [ ] A.9 `marketingApi.ts` endpoints + hooks for source-sales + ad-spend.
- [ ] A.10 `npx tsc --noEmit` clean; backend `npm run test` green (ask before `build`).

### Later hook-in
- [ ] A.11 (done in Phase 5) add a per-pixel "Purchase events delivered" column to
      this same report once `MarketingEventLog` carries `transport = SERVER` rows.

---

## Phase 0 — Foundations  ·  status: ☐

- [ ] 0.1 Add `marketing:read` and `marketing:manage` to the RBAC permission
      list/enum; wire the guard decorators the same way other modules do.
- [ ] 0.2 Update the RBAC seed/matrix so Store Owner + Store Manager get
      `marketing:manage`, Accountant gets `marketing:read`, Fulfilment gets neither.
- [ ] 0.3 `MarketingPixelCryptoService` — thin wrapper over the existing shared
      AES-256-GCM helper (encrypt / decrypt / mask / merge a credential bag). No new
      key material; reuse `CREDENTIALS_ENCRYPTION_KEY`.
- [ ] 0.4 Redesign `MarketingPixel` entity: add `label`, `credentialsEncrypted`
      (`text`, nullable), `capiEnabled` (bool, default false), `pageScopeMode`
      (`ALL | RULES`, default `ALL`), `isActive` (bool, default true). Remove the
      implicit `(tenantId, storeId, provider)` uniqueness; add unique
      `(storeId, provider, label)` and index `(tenantId, storeId, provider)`.
- [ ] 0.5 New `MarketingPixelPageRule` entity: `id`, `tenantId`, `storeId`,
      `pixelId` (FK, `ON DELETE CASCADE`), `matchType` (`PAGE_TYPE | URL_PATTERN`),
      `pageType` (enum, nullable), `urlPattern` (varchar, nullable), `include`
      (bool, default true), `createdAt`. Index `(pixelId)`.
- [ ] 0.6 Extend `MarketingEventLog` entity: add `pixelId` (FK, `ON DELETE SET
      NULL`), `provider`, `transport` (`BROWSER | SERVER`), `sessionId`, `orderId`,
      `orderRef`, `utmSource`, `utmMedium`, `utmCampaign`, `httpStatus`,
      `errorMessage`. Indexes `(tenantId, storeId, createdAt)`,
      `(tenantId, storeId, eventName)`, `(tenantId, storeId, orderId)`, `(pixelId)`.
- [ ] 0.7 Keep `MarketingEventConfig` as-is; keep `ToggleTrackingEventService`
      (it was removed from the controller earlier — re-add its route in Phase 1).
- [ ] 0.8 `npm run migration:generate -- MarketingPixelRedesign`; hand-review the
      generated SQL; `npm run migration:run`.
- [ ] 0.9 Data-migration script: for each store, copy any non-null
      `facebookPixelId` / `facebookCapiToken` / `facebookTestEventCode` /
      `tiktokPixelId` / `googleAnalyticsId` (+ `googleTagManagerId`,
      `snapchatPixelId`, `pinterestTagId` if kept) into an equivalent
      `MarketingPixel` row (`label = "Imported <provider>"`, `pageScopeMode = ALL`,
      `status = CONNECTED`, credentials encrypted).
- [ ] 0.10 Backend `npm run build` + `npm run test` green (ask before `build`).

---

## Phase 1 — Pixel CRUD (backend + admin UI)  ·  status: ☐

### Backend
- [ ] 1.1 `list-pixels.service.ts` — all pixel instances for the store; credentials
      stripped, `hasCredentials` flag added.
- [ ] 1.2 `create-pixel.service.ts` — encrypt credentials on write; `409` on
      `(store, provider, label)` collision.
- [ ] 1.3 `get-pixel.service.ts` — one pixel + its page rules; `404` (not `403`)
      cross-tenant.
- [ ] 1.4 `update-pixel.service.ts` — partial update; omitted `credentials` leaves
      the stored secret untouched; `credentials: null` clears it (merge helper).
- [ ] 1.5 `delete-pixel.service.ts` — hard-delete the pixel; page rules cascade;
      `MarketingEventLog.pixelId` set null.
- [ ] 1.6 `dispatch-test-event.service.ts` (rebuild) — fire one simulated event
      through a given pixel (browser payload + CAPI if `capiEnabled` and creds
      present); return the resulting log row(s).
- [ ] 1.7 `test-all-pixels.service.ts` — fire `PageView` through every
      connected + active pixel; per-pixel pass/fail summary.
- [ ] 1.8 DTOs + class-validator for every route.
- [ ] 1.9 Controller routes: `GET/POST /v1/marketing/pixels`,
      `GET/PATCH/DELETE /v1/marketing/pixels/:id`,
      `POST /v1/marketing/pixels/:id/test`, `POST /v1/marketing/pixels/test-all`,
      `PATCH /v1/marketing/events/:eventName`, `GET /v1/marketing/events`.
      All behind `JwtAuthGuard` + `marketing:*` RBAC + tenant scope.
- [ ] 1.10 `get-marketing-dashboard.service.ts` — keep KPI cards working
      (Connected/Active pixels now = count of `MarketingPixel` rows; Events
      Today/Failed/Success from `MarketingEventLog`). Integration list = one entry
      per pixel instance.

### Frontend (`frontend/src/features/marketing/`)
- [ ] 1.11 `marketingApi.ts` — add `getPixels`, `createPixel`, `getPixel`,
      `updatePixel`, `deletePixel`, `testPixel`, `testAllPixels`, `getEventConfigs`,
      `toggleEventConfig` endpoints + hooks.
- [ ] 1.12 Replace `ConnectPixelModal` with a **pixel list** (grouped by provider,
      showing label + status + last event) and a **create/edit drawer**: provider
      picker, label, pixel id, credential fields (per provider), `capiEnabled`
      toggle, `isActive` toggle.
- [ ] 1.13 "Add Pixel" flow: pick provider → fill label + id + credentials →
      submit → row appears. Same provider can be added again.
- [ ] 1.14 Standard-event master switches back on the page (the 5 toggles), wired
      to `PATCH /v1/marketing/events/:eventName`.
- [ ] 1.15 `npx tsc --noEmit` clean; no unused imports.

---

## Phase 2 — Page-targeting rules  ·  status: ☐

- [ ] 2.1 `url-pattern.util.ts` — hand-rolled glob matcher (`*` one segment, `**`
      any depth, leading slash, case-insensitive) + validator. Unit-tested.
- [ ] 2.2 `resolve-pixel-fires.util.ts` — pure function
      `(pathname, pageType, rules, pageScopeMode) => boolean`. Resolution order:
      any `include=false` match → no; else any `include=true` match → yes; else no.
      `ALL` mode → always yes. Unit-tested.
- [ ] 2.3 `get-page-rules.service.ts` + `replace-page-rules.service.ts` (atomic
      full-set replace).
- [ ] 2.4 Controller: `GET /v1/marketing/pixels/:id/page-rules`,
      `PUT /v1/marketing/pixels/:id/page-rules`. `400` on invalid `urlPattern`.
- [ ] 2.5 `pageScopeMode` switch handled in `update-pixel.service.ts`.
- [ ] 2.6 Frontend rule editor inside the pixel drawer: repeatable rows of
      {matchType, pageType | urlPattern, include}. `pageType` options:
      `HOME | PRODUCT | COLLECTION | CATEGORY | CART | CHECKOUT | THANK_YOU | SEARCH | BLOG | OTHER`.
- [ ] 2.7 Frontend "will fire on…" live preview using the shared resolver
      (ported/duplicated as a small TS mirror, like `attribution.ts` mirrors the
      backend channel util).
- [ ] 2.8 `npx tsc --noEmit` clean.

---

## Phase 3 — Browser pixel firing from `MarketingPixel`  ·  status: ☐

- [ ] 3.1 `GET /v1/storefront/:slug/pixels` — public, unauthenticated; active
      pixels + their page rules, **no credential material**. `tenantId` resolved
      server-side from `:slug`.
- [ ] 3.2 New `PixelLoader` component (replaces `StorefrontPixelTracker`'s hardcoded
      props): fetch the store's pixels once, decide per current page which providers
      have ≥1 pixel that should fire, inject only those base scripts.
- [ ] 3.3 Per-page event firing: `PageView` on every allowed page; `ViewContent` on
      product; `AddToCart` on add; `InitiateCheckout` on checkout start; `Purchase`
      on thank-you — each gated by the pixel's rules **and** the
      `MarketingEventConfig` master switch.
- [ ] 3.4 `POST /v1/marketing/events/ingest` — public browser beacon; writes
      `MarketingEventLog` (`transport = BROWSER`) and, when `capiEnabled`, enqueues
      the server-side mirror.
- [ ] 3.5 Wire `PixelLoader` into all storefront page templates currently using
      `StorefrontPixelTracker` (`store/[slug]/page.tsx`, `shop`, `categories`,
      `product/[productSlug]`, `checkout`, `checkout/success`).
- [ ] 3.6 SPA route-change handling: `PageView` fires exactly once per view across
      App Router client transitions.
- [ ] 3.7 Storefront no longer reads `store.facebookPixelId` etc. (columns remain,
      unused).
- [ ] 3.8 `npx tsc --noEmit` clean (frontend + backend).

---

## Phase 4 — Server-side dispatch (CAPI) for every event  ·  status: ☐

- [ ] 4.1 `pii-hash.util.ts` — SHA-256 normalise email/phone/name before dispatch.
- [ ] 4.2 `CapiAdapter` interface + one adapter file each:
      - [ ] 4.2a `meta-capi.adapter.ts` — Meta Conversions API.
      - [ ] 4.2b `tiktok-events.adapter.ts` — TikTok Events API.
      - [ ] 4.2c `ga4-measurement.adapter.ts` — GA4 Measurement Protocol.
      - [ ] 4.2d `google-ads-capi.adapter.ts` — Google Ads (OAuth + developer
            token); built now, exercised only when a merchant supplies those creds.
- [ ] 4.3 `dispatch-server-event.service.ts` — given (event, pixel, context):
      decrypt creds, pick adapter, POST, write `MarketingEventLog`
      (`transport = SERVER`, `httpStatus`, `errorMessage`).
- [ ] 4.4 Subscribe to order domain events (`order.created` / `order.paid` — match
      what the order module actually emits; use `EventEmitter2` / BullMQ per repo
      convention). On event: for every `capiEnabled` pixel whose rules allow
      checkout/thank-you, dispatch `Purchase` server-side.
- [ ] 4.5 Browser `ingest` beacon → for `capiEnabled` pixels, mirror
      `PageView` / `ViewContent` / `AddToCart` / `InitiateCheckout` server-side too
      (all events, not just Purchase).
- [ ] 4.6 Retry/backoff for failed server dispatches (reuse existing BullMQ retry if
      present; otherwise a simple bounded retry).
- [ ] 4.7 Per-provider "Test connection" in the pixel drawer — runs a real
      server-side test event when credentials are present, shows the provider's
      response.
- [ ] 4.8 Backend `npm run build` + `npm run test` green (ask before `build`).

---

## Phase 5 — Event log & attribution reporting  ·  status: ☐

- [ ] 5.1 `get-marketing-logs.service.ts` (rebuild) + `GET /v1/marketing/logs` with
      filters: `page`, `limit`, `pixelId`, `provider`, `eventName`, `transport`,
      `status`, `dateRange` / `dateFrom` / `dateTo`.
- [ ] 5.2 `get-order-attribution.service.ts` + `GET /v1/marketing/attribution/orders`
      — per-order rows: order id/ref, grandTotal, `channel`, `utmSource`,
      `utmCampaign`, `sessionId`, and per-pixel `purchaseSent` booleans from
      `MarketingEventLog`. Query by id references only — no cross-module join.
- [ ] 5.3 `get-attribution-summary.service.ts` +
      `GET /v1/marketing/attribution/summary` — channel/source rollup reusing the
      `storefront_sessions ⨝ orders` join from
      `tracking/services/get-traffic-sources.service.ts`, plus per-pixel delivery
      health from `MarketingEventLog`.
- [ ] 5.4 Frontend: rebuild the **Event Log** panel on the Marketing page, now
      backed by real per-pixel data + filters.
- [ ] 5.5 Frontend: extend the **Sales by Source** tab from Phase A — add the
      per-pixel "Purchase events delivered / failed" column now that
      `MarketingEventLog` carries `transport = SERVER` rows. (The tab itself already
      exists from Phase A; this is just the extra column + a per-order drill-down that
      also shows which pixels fired.)
- [ ] 5.6 `npx tsc --noEmit` clean.

---

## Phase 6 — Cleanup  ·  status: ☐

- [ ] 6.1 (After Phase 3 verified in staging) migration to drop
      `stores.facebookPixelId` / `facebookCapiToken` / `facebookTestEventCode` /
      `tiktokPixelId` / `googleTagManagerId` / `googleAnalyticsId` /
      `snapchatPixelId` / `pinterestTagId`.
- [ ] 6.2 Remove the legacy pixel form fields from the dashboard settings UI +
      their DTO fields.
- [ ] 6.3 Delete `StorefrontPixelTracker` once nothing imports it.
- [ ] 6.4 Update `docs/06`, `docs/07`, `docs/09_ROADMAP.md`, and this file to mark
      the legacy columns removed and the slice complete.
- [ ] 6.5 Final backend `npm run build` + `npm run test`, frontend
      `npx tsc --noEmit` (ask before `build`).

---

## Dependency order

```
Phase A  (independent — existing data only; ship first)
   │
   ▼
Phase 0 ─▶ Phase 1 ─▶ Phase 2 ─▶ Phase 3 ─▶ Phase 4
                                    │
                                    └─▶ Phase 5 ─▶ Phase 6
```

- **Phase A depends on nothing** — it uses `storefront_sessions` + `orders` columns
  that already exist. Build and ship it before touching the pixel rebuild.
- Phase 2 needs Phase 1's pixel rows.
- Phase 3 needs Phase 2's rule resolver.
- Phase 4 and Phase 5 both need Phase 3's `MarketingEventLog` shape; otherwise
  parallel.
- Phase 5 extends the Phase A report (adds per-pixel delivery health) rather than
  building a second one.
- Phase 6 (dropping legacy columns, deleting the old component) is last.

## Explicitly deferred

- Snapchat / Pinterest as first-class `MarketingPixel` providers (their store
  columns can linger until there's demand).
- Persistent cross-session visitor identity ("users" vs "sessions").
- Multi-touch attribution models — ships with first-touch on the session +
  last-touch on the order.
