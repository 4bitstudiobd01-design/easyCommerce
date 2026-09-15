# 10_MARKETING_PIXEL_IMPLEMENTATION_PLAN.md — Pixel Tracking, Multi-Instance & Attribution

**Version:** 0.1.0
**Status:** Draft — approved scope: **Option C** (multi-instance pixels + per-page
targeting + server-side CAPI + order attribution)
**Owns:** `backend/src/modules/marketing/` + `frontend/src/features/marketing/` +
storefront pixel loader in `frontend/src/features/storefront/`
**Design source of truth:** `docs/06_DATABASE_DESIGN.md` §3.9b,
`docs/07_API_SPECIFICATION.md` "Marketing — Pixels, Tracking & Attribution"

---

## 1. Goal (plain language)

1. A merchant can **add pixels** for Meta / GA4 / Google Ads / TikTok, and can add the
   **same provider more than once** (e.g. two Meta pixels), each with its own label and
   credentials.
2. Each pixel can be told **which pages it fires on** — by page *type*
   (home / product / collection / cart / checkout / thank-you / …) **and/or** by
   **URL pattern** (`/product/clearance-*`), with include/exclude rules.
3. Events fire from the **browser** (pixel script) and, where enabled, from the
   **server** (Meta Conversions API / TikTok Events API / GA4 Measurement Protocol) so
   attribution survives ad-blockers and iOS.
4. The merchant can see **which order came from which platform** — a report joining
   visitor session attribution + order UTM + per-pixel Purchase-event delivery.

## 2. What already exists (do not rebuild)

| Piece | Location | Status |
| :--- | :--- | :--- |
| Visitor session + first-touch attribution | `tracking` module, `storefront_sessions`, `POST /tracking/visit`, `frontend .../storefront/utils/attribution.ts` | ✅ keep as-is |
| Order-level attribution columns | `orders.channel/utmSource/utmMedium/utmCampaign/referrerHost` | ✅ keep as-is |
| Channel → sales join | `tracking/services/get-traffic-sources.service.ts` | ✅ reuse in attribution summary |
| Order channel badge UI | `frontend .../order/utils/channelBadge.tsx` | ✅ reuse |
| Browser pixel `<script>` injector | `frontend .../storefront/components/StorefrontPixelTracker.tsx` | 🟡 refactor to read from `MarketingPixel`, not store fields |
| `marketing` module skeleton | `backend/src/modules/marketing/` | 🟡 rework — see below |
| `marketing_pixels` table | `MarketingPixel` entity | 🟡 redesign (drop provider-uniqueness, add label/credentials/pageScopeMode/…) |
| `marketing_event_logs` table | `MarketingEventLog` entity | 🟡 extend (pixelId, transport, sessionId, orderId, httpStatus, …) |
| `marketing_event_configs` table | `MarketingEventConfig` entity | ✅ keep, retain toggle service |

## 3. Decisions locked

1. **Single source of truth for pixel IDs = `MarketingPixel` table.** The
   `stores.*PixelId` / `*CapiToken` / `*TestEventCode` columns become read-only legacy,
   are data-migrated into `MarketingPixel` rows once, kept one release, then dropped.
   Rationale: multi-instance + per-page rules + encrypted credentials cannot be modelled
   on flat store columns; a dedicated table is the only workable shape and keeps the
   Marketing module self-contained.
2. **Page targeting supports both** `PAGE_TYPE` and `URL_PATTERN` match types on the same
   pixel, with `include=false` exclusions overriding includes.
3. **Credentials encrypted at rest** (AES-256-GCM), following the existing
   `omnichannel_ai_configs.encryptedApiKey` pattern. Never returned by any API —
   `hasCredentials: boolean` instead.
4. **No cross-module joins.** Attribution reads reference `orders` / `storefront_sessions`
   by id; order/session data reaches the marketing module via ids on `MarketingEventLog`
   and via a read-only query service, never a TypeORM relation across the boundary.
5. **RBAC:** `marketing:read` / `marketing:manage`. Owner + Manager = manage,
   Accountant = read, Fulfilment = none.

## 4. Open questions — resolved 2026-09-09

1. **Encryption key management** — ✅ RESOLVED. Already solved in the repo: the shared
   AES-256-GCM helper (`logistics/services/credentials-crypto.service.ts` and
   `omnichannel/services/omnichannel-crypto.util.ts`) derives its key from
   `CREDENTIALS_ENCRYPTION_KEY` (falls back to `JWT_SECRET` in dev, warns once, never
   stores plaintext). **No new key, no new crypto module** — the marketing module gets
   a thin wrapper (`MarketingPixelCryptoService`) over the same pattern.
