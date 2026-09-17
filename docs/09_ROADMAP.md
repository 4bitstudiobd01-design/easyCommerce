# 09_ROADMAP.md - Project Roadmap

# BitCommerce Development Roadmap & Milestones

**Version:** 0.1.0  
**Status:** Active  

---

## 🗺️ Execution Timeline

```
+-------------------------------------------------------------------------------+
| Phase 1: Planning & Specs | Phase 2: Implementation / Sprint 0 | Phase 3: Launch|
| (COMPLETED)               | (CURRENT PHASE)                    | (Q4 2026)      |
+-------------------------------------------------------------------------------+
```

---

## Phase 1: Documentation & Architecture Specifications (COMPLETED)
- [x] Initial project context and requirements definition.
- [x] Complete system documentation setup (`docs/` inventory).
- [x] ✔ Database Design Completed (`06_DATABASE_DESIGN.md` Domain Model).
- [x] ✔ Architecture & Boundaries Completed (`05_SYSTEM_ARCHITECTURE.md`).
- [x] ✔ API Specifications & Envelopes Completed (`07_API_SPECIFICATION.md`).

---

## Phase 2: Core Platform Implementation & Sprint 0 (CURRENT PHASE)
- [ ] Sprint 0: Repository init, Docker, PostgreSQL, Redis, NestJS & Next.js setup, Auth Module scaffold.
- [ ] Identity & Tenant Module (Auth, RBAC, Multi-tenancy isolation).
- [ ] Catalog & Inventory Module (Decoupled stock & product modeling).
- [ ] Cart, Checkout & Orders Pipeline.
- [ ] bKash, Nagad, and COD Payment Module.
- [ ] Courier APIs (Steadfast, Pathao) Integration.
- [x] ✔ Marketing — multi-instance pixels + per-page targeting + browser & server-side
      (Meta CAPI / TikTok Events API / GA4 MP / Google Ads) dispatch + Sales-by-Source
      report with ROAS/CPA and event log. Legacy `stores.*PixelId` columns dropped.
      See `docs/PIXEL_AND_MARKETING_WORKFLOW.md`.


---

## Phase 3: Beta Launch & BD Market Readiness (Q4 2026)
- [ ] Default Merchant Storefront theme release.
- [ ] Admin Portal release.
- [ ] Merchant Beta Testing in Bangladesh.
- [ ] Security Audit & Load Testing (5,000+ RPS benchmark).

---

## Phase 4: Expansion & Ecosystem (2027)
- [ ] Custom App/Plugin ecosystem.
- [ ] Multi-currency & Cross-border shipping.
- [ ] Advanced Marketing Automation & AI recommendations.

---

## Scope Decisions

### Customer Module — Communication History (descoped 2026-08-14)

Customer Communication History (a per-customer log of emails/SMS sent) was listed
under the Customer module's activity chunk but is **not implemented, and is
deliberately out of scope for that module**.

**Rationale:** message dispatch and its delivery state already belong to the `sms` and
`email-marketing` modules, which own the channel, provider status and retry semantics.
Duplicating that log inside `customer` would mean two systems recording overlapping
information with no single source of truth — exactly the pattern the module boundaries
in [`05_SYSTEM_ARCHITECTURE.md`](05_SYSTEM_ARCHITECTURE.md) exist to prevent.

**Where it should live instead:** when a merchant-facing "what have we sent this
customer" view is needed, it should read from the `sms`/`email-marketing` modules
(or the planned CRM module) via their own services, and the Customer detail drawer
should render that as a consuming view rather than owning a `communications` table.

**What exists today:** `customer_activities` records customer-lifecycle events
(status changes, notes, order events). That is not a communication log and is not
intended to become one.
