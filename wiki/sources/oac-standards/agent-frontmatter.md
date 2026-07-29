<!-- Context: repo/standards/agent-frontmatter | Priority: critical | Version: 1.2 | Updated: 2026-07-28 -->
# Standard: Agent YAML Frontmatter

**Purpose**: Valid OpenCode agent frontmatter structure and common mistakes to avoid  
**Priority**: CRITICAL - Load this before creating or modifying agent files  
**Spec Reference**: https://opencode.ai/docs/agents/ (v1.17.x)

---

## Core Principle

Agent frontmatter should use valid OpenCode fields. OAC-specific metadata (`id`, `category`, `type`, `version`, `tags`, `dependencies`) belongs in `.opencode/config/agent-metadata.json`.

**Why**: OpenCode ignores unknown frontmatter fields — they won't cause errors, but they add noise and clutter. Keeping frontmatter clean ensures agents work consistently across OpenCode versions.

---

## Display Name vs File Name

Every agent has **two identifiers**, but only one matters for agent interaction:

### Display Name (frontmatter `name` field) — THE identifier

The `name` field in YAML frontmatter is the agent's **display name**. This is the identifier used **everywhere** in OpenCode:

- `@` mentions in the TUI
- Tab cycling / autocomplete
- `subagent_type` parameter in `task()` tool calls
- `task:` permission pattern matching
- Agent identification in conversations

**Format**: PascalCase (e.g., `CoderAgent`, `ContextScout`, `TestEngineer`)

### File Name (markdown filename) — internal only

The filename (without `.md`) is used **only** for file discovery — OpenCode scans `.opencode/agents/**/*.md` to find agent files. Once loaded, the display name takes over as the identifier.

**The filename is never used for `@` mentions, `subagent_type` matching, or `task:` permission patterns.**

> **Common misconception**: The OpenCode docs say "The markdown file name becomes the agent name." This is misleading — it's only true as a **default** when no `name` field is present. Since all OAC agents have a `name` field, the display name is always the effective identifier.

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
temperature: 0.1                     # Response randomness (0.0-1.0)
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

See [permission-keys.md](permission-keys.md) for the complete permission keys table and evaluation order.

**Quick reference**: Valid keys are `read`, `edit`, `glob`, `grep`, `bash`, `task`, `skill`, `lsp`, `question`, `webfetch`, `websearch`, `external_directory`, `doom_loop`, `todowrite`. Values: `"allow"` | `"ask"` | `"deny"`. Granular rules use object syntax with last-match-wins pattern matching. Note: `external_directory` is a valid OpenCode key but OAC agents do not use it (they rely on default external_directory behavior).

---

## Complete Example

```yaml
---
name: TestEngineer
description: Test authoring and TDD agent
mode: subagent
temperature: 0.1
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
**Fix**: Move to `.opencode/config/agent-metadata.json`.

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

## Validation Commands

```bash
yq eval '.opencode/agents/category/agent.md' > /dev/null           # Check YAML syntax
grep -A 50 "^---$" agent.md | grep -E "^[a-z_]+:" | sort | uniq -d  # Find duplicate keys
```

---

## Related

- **Permission Keys**: [permission-keys.md](permission-keys.md)
- **Subagent Structure**: [subagent-structure.md](subagent-structure.md)
- **OpenCode Docs**: https://opencode.ai/docs/agents/
- **OpenCode Permissions**: https://opencode.ai/docs/permissions/

---

**Last Updated**: 2026-07-28 | **Version**: 1.2.0 | **Spec**: OpenCode v1.17.x
