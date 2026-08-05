---
title: EDAC `src/` Package Structure
type: concept
tags: [edac, packaging, structure, src, layout]
created: 2026-07-29
updated: 2026-07-29
sources: [src/ directory listing, registry.json, VERSION]
status: stable
---

> EDAC is inspired by OpenAgentsControl (OAC) but has its own package structure. OAC patterns exist exclusively in `src/`; OAC's `.opencode/` layout does **not** apply to EDAC. **This page is the source of truth for EDAC's on-disk layout.** Any wiki page that asserts a file path or directory structure must trace to the tables below — never to OAC's `.opencode/`.

## Overview

`src/` is EDAC's install package: the component library that `install.sh` mirrors into a target OpenCode environment. It is the authoritative representation of EDAC's structure. The wiki references `src/` paths; OAC's `.opencode/` paths (e.g. `.opencode/config/agent-metadata.json`) are OAC lineage only and do not exist in EDAC.

## `src/` top-level layout

| Path | Contents |
|---|---|
| `src/agents/core/` | Primary agents: `open-coder.md`, `open-agent.md` |
| `src/agents/subagents/<tier>/` | Subagents by tier: `core/`, `code/`, `development/` |
| `src/commands/` | Slash commands: `add-context`, `analyze-patterns`, `clean`, `commit`, `context`, `optimize`, `test` |
| `src/context/` | Context files by domain: `web/`, `core/`, `intl/`, `dev/`, plus `navigation.md` |
| `src/skills/` | Skills: `task-management/` |
| `src/tools/` | Tooling: `env/` |
| `src/manifest.json` | Deprecated — `registry.json` `profiles.developer` carries the same fields. |
| `src/metadata.json` | Deprecated — `registry.json` is the sole source of truth; no script reads this file. |
| `src/README.md` | (currently empty) |

## Adjacent files at repo root (NOT in `src/`)

| Path | Role |
|---|---|
| `registry.json` | Component registry + installable profile seed. Per-component `id`/`name`/`type`/`path`/`description`/`tags`/`dependencies`/`category`; top-level `version` + `schema_version`. Sole source of truth — read by `install.sh` and `scripts/registry/` validators. |
| `VERSION` | Repo semver; mirrors `package.json` `version`. |
| `package.json` | Repo version + `bun` scripts (`validate`, `validate:registry`, `validate:components`, `validate:context-links`, `validate:context-refs`, `validate:deps`, `detect:components`). |

> **Critical:** `registry.json` lives at the **repo root**, not in `src/`. Wiki pages must reference `registry.json` (repo root), never `src/registry.json`.

## Agent metadata: `registry.json`

Each agent/subagent that exists as a `.md` file under `src/agents/` has a corresponding entry in `registry.json` (repo root), keyed by its `id`. The entry carries metadata that is **not** part of the OpenCode agent frontmatter (which allows only `name`, `description`, `mode`, `temperature`, `permission`, …): specifically `id`, `name`, `type`, `path`, `description`, `tags`, `dependencies`, `category`.

**Path mapping:** an entry with `category: core` and `id: open-coder` resolves to `src/agents/core/open-coder.md`; an entry with `category: subagents/code` and `id: coder-agent` resolves to `src/agents/subagents/code/coder-agent.md`.

> `src/metadata.json` and `src/manifest.json` are deprecated. `registry.json` is the sole source of truth — no script reads the deprecated files.

## Why this page exists

The initial OAC-standards ingest copied OAC's `.opencode/` paths into the wiki (e.g. `.opencode/config/agent-metadata.json`, `src/registry.json`) because the wiki had not yet defined EDAC's real `src/` layout. This page prevents that class of error: every structural assertion in the wiki must trace here.

## Related

- [Versioning](versioning.md) — two coexisting versions and where each lives (`VERSION`/`package.json`, `registry.json`).
- [Agent Frontmatter](harness/agent-frontmatter.md) — what belongs in frontmatter vs `registry.json`.
- `wiki/SCHEMA.md` — the EDAC↔OAC relationship note.
