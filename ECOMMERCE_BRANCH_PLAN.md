# Branch: `ecommerce` — Purchase → Sale Flow (with Storefront)

> এই ফাইলটা এই ব্রাঞ্চের কাজের scope আর progress ট্র্যাক করার জন্য। Chat/machine
> বদলালেও এখান থেকে context নিয়ে কাজ চালিয়ে যাওয়া যাবে। কাজ শেষ হলে বা নতুন কিছু
> যোগ হলে এই ফাইল আপডেট করে দিও।

## Goal

Product **purchase** থেকে শুরু করে **sale** পর্যন্ত পুরো eCommerce ফ্লো তৈরি করা —
storefront (customer-facing buying flow) সহ। শুধু backend API না, প্রতিটা স্টেপে
[`CLAUDE.md`](CLAUDE.md)-এর Vertical Slice নিয়ম অনুযায়ী backend module + matching
frontend feature — দুটোই একসাথে।

## Scope (pipeline) — চূড়ান্ত ক্রম (2026-09-03 এ ঠিক হয়েছে)

ধাপে ধাপে এগোনো হবে: প্রতিটা ধাপে আগে বাস্তবে ব্রাউজারে টেস্ট করা হবে, বাগ/উন্নতির জায়গা
থাকলে user কে কারণ-সহ জানানো হবে, approval নিয়ে fix করে পরের ধাপে যাওয়া হবে।
(বেশিরভাগ module-এ আগে থেকেই কোড আছে — এটা fresh build না, audit-and-complete pass।)

1. **Catalog** — products, categories, variants
   → `backend/src/modules/catalog/`, `frontend/src/features/catalog/`
2. **Purchase** — supplier POs, bills, supplier payments (আগে থেকেই বিল্ট, verify করা বাকি)
   → `backend/src/modules/purchase/`, `frontend/src/features/purchase/`
3. **Inventory** — stock levels, warehouses **+ branch/multi-location system + এক
   branch থেকে আরেক branch এ stock transfer** (নতুন requirement, 2026-09-03)
   → `backend/src/modules/inventory/` — `warehouse.entity.ts`, `stock-transfer.entity.ts`
   ইতিমধ্যে কোডে আছে, কতটুকু কাজ করে যাচাই করা বাকি।
   **গুরুত্বপূর্ণ:** একজন merchant-এর একাধিক **branch** (আলাদা location/outlet) থাকতে
   পারে, আবার একটা branch-এর নিচে একাধিক **warehouse** থাকতে পারে — এই দুই লেভেল
   আলাদা, এক না। Inventory verify করার সময় চেক করতে হবে: (১) বর্তমান
   `warehouse.entity.ts` কি branch বোঝায়, warehouse বোঝায়, নাকি দুটো মিলিয়ে ফেলেছে;
   (২) branch entity আলাদা আছে কিনা branch→warehouses (one-to-many) সম্পর্কসহ;
   (৩) `stock-transfer.entity.ts` warehouse-to-warehouse, branch-to-branch, নাকি
   দুটোই সাপোর্ট করে। ধরে না নিয়ে আগে verify করতে হবে।
4. **Order** — sale/checkout, order হলে stock deduct হওয়া
   → `backend/src/modules/order/`, `backend/src/modules/payment/`
5. **Customer**
   → `backend/src/modules/customer/`
6. **Cart / Abandoned Cart**
7. **Storefront** — customer-facing browsing/buying UI
   → `frontend/src/features/storefront/`
8. **Store Settings**
9. **Marketing**
   → `backend/src/modules/marketing/`

**Accounting posting** (established pattern, cross-cutting) — sale হলে AR/revenue
journal entry, purchase-এর AP/inventory-asset posting-এর মতো একই প্যাটার্নে
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

## Coworker-style communication rule

প্রশ্ন করার দরকার হলে direct plain ভাষায় জিজ্ঞেস করতে হবে, যেমন একজন coworker/team
member-এর সাথে কথা বলা হয় — multiple-choice option-picker default হিসেবে দেয়া যাবে
না। Option-picker শুধু genuine clean either/or decision-এ use করা যাবে।

