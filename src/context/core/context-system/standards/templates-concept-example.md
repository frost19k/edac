<!-- Context: core/context-system/standards | Priority: high | Version: 1.0 | Updated: 2026-07-28 -->

# Context File Templates — Concept & Example

**Purpose**: Standard formats for concept and example context files

**Last Updated**: 2026-07-28

---

## Template Selection

| Type | Max Lines | Required Sections |
|------|-----------|-------------------|
| Concept | 100 | Purpose, Core Idea (1-3 sentences), Key Points (3-5), Example (<10 lines), Reference, Related |
| Example | 80 | Purpose, Use Case, Code (10-30 lines), Explanation, Related |
| Guide | 150 | Purpose, Prerequisites, Steps (4-7), Verification, Related |
| Lookup | 100 | Purpose, Tables/Lists, Commands, Related |
| Error | 150 | Purpose, Per-error: Symptom, Cause, Solution, Prevention, Reference, Related |
| README | 100 | Purpose, Navigation tables (all 5 folders), Loading Strategy, Statistics |

---

## 1. Concept Template

```markdown
<!-- Context: {category}/concepts | Priority: {critical|high|medium|low} | Version: 1.0 | Updated: YYYY-MM-DD -->
# Concept: {Name}

**Purpose**: [1 sentence]
**Last Updated**: {YYYY-MM-DD}

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

## Related
- concepts/x.md
- examples/y.md
```

---

## 2. Example Template

```markdown
<!-- Context: {category}/examples | Priority: {high|medium} | Version: 1.0 | Updated: YYYY-MM-DD -->
# Example: {What It Shows}

**Purpose**: [1 sentence]
**Last Updated**: {YYYY-MM-DD}

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

## Related
- concepts/x.md
```

---

## Related

- [templates-guide-lookup.md](./templates-guide-lookup.md) — Guide & Lookup templates
- [templates-error-navigation.md](./templates-error-navigation.md) — Error, Navigation & Specialized templates
- [structure.md](./structure.md) — File organization standards
- [mvi.md](./mvi.md) — Minimal Viable Information principle
