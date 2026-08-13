---
description: Universal development principles (language-agnostic)
version: 1.0
updated: 2026-08-13
---

# Development Principles Navigation

---

## Files

| File | Topic | Priority | Load When |
|------|-------|----------|-----------|
| `clean-code.md` | Clean code practices | ⭐⭐⭐⭐ | Writing any code |
| `api-design.md` | API design principles | ⭐⭐⭐⭐ | Designing APIs |

---

## Loading Strategy

**For general development**:
1. Load `clean-code.md` (high)
2. Also load: `../../core/standards/code-quality.md` (critical)

**For API development**:
1. Load `api-design.md` (high)
2. Also load: `../../core/standards/code-quality.md` (critical)

---

## Scope

**This directory**: Development-specific principles
**Core standards**: Universal standards (all projects, all languages)

| Location | Scope | Examples |
|----------|-------|----------|
| `core/standards/` | **Universal** (all projects) | Code quality, testing, docs, security |
| `dev/principles/` | **Development-specific** | Clean code, API design, error handling |

---

## Related Files

- **Core Standards** → `../../core/standards/navigation.md`
- **Backend Patterns** → `../backend-navigation.md`
- **Frontend Patterns** → `../frontend/navigation.md`
