# 06_DATABASE_DESIGN.md - Business Entity & Domain-Driven Design

# BitCommerce Domain-Driven Business Entity Design

**Version:** 0.2.0  
**Status:** Approved  
**Architecture Style:** Domain-Driven Design (DDD) Entity Modeling  

---

## 1. Overview & Architectural Principles

This document defines the **Business Entity Design** for BitCommerce. In alignment with Domain-Driven Design (DDD) and Modular Monolith principles:

* **Business Modeling First**: Focuses strictly on domain boundaries, entity responsibilities, ownership, aggregate roots, and relationships. Physical database column definitions, SQL data types, and migrations are intentionally deferred to implementation.
* **Strict Module Decoupling**: Modules (e.g., Catalog vs. Inventory) do NOT share internal database state or perform cross-domain joins.
* **Decoupled Inventory Domain**: The `Catalog` domain (Products/Variants) is explicitly decoupled from stock control. `Catalog` manages product definitions, presentation, and SEO, while the `Inventory` domain independently manages physical stock, warehouse locations, and stock reservations.
* **Multi-Tenancy Isolation**: All domain aggregates enforce tenant scope ownership via `tenant_id` context.

---

## 2. High-Level Entity Relationship Topology

```
Tenant Domain (Aggregate: Tenant)
└── Store
    ├── Catalog Domain (Aggregate: Product)
    ├── Inventory Domain (Aggregate: Inventory) [DECOUPLED]
    ├── Customer Domain (Aggregate: Customer)
    ├── Sales Domain (Aggregate: Order)
    ├── Shipping Domain (Aggregate: Shipment)
    └── Marketing Domain (Aggregate: Coupon)
```

---

## 3. Domain Entity Specifications

---

### 3.1 Identity Domain

#### Aggregate Root
* `User`

#### Entities
* `User`, `Role`, `Permission`, `Session`, `RefreshToken`

#### Entity Responsibilities & Boundaries
* **`User`**: Core identity account across the platform. Manages global profile, credentials, and authentication state. Does NOT manage store-level customer orders.
* **`Role`**: Represents RBAC roles (`StoreOwner`, `StoreManager`, `FulfillmentStaff`).
* **`Permission`**: Granular action permissions attached to roles.
* **`Session` / `RefreshToken`**: Auth token lifecycles, active device sessions, and security revocation.

#### Ownership & Scope
* **Global Scope**: `User`, `RefreshToken`
* **Tenant Scope**: Tenant-specific role assignments via `UserRole`.

---

### 3.2 Tenant Domain

#### Aggregate Root
* `Tenant`

#### Entities
* `Tenant`, `Store`, `Domain`, `Subscription`, `SubscriptionPlan`

#### Entity Responsibilities & Boundaries
* **`Tenant`**: Root organization account holding multi-tenant isolation context.
* **`Store`**: Individual storefront instance under a tenant organization.
* **`Domain`**: Custom domain binding (`merchant.com`) and subdomains (`merchant.bitcommerce.app`) with SSL status.
* **`Subscription` & `SubscriptionPlan`**: SaaS billing tier, usage quotas, feature flags, and renewal status.

#### Relationships
```
Tenant (1) ───< (N) Store
Tenant (1) ───< (N) Domain
Tenant (1) ──── (1) Subscription ───> (1) SubscriptionPlan
```

---

### 3.3 Catalog Domain

#### Aggregate Root
* `Product`

#### Entities
* `Product`, `ProductVariant`, `ProductImage`, `Category`, `Brand`, `Collection`, `Tag`, `Attribute`, `AttributeValue`

#### Entity Responsibilities & Boundaries
* **`Product`**:
  * **Responsible for**: Title, slug, description, visibility status (Draft/Published), SEO metadata, brand association.
  * **Does NOT manage**: Physical inventory counts, stock reservation, customer reviews, order history.
* **`ProductVariant`**: Specific sellable SKU combination (e.g. Size: XL, Color: Blue) with pricing details (`price`, `compare_at_price`).
* **`Attribute` / `AttributeValue`**: Dynamic product attributes (Size, Color, Material).
* **`Category` / `Brand` / `Collection` / `Tag`**: Classification and grouping structures for storefront navigation.

#### Relationships & Ownership (Tenant Scoped)
```
Category (1) ───< (N) Product
Brand (1) ──────< (N) Product
Product (1) ────< (N) ProductVariant
Product (1) ────< (N) ProductImage
Product (N) >───< (N) Collection
ProductVariant (N) >───< (N) AttributeValue
```

---

### 3.4 Inventory Domain (Decoupled Module)

#### Aggregate Root
* `Inventory`

#### Entities
* `Inventory`, `InventoryTransaction`, `Warehouse`, `Supplier`

