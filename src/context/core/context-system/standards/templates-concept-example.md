---
description: Standard formats for concept and example context files
version: 1.0
updated: 2026-08-13
---

# Context File Templates — Concept & Example

---

## Template Selection

| Type | Max Lines | Required Sections |
|------|-----------|-------------------|
| Concept | 100 | Core Idea (1-3 sentences), Key Points (3-5), Example (<10 lines), Reference, Related Files |
| Example | 80 | Use Case, Code (10-30 lines), Explanation, Related Files |
| Guide | 150 | Prerequisites, Steps (4-7), Verification, Related Files |
| Lookup | 100 | Tables/Lists, Commands, Related Files |
| Error | 150 | Per-error: Symptom, Cause, Solution, Prevention, Reference, Related Files |
| Navigation | 100 | Navigation tables (all 5 folders), Loading Strategy, Statistics |

---

## 1. Concept Template

```markdown
---
description: [one-line purpose]
version: 1.0
updated: YYYY-MM-DD
---

# Concept: {Name}

## Core Idea
[1-3 sentences]

## Key Points
- Point 1
- Point 2
- Point 3

## When to Use
- Use case 1
- Use case 2

## Quick Example
```lang
[<10 lines]
```

## Deep Dive
**Reference**: [Link or "See implementation above"]

## Related Files
- concepts/x.md
- examples/y.md
```

---

## 2. Example Template

```markdown
---
description: [one-line purpose]
version: 1.0
updated: YYYY-MM-DD
---

# Example: {What It Shows}

## Use Case
[2-3 sentences]

## Code
```lang
[10-30 lines]
```

## Explanation
1. Step 1
2. Step 2
3. Step 3

**Key points**:
- Detail 1
- Detail 2

## Related Files
- concepts/x.md
```

---

## Related Files

- [templates-guide-lookup.md](./templates-guide-lookup.md) — Guide & Lookup templates
- [templates-error-navigation.md](./templates-error-navigation.md) — Error, Navigation & Specialized templates
- [structure.md](./structure.md) — File organization standards
- [mvi.md](./mvi.md) — Minimal Viable Information principle
