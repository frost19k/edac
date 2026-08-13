---
description: YAML frontmatter format for all context files
version: 1.0
updated: 2026-08-13
---

# Frontmatter Format

---

## Format

<rule id="frontmatter_required" enforcement="strict">
  ALL context files MUST start with YAML frontmatter:

  ```yaml
  ---
  description: <one-line purpose>
  version: 1.0
  updated: YYYY-MM-DD
  ---
  ```
</rule>

---

## Fields

**description**: One-line purpose statement. Subsumes the former body `**Purpose**:` line — do not duplicate it in the body.

**version**: `X.Y` (start 1.0, increment on changes).

**updated**: `YYYY-MM-DD` (ISO 8601). This is the single source of truth for the file's last-modified date — do not duplicate it as a body `**Last Updated**` line.

---

## Examples

```yaml
---
description: Consistent naming across agents, context files, and registry entries
version: 1.0
updated: 2026-08-13
---
```

```yaml
---
description: REST API design principles, GraphQL patterns, and API versioning strategies
version: 1.2
updated: 2026-08-13
---
```

---

## Validation

- [ ] Frontmatter is the first block in the file (before the H1)?
- [ ] Has `description` (one-line purpose)?
- [ ] Has `version` (X.Y format)?
- [ ] Has `updated` (YYYY-MM-DD)?
- [ ] No body-level `**Purpose**:` line (subsumed into `description`)?
- [ ] No body-level `**Last Updated**` line (subsumed into `updated`)?

---

## Related Files

- [structure.md](./structure.md) — File organization
- [templates-concept-example.md](./templates-concept-example.md) — Concept & Example templates
- [templates-guide-lookup.md](./templates-guide-lookup.md) — Guide & Lookup templates
- [templates-error-navigation.md](./templates-error-navigation.md) — Error, Navigation & Specialized templates
- [codebase-references.md](./codebase-references.md) — Linking to code
