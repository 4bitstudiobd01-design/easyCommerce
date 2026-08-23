# Order Management — 13-Feature Implementation Plan
দুই জায়গায় প্ল্যান রাখা হয়েছে:

ORDER_MANAGEMENT_PLAN.md — প্রজেক্ট root-এ, plain markdown, git-এ commit করার জন্য প্রস্তুত
সুন্দর Artifact — https://claude.ai/code/artifact/f5896ec7-4076-4dbd-ad69-b36b6fdb9ba8 — sticky navigation, risk-color-coded feature cards (low/medium/high), collapsible detail সহ readable ফরম্যাটে
যখন সময় পান, Artifact-টা খুলে দেখে নেবেন। কাজ শুরু করতে বললে আমি approved plan অনুযায়ী build order মেনে এগোব (শুরুতে shared Modal component + order-number sequence)।

## Context

The order table screenshot and 13-point request describe a mature set of gaps in the Order module: no "send to courier" action, a naive timestamp-based order number, an unconfirmed inline status dropdown, missing table columns (address/courier status/delivery rate/source), no click-to-call, no merchant-initiated payment links, no partial-payment tracking, no product images on order items, no way to add off-catalog items or per-line discounts, and a generically-styled invoice that needs to match a provided branded design (Tech & Trove reference, green header bars, Bill To/Ship To layout, 4-column status strip, Sub Total/Total/Balance Due block).

A thorough codebase exploration (two passes: a general Explore agent + a Plan agent that re-verified every claim against actual code) found that **status history, order notes, and a unified timeline already exist end-to-end** (`OrderStatusHistoryEntity`, `OrderNoteEntity`, `OrderTimelineService`, `OrderActivityFeed.tsx`) — that part of feature #4 is wiring, not building from scratch. Several other pieces (SSLCommerz gateway-URL generation, courier adapters for 4 providers, consignment tracking) already exist and need extending rather than inventing. But three areas are genuinely new, higher-risk backend surface: **custom/off-catalog order items** (touches inventory-deduction logic in 3 services), **partial payments with a new `PARTIALLY_PAID` status**, and **item-level exclusion when booking a courier** (the courier system currently has zero concept of shipping less than the whole order).

All ambiguous product decisions were resolved with the user before finalizing this plan (see "Confirmed decisions" below) — most notably: full item-exclusion scope for courier booking (not a cut-down v1), full state-machine loosening for backward status transitions (not just the one pre-existing case), and a first-class `PARTIALLY_PAID` enum value (not just a computed display field). These choices meaningfully increase scope versus the cheaper alternatives that were offered, so they're called out explicitly per feature below.

## Confirmed decisions (do not re-litigate)

