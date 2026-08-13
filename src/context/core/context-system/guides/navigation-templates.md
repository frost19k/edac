---
description: Ready-to-use templates for navigation files
version: 1.0
updated: 2026-08-13
---

# Navigation File Templates

---

## Category Navigation Template

```markdown
---
description: Index of {category} context files
version: 1.0
updated: YYYY-MM-DD
---

# {Category} Navigation

---

## Structure

```
{category}/
├── navigation.md
├── {subcategory}/
│   ├── navigation.md
│   └── {files}.md
```

---

## Quick Routes

| Task | Path |
|------|------|
| **{Task 1}** | `{path}` |
| **{Task 2}** | `{path}` |
| **{Task 3}** | `{path}` |

---

## By {Concern/Type}

**{Section 1}** → {description}
**{Section 2}** → {description}
**{Section 3}** → {description}

---

## Related Files

- **{Category}** → `../{category}/navigation.md`
```

**Token count**: ~200-250 tokens

---

## Specialized Navigation Template

```markdown
---
description: [What this covers]
version: 1.0
updated: YYYY-MM-DD
---

# {Domain} Navigation

---

## Structure

```
{Relevant directories across multiple categories}
```

---

## Quick Routes

| Task | Path |
|------|------|
| **{Task 1}** | `{path}` |
| **{Task 2}** | `{path}` |

---

## By {Framework/Approach}

**{Tech 1}** → `{path}`
**{Tech 2}** → `{path}`

---

## Common Workflows

**{Workflow 1}**:
1. `{file1}` ({purpose})
2. `{file2}` ({purpose})
```

**Token count**: ~250-300 tokens

---

## Good Example (Token-Efficient)

```markdown
---
description: Software development across all stacks
version: 1.0
updated: 2026-08-13
---

# Development Navigation

---

## Structure

```
dev/
├── navigation.md
├── principles/
├── frontend/
└── backend/
```

---

## Quick Routes

| Task | Path |
|------|------|
| **Frontend** | `frontend/navigation.md` |
| **Backend** | `backend-navigation.md` |
| **Clean code** | `principles/clean-code.md` |

---

## By Concern

**Principles** → Universal practices
**Frontend** → React, Vue, state
**Backend** → APIs, Node, auth
```

**Token count**: ~180 tokens

---

## Bad Example (Too Verbose)

```markdown
---
description: This navigation file helps you find software development patterns, standards, and best practices across all technology stacks including frontend, backend, databases, and infrastructure.
version: 1.0
updated: 2026-08-13
---

# Development Navigation

## Introduction

The development category contains comprehensive guides and patterns
for building modern applications. Whether you're working on frontend
user interfaces, backend APIs, database integrations...

[... continues for 500+ tokens]
```

**Token count**: 500+ tokens — description is too long, body is too verbose

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Too many tokens | Remove verbose descriptions, shorten entries |
| Hard to scan | Use tables instead of paragraphs |
| Missing files | Add to structure and quick routes |
| Unclear paths | Use relative paths, add brief descriptions |

---

## Related Files

- [navigation-design-basics.md](./navigation-design-basics.md) — Core principles and steps
- [../standards/mvi.md](../standards/mvi.md) — MVI principle
- [../examples/navigation-examples.md](../examples/navigation-examples.md) — More examples
