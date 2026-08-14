# EDAC TODO — Config Template & Plugin Integration

Build plan for the config-merge + plugin-integration work. Implementation and git commit are out of scope for the originating session (2026-08-14); this file is the handoff for a future session.

## Context

Two major integrations:
1. **Config template merge** — `src/opencode.jsonc`, `src/dcp.jsonc`, `src/vibeguard.config.json` are templates for the environment EDAC expects upon install. `install.sh` must merge them with any existing target config (deep merge, target wins, arrays dedupe, comments stripped with warning).
2. **Plugin + agent integration** — `src/plugins/holographic-memory/` needs cleanup and integration into EDAC. All 16 agent files need tool/plugin awareness updates and nomenclature compliance (never reference tools by technical names).

### Resolved design forks
- **JSONC comments**: strip + warn (jq-based merge; jq already required by install.sh).
- **Merge conflict**: target wins — template only adds missing keys; arrays merge+dedupe.
- **Plugin config location**: install target root (`~/.config/opencode/dcp.jsonc`, `~/.config/opencode/vibeguard.config.json`, `~/.config/opencode/holographic_memory.json`).
- **Compress/DCP awareness**: global via DCP plugin config — no explicit per-agent instructions.
- **Vibeguard awareness**: global via plugin — no explicit per-agent instructions.

### Tool-awareness model: two tiers

The distinction is structural, not quantitative:
- **Minimal** = capability-layer note ("you have access to X; use it when appropriate"). No workflow change. The agent's existing procedure stays intact; the tool is an additional option within it.
- **Comprehensive** = procedural-layer change. The agent's workflow, rules, or decision trees are modified. The tool doesn't just exist — it changes *how the agent operates*.

