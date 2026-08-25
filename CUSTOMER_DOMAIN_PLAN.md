# Customer domain: storefront auth, source tracking, courier history

**Status: Phases A, B, C implemented (backend + frontend build clean, migration not yet run against a live DB — see step 2 of Verification).**

## Context

The merchant asked for six things scrawled as quick notes: storefront customer login/registration with origin tracking, a "source" column on the customer table, last order date, a date filter, top-spender visibility, and courier history on a customer's order record. Research against the actual codebase showed three of these already exist and work (last order date, the date filter, and sortable total-spent — which covers "see top spenders" once you sort the existing column). The other three are real gaps: there's no storefront-facing login at all today (checkout is 100% guest, identified only by a `sessionStorage` id), the customer table never renders the `source` field the backend already tracks, and a customer's order history has no visibility into which courier shipped it or its delivery status.

The user confirmed: build all three gaps, including full storefront auth (email+password, not phone/OTP), and confirmed "customer origin" means the same marketing-channel/UTM concept `Order` already tracks (`channel`, `utmSource`, `utmMedium`, `referrerHost`), captured at registration time via the storefront's existing `attribution.ts` utility. The two already-built items (date filter, top spender) are confirmed correct as-is — no changes needed there.

## Already done — no work needed

- **Last order date**: `list-customers.service.ts` computes it via `MAX(orders.createdAt)`; `CustomerTable.tsx` already has a "Last Order" column.
- **Date filter**: `dateRangeParam` in `frontend/src/app/dashboard/customers/page.tsx` filters on `createdAt` (signup date) — user confirmed this is the correct semantic, keep as-is.
- **Top spender**: `CustomerTable.tsx`'s "Total Spent" column header is already clickable and wired to `onSortChange('totalSpent')`; `list-customers.service.ts` already supports `sortBy=totalSpent` via a join on aggregated order stats. Sorting the main list by this column *is* "see top spenders on the main list" — user confirmed this satisfies the ask. (The separate Analytics tab's "Top 10 by Spend" table also still exists independently.)

## Phase A — Storefront customer login/registration

### Data model
Extend `CustomerEntity` (`backend/src/modules/customer/entities/customer.entity.ts`) directly rather than a separate auth entity — matches how `UserEntity` carries `passwordHash` inline, and avoids a join on every existing customer read path. New columns:

```ts
@Column({ type: 'varchar', length: 255, nullable: true, select: false })
passwordHash?: string;

@Column({ type: 'boolean', default: false })
hasAccount: boolean; // true once passwordHash is set

@Column({ type: 'varchar', length: 50, nullable: true }) registrationChannel?: string;
@Column({ type: 'varchar', length: 255, nullable: true }) registrationUtmSource?: string;
@Column({ type: 'varchar', length: 255, nullable: true }) registrationUtmMedium?: string;
@Column({ type: 'varchar', length: 255, nullable: true }) registrationUtmCampaign?: string;
@Column({ type: 'varchar', length: 255, nullable: true }) registrationReferrerHost?: string;
```

`select: false` on `passwordHash` keeps it out of the many existing `customerRepository.find(...)` call sites; the login service opts in explicitly via `.addSelect(...)`.

Add a **partial unique index**: `@Index(['tenantId', 'email'], { unique: true, where: '"passwordHash" IS NOT NULL' })` — blocks two registered accounts colliding on (tenantId, email) while leaving pre-existing guest rows (no password) unconstrained.

**New entity** `backend/src/modules/customer/entities/customer-session.entity.ts` — `CustomerSessionEntity`, structurally like `backend/src/modules/user/entities/session.entity.ts` but FK'd to `CustomerEntity` (`onDelete: CASCADE`). Skip the deprecated `refreshToken` column the merchant version still carries.

### Migration
New file `backend/src/database/migrations/<timestamp>-AddCustomerAuthFields.ts`, following the exact style of `1787425561643-AddPasswordResetAndSessionFields.ts`: adds the 7 new `customers` columns, the partial unique index, creates `customer_sessions` table. Full symmetric `down()`.

### DTOs
New folder `backend/src/modules/customer/auth/dto/`:
- `customer-register.dto.ts`: `firstName`, `lastName`, `email` (`@IsEmail`), `password` (`@MinLength(6) @MaxLength(72)`), `phone` (BD regex, required), plus optional `channel`/`utmSource`/`utmMedium`/`utmCampaign`/`referrerHost`.
- `customer-login.dto.ts`: `email`, `password`, optional `rememberMe`.
- `customer-refresh-token.dto.ts`: reuse `backend/src/modules/auth/dto/refresh-token.dto.ts` directly (identical shape).
- `customer-auth-response.dto.ts`: mirrors `auth-response.dto.ts`, customer-shaped `user`.

### Guard / JWT discriminator
Reuse `JwtAuthGuard` unchanged (already payload-agnostic — verifies signature, attaches `request.user`). Add one new thin guard:

