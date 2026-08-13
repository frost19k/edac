---
description: Standard formats for guide and lookup context files
version: 1.0
updated: 2026-08-13
---

# Context File Templates — Guide & Lookup

---

## 3. Guide Template

```markdown
---
description: [one-line purpose]
version: 1.0
updated: YYYY-MM-DD
---

# Guide: {Action}

## Prerequisites
- Requirement 1
- Requirement 2

**Estimated time**: X min

## Steps

### 1. {Step}
```bash
{command}
```
**Expected**: [result]

### 2. {Step}
[Repeat 4-7 steps]

## Verification
```bash
{verify command}
```

## Troubleshooting
| Issue | Solution |
|-------|----------|
| Problem | Fix |

## Related Files
- concepts/x.md
```

---

## 4. Lookup Template

```markdown
---
description: Quick reference for {desc}
version: 1.0
updated: YYYY-MM-DD
---

# Lookup: {Reference Type}

## {Section}
| Item | Value | Desc | Code |
|------|-------|------|------|
| x | y | z | `path/to/file.ts` |

## Commands
```bash
# Description
{command}
```

## Paths
```
{path} - {desc}
```

## Related Files
- concepts/x.md
```

---

## Related Files

- [templates-concept-example.md](./templates-concept-example.md) — Concept & Example templates
- [templates-error-navigation.md](./templates-error-navigation.md) — Error, Navigation & Specialized templates
- [structure.md](./structure.md) — File organization standards
- [mvi.md](./mvi.md) — Minimal Viable Information principle
