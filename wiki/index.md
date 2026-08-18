# Wiki Index

<!-- Updated on every ingest by SystemBuilder. Group entries by directory. -->

## framework/
- [Epistemic Standards](framework/epistemic-standards.md) — the 7-principle epistemic constitution for agents (probe, evidence gradients, intent-vs-reality, uncertainty, contradiction, sensitive output, pre-conclusion). Now enriched with empirical citations from anti-fabrication and research-completeness research; Principle 3 refined with logical-vs-state-inference distinction.
- [Prompt Design Principles](framework/prompt-design-principles.md) — 17 agent-prompt design principles, anti-patterns, and three-tier approval gates. Enriched with deontological-framing and mechanisms-over-declarations findings; principles 15–17 (temporal scope, failure-loop detection, mode switching) distilled from external framework analysis. Principle 6 enriched with DKB finding (modal verbs over-read as obligations) and the Tier 2/Tier 3 tension resolution; Principle 14 corrected to split schema-injected tools from ambient-knowledge utilities.
- [Mechanistic Framing](framework/mechanistic-framing.md) — agents are stateless text-processing functions, not humans; anti-anthropomorphism discipline for agent definition and context files (anti-patterns, mechanistic framing, EDAC's identity-first position).
- [Anti-Fabrication Mechanisms](framework/anti-fabrication.md) — the compliance gap, the G3 Cliff, and tiered anti-fabrication techniques ranked by production impact; the "mechanisms over declarations" meta-principle. Includes the topical-engagement-vs-epistemic-abstention separation and the G3-risk analysis of "Never refuse" phrasing.
- [Research Completeness](framework/research-completeness.md) — the "when to stop" failure class: illusory completion, satisfaction of search, premature confidence; distinguishing "I found X" from "X is all there is to find."
- [Versioning](framework/versioning.md) — three coexisting versions: repo semver, registry schema_version, per-agent component version.
- [src/ Package Structure](framework/src-structure.md) — EDAC's authoritative on-disk layout; the source of truth for all path assertions. **Includes "Packaging vs. runtime location"** — `src/context/` is packaging-only; agents' `.opencode/context/` strings are correct for the installed location, not stale.
- [Tool Awareness Tiers](framework/tool-awareness-tiers.md) — the Minimal vs Comprehensive model for how agent body text handles globally-provisioned tools (MCPs, plugins). Includes the nomenclature principle and the 16-agent awareness matrix. Tool-awareness specialisation of the Instruction Knowledge Tiers distinction.
- [Instruction Knowledge Tiers](framework/instruction-knowledge-tiers.md) — the three knowledge categories (ambient-knowledge / preference-guidance / framework-facts) that govern when to instruct, how to frame, and how to audit permissions. Resolves the deontological-vs-preference tension (Tier 3 deontological, Tier 2 "Prefer X unless Y") and corrects Principle 14 (ambient-knowledge case).

## harness/
- [Agent Frontmatter](harness/agent-frontmatter.md) — valid OpenCode frontmatter fields, display-name vs file-name, deprecated keys, common mistakes.
- [Subagent Structure](harness/subagent-structure.md) — standard subagent file template, tiers, rules, validation checklist.
- [Permission Model](harness/permission-model.md) — consolidated: verified 14-key set, granular-vs-shorthand format spec, evaluation order, agent-type patterns, security patterns, bash allow-list conventions (file-operation duplicate `cat` excluded; pipe-capable duplicates `grep`/`head`/`tail`/`sed`/`awk`/`tee`/`ls`/`find` permitted, `find` destructive modes denied), bash working-directory discipline (bare relative paths from session CWD; `external_directory` as out-of-project gate). §b enriched with wildcard matching semantics (full-string anchoring, trailing ` *` optional-aware, `cmd *` vs `cmd*` poka-yoke, sort-by-length evaluation). §c enriched with permission-calibration-by-knowledge-tier guidance.
- [Global Config Template](harness/global-config.md) — the `opencode.jsonc` template: permission floor, MCP/plugin provisioning, install-time merge.
- [MCP Provisioning](harness/mcp-provisioning.md) — the 4 MCP servers (Context7, GrepApp, DeepWiki, Playwright) provisioned globally via the `mcp:` block.
- [Plugin Provisioning](harness/plugin-provisioning.md) — the 4 plugins (DCP, Vibeguard, PTY, Holographic-memory): auto-managed vs per-agent awareness, configs, build-at-install.
- [Install Merge Logic](harness/install-merge.md) — install.sh config merge (deep merge, target wins, JSONC strip), plugin build-at-install, type-specific dispatch.

## research/
- [OpenCode Permission Model](research/opencode-permission-model.md) — upstream-verified canonical permission keys; resolves the OAC source contradiction. Includes wildcard matching semantics verified against `wildcard.ts` (full-string anchoring, trailing ` *` optional-aware, `cmd *` vs `cmd*` poka-yoke, sort-by-length evaluation).

## sources/
<!-- transient: cited docs live here during research, removed after ingestion; not catalogued -->

## Routing (folded from oac-standards/navigation.md)
- **Creating new agents**: load `harness/agent-frontmatter.md` → `harness/subagent-structure.md` → reference existing agents in `.opencode/agents/`.
- **Fixing existing agents**: load `harness/agent-frontmatter.md` (find invalid fields) → move OAC metadata to `registry.json` → validate YAML.
- **Code reviews**: check frontmatter validity (`harness/agent-frontmatter.md`) + structure compliance (`harness/subagent-structure.md`).