**নিজে থেকে test শুরু করা যাবে না।** User স্পষ্ট বলেছে (2026-09-03): "যখন তোমাকে test
করতে বলব তখন test করিও, এখন coworker/pair-programmer হিসেবে কাজ করতে থাকো।" মানে
কোনো pipeline step-এ পৌঁছালেই বা কোনো module ব্যাখ্যা করলেই নিজে থেকে browser-এ চালিয়ে
test শুরু করা যাবে না — স্পষ্ট নির্দেশ ছাড়া না। Default mode: আলোচনা + ব্যাখ্যা + একসাথে
plan করা, action শুধু বলা হলে।

**Dev server নিজে থেকে চালানো যাবে না।** User স্পষ্ট বলেছে (2026-09-03): "আমার permission
ছাড়া server run করবে না, আমি নিজে সবসময় run করব।" Backend/frontend dev server (`npm run
start:dev` / `npm run dev`) কখনো নিজে থেকে Bash দিয়ে চালানো যাবে না, verify করার জন্যও
না। Server চালু থাকা দরকার হলে user-কে চালাতে বলতে হবে বা আগে থেকে চলছে কিনা জিজ্ঞেস
করতে হবে।

**Frontend `npm run build` ও নিজে থেকে চালানো যাবে না।** User রিপোর্ট করেছে (2026-09-03):
`frontend/`-এ `npm run dev` চলা অবস্থায় `npm run build` চালালে running dev server /
`.next` build output ভেঙে যায়, ফলে প্রতিবার ম্যানুয়ালি restart করতে হয়। কারণ: Next.js
dev আর production build একই `.next` directory শেয়ার/কনফ্লিক্ট করে। তাই frontend
type-check verify করতে `npx tsc --noEmit` ব্যবহার করতে হবে (`cd frontend && npm run
build` না) — এটা শুধু type-check করে, `.next` টাচ করে না। Backend `npm run build`
(`nest build`) আলাদা টুল/আউটপুট dir বলে সমস্যা রিপোর্ট হয়নি, কিন্তু কোনো build/server
command-এর side effect নিয়ে সন্দেহ থাকলে ধরে না নিয়ে আগে জিজ্ঞেস করতে হবে।

## Perspective rule

এই ব্রাঞ্চের যেকোনো কাজে তিনটা দৃষ্টিভঙ্গি একসাথে ভাবতে হবে — **businessman**,
**marketer**, আর **software engineer** হিসেবে। শুধু code implement করলেই হবে না —
business sense (cost/margin/feasibility), marketing/conversion impact (customer trust,
clarity), আর technical soundness — তিনটাই বিবেচনা করে কাজ করতে হবে। Plan-এও এই
চিন্তাভাবনা প্রতিফলিত হবে (সহজ ভাষায়)।

## Workflow rules (must follow every time)

1. **Plan first, always** — যেকোনো কাজ শুরুর আগে প্রথমে একটা plan লিখে user-কে দেখাতে
   হবে। User approve না করা পর্যন্ত execute করা যাবে না। Plan এমন ভাষায় লিখতে হবে
   যেন একজন non-technical মানুষ বুঝতে পারে (জার্গন ছাড়া, সহজ ভাষায় কী হবে সেটা বলা)।
2. **Bug/problem fix করার আগে** — সমাধান করার আগে user-কে বলতে হবে: সমস্যাটা কী,
   কেন হয়েছে, কোথা থেকে এসেছে (কোন অংশ/ফাইল, root cause)। User দেখার পর তবেই fix
   করতে হবে।
3. **Fix করার পর** — step by step বলতে হবে কীভাবে সমাধান করা হলো, সমস্যাটা কী ছিল
   (সহজ ভাষায়), কোথায় ছিল, আর ঠিক কী কী স্টেপে fix করা হলো।

## Communication rule

কাজ শেষে overview/summary-তে ঠিক যা করা হয়েছে শুধু সেটাই বলতে হবে — extra/filler কিছু না।

**Summary format ("Antigravity style"):**
- ছোট একটা completion opening line (emoji সহ ঠিক আছে), তারপর সরাসরি বিস্তারিত।
- "যা যা পরিবর্তন করা হয়েছে:" সেকশন — **প্রতিটা ফাইল/কম্পোনেন্ট আলাদা bold sub-heading**,
  তার নিচে bullet point এ ঠিক কী বদলেছে। একগাদা ফাইল নিয়ে এক প্যারাগ্রাফ প্রোজ না।
- প্রতিটা bullet/tab-label এ হালকা emoji (📊 👥 📄 🧾-স্টাইল) — scanning সহজ করতে,
  বেশি না।
- Relevant হলে "Backward Compatibility & Redirects" সেকশন — পুরনো পাথ/behavior এখনো
  কাজ করে কিনা, কোথায় redirect হয়।
- শেষে verification line — কী check চালানো হয়েছে (tsc/build/lint) আর ফলাফল
  (যেমন "০টি error"), প্লাস user-এর জন্য concrete next action (যেমন কোন URL খুলে দেখতে হবে)।
- শুধু আসলেই যা বদলেছে ততটুকুই কভার করবে — file/section অনুযায়ী organize করা, কিন্তু
  extra/filler কিছু যোগ করা যাবে না।

**Confirmed good practice (2026-09-03):** কোনো component/block replace বা remove করার
পর সেই ফাইলে অব্যবহৃত import/variable/helper (যেমন unused hook, unused function) থেকে
গেলে সেগুলো একই কাজের অংশ হিসেবে পরিষ্কার করে দিতে হবে, dead code রেখে দেয়া যাবে না —
এবং summary-তে এটা আলাদা করে উল্লেখ করতে হবে।

## Log

- 2026-09-03 — এই ফাইল তৈরি হলো; scope নির্ধারিত হলো (purchase → sale, storefront সহ)।
  এখনো নির্দিষ্ট কোনো sub-task শুরু হয়নি।
- 2026-09-03 — Workflow rules যোগ করা হলো: plan-first (non-tech ভাষায়) + approval
  বাধ্যতামূলক, এবং bug fix-এর আগে/পরে root-cause explanation বাধ্যতামূলক।
- 2026-09-03 — Perspective rule যোগ করা হলো: businessman + marketer + engineer —
  তিন দৃষ্টিভঙ্গি থেকে ভেবে কাজ করতে হবে।
- 2026-09-03 — Coworker-style rule যোগ করা হলো: direct plain question, multiple-choice
  option-picker default হিসেবে না।
- 2026-09-03 — Summary format rule যোগ করা হলো: "Antigravity style" — per-file bold
  sub-heading + bullets + verification line, flat paragraph না।
- 2026-09-03 — Pipeline-এর চূড়ান্ত ক্রম ঠিক হলো: Catalog → Purchase → Inventory
  (+ branch/multi-location + stock transfer, নতুন requirement) → Order → Customer →
  Cart/Abandoned Cart → Storefront → Store Settings → Marketing। Working method:
  ধাপে ধাপে, প্রতি ধাপে বাস্তব টেস্ট + approval নিয়ে fix।
- 2026-09-03 — ভাষা নিয়ম: response বাংলা লিপিতে দিতে হবে, বাংলিশ না।
- 2026-09-03 — Branch vs Warehouse distinction স্পষ্ট হলো: এক merchant-এর multi-branch
  এবং প্রতি branch-এর multi-warehouse দুটোই থাকতে পারে, এই দুই লেভেল আলাদা। Inventory
  ধাপে verify করার সময় এটা মাথায় রাখতে হবে।
- 2026-09-03 — নিয়ম যোগ হলো: নিজে থেকে test শুরু করা যাবে না, শুধু বলা হলে test করতে
  হবে। Coworker/pair-programmer mode default।
- 2026-09-03 — নিয়ম যোগ হলো: dev server কখনো নিজে থেকে চালানো যাবে না, user সবসময় নিজে
  চালাবে।
- 2026-09-03 — Category page-এ breadcrumb-style navigation implement করা হলো (Tree/Flat
  view সরিয়ে) — `CategoryBrowser.tsx` নতুন কম্পোনেন্ট, `CategoryManagementApp.tsx`
  আপডেট, `CategoryTreeTable.tsx` মুছে ফেলা হলো। tsc --noEmit ক্লিন পাস। Unused
  import/variable cleanup ভালো লেগেছে user-এর — এই habit বজায় রাখতে হবে।
- 2026-09-03 — Category delete-এ নিয়ম হলো: product/subcategory থাকলে delete block
  হবে, error দেখাবে (আগে silent unlink করত) — `delete-category.service.ts` আপডেট,
  সংশ্লিষ্ট spec test rewrite করা হলো।
- 2026-09-03 — সব জায়গার `window.confirm()` (৯টা ফাইল) বদলে নতুন shared
  `ConfirmDialog.tsx` কম্পোনেন্ট বসানো হলো — কোনো নতুন npm package লাগেনি, আগে থেকে
  থাকা `Modal.tsx`-এর উপর বানানো।
- 2026-09-03 — নিয়ম যোগ হলো: frontend `npm run build`-ও নিজে থেকে চালানো যাবে না
  (dev server-এর `.next` ভেঙে দেয়) — verify করতে `npx tsc --noEmit` ব্যবহার করতে হবে।
- 2026-09-03 — Category delete UX আরও ঠিক করা হলো: reorder (drag-and-drop + up/down
  arrow) breadcrumb view-এ ফিরিয়ে আনা হলো (`canReorder` prop)। এই সময় `list-categories.
  service.ts`-এ একটা bug ধরা পড়ল ও ঠিক হলো — response-এ `isVisible`/`showInStorefront`
  বাদ পড়েছিল যদিও frontend টাইপ ধরে নিয়েছিল আছে।
- 2026-09-03 — Storefront category display fix: এখন merchant-এর admin-set sortOrder
  মেনে চলে, product থেকে category derive করত আগে। নতুন public endpoint
  `GET /catalog/public/store/:slug/categories`
  (`find-public-store-categories.service.ts`), frontend
  `useGetPublicStoreCategoriesQuery`, `DefaultStorefrontTheme.tsx`-এ wired
  (product-derived fallback রাখা হয়েছে preview mode-এর জন্য)।
- 2026-09-03 — Category table-এ Status কলাম static badge থেকে inline dropdown হলো
  (click করলেই সরাসরি Active/Draft/Archived বদলায়), নতুন "Storefront" toggle কলাম
  যোগ হলো (Products পেজের প্যাটার্ন অনুসরণ করে)।
- 2026-09-03 — Category Create/Edit page (`CreateCategoryView.tsx`,
  `EditCategoryView.tsx`) tab-switching থেকে single-page scroll-এ বদলানো হলো — sidebar
  (General/SEO/Display) click করলে scroll করে, manual scroll করলেও highlight sync
  থাকে (IntersectionObserver)। অকার্যকর "More Options" tab/placeholder সম্পূর্ণ সরানো
  হলো। Page header ও General ট্যাবের Image/Icon কলাম sticky করা হলো যাতে scroll করলেও
  দৃশ্যমান থাকে। Page width বাড়ানো হলো (`max-w-7xl` → `w-full`, sidebar/content grid
  ratio 3:9 → 2:10)।
- 2026-09-03 — (Category কাজের পাশাপাশি) Net Profit analytics page-এর "60% cost
  estimate" fallback সরানো হলো — cost price না থাকা item এখন calculation থেকে বাদ যায়
  (অনুমান করা হয় না), warning banner দেখায় কতগুলো বাদ পড়েছে — `net-profit.service.ts`,
  `NetProfitAnalyticsCard.tsx`।
- 2026-09-03 — সেশন শেষ। পরের সেশনে যেখান থেকে শুরু হবে তা নির্ধারিত না — Category
  polish/browser-test চালিয়ে যাওয়া, নাকি pipeline-এর পরের ধাপ (Purchase verify) — user
  ঠিক করে দিবে।
- 2026-09-03 — Catalog step, Product sub-area শুরু। কোড audit করে ৩টা critical
  সমস্যা fix করা হলো (single-agent, browser-test ছাড়া):
  (১) create-product.service.ts প্রতিটা product create-এ নীরবে একটা "legacy default
  variant" বানাত (দাম/SKU দিলেই), এমনকি hasVariants=false product-এও — ফলে প্রতিটা
  plain product details/export/analytics-এ ১টা phantom variant দেখাত। ব্লকটা সরানো
  হলো; unused variantRepository inject/import ও পরিষ্কার। Non-variant product-এর
  দাম/SKU/stock product row-এই থাকে (basePrice + inventory_stocks), variant শুধু
  Variants tab থেকে explicit generate করলে তৈরি হয়।
  (২) frontend useProductForm.ts মূল submit payload-এ `hasVariants` পাঠাত না — শুধু
  variant generate করলে (ensureProductSaved) সেভ হতো। এখন payload + create/update
  DTO + CreateProductRequest টাইপে `hasVariants` যোগ, create/update service entity-তে
  বসায়।
  (৩) দাম ছাড়াই ACTIVE product publish হয়ে storefront-এ ৳0 দেখাত। Guard যোগ:
  frontend (useProductForm) + backend create-product ও update-product service —
  publish (status→ACTIVE) করার সময় non-variant product-এ basePrice > 0 বাধ্যতামূলক;
  variant product-এ অন্তত একটা enabled variant-এর price > 0 থাকতে হবে। DRAFT সেভ
  করতে দাম লাগে না। update-এ guard শুধু `dto.status === ACTIVE` হলে চলে (unrelated
  edit আটকায় না)।
  সংশ্লিষ্ট spec rewrite/extend করা হলো। Verify: backend `npm run build` ✅,
  `npx jest src/modules/catalog` ✅ ২১৬/২১৬ পাস, frontend `npx tsc --noEmit` ✅ ০ error।
  (`bulk-adjust-stock.service.spec.ts`-এর ৪টা fail preexisting, এই কাজের সাথে
  সম্পর্কহীন। backend `npm run lint` চলল না — eslint node_modules-এ ইনস্টল নেই,
  environment issue।)
- 2026-09-03 — Product sub-area, দ্বিতীয় ব্যাচ: ৫টা "মাঝারি" সমস্যা fix (single-agent):
  (৪) taxRate অসামঞ্জস্য — frontend form default 15 → 0 (backend entity/DTO default 0-এর
  সাথে মিল; prefill fallback-ও 0)। User সিদ্ধান্ত: form default 0।
  (৫) compareAtPrice < basePrice চেক ছিল না — frontend (useProductForm submit guard +
  PricingTab-এ inline amber warning) ও backend (create-product ও update-product
  service) দুই জায়গায় guard: compareAtPrice > 0 হলে সেটা basePrice-এর চেয়ে বেশি হতে
  হবে, নাহলে BadRequestException। update-এ merged value দিয়ে চেক (যেকোনো একটা ফিল্ড
  বদলালেও ধরা পড়ে)।
  (৬) ProductVariantMatrix.tsx-এর ৩টা native confirm() (attribute delete, single
  variant delete, bulk variant delete) shared ConfirmDialog-এ বদলানো হলো — একটা
  unified `pendingConfirm` discriminated-union state। ProductListTable.tsx-এর হাতে-লেখা
  ~৭০ লাইনের delete modal-ও shared ConfirmDialog দিয়ে replace। unused import cleanup
  (AlertTriangle, X ProductListTable থেকে; AlertTriangle ProductVariantMatrix থেকে)।
  নতুন package লাগেনি।
  (৭) Product detail পেজের "Conversion Rate 2.45% (Demo)" হার্ডকোড সংখ্যা সরিয়ে "—" +
  "Not tracked yet" badge (User চেয়েছে রো থাকুক); ব্যাখ্যা টেক্সটও আপডেট। storefront
  view tracking এলে আসল হিসাব বসবে।
  (৮) Bulk variant delete লুপে একটা-একটা DELETE করত (partial-failure ঝুঁকি) — নতুন
  transactional endpoint `POST /catalog/products/:id/variants/bulk-delete`
  (`bulk-delete-variants.service.ts` + `bulk-delete-variants.dto.ts`, module/controller
  wired, `:variantId` route-এর আগে registered)। variant stock rows explicit clear,
  সব variant গেলে hasVariants=false। frontend `useBulkDeleteVariantsMutation` +
  ProductVariantMatrix এক কল। নতুন spec `bulk-delete-variants.service.spec.ts` (৫ কেস)।
  Verify: backend `npm run build` ✅, `npx jest src/modules/catalog` ✅ ২২৪/২২৪ পাস
  (২৭ suites), frontend `npx tsc --noEmit` ✅ ০ error।
- 2026-09-04 — Product sub-area, ছোট/পলিশ ব্যাচ:
  • `MoreOptionsTab.tsx` মুছে ফেলা হলো। শুরুতে "wire করব" (B) ঠিক হয়েছিল, কিন্তু কোড
    দেখে ধরা পড়ল custom-attribute/spec feature-টা ইতিমধ্যেই `OrganizationTab.tsx`-এ
    wire করা আছে ("Product Specifications & Custom Fields" কার্ড — একই preset, একই
    `DynamicAttributeField`, একই create+assign modal), আর `MoreOptionsTab` সেটার
    পুরনো ডুপ্লিকেট যা কোথাও render হয় না। তাই আসল কাজ হয়ে দাঁড়াল A (delete)।
    `useProductForm` cleanup লাগেনি — attribute state/handlers OrganizationTab
    সক্রিয়ভাবে ব্যবহার করে। `DynamicAttributeField` রাখা হলো (OrganizationTab ব্যবহার
    করে)। tsc ✅ ০ error।
  • Product detail-এর read-only "Variants" ট্যাব → পুরো `ProductVariantMatrix`
    কম্পোনেন্ট বসানো হলো (edit form-এ যেটা আছে, একই শেয়ারড কম্পোনেন্ট — ডুপ্লিকেট নয়)।
    এখন detail পেজ থেকেই variant দাম/SKU inline edit, enable/disable, single+bulk
    delete, bulk price apply, নতুন variant generate করা যায়। `[id]/page.tsx`-এ
    `useUpdateProductMutation` যোগ — `onHasVariantsChange` prop `updateProduct({id,
    hasVariants})` কল করে persist করে; `onEnsureSaved` শুধু `product.id` রিটার্ন করে
    (detail পেজে প্রোডাক্ট আগেই সেভড)। পুরনো ৩-কলাম read-only টেবিল সরানো হলো।
    tsc ✅ ০ error।
  • **Future polish (এখনো বাকি):** `products/[id]/edit/page.tsx` শুধু
    `/products/create?edit=<id>`-এ redirect করে — merchant-এর কাছে URL অদ্ভুত
    ("create" লেখা অথচ edit)। ঠিক করতে হলে useProductForm + ProductFormShell-কে
    `[id]/edit` রুটে সরাতে হবে (মাঝারি রিফ্যাক্টর) — pipeline-এর মূল কাজের পরে করা যাবে।
- 2026-09-04 — **Bug: "Request Entity Too Large" on category create with image.**
  Root cause: `CreateCategoryView.tsx` (ও `EditCategoryView.tsx`) হাতে-লেখা
  `FileReader.readAsDataURL` দিয়ে ছবিকে base64 বানিয়ে সেটা `createCategory` JSON
  body-তে পাঠাত। ৫MB ছবি base64-এ ~৬.৭MB → Express-এর ডিফল্ট 100KB body limit পার →
  413। (User: JSON limit বাড়ানো হবে না — আসল fix করা হলো।)
  Fix (পথ ১ — reusable, tenant-isolation অক্ষুণ্ণ):
  • নতুন আলাদা slice `frontend/src/features/upload/api/uploadApi.ts` — `uploadFile`
    mutation, multipart FormData পাঠায়, `{ url }` রিটার্ন। `fileableType` অনুযায়ী
    সঠিক tenant-scoped endpoint-এ রুট করে (`CATEGORY` →
    `/catalog/categories/media/upload`, `PRODUCT` → `/catalog/media/upload`,
    `GENERAL` → `/files/upload-single`)। FileModule সরাসরি ব্যবহার করা হয়নি কারণ
    তার guard JWT-তে `tenantId` চায় যা login payload-এ নেই।
  • নতুন reusable কম্পোনেন্ট `frontend/src/components/ui/FileUpload.tsx` — drag-drop
    + click + preview + progress + replace/remove + size/type validation, `uploadApi`
    ব্যবহার করে। Props: value/onChange(url)/fileableType/accept/maxSizeMB/previewShape।
  • store-এ `uploadApi` reducer + middleware registered।
  • `CreateCategoryView.tsx` + `EditCategoryView.tsx` — base64 লজিক (`imagePreview`
    state, `handleImageFileSelect`, hand-rolled dropzone) সরিয়ে `<FileUpload
    fileableType="CATEGORY" />` বসানো। এখন payload-এ শুধু ছোট URL স্ট্রিং যায় → 413
    শেষ। unused import (`UploadCloud`, `X`) cleanup।
  • `CategoryImageUpload.tsx` (আগে থেকেই কোথাও unused, base64 নয় — সঠিক ছিল) — এই
    কাজের অংশ নয় বলে রাখা হলো; পরে `FileUpload`-এ একত্র করা যায়।
  Verify: frontend `npx tsc --noEmit` ✅ ০ error। backend অপরিবর্তিত।
- 2026-09-04 — FileUpload কম্পোনেন্টের "attached" UI iterate করা হলো: raw storage URL
  ও "File attached"/filename টেক্সট সরানো — এখন শুধু square image preview (w-40 h-40,
  object-cover) + Replace/Remove বাটন (image-এর নিচে, flex-1)। কার্ড `inline-flex`
  content-hug (full-width টানত, ফাঁকা container দেখাত)। banner shape আলাদা branch।
  Replace/Remove জোড়া `ReplaceRemoveButtons` helper-এ। `PreviewShape` `'square' |
  'banner'`-এ সংকুচিত, dead `PREVIEW_CLASSES` map সরানো।
- 2026-09-04 — **Bug: category list table-এ আপলোড করা image/সিলেক্ট করা icon
  দেখাত না।** Root cause: `CategoryBrowser.tsx` নামের পাশে সবসময় হার্ডকোড
  `<Folder />` দেখাত — `cat.image`/`cat.icon` কিছুই চেক করত না (data দুটোই আসে:
  `list-categories.service.ts` line 141-142, `CategoryListItem` টাইপে দুটো ফিল্ড)।
  একই কারণে "অন্য icon সিলেক্ট করলেও folder দেখায়" — icon string কখনো render
  হতো না। এছাড়া `CategoryDetailsView.getCategoryIconComponent` merchant-এর
  `category.icon` উপেক্ষা করে নাম/slug keyword থেকে icon আন্দাজ করত।
  Fix:
  • নতুন shared util `frontend/src/features/catalog/utils/categoryIcons.ts` —
    `CATEGORY_ICON_OPTIONS` (picker) + `getCategoryIcon(id)` (id → lucide component,
    fallback Folder)। আগে এই array `CreateCategoryView` ও `EditCategoryView`-এ
    ডুপ্লিকেট ছিল, কোথাও render হতো না।
  • `CategoryBrowser.tsx` — নামের পাশের thumbnail: `cat.image` থাকলে `<img
    object-cover>`, নাহলে `getCategoryIcon(cat.icon)`, নাহলে Folder। unused
    `Folder` import সরানো।
  • `CreateCategoryView.tsx` + `EditCategoryView.tsx` — ডুপ্লিকেট `CATEGORY_ICONS`
    array সরিয়ে shared `CATEGORY_ICON_OPTIONS`; ১১টা unused lucide import cleanup
    (sidebar-এর `Folder` রাখা হলো)।
  • `CategoryDetailsView.tsx` — `getCategoryIconComponent`-এ ঐচ্ছিক `iconId` param;
    merchant-choice আগে (`getCategoryIcon`), নাহলে পুরনো keyword-guess fallback।
    main + দুই sub-call-এ `category.icon` / `sub.icon` পাস। unused `Folder` সরানো।
  Verify: frontend `npx tsc --noEmit` ✅ ০ error।
