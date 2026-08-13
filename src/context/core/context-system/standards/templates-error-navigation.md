---
description: Standard formats for error, navigation, and specialized context files
version: 1.0
updated: 2026-08-13
---

# Context File Templates — Error, Navigation & Specialized

---

## 5. Error Template

```markdown
---
description: Common errors for {framework}
version: 1.0
updated: YYYY-MM-DD
---

# Errors: {Framework}

## Error: {Name}

**Symptom**:
```
{error message}
```

**Cause**: [1-2 sentences]

**Solution**:
1. Step 1
2. Step 2

**Code**:
```lang
// Before
{bad}

// After
{fixed}
```

**Prevention**: [how to avoid]
**Frequency**: common/occasional/rare

---

[Repeat for 5-10 errors]

## Related Files
- concepts/x.md
```

---

## 6. Navigation Template

**Target**: 200-300 tokens

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

---

## 7. Specialized Navigation Template

**Use for**: Cross-cutting concerns spanning multiple categories

**Target**: 250-300 tokens

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

---

## All Templates Must Have

1. YAML frontmatter with `description`, `version`, `updated`
2. Title with type prefix (# Concept:, # Example:, etc.)
3. **Related Files** section (cross-references)

---

## Validation

- [ ] Correct template for file type?
- [ ] Has required sections?
- [ ] Under max line limit?
- [ ] Cross-references added?
- [ ] Added to navigation.md?

---

## Related Files

- [templates-concept-example.md](./templates-concept-example.md) — Concept & Example templates
- [templates-guide-lookup.md](./templates-guide-lookup.md) — Guide & Lookup templates
- [structure.md](./structure.md) — File organization standards
- [mvi.md](./mvi.md) — Minimal Viable Information principle
