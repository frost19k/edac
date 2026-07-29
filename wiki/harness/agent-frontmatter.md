---
title: Agent YAML Frontmatter
type: concept
tags: [opencode, frontmatter, agent-schema, harness, oac-standards]
created: 2026-07-29
updated: 2026-07-29
sources: [sources/oac-standards/agent-frontmatter.md]
status: stable
---

# Agent YAML Frontmatter

**Finding**: Valid OpenCode agent frontmatter uses a small set of fields; OAC-specific metadata and several legacy keys must be kept out of the frontmatter block. The `name` field — not the filename — is the agent's true identifier. The authoritative permission-key list is 15 keys (see [../harness/permission-model.md](../harness/permission-model.md)); the source OAC document omits `list` and `todowrite` and is corrected here.

**Spec reference**: https://opencode.ai/docs/agents/ (v1.17.x)

---

## Core Principle

Agent frontmatter should use only valid OpenCode fields. OAC-specific metadata (`id`, `category`, `type`, `version`, `tags`, `dependencies`) belongs in `.opencode/config/agent-metadata.json`, not in the agent's frontmatter.

**Why**: OpenCode silently ignores unknown frontmatter fields. They cause no errors but add noise and clutter, and they break the clean separation between harness configuration and OAC's component registry. Keeping frontmatter clean ensures agents behave consistently across OpenCode versions.

---

## Display Name vs File Name

Every agent has **two identifiers**, but only one matters for agent interaction.

### Display Name (`name` field) — THE identifier

The `name` field in YAML frontmatter is the agent's **display name** and the identifier used **everywhere** in OpenCode:

- `@` mentions in the TUI
- Tab cycling / autocomplete
- `subagent_type` parameter in `task()` tool calls
- `task:` permission pattern matching
- Agent identification in conversations

**Format**: PascalCase (e.g., `CoderAgent`, `ContextScout`, `TestEngineer`).

### File Name (markdown filename) — discovery only

The filename (without `.md`) is used **only** for file discovery — OpenCode scans `.opencode/agents/**/*.md` to find agent files. Once loaded, the display name takes over as the identifier.

**The filename is never used for `@` mentions, `subagent_type` matching, or `task:` permission patterns.**

> **Common misconception**: The OpenCode docs say "The markdown file name becomes the agent name." This is only true as a **default** when no `name` field is present. Since all OAC/EDAC agents carry a `name` field, the display name is always the effective identifier.

---

## Valid OpenCode Fields

### Required

```yaml
---
name: AgentName                      # Display name (PascalCase) — THE identifier used everywhere
description: "What this agent does"  # When to use (required)
mode: subagent                       # primary, subagent, or all
---
```

### Optional

```yaml
temperature: 0.2                     # Response randomness (0.0-1.0) — EDAC convention
model: anthropic/claude-sonnet-4-5   # Model override
steps: 50                            # Max iterations before text-only response
disable: false                       # Disable agent
hidden: true                         # Hide from @ autocomplete (subagent still callable via Task tool)
prompt: "{file:./prompts/custom.txt}"# Custom prompt file
color: "#ff6b6b"                     # UI color (hex or theme name: primary, accent, etc.)
top_p: 0.9                           # Alternative to temperature (0.0-1.0)

permission:                          # Permission rules (replaces deprecated tools: boolean)
  "*": "ask"                         # Catch-all (last-match-wins)
  read:
    "*": "allow"
  bash:
    "*": "deny"
    "git status *": "allow"
  edit:
    "**/*.env": "deny"
  task:                              # Subagent delegation control (v1.17.x)
    ContextScout: "allow"            # Uses Display Name (frontmatter name field)
    "*": "deny"
  skill:                             # Skill access control (v1.17.x)
    "*": "allow"
    "internal-*": "deny"
```

### Deprecated Fields (do NOT use)