#### Entity Responsibilities & Boundaries
* **`Inventory`**:
  * **Responsible for**: Tracking available stock, reserved stock (active checkouts), safety stock levels, and reorder alerts.
  * **Does NOT manage**: Product display titles, prices, descriptions, images, or storefront themes.
* **`InventoryTransaction`**: Immutable audit log of stock movements (Restock, Order Reservation, Sale Deduction, Damage Adjustment, Return).
* **`Warehouse`**: Physical storage location (Dhaka Central Warehouse, Chittagong Hub).
* **`Supplier`**: Vendor/supplier profiles for procurement tracking.

#### Relationships & Domain Links
```
Warehouse (1) ───< (N) Inventory
Inventory (1) ───< (N) InventoryTransaction
Supplier (1) ────< (N) Inventory
Inventory references Catalog -> ProductVariant by variant_id (Weak Reference)
```

---

### 3.5 Customer Domain

#### Aggregate Root
* `Customer`

#### Entities
* `Customer`, `Address`, `CustomerGroup`, `Wishlist`

#### Entity Responsibilities & Boundaries
* **`Customer`**: Store-level customer identity, purchase history summary, and loyalty metrics.
* **`Address`**: Saved billing and shipping addresses (District, Thana/Upazila, Union, Street).
* **`CustomerGroup`**: Customer segmentation (VIP, Wholesaler, Repeat Buyer).
* **`Wishlist`**: Customer saved products for future purchase.

---

### 3.6 Sales Domain

#### Aggregate Roots
* `Cart`, `Order`

#### Entities
* `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderStatusHistory`

#### Entity Responsibilities & Boundaries
* **`Cart`**: Transient shopping cart state, guest checkout sessions, item quantities.
* **`Order`**:
  * **Responsible for**: Order lifecycle state (`PENDING`, `CONFIRMED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`), order snapshot prices, customer details snapshot, totals (subtotal, shipping, discount, grand total).
  * **Does NOT manage**: Direct payment gateway handshakes, courier vehicle routing.
* **`OrderItem`**: Immutable snapshot of purchased variants, unit prices, and quantities at moment of order placement.
* **`OrderStatusHistory`**: Timeline of status transitions with actor audit details.

#### Relationships (Tenant Scoped)
```
Customer (1) ───< (N) Order
Order (1) ──────< (N) OrderItem
Order (1) ──────< (N) OrderStatusHistory
OrderItem references Catalog -> ProductVariant by variant_id (Snapshot Copy)
```

---

### 3.7 Payment Domain

#### Aggregate Root
* `Payment`

#### Entities
* `Payment`, `PaymentTransaction`, `Refund`

#### Entity Responsibilities & Boundaries
* **`Payment`**: Payment record linked to an Order, gateway selection (`BKASH`, `NAGAD`, `SSLCOMMERZ`, `COD`), and transaction state.
* **`PaymentTransaction`**: Gateway payload logs, gateway transaction IDs (`trxID`), and API webhook responses.
* **`Refund`**: Partial or full refund requests and settlement status.

---

### 3.8 Shipping Domain

#### Aggregate Root
* `Shipment`

#### Entities
* `Shipment`, `ShipmentTracking`, `Courier`

#### Entity Responsibilities & Boundaries
* **`Shipment`**: Order package fulfillment details, consignment ID, shipping label URL, package weight.
* **`ShipmentTracking`**: Real-time status logs received from courier APIs.
* **`Courier`**: Integrated delivery partner configuration (Steadfast, Pathao, RedX, Paperfly).

---

### 3.9 Marketing Domain

#### Aggregate Root
* `Coupon`, `Campaign`

#### Entities
* `Coupon`, `CouponUsage`, `Campaign`, `Banner`

#### Entity Responsibilities & Boundaries
* **`Coupon`**: Discount rules (percentage/fixed, minimum order value, validity dates).
* **`CouponUsage`**: Tracks customer usage count against coupon limits.
* **`Campaign` / `Banner`**: Promotional banner graphics and marketing campaign definitions.

---

### 3.9b Pixel Tracking & Attribution Sub-Domain

Part of the Marketing module (`backend/src/modules/marketing/`). Owns the merchant's
advertising-platform pixels, the per-pixel page-targeting rules, the browser + server
(CAPI) event stream those pixels emit, and the link from a converted order back to the
pixel/session/campaign that produced it. Read-side "which order came from which
platform" reporting reads from `MarketingEventLog` + the existing `orders.channel` /
`orders.utmSource` columns and the `tracking` module's `storefront_sessions`; it never
cross-joins into the Catalog or Order tables directly — it references order and session
rows by id only.

#### Aggregate Root
* `MarketingPixel`

#### Entities
* `MarketingPixel`, `MarketingPixelPageRule`, `MarketingEventConfig`, `MarketingEventLog`,
  `MarketingAdSpend`

