# Wiki Log

<!-- Append-only. Entry format: ## [YYYY-MM-DD] <op> | <Title>
     <op> ∈ init | research | ingest | query | lint -->

## [2026-07-29] init | Wiki scaffolding created (SCHEMA.md, index.md, log.md, TODO.md)
## [2026-07-29] research | OpenCode permission model fetched & verified (opencode.ai/docs) — resolved canonical 15-key set, corrected 3 contradictory OAC sources
## [2026-07-29] ingest | oac-standards framework batch — epistemic-standards, prompt-design-principles, versioning
## [2026-07-29] ingest | oac-standards harness batch — agent-frontmatter, subagent-structure, consolidated permission-model (D2)
## [2026-07-29] ingest | wiki meta aggregation — index.md (navigation routing folded per D4), log.md, TODO.md
## [2026-07-29] init | EDAC ↔ OAC relationship note added to SCHEMA.md — EDAC inspired by OAC, no obligation to follow OAC specifics; OAC ≈ src/; src/ is focused derivation + enhancement
## [2026-07-29] lint | OAC path corrections — `.opencode/config/agent-metadata.json` → `src/metadata.json`; `src/registry.json` → `registry.json` (repo root); added `framework/src-structure.md` as the source-of-truth layout page
## [2026-07-30] lint | full mechanical — parallel lens (Mechanical Integrity). 8 generated pages examined. OAC-path tyranny: PASS (all 3 greps clean in content scope; matches only in exempt meta/correction files). Cross-ref: 0 broken links; 1 graph-completeness gap (src-structure.md has no sibling inbound); 1 gap candidate (layered-architecture, no page). Frontmatter: 2 violations (`type: reference` in src-structure.md + permission-model.md — not in SCHEMA enum). Contradiction: versioning.md:29 cites non-existent `repo/` context dir. Stale claims: none. Secret scan: clean. Content-page fixes reported as proposals (owned by sibling parallel agents).
## [2026-07-30] lint | dedup/redundancy lens (framework scope) — 4 framework fixes applied (prompt-design-principles cross-link dedups + src-structure type→concept); harness dedup proposed (F2–F4).
## [2026-07-30] lint | inconsistency & contradiction (parallel lens) — harness scope; fixed metadata-field (author) + OAC-path inconsistencies in harness/; flagged framework/ versioning `repo/` + prompt-design metadata-field gaps.
## [2026-07-30] lint | optimisation & conciseness (parallel lens, WikiJanitor) — flagged harness dedup, versioning `## Cross-links`→`## Related`, and gap candidates (layered-architecture, D2/D3).
## [2026-07-30] lint | remediation A+B applied — permission-model type→concept; versioning `repo/`→`dev/` + `## Cross-links`→`## Related`; harness dedup (Bundle B) delegated to WikiJanitor; src-structure inbound gap closed via agent-frontmatter cross-links; meta reconciled.
## [2026-07-30] edit | permission-model + agent-frontmatter + subagent-structure — CIA/mission calibration, temp range, sensitive-file all-agents, dangerous-command set
## [2026-07-30] edit | follow-up fixes — removed duplicate §f checklist item (permission-model), corrected Write-Enabled prose to read/edit/grep, updated subagent-structure provenance note to temp 0.2-0.3
