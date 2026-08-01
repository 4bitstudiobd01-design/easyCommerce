# 01_DEVELOPMENT.md - Development Workflow & Coding Standards

# EasyCommerce Development Standards & Definition of Done

---

## 1. 9-Step Standard Development Workflow

Every coding task MUST follow this strict sequence:

1. **Understand Requirement**: Analyze business rules and scope.
2. **Find Affected Modules**: Identify impacted backend modules and frontend features.
3. **Review Existing Implementation**: Inspect current code and data flows.
4. **Design Solution**: Plan clean implementation following DDD & SOLID.
5. **Implement Backend**: Build single-purpose services, entities, and endpoints.
6. **Implement Frontend**: Build corresponding feature UI components & RTK Query integration.
7. **Write Tests**: Implement unit/integration tests for critical business paths.
8. **Self Review**: Verify security, error handling, performance, and validation.
9. **Stop & Report**: Summarize changes and wait for approval.

---

## 2. Core Coding Rules & Principles

* **SOLID & Clean Architecture**: Enforce single-responsibility, open-closed, and dependency inversion.
* **Single Responsibility Services (SRP)**: Each service/use-case MUST perform a single task (e.g., `LoginService`, `RegisterMerchantService`, `VerifyOtpService`). Never create monolithic "god services".
* **DRY & KISS**: Avoid duplicate logic; keep solutions as simple as possible.
* **Security First**: Input validation (Zod/DTO class-validator), tenant authorization guards, proper error handling, and audit logging.
* **Task Size Rule**: One implementation task MUST remain small enough to complete in a single review cycle. Split large epic features into multiple modular, incremental tasks.


---

## 3. Pre-Coding Self-Checklist

Before writing code, answer internally:
* What module am I modifying?
* What business rule is affected?
* Does documentation already define this?
* Can existing code/utilities be reused?
* Is this breaking any existing contract or tenant data isolation?

---

## 4. Definition of Done (DoD) & Task Completion Format

Every completed task report MUST end with the following structured summary:

```text
### Task Completion Summary

1. Completed Files: [List of created/modified files]
2. Database Changes: [Schema/Entity changes]
3. API Changes: [Endpoints & DTO changes]
4. Frontend Changes: [Feature UI & RTK Query changes]
5. Breaking Changes: [None / Description]
6. Migration Required: [Yes/No]
7. Manual Testing Steps: [Verification steps]
8. Future Improvements: [Post-MVP enhancement notes]
```
