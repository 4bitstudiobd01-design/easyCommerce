# Branch: `ecommerce` — Purchase → Sale Flow (with Storefront)

> এই ফাইলটা এই ব্রাঞ্চের কাজের scope আর progress ট্র্যাক করার জন্য। Chat/machine
> বদলালেও এখান থেকে context নিয়ে কাজ চালিয়ে যাওয়া যাবে। কাজ শেষ হলে বা নতুন কিছু
> যোগ হলে এই ফাইল আপডেট করে দিও।

## Goal

Product **purchase** থেকে শুরু করে **sale** পর্যন্ত পুরো eCommerce ফ্লো তৈরি করা —
storefront (customer-facing buying flow) সহ। শুধু backend API না, প্রতিটা স্টেপে
[`CLAUDE.md`](CLAUDE.md)-এর Vertical Slice নিয়ম অনুযায়ী backend module + matching
frontend feature — দুটোই একসাথে।

## Scope (pipeline)

1. **Purchase** — supplier POs, bills, supplier payments
   → `backend/src/modules/purchase/`, `frontend/src/features/purchase/`
2. **Inventory stock-in** — PO receive হলে stock আপডেট হওয়া
   → `backend/src/modules/inventory/`
3. **Catalog** — product/variant listing (stock count catalog-এর দায়িত্ব না, শুধু ID reference)
   → `backend/src/modules/catalog/`, `frontend/src/features/catalog/`
4. **Storefront** — customer-facing browsing/buying UI
   → `frontend/src/features/storefront/`
5. **Sale / Checkout / Order** — order placement, payment
   → `backend/src/modules/order/`, `backend/src/modules/payment/`
6. **Accounting posting** (established pattern) — sale হলে AR/revenue journal entry,
   purchase-এর AP/inventory-asset posting-এর মতো একই প্যাটার্নে
   → `backend/src/modules/accounting/` (`PostJournalEntryService` একমাত্র ledger write path)

## Already built (verify against code before trusting — this file is not live status)

- **Purchase module** — full vertical slice done (suppliers/POs/bills/payments).
  PO receive → `AdjustStockService` দিয়ে inventory-তে stock-in। Bill/payment →
  `PostJournalEntryService` দিয়ে AP journal entry (DEBIT INVENTORY_ASSET/AP, idempotent
  via `sourceRef`, gated by `AccountingSettingsEntity.autoPostEnabled`).
- **Accounting module** — double-entry ledger, chart of accounts, `PostJournalEntryService`
  একমাত্র write path, POSTED status-only aggregation।
- Backend এ ইতিমধ্যে module আছে: `catalog`, `inventory`, `order`, `payment`, `logistics`,
  `purchase`, `accounting`, ইত্যাদি (দেখুন `backend/src/modules/`)।
- Frontend এ `frontend/src/features/storefront/` আগে থেকেই আছে — কতটুকু implement করা
  আছে সেটা কোড দেখে যাচাই করতে হবে।

## Not started / open questions (update as work progresses)

- Sale/checkout flow-এর current অবস্থা যাচাই করা বাকি।
- Storefront-এর product browsing/cart/checkout কতটুকু আছে, কতটুকু বাকি — যাচাই বাকি।
- Sale posting to ledger (AR/revenue) এখনো purchase-এর মতো wired কিনা — চেক করা বাকি।

## Conventions reminder (from root CLAUDE.md)

- Backend: NestJS 10 + TypeORM 0.3 + PostgreSQL, one service = one use case, no cross-module
  DB joins/repo imports (ID reference বা domain event ব্যবহার করতে হবে), controller-এ business
  logic নিষেধ, সব query তে `tenant_id` filter বাধ্যতামূলক।
- Frontend: Next.js 14 App Router, feature-based zir `frontend/src/features/<feature>/`।
- No placeholder/half-finished code, no stray console.log, no leftover TODO।
- Task শেষ ধরার আগে: backend build+lint+test, frontend build+lint, tenant isolation ও
  RBAC guard verify, API envelope docs/07_API_SPECIFICATION.md অনুযায়ী।

## Log

- 2026-09-03 — এই ফাইল তৈরি হলো; scope নির্ধারিত হলো (purchase → sale, storefront সহ)।
  এখনো নির্দিষ্ট কোনো sub-task শুরু হয়নি।
