<!-- Context: repo/standards | Priority: critical | Version: 1.0 | Updated: 2026-07-28 -->
# Permission Keys Reference

**Purpose**: Core permission concepts, valid keys, and evaluation order for OpenCode v1.1.1+

---

## Core Principle

OpenCode v1.1.1+ uses `permission:` (singular) with granular control over tool access. Rules follow **last-matching-wins** evaluation order.

**Why**: Granular permissions prevent unintended actions while allowing necessary operations.

---

## Permission Evaluation Order

**Last matching rule wins** - Common pattern:
1. Catch-all `"*"` first (default behavior)
2. Specific overrides after (take precedence)

Example:
```yaml
permission:
  bash:
    "*": "deny"              # Catch-all: deny all bash
    "git status *": "allow"   # Override: allow git status
    "git diff *": "allow"     # Override: allow git diff
```

---

## Valid Permission Keys

| Key | Description | Granular? | Default |
|-----|-------------|-----------|---------|
| `read` | File reading | Yes (path globs) | `"allow"` |
| `edit` | File modifications (edit existing + create new) | Yes (path globs) | `"allow"` |
| `glob` | File globbing/searches | Yes | `"allow"` |
| `grep` | Content/regex search | Yes | `"allow"` |
| `list` | Directory listing | Yes | `"allow"` |
| `bash` | Shell commands | Yes (command globs) | `"allow"` |
| `task` | Subagent launches | Yes (subagent type) | `"allow"` |
| `skill` | Skill loading | Yes | `"allow"` |
| `lsp` | LSP queries | No | `"allow"` |
| `todoread` | Todo list read | No | `"allow"` |
| `todowrite` | Todo list update | No | `"allow"` |
| `webfetch` | URL fetching | Yes | `"allow"` |
| `websearch` | Web search | Yes | `"allow"` |
| `codesearch` | Code search | Yes | `"allow"` |
| `external_directory` | Out-of-project paths | Yes | `"ask"` |
| `doom_loop` | Repeated identical calls | Yes | `"ask"` |

> **Note**: `external_directory` is a valid OpenCode key, but OAC agents do not use it — they rely on OpenCode's default external_directory behavior.

> **CRITICAL**: There is no `write` permission key. The `edit` key covers both
> modifying existing files and creating new files. Do not use `write:` in
> `permission:` blocks — it is silently ignored by OpenCode.

---

## Valid Actions

- `"allow"` - Executes without approval
- `"ask"` - Prompts user (options: once, always, reject)
- `"deny"` - Blocks immediately

---

## Related

- **Agent Patterns**: `permission-agent-patterns.md`
- **Security Patterns**: `permission-security.md`
- **Agent Frontmatter**: `agent-frontmatter.md`
- **Subagent Structure**: `subagent-structure.md`
- **Security Patterns (Core)**: `../../core/standards/security-patterns.md`
