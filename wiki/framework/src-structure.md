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

## Packaging vs. runtime location (read first)

This is the single most misread fact about EDAC's structure, and it has caused
audits to wrongly flag agent path strings as "stale." State it plainly:

- **`src/` is the packaging tree only.** It lives in this repo (`EDAC/`) and is
  where EDAC is *developed and assembled*. Agents do **not** read context from
  `src/context/` at runtime. Nothing in `src/` is the runtime location.
- **At install time, `install.sh` mirrors `src/` into a target OpenCode
  environment.** The install target is either:
  - project-local: `.opencode/` (when run with `--install-dir .opencode` or a
    local `.opencode` path), or
  - global: `~/.config/opencode` (the default, when `EDAC_INSTALL_DIR` is unset
    or points at `~/.config/opencode`).
- **The agents' hardcoded `.opencode/context/` references are correct for the
  *runtime* location, not for `src/context/`.** After `install.sh` copies
  `src/context/` to `.opencode/context/` (local) or `~/.config/opencode/context/`
  (global), those references resolve. They are **not** stale — they describe
  where the files land, not where they're packaged.
- **`install.sh` rewrites `.opencode/context/` references inside installed files
  to absolute install-dir paths — but only for *global* installs.** For a local
  `.opencode` install the references are left as-is (they already resolve
  relative to the project). See `install.sh` lines ~270–282.

Consequence for any audit: when evaluating `src/context/` against the agents,
**do not** treat `src/context/` as the location the agents read from. Judge
linkage against the *installed* path (`.opencode/context/` or
`~/.config/opencode/context/`), and judge content against the agent mandate.
The only `src/context/` defects that are real are: (a) directory/name
mismatches between `navigation.md` and the actual `src/context/` tree, and (b)
prose that asserts OAC-era names (`repo/`, `intelligence/`) that the tree no
longer uses.

## Overview

`src/` is EDAC's install package: the component library that `install.sh` mirrors into a target OpenCode environment. It is the authoritative representation of EDAC's structure. The wiki references `src/` paths; OAC's `.opencode/` paths (e.g. `.opencode/config/agent-metadata.json`) are OAC lineage only and do not exist in EDAC.

## `src/` top-level layout

| Path | Contents |
|---|---|
| `src/agents/core/` | Primary agents: `open-coder.md`, `open-agent.md` |
| `src/agents/subagents/<tier>/` | Subagents by tier: `core/`, `code/`, `development/` |
| `src/commands/` | Slash commands: `add-context`, `analyze-patterns`, `clean`, `commit`, `context`, `optimize`, `test` |
| `src/context/` | Context files by domain: `web/`, `core/`, `intl/`, `dev/`, plus `navigation.md` |
| `src/skills/` | Skills: `task-management/`, `holographic-memory/` |
| `src/tools/` | Tooling: `env/` |
| `src/plugins/holographic-memory/` | Plugin build contract only: `src/` (TypeScript sources bundled per `scripts/build.cjs` `FILES` array; co-located `*.test.ts` are not part of the build), `dist/` (gitignored, built at install), `package.json`, `tsconfig.json`, `scripts/build.cjs`. Config and skill are standalone components at canonical `src/` locations. |
| `src/opencode.jsonc` | Global config template — merged with existing config on install. |
| `src/dcp.jsonc` | DCP/compress plugin config — copy-or-skip on install. |
| `src/vibeguard.config.json` | Vibeguard secret-redaction config — merged on install. |
| `src/holographic_memory.json` | Holographic-memory plugin config — copy-or-skip on install. |
| `src/manifest.json` | Deprecated — `registry.json` `profiles.developer` carries the same fields. |
| `src/metadata.json` | Deprecated — `registry.json` is the sole source of truth; no script reads this file. |

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

- [Mechanistic Framing](mechanistic-framing.md) — why agent definition and context files must describe present state only; the packaging-vs-runtime distinction below is the structural basis for that discipline.
- [Versioning](versioning.md) — two coexisting versions and where each lives (`VERSION`/`package.json`, `registry.json`).
- [Agent Frontmatter](harness/agent-frontmatter.md) — what belongs in frontmatter vs `registry.json`.
- `wiki/SCHEMA.md` — the EDAC↔OAC relationship note.
