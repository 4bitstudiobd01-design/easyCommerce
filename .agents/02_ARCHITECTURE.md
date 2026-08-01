# 02_ARCHITECTURE.md - Architecture Constraints & Boundaries

# EasyCommerce Architecture Constraints & Monorepo Standards

---

## 1. High-Level Architectural Style

* **Modular Monolith**: Codebase is structured as a unified monolith divided into strictly bounded modules. Modules must remain loosely coupled and extractable into microservices if needed.
* **Multi-Tenancy Isolation**: Row-level tenant isolation via `tenant_id` context in all tenant-owned entities and queries.

---

## 2. Directory & Monorepo Structure

### 2.1 Frontend Architecture (Feature-Based)
All storefront and admin applications MUST use a **Feature-Based Folder Structure**:
```text
frontend/src/features/
├── auth/           # Components, hooks, RTK Query API slices, types for Auth
├── catalog/        # Product list, filters, details UI & state
├── checkout/       # Single-page checkout & payment UI
└── orders/         # Order tracking & management UI
```
* **State Management**: Redux Toolkit (RTK) & RTK Query.

### 2.2 Backend Architecture (Module-Based / NestJS Standard)
The NestJS backend MUST use a **Module-Based Folder Structure with Single Responsibility Services**:
```text
backend/src/
├── common/             # Shared filters, interceptors, guards, decorators, errors
├── config/             # Environment & database configurations (database.config.ts)
├── database/           # TypeORM Data Source (data-source.ts) & Migrations
└── modules/
    ├── auth/           # AuthController, AuthModule, services/, dto/
    ├── user/           # UserController, UserModule, entities/, services/
    ├── tenant/         # Organizations, Stores, Subscriptions
    ├── catalog/        # Products, Variants, Categories (Product definitions & SEO)
    ├── inventory/      # Stock tracking, Warehouses, Reservations (Decoupled Module)
    └── sales/          # Cart, Orders, Checkout processing
```
* **Single Responsibility Services (SRP)**: Inside each module's `services/` directory, every service file MUST handle exactly one focused task/use-case (e.g., `find-user-by-email.service.ts`, `register-merchant.service.ts`). Monolithic service files are strictly forbidden.

---

## 3. Mandatory Architectural Boundaries

1. **Decoupled Inventory Domain**: The `Catalog` domain (Products/Variants) is explicitly decoupled from stock control. `Product` does NOT manage physical stock counts. `Inventory` tracks stock levels, warehouse locations, and stock reservations independently.
2. **Vertical Slice Co-Development**: Whenever a backend module is built, its corresponding frontend features (Admin UI & Storefront UI) MUST be implemented side-by-side in the same development slice.
3. **No Direct Cross-Module DB Joins**: Modules must NOT perform direct database joins across module boundaries. Cross-module communication occurs via weak ID references (`variant_id`, `customer_id`) or asynchronous domain events (`EventEmitter2` / BullMQ queues).

---

## 4. Forbidden Architectural Practices

* ❌ **Cross-module imports**: Direct entity/repository imports across module boundaries are strictly forbidden.
* ❌ **Circular dependencies**: Module dependency loops between NestJS modules or React features are forbidden.
* ❌ **Business logic inside controllers**: Controllers must only handle DTO validation, HTTP routing, and delegating to single-purpose application services.
* ❌ **Fat services**: Monolithic "god services" handling multiple distinct domain responsibilities are forbidden.
* ❌ **Direct SQL in business layer**: Raw SQL queries bypassing repositories/TypeORM abstractions are forbidden.
* ❌ **Shared mutable state**: Global mutable singletons or shared transient states across requests are forbidden.
* ❌ **Tenant leakage**: Executing queries without explicit tenant context or `tenant_id` filtering is strictly forbidden.

