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
8. **RBAC full setup — DONE (2026-09-09, after Phase 6).** Backend permission strings
   `marketing:read` / `marketing:manage` + endpoint guards were added in Phase A.
   Completed now: `StaffPermissionType` (frontend `staffApi.ts`) gained the two
   strings; `InviteStaffModal` + `EditStaffPermissionsModal` "Marketing & Analytics"
   group lists **View Marketing** (`marketing:read`) and **Manage Marketing**
   (`marketing:manage`); the `STORE_MANAGER` invite preset now includes both,
   `CUSTOMER_SUPPORT` includes `marketing:read`. Owner/SuperAdmin auto-hold everything
   via `ALL_PERMISSIONS`. There is no backend role-preset seed (presets are
   frontend-only), so nothing else was needed.

---

## Phase A — Source-wise Sales Report + ROAS (ship first)  ·  status: DONE (pending your visual review)

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
- [x] A.6 New **"Sales by Source"** tab on the Marketing page
      (`SalesBySourceTab.tsx`): dimension tabs (By Channel / By Source / By Campaign),
      date-range select (7 / 30 / 90 days / All Time), table — dimension, Sessions,
      Orders, Revenue, Conv. Rate, Ad Spend, ROAS, CPA. `ChannelBadge` reused for
      channel + source columns. `MarketingView.tsx` now has real tab switching
      (Pixels & Tracking ↔ Sales by Source); "Add Pixel" button hidden on the report tab.
- [x] A.7 Ad-spend entry — **month-based** (revised from the first inline-cell design,
      which broke as soon as the date range changed).
      - `ManageSpendDrawer.tsx`: opened from the Ad Spend cell's ⚙ button. A month
        picker + amount adds one `MarketingAdSpend` row per calendar month
        (`periodStart` = 1st, `periodEnd` = last day); the list below shows every
        recorded month with edit-by-re-save and per-row delete, plus a running total.
      - Backend `UpsertAdSpendService`: with no `id`, an existing row for the same
        `(dimension, dimensionValue, exact period)` is overwritten instead of
        duplicated — so re-saving a month edits it in place.
      - The report's Ad Spend / ROAS / CPA come straight from the backend
        (`get-source-sales-report.service.ts` already sums every `MarketingAdSpend`
        row overlapping the report window), so **every** range works, All Time
        included — no more read-only All Time.
      - **Live-verified**: Sept `45000` + Aug `25000` → All Time spend `70000`
        (ROAS `0.64x`); Sept-only window → `45000` (ROAS `0.14x`); re-saving Sept
        returned "Ad spend updated" with the same id (no duplicate).
- [x] A.8 Per-row drill-down → the merchant order list filtered by that
      `channel` / `utmSource` / `utmCampaign`.
      - Backend: `OrderListDto` gained `channel` / `utmSource` / `utmCampaign`;
        `ListMerchantOrdersService` adds three `andWhere` clauses (tenant scope
        unchanged).
      - Frontend: `OrderListTable` reads the three params from the URL, feeds them
        into `getMerchantOrders`, renders removable filter chips, and "Clear all"
        clears them too.
      - `SalesBySourceTab` rows get a trailing ↗ button →
        `/dashboard/orders?<param>=<value>` (`channel` / `utmSource` / `utmCampaign`
        by active dimension); disabled when the row has 0 orders.
      - **Live-verified**: `?utmSource=facebook` → 10 orders, `?channel=social` → 20
        (facebook 10 + instagram 10), unfiltered → 124 — counts match the report.
- [x] A.9 `marketingApi.ts` endpoints + hooks: `getSourceSales`, `getAdSpend`,
      `upsertAdSpend`, `deleteAdSpend` + `SourceSalesRow` / `AdSpendEntry` types +
      `dimensionForGroupBy` helper. New tag types `SourceSales`, `AdSpend`.
