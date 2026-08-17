# 05_SYSTEM_ARCHITECTURE.md - System Architecture

# BitCommerce System Architecture Overview

**Version:** 0.1.0  
**Status:** Draft  

---

## 1. Architectural Pattern: Modular Monolith

BitCommerce uses a **Modular Monolith** pattern. All modules live within a unified codebase but maintain strict boundary enforcement.

```
+-------------------------------------------------------------------+
|                        Next.js Applications                       |
|   [ Storefront App ]   [ Admin Portal ]   [ System SuperAdmin ]   |
+-------------------------------------------------------------------+
                                 | HTTP / REST / WebSockets
                                 v
+-------------------------------------------------------------------+
|                           NestJS API                              |
| +---------------+ +---------------+ +---------------+ +------------+ |
| | Auth Module   | | User Module   | | Tenant Module | | Catalog... | |
| +---------------+ +---------------+ +---------------+ +------------+ |
| | Sales Module  | | Payment Module| | Shipping Module            | |
| +---------------+ +---------------+ +----------------------------+ |
| (Infrastructure: src/common, src/config, src/database/migrations) |
+-------------------------------------------------------------------+
            |                     |                   |
            v                     v                   v
     [ PostgreSQL ]           [ Redis ]           [ BullMQ ]
    (Primary Storage)      (Caching/Sessions)  (Async Queue Workers)
```

---

## 2. Component Diagram & Tech Stack Breakdown

### Frontend Tier
* **Storefront**: Next.js App Router, React 19, Tailwind CSS, shadcn/ui.
* **Admin Dashboard**: Next.js App Router, Redux Toolkit (RTK) & RTK Query, React Hook Form, Zod.

### Backend Tier
* **Framework**: NestJS (Node.js/TypeScript).
* **Architecture Style**: Domain-Driven Design (DDD), CQRS where necessary for high-traffic write actions.
* **Database Access**: TypeORM with PostgreSQL.
* **Queueing & Async Tasks**: BullMQ powered by Redis (handling email alerts, SMS, courier API synchronization, webhook dispatching).

---

## 3. Multi-Tenancy Strategy

BitCommerce implements **Discriminator / Row-Level Multi-Tenancy** backed by PostgreSQL security policies:

* Every tenant table includes a `tenant_id` foreign key.
* Database queries in NestJS repositories automatically inject `tenant_id` context via scoped execution contexts or TypeORM middleware.
* Ensures cost-effective scaling for thousands of small stores while maintaining strict data isolation.

---

## 4. Asynchronous Tenant Context & Module Intercommunication

### 4.1 Async Worker Context Propagation (BullMQ)
* Every job queued in BullMQ must explicitly include `tenantId` in its payload metadata:
  ```json
  {
    "name": "ORDER_CONFIRMATION_SMS",
    "data": {
      "tenantId": "uuid-tenant-id",
      "orderId": "uuid-order-id",
      "recipientPhone": "+8801700000000"
    }
  }
  ```
* Queue processors extract `tenantId` upon job execution to initialize the request context for database operations and audit logging.

### 4.2 Inter-Module Event Architecture
* Direct database queries across module boundaries are strictly forbidden.
* Modules communicate asynchronously via NestJS `EventEmitter2` for internal events (e.g. `OrderCreatedEvent`, `PaymentCompletedEvent`) or BullMQ queues for background processing.