```yaml
maxSteps: 50     # ❌ Deprecated — use `steps` instead
tools:           # ❌ Deprecated — use `permission:` instead
  read: true
skills:          # ❌ Not a frontmatter field — skills auto-discovered from .opencode/skills/
  - task-management
```

---

## Permission Keys

The complete permission-key reference, evaluation order, and pattern syntax live in the consolidated page [../harness/permission-model.md](../harness/permission-model.md). Do **not** create separate `permission-keys`, `permission-agent-patterns`, or `permission-security` pages (decision D2).

**Verified canonical key list (15 keys)** — resolved by a research pass against opencode.ai/docs and recorded authoritatively in [../research/opencode-permission-model.md](../research/opencode-permission-model.md):

```
read, edit, glob, grep, list, bash, task, external_directory,
todowrite, webfetch, websearch, lsp, skill, question, doom_loop
```

- **Actions**: `allow` | `ask` | `deny`.
- **Evaluation order**: last-match-wins. Declare the catch-all `"*"` first; specific overrides follow.
- `external_directory` is a valid OpenCode key but EDAC agents rely on its default behaviour and do not set it explicitly.

> **Correction vs source**: The OAC source document's quick-reference list omits `list` and `todowrite` and is therefore incomplete. The 15-key list above is authoritative. Additionally, `question`, `list`, and `todowrite` are valid keys; `todoread` is **not** a standalone key (it is gated by `todowrite`); `codesearch` is **not** valid.

---

## Complete Example

```yaml
---
name: TestEngineer
description: Test authoring and TDD agent
mode: subagent
temperature: 0.2
permission:
  read:
    "*": "allow"
  edit:
    "*": "allow"
    "**/*.env": "deny"
  bash:
    "npx vitest *": "allow"
    "pytest *": "allow"
    "sudo *": "deny"
    "*": "deny"
  task:
    ContextScout: "allow"
    "*": "deny"
---
```

---

## Common Mistakes

### 1. Deprecated or Duplicate Keys ❌

```yaml
maxSteps: 20              # ❌ Use `steps`
tools:                    # ❌ Use `permission:`
  write: true
permission:
  bash: "allow"
  bash: {"**/*": "deny"}  # ❌ Duplicate key — use one declaration per key
```

### 2. Orphaned Items or Wrong Names ❌

```yaml
permission:
  read: "allow"
  - edit: "deny"          # ❌ Orphaned list item (no parent key)
permissions:              # ❌ Use `permission` (singular)
  bash: "deny"
```

### 3. Extra Delimiter Blocks ❌

```yaml
---
name: MyAgent
---
# Content
---                       # ❌ Extra delimiter — only one frontmatter block at top
```

### 4. OAC Metadata in Frontmatter ❌

Fields like `id`, `category`, `type`, `version`, `tags`, `dependencies` are NOT valid OpenCode frontmatter fields.

**Fix**: Move them to `.opencode/config/agent-metadata.json`.

---

## Validation Checklist

- [ ] All required fields present (`name`, `description`, `mode`)?
- [ ] No deprecated fields (`maxSteps`, `tools:`, `skills:`)?
- [ ] No OAC metadata fields in frontmatter (`id`, `category`, `type`, `version`, `tags`, `dependencies`)?
- [ ] No duplicate keys?
- [ ] No orphaned list items?
- [ ] Correct field names (`permission` not `permissions`)?
- [ ] Only one `---` delimiter at top?
- [ ] Valid YAML syntax?

---

## Related

- **Permission Model (consolidated)**: [../harness/permission-model.md](../harness/permission-model.md)
- **Subagent Structure**: [../harness/subagent-structure.md](../harness/subagent-structure.md)
- **Permission-key authority**: [../research/opencode-permission-model.md](../research/opencode-permission-model.md)
- **OpenCode Docs (Agents)**: https://opencode.ai/docs/agents/
- **OpenCode Docs (Permissions)**: https://opencode.ai/docs/permissions/

---

**Last Updated**: 2026-07-29 | **Source Version**: 1.2.0 | **Spec**: OpenCode v1.17.x
