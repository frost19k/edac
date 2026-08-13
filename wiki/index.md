# Wiki Index

<!-- Updated on every ingest by SystemBuilder. Group entries by directory. -->

## framework/
- [Epistemic Standards](framework/epistemic-standards.md) — the 7-principle epistemic constitution for agents (probe, evidence gradients, intent-vs-reality, uncertainty, contradiction, sensitive output, pre-conclusion). Now enriched with empirical citations from anti-fabrication and research-completeness research; Principle 3 refined with logical-vs-state-inference distinction.
- [Prompt Design Principles](framework/prompt-design-principles.md) — 17 agent-prompt design principles, anti-patterns, and three-tier approval gates. Enriched with deontological-framing and mechanisms-over-declarations findings; principles 15–17 (temporal scope, failure-loop detection, mode switching) distilled from external framework analysis.
- [Mechanistic Framing](framework/mechanistic-framing.md) — agents are stateless text-processing functions, not humans; anti-anthropomorphism discipline for agent definition and context files (anti-patterns, mechanistic framing, EDAC's identity-first position).
- [Anti-Fabrication Mechanisms](framework/anti-fabrication.md) — the compliance gap, the G3 Cliff, and tiered anti-fabrication techniques ranked by production impact; the "mechanisms over declarations" meta-principle. Includes the topical-engagement-vs-epistemic-abstention separation and the G3-risk analysis of "Never refuse" phrasing.
- [Research Completeness](framework/research-completeness.md) — the "when to stop" failure class: illusory completion, satisfaction of search, premature confidence; distinguishing "I found X" from "X is all there is to find."
- [Versioning](framework/versioning.md) — three coexisting versions: repo semver, registry schema_version, per-agent component version.
- [src/ Package Structure](framework/src-structure.md) — EDAC's authoritative on-disk layout; the source of truth for all path assertions. **Includes "Packaging vs. runtime location"** — `src/context/` is packaging-only; agents' `.opencode/context/` strings are correct for the installed location, not stale.

## harness/
- [Agent Frontmatter](harness/agent-frontmatter.md) — valid OpenCode frontmatter fields, display-name vs file-name, deprecated keys, common mistakes.
- [Subagent Structure](harness/subagent-structure.md) — standard subagent file template, tiers, rules, validation checklist.
- [Permission Model](harness/permission-model.md) — consolidated: verified 15-key set, granular-vs-shorthand format spec, evaluation order, agent-type patterns, security patterns.

## research/
- [OpenCode Permission Model](research/opencode-permission-model.md) — upstream-verified canonical permission keys; resolves the OAC source contradiction.

## sources/
<!-- transient: cited docs live here during research, removed after ingestion; not catalogued -->

## Routing (folded from oac-standards/navigation.md)
- **Creating new agents**: load `harness/agent-frontmatter.md` → `harness/subagent-structure.md` → reference existing agents in `.opencode/agents/`.
- **Fixing existing agents**: load `harness/agent-frontmatter.md` (find invalid fields) → move OAC metadata to `registry.json` → validate YAML.
- **Code reviews**: check frontmatter validity (`harness/agent-frontmatter.md`) + structure compliance (`harness/subagent-structure.md`).
