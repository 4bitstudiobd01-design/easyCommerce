# 08_DEVELOPMENT_GUIDE.md - Development & Contribution Guide

# BitCommerce Developer Setup & Coding Standards

**Version:** 0.1.0  
**Status:** Draft  

---

## 1. Local Environment Setup

### Prerequisites
* Node.js v20+
* pnpm or npm
* Docker Desktop & Docker Compose
* PostgreSQL 16
* Redis

---

## 2. Codebase Architecture & Folder Standards

### 2.1 Frontend Architecture (Feature-Based)
All frontend applications (`storefront`, `admin`) follow a **Feature-Based Folder Structure**:
```text
frontend/
└── src/
    ├── features/
    │   ├── auth/           # Components, hooks, RTK Query API, slices, types for Auth
    │   ├── catalog/        # Product list, filters, details UI & state
    │   ├── checkout/       # Single-page checkout & payment UI
    │   └── orders/         # Order tracking & management UI
    ├── components/ui/      # Shared atomic UI elements (shadcn/ui)
    └── store/              # Root Redux store configuration
```

### 2.2 Backend Architecture (Module-Based & Single Responsibility Services)
The backend NestJS application follows a **Module-Based Structure with Single Responsibility Services**:
```text
backend/
└── src/
    ├── common/             # Shared filters, interceptors, guards, decorators, errors
    ├── config/             # Environment & database configurations (database.config.ts)
    ├── database/           # TypeORM Data Source (data-source.ts) & Migrations
    ├── modules/
    │   ├── auth/           # AuthController, AuthModule, services/, dto/
    │   ├── user/           # UserController, UserModule, entities/, services/
    │   ├── catalog/        # Products, Variants, Categories (Product definitions & SEO)
    │   ├── inventory/      # Stock tracking, Warehouses (Decoupled module)
    │   └── sales/          # Cart, Orders, Checkout logic
    └── main.ts             # Global prefix (/api/v1), Swagger (/swagger), pipes, interceptors
```

### 2.3 Vertical Slice Co-Development Workflow
* **Side-by-Side Implementation**: Whenever a backend module is built, its corresponding frontend features (Admin UI & Storefront UI) MUST be implemented side-by-side in the same development slice.
* **No Isolated Backend Building**: Do NOT build all backend APIs in isolation without building their frontend interfaces. Each completed sprint delivers a functional, end-to-end working feature.

---

## 3. Code Standards & Best Practices

1. **TypeScript First**: Strict mode enabled. Avoid `any`.
2. **Domain Layer Independence**: Keep business logic out of controllers and TypeORM entity listeners.
3. **Single Responsibility Services (SRP)**: Inside each module's `services/` folder, each service/use-case must execute a single, focused responsibility (e.g. `find-user-by-email.service.ts`, `register-merchant.service.ts`, `login.service.ts`). Avoid monolithic "god services" (e.g. do NOT build a single 1,000-line `AuthService` handling login, signup, OTP, MFA, and password resets altogether).
4. **Linting & Formatting**: ESLint & Prettier configured for consistent formatting across monorepo packages.

---

## 4. Database Migration Workflow (TypeORM)

All database schema changes MUST be managed using TypeORM migrations.

### Commands:
- **Generate Migration**:
  ```bash
  npm run migration:generate -- <MigrationName>
  # Example: npm run migration:generate -- CreateUsersAndSessions
  ```
- **Run Migrations**:
  ```bash
  npm run migration:run
  ```
- **Revert Last Migration**:
  ```bash
  npm run migration:revert
  ```
- **Show Migration Status**:
  ```bash
  npm run migration:show
  ```



