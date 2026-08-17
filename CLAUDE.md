# BitCommerce

Enterprise-grade, multi-tenant eCommerce SaaS platform (Bangladesh first, global ready) — think Shopify/Zatiq Easy, but not a clone. Modular Monolith with DDD principles, built to serve thousands of merchants.

Full rules live in [`.agents/`](.agents/AGENTS.md) and [`docs/`](docs/README.md). **Documentation is the single source of truth** — if code and docs conflict, docs win; flag the conflict rather than silently following the code.

## Tech stack (as actually installed — see package.json before assuming a doc-listed dependency exists)

- **Backend** (`backend/`): NestJS 10, TypeORM 0.3, PostgreSQL, Redis (ioredis), class-validator/class-transformer, Passport JWT, Swagger. Package manager: `npm`.
- **Frontend** (`frontend/`): Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Redux Toolkit + React Redux, Recharts, lucide-react, sonner/react-hot-toast. Package manager: `npm`.
- shadcn/ui, RTK Query, Zod, and React Hook Form appear in the docs' "suggested stack" but are **not yet in package.json** — check before assuming they're available; install deliberately if a task needs them, don't silently add dependencies (see rule below).
- There is no root-level `package.json` — run commands inside `backend/` or `frontend/` separately.

## Commands

Backend (run from `backend/`):
- `npm run start:dev` — dev server w/ watch (port from `PORT` env, default 5001, prefix `/api/v1`, Swagger at `/swagger`)
- `npm run build` / `npm run lint` / `npm run test`
- `npm run migration:generate -- <Name>` / `migration:run` / `migration:revert` / `migration:show` (TypeORM, via `src/database/data-source.ts`)

Frontend (run from `frontend/`):
- `npm run dev` / `npm run build` / `npm run start` / `npm run lint`
- No test script is currently configured.

## Architecture — mandatory boundaries

**Backend** is module-based DDD under `backend/src/modules/<module>/` (auth, user, tenant, catalog, inventory, order, payment, logistics, coupon, sms, email-marketing, seo, staff, analytics, admin). Shared code lives in `backend/src/common/` (guards, interceptors, filters, decorators, errors) and `backend/src/config/`.

**Frontend** is feature-based under `frontend/src/features/<feature>/{api, components, slices, ...}`, mirroring the backend modules. Shared UI atoms go in `frontend/src/components/ui/`; Redux store setup in `frontend/src/store/`.

**Vertical Slice Co-Development**: every backend module ships with its corresponding frontend feature (Admin UI and/or Storefront UI) in the same slice — never build backend-only and leave the UI for later.

**Single Responsibility Services**: one service file = one use case (`login.service.ts`, `register-merchant.service.ts`, `find-user-by-email.service.ts`). No monolithic "god services" handling multiple responsibilities.

**Decoupled Inventory**: `Catalog` (products/variants) never manages stock counts. `Inventory` owns stock levels, warehouses, and reservations independently, referenced only by ID.

Forbidden:
- Cross-module DB joins or direct entity/repository imports across module boundaries — use ID references or domain events (`EventEmitter2`/BullMQ) instead.
- Circular module dependencies (NestJS modules or React features).
- Business logic in controllers — controllers only validate/route/delegate.
- Raw SQL bypassing TypeORM repositories in the business layer.
- Queries missing explicit `tenant_id` filtering (row-level multi-tenant isolation is mandatory everywhere).

## Working conventions

- Read relevant files in `docs/` and `.agents/` before modifying an unfamiliar module — don't invent architecture where docs are silent; surface an open question instead.
- Prefer existing helpers/abstractions/components over new ones. Match established naming and folder conventions exactly.
- No new dependencies without clear justification — this repo is deliberately lean (see the shadcn/RTK Query/Zod gap above).
- TypeScript strict mode; avoid `any`.
- Validate all input at the boundary: DTOs + class-validator (backend), equivalent validation before submit (frontend).
- Small, incremental changes over large refactors; never rewrite existing code unless explicitly asked.
- No placeholder/half-finished code, no stray `console.log` in production paths, no leftover TODOs.

## Before calling a task done

- Backend builds (`npm run build`), lints (`npm run lint`), and tests pass (`npm run test`) in `backend/`.
- Frontend builds and lints clean in `frontend/`.
- No TypeScript errors, no unused imports.
- Tenant isolation and authorization (RBAC guards) verified for any new/changed endpoint.
- API responses conform to the envelope/conventions in [`docs/07_API_SPECIFICATION.md`](docs/07_API_SPECIFICATION.md).