- [x] A.10 `npx tsc --noEmit` clean (frontend + backend). Backend: full `AppModule`
      boot OK; touched-module jest green; the 5 pre-existing failures
      (`bulk-adjust-stock`, `courier-integration-security`) are unrelated.
      **Live-verified** against the running dev server with a real STORE_OWNER token:
      all four routes return `200` with the correct envelope; seeded demo sessions +
      an ad-spend entry produced correct ROAS (`0.89x`), CPA (`5000`), conversion
      rate and the channel-level merge of facebook+instagram into `social`.

### Later hook-in
- [ ] A.11 (done in Phase 5) add a per-pixel "Purchase events delivered" column to
      this same report once `MarketingEventLog` carries `transport = SERVER` rows.

---

## Phase 0 — Foundations  ·  status: DONE (0.2 deferred by decision)

- [x] 0.1 `marketing:read` / `marketing:manage` permission strings + endpoint guard
      wiring — **already done in Phase A** (`staff.entity.ts`, `get-my-permissions.service.ts`,
      `marketing.controller.ts`, `marketing.module.ts`). Reuse the same two strings on
      new pixel routes.
- [x] 0.2 RBAC seed/matrix + staff-invite UI toggle + Manager default mapping —
      **DONE 2026-09-09 (after Phase 6).** See locked decision #8: frontend
      `StaffPermissionType` + both staff modals' "Marketing & Analytics" group now
      carry `marketing:read` / `marketing:manage`; `STORE_MANAGER` preset includes
      both, `CUSTOMER_SUPPORT` includes `marketing:read`. No backend seed exists
      (presets are frontend-only). Backend + Frontend `tsc --noEmit` clean, both
      production builds pass.
- [x] 0.3 `MarketingPixelCryptoService`
      (`services/marketing-pixel-crypto.service.ts`) — module-local AES-256-GCM
      wrapper (encrypt / decrypt / merge / presentFields over a `PixelCredentialBag`),
      same `v1:iv:tag:ciphertext` envelope and `CREDENTIALS_ENCRYPTION_KEY` (→ JWT_SECRET
      dev fallback) as logistics/omnichannel. Registered + exported in `marketing.module.ts`.
- [x] 0.4 `MarketingPixel` entity — added `label` (varchar 120, nullable for
      un-migrated rows), `credentialsEncrypted` (text), `capiEnabled` (bool, default
      false), `pageScopeMode` (`PixelPageScopeModeEnum` ALL|RULES, default ALL),
      `isActive` (bool, default true). New indexes `(tenantId, storeId, provider)` and
      partial-unique `(storeId, provider, label) WHERE label IS NOT NULL`. Legacy
      `accessToken` kept (marked deprecated) so pre-Phase-1 connect/disconnect services
      still compile and run.
- [x] 0.5 `MarketingPixelPageRule` entity
      (`entities/marketing-pixel-page-rule.entity.ts`) — `PixelRuleMatchTypeEnum`
      (PAGE_TYPE|URL_PATTERN), `StorefrontPageTypeEnum`
      (HOME…OTHER, 10 values), `include` bool. Indexes `(pixelId)` and
      `(tenantId, storeId)`. FK → `marketing_pixels` ON DELETE CASCADE (in the migration).
- [x] 0.6 `MarketingEventLog` entity extended — `pixelId` (nullable, FK ON DELETE SET
      NULL), `provider` (enum, nullable), `transport` (`MarketingEventTransportEnum`
      BROWSER|SERVER, default BROWSER), `sessionId`, `orderId`, `utmSource` /
      `utmMedium` / `utmCampaign`, `httpStatus`, `errorMessage`. Legacy `errorDetails`
      kept. Indexes `(tenantId, storeId, eventName)`, `(tenantId, storeId, orderId)`,
      `(pixelId)` added (the `createdAt` one already existed).
- [x] 0.7 `MarketingEventConfig` untouched; `ToggleTrackingEventService` was already
      removed earlier — its route comes back in Phase 1.
- [x] 0.8 Migration `1788902057330-MarketingPixelRedesign.ts` — hand-written
      (generator carried unrelated drift), additive only, adds the FK constraints the
      generator missed. `migration:run` succeeded.
