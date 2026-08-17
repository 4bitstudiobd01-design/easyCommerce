# BitCommerce

Enterprise-grade Multi-Tenant eCommerce SaaS Platform (Bangladesh First, Global Ready).

---

## 📁 Repository Structure

```text
BitCommerce/
├── .agents/                    # Agent instructions & context rules
├── backend/                    # NestJS API Backend & Microservice ready modules
├── frontend/                   # Next.js Storefront & Admin Portal apps
├── docs/                       # Official System & Product Documentation
│   ├── 00_PROJECT_CONTEXT.md   # Core project overview & guidelines
│   ├── 01_VISION.md            # Product vision & business pillars
│   ├── 02_COMPETITOR_ANALYSIS.md# Market benchmarking & competitive moat
│   ├── 03_FEATURE_INVENTORY.md # Itemized feature map for all 11 modules
│   ├── 04_PRODUCT_REQUIREMENTS.md # Functional & non-functional requirements (PRD)
│   ├── 05_SYSTEM_ARCHITECTURE.md # Modular Monolith & multi-tenancy design
│   ├── 06_DATABASE_DESIGN.md   # PostgreSQL schema & entity relationships
│   ├── 07_API_SPECIFICATION.md # RESTful endpoint standards & payload schemas
│   ├── 08_DEVELOPMENT_GUIDE.md # Local environment setup & coding rules
│   └── 09_ROADMAP.md           # Milestone roadmap & launch schedule
└── README.md                   # Project entry point
```

---

## 🚀 Overview

BitCommerce is built on a **Modular Monolith** architecture with **Domain-Driven Design (DDD)** principles. It provides merchants with an out-of-the-box solution for creating storefronts, managing products and stock, processing local payments (bKash, Nagad, COD), and shipping orders via integrated courier APIs (Steadfast, Pathao).

### Tech Stack
* **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Redux Toolkit (RTK) & RTK Query
* **Backend**: NestJS, TypeScript, TypeORM, PostgreSQL, Redis, BullMQ
* **Infrastructure**: Docker, Nginx, S3 Compatible Storage

---

## 📚 Documentation

For complete technical and product details, explore the [`docs/`](file:///Users/sumon/Desktop/BitCommerce/docs) folder:
* 📖 [Project Context](file:///Users/sumon/Desktop/BitCommerce/docs/00_PROJECT_CONTEXT.md)
* 🎯 [Product Vision](file:///Users/sumon/Desktop/BitCommerce/docs/01_VISION.md)
* 🏛️ [System Architecture](file:///Users/sumon/Desktop/BitCommerce/docs/05_SYSTEM_ARCHITECTURE.md)
* 🗄️ [Database Design](file:///Users/sumon/Desktop/BitCommerce/docs/06_DATABASE_DESIGN.md)
* 🔌 [API Specification](file:///Users/sumon/Desktop/BitCommerce/docs/07_API_SPECIFICATION.md)
* 🗺️ [Development Roadmap](file:///Users/sumon/Desktop/BitCommerce/docs/09_ROADMAP.md)

---

## 🛠️ Development Setup

Refer to [08_DEVELOPMENT_GUIDE.md](file:///Users/sumon/Desktop/BitCommerce/docs/08_DEVELOPMENT_GUIDE.md) to set up your local development environment.