2. **GA4 / Google Ads server-side** — ✅ RESOLVED: build **all four** server-side
   adapters (Meta CAPI, TikTok Events API, GA4 Measurement Protocol, Google Ads
   OAuth + developer token). Each is *exercised* only when the merchant has supplied
   that provider's credentials; nothing is deferred.
3. **`urlPattern` glob engine** — ✅ RESOLVED: hand-rolled ~30-line matcher, `*` = one
   path segment, `**` = any depth. No new dependency.
4. **Storefront event firing for SPA route changes** — still to verify during Phase 3:
   confirm which App Router navigations are full loads vs client transitions so
   `PageView` fires exactly once per view. (Not a blocker — an implementation detail
   settled in-phase.)
5. **Abandoned-cart / InitiateCheckout server events** — ✅ RESOLVED: **every** standard
   event (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) fires
   **both** browser and server-side for any `capiEnabled` pixel. Nothing is browser-only.

## 5. Build order — phased, each phase independently shippable

Every phase: backend builds + lints + tests, frontend type-checks (`tsc --noEmit`),
tenant isolation + RBAC verified, API envelope conforms to `docs/07`. **No full
`npm run build` without explicit approval.**

The task-level checklist lives in `docs/PIXEL_AND_MARKETING_WORKFLOW.md`.

### Phase A — Source-wise Sales Report + ROAS (ship first, independent)
This is MKT-003 ("which order came from which platform"). It depends on **no** part of
the pixel rebuild — only on `storefront_sessions` + the existing
`orders.channel/utmSource/utmMedium/utmCampaign` columns and the join already in
`tracking/services/get-traffic-sources.service.ts`. Built and shipped before Phase 0.
1. Extend `get-traffic-sources.service.ts` with a `groupBy` param
   (`channel | source | campaign`) — only the `GROUP BY`/`SELECT` changes.
2. `MarketingAdSpend` entity + CRUD (`/v1/marketing/ad-spend`) for merchant-entered ad
   spend per channel/source/campaign per period. (Auto-pulling spend from Meta/Google
   Ads APIs is a separate later phase.)
3. `get-source-sales-report.service.ts` + `GET /v1/marketing/attribution/source-sales`
   — grouped traffic rows joined to `MarketingAdSpend`, returning revenue, orders,
   sessions, conversion rate, spend, `roas`, `cpa`.
4. Frontend "Sales by Source" tab on the Marketing page: dimension switch, table with
   inline spend entry, per-row drill-down to the filtered order list.
5. Phase 5 later adds a per-pixel "Purchase delivered" column to this same tab.

### Phase 0 — Foundations (no user-visible change)
1. `MarketingPixelCryptoService` — thin wrapper over the existing shared AES-256-GCM
   helper pattern (see logistics `CredentialsCryptoService`). No new key, no new
   algorithm code.
2. Add `marketing:read` / `marketing:manage` to the RBAC permission list + guard
   decorators.
3. Redesign entities:
   * `MarketingPixel` — add `label`, `credentialsEncrypted`, `capiEnabled`,
     `pageScopeMode`, `isActive`; drop the implicit `(tenant,store,provider)`
     uniqueness; add `unique(storeId, provider, label)`.
   * New `MarketingPixelPageRule` entity.
   * `MarketingEventLog` — add `pixelId`, `provider`, `transport`, `sessionId`,
     `orderId`, `orderRef`, `utmSource/Medium/Campaign`, `httpStatus`, `errorMessage`.
4. `npm run migration:generate -- MarketingPixelRedesign`; review SQL by hand; run.
5. Data migration script: copy `stores.*PixelId` → `MarketingPixel` rows.

### Phase 1 — Pixel CRUD (admin, backend + UI)
1. Services (one file = one use case): `list-pixels`, `create-pixel`, `get-pixel`,
   `update-pixel`, `delete-pixel`. Credentials encrypted on write, stripped on read.
2. DTOs + class-validator; `409` on label collision; `404` (not `403`) cross-tenant.
3. Controller routes per `docs/07` (`/v1/marketing/pixels*`).
4. Frontend: replace the single `ConnectPixelModal` with a pixel **list + create/edit
   drawer** (provider picker, label, pixel id, credentials, `capiEnabled` toggle).
   RTK Query endpoints in `marketingApi.ts`.
5. Keep the existing dashboard KPI cards working (they read `MarketingEventLog` counts).

