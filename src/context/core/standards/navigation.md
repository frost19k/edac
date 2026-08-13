---
description: Universal standards for all development work
version: 1.0
updated: 2026-08-13
---

# Core Standards Navigation

---

## Files

| File | Topic | Priority | Load When |
|------|-------|----------|-----------|
| `code-quality.md` | Code quality and security patterns | ⭐⭐⭐⭐⭐ | Writing/reviewing code, security |
| `test-coverage.md` | Testing standards | ⭐⭐⭐⭐⭐ | Writing tests |
| `documentation.md` | Documentation rules | ⭐⭐⭐⭐ | Writing docs |
| `project-intelligence.md` | What and why | ⭐⭐⭐⭐ | Onboarding, understanding projects |
| `project-intelligence-management.md` | How to manage | ⭐⭐⭐ | Managing intelligence files |
| `code-analysis.md` | Analysis approaches | ⭐⭐⭐ | Analyzing code, debugging |
| `typescript-arrays.md` | Array methods, for-loops, type guards on filter | ⭐⭐⭐ | TypeScript array operations |
| `typescript-async.md` | Promise handling, parallel execution, error handling | ⭐⭐⭐ | TypeScript async patterns |
| `typescript-control-flow.md` | Early returns, guard clauses, exhaustive switch | ⭐⭐⭐ | TypeScript control flow |
| `typescript-functions.md` | Function naming, purity, composition | ⭐⭐⭐ | TypeScript function patterns |
| `typescript-organization.md` | Import ordering, naming, file structure | ⭐⭐⭐ | TypeScript code organization |
| `typescript-type-safety.md` | Explicit types, inference, guards, avoiding any | ⭐⭐⭐ | TypeScript type safety |

---

## Loading Strategy

**For code implementation**:
1. Load `code-quality.md` (critical)

**For TypeScript code**:
1. Load `typescript-type-safety.md` (critical)
2. Load relevant split file: `typescript-arrays.md`, `typescript-async.md`, `typescript-control-flow.md`, `typescript-functions.md`, `typescript-organization.md`, or `typescript-type-safety.md` (high)

**For testing**:
1. Load `test-coverage.md` (critical)
2. Depends on: `code-quality.md`

**For documentation**:
1. Load `documentation.md` (critical)

**For code review**:
1. Load `code-quality.md` (critical)
2. Load `test-coverage.md` (high)

**For project onboarding/understanding**:
1. Load `project-intelligence.md` (high)
2. Then load: `../../intl/` folder for full project context

---

## Related Files

- **Workflows** → `../workflows/navigation.md`
- **Development Principles** → `../../dev/principles/`
- **Project Intelligence** → `../../intl/navigation.md` (full project context)
