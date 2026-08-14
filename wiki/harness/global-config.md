---
title: Global Config Template
type: concept
tags: [opencode-jsonc, permissions, global-config, install, mcp, plugins]
created: 2026-08-14
updated: 2026-08-14
sources: []
status: stable
---

# Global Config Template (`opencode.jsonc`)

EDAC's `src/opencode.jsonc` is the **global configuration template** — the baseline every agent inherits at runtime. Installed to `~/.config/opencode/opencode.jsonc` (or a local `.opencode/opencode.jsonc`), it establishes the permission floor, provisions MCP servers and plugins, and configures the agent registry. Per-agent frontmatter narrows within this floor; it does not redefine it.

## Structure

The template has six blocks:

1. **`$schema`** — OpenCode configuration schema reference.
2. **`default_agent`** — the agent loaded by default (`openagent`).
3. **`permission`** — five global-only permission keys (see [Permission Model](../harness/permission-model.md) §b "Global-only vs per-agent keys").
4. **`plugin`** — three plugins provisioned globally (see [Plugin Provisioning](../harness/plugin-provisioning.md)).
5. **`mcp`** — four MCP servers provisioned globally (see [MCP Provisioning](../harness/mcp-provisioning.md)).
6. **`agent`** — agent registry configuration (hidden agents, disabled modes).

## The Permission Floor

The `permission` block defines five keys that apply to **all agents** unless a frontmatter overrides with a more restrictive value:

| Key | Value | Scope |
|---|---|---|
| `websearch` | `allow` | Web search — universal research capability |
| `webfetch` | `allow` | URL fetch — universal research capability |
| `question` | `allow` | User clarification — universal interaction capability |
| `skill` | `{*: allow, exp-*: ask, int-*: deny}` | Skill access — experiment-gated |
| `external_directory` | `{*: ask, /tmp/opencode/**: allow, ...}` | Filesystem boundary — ask by default, allow approved dirs |

**Agent frontmatters must not repeat these keys** unless imposing a restrictive override. The only restrictive override in EDAC is TaskManager's `skill: {*: deny, task-management: allow}` — denying all skills except the task-management skill. See [Permission Model](../harness/permission-model.md) §b for the global-only vs per-agent key distinction and the canonical ordering convention.

## MCP and Plugin Provisioning

MCP servers and plugins are provisioned **globally** via the `mcp:` and `plugin:` blocks. No per-agent permission entries are needed — the tools are available to all agents by default. Agent awareness of these tools is a **body-text concern**, not a permission-block concern; it is governed by the [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) model.

- **MCP servers** (4): Context7, GrepApp, DeepWiki, Playwright — see [MCP Provisioning](../harness/mcp-provisioning.md).
- **Plugins** (4): DCP/compress, Vibeguard, PTY, Holographic-memory — see [Plugin Provisioning](../harness/plugin-provisioning.md).

## Install-Time Merge

At install, `install.sh` merges the template with any existing target `opencode.jsonc` using a deep-merge strategy: target wins for existing keys, template adds missing keys, arrays merge and dedupe. JSONC comments are stripped with a warning. See [Install Merge Logic](../harness/install-merge.md) for the full merge procedure.

## Related

- [Permission Model](../harness/permission-model.md) — the 14-key permission reference, global-only vs per-agent keys, evaluation order.
- [MCP Provisioning](../harness/mcp-provisioning.md) — the 4 MCP servers provisioned via the `mcp:` block.
- [Plugin Provisioning](../harness/plugin-provisioning.md) — the 4 plugins (3 via `plugin:` block, 1 built from source).
- [Install Merge Logic](../harness/install-merge.md) — how `install.sh` merges config templates at install time.
- [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) — how agent body text handles globally-provisioned tools.
- [src/ Package Structure](../framework/src-structure.md) — where the template lives in `src/`.
