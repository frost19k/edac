---
title: Agent YAML Frontmatter
type: concept
tags: [opencode, frontmatter, agent-schema, harness, oac-standards]
created: 2026-07-29
updated: 2026-07-31
sources: ["(removed) oac-standards/agent-frontmatter.md"]
status: stable
---

# Agent YAML Frontmatter

**Finding**: Valid OpenCode agent frontmatter uses a small set of fields; OAC-specific metadata and several legacy keys must be kept out of the frontmatter block. The `name` field — not the filename — is the agent's true identifier. The authoritative permission-key list is 15 keys (see [../harness/permission-model.md](../harness/permission-model.md)); the source OAC document omits `list` and `todowrite` and is corrected here.

**Spec reference**: https://opencode.ai/docs/agents/ (v1.17.x)

---

## Core Principle

Agent frontmatter should use only valid OpenCode fields. OAC-specific metadata belongs in `registry.json` (repo root — see the field list in [../framework/src-structure.md](../framework/src-structure.md)) — it must not appear in the agent's frontmatter.

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
temperature: 0.2-0.3                     # Response randomness (0.0-1.0) — EDAC convention
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
    "**/*.env": "deny"               # Sensitive files denied under read
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
  bash:
    "*": "deny"
    "git status *": "allow"
  edit:
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
  grep:
    "*": "allow"
    # grep matches the SEARCH QUERY, not the file path — path globs (e.g. **/*.env) are INERT here.
    # Sensitive search-term denies: see Permission Model §d "Canonical grep search-term deny block".
  task:                              # Subagent delegation control (v1.17.x)
    "*": "deny"                      # Catch-all first (last-match-wins)
    ContextScout: "allow"            # Uses Display Name (frontmatter name field)
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

- **Actions**: `allow` | `ask` | `deny`.
- **Evaluation order**: last-match-wins (catch-all `"*"` first, specific overrides after) — full rules in the consolidated [Permission Model](../harness/permission-model.md).
- `external_directory` is a valid OpenCode key but EDAC agents rely on its default behaviour and do not set it explicitly.
- **`grep` is a secret-leak vector** — see the consolidated [Permission Model](../harness/permission-model.md) (§d "Canonical grep search-term deny block") for the rationale and the deny block.
- **Correction vs OAC source**: The OAC source document's quick-reference list omits `list` and `todowrite` and is therefore incomplete; `question`, `list`, and `todowrite` are valid keys, `todoread` is **not** a standalone key (it is gated by `todowrite`), and `codesearch` is **not** valid. The authoritative 15-key list is in the consolidated [Permission Model](../harness/permission-model.md).
- `question` is valid only on primary agents (those that interact with the user directly); subagents omit it.
- **Granular vs shorthand format**: 10 keys (`read`, `edit`, `glob`, `grep`, `list`, `bash`, `task`, `external_directory`, `lsp`, `skill`) accept glob-pattern objects; the remaining 5 (`webfetch`, `websearch`, `question`, `todowrite`, `doom_loop`) accept a single action string only — a pattern object on a shorthand-only key causes a configuration error. See the consolidated [Permission Model](../harness/permission-model.md) §b "Granular vs shorthand keys".

---

## Complete Example

```yaml
---
name: TestEngineer
description: Test authoring and TDD agent
mode: subagent
temperature: 0.2-0.3
permission:
  read:
    "*": "allow"
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
  edit:
    "*": "allow"
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
  grep:
    "*": "allow"
    # grep matches the SEARCH QUERY, not the file path — path globs (e.g. **/*.env) are INERT here.
    # Sensitive search-term denies: see Permission Model §d "Canonical grep search-term deny block".
  bash:
    "*": "deny"                      # Catch-all first (last-match-wins)
    "npx vitest *": "allow"
    "pytest *": "allow"
    "sudo *": "deny"
  task:
    "*": "deny"                      # Catch-all first (last-match-wins)
    ContextScout: "allow"
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

The OAC metadata fields (see the canonical field list in [src/ Package Structure](../framework/src-structure.md)) are NOT valid OpenCode frontmatter fields.

**Fix**: Move them to `registry.json`.

---

## Validation Checklist

- [ ] All required fields present (`name`, `description`, `mode`)?
- [ ] No deprecated fields (`maxSteps`, `tools:`, `skills:`)?
- [ ] No OAC metadata fields in frontmatter (`id`, `category`, `type`, `tags`, `dependencies`)?
- [ ] No duplicate keys?
- [ ] No orphaned list items?
- [ ] Correct field names (`permission` not `permissions`)?
- [ ] Sensitive files denied under `read` and `edit` (path globs) for ALL agents; `grep` restricted by search-term denies (see Permission Model §d) — `grep` CANNOT be scoped by file path.
- [ ] Shorthand-only keys (`webfetch`, `websearch`, `question`, `todowrite`, `doom_loop`) declared as action strings, not pattern objects (see Permission Model §b)?
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

**Last Updated**: 2026-07-31 | **Source Version**: 1.2.0 | **Spec**: OpenCode v1.17.x
