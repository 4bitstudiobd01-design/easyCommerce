# BitCommerce Workspace Agent Rules & Guidelines

This directory contains the core operating instructions and architectural constraints for AI software engineering tasks in BitCommerce.

---

## Core Rule Files

- 🛠️ [**00_SYSTEM.md**](./00_SYSTEM.md): Global rules, AI persona, operating philosophy, decision rules, and Single Source of Truth directive.
- 📋 [**01_DEVELOPMENT.md**](./01_DEVELOPMENT.md): 9-step development workflow, coding principles (SOLID, Single Responsibility Services, Clean Architecture), task sizing, and Definition of Done (DoD).
- 🏛️ [**02_ARCHITECTURE.md**](./02_ARCHITECTURE.md): Modular Monolith rules, Feature-based frontend (`frontend/src/features`), Module-based backend (`backend/src/modules`), Vertical Slice co-development, Decoupled Inventory Domain, and Forbidden Practices.
- 📝 [**03_PROMPTS.md**](./03_PROMPTS.md): Reusable prompt templates for feature development, bug fixing, code reviews, and continuing previous work.
- ✅ [**04_CHECKLIST.md**](./04_CHECKLIST.md): Final production-readiness verification checklist.

---

## Fundamental Mandates

1. **Documentation First**: Always reference and strictly adhere to [docs/00_PROJECT_CONTEXT.md](../docs/00_PROJECT_CONTEXT.md). Documentation is the single source of truth.
2. **Frontend Architecture**: Feature-based folder structure (`frontend/src/features/<feature-name>/{components, hooks, api, slices}`) using Redux Toolkit & RTK Query.
3. **Backend Architecture**: Module-based DDD folder structure (`backend/src/modules/<module-name>/{domain, application, infrastructure, presentation}`).
4. **Vertical Slice Co-Development**: Whenever a backend module is built, its corresponding frontend feature (Admin & Storefront UI) MUST be implemented side-by-side in the same task.
5. **Single Responsibility Services (SRP)**: Each backend service must perform a single focused task (e.g. `LoginService`, `RegisterMerchantService`). Avoid monolithic "god services".
6. **Decoupled Inventory**: Product does NOT manage stock levels. Stock is managed independently by the `Inventory` domain module.