#### Entity Responsibilities & Boundaries

* **`MarketingPixel`**: One configured pixel *instance*. A merchant may add the **same
  provider multiple times** (e.g. two Meta pixels — one for prospecting, one for
  retargeting), so uniqueness is on `id`, **not** on `(tenantId, storeId, provider)`.
  * `id`, `tenantId`, `storeId` — tenant + store scope (row-level isolation mandatory).
  * `provider` — `META | GOOGLE_ANALYTICS | GOOGLE_ADS | TIKTOK` (enum, extensible).
  * `label` — merchant-supplied name, required, unique per `(storeId, provider)` so two
    pixels of the same provider are humanly distinguishable ("Main Meta Pixel").
  * `pixelId` — the provider's pixel / measurement / dataset id (string).
  * `credentialsEncrypted` — `text`, nullable. AES-256-GCM ciphertext of a JSON blob
    holding the provider secrets (`accessToken` for Meta/TikTok CAPI, `apiSecret` for
    GA4 Measurement Protocol, `testEventCode`, etc.). **Never** stored or returned in
    plaintext; follows the existing `omnichannel_ai_configs.encryptedApiKey` pattern.
  * `capiEnabled` — `boolean`, default `false`. When true the server also sends **every**
    standard event (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`,
    `Purchase`) to the provider's server-side API — Meta Conversions API / TikTok Events
    API / GA4 Measurement Protocol / Google Ads — in addition to the browser pixel.
    Each provider's server path only runs when its credentials are present.
  * `pageScopeMode` — `ALL | RULES`. `ALL` = fire on every storefront page;
    `RULES` = fire only where a `MarketingPixelPageRule` matches.
  * `status` — `CONNECTED | DISCONNECTED` (a disconnected pixel keeps its config and
    history but stops firing).
  * `isActive` — `boolean`, soft on/off independent of `status`.
  * `lastEventAt` — timestamp of the most recent event this pixel emitted.
  * `createdAt`, `updatedAt`.
  * Indexes: `(tenantId, storeId)`, `(tenantId, storeId, provider)`,
    unique `(storeId, provider, label)`.

* **`MarketingPixelPageRule`**: Zero or more per-pixel targeting rules; only consulted
  when the parent pixel's `pageScopeMode = RULES`. Supports **both** granularities the
  merchant asked for:
  * `id`, `tenantId`, `storeId`, `pixelId` (FK → `MarketingPixel.id`, `ON DELETE CASCADE`).
  * `matchType` — `PAGE_TYPE | URL_PATTERN`.
  * `pageType` — used when `matchType = PAGE_TYPE`. Enum:
    `HOME | PRODUCT | COLLECTION | CATEGORY | CART | CHECKOUT | THANK_YOU | SEARCH | BLOG | OTHER`.
  * `urlPattern` — used when `matchType = URL_PATTERN`. A path glob evaluated against the
    storefront pathname, e.g. `/product/*`, `/collections/eid-*`, `/checkout`.
    Leading-slash, case-insensitive, `*` = one path segment, `**` = any depth.
  * `include` — `boolean`, default `true`. `false` = an explicit exclusion that overrides
    matching include rules (so "all product pages except `/product/clearance-*`" is
    expressible).
  * `createdAt`.
  * Index: `(pixelId)`.
  * Resolution order at fire time: if any `include=false` rule matches → do not fire;
    else if any `include=true` rule matches → fire; else → do not fire.

* **`MarketingEventConfig`**: Per-store master on/off switch for each standard event
  name, applied across **all** the store's pixels (a merchant globally pauses
  `AddToCart` without touching individual pixels). Already exists; retained.
  * `id`, `tenantId`, `storeId`.
  * `eventName` — `PageView | ViewContent | AddToCart | InitiateCheckout | Purchase`
    (enum, extensible), unique per `(storeId, eventName)`.
  * `isActive` — `boolean`, default `true`.
  * `createdAt`, `updatedAt`.

* **`MarketingEventLog`**: Append-only record of every event dispatch attempt — the
  data behind the (removed-then-rebuilt) Event Log view and the attribution report.
  * `id`, `tenantId`, `storeId`.
  * `pixelId` — FK → `MarketingPixel.id` (`ON DELETE SET NULL` so history survives a
    pixel deletion), nullable for legacy/test rows.
  * `provider` — denormalised copy so the log is readable without a join.
  * `eventName` — the standard event fired.
  * `transport` — `BROWSER | SERVER` (which path emitted it).
  * `source` — human label ("Meta Pixel", "TikTok Events API").
  * `sessionId` — the `storefront_sessions.sessionId` this event belongs to, when known.
  * `orderId` — set for `Purchase`/`InitiateCheckout` events tied to an order (id
    reference only — no FK across the module boundary into Order).
  * `orderRef` — display order number, denormalised.
  * `utmSource`, `utmMedium`, `utmCampaign` — attribution snapshot at fire time.
  * `status` — `SENT | FAILED`.
  * `httpStatus`, `errorMessage` — provider response diagnostics (nullable).
  * `payloadJson` — `jsonb`, the exact payload sent (PII already hashed).
  * `createdAt`.
  * Indexes: `(tenantId, storeId, createdAt)`, `(tenantId, storeId, eventName)`,
    `(tenantId, storeId, orderId)`, `(pixelId)`.

* **`MarketingAdSpend`**: Merchant-entered advertising spend, the denominator for ROAS
  and CPA in the Sales-by-Source report (Phase A). Auto-importing spend from Meta /
  Google Ads APIs is out of scope for now — this is manual entry.
  * `id`, `tenantId`, `storeId`.
  * `dimension` — `CHANNEL | SOURCE | CAMPAIGN` (which breakdown the amount is attributed to).
  * `dimensionValue` — the concrete value, e.g. `social`, `facebook`, `eid-2026`.
  * `periodStart`, `periodEnd` — the date range the spend covers (`date`, inclusive).
  * `amount` — numeric, `currency` — ISO code (default store currency).
  * `note` — free text, nullable.
  * `createdAt`, `updatedAt`.
  * Index: `(tenantId, storeId, dimension, periodStart)`.
  * The report joins a grouped traffic-source row to any `MarketingAdSpend` row with the
    same `dimension` + `dimensionValue` whose period overlaps the report window; `roas`
    / `cpa` are null when no such row exists.

#### Relationship to existing tracking / order attribution

* The `tracking` module's **`storefront_sessions`** (sessionId, channel, utmSource/Medium/
  Campaign, referrerHost, landingPage) stays the **source of truth for visitor-level
  attribution**. Unchanged.
* **`orders.channel` / `orders.utmSource` / `utmMedium` / `utmCampaign` / `referrerHost`**
  stay the **source of truth for order-level attribution**. Unchanged.
* `MarketingEventLog.sessionId` / `orderId` let the marketing module answer "which
  *pixel* fired for this converting order" and "how many Purchase events did we
  successfully deliver to Meta for orders attributed to `utm_source=facebook`" — it
  augments, and never replaces, the two stores above.

#### Store-entity pixel fields — migration note

`stores.facebookPixelId`, `facebookCapiToken`, `facebookTestEventCode`,
`tiktokPixelId`, `googleTagManagerId`, `googleAnalyticsId`, `snapchatPixelId`,
`pinterestTagId` are **superseded** by `MarketingPixel` rows and become **read-only
legacy**. A one-time data migration copies any non-null value into an equivalent
`MarketingPixel` row (`label = "Imported <provider>"`, `pageScopeMode = ALL`,
`status = CONNECTED`). The columns are retained (not dropped) for one release as a
fallback/rollback path, then removed in a later migration. `MarketingPixel` is the
single source of truth from this design onward — the storefront pixel loader reads
**only** from `MarketingPixel`.

---

### 3.10 CMS Domain

#### Aggregate Root
* `Page`

#### Entities
* `Page`, `Blog`, `Menu`

#### Entity Responsibilities & Boundaries
* **`Page`**: Custom store pages (About Us, Contact Us, Privacy Policy, Terms).
* **`Blog`**: Merchant blog posts, articles, and news releases.
* **`Menu`**: Storefront navigation header/footer link structures.

---

### 3.11 System Domain

#### Aggregate Root
* System (Global Utility Scope)

#### Entities
* `Notification`, `AuditLog`, `Media`, `Setting`

#### Entity Responsibilities & Boundaries
* **`Notification`**: System push alerts, SMS queue logs, and email delivery receipts.
* **`AuditLog`**: System-wide administrative action logs for security and compliance.
* **`Media`**: Shared image/file attachment registry with S3 storage keys and image metadata.
* **`Setting`**: Storefront configuration parameters (currency formats, timezones, store contacts).

---

## 4. Domain Boundary & Intercommunication Rules

1. **No Cross-Domain Direct DB Joins**: The `Sales` module MUST NOT perform SQL JOINs directly against `Catalog` or `Inventory` tables.
2. **Weak References via IDs**: Cross-domain references use String/UUID identifiers (`variant_id`, `customer_id`, `warehouse_id`).
3. **Data Snapshots**: Entities like `OrderItem` snapshot the variant title, SKU, and unit price at checkout time to remain resilient against future catalog edits.
4. **Decoupled Stock Updates**: When an order is placed, `Sales` emits an `OrderPlacedEvent`. The `Inventory` module listens to this event to execute stock reservation asynchronously without tight coupling.
