# Wiki TODO

Cross-session build plan for the EDAC wiki workflow.

## Done
- [x] Wiki init: SCHEMA.md, index.md, log.md, TODO.md (2026-07-29)
- [x] First ingest loop: oac-standards batch — 7 pages (framework x3, harness x3, research x1) + meta aggregation (2026-07-29)
  - Resolved permission-key contradiction via upstream research (canonical 15 keys: question/list/todowrite valid; todoread/codesearch invalid)

## Next
- [ ] Define ResearchAgent subagent (`.opencode/agents/`) — external research → `sources/`
- [ ] Define WikiJanitor subagent — ingest + lint
- [ ] Define WikiLibrarian subagent — query/synthesis
- [ ] Establish lint cadence (post-ingest lint pass)
- [ ] Ingest loop against `src/` (verify an EDAC convention via the wiki)

## Later / optional
- [ ] Promote local subagents into `src/` components (deferred session)
- [ ] Add CHANGELOG.md only if the wiki is ever published as a versioned product

## Verification items flagged during ingest
- OAC directory layout (`.opencode/agents/subagents/{code,core,system-builder}/`) may differ from EDAC's actual layout — verify before treating as authoritative.
- OAC `agent-metadata.json` location (`.opencode/config/agent-metadata.json`) likely differs from EDAC's `src/registry.json` + `src/manifest.json` — verify.
- OAC example agents (`open-coder.md`, `open-agent.md`) referenced by epistemic-standards source do not exist in EDAC — page generalized to OAC lineage.
