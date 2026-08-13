<!-- Context: core/navigation | Priority: critical | Version: 1.0 | Updated: 2026-07-28 -->

# Core Standards Navigation

**Purpose**: Universal standards for all development work

---

## Files

| File | Topic | Priority | Load When |
|------|-------|----------|-----------|
| `code-quality.md` | Code quality rules | ⭐⭐⭐⭐⭐ | Writing/reviewing code |
| `test-coverage.md` | Testing standards | ⭐⭐⭐⭐⭐ | Writing tests |
| `documentation.md` | Documentation rules | ⭐⭐⭐⭐ | Writing docs |
| `security-patterns.md` | Security best practices | ⭐⭐⭐⭐ | Security review, patterns |
| `project-intelligence.md` | What and why | ⭐⭐⭐⭐ | Onboarding, understanding projects |
| `project-intelligence-management.md` | How to manage | ⭐⭐⭐ | Managing intelligence files |
| `code-analysis.md` | Analysis approaches | ⭐⭐⭐ | Analyzing code, debugging |
| `typescript.md` | Universal TypeScript patterns | ⭐⭐⭐⭐ | Writing/reviewing TypeScript code |
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
2. Load `security-patterns.md` (high)

**For TypeScript code**:
1. Load `typescript.md` (critical)
2. Load relevant split file: `typescript-arrays.md`, `typescript-async.md`, `typescript-control-flow.md`, `typescript-functions.md`, `typescript-organization.md`, or `typescript-type-safety.md` (high)
3. Load `code-quality.md` (high)

**For testing**:
1. Load `test-coverage.md` (critical)
2. Depends on: `code-quality.md`

**For documentation**:
1. Load `documentation.md` (critical)

**For code review**:
1. Load `code-quality.md` (critical)
2. Load `security-patterns.md` (high)
3. Load `test-coverage.md` (high)

**For project onboarding/understanding**:
1. Load `project-intelligence.md` (high)
2. Then load: `../../intl/` folder for full project context

---

## Related

- **Workflows** → `../workflows/navigation.md`
- **Development Principles** → `../../dev/principles/`
- **Project Intelligence** → `../../intl/navigation.md` (full project context)