1. **Order number**: `ORD-000104` style — sequential, per-tenant, zero-padded. Reused as-is as the invoice number (no separate `INV-` sequence).
2. **Custom/off-catalog order items**: allowed — a line item can be name+price only, never persisted to the product catalog, not stock-tracked.
3. **Partial payments**: both an SSLCommerz payment link for a specific (possibly partial) amount, AND manual/offline payment recording (cash/bKash-in-hand) as a ledger entry. Both contribute to a running balance.
4. **Modal architecture**: build one shared `Modal` component now; all *new* modals in this plan use it. Existing 7+ hand-rolled modals are not retrofitted.
5. **Invoice numbering**: reuses `order.orderNumber` directly, styled like the Tech & Trove reference screenshot.
6. **Courier bill**: shown as its own field/column (`consignment.deliveryCharge`), never folded into `order.grandTotal` — customer-facing total never changes after courier booking.
7. **Send Courier flow**: courier-selection dropdown (from the merchant's connected/enabled couriers) → booking modal for that courier, **with full item-level exclusion/quantity-adjustment** before confirming (not a cut-down "whole order only" v1).
8. **Backward status transitions**: the state machine gets loosened so a merchant can move an order backward through the fulfillment sequence (e.g. SHIPPED → PROCESSING), not just the one case it currently allows (ON_HOLD → PENDING). Every backward move requires a mandatory reason.
9. **Payment status**: add a first-class `PARTIALLY_PAID` value to `PaymentStatusEnum` (not a computed-only display field) — touches a migration plus every place that switches on `paymentStatus`.

## Shared infrastructure (build first — everything else depends on these)

- **`frontend/src/components/ui/Modal.tsx`** (new) — extracted from the common hand-rolled pattern already used 7+ times (`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm` overlay, white rounded-2xl card, header+icon+title+X-close, scrollable body, sticky footer). Props: `isOpen`, `onClose`, `title`, `icon?`, `size?`, `children`, `footer?`. Adds backdrop-click and Escape-key close (neither exists today). Blocks Features 1, 3, 4, 8, 9, 12.
- **Per-tenant order-number sequence** (Feature 2, detailed below) — blocks clean invoice numbering (Feature 13) and is low-risk to build first.
- **Courier-connection lookup** — no new backend entity needed. `CourierIntegrationEntity` + `ListCourierIntegrationsService` (`backend/src/modules/logistics/`) already model "tenant's connected couriers"; the frontend just needs to consume the existing endpoint filtered to `isEnabled: true` (reuse whatever route already powers `CouriersView.tsx`, confirmed during Feature 1 implementation rather than duplicating a route).

## Feature 2 — Sequential per-tenant order numbers

Replace the collision-prone `` `ORD-${Date.now().toString().slice(-6)}` `` (`backend/src/modules/order/services/create-order.service.ts:110`) with a real counter.

- **New migration + entity**: `backend/src/modules/order/entities/order-number-sequence.entity.ts` — `{ tenantId: uuid (PK), lastValue: integer default 0 }`.
- **New service**: `backend/src/modules/order/services/generate-order-number.service.ts` — inside a `dataSource.transaction`, `SELECT lastValue ... FOR UPDATE`, increment, upsert, return `ORD-` + zero-padded value. This is deliberately NOT modeled on `CreateShipmentService.generateShipmentNumber()`'s `MAX(...)`-scan pattern — that pattern has no row lock and is not concurrency-safe; a locked counter row is used instead.
- **Change**: `create-order.service.ts` — inject `DataSource`, replace the timestamp line with the new service call.
- **Change**: `order.module.ts` — register the new entity + service.
- **Frontend**: no changes needed (order number is already displayed as an opaque string everywhere).
- **Note**: historic orders keep their old `ORD-<timestamp>` numbers; the new sequence starts fresh per tenant. No backfill.

## Feature 1 — "Send Courier": courier-selection dropdown → item-adjustable booking modal

Full scope per decision #7 — this is one of the two largest items in the plan.

- **Backend**: `backend/src/modules/logistics/dto/create-shipment.dto.ts` — add optional `items?: { orderItemId: string; quantity: number }[]`, validated with `@IsOptional() @IsArray() @ValidateNested`. `backend/src/modules/logistics/entities/consignment.entity.ts` — add `shippedItemsJson: jsonb nullable` (a denormalized snapshot of which order items/quantities shipped in this parcel — matches this entity's existing style of denormalizing rather than joining). `backend/src/modules/logistics/services/create-shipment.service.ts` — when `dto.items` is provided, validate the ids belong to the order and persist the snapshot; when omitted, default to "all items" (backward compatible). Confirm PAPERFLY/REDX are registered in `courier-provider.registry.ts` (adapters already exist; the frontend dropdown currently only offers STEADFAST/PATHAO) and register them if missing.
- **Frontend**: new `frontend/src/features/order/components/SendCourierModal.tsx` (built on the shared Modal, two-step: courier picker via `useGetCourierIntegrationsQuery` filtered to enabled providers, then a booking form pre-filled from the order with an items checklist supporting per-line quantity/exclude). Wire it into `OrderListTable.tsx`'s existing "Dispatch" row-menu entry (relabel "Send Courier") and add the same action to `OrderDetails.tsx`'s action bar.
- **Dependency**: shared Modal.

## Feature 3 & 4 — Status-change confirmation everywhere + backward-transition support with mandatory reason

Built together since they share one modal component and one transition-classification helper.

**Confirmation tiers** (concrete, not left vague):
1. Forward transitions — lightweight confirm modal (order summary + Confirm button), matching what `OrderDetails.tsx` already has.
2. CANCELLED/RETURNED — confirm modal with a **required** reason (dropdown + optional free text), matching the existing cancel-modal.
3. Backward transitions — confirm modal with a **required** reason, same friction as tier 2.

**State-machine change** (per decision #8): `backend/src/modules/order/services/order-state.service.ts`'s `canTransition()` currently allows forward moves plus exactly one backward case (`ON_HOLD → PENDING`). It gets loosened so any non-terminal, non-adjacent-only move backward through the sequence `PENDING → ON_HOLD/CONFIRMED → PROCESSING → READY_TO_SHIP → SHIPPED → DELIVERED → COMPLETED` is allowed going backward (e.g. SHIPPED → PROCESSING), while `CANCELLED` and `RETURNED` remain terminal (no transitions out of them either direction) — moving *into* CANCELLED/RETURNED still follows tier 2 above. Concretely: add a backward-transition allowance for every state in the forward sequence to move to any earlier state in that same sequence (not just its immediate predecessor), still going through `assertTransition`.

**Files**:
- `backend/src/modules/order/services/order-state.service.ts` — loosen `canTransition()` per above.
- `backend/src/modules/order/dto/update-order-status.dto.ts` — reason becomes conditionally required (custom validator) when the transition is backward or into CANCELLED/RETURNED, as defense-in-depth (frontend already gates this, but the backend shouldn't silently accept an ungated call).
- New `frontend/src/features/order/utils/statusTransition.ts` — `isBackwardTransition(current, target)`, `requiresReason(current, target)`, shared by table and details page.
- New `frontend/src/features/order/components/StatusChangeConfirmModal.tsx` (shared Modal) — parameterized by tier.
- `frontend/src/features/order/components/OrderListTable.tsx` — the bare `<select onChange={handleStatusChange}>` (currently fires immediately, no reason, no confirmation) now opens `StatusChangeConfirmModal` instead of calling the mutation directly.
- `frontend/src/features/order/components/OrderDetails.tsx` — swap its two inline modals for `<StatusChangeConfirmModal>` (removes duplicate markup, preserves existing behavior).
- Confirm `OrderActivityFeed.tsx` renders the `reason` field on status-history entries (add if missing — quick check during implementation).
- **Backend risk**: loosening the state machine means code elsewhere that assumed forward-only progress (e.g. any inventory/courier logic gated on "we've already shipped, so X can't happen") should be spot-checked during implementation for backward-move edge cases — flagged here, not fully audited in this plan.

## Feature 5 — Table columns: full address, courier status, delivery rate

- **Backend**: `backend/src/modules/order/services/list-merchant-orders.service.ts` currently has no join to `ConsignmentEntity` for the list view (only an `EXISTS` filter subquery) — add a second, batched query (`consignments WHERE orderId IN (...)` for the current page's order ids) rather than fighting TypeORM's raw-join hydration with `getManyAndCount`. Returns `courierStatus`, `courierProvider`, `trackingCode`, `deliveryCharge` per order.
- **Frontend**: `OrderListTable.tsx` — replace the single "Delivery" column (currently just `order.city`) with two new columns: **Address** (full denormalized address, truncated with tooltip/expand) and **Courier** (provider + status badge, or "Not shipped"). Add a **Courier Bill** column (`consignment.deliveryCharge`, ties into Feature 10). Tighten the `Order` interface's loose `consignment?: any` in `orderApi.ts` to a proper typed shape.
- **UX note**: 2-3 new columns will need horizontal scroll or responsive column-priority handling — a layout call to make during implementation, not just an engineering one.

## Feature 6 — Click-to-call phone + copy customer info

Frontend-only.
- `OrderListTable.tsx` — wrap `order.customerPhone` (currently plain text) in a `tel:` link with `stopPropagation` (matches the pattern already used in `OrderDetails.tsx`).
- `OrderDetails.tsx` — add a visible "Call" icon-button next to the phone number, and a "Copy" button that copies `Order #{orderNumber}\nPhone: {customerPhone}` via `navigator.clipboard.writeText`, with a toast confirmation (reuse whatever toast library is already imported in this file).

## Feature 7 — Order source/channel column

Backend data already exists (`order.channel`, populated via `normalizeChannel()` at creation). Frontend-only: add a "Source" column to `OrderListTable.tsx` with a small `ChannelBadge` component mapping known channel values (direct/facebook/instagram/tiktok/website) to an icon+color, with a safe fallback badge for unmapped values. Add `channel`/UTM fields to the `Order` interface in `orderApi.ts` (currently missing).

## Feature 8 — Payment links via SSLCommerz for existing orders

Depends on Feature 9 (balance-due computation) — hard dependency, build Feature 9 first.
- `backend/src/modules/payment/services/initiate-sslcommerz-payment.service.ts` — currently hardcodes `total_amount: order.grandTotal`; add an optional `amount` param, validated against balance due when provided (partial link).
- New `create-payment-link-for-order.service.ts` — resolves balance due via Feature 9's service, calls the above, returns `{ gatewayUrl, tranId, amount }`.
- New route: `POST /payments/orders/:orderId/payment-link`.
- Optional SMS share: extend `TriggerOrderStatusSmsService` with a new `PAYMENT_LINK` message type (same pattern it already uses for courier tracking data).
- Frontend: new `SendPaymentLinkModal.tsx` (shared Modal) — amount input defaulting to balance due (editable down for partial), Generate → shows URL with Copy + optional Send-via-SMS. Action added to `OrderDetails.tsx`'s bar, visible when balance due > 0.

## Feature 9 — Partial payments (online + manual) with first-class `PARTIALLY_PAID` status

Per decision #9 — larger scope than the computed-only alternative.

- **Migration**: alter the Postgres enum backing `PaymentStatusEnum` (`backend/src/modules/order/entities/order.entity.ts`) to add `PARTIALLY_PAID`.
- **New**: `backend/src/modules/payment/services/get-order-balance.service.ts` — `{ grandTotal, amountPaid, balanceDue }`, using the same `SUM(amount) WHERE status IN (...)` aggregation pattern already proven in `get-payment-summary.service.ts`, minus `refundedAmount`, scoped to one `orderId`.
- **New**: `record-manual-payment.dto.ts` / `record-manual-payment.service.ts` — creates a `PaymentEntity` row directly (`status: COMPLETED`, a `MANUAL` gateway/method value — add to the enum if no generic non-online value exists), records a `PaymentEventEntity`, and — inside the same transaction — recalculates `order.paymentStatus`: `PARTIALLY_PAID` if `0 < amountPaid < grandTotal`, `PAID` if `amountPaid >= grandTotal`.
- **Change**: wherever `paymentStatus` is switched on for display (`OrderListTable.tsx` payment badge, `OrderDetails.tsx` payment summary, invoice rendering in Feature 13) gets a new case for `PARTIALLY_PAID`.
- New routes: `POST /payments/orders/:orderId/manual-payment`, `GET /payments/orders/:orderId/balance`, `GET /payments/orders/:orderId/history`.
- Frontend: new `RecordManualPaymentModal.tsx` (shared Modal); `OrderDetails.tsx` gains a Payment History sub-section (list of `PaymentEntity` rows) plus Amount Paid / Balance Due lines plus the "Record Manual Payment" button. New `frontend/src/features/payment/api/paymentApi.ts` (no payment RTK Query slice currently exists) with `getOrderBalance`, `getOrderPaymentHistory`, `recordManualPayment`.
- **Build before**: Features 8 and 13 (both need balance-due / payment-status data).

## Feature 10 — Courier bill as a separate display field

Pure display layer on top of Feature 5's data — no new backend work beyond Feature 5's join.
- `OrderDetails.tsx` — a distinct "Courier Bill" line (`consignment.deliveryCharge`) with a caption showing the delta against the customer-facing `order.deliveryFee` (e.g. "Quoted ৳60 · Courier charged ৳80 · Margin -৳20").
- `OrderListTable.tsx` — the Courier Bill column from Feature 5.
- **Guard**: `InvoiceModal.tsx` (Feature 13) must NOT show courier bill on the customer-facing invoice — merchant-only data, per decision #6.

## Feature 11 & 12 — Product images, add-item modal, custom items, per-line discount

Built together (shared migration), sequenced **last** — this is the highest-risk pair in the plan.

**Schema** (one combined migration on `OrderItemEntity`):
- `productImageUrl: varchar nullable` — denormalized at order-creation/item-add time from the catalog product's primary image (matches this entity's existing denormalization of `productTitle`/`sku`). Null for custom items → placeholder icon in the UI. Chosen over a read-time join because custom items have no `productId` to join against.
- `productId` → `nullable: true` (was required) — enables custom items.
- `isCustomItem: boolean default false` — explicit discriminator (never inferred from `productId IS NULL` alone).
- `discountAmount: decimal(12,2) default 0` — per-line discount, separate from the existing order-wide `discountAmount`. `totalPrice = (unitPrice * quantity) - discountAmount`.

**Critical risk, confirmed by reading the actual code** (this is the single riskiest change in the whole plan): three services currently call `adjustStockService.execute(..., productId, ...)` **unconditionally** for every order item:
- `create-order.service.ts` (initial stock deduction)
- `edit-order.service.ts` (stock rollback on edit *and* re-deduction for new items) — will crash today if a custom item reaches this loop, since it looks up `productId` in the product table and throws `NotFoundException` on a miss
- `update-order-status.service.ts` (stock restoration on CANCELLED)

All three need an explicit `if (item.isCustomItem) { skip stock logic entirely }` guard. This must be tested explicitly with a custom-item-containing order going through edit and cancellation before shipping this feature.

**Backend**:
- `order-item.entity.ts` — the four columns above.
- `edit-order.dto.ts` — `EditOrderItemDto` becomes a discriminated shape: existing `{ productId, quantity }` OR `{ isCustomItem: true, customTitle, customUnitPrice }`, plus optional `discountAmount` on every item, validated with `@ValidateIf`.
- `create-order.dto.ts` — custom items restricted to merchant-side editing only (`EditOrderDto`), **not** the public storefront checkout DTO, to avoid customers self-entering arbitrary-priced items as a fraud vector.
- `edit-order.service.ts` — the `isCustomItem` guards described above, plus per-line `discountAmount` folded into `totalPrice` and into `order-calculation.service.ts`'s subtotal loop (needs an optional `discountAmount` field added to `OrderCalculationInput.items[]`).
- `update-order-status.service.ts` — `isCustomItem` guard on the cancellation stock-restoration loop.
- Product search: reuse the existing product-list endpoint with its search param (confirm during implementation whether server-side search already exists, vs. the current client-side-filtered `useGetProductsQuery()` used in `EditOrderPage.tsx`) rather than building a new endpoint.

**Frontend**:
- New `frontend/src/features/order/components/AddOrderItemModal.tsx` (shared Modal) — "Search Catalog" tab (search + thumbnail results) and "Custom Item" tab (name + price inputs), both supporting a per-line discount field before adding to the pending list.
- `EditOrderPage.tsx` — replace inline search with a "+ Add Item" button opening the modal; items table gains per-line discount (editable) and a thumbnail column with placeholder fallback.
- `OrderDetails.tsx` — thumbnail column on the read-only items table.
- `orderApi.ts` — `OrderItem`/`EditOrderRequest` types gain `productImageUrl?`, `isCustomItem?`, `customTitle?`, `customUnitPrice?`, `discountAmount?`.

## Feature 13 — Invoice restyle (Tech & Trove reference design)

- `backend/src/modules/order/services/generate-order-invoice.service.ts` — already returns `order`/`storeName`/`storePhone`/`storeAddress`/`generatedAt`; add `amountPaid`/`balanceDue` by calling Feature 9's `GetOrderBalanceService`. Terms & Conditions text: hardcoded generic string in the frontend (no per-store customization) unless a later need arises.
- `frontend/src/features/order/components/InvoiceModal.tsx` — full visual rebuild: green (`emerald-600`/`emerald-50`) header bars, real store name/phone/address (fix the current hardcoded "BitCommerce Store"), Bill To/Ship To two-column layout (both render the same `shippingAddress`/`customerName`/`customerPhone` — this system has only one address concept, no separate billing address, labeled accordingly so it doesn't imply otherwise), 4-column status strip (Invoice Date/Payment Method/Order Status/Payment Status — now including `PARTIALLY_PAID`), itemized table with green header (including per-line discounts and thumbnails from Features 11/12 if ready), Sub Total/Total/Balance Due summary block (Balance Due from Feature 9), Terms & Conditions footer, "Powered by {store} • Generated {date}" footer. Invoice number = `order.orderNumber` as-is (no new logic).
- **Must NOT show**: courier bill (Feature 10's guard — internal cost data stays merchant-only).
- **Depends on**: Feature 9 (hard — Balance Due line), Feature 2 (soft — order number format).

## Suggested build order

1. Shared Modal component
2. Feature 2 (order-number sequence)
3. Feature 9 (balance-due + manual payments + `PARTIALLY_PAID` enum)
4. Features 6 & 7 (click-to-call, source column — trivial, zero dependencies, quick wins)
5. Feature 5 (table columns/join), then Feature 10 (courier-bill display, thin layer on top)
6. Features 3 & 4 (status confirm modal + loosened backward transitions — share one modal/helper)
7. Feature 8 (payment links — needs Feature 9)
8. Feature 13 (invoice restyle — needs Feature 9, benefits from Feature 2)
9. Feature 1 (Send Courier with full item exclusion — self-contained but substantial)
10. Features 11 & 12 last (product images + add-item modal + custom items + per-line discount) — highest risk (inventory-guard changes across 3 services), most benefit from every other feature already being stable so regressions are easy to isolate.

## Verification

- Backend: `npm run build && npm run lint && npm run test` in `backend/` after each feature group; specifically add/extend unit tests for `order-state.service.ts` (new backward-transition cases), `edit-order.service.ts` and `update-order-status.service.ts` (custom-item stock-guard behavior), and `generate-order-number.service.ts` (concurrent-creation collision test if feasible).
- Frontend: `npm run build && npm run lint` in `frontend/`.
- Manual end-to-end per feature group (dev servers + a disposable test tenant/store):
  - Create several orders back-to-back rapidly → confirm sequential, non-colliding `ORD-######` numbers.
  - Full status walk PENDING → ... → SHIPPED, then move backward to PROCESSING with a reason → confirm it's rejected without a reason, accepted with one, and appears correctly in the order timeline.
  - Add a custom item to an order, edit the order (change quantities), then cancel it → confirm no crash and stock levels for the *real* catalog items on that order are correctly restored while the custom item is silently skipped.
  - Record a manual partial payment smaller than the total → confirm `paymentStatus` becomes `PARTIALLY_PAID`, balance due is correct, then record the remainder → confirm it flips to `PAID`.
  - Generate a partial-amount SSLCommerz payment link, pay it via sandbox → confirm balance due decreases and status updates via the existing IPN/callback path.
  - Book a courier excluding one line item → confirm the consignment reflects only the included items and the order itself is untouched.
  - Print/view the invoice → visually compare against the Tech & Trove reference screenshot (green bars, 4-column strip, Balance Due line, no courier-bill leak).
