# PROJECT_CONTEXT.md

# EasyCommerce

**Version:** 0.1.0

---

# Project Overview

EasyCommerce is a modern, enterprise-grade, multi-tenant eCommerce SaaS platform inspired by platforms like Shopify and Zatiq Easy.

This project is **NOT** intended to be a direct clone of any existing platform. The goal is to build a cleaner, more scalable, and more maintainable solution using modern architecture and engineering best practices.

The product should be capable of serving thousands of merchants while remaining modular and extensible.

---

# Primary Goal

Build the best eCommerce SaaS platform for Bangladesh first, with an architecture that can later support international markets.

---

# Project Philosophy

Every architectural decision should prioritize:

* Scalability
* Maintainability
* Security
* Performance
* Clean Code
* Developer Experience
* Extensibility
* Testability

This project should always prefer long-term architecture over quick fixes.

---

# Development Rules

Whenever implementing a feature:

1. Understand the business requirement first.
2. Design before coding.
3. Keep modules loosely coupled.
4. Follow Domain Driven Design principles where appropriate.
5. Keep business logic inside services/domain layer.
6. Never mix infrastructure code with business logic.
7. Write production-quality code.
8. Consider future scalability.
9. Think from a SaaS perspective, not a single-store perspective.
10. Do not introduce technical debt unnecessarily.
11. Organize frontend code into a **Feature-Based** folder structure (`src/features/<feature-name>`).
12. Organize backend code into a **Module-Based** DDD folder structure (`src/modules/<module-name>`).
13. Follow a **Vertical Slice Co-Development Strategy**: Whenever a backend module is built, implement its corresponding frontend feature (Admin & Storefront) side-by-side in the same development slice.
14. Enforce **Single Responsibility Services (SRP)**: Each service/use-case must have a single responsibility (e.g. `LoginService`, `RegisterMerchantService`). Avoid bloated monolithic services.



---

# Product Vision

Merchants should be able to:

* Create a store
* Manage products
* Manage inventory
* Accept payments
* Manage customers
* Receive orders
* Customize storefront
* Scale their business

without requiring any developer.

---

# Target Market

Primary:

* Bangladesh

Future:

* South Asia
* Middle East
* Global

---

# Architecture

Architecture Style:

Modular Monolith

Future Ready:

Modules should be easily extractable into microservices if needed.

---

# High Level Modules

Identity

* Authentication
* Authorization
* RBAC
* MFA

Tenant

* Organization
* Workspace
* Store
* Subscription

Store

* Store Settings
* Theme
* CMS
* Pages

Catalog

* Products
* Categories
* Brands
* Variants
* Inventory

Sales

* Cart
* Checkout
* Orders
* Coupons

Customer

* Customers
* CRM
* Reviews
* Loyalty

Payment

* Payment Gateway
* Refund
* Webhooks

Shipping

* Courier
* Delivery
* Tracking

Marketing

* Campaigns
* Pixel
* Analytics

Reports

* Dashboard
* Reports
* Statistics

System

* Notifications
* Audit Logs
* Search
* File Management

---

# Suggested Tech Stack

Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Redux Toolkit (RTK) & RTK Query
* React Hook Form
* Zod

Backend

* NestJS
* TypeScript
* TypeORM
* PostgreSQL
* Redis
* BullMQ

Infrastructure

* Docker
* Nginx
* GitHub Actions

Storage

* S3 Compatible Storage

Realtime

* Socket.IO

---

# Repository Structure

* `.agents/` - Workspace rules, AI guidelines & checklists
* `backend/` - NestJS API backend & microservice-ready modules
* `frontend/` - Next.js Storefront & Admin Portal apps (feature-based)
* `docs/` - System, Product, and Architecture documentation
* `README.md` - Repository entry point

* database
* api
* product
* decisions

---

# Documentation First

Before implementation, every major module must have documentation.

Expected documentation includes:

* Vision
* PRD
* User Stories
* Functional Requirements
* Non Functional Requirements
* Architecture
* Database Design
* ERD
* API Specification
* UI Sitemap
* Permission Matrix
* Development Standards
* Testing Strategy

---

# AI Collaboration Rules

This project will be developed collaboratively with AI assistants.

When assisting:

* Do not make unnecessary assumptions.
* Preserve architectural consistency.
* Follow existing conventions.
* Reuse components whenever possible.
* Prefer composition over duplication.
* Explain trade-offs for major decisions.
* Suggest improvements only when they align with the established architecture.

---

# Current Status

Current Phase:

Project Planning

Completed:

* Initial product idea
* High-level feature inventory
* Technology stack selection

Next Milestones:

1. Product Vision
2. Competitor Analysis
3. Complete PRD
4. Feature Inventory
5. Domain Model
6. System Architecture
7. Database Design
8. API Specification
9. UI/UX Sitemap
10. Design System
11. Development Roadmap
12. Module-by-module implementation

---

# Important Notes

This project is intended to become a long-term production SaaS platform.

Quality is more important than speed.

Every module should be designed so it can evolve without requiring major rewrites.

The documentation should always remain the single source of truth.

If there is a conflict between implementation and documentation, the documentation must be reviewed and updated before continuing development.

---

# AI Context

When working on this project, always assume:

* This is an enterprise SaaS.
* The code should be production-ready.
* Security, maintainability, and scalability are mandatory.
* Prefer clean architecture over shortcuts.
* Keep modules independent and reusable.
* Maintain consistent naming, folder structure, and coding standards throughout the repository.

This document should be read before starting any new implementation or architectural discussion.