- [x] 0.9 `src/scripts/backfill-marketing-pixels.ts` — idempotent: Pass 1 labels
      every `label IS NULL` pixel row ("Imported <Provider>"); Pass 2 creates a
      `marketing_pixels` row from any surviving `stores.*PixelId` / `*CapiToken` /
      `*TestEventCode` value (skips if a row for that store+provider exists), guarded
      so it no-ops once the legacy columns are dropped. Run once: labelled 2 rows,
      created 0 (this DB has no legacy store values).
- [x] 0.10 `npx tsc --noEmit` clean; full `AppModule` boot OK; existing endpoints
      re-verified live (`/marketing/dashboard` → 3 connected / 4 integrations,
      `/marketing/attribution/source-sales` → 4 rows). `npm run build` NOT run
      (needs your approval).

---

## Phase 1 — Pixel CRUD (backend + admin UI)  ·  status: DONE (1.14 event-toggles deferred to Phase 3)

### Backend
- [x] 1.1 `list-pixels.service.ts` — all instances for the store, ordered by
      provider then created; each serialized via `pixel-serializer.ts` (credentials
      stripped, `hasCredentials` + `credentialFields` flags, page rules batched in one
      query).
- [x] 1.2 `create-pixel.service.ts` — encrypts `credentials` via
      `MarketingPixelCryptoService`; `409` on `(store, provider, label)` collision.
- [x] 1.3 `get-pixel.service.ts` — `loadOwned()` throws `404` (never `403`)
      cross-tenant; `execute()` returns the serialized pixel + its page rules.
- [x] 1.4 `update-pixel.service.ts` — partial update; `credentials` undefined = keep
      stored, `null` = clear all, object = `crypto.merge` over stored (a field sent
      `''`/`null` clears just that one); `409` on label collision with a sibling.
- [x] 1.5 `delete-pixel.service.ts` — hard-delete; page rules cascade via FK,
      `marketing_event_logs.pixelId` → null via FK (history kept).
- [x] 1.6 `test-pixel-event.service.ts` — fires one event through a given pixel:
      always a `transport=BROWSER` log row; a `transport=SERVER` stub row too when
      `capiEnabled` && credentials present (real dispatch is Phase 4). Returns
      `{ message, data: { logs } }`.
- [x] 1.7 same service — `testAll()` fires `PageView` through every
      connected + active pixel, returns `{ message, data: { results } }` per-pixel.
- [x] 1.8 `dto/pixel.dto.ts` — `CreatePixelDto`, `UpdatePixelDto`,
      `TestPixelEventDto`, `PixelCredentialsDto`, all class-validated.
- [x] 1.9 Controller routes: `GET/POST /v1/marketing/pixels`,
      `GET/PUT/DELETE /v1/marketing/pixels/:id`, `POST /v1/marketing/pixels/:id/test`,
      `POST /v1/marketing/pixels/test-all` — all `JwtAuthGuard` + `PermissionsGuard`
      (`marketing:read` reads / `marketing:manage` writes) + server-side store scope
      via `resolveScope`. Legacy `pixels/connect` + `pixels/:provider/disconnect`
      kept until Phase 6.
- [x] 1.10 `get-marketing-dashboard.service.ts` — **rewritten** (2026-09-09) to be
      multi-instance aware: `connectedPixels` = `{ count: CONNECTED rows, total: all
      rows }`, `activePixels` = `CONNECTED && isActive` rows; Events Today / Failed /
      Success from `MarketingEventLog` (unchanged). The stale "0 out of 4"
      provider-summary is gone; `integrations` now returns `[]`. `MarketingKpiCards`
      renders "N of M pixels" (or just "N pixels" when the store has none).
      **Live-verified**: created a 2nd Meta pixel (409 on duplicate label), update
      keeps omitted secrets / clears on `null`, delete drops it, test → 1 BROWSER row
      (no creds) / BROWSER+SERVER (capiEnabled+creds), test-all → 3/3.
      Disconnect/Reconnect (via `PUT /pixels/:id` `status`) drops the KPI count
      3→2→3 and removes/re-adds the pixel from `GET /storefront/:slug/pixels`.