`backend/src/common/guards/customer-jwt-type.guard.ts`:
```ts
@Injectable()
export class CustomerJwtTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.type !== 'customer') {
      throw new UnauthorizedException('This endpoint requires a customer session.');
    }
    return true;
  }
}
```
Customer routes: `@UseGuards(JwtAuthGuard, CustomerJwtTypeGuard)`. New customer JWT payload: `{ sub: customer.id, email, type: 'customer', tenantId, storeId, sid: session.id }`. Merchant payloads have no `type` field today, so cross-use fails closed automatically in both directions (merchant JWT on customer routes: no `type`; customer JWT on merchant `RolesGuard`-protected routes: no `role`).

### Services
New subfolder `backend/src/modules/customer/auth/services/` (separate from the flat merchant-CRUD `customer/services/` folder — mirrors how `auth/` is already split from `user/`):
- `register-customer.service.ts`
- `customer-login.service.ts`
- `customer-refresh-token.service.ts`
- `customer-auth.controller.ts`
- `customer-auth.module.ts` (wired directly into `AppModule`, not nested in `CustomerModule`, so the merchant-only module stays untouched)

**`register-customer.service.ts` — guest-row upgrade logic** (do not call the existing `FindOrCreateCustomerService` as-is — it has no password/upgrade concept):
1. Normalize phone (reuse `backend/src/common/utils/normalize-phone.util.ts`), lowercase email.
2. Look up existing row by `(tenantId, phone)` — phone is always populated on guest rows, email is not.
3. **No existing row** → create new `CustomerEntity`, `hasAccount: true`, `passwordHash` (bcrypt cost 10, matching `register-merchant.service.ts`), `source: ONLINE_STORE`, `registration*` columns from `normalizeChannel(...)`.
4. **Existing row, `hasAccount === false`** → upgrade in place: set `passwordHash`, `hasAccount: true`, backfill `email` if missing, backfill `registration*` columns *only if not already set* (preserves true first-touch attribution from the original guest order), only overwrite `firstName`/`lastName` if they're still `FindOrCreateCustomerService`'s placeholder values.
5. **Existing row, `hasAccount === true`** → throw `ConflictException`.
6. Concurrency: same Postgres `23505` catch-and-reread pattern `FindOrCreateCustomerService` already uses.
7. Session + JWT issuance via a small shared private helper (used by both register and login).

**`customer-login.service.ts`**: mirrors `LoginService` — query `(tenantId, email)` with `.addSelect('customer.passwordHash')`, `bcrypt.compare`, reject `CustomerStatusEnum.BLOCKED`, create session, sign `type: 'customer'` payload, 15m access / 7d refresh (30d rememberMe).

**`customer-refresh-token.service.ts`**: mirrors `RefreshTokenService` — verify, require `sid`, look up session, check `isValid`+`expiresAt`, re-fetch customer, reject `BLOCKED`, slide session 7d, reissue with same `sid`.

### Origin/UTM capture — reuse, no new plumbing
`normalizeChannel()` already lives in `backend/src/common/utils/normalize-channel.util.ts` (shared, not order-module-private — confirmed by reading it). `register-customer.service.ts` imports it directly, exactly as `create-order.service.ts` does:
```ts
registrationChannel: normalizeChannel({ requestedChannel: dto.channel, utmSource: dto.utmSource, utmMedium: dto.utmMedium, referrerHost: dto.referrerHost }),
```

### Controller routes
`backend/src/modules/customer/auth/customer-auth.controller.ts`, `@Controller('storefront/:storeSlug/auth')`:
- `POST /storefront/:storeSlug/auth/register`
- `POST /storefront/:storeSlug/auth/login`
- `POST /storefront/:storeSlug/auth/refresh` (`@HttpCode(200)`)

