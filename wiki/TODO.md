# Wiki TODO

Cross-session build plan for the EDAC wiki workflow.

## Done
- [x] Wiki init: SCHEMA.md, index.md, log.md, TODO.md (2026-07-29)
- [x] First ingest loop: oac-standards batch — 7 pages (framework x3, harness x3, research x1) + meta aggregation (2026-07-29)
  - Resolved permission-key contradiction via upstream research (canonical 14 keys: question/todowrite valid; todoread/codesearch/list invalid)

## Next
- [x] ~~Define ResearchAgent / WikiJanitor / WikiLibrarian subagents~~ — **superseded (2026-08-04):** research subagents retired; SystemBuilder internalizes all wiki functions inline under Wiki Stewardship. ExternalScout is the external research arm.
- [ ] Establish lint cadence (post-ingest lint pass)
- [ ] Ingest loop against `src/` (verify an EDAC convention via the wiki)

## Later / optional
- [ ] Add CHANGELOG.md only if the wiki is ever published as a versioned product

## Verification items flagged during ingest (resolved 2026-07-29)
- OAC directory layout (`.opencode/agents/subagents/{code,core,system-builder}/`) — EDAC's `src/agents/subagents/` mirrored this internally with tiers `core`/`code`/`development`/`system-builder`; only the root differed (`src/agents/` vs `.opencode/agents/`). **`system-builder` is NO LONGER a tier — the `src/agents/subagents/system-builder/` directory was deleted on 2026-07-29.** Verified against `src/`.
- Agent metadata store: OAC's `.opencode/config/agent-metadata.json` → EDAC's `registry.json` (repo root). `src/metadata.json` and `src/manifest.json` are deprecated — `registry.json` is the sole source of truth; no script reads them. Corrected across the wiki.
- OAC example agents `open-coder.md` / `open-agent.md` **do exist** in EDAC at `src/agents/core/` — the earlier "do not exist" flag was wrong; references are valid.

## Lint findings (2026-07-30, full mechanical pass — SystemBuilder lint)
- [ ] **Frontmatter enum violation** — `framework/src-structure.md` and `harness/permission-model.md` both use `type: reference`, which is NOT in the SCHEMA enum `{entity, concept, comparison, summary, source-note}`. Fix by either (a) changing both to a valid type (e.g. `concept`/`summary`), or (b) extending SCHEMA's enum to include `reference`. Owned by the content-page lint agents; reported as proposal.
 - [x] **Contradiction: non-existent `repo/` context dir** — `framework/versioning.md:29` lists `repo/` as an example context-tree directory (`core/`, `repo/`, etc.). EDAC's `src/context/` contains `web/`, `core/`, `intl/`, `dev/` (per `framework/src-structure.md` + live `src/`). `repo/` does not exist. Corrected to `dev/` (see Remediation line 36).
- [ ] **Gap candidate: layered architecture** — `framework/epistemic-standards.md:57` references "EDAC's layered design" but no `framework/layered-architecture.md` page exists (SCHEMA.md example also links it). Candidate for the ingest queue.
- [ ] **Graph completeness: `src-structure.md` orphan-ish** — `framework/src-structure.md` has zero inbound links from sibling generated pages (only catalogued in `index.md`/`SCHEMA.md`). Not a hard orphan (cross-checked vs index), but add a sibling inbound link (e.g. from `versioning.md` or `agent-frontmatter.md`) for graph traversal. Owned by content-page lint agent; reported as proposal.
- [ ] **Bidirectional asymmetry (warn, not fail)** — `versioning.md` links out to `agent-frontmatter`/`subagent-structure`/`permission-model` with no back-links; `opencode-permission-model.md` is linked by `agent-frontmatter`+`permission-model` but links back to neither. Allowed for hubs; reconcile if desired.

## Deferred operational tasks
- [x] ~~Clean `src/metadata.json`~~ — **resolved (2026-08-05):** `registry.json` is now the sole source of truth. `src/metadata.json` is deprecated; no script reads it. Per-component `version` and `author` fields were dropped.
- [x] ~~`src/metadata.json` orphaned `system-builder` entries~~ — **resolved (2026-08-05):** ghost entries were purged from `src/metadata.json` (commit `ba29a07`); the file itself is now deprecated.

## Remediation (2026-07-30, A+B applied)
- [x] Frontmatter enum violation — `src-structure.md` fixed (Agent 1, → `concept`); `permission-model.md` fixed (→ `concept`). SCHEMA enum left unchanged (pages conformed rather than extending the enum).
- [x] Contradiction: non-existent `repo/` context dir — `versioning.md:29` corrected to `dev/`.
- [x] `versioning.md` `## Cross-links` → `## Related` (protocol uniformity).
- [x] Harness dedup (Bundle B) — sensitive-file deny block consolidated to one canonical block in `permission-model.md` §d; grep-leak explanation collapsed; `agent-frontmatter.md` 14-key list + OAC-metadata field list replaced with cross-links. ~58 lines removed across the two pages.
 - [x] `src-structure.md` inbound-link gap — closed (`agent-frontmatter.md` now cross-links `src-structure.md` at 2 points).
  - [x] **OAC-boilerplate / non-existent-dir cleanup in `src/context/` (2026-08-08)** — All `intelligence/` → `intl/`, `repo/` → `dev/`, `OAC` → `EDAC`, `OPENCODE_INSTALL_DIR` → `EDAC_INSTALL_DIR` across `src/context/` (navigation.md, intl/*, core/standards/*, core/context-system/*, core/system/context-paths.md). Removed dead cross-links to non-existent files (`agent-frontmatter.md`, `adding-agent-basics.md` under `repo/`). Principle: agents have no cross-session memory — context files must reference only resources that exist *now*. See `framework/mechanistic-framing.md` (broadened from the original hygiene concept to full anti-anthropomorphism discipline).
  - [x] **Anti-anthropomorphism + compliance research ingestion (2026-08-13)** — `framework/llm-context-hygiene.md` deleted (concept was anti-anthropomorphism, not "context hygiene"); replaced by `framework/mechanistic-framing.md` (broadened to full stateless-text-processing-function discipline). Two source files (`sources/compliance-research.md`, `sources/behavioural-conventions.md`) ingested into `framework/anti-fabrication.md` + `framework/research-completeness.md`. `epistemic-standards.md` and `prompt-design-principles.md` enriched with empirical citations (71% finding, deontological-framing 27–64%, mechanisms-over-declarations). ExternalScout research filed as `sources/anti-anthropomorphism-research.md`. **Sources removed after ingestion** (2026-08-13) — sources are transient; ingested pages are the durable record. SCHEMA.md updated to codify the transient-sources convention.
  - [ ] Gap: `framework/layered-architecture.md` — referenced at `epistemic-standards.md:57`; create via ingest queue.
- [ ] Gap: EDAC decisions D2/D3 — referenced across `permission-model.md` / `subagent-structure.md`; document or catalog.
- [x] ~~`src/metadata.json` orphaned `subagents/system-builder` entries~~ — **resolved (2026-08-05):** purged in commit `ba29a07`; `src/metadata.json` is now deprecated.
