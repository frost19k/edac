# AGENTS.md

Compact guidance for OpenCode agents working in EDAC. Every line is something a future agent would likely miss.

## What EDAC is
- Enhanced DevAgents Control: a derivative of `darrenhinde/OpenAgentsControl`, rebuilt to build and install OpenCode agent ecosystems. Origin: `github.com/frost19k/edac`.
- `src/` is the install package end-users clone and install into their own OpenCode environment.

## Toolchain & setup
- Runtime is **bun**, not npm. Run scripts with `bun run <script>`.
- `install.sh` requires **jq** on PATH (it aborts if missing).

## Developer commands
- `bun run validate` — full check: registry validation + markdown link check.
- `bun run validate:registry` — `scripts/registry/validate-registry.ts`.
- `bun run validate:deps` — `scripts/registry/check-dependencies.ts` (dependency-resolution sanity).
- `bun run validate:context-links` — `scripts/validation/validate-markdown-links.ts` (honors `scripts/validation/markdown-link-skip-patterns.txt`).
- `./install.sh` — install the Developer profile to `~/.config/opencode`.
  - `--dry-run` first to preview what would be installed.
  - `--overwrite` to replace existing files (default skips).
  - `EDAC_INSTALL_DIR=<dir> ./install.sh` for a custom target.

## Structure & ownership
- `src/` — the install package: component library (`agents/core`, `agents/subagents`, `commands`, `context`, `skills`, `tools`), `registry.json` (component registry with deps + profiles), `manifest.json` (Developer profile). Mirrored by `install.sh`.
- `.opencode/` — SystemBuilder's home: agent + subagent definitions (`.opencode/agents/`), and context (currently points to `wiki/`).
- `wiki/` — SystemBuilder's research/verification knowledge base (see Agent architecture). `sources/` holds raw cited research; `framework/`, `harness/`, `research/` hold generated pages; `llm-wiki.md` is the pattern doc. Conventions live in `wiki/SCHEMA.md`.
- `scripts/` — bun validation + dependency resolution (`registry/`, `validation/`).

## Registry & install quirks
- `registry.json` is the source of truth for components, dependencies, and the Developer profile seed. Run `bun run validate` before committing registry changes.
- The mirror source dir is defined in **two** places that must stay in sync: `install.sh` `SRC_ROOT` ("src") and `scripts/registry/dependency-resolution.ts` `MIRROR_DIR` ("src"). Change both together.
- `install.sh` rewrites `.opencode/context/` references to absolute install-dir paths **only** when installing to a global dir (not when `--install-dir` is a local `.opencode`).

## Agent architecture (repo-wide convention)
- SystemBuilder is the **sole primary agent**. The user interacts only with SystemBuilder.
- ResearchAgent, WikiJanitor, and WikiLibrarian are SystemBuilder's subagents; only SystemBuilder spawns them — never invoke them directly.
- Boundary: `src/` is what SystemBuilder *develops*; `.opencode/` is where SystemBuilder *lives* (agents, context, subagents). Do not conflate the two.
- `wiki/` is SystemBuilder's research apparatus, not a user-facing browse tool. The research loop is **branching**, not a fixed sequence: SystemBuilder may fan out multiple subagents in parallel and may even spawn itself (configured `mode: all`).
- SystemBuilder's constitution: `.opencode/agents/primary/system-builder.md`.

## Git
- Repo is git-initialized on branch `master` with **no commits yet**; all files are currently untracked.
- `wiki/` is part of this repo (not a separate repository).
- Commit only when explicitly requested.