Every handler resolves `storeSlug` → `tenantId`/`storeId` via the existing `FindStoreBySlugService` (`backend/src/modules/tenant/services/find-store-by-slug.service.ts`) — client never sends a raw `tenantId`. No guards on these three routes (unauthenticated by design, matching `AuthController`'s equivalents).

### Frontend
**New API slice** `frontend/src/features/storefront/api/customerAuthApi.ts`, mirroring `frontend/src/features/auth/api/authApi.ts`'s RTK Query pattern, `storeSlug` interpolated per call. Base URL derived from `NEXT_PUBLIC_API_URL` the same way `attribution.ts`'s `TRACKING_ENDPOINT` already strips its suffix.

**New slice** `frontend/src/features/storefront/slices/customerAuthSlice.ts`, mirroring `authSlice.ts` but with **separate storage keys** (so a merchant testing their own storefront doesn't collide sessions):
- localStorage: `ec_customer_token`, `ec_customer_refresh_token`, `ec_customer_user`
- cookie: `ec_customer_token` (7-day, `SameSite=Lax`)

(`ec_` prefix matches the existing `ec_session_id`/`ec_attribution` storefront convention.)

**New pages**: `frontend/src/app/store/[slug]/login/page.tsx`, `frontend/src/app/store/[slug]/register/page.tsx` — client components, plain `useState` + manual validation (mirrors `LoginForm.tsx`, not React Hook Form). On submit, call `resolveAttributionFromEnvironment()`/`readStoredAttribution()` from `frontend/src/features/storefront/utils/attribution.ts` (used unchanged) to populate the register request's channel/UTM fields.

### Module wiring
- Add `CustomerAuthModule` to `backend/src/app.module.ts`.
- `TypeOrmModule.forFeature([CustomerEntity, CustomerSessionEntity])` + its own `JwtModule.registerAsync(...)` copying the exact config block from `customer.module.ts` (same `JWT_SECRET`/`JWT_EXPIRES_IN`).
- Import `TenantModule` for `FindStoreBySlugService`.

## Phase B — Customer table "Source" column

File: `frontend/src/features/customer/components/CustomerTable.tsx`. Pure JSX addition — the `Customer` type already has `source: CustomerSourceType` (`frontend/src/features/customer/api/customerApi.ts`) and the backend already returns it.

**Header** — new `<th>` right after Phone:
```tsx
<th className="hidden md:table-cell py-3.5 px-4 min-w-[110px]">Source</th>
```

**Body cell** — matching `<td>` in the same position:
```tsx
<td className="hidden md:table-cell py-3.5 px-4 whitespace-nowrap">
  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-lg text-[10px] uppercase tracking-wide">
    {SOURCE_LABELS[customer.source] ?? customer.source}
  </span>
</td>
```
Reuse the exact label strings already in `CustomerFilterBar.tsx`'s filter dropdown:
```ts
const SOURCE_LABELS: Record<string, string> = {
  ONLINE_STORE: 'Online Store', MANUAL: 'Manual', POS: 'POS', IMPORT: 'Import',
};
```
Flat neutral (slate) badge — no existing per-source color convention to match.

No backend changes needed — `source` is already selected and returned.

## Phase C — Courier history in customer details

### Backend
`backend/src/modules/customer/services/list-customer-orders.service.ts`: extend `CustomerOrderListItem` interface with `courierProvider?`, `consignmentStatus?`, `trackingCode?`.

After the existing `order_items` batched-count raw query, add a second raw query joining `consignments` (same `ANY($1)` batching idiom, no new module import needed — raw SQL bypasses repository registration, matching how the `order_items` query already works without `OrderItemEntity` registered in `CustomerModule`):
```sql
SELECT DISTINCT ON ("orderId") "orderId", "courierProvider", "status", "trackingCode"
FROM consignments WHERE "orderId" = ANY($1)
ORDER BY "orderId", "createdAt" DESC
```
`DISTINCT ON` + `ORDER BY createdAt DESC` picks the most recent consignment per order (an order can have more than one, e.g. return/reshipment). Map onto the existing `items.map(...)` block.

### Frontend
`frontend/src/features/customer/api/customerApi.ts`: extend `CustomerOrderItem` with the same three optional fields.

`frontend/src/features/customer/components/CustomerDetailDrawer.tsx`: in the Orders tab's per-order card, add a courier line under the existing payment badge row:
```tsx
{order.courierProvider && (
  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
    <Truck className="w-3.5 h-3.5 text-slate-400" />
    <span className="font-semibold text-slate-700">{order.courierProvider}</span>
    {order.trackingCode && <span className="text-slate-400">• {order.trackingCode}</span>}
    {order.consignmentStatus && (
      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">
        {order.consignmentStatus.replace(/_/g, ' ')}
      </span>
    )}
  </div>
)}
```
(`Truck` already imported from `lucide-react` in this file.) No new tab — a per-order courier line in the existing Orders tab is enough; renders nothing for orders with no consignment yet.

## Build order
1. Phase A migration + entity changes — foundational, nothing else in Phase A compiles without it.
2. Phase A backend services/controller/module.
3. Phase A frontend (can start in parallel once DTO shapes are settled).
4. Phase B (Source column) — fully independent, lowest risk, smallest change.
5. Phase C (courier history) — independent of Phase A, depends only on existing `ConsignmentEntity`.

## Verification
1. Backend: `cd backend && npm run build && npm run lint && npm run test` — confirm no regressions, especially in existing customer/auth specs.
2. Migration: `npm run migration:run` against a local DB, then `npm run migration:revert` to confirm the `down()` is symmetric, then re-run.
3. Manual auth flow: register a new customer via the new storefront page (fresh phone/email) → confirm JWT issued, cookie/localStorage set under the `ec_customer_*` keys, `hasAccount: true` and `registrationChannel` populated in the DB row. Log out, log back in. Attempt refresh with an expired access token.
4. Guest-upgrade flow: place a guest checkout order (creates a guest `CustomerEntity` row), then register with the same phone from the storefront register page — confirm it upgrades the same row (same `id`) rather than creating a duplicate, and that `registrationChannel` reflects the *original* guest order's attribution, not the registration page's.
5. Cross-guard check: confirm a merchant JWT (from `/dashboard` login) gets a 401 when sent to a `storefront/:slug/auth`-guarded customer route, and vice versa a customer JWT gets rejected by a `RolesGuard`-protected merchant route.
6. Frontend: `cd frontend && npx tsc --noEmit -p tsconfig.json` clean, then visually check `/dashboard/customers` for the new Source column, and open a customer with a shipped order in `CustomerDetailDrawer` to confirm the courier line renders.
