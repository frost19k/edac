---
description: Ensure all context files follow the same format and structure
version: 1.0
updated: 2026-08-13
---

# Context File Creation Standards

---

## Critical Rules

<critical_rules priority="absolute" enforcement="strict">
  <rule id="size_limit">Files MUST be under line limits (see below)</rule>
  <rule id="mvi_required">All files MUST follow MVI principle</rule>
  <rule id="function_placement">Files MUST be in correct folder</rule>
  <rule id="navigation_update">MUST update navigation.md when creating files</rule>
</critical_rules>

---

## Creation Workflow

### 1. Determine Function
Ask: Is this a concept, example, guide, lookup, or error?  
→ Place in correct folder

### 2. Apply Template
Use standard template for file type (see templates-concept-example.md, templates-guide-lookup.md, templates-error-navigation.md)

### 3. Apply MVI
- Core: 1-3 sentences
- Key points: 3-5 bullets
- Example: <10 lines
- Reference: Link to docs

### 4. Validate Size
Ensure file under limit. If not, split or reference external.

### 5. Add Cross-References
Link to related concepts/, examples/, guides/, errors/

### 6. Update Navigation
Add entry to navigation.md in parent directory

---

## File Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Concept | `{concept-name}.md` | `authentication.md` |
| Example | `{example-name}.md` | `jwt-example.md` |
| Guide | `{action-name}.md` | `creating-agents.md` |
| Lookup | `{reference-name}.md` | `commands.md` |
| Error | `{error-category}.md` | `auth-errors.md` |

**Rules**:
- Use kebab-case (lowercase with hyphens)
- Be descriptive but concise
- Avoid redundant category in name (not `concept-authentication.md`)

---

## Standard Metadata (Frontmatter)

```yaml
---
description: {one-line purpose}
version: {X.Y}
updated: {YYYY-MM-DD}
---
```

**When to update version**:
- Increment minor (1.0 → 1.1) for content revisions
- Increment major (1.0 → 2.0) for structural rewrites

---

## File Size Limits

| File Type | Max Lines |
|-----------|-----------|
| Concept | 100 |
| Example | 80 |
| Guide | 150 |
| Lookup | 100 |
| Error | 150 |

**Enforcement**: Strict. If over limit, split into multiple files or reference external docs.

---

## Cross-Reference Guidelines

**Format**: `See {type}/{filename}.md for {what}`

**Examples**:
- `See concepts/authentication.md for JWT details`
- `See examples/jwt-example.md for working code`
- `See errors/auth-errors.md for troubleshooting`

**Best practices**:
- Link to related concepts
- Link to examples from guides
- Link to errors from guides
- Create bidirectional links when relevant

---

## Navigation Update Process

When creating a file, update parent `navigation.md`:

```markdown
| File | Description | Priority |
|------|-------------|----------|
| new-file.md | Brief description | high |
```

**Keep navigation**:
- Alphabetical within priority groups
- Grouped by priority (critical → high → medium → low)
- Descriptions <10 words

---

## Validation Before Commit

- [ ] File under line limit?
- [ ] MVI format applied?
- [ ] Frontmatter added?
- [ ] In correct folder?
- [ ] Navigation.md updated?
- [ ] Cross-references added?
- [ ] Can be scanned in <30 seconds?

---

## Common Creation Mistakes

| Mistake | Fix |
|---------|-----|
| File too long | Split into multiple files or compress |
| Missing frontmatter | Add HTML comment at top |
| Wrong folder | Move to correct function folder |
| No cross-references | Add links to related files |
| Verbose explanations | Apply MVI compression |
| Missing from navigation | Update navigation.md |

---

## Template Selection

| File Type | Template | Use When |
|-----------|----------|----------|
| Concept | Concept template | Explaining what something is |
| Example | Example template | Showing working code |
| Guide | Guide template | Step-by-step instructions |
| Lookup | Lookup template | Quick reference data |
| Error | Error template | Troubleshooting issues |

See the template files (templates-concept-example.md, templates-guide-lookup.md, templates-error-navigation.md) for full templates.

---

## Related Files

- templates-concept-example.md - Concept and example templates
- templates-guide-lookup.md - Guide and lookup templates
- templates-error-navigation.md - Error and navigation templates
- mvi.md - MVI principle
- compact.md - Compression techniques
- structure.md - Directory structure