Guiding principles (from `wiki/framework/prompt-design-principles.md`):
- **Principle 11 (Delegation Rules Must Match Execution Model)**: if the execution model could use a direct path, the delegation rule must reflect that — otherwise the rule forces a round-trip the model didn't need.
- **Principle 14 (Don't Restate Injected Schema)**: teach *how to use* a tool, not *what it is* — the harness injects the schema, so awareness additions are usage guidance (when to use directly vs. when to delegate), not tool descriptions.

### Tool-awareness matrix

| Agent | Tier | Context7 | GrepApp | DeepWiki | Playwright | Holo-mem | PTY | What changes |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **ExternalScout** | Comp | ✓ | ✓ | ✓ | — | — | — | Full MCP rewrite; dead-ref cleanup; 3-MCP workflow; nomenclature |
| **CoderAgent** | Comp | ✓ | ✓ | ✓ | — | — | — | `external_scout_mandatory` → direct-vs-delegate decision tree |
| **TestEngineer** | Comp | ✓ | ✓ | — | — | — | — | Add direct-lookup path for testing API verification |
| **FrontendSpecialist** | Comp | ✓ | ✓ | — | ✓ | — | — | Refine `external_scout_for_ui_libs`; add Playwright workflow |
| **OpenCoder** | Comp | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All-MCP awareness for delegation; Playwright + PTY direct use; holo-mem |
| **OpenAgent** | Min | — | — | — | — | ✓ | — | Holo-mem awareness; skill permission; high-level MCP awareness |
| **DevopsSpecialist** | Min | ✓ | — | — | — | — | ✓ | PTY for long-running infra; Context7 for CLI/config lookups |
| **BuildAgent** | Min | — | — | — | — | — | ✓ | PTY for long-running builds |
| **ContextScout** | Min | — | — | — | — | ✓ | — | Holo-mem for context-fact persistence |
| **ContextOrganizer** | Min | — | — | — | — | ✓ | — | Holo-mem for knowledge persistence |
| **TaskManager** | Min | — | — | — | — | ✓ | — | Holo-mem for task-state persistence |
| **CodeReviewer** | Min | ✓ | ✓ | — | — | — | — | Context7/GrepApp for verifying code-against-docs |
| **DocWriter** | Min | ✓ | — | — | — | — | — | Context7 for API-detail lookups during doc writing |
| **BatchExecutor** | Min | — | — | — | — | — | — | Nothing new — delegates to CoderAgent/FrontendSpecialist |

Vibeguard and DCP/compress are omitted from the matrix — both auto-manage via plugin config, no per-agent awareness needed.

---

## Phase 1 — Holographic-memory plugin cleanup

Clean `src/plugins/holographic-memory/` to ship only what EDAC needs.

- [ ] Remove `docs/` (16 files — research material from original project, not EDAC components)
- [ ] Remove `package-lock.json` (bun is the runtime, not npm)
- [ ] Remove root-level `holographic-memory-plugin.ts` (redundant copy of built bundle; canonical sources are `src/*.ts`, built output is `dist/`)
- [ ] Remove `node_modules/` (empty subdirs, gitignored)
- [ ] Keep: `src/`, `dist/` (gitignored but built locally), `scripts/build.cjs`, `skills/`, `config/`, `package.json`, `README.md`, `LICENSE`, `tsconfig.json`, `AGENTS.md`

## Phase 2 — Registry & install.sh integration

- [ ] Register `holographic-memory` as a plugin component in `registry.json` (path: `plugins/holographic-memory`, type: `plugin`)
- [ ] Register `opencode.jsonc`, `dcp.jsonc`, `vibeguard.config.json` as config components in `registry.json`
- [ ] Add all four new components to the Developer profile seed in `registry.json`
- [ ] Implement JSONC merge in `install.sh`: jq-based deep merge, target-wins for existing keys, strip comments + warn user, arrays merge+dedupe
- [ ] Implement plugin install in `install.sh`: copy `dist/holographic-memory.ts` → target `plugins/`, copy `skills/holographic-memory/SKILL.md` → target `skills/`, copy `config/holographic_memory.json` → target root
- [ ] Implement `dcp.jsonc` install: copy to target root (copy-or-skip — EDAC-specific file)
- [ ] Implement `vibeguard.config.json` install: copy to target root with merge (may already exist; deep merge, target wins, arrays dedupe)
- [ ] Verify `install.sh --dry-run` previews all new install behavior correctly

## Phase 3 — Agent updates (nomenclature + tool/plugin awareness)

### Comprehensive tier (5 agents — workflow changes)

#### ExternalScout (`src/agents/subagents/core/external-scout.md`)
- [ ] Remove dead Context7 skill references (permission allows for `.opencode/skills/context7/**`, `skill: ONLY context7`, "read context7 skill files" in body) — EDAC has no Context7 skill, only the MCP server
- [ ] Add DeepWiki + GrepApp MCP awareness alongside Context7
- [ ] Add workflow guidance for when to use each MCP: Context7 for library docs, DeepWiki for repo-specific questions, GrepApp for code-pattern search
- [ ] Position the specialized workflow (cache check → tech-stack detection → enhanced queries → filtering → persistence) as the deep-research value proposition — what working agents delegate *to* when they need more than a quick lookup
- [ ] Replace all technical tool names with nomenclature: "Resolve the library ID via Context7", "Query documentation via Context7", "Search GitHub via GrepApp", "Ask DeepWiki"

#### CoderAgent (`src/agents/subagents/code/coder-agent.md`)
- [ ] Refine `external_scout_mandatory` hard gate into a direct-vs-delegate decision tree:
  - Single API signature / function behavior → query Context7 directly
  - "Does this pattern exist in real code?" → search GrepApp directly
  - "How does this specific repo handle X?" → ask DeepWiki directly
  - Multi-library integration, tech-stack-aware docs, research needing persistence → delegate to ExternalScout
- [ ] Update workflow step 4 ("Check for External Packages") to include the direct-lookup path
- [ ] Update self-review check 4 ("ExternalScout Verification") to verify against direct-lookup results when applicable
- [ ] Add nomenclature for all MCP tools referenced

#### TestEngineer (`src/agents/subagents/code/test-engineer.md`)
- [ ] Add direct-lookup path for testing API verification:
  - Quick testing-API lookup → query Context7 directly
  - "How do others test this pattern?" → search GrepApp directly
  - Deep testing-framework research → delegate to ExternalScout
- [ ] Keep `mock_externals` rule unchanged — it governs test determinism, not research methodology
- [ ] Add nomenclature for all MCP tools referenced

#### FrontendSpecialist (`src/agents/subagents/development/frontend-specialist.md`)
- [ ] Refine `external_scout_for_ui_libs` into the same direct-vs-delegate decision tree:
  - Quick Tailwind class / UI-component lookup → query Context7 directly
  - "Does this UI pattern exist in real code?" → search GrepApp directly
  - Deep UI-library integration → delegate to ExternalScout
- [ ] Add Playwright workflow guidance — when to use browser automation for visual verification during the staged design workflow (Layout → Theme → Animation → Implement → Iterate); Playwright fits naturally into the "Iterate" stage for visual regression checks
- [ ] Add nomenclature for all MCP tools referenced

#### OpenCoder (`src/agents/core/open-coder.md`)
- [ ] Add awareness of all three research MCPs (Context7, GrepApp, DeepWiki) — so it knows what CoderAgent/TestEngineer/FrontendSpecialist can do directly and what ExternalScout does deeply
- [ ] Add Playwright awareness for direct browser interaction during debugging
- [ ] Add PTY awareness for running dev servers during development
- [ ] Add holographic-memory awareness for project knowledge persistence
- [ ] Add decision framework: when to use tools directly vs. when to delegate to a specialist
- [ ] Add `webfetch`, `websearch`, `question`, `skill` permission entries (currently missing)
- [ ] Add nomenclature for all MCP/plugin tools referenced

### Minimal tier (9 agents — capability-layer notes, no workflow change)

#### OpenAgent (`src/agents/core/open-agent.md`)
- [ ] Add holographic-memory awareness (store durable project facts, retrieve at task start)
- [ ] Add high-level awareness that research MCPs exist (so it knows what subagents can do, without using them directly)
- [ ] Add `skill` permission entry (allow with exp-*/int-* gates, matching opencode.jsonc template)

#### DevopsSpecialist (`src/agents/subagents/development/devops-specialist.md`)
- [ ] Add PTY awareness for long-running infrastructure processes (docker builds, terraform plans, k8s deployments)
- [ ] Add Context7 awareness for quick CLI/config lookups (terraform syntax, kubectl flags)

#### BuildAgent (`src/agents/subagents/code/build-agent.md`)
- [ ] Add PTY awareness for long-running builds

#### ContextScout (`src/agents/subagents/core/context-scout.md`)
- [ ] Add holographic-memory awareness for context-fact persistence

#### ContextOrganizer (`src/agents/subagents/core/context-organizer.md`)
- [ ] Add holographic-memory awareness for knowledge persistence

#### TaskManager (`src/agents/subagents/core/task-manager.md`)
- [ ] Add holographic-memory awareness for task-state persistence

#### CodeReviewer (`src/agents/subagents/code/code-reviewer.md`)
- [ ] Add Context7 + GrepApp awareness for verifying reviewed code against documented APIs

#### DocWriter (`src/agents/subagents/core/doc-writer.md`)
- [ ] Add Context7 awareness for looking up API details during documentation writing

#### BatchExecutor (`src/agents/subagents/core/batch-executor.md`)
- [ ] Nothing new — delegates to CoderAgent/FrontendSpecialist, which now have direct MCP access

### All 16 agent files
- [ ] Audit every agent file for technical tool-name references (e.g. `context7_resolve-library-id`, `fact_store`, `playwright_browser_navigate`); replace with nomenclature ("Resolve the library ID via Context7", "Store a fact via holographic memory", "Navigate to a URL via Playwright")

### Explicitly excluded
- No explicit compress/DCP instructions in any agent — the DCP plugin handles this globally via its config.
- No explicit vibeguard instructions in any agent — the plugin handles secret redaction automatically.

## Phase 4 — Validation & commit

- [ ] Run `bun run validate` (registry + components + context-links + context-refs + deps)
- [ ] Run `./install.sh --dry-run` to preview install behavior
- [ ] Verify merge logic with a test target (create a temp opencode.jsonc with conflicting keys, run install, confirm target wins + arrays dedupe + comments stripped)
- [ ] Commit only after explicit approval

---

## Implementation Strategy: Delegation & Batching

### Delegation rationale

The work splits along a structural line: **design judgment** (self-delegation) vs. **prompt-body craft** (PromptWriter). This follows SystemBuilder's Runtime Workflow rules:

- **Rule 1** — Parallelize independent inputs and outputs; serialise judgment. Agent files are independent outputs (different files, no cross-dependencies). The judgment about *what the patterns should be* is serial — established once in the comprehensive tier, then applied in the minimal tier.
- **Rule 2** — Match the subagent to the work's nature. Self-instantiation for parallel independent units of EDAC architectural work that need SystemBuilder's constitution; PromptWriter for prompt-body craft that needs its discipline but not SystemBuilder's design judgment.
- **Rule 3** — Frame each PromptWriter delegation with an explicit mode directive. All minimal-tier delegations use **refine-per-contract** mode (edit the target body to satisfy an approved contract).
- **Rule 4** — Persist a delegation contract to disk when findings must survive across invocations. Each minimal-tier PromptWriter delegation gets a `.tmp/{stub}/contract.md` so a greenfield invocation can bootstrap without re-discovery.

The distinction is: the comprehensive tier *changes how the agent operates* (workflow modifications, decision trees, procedural-layer changes) — that's architectural judgment needing the full constitution. The minimal tier *adds a capability-layer note* ("you have access to X; use it when appropriate") — the content is already determined by the matrix, and the craft is placement, framing, and nomenclature per the wiki conventions.

### Wiki references for the implementing session

- **`wiki/framework/prompt-design-principles.md`** — Principles 11 (delegation rules match execution model), 12 (integrate don't orphan), 14 (don't restate injected schema — teach usage, not descriptions). These govern *what* the awareness additions look like.
- **`wiki/harness/subagent-structure.md`** — Canonical subagent template (frontmatter → header+mission → rules → context → tiers → workflow → output). Capability-layer notes belong in the `<context>` block or a dedicated tools section, **not** in the workflow (the workflow is procedural; capability notes are declarative). This governs *where* the awareness additions go.
- **`wiki/harness/agent-frontmatter.md`** — Permission block changes (OpenAgent `skill` entry, OpenCoder missing `webfetch`/`websearch`/`question`/`skill` entries). Shorthand-only keys (`webfetch`, `websearch`, `question`) take action strings, not pattern objects. This governs *permission-block correctness*.
- **`wiki/framework/src-structure.md`** — File paths for all agent files. This governs *path resolution*.

### Batch plan

```
Batch 1 (me, direct)                    Batch 2 (parallel self-delegation ×5)
┌─────────────────────────┐              ┌────────────────────────────────┐
│ Phase 1: plugin cleanup │              │ ExternalScout (comp)            │
│ Phase 2: registry +     │              │ CoderAgent (comp)                │
│         install.sh      │              │ TestEngineer (comp)              │
└─────────────────────────┘              │ FrontendSpecialist (comp)        │
          │                              │ OpenCoder (comp)                 │
          │                              └────────────────────────────────┘
          │                                          │
          ├──────────────────────────────────────────┘
          │ (Batch 1 + Batch 2 run concurrently —
          │  agent files are independent of install.sh/registry)
          ▼
Batch 3 (parallel PromptWriter ×8, refine-per-contract)
┌────────────────────────────────────────────────────────┐
│ OpenAgent, DevopsSpecialist, BuildAgent,               │
│ ContextScout, ContextOrganizer, TaskManager,           │
│ CodeReviewer, DocWriter                                 │
│ (each with .tmp/{stub}/contract.md)                     │
└────────────────────────────────────────────────────────┘
          │ (waits for Batch 2 — contracts reference
          │  patterns established by comprehensive tier)
          ▼
Batch 4 (me, direct)
┌────────────────────────────────────────────────────────┐
│ Nomenclature audit (grep all 16 files for technical     │
│   tool names)                                           │
│ Validation (bun run validate, install.sh --dry-run,    │
│   merge test)                                           │
│ Commit (after explicit approval)                       │
└────────────────────────────────────────────────────────┘
```

### Batch 1 — Phase 1 + Phase 2 (me, direct)

**Why me**: Plugin cleanup is mechanical file deletion. Registry + install.sh is architectural but single-mind work — the merge logic, plugin registration, and install-path conventions need one coherent understanding of the harness. No delegation value; delegation would fragment the judgment.

**Why concurrent with Batch 2**: Agent files are independent of `install.sh` and `registry.json`. The self-delegations edit agent markdown; I edit shell scripts and JSON. No file conflicts.

### Batch 2 — Comprehensive tier (parallel self-delegation ×5)

**Why self-delegation**: Each comprehensive-tier agent needs design judgment — refining a hard gate into a decision tree, adding a new MCP workflow, integrating Playwright into a staged workflow. Per Rule 2, this is "parallel independent units of EDAC architectural work that need your constitution." Each self-instantiation carries the full SystemBuilder constitution and works from the TODO's detailed spec.

**Why parallel**: The 5 agents are independent files. The nomenclature and decision-tree patterns are already specified in the TODO matrix — the self-delegations implement those patterns, they don't derive them. No serial dependency.

**What each self-delegation receives**:
- The TODO section for its agent (the spec)
- The tool-awareness matrix (the context)
- Instructions to follow `wiki/harness/subagent-structure.md` (the template) and `wiki/framework/prompt-design-principles.md` Principles 11, 14 (the conventions)
- Instructions to handle nomenclature for its own agent (no separate audit pass needed per agent)

### Batch 3 — Minimal tier (parallel PromptWriter ×8, refine-per-contract)

**Why PromptWriter**: Each minimal-tier agent needs a capability-layer note — "you have access to X; use it when appropriate." The content is determined by the matrix; the craft is placement (per `subagent-structure.md`), framing (per Principle 14 — usage guidance, not tool descriptions), and nomenclature. This is prompt-body discipline, not design judgment.

**Why it waits for Batch 2**: The contracts reference patterns established by the comprehensive tier — specifically, how ExternalScout implements MCP nomenclature and how CoderAgent structures its direct-vs-delegate decision tree. The minimal-tier agents that reference MCP tools (CodeReviewer, DocWriter, DevopsSpecialist, OpenAgent) should be consistent with those patterns. Writing the contracts before the comprehensive tier is done would describe a state that doesn't yet exist (Rule 4: invalidate contracts when the target source has been modified since the contract was written).

**Contract per agent** (`.tmp/{stub}/contract.md`):
- **target path**: the agent file
- **mode**: refine-per-contract
- **scope**: the specific capability-layer note(s) from the matrix
- **negative boundary**: do not modify workflow, rules, or tiers (unless a permission-block entry is explicitly specified in the TODO)
- **standards**: `wiki/harness/subagent-structure.md` (template); `wiki/framework/prompt-design-principles.md` Principle 14 (usage guidance, not descriptions); nomenclature per TODO
- **prior-findings path**: reference to the relevant comprehensive-tier agent file (for nomenclature consistency)
- **exit criteria**: capability-layer note added, nomenclature compliant, no technical tool names, permission-block entries added if specified

**BatchExecutor is excluded** — it needs no changes (delegates to CoderAgent/FrontendSpecialist, which now have direct MCP access).

### Batch 4 — Nomenclature audit + validation (me, direct)

**Why me**: The nomenclature audit is a cross-cutting grep across all 16 files — a single mind's verification that no technical tool names survived. Validation (`bun run validate`, `install.sh --dry-run`, merge test) is cross-cutting and needs the full system view. No delegation value.

---

## Notes for the implementing session

- `src/plugins/` is currently untracked (`?? src/plugins/` in git status). The cleanup in Phase 1 determines what gets tracked.
- `node_modules/` and `dist/` are gitignored — `dist/holographic-memory.ts` won't be tracked but is built locally via `node scripts/build.cjs`.
- `bun.lock` is intentionally committed; do not add `package-lock.json`.
- The mirror source dir is defined in two places that must stay in sync: `install.sh` `SRC_ROOT` ("src") and `scripts/registry/dependency-resolution.ts` `MIRROR_DIR` ("src"). If Phase 2 changes how plugins are mirrored, check both.
- `install.sh` rewrites `.opencode/context/` references to absolute install-dir paths only for global installs (not when `--install-dir` is a local `.opencode`). The new config/plugin install logic should follow the same convention if path rewriting applies.
- MCP tools are provisioned globally via `opencode.jsonc` — they're available to all agents by default unless explicitly denied in the agent's permission block. Adding MCP awareness is a body-text change, not a permission-block change (unless denying an agent access to a specific MCP).
- The current architecture forces ALL external research through ExternalScout (CoderAgent's `external_scout_mandatory`, FrontendSpecialist's `external_scout_for_ui_libs`). The comprehensive-tier changes replace these hard gates with direct-vs-delegate decision trees, eliminating the round-trip for trivial lookups while preserving ExternalScout for deep research.
- Principle 14 (Don't Restate Injected Schema): awareness additions are usage guidance (when to use directly vs. when to delegate), not tool descriptions. The harness already injects the tool schemas.
