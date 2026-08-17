# AGENTS.md

Compact guidance for OpenCode agents working in EDAC. Every line is something a future agent would likely miss.

## What EDAC is
- Enhanced DevAgents Control: an **Orchestration-First multi-agent development system** for OpenCode. Origin: `github.com/frost19k/edac`.
- `src/` is the center of this repo — it **is** the EDAC system: the install package end-users clone into their own OpenCode environment.
- EDAC's primary agents are `OpenCoder` (orchestration for complex coding/architecture) and `OpenAgent` (universal coordination). They delegate to a subagent pool of 12 (CoderAgent, TestEngineer, CodeReviewer, BuildAgent, DocWriter, TaskManager, BatchExecutor, ContextScout, ContextOrganizer, ExternalScout, FrontendSpecialist, DevopsSpecialist).

## Toolchain & setup
- Runtime is **bun**, not npm. Run scripts with `bun run <script>`.
- Run `bun install` once after cloning to fetch devDependencies (`glob`); `bun run validate` imports `globSync` and fails without it.
- `install.sh` requires **jq** on PATH (it aborts if missing).

## Developer commands
- `bun run validate` — full check: registry + component + context-link + context-ref + redaction-awareness validation.
- `bun run validate:registry` — `scripts/registry/validate-registry.ts`.
- `bun run validate:components` — `scripts/registry/validate-component.ts`.
- `bun run validate:context-links` — `scripts/validation/validate-markdown-links.ts` (honors `scripts/validation/markdown-link-skip-patterns.txt`).
- `bun run validate:context-refs` — `scripts/validation/validate-context-refs.ts`.
- `bun run validate:redaction-awareness` — `scripts/validation/validate-redaction-awareness.ts`. Fails if any agent file is missing the `<!-- edac:redaction-artifact-awareness:v2 -->` marker. Every agent body must carry it; adding a new agent file without the marker breaks `validate`.
- `bun run validate:deps` — `scripts/registry/check-dependencies.ts` (dependency-resolution sanity).
- `bun run detect:components` — `scripts/registry/auto-detect-components.ts` (detect/fix/add new components; `--dry-run` to preview).
- `./install.sh` — install the Developer profile to `~/.config/opencode`.
  - `--dry-run` first to preview what would be installed.
  - `--overwrite` to replace existing files (default skips).
  - `EDAC_INSTALL_DIR=<dir> ./install.sh` (or `--install-dir <dir>`) for a custom target.

## Structure & ownership
- `src/` — **the EDAC system** (the product, the center of this repo): component library (`agents/core`, `agents/subagents`, `commands`, `context`, `skills`, `tools`). Mirrored by `install.sh`. (`manifest.json` and `metadata.json` are deprecated — `registry.json` is the sole source of truth; no script reads them.)
- `registry.json` lives at the **repo root**, not in `src/`. It is the sole source of truth for components, dependencies, and the Developer profile seed (`profiles.developer.components`, 33 entries) that `install.sh` actually installs.
- `.opencode/` — SystemBuilder's working environment: the agent + subagent definitions (`.opencode/agents/`) and context used while building EDAC. SystemBuilder lives here; EDAC does **not** exist to serve SystemBuilder.
- `wiki/` — research and conventions that aid the **development of EDAC (`src/`)**, not SystemBuilder's personal apparatus. `sources/` holds transient cited research (removed after ingest); `framework/`, `harness/`, `research/` hold generated pages; `SCHEMA.md` is the governing contract, `index.md` the catalog, `log.md`/`TODO.md`/`AUDIT.md` the activity records. SCHEMA states: OAC ≈ `src/`; treat `src/` as the source of truth for EDAC structure.
- `scripts/` — bun validation + dependency resolution (`registry/`, `validation/`).

## Registry & install quirks
- `registry.json` is the source of truth for components, dependencies, and the Developer profile seed. Run `bun run validate` before committing registry changes.
- The mirror source dir is defined in **two** places that must stay in sync: `install.sh` `SRC_ROOT` ("src") and `scripts/registry/dependency-resolution.ts` `MIRROR_DIR` ("src"). Change both together.
- `install.sh` rewrites `.opencode/context/` references to absolute install-dir paths **only** when installing to a global dir (not when `--install-dir` is a local `.opencode`).

## Agent architecture (repo-wide convention)
- **SystemBuilder is the primary agent for this repo.** Its job is to build the EDAC system in `src/`. SystemBuilder is **not** the center of the repo — `src/` is.
- The EDAC agents in `src/` (OpenCoder, OpenAgent, and their subagents) are the **product**. They are not SystemBuilder's tools and do not serve SystemBuilder. Do not conflate EDAC's agent roster with SystemBuilder's own subagents.
- SystemBuilder performs all wiki functions (research, ingest, query, lint, audit) inline under **Wiki Stewardship** — see `wiki/SCHEMA.md` for the *what* and SystemBuilder's constitution for the *how*. For external research (current library docs, framework APIs), SystemBuilder spawns **ExternalScout** and ingests the results. The user never invokes wiki functions directly.
- Boundary: `src/` is what SystemBuilder *develops*; `.opencode/` is where SystemBuilder *lives*. The wiki exists to aid `src/` development, not to document SystemBuilder.
- SystemBuilder's constitution: `.opencode/agents/system-builder.md`.

## Git
- Repo is on branch `master`; verify `git status` before assuming a clean tree.
- `wiki/` is part of this repo (not a separate repository).
- Commit only when explicitly requested.