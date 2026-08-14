---
title: MCP Provisioning
type: concept
tags: [mcp, opencode-jsonc, global-config, tool-awareness, context7, grepapp, deepwiki, playwright]
created: 2026-08-14
updated: 2026-08-14
sources: []
status: stable
---

# MCP Provisioning

EDAC provisions four MCP servers **globally** via the `mcp:` block in `src/opencode.jsonc`. Every agent inherits all four at runtime — no per-agent permission entries are needed. The `mcp:` block is the sole provisioning surface; agent awareness of the tools is a body-text concern, governed separately by the [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) model.

This split — global provisioning in config, awareness in body text — is what lets EDAC add an MCP server once and have it available everywhere, then tune *how* each agent uses it without touching the permission model. See [Global Config](../harness/global-config.md) for the full template and [Permission Model](../harness/permission-model.md) §b "Global-only vs per-agent keys" for why MCPs sit outside the per-agent permission surface.

## The Four Servers

All four are declared with `enabled: true` in `src/opencode.jsonc`. Three are remote (hosted MCP endpoints); one is local (a subprocess MCP server spawned on demand).

### Context7 — library / framework / SDK documentation

- **Transport**: remote — `https://mcp.context7.com/mcp`
- **Purpose**: current documentation for libraries, frameworks, SDKs, APIs, and CLI tools. Used even for well-known libraries, since training data lags upstream releases.
- **Usage shape**: two-step — resolve the library ID, then query its documentation. The resolve step maps a library name to a Context7-compatible ID; the query step fetches scoped documentation for a specific concept.

### GrepApp — real-world GitHub code-pattern search

- **Transport**: remote — `https://mcp.grep.app`
- **Purpose**: literal code-pattern search across public GitHub repositories. Finds production usage examples for unfamiliar APIs, confirms correct syntax/parameters, and surfaces common patterns.
- **Usage shape**: single-shot — search for a literal code pattern (e.g. `useState(`, `CORS(`), optionally filtered by language, repo, or path. Patterns are literal, not keywords.

### DeepWiki — AI-powered GitHub repository documentation

- **Transport**: remote — `https://mcp.deepwiki.com/mcp`
- **Purpose**: ask questions about a GitHub repository and get context-grounded answers, or read its generated wiki structure and contents. Used for understanding a repo's architecture, conventions, or behaviour without cloning it.
- **Usage shape**: ask a question about an `owner/repo`; or read the wiki structure (topic list) / contents (full docs) for a repo.

### Playwright — browser automation

- **Transport**: local — `npx -y @playwright/mcp@latest` (subprocess), with `PLAYWRIGHT_MCP_EXECUTABLE_PATH` and `WAYLAND_DISPLAY` environment variables for the local Chromium + Wayland setup.
- **Purpose**: browser automation — navigate, snapshot the accessibility tree, screenshot, resize the viewport, and interact with page elements. Used for frontend verification, visual confirmation, and accessibility checks.
- **Usage shape**: navigate to a URL, then snapshot/screenshot/interact as needed. The accessibility snapshot is preferred over screenshots for element-targeted actions.

## Global Provisioning Model

The `mcp:` block provisions all four servers to **every agent** at once. There is no per-agent `mcp:` declaration, no allow-list of which agents may call which server, and no `permission:` key for MCP tools — MCP access is not part of the [Permission Model](../harness/permission-model.md) key set. The harness injects each server's tool schemas into every agent's context at load; the agent either uses them or does not, per its body text.

*Why global:* MCP servers are research and verification capabilities, not state-mutating tools. The security-critical surface (filesystem, shell, subagent spawning) is governed by the permission model; MCPs sit alongside `websearch`/`webfetch` as universal research capabilities provisioned once in [Global Config](../harness/global-config.md).

## Two-Tier Awareness Model

Provisioning is global; **awareness is tiered**. How an agent's body text handles an MCP server follows the [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) distinction:

- **Minimal tier** — a capability-layer note: "you have access to X; use it when appropriate." The agent's workflow is unchanged; the tool is an additional option. Lives in the `<context>` block or a `## Capabilities` section, never in the workflow.
- **Comprehensive tier** — a procedural-layer change: the agent's workflow or decision trees are modified to route between direct use and delegation. Lives in the workflow, wherever the procedural change belongs.

Which tier applies to which agent for which MCP is the **awareness matrix** — the authoritative reference lives in [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) and is not duplicated here.

## Direct-vs-Delegate Pattern

Comprehensive-tier agents (CoderAgent, TestEngineer, FrontendSpecialist, and OpenCoder as orchestrator) use MCPs **directly** for trivial single-shot lookups — a one-call Context7 query to confirm an API signature, a single GrepApp search for a usage example. Deep multi-source research — cross-referencing several libraries, synthesizing across docs — is delegated to **ExternalScout**, whose own workflow is a comprehensive-tier 3-MCP selection by query shape.

This direct-vs-delegate decision tree replaced EDAC's earlier hard gates (`external_scout_mandatory`, `external_scout_for_ui_libs`), which forced every external lookup through ExternalScout regardless of cost. The replacement follows [Prompt Design Principles](../framework/prompt-design-principles.md) Principle 11: delegation rules must match the execution model — if a direct path is viable, the rule must reflect it, or it forces a round-trip the model didn't need.

## Nomenclature

All MCP references in agent body text use **natural language**, not technical tool names. The harness injects tool schemas with their API names; the agent body should not repeat them (see [Prompt Design Principles](../framework/prompt-design-principles.md) Principle 14: Don't Restate Injected Schema).

| Natural language | Technical name (injected, not restated) |
|---|---|
| "Resolve the library ID via Context7" | `context7_resolve-library-id` |
| "Query documentation via Context7" | `context7_query-docs` |
| "Search GitHub via GrepApp" | `grepapp_searchGitHub` |
| "Ask DeepWiki" | `deepwiki_ask_question` |
| "Navigate to a URL via Playwright" | `playwright_browser_navigate` |

The full nomenclature table (including non-MCP tools) is in [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) §"Nomenclature".

## Related

- [Global Config](../harness/global-config.md) — the `opencode.jsonc` template where the `mcp:` block lives.
- [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) — the two-tier awareness model, the awareness matrix, and the nomenclature table.
- [Permission Model](../harness/permission-model.md) — why no per-agent permission entries are needed for MCPs (§b "Global-only vs per-agent keys").
- [Prompt Design Principles](../framework/prompt-design-principles.md) — Principle 11 (delegation rules match execution model) and Principle 14 (don't restate injected schema).