- [x] 1.10b `PixelFormDrawer` footer gained a **Disconnect / Reconnect** button
      (amber/emerald) beside Delete + Test — sets `status` DISCONNECTED / CONNECTED.
      A disconnected pixel keeps its config + history but is excluded from the
      storefront loader and the CAPI dispatch. Card badge shows Live / Paused / Inactive.
- [x] 1.10c **Bug fix (2026-09-09):** `GET /v1/marketing/dashboard` still read
      `@Headers('x-tenant-id')`, which the frontend `baseQuery` never sends — so the
      service hit its `!tenantId` guard and returned the empty dashboard ("0 pixels /
      No pixels yet") even when pixels existed. Switched to `@CurrentUser('sub')` +
      `resolveScope` like every other marketing route. Verified: with one CONNECTED
      pixel the KPI now reads "1 of 1 connected / 1 Live". Also deleted the unused
      legacy `pixels/connect` + `pixels/:provider/disconnect` routes and their
      `ConnectPixelService` / `DisconnectPixelService` / `ConnectPixelDto` files
      (superseded by the Phase 1 CRUD; carried the same broken `x-tenant-id` pattern).
- [x] 1.10d Delete confirmation switched from `window.confirm()` to the shared
      `ConfirmDialog` (app-themed modal, `isDestructive`, loading state).

### Frontend (`frontend/src/features/marketing/`)
- [x] 1.11 `marketingApi.ts` — `getPixels`, `getPixel`, `createPixel`, `updatePixel`,
      `deletePixel`, `testPixel`, `testAllPixels` + hooks + `MarketingPixelInstance` /
      `CreatePixelBody` / `UpdatePixelBody` types + a `PROVIDER_META` map (per-provider
      id label + credential field list). New tag types `Pixels` / `Pixel`. Legacy
      `connectPixel` / `disconnectPixel` endpoints + `ConnectedIntegration` type removed.
- [x] 1.12 `PixelInstanceList.tsx` (replaces `ConnectedIntegrations`) — card grid, one
      card per instance (label, provider, id, CAPI state, last-event), "Add Pixel" +
      "Test All" buttons, empty state. `PixelFormDrawer.tsx` (replaces
      `ConnectPixelModal`) — provider picker (locked in edit), name, id, per-provider
      password-masked credential fields ("• configured" when already set, blank =
      keep), CAPI + Active toggles, Delete + Test in edit mode. Both old files deleted.
- [x] 1.13 Add-pixel flow works end to end; same provider addable again (unique label
      enforced with a `409` toast).
- [~] 1.14 Standard-event master switches (the 5 toggles) — **deferred to Phase 3**,
      where they gate the storefront `PixelLoader`. No backend route exists for them
      yet (`ToggleTrackingEventService` was removed earlier); bringing it back only
      matters once events actually fire from `MarketingPixel`.
- [x] 1.15 `npx tsc --noEmit` clean (frontend + backend); dead `ConnectedIntegrations`
      / `ConnectPixelModal` / legacy hooks swept.

---

## Phase 2 — Page-targeting rules  ·  status: DONE

- [x] 2.1 `utils/url-pattern.util.ts` — hand-rolled matcher: leading-slash required,
      case-insensitive, `*` = one segment, `**` = any depth (incl. zero), in-segment
      `*` anchors, query/hash stripped. `assertValidUrlPattern` / `isValidUrlPattern`
      + `matchUrlPattern`. **12 unit tests.**
- [x] 2.2 `utils/resolve-pixel-fires.util.ts` — pure
      `resolvePixelFires(pageScopeMode, rules, {pathname, pageType})`. `ALL` → always;
      `RULES` → any exclude match → false, else any include match → true, else false.
      PAGE_TYPE match is case-insensitive; null target fields are skipped. **9 unit tests.**
- [x] 2.3 `get-page-rules.service.ts` (ownership-checked list) +
      `replace-page-rules.service.ts` (validates each rule, then a single
      `dataSource.transaction` = delete-all + bulk-insert). DTO `dto/page-rule.dto.ts`.
- [x] 2.4 Controller `GET /v1/marketing/pixels/:id/page-rules` (`marketing:read`) +
      `PUT /v1/marketing/pixels/:id/page-rules` (`marketing:manage`). `400` on a
      malformed `urlPattern` or a PAGE_TYPE rule missing `pageType`; `404` cross-tenant.
      **Live-verified**: 3-rule set (product include + clearance-* exclude + checkout
      include) saved & read back; `{rules:[]}` clears; bad pattern → 400; unknown
      pixel → 404.
- [x] 2.5 `pageScopeMode` switch already handled in `update-pixel.service.ts` (Phase 1).
- [x] 2.6 `PageRulesEditor.tsx` inside `PixelFormDrawer` (edit mode only) — ALL/RULES
      mode toggle (persists immediately via `updatePixel`), repeatable rule rows
      {Fire on / Never on} × {page type | URL pattern}, add/remove, inline
      URL-pattern validity check, "Save rules" → `replacePageRules`.
- [x] 2.7 "Will fire on" live preview — `utils/pixelFires.ts` mirrors the two backend
      utils line-for-line; the drawer shows 10 representative storefront pages with a
      ✓/✗ recomputed from the draft rules as the merchant edits.
- [x] 2.8 `npx tsc --noEmit` clean (frontend + backend); `npx jest src/modules/marketing`
      → 21 pass.

---

## Phase 3 — Browser pixel firing from `MarketingPixel`  ·  status: DONE

- [x] 3.1 `GET /v1/storefront/:slug/pixels` — public, unauthenticated
      (`StorefrontPixelsController`, no class guard). Returns connected + active
      pixels with `pixelId` + page rules + a store-wide `eventConfig` map;
      **no credential material**. `tenantId` resolved from the slug via
      `FindStoreBySlugService`. Live-verified: 3 pixels + `eventConfig` for
      `mydiagnostic`, no auth header.
- [x] 3.2 `PixelLoader.tsx` (`features/storefront/components`) — fetches the store's
      pixels once, resolves the current page type from the pathname
      (`utils/pageType.ts`), filters to the pixels whose rules allow this page
      (`resolvePixelFires`), and injects the Meta / TikTok / GA4 / Google-Ads base
      script only for providers that have ≥1 firing pixel.
- [x] 3.3 Per-page event firing: `PageView` on every allowed page, plus a
      page-type event (`ViewContent` on PRODUCT, `InitiateCheckout` on CHECKOUT,
      `Purchase` on THANK_YOU); each gated by the pixel's rules **and** the
      `eventConfig` master switch (missing = on). `AddToCart` is fired from the cart
      action, not the loader — wired in Phase 4 alongside its server mirror.
- [x] 3.4 `POST /v1/marketing/events/ingest` — public beacon
      (`IngestBrowserEventService`): validates `pixelId` belongs to the slug's store,
      writes a `transport = BROWSER` `MarketingEventLog` row, bumps `lastEventAt`.
      Best-effort — a bad beacon returns `{recorded:false}`, never 500s. Live-verified:
      real pixel → `recorded:true`, bogus id → `recorded:false`. (Server mirror for
      `capiEnabled` pixels is a documented Phase-4 hook.)
- [x] 3.5 `PixelLoader` mounted once in `app/store/[slug]/layout.tsx`; every
      `<StorefrontPixelTracker …>` usage removed from `store/[slug]/page.tsx`, `shop`,
      `categories` (the component file itself is left for the Phase 6 sweep).
- [x] 3.6 SPA route changes: the loader keys off `usePathname()` and de-dupes fires
      with a `Set` of `path::pixel::event`, so `PageView` fires exactly once per view
      across client transitions.
- [x] 3.7 Storefront no longer reads `store.facebookPixelId` etc. via the loader
      (the old component still does, pending its Phase 6 deletion; nothing renders it).
- [x] 3.8 `npx tsc --noEmit` clean (frontend + backend); page-type resolver logic
      spot-checked (10/10); `npx jest src/modules/marketing` → 21 pass; full
      `AppModule` boot OK.

---

## Phase 4 — Server-side dispatch (CAPI) for every event  ·  status: DONE

- [x] 4.1 `utils/pii-hash.util.ts` — `hashEmail` / `hashPhone` (BD-local → 880
      normalise) / `hashText` / `buildHashedUserData` (Meta-style `em/ph/fn/ln/ct/st`).
      **9 unit tests.**
- [x] 4.2 `capi/capi-adapter.interface.ts` (`CapiAdapter`, `CapiEvent`,
      `CapiDispatchResult`) + one adapter each, no shared HTTP client (a `post()`
      helper with optional extra headers, never logs URL/body):
      - [x] 4.2a `meta-capi.adapter.ts` — Graph `/{pixelId}/events`, hashed
        `user_data`, `test_event_code` passthrough.
      - [x] 4.2b `tiktok-events.adapter.ts` — Events API 2.0, `Access-Token` header,
        `Purchase → CompletePayment` map.
      - [x] 4.2c `ga4-measurement.adapter.ts` — Measurement Protocol `/mp/collect`,
        `api_secret`, GA4 event-name map, session id as `client_id`.
      - [x] 4.2d `google-ads-capi.adapter.ts` — OAuth refresh-token exchange then
        `uploadClickConversions`; `canDispatch` needs the full OAuth set, so it
        no-ops for stores that haven't supplied it.
- [x] 4.3 `dispatch-server-event.service.ts` — `dispatch(pixel, event)` picks the
      adapter, checks `canDispatch`, decrypts credentials, POSTs, and writes a
      `transport = SERVER` `MarketingEventLog` row (`SENT`/`FAILED`, `httpStatus`,
      `errorMessage`, PII-hashed `payloadJson`). Never throws. `dispatchForStore`
      loads each pixel's page rules and only dispatches through the ones whose rules
      allow the given page.
- [x] 4.4 `common/marketing/marketing-capi.producer.ts` (`MarketingCapiProducer`,
      queue `marketing-capi`, 4 attempts / exp backoff) — domain-free, lives in
      `common/` so `OrderModule` depends only on the contract. `MarketingModule` is
      now `@Global`, registers the queue, exports the producer, and runs
      `MarketingCapiProcessor` (`WorkerHost`). `CreateOrderService` enqueues a
      `Purchase` `ORDER_CONVERSION` after save (best-effort try/catch — never fails
      checkout). The processor fans it to every `capiEnabled` pixel whose rules allow
      `/checkout/success`; if every attempt fails it throws so BullMQ retries.
      **Live-verified**: `dispatchForStore(Purchase, THANK_YOU)` with a fake token →
      a `Purchase / SERVER / FAILED / 400` log row with the Meta error + hashed payload.
- [x] 4.5 Browser `ingest` beacon → `IngestBrowserEventService` now awaits
      `DispatchServerEventService.dispatch` for `capiEnabled` pixels, so
      `PageView` / `ViewContent` / `AddToCart` / `InitiateCheckout` all mirror
      server-side, not just `Purchase`. **Live-verified**: a `ViewContent` ingest with
      CAPI on produced BROWSER `SENT` + SERVER `FAILED 400` rows.
- [x] 4.6 Retry/backoff — BullMQ job opts (4 attempts, exponential 10s) on the
      `marketing-capi` queue; the processor throws on total failure to trigger them.
      Browser-mirror dispatches are fire-and-forget (a FAILED row, no retry — the
      browser pixel already fired).
- [x] 4.7 `test-pixel-event.service.ts` rebuilt to call the real
      `DispatchServerEventService.dispatch` (was a Phase-1 stub row) — the drawer's
      "Test" button now does a genuine server round-trip when credentials exist and
      the SERVER result shows up in the event log.
- [x] 4.8 `npx tsc --noEmit` clean (frontend + backend); full `AppModule` boot OK;
      `npx jest src/modules/marketing src/modules/order` → 81 pass. `npm run build`
      NOT run (needs approval).

---

## Phase 5 — Event log & attribution reporting  ·  status: DONE

- [x] 5.1 `list-marketing-logs.service.ts` + `GET /v1/marketing/logs`
      (`marketing:read`) — QueryBuilder with `pixelId` / `provider` / `eventName` /
      `transport` / `status` / `dateFrom` / `dateTo`, `page` + `limit` (max 100),
      newest-first, pixel labels resolved in one follow-up query. DTO
      `dto/list-logs.dto.ts`. **Live-verified**: 43 rows / 15 pages;
      `transport=SERVER&status=FAILED` → the one CAPI-fail row with its HTTP 400 +
      error message.
- [~] 5.2 `GET /v1/marketing/attribution/orders` — **folded into 5.3's delivery
      health + Phase A's existing per-row drill-down.** A dedicated per-order table
      with per-pixel `purchaseSent` booleans was judged redundant: the Sales-by-Source
      row already links to the filtered order list (Phase A.8), and per-pixel Purchase
      delivery is now a store-wide health strip (5.3). Revisit only if a merchant asks
      for order-level pixel attribution.
- [x] 5.3 `get-source-sales-report.service.ts` now returns
      `{ rows, deliveryHealth }` — `deliveryHealth` is one entry per `capiEnabled`
      pixel with `purchaseSent` / `purchaseFailed` counts of `transport = SERVER`
      `Purchase` rows in the report window (single grouped query). Reuses the existing
      `storefront_sessions ⨝ orders` join for `rows`. **Live-verified**: a fake-token
      Purchase test → `Imported Meta Pixel · sent 0 / failed 1`.
- [x] 5.4 `MarketingEventLogPanel.tsx` — rebuilt Event Log: event / transport /
      status / provider filter dropdowns, BROWSER vs SERVER badge, FAILED rows show
      HTTP status + error on hover, pager. Uses `useGetMarketingLogsQuery`.
- [x] 5.5 `SalesBySourceTab.tsx` — consumes the new `{ rows, deliveryHealth }` shape;
      renders a "Server-side Purchase delivery" strip (per-pixel ✓sent / ✗failed) under
      the table, and mounts `MarketingEventLogPanel` below it. Per-order drill-down is
      the Phase A.8 ↗ button, unchanged.
- [x] 5.6 `npx tsc --noEmit` clean (frontend + backend); `npx jest src/modules/marketing`
      → 30 pass; full `AppModule` boot OK.

---

## Phase 6 — Cleanup  ·  status: DONE

- [x] 6.1 `1788905900000-DropLegacyStorePixelColumns.ts` — drops all 8 flat pixel
      columns from `stores` (`DROP COLUMN IF EXISTS`; `down` re-adds them empty).
      Pre-check confirmed 0 stores still held a value (backfill had copied them).
      `migration:run` succeeded.
- [x] 6.2 No settings-UI pixel form existed (pixels were never editable there) —
      removed the 8 fields from `StoreEntity`, `UpdateStoreDto`, and the
      `sanitize-public-store` private-field list + its spec; `tenantApi.ts` (frontend)
      lost the same 5 legacy type fields.
- [x] 6.3 `StorefrontPixelTracker.tsx` deleted (nothing imported it after Phase 3.5).
- [x] 6.4 `StoreHealthWidget` "Marketing Pixels" check switched from the dead store
      fields to `useGetPixelsQuery` (`some(CONNECTED && isActive)`). `docs/06`, `docs/07`
      already reflect the redesign; this file marked complete.
- [x] 6.5 `npx tsc --noEmit` clean (frontend + backend); full `AppModule` boot OK;
      `npm run test` → 684 pass (the 5 pre-existing `bulk-adjust-stock` /
      `courier-integration-security` failures are unrelated, unchanged since Phase A).
      `npm run build` NOT run (needs approval).

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
