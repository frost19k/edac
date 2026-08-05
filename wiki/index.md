# Wiki Index

<!-- Updated on every ingest by SystemBuilder. Group entries by directory. -->

## framework/
- [Epistemic Standards](framework/epistemic-standards.md) — the 7-principle epistemic constitution for agents (probe, evidence gradients, intent-vs-reality, uncertainty, contradiction, sensitive output, pre-conclusion).
- [Prompt Design Principles](framework/prompt-design-principles.md) — 13 agent-prompt design principles, anti-patterns, and three-tier approval gates.
- [Versioning](framework/versioning.md) — three coexisting versions: repo semver, registry schema_version, per-agent component version.
- [src/ Package Structure](framework/src-structure.md) — EDAC's authoritative on-disk layout; the source of truth for all path assertions.

## harness/
- [Agent Frontmatter](harness/agent-frontmatter.md) — valid OpenCode frontmatter fields, display-name vs file-name, deprecated keys, common mistakes.
- [Subagent Structure](harness/subagent-structure.md) — standard subagent file template, tiers, rules, validation checklist.
- [Permission Model](harness/permission-model.md) — consolidated: verified 15-key set, evaluation order, agent-type patterns, security patterns.

## research/
- [OpenCode Permission Model](research/opencode-permission-model.md) — upstream-verified canonical permission keys; resolves the OAC source contradiction.

## sources/
<!-- one cited doc per stub under sources/; not catalogued here -->

## Routing (folded from oac-standards/navigation.md)
- **Creating new agents**: load `harness/agent-frontmatter.md` → `harness/subagent-structure.md` → reference existing agents in `.opencode/agents/`.
- **Fixing existing agents**: load `harness/agent-frontmatter.md` (find invalid fields) → move OAC metadata to `registry.json` → validate YAML.
- **Code reviews**: check frontmatter validity (`harness/agent-frontmatter.md`) + structure compliance (`harness/subagent-structure.md`).
