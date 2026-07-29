# Wiki TODO

Cross-session build plan for the EDAC wiki workflow.

## Done
- [x] Wiki init: SCHEMA.md, index.md, log.md, TODO.md (2026-07-29)
- [x] First ingest loop: oac-standards batch — 7 pages (framework x3, harness x3, research x1) + meta aggregation (2026-07-29)
  - Resolved permission-key contradiction via upstream research (canonical 15 keys: question/list/todowrite valid; todoread/codesearch invalid)

## Next
- [ ] Define ResearchAgent subagent (`.opencode/agents/`) — external research → `sources/`
- [x] Define WikiJanitor subagent — ingest + lint (`.opencode/agents/subagents/wiki-janitor.md`)
- [ ] Define WikiLibrarian subagent — query/synthesis
- [ ] Establish lint cadence (post-ingest lint pass)
- [ ] Ingest loop against `src/` (verify an EDAC convention via the wiki)

## Later / optional
- [ ] Promote local subagents into `src/` components (deferred session)
- [ ] Add CHANGELOG.md only if the wiki is ever published as a versioned product

## Verification items flagged during ingest (resolved 2026-07-29)
- OAC directory layout (`.opencode/agents/subagents/{code,core,system-builder}/`) — EDAC's `src/agents/subagents/` mirrored this internally with tiers `core`/`code`/`development`/`system-builder`; only the root differed (`src/agents/` vs `.opencode/agents/`). **`system-builder` is NO LONGER a tier — the `src/agents/subagents/system-builder/` directory was deleted on 2026-07-29.** Verified against `src/`.
- Agent metadata store: OAC's `.opencode/config/agent-metadata.json` → EDAC's `src/metadata.json` (added 2026-07-29, uncommitted). `registry.json` is at the **repo root**, not `src/`. Corrected across the wiki.
- OAC example agents `open-coder.md` / `open-agent.md` **do exist** in EDAC at `src/agents/core/` — the earlier "do not exist" flag was wrong; references are valid.

## Deferred operational tasks
- [ ] Clean `src/metadata.json`: for each entry, confirm a `.md` file exists on disk at the path derived from `category`+`id` (e.g. `category: subagents/code`, `id: coder-agent` → `src/agents/subagents/code/coder-agent.md`). Remove orphaned entries with no file. Rule: *if there is no file, the metadata is wrong.*
- [ ] `src/metadata.json` still contains orphaned entries for the deleted `system-builder` agents (`context-organizer`, `agent-generator`, `command-creator`, `domain-analyzer`, `workflow-designer`). Per the cleaning rule *if there is no .md file on disk, the metadata is wrong*, these entries must be removed. **Deferred** (metadata cleaning is deferred).
