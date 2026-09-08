# 03_FEATURE_INVENTORY.md - Detailed Feature Inventory

# BitCommerce Feature Inventory & Module Mapping

**Version:** 0.1.0  
**Status:** Draft  

---

## Module Breakdown

### 1. Identity Module
* **IDN-001 Authentication**: Email/Password, Social Auth (Google, Facebook), OTP via SMS (BD operators).
* **IDN-002 Authorization & RBAC**: Roles (SuperAdmin, Store Owner, Store Manager, Order Fulfillment, Accountant), custom permissions.
* **IDN-003 Security**: MFA, Session management, Password reset & email verification.

### 2. Tenant & Organization Module
* **TNT-001 Store Management**: Multi-store creation under a single merchant account.
* **TNT-002 Domain Management**: Subdomains (`merchant.bitcommerce.app`) & Custom domain mapping (`merchant.com` with SSL).
* **TNT-003 Subscriptions**: Tiered plans (Free, Starter, Growth, Enterprise), usage limits, automated subscription renewals.

### 3. Storefront & CMS Module
* **CMS-001 Theme Engine**: Section-based themes, live preview, layout sections.
* **CMS-002 Custom Pages**: Custom pages (About Us, Contact, T&C, Privacy Policy), FAQ builder, Blog manager.
* **CMS-003 Store Settings**: Logo, Favicon, Currency, Language, Social Links, Business Info.

### 4. Catalog & Inventory Module
* **CAT-001 Products & Variants**: Single products, product variants (SKU, Size, Color, Material), variant images, pricing and tax management.
* **CAT-002 Categorization & Hierarchy (Complete)**:
  * Multi-level recursive category hierarchy with visual drag-and-drop tree reordering and circular cycle prevention.
  * Category domain management: Active, Draft, and Archived status workflows with storefront visibility toggles.
  * Media upload integration and structured SEO metadata (Title, Meta Description).
  * Product ↔ Category assignment with correlated product counting, category product tab view, and product list filtering.
  * Merchant bulk management toolbar: batch status switcher, hierarchical bulk move, and safe cascade deletion (product unlinking).
  * Two-stage RFC 4180 CSV import with live validation preview, duplicate detection, and topological transaction execution; formula-sanitized UTF-8 CSV exporter.
* **INV-001 Inventory Domain & Foundation (Decoupled)**:
  * Canonical source of truth for stock quantities: physical `quantityOnHand`, pending `quantityReserved`, and computed `availableStock` (`onHand - reserved`).
  * Explicit decoupling from Catalog: Products and Product Variants hold metadata/presentation, while Inventory manages warehouse stocks, reorder points, and reservation state.
  * Multi-tenant data integrity: partial unique indexes preventing duplicate stock records per product/variant, database CHECK constraints (`onHand >= 0`, `reserved >= 0`, `reorderPoint >= 0`), and multi-tenant query indexing.
  * Append-only immutable stock movement ledger (`inventory_movements`) supporting `IN`, `OUT`, `ADJUSTMENT`, `INITIAL_STOCK`, `RESERVED`, `RELEASED`, `RETURNED`, and `TRANSFER`.
  * Authoritative domain service (`InventoryDomainService`) for stock calculations, status evaluation (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `NOT_TRACKED`), and adjustment/reservation validations.

### 5. Sales & Order Module
* **SAL-001 Cart & Checkout**: Single-page checkout, guest checkout, saved cart sessions.
* **SAL-002 Order Pipeline**: Order lifecycle (Pending, Processing, Shipped, Delivered, Cancelled, Refunded), bulk actions, order timeline.
* **SAL-003 Promotions**: Coupon codes, percentage/fixed discounts, minimum order value triggers, buy-X-get-Y.

### 6. Customer & CRM Module
* **CST-001 Customer Accounts**: Order history, saved addresses, wishlist.
* **CST-002 CRM & Segmentation**: Customer segmentation (VIP, Repeat, Inactive), customer notes, store credit/loyalty points.

