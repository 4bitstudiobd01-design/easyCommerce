# 03_PROMPTS.md - Reusable Task Prompt Templates

# Task Execution Prompt Templates for EasyCommerce

---

## 1. Feature Implementation Template

```text
TASK: Implement Feature [Feature Name]
MODULE: [Backend Module] / [Frontend Feature]

INSTRUCTIONS:
1. Review documentation in docs/ for [Feature Name] specifications.
2. Implement backend module changes under backend/src/modules/[module-name]/ using Single Responsibility Services (SRP).
3. Implement corresponding frontend UI and RTK Query endpoints under frontend/src/features/[feature-name]/ side-by-side.
4. Verify tenant isolation, Zod validation, error handling, and authorization.
5. Provide output using the 8-point Definition of Done checklist.
```

---

## 2. Bug Fix & Troubleshooting Template

```text
TASK: Debug & Fix Issue [Issue Summary]

INSTRUCTIONS:
1. Inspect full un-truncated error log or traceback.
2. Trace root cause through affected backend module or frontend feature.
3. Fix underlying cause without masking symptoms or returning dummy fallbacks.
4. Verify fix with unit test or runtime command.
5. Report completed fix using Definition of Done format.
```

---

## 3. Code Review & Architecture Audit Template

```text
TASK: Review Code / Architecture for [Component/Module Name]

INSTRUCTIONS:
1. Check adherence to DDD, Modular Monolith, and SOLID principles.
2. Verify Feature-based frontend and Module-based backend structure.
3. Ensure no direct cross-module database joins exist.
4. Verify single responsibility services (SRP) and tenant context isolation.
5. Classify recommendations into Critical, Important, and Optional.
```

---

## 4. Continue Previous Work Template

```text
TASK: Continue Unfinished Work for [Task / Feature Name]

INSTRUCTIONS:
1. Read previous implementation steps and existing code files.
2. Identify remaining unfinished work, failing tests, or missing endpoints.
3. Continue remaining implementation incrementally.
4. Do NOT rewrite completed or working code.
5. Provide output using the 8-point Definition of Done checklist.
```

