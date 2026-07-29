---
title: Versioning Model (OAC conventions)
type: concept
tags: [versioning, registry, semver, oac-standards]
created: 2026-07-29
updated: 2026-07-29
sources: [sources/oac-standards/versioning.md]
status: stable
---

# Versioning Model

**Finding:** EDAC (inheriting OpenAgentsControl) maintains three *independent* version numbers that must not be conflated: the **Repo version** (semver, in `VERSION` + `package.json`), the **Registry schema version** (in `registry.json` → `schema_version`), and **Component versions** (per-agent `version` in `src/metadata.json`). Bumping one never requires bumping the others.

## The Three Coexisting Versions

| Version | Location | Bumped When |
|---------|----------|-------------|
| **Repo** | `VERSION` + `package.json` | Agent behavior changes |
| **Registry schema** | `registry.json` → `schema_version` | Registry JSON structure changes |
| **Component** | `src/metadata.json` → per-agent `version` | Individual agent changes |

These are independent: a patch to one agent does not affect the repo version, and adding/removing component entries is a content change, not a schema change.

## Repo Version (semver: MAJOR.MINOR.PATCH)

**Source:** `VERSION` file + `package.json` → `"version"` — **keep these two in sync** (update both on every bump).

- **MAJOR** — breaking agent behavior: renaming an agent (display name or file path), removing an agent/subagent, changing agent frontmatter structure, restructuring the context tree (`core/`, `repo/`, etc.), changing permission rules that alter allowed/blocked actions, or modifying delegation chains.
- **MINOR** — new agents or features: adding a new agent/subagent, adding new context files, adding slash commands or skills, new eval test categories, or enhancing existing agent prompts without breaking behavior.
- **PATCH** — fixes and docs: fixing typos in agent prompts, updating documentation, fixing eval tests, updating `registry.json` component entries, or updating `src/metadata.json` (tags, descriptions).

## Registry Schema Version

**Source:** `registry.json` → `"schema_version"`.

Bump only when the **JSON structure** of `registry.json` changes — adding/removing top-level fields, changing component entry schema, or changing category definitions. **Do NOT bump** when only component entries are added/removed/updated; that is a content change, not a schema change.

## Component Versions

**Source:** `src/metadata.json` → per-agent `"version"`.

Each agent carries its own version, bumped when its prompt changes (behavioral), its permissions change, its dependencies change, or its description changes. Independent of the repo version — a change to one agent does not affect others.

## Decision Tree

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

## Sync Rules

- `VERSION` and `package.json` → **must match** (update both together).
- `registry.json` → independent; bump only on schema changes.
- `src/metadata.json` → independent per-agent.

## Cross-links

- Agent prompt/behavior changes are the trigger for repo MAJOR/MINOR and for component version bumps — see [Prompt Design Principles](../framework/prompt-design-principles.md).
- Related harness pages: [Agent Frontmatter](../harness/agent-frontmatter.md), [Subagent Structure](../harness/subagent-structure.md), [Permission Model](../harness/permission-model.md).

## Contradictions / Flags

- **Verified against EDAC (2026-07-29).** Repo version lives in `VERSION` + `package.json`; registry schema version in `registry.json` (repo root, not `src/`); per-agent version in `src/metadata.json`. OAC's agent-metadata location is OAC lineage only — EDAC stores agent metadata in `src/metadata.json`.
- The source's "Related" links (`../core-concepts/registry.md`, etc.) point to OAC's wiki tree and do not exist in EDAC's wiki; they are intentionally omitted here in favor of EDAC sibling pages.
