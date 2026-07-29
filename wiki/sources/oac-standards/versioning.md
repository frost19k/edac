<!-- Context: repo/standards | Priority: critical | Version: 1.0 | Updated: 2026-07-28 -->

# Versioning Policy

**Purpose**: Three version numbers coexist — this defines what each means and when to bump

---

## The Three Versions

| Version | Location | Current | Bumped When |
|---------|----------|---------|-------------|
| **Repo** | `VERSION` + `package.json` | `0.7.1` | Agent behavior changes |
| **Registry schema** | `registry.json` → `schema_version` | `2.0.0` | Registry structure changes |
| **Component** | `agent-metadata.json` → per-agent `version` | `1.0.0` | Individual agent changes |

**These are independent.** Bumping one does not require bumping the others.

---

## Repo Version (semver)

**Source**: `VERSION` file + `package.json` → `"version"` (keep in sync)

**Format**: `MAJOR.MINOR.PATCH`

### MAJOR — Breaking agent behavior

- Renaming an agent (display name or file path)
- Removing an agent or subagent
- Changing agent frontmatter structure
- Restructuring context tree (`core/`, `repo/`, etc.)
- Changing permission rules that alter allowed/blocked actions
- Modifying delegation chains (who calls whom)

### MINOR — New agents or features

- Adding a new agent or subagent
- Adding new context files (standards, guides, examples)
- Adding new slash commands or skills
- New eval test categories
- Enhancing existing agent prompts without breaking behavior

### PATCH — Fixes and docs

- Fixing typos in agent prompts
- Updating documentation
- Fixing eval tests
- Updating `registry.json` component entries
- Updating `agent-metadata.json` (tags, descriptions)

---

## Registry Schema Version

**Source**: `registry.json` → `"schema_version"`

Bump when the **JSON structure** of `registry.json` changes:
- Adding/removing top-level fields
- Changing component entry schema
- Changing category definitions

**Do NOT bump** when only component entries are added/removed/updated — that's a content change, not a schema change.

---

## Component Versions

**Source**: `.opencode/config/agent-metadata.json` → per-agent `"version"`

Each agent has its own version. Bump when:
- Agent prompt changes (behavioral change)
- Agent permissions change
- Agent dependencies change
- Agent description changes

**Independent of repo version.** A patch to one agent doesn't affect others.

---

## When to Bump — Decision Tree

```
Did an agent's behavior change?
  ├─ Yes, broke existing behavior → MAJOR
  ├─ Yes, added new behavior → MINOR
  └─ No, just docs/fixes → PATCH

Did registry.json structure change?
  ├─ Yes → bump schema_version
  └─ No → don't touch schema_version

Did one agent change?
  └─ Yes → bump that agent's component version only
```

---

## Keeping Versions in Sync

- `VERSION` file and `package.json` → **must match** (update both)
- `registry.json` → independent (bump only on schema changes)
- `agent-metadata.json` → independent per-agent

```bash
# Bump repo version
echo "0.8.0" > VERSION
# Then update package.json manually or with jq
```

---

## Related

- `../core-concepts/registry.md` — How registry works
- `../core-concepts/agent-metadata.md` — Agent metadata structure
- `../guides/creating-release.md` — Release workflow
- `../../core/standards/naming-conventions.md` — Naming patterns
