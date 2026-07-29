<!-- Context: core/context-system/standards | Priority: high | Version: 1.0 | Updated: 2026-07-28 -->

# Context File Templates — Error, Navigation & Specialized

**Purpose**: Standard formats for error, navigation, and specialized context files

**Last Updated**: 2026-07-28

---

## 5. Error Template

```markdown
<!-- Context: {category}/errors | Priority: {high|medium} | Version: 1.0 | Updated: YYYY-MM-DD -->
# Errors: {Framework}

**Purpose**: Common errors for {framework}
**Last Updated**: {YYYY-MM-DD}

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
// ❌ Before
{bad}

// ✅ After
{fixed}
```

**Prevention**: [how to avoid]
**Frequency**: common/occasional/rare

---

[Repeat for 5-10 errors]

## Related
- concepts/x.md
```

---

## 6. Navigation Template (Replaces README.md)

**Note**: Use `navigation.md` instead of `README.md` for better discoverability

**Target**: 200-300 tokens

```markdown
# {Category} Navigation

**Purpose**: [1 sentence]

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

## Related Context

- **{Category}** → `../{category}/navigation.md`
```

---

## 7. Specialized Navigation Template

**Use for**: Cross-cutting concerns (e.g., `ui-navigation.md`)

**Target**: 250-300 tokens

```markdown
# {Domain} Navigation

**Scope**: [What this covers]

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

1. Title with type prefix (# Concept:, # Example:, etc.)
2. **Purpose** (1 sentence)
3. **Last Updated** (YYYY-MM-DD)
4. **Related** section (cross-references)

---

## Validation

- [ ] Correct template for file type?
- [ ] Has required sections?
- [ ] Under max line limit?
- [ ] Cross-references added?
- [ ] Added to navigation.md?

---

## Related

- [templates-concept-example.md](./templates-concept-example.md) — Concept & Example templates
- [templates-guide-lookup.md](./templates-guide-lookup.md) — Guide & Lookup templates
- [structure.md](./structure.md) — File organization standards
- [mvi.md](./mvi.md) — Minimal Viable Information principle
