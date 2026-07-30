# AGENTS.md

Compact guidance for OpenCode agents working in EDAC. Every line is something a future agent would likely miss.

## What EDAC is
- Enhanced DevAgents Control: a derivative of `darrenhinde/OpenAgentsControl`, rebuilt to build and install OpenCode agent ecosystems. Origin: `github.com/frost19k/edac`.
- `src/` is the install package end-users clone and install into their own OpenCode environment.

## Toolchain & setup
- Runtime is **bun**, not npm. Run scripts with `bun run <script>`.
- Run `bun install` once after cloning to fetch devDependencies (`glob`); `bun run validate` imports `globSync` and fails without it.
- `install.sh` requires **jq** on PATH (it aborts if missing).

## Developer commands
- `bun run validate` — full check: registry validation + markdown link check.
- `bun run validate:registry` — `scripts/registry/validate-registry.ts`.
- `bun run validate:deps` — `scripts/registry/check-dependencies.ts` (dependency-resolution sanity).
- `bun run validate:context-links` — `scripts/validation/validate-markdown-links.ts` (honors `scripts/validation/markdown-link-skip-patterns.txt`).
- `./install.sh` — install the Developer profile to `~/.config/opencode`.
  - `--dry-run` first to preview what would be installed.
  - `--overwrite` to replace existing files (default skips).
  - `EDAC_INSTALL_DIR=<dir> ./install.sh` (or `--install-dir <dir>`) for a custom target.

## Structure & ownership
- `src/` — the install package end-users clone into their own OpenCode environment: component library (`agents/core`, `agents/subagents`, `commands`, `context`, `skills`, `tools`), `manifest.json` (Developer profile descriptor — badge/name/description + a 35-component list; `install.sh` does **not** read it), and `metadata.json` (agent-metadata store used for registry management/install; not part of the OpenCode agent schema). Mirrored by `install.sh`.
- `registry.json` lives at the **repo root**, not in `src/`. It is the source of truth for components, dependencies, and the Developer profile seed (`profiles.developer.components`, 27 entries) that `install.sh` actually installs.
- `.opencode/` — SystemBuilder's home: agent + subagent definitions (`.opencode/agents/`), and context (currently points to `wiki/`).
- `wiki/` — SystemBuilder's research/verification knowledge base (see Agent architecture). `sources/` holds raw cited research; `framework/`, `harness/`, `research/` hold generated pages; `llm-wiki.md` is the pattern doc. Conventions live in `wiki/SCHEMA.md`.
- `scripts/` — bun validation + dependency resolution (`registry/`, `validation/`).

## Registry & install quirks
- `registry.json` is the source of truth for components, dependencies, and the Developer profile seed. Run `bun run validate` before committing registry changes.
- The mirror source dir is defined in **two** places that must stay in sync: `install.sh` `SRC_ROOT` ("src") and `scripts/registry/dependency-resolution.ts` `MIRROR_DIR` ("src"). Change both together.
- `install.sh` rewrites `.opencode/context/` references to absolute install-dir paths **only** when installing to a global dir (not when `--install-dir` is a local `.opencode`).

## Agent architecture (repo-wide convention)
- SystemBuilder is the **sole primary agent**. The user interacts only with SystemBuilder.
- The research subagents — ResearchAgent, WikiJanitor, WikiLibrarian — are specified in `wiki/SCHEMA.md`. WikiJanitor is instantiated at `.opencode/agents/subagents/wiki-janitor.md`; ResearchAgent and WikiLibrarian are not yet (see `wiki/TODO.md`). Only SystemBuilder spawns them; the user never invokes them directly (SystemBuilder spawns per the triggers in his own constitution).
- Boundary: `src/` is what SystemBuilder *develops*; `.opencode/` is where SystemBuilder *lives* (agents, context, subagents). Do not conflate the two.
- `wiki/` is SystemBuilder's research apparatus, not a user-facing browse tool. The research loop is **branching**, not a fixed sequence: SystemBuilder may fan out multiple subagents in parallel and may even spawn itself (configured `mode: all`).
- SystemBuilder's constitution: `.opencode/agents/primary/system-builder.md`.

## Git
- Repo is on branch `master` with an initial commit; verify `git status` before assuming a clean tree.
- `wiki/` is part of this repo (not a separate repository).
- Commit only when explicitly requested.