### Phase 2 — Page-targeting rules
1. Backend: `get-page-rules`, `replace-page-rules` services + `PUT
   /pixels/:id/page-rules`. `urlPattern` validation (Open Question #3).
2. `pageScopeMode` switch on the pixel (`ALL` ↔ `RULES`).
3. Frontend: rule editor inside the pixel drawer — repeatable rows of
   {matchType, pageType | urlPattern, include}. Live "this pixel will fire on…"
   preview.
4. Shared rule-resolution helper (`resolvePixelFires(pathname, pageType, rules)`) —
   pure function, unit-tested, used by both the storefront loader and the preview.

### Phase 3 — Browser pixel firing from `MarketingPixel`
1. Public `GET /v1/storefront/:slug/pixels` — active pixels + rules, **no credentials**.
2. Refactor `StorefrontPixelTracker` → new `PixelLoader` that:
   * fetches the store's pixels once,
   * injects each provider's base script only if ≥1 pixel of that provider should fire
     on the current page,
   * fires `PageView` / `ViewContent` / `AddToCart` / `InitiateCheckout` / `Purchase`
     per the resolved rules + the `MarketingEventConfig` master switch.
3. Public `POST /v1/marketing/events/ingest` beacon → writes `MarketingEventLog`
   (`transport = BROWSER`).
4. Remove the storefront's dependence on `store.facebookPixelId` etc. (columns stay,
   but nothing reads them).

### Phase 4 — Server-side dispatch for every event
1. `marketing` module subscribes to `order.created` / `order.paid` domain events
   (EventEmitter2 / BullMQ — match whatever the order module already emits) for the
   `Purchase` server event.
2. The browser `ingest` beacon also enqueues the server-side mirror for
   `PageView` / `ViewContent` / `AddToCart` / `InitiateCheckout` on `capiEnabled`
   pixels — **all events go both ways**, not just `Purchase`.
3. `dispatch-server-event.service.ts` — for each `capiEnabled` pixel whose rules allow
   the page: decrypt credentials, pick the adapter, POST to the provider API,
   write `MarketingEventLog` (`transport = SERVER`, `httpStatus`, `errorMessage`).
4. **All four** adapters behind a small `CapiAdapter` interface, one file each:
   Meta Conversions API, TikTok Events API, GA4 Measurement Protocol, Google Ads
   (OAuth + developer token). Each runs only when its credentials are present.
5. PII hashing (SHA-256 email/phone/name) before dispatch — shared helper.
6. Retry/backoff for failed server events (reuse existing BullMQ if present).
7. Per-provider "Test connection" in the pixel drawer fires a real server event when
   credentials exist and surfaces the provider's response.

### Phase 5 — Event log & attribution reporting
1. `GET /v1/marketing/logs` with filters (rebuilds the removed Event Log view, now
   backed by real per-pixel data).
2. `GET /v1/marketing/attribution/orders` + `/attribution/summary` — reuse
   `GetTrafficSourcesService`'s session⨝order join, add per-pixel Purchase-delivery
   counts from `MarketingEventLog`.
3. Frontend: new "Attribution" tab on the Marketing page — channel/source table
   (sessions, orders, revenue, conv-rate, per-pixel delivery health) + a per-order
   drill-down reusing `ChannelBadge`.

### Phase 6 — Cleanup
1. Migration to drop the legacy `stores.*PixelId` / `*CapiToken` / `*TestEventCode`
   columns (only after Phase 3 has shipped and been verified in staging).
2. Remove the legacy store-settings pixel form fields from the dashboard settings UI.
3. Update `docs/06`, `docs/07`, `docs/09_ROADMAP.md` to mark the columns removed.

## 6. Dependency graph (what blocks what)

```
Phase A  (independent — ship first)
   │
   ▼
Phase 0 ──▶ Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4
                                        │
                                        └──▶ Phase 5 ──▶ Phase 6
```

* **Phase A blocks nothing and is blocked by nothing** — existing data only.
* Phase 2 needs Phase 1's pixel rows.
* Phase 3 needs Phase 2's rule resolver.
* Phase 4 and Phase 5 both need Phase 3's `MarketingEventLog` shape but are otherwise
  parallel.
* Phase 5 extends Phase A's report; it does not build a new one.
* Phase 6 (dropping legacy columns) must come last.

## 7. Not in scope (explicitly deferred)

* Snapchat / Pinterest pixels as first-class `MarketingPixel` providers (their store
  columns can stay until there's demand).
* Cross-session persistent visitor identity ("users" vs "sessions" — see
  `GetTrafficSourcesService` note).
* Multi-touch attribution models (first-touch on the session + last-touch on the order
  is what ships).

*(Google Ads server-side is **in** scope — built alongside the other three adapters,
exercised when the merchant supplies OAuth + developer-token credentials.)*