### 7. Payment Module
* **PAY-001 Local Gateways**: bKash, Nagad, Rocket, Upay, SSLCommerz, Shurjopay, Foster Payments.
* **PAY-002 Cash on Delivery (COD)**: Native COD option with automated phone verification OTP to prevent fake orders.
* **PAY-003 Refunds & Webhooks**: Instant webhooks for payment status, partial/full refund handling.
* **PAY-004 Transactions Dashboard** *(implemented)*: Merchant Admin `Payments → Transactions` workspace at `/dashboard/payments`.
  * **Gateway vs. Method separation**: a payment records both the processor (`gateway`: SSLCommerz, bKash, Nagad, Stripe, PayPal, COD, Manual) and the instrument the customer actually used (`paymentMethod`: bKash, Nagad, Rocket, Upay, Card, Bank Transfer, COD). These are distinct axes — e.g. gateway `SSLCOMMERZ` + method `BKASH`.
  * **Canonical statuses**: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`, `PARTIALLY_REFUNDED`, `REFUNDED`. The two refund states are written only by the refund domain, never by a client request.
  * **KPI definitions**: *Total Received* = gross captured volume (`COMPLETED` + `PARTIALLY_REFUNDED` + `REFUNDED`); *Paid* = captured volume net of refunds; *Pending* = `PENDING` + `PROCESSING`; *Refunded* = `SUM(payments.refundedAmount)`. Refunds are counted once — never double-counted from refund rows.
  * **Period comparison**: every KPI is compared against the equally-long window immediately preceding the selected range. A zero baseline yields `changePercent: null` so the UI renders a neutral state instead of `Infinity%`/`NaN%`.
  * **Analytics**: donut overview, top payment methods and gateway summary are computed with SQL `SUM`/`COUNT`/`GROUP BY` — payments are never loaded into Node.js to be aggregated.
  * **Timeline & idempotency**: `payment_events` is an append-only lifecycle log powering the payment timeline. Its partial unique index on `(paymentId, externalEventId)` is the webhook idempotency ledger — a replayed gateway callback cannot create a duplicate payment, order update or refund.
  * **Security**: every query is `tenantId`-scoped (a foreign payment returns 404, never 403, so existence is not leaked); reads require `orders:read` and export/refund require `orders:manage` via `PermissionsGuard`; gateway references are masked and no card numbers, CVVs, PINs or gateway secrets are ever stored or returned.

### 8. Shipping & Fulfillment Module
* **SHP-001 Courier Integrations**: Pathao, Steadfast, RedX, Paperfly direct API connections.
* **SHP-002 Fulfillment**: One-click shipment booking, shipping label & invoice generation, real-time package tracking.
* **SHP-003 Shipping Rules**: Flat rate, weight-based, location-based (Inside Dhaka / Outside Dhaka).

### 9. Marketing & Analytics Module
* **MKT-001 Tracking & Pixels**: Multi-instance pixel management (same provider addable
  more than once) for Meta Pixel + Conversions API (CAPI), Google Analytics 4, Google
  Ads, TikTok Pixel + Events API. Per-pixel page targeting by page type
  (home/product/collection/cart/checkout/thank-you/…) **and** URL glob pattern, with
  include/exclude rules. Store-wide standard-event master switches (PageView,
  ViewContent, AddToCart, InitiateCheckout, Purchase). Browser + server-side (CAPI)
  event dispatch with an append-only, filterable event log. Managed entirely via
  `/v1/marketing/pixels*` — the former flat `stores.*PixelId` columns have been
  dropped. See `docs/06` §3.9b, `docs/07` "Marketing — Pixels, Tracking &
  Attribution", and `docs/PIXEL_AND_MARKETING_WORKFLOW.md` for the build log.
* **MKT-003 Order Attribution & Sales-by-Source**: "Which order came from which
  platform" — a channel / UTM-source / UTM-campaign breakdown of sessions, orders,
  revenue and conversion rate (joining `storefront_sessions` to `orders` by exact
  `sessionId`), plus merchant-entered ad spend per dimension for ROAS and CPA.
  Ships **first** (Phase A), ahead of the pixel rebuild, since it needs only data that
  already exists. Phase 5 later adds a per-pixel Purchase-delivery health column.
* **MKT-002 Marketing Campaigns**: SMS marketing integration, abandoned cart recovery notifications.

### 10. Reports & Business Intelligence
* **REP-001 Dashboard Analytics**: Real-time sales, order breakdown, conversion rates, top-selling products.
* **REP-002 Exportable Reports**: Sales reports, tax reports, inventory valuation, customer summaries.

### 11. System & Utility Module
* **SYS-001 Notifications**: Email notifications (Resend/SMTP), SMS alerts, system push notifications.
* **SYS-002 Audit Logs**: Activity logs for store actions and configuration changes.
* **SYS-003 Search & Media Storage**: Full-text search, media library with S3 image optimization.


---

## Permission Matrix (RBAC)

| Module / Feature | SuperAdmin | Store Owner | Store Manager | Order Fulfillment | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Store & Tenant Settings** | ✅ | ✅ | Read Only | ❌ | ❌ |
| **Catalog & Products** | ✅ | ✅ | Manage | Read Only | Read Only |
| **Inventory Management** | ✅ | ✅ | Manage | Manage | Read Only |
| **Orders & Checkout** | ✅ | ✅ | Manage | Process & Fulfill | Read Only |
| **Payments & Refunds** | ✅ | ✅ | View & Refund | ❌ | View & Refund |
| **Shipping & Courier Booking** | ✅ | ✅ | Manage | Book & Print Labels | ❌ |
| **Customer Data & CRM** | ✅ | ✅ | View & Manage | View Addresses | Read Only |
| **Marketing, Pixels & Attribution** | ✅ | ✅ (`marketing:manage`) | Manage (`marketing:manage`) | ❌ | Read Only (`marketing:read`) |
| **Billing & Subscriptions** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Staff & Role Management** | ✅ | ✅ | ❌ | ❌ | ❌ |

