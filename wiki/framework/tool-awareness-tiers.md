---
title: Tool Awareness Tiers
type: concept
tags: [tool-awareness, mcp, plugins, agent-design, two-tier-model]
created: 2026-08-14
updated: 2026-08-14
sources: []
status: stable
---

# Tool Awareness Tiers (Minimal vs Comprehensive)

EDAC provisions MCP servers and plugins **globally** via [Global Config](../harness/global-config.md) — every agent has access by default, with no per-agent permission entries. The question is how agent body text handles this access: does the tool merely exist as an option, or does it change how the agent operates?

> **Position in the knowledge framework.** This page is the *tool-awareness specialisation* of the general [Instruction Knowledge Tiers](instruction-knowledge-tiers.md) distinction. The general frame distinguishes three knowledge categories (ambient-knowledge / preference-guidance / framework-facts) that govern when to instruct, how to frame, and how to audit permissions. This page covers the tool-awareness specialisation: how body text handles globally-provisioned tools on the *integration-depth* axis (Minimal vs Comprehensive). The two axes are orthogonal — integration depth (this page) and knowledge category (the general frame) answer different questions and compose rather than nest.

The answer is tiered. The distinction is structural, not quantitative:

## The Two Tiers

### Minimal — Capability-Layer Note

> "You have access to X; use it when appropriate."

The agent's existing workflow stays intact. The tool is an additional option within it. This is a **declarative** addition — a note in the capability layer (the `<context>` block or a dedicated tools section), not in the workflow (which is procedural).

**Where it lives**: the `<context>` block or a dedicated `## Capabilities` section, per [Subagent Structure](../harness/subagent-structure.md). Never in the workflow.

**What it contains**: usage guidance — *when* to use the tool, not *what* the tool is. The harness injects the tool schema; the agent does not need a description (see [Prompt Design Principles](../framework/prompt-design-principles.md) Principle 14: Don't Restate Injected Schema).

### Comprehensive — Procedural-Layer Change

The agent's workflow, rules, or decision trees are **modified**. The tool doesn't just exist — it changes *how the agent operates*. This is an **architectural** change requiring design judgment.

**Where it lives**: the workflow, rules, or decision trees — wherever the procedural change belongs.

**What it contains**: a decision tree or workflow step that routes between direct use and delegation, with the routing criteria keyed to query shape.

## Guiding Principles

- **Principle 11 (Delegation Rules Must Match Execution Model)**: if the execution model could use a direct path, the delegation rule must reflect that — otherwise the rule forces a round-trip the model didn't need. This is the principle that replaced EDAC's hard gates (`external_scout_mandatory`, `external_scout_for_ui_libs`) with direct-vs-delegate decision trees.
- **Principle 14 (Don't Restate Injected Schema)**: teach *how to use* a tool, not *what it is* — the harness injects the schema, so awareness additions are usage guidance (when to use directly vs. when to delegate), not tool descriptions.

See [Prompt Design Principles](../framework/prompt-design-principles.md) for the full principle set.

## Nomenclature

All tool references in agent body text use **natural language**, not technical tool names. The harness injects tool schemas with their API names; the agent body should not repeat them.

| Technical name | Nomenclature |
|---|---|
| `context7_resolve-library-id` | "Resolve the library ID via Context7" |
| `context7_query-docs` | "Query documentation via Context7" |
| `grepapp_searchGitHub` | "Search GitHub via GrepApp" |
| `deepwiki_ask_question` | "Ask DeepWiki" |
| `playwright_browser_navigate` | "Navigate to a URL via Playwright" |
| `fact_store` | "Store a fact via holographic memory" |
| `pty_spawn` | "Spawn a PTY session" |

*Why:* the agent body is a runtime prompt, not an API reference. Natural language guides usage; technical names add noise without adding signal (the schema is already injected).

## The Awareness Matrix

The matrix below shows which tier applies to which agent for which tool. It is the authoritative reference for EDAC's 16-agent roster.

| Agent | Tier | Context7 | GrepApp | DeepWiki | Playwright | Holo-mem | PTY | What changes |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **ExternalScout** | Comp | ✓ | ✓ | ✓ | — | — | — | Full MCP workflow; 3-MCP selection by query shape |
| **CoderAgent** | Comp | ✓ | ✓ | ✓ | — | — | — | Hard gate → direct-vs-delegate decision tree |
| **TestEngineer** | Comp | ✓ | ✓ | — | — | — | — | Direct-lookup path for testing API verification |
| **FrontendSpecialist** | Comp | ✓ | ✓ | — | ✓ | — | — | Decision tree + Playwright in Iterate stage |
| **OpenCoder** | Comp | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All-MCP awareness for delegation; direct-use tools; decision framework |
| **OpenAgent** | Min | — | — | — | — | ✓ | — | Holo-mem awareness; high-level MCP awareness |
| **DevopsSpecialist** | Min | ✓ | — | — | — | — | ✓ | PTY for long-running infra; Context7 for CLI lookups |
| **BuildAgent** | Min | — | — | — | — | — | ✓ | PTY for long-running builds |
| **ContextScout** | Min | — | — | — | — | ✓ | — | Holo-mem for context-fact persistence |
| **ContextOrganizer** | Min | — | — | — | — | ✓ | — | Holo-mem for knowledge persistence |
| **TaskManager** | Min | — | — | — | — | ✓ | — | Holo-mem for task-state persistence |
| **CodeReviewer** | Min | ✓ | ✓ | — | — | — | — | Context7/GrepApp for verifying code-against-docs |
| **DocWriter** | Min | ✓ | — | — | — | — | — | Context7 for API-detail lookups |
| **BatchExecutor** | Min | — | — | — | — | — | — | Nothing — delegates to agents that now have direct MCP |

DCP/compress and Vibeguard are omitted — both auto-manage via plugin config, no per-agent awareness needed (see [Plugin Provisioning](../harness/plugin-provisioning.md)).

## Related

- [Instruction Knowledge Tiers](instruction-knowledge-tiers.md) — the general knowledge-category distinction (ambient-knowledge / preference-guidance / framework-facts) of which this page is the tool-awareness specialisation.
- [Prompt Design Principles](../framework/prompt-design-principles.md) — Principles 11 (delegation rules match execution model) and 14 (don't restate injected schema).
- [Subagent Structure](../harness/subagent-structure.md) — where capability-layer notes belong (context block, not workflow).
- [Global Config](../harness/global-config.md) — how MCPs and plugins are provisioned globally.
- [MCP Provisioning](../harness/mcp-provisioning.md) — the 4 MCP servers.
- [Plugin Provisioning](../harness/plugin-provisioning.md) — the 3 plugins, including holographic-memory.
- [Permission Model](../harness/permission-model.md) — why no per-agent permission entries are needed for MCPs/plugins.
