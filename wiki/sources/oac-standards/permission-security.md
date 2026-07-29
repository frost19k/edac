<!-- Context: repo/standards | Priority: critical | Version: 1.0 | Updated: 2026-07-28 -->
# Security & Task Permission Patterns

**Purpose**: Security patterns, task permission configs, and validation checklist

---

## Security Patterns

### Always Deny Sensitive Files

```yaml
permission:
  edit:
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
```

### Always Deny Dangerous Commands

```yaml
permission:
  bash:
    "sudo *": "deny"
    "rm -rf /*": "deny"
    "chmod 777 *": "deny"
    "curl * | bash": "deny"
    "wget * | sh": "deny"
```

### Always Ask for Destructive Operations

```yaml
permission:
  bash:
    "rm -rf *": "ask"
    "git push --force*": "ask"
    "docker system prune*": "ask"
    "npm publish*": "ask"
```

---

## Task Permission Patterns

### Allow Specific Subagents Only

```yaml
permission:
  task:
    ContextScout: "allow"
    ExternalScout: "allow"
    "*": "deny"
```

### Allow All Except Specific

```yaml
permission:
  task:
    "*": "allow"
    "dangerous-agent": "deny"
```

### Ask for Orchestration Agents

```yaml
permission:
  task:
    ContextScout: "allow"      # Always allow context discovery
    "CoderAgent": "ask"         # Ask before code generation
    "BuildAgent": "ask"         # Ask before builds
    "*": "deny"
```

---

## Validation Checklist

- [ ] Using `permission:` (singular, not `permissions:`)
- [ ] Catch-all rules (`"*"`) come FIRST
- [ ] Specific overrides come AFTER catch-all
- [ ] Sensitive files denied under BOTH `read` AND `edit` (`**/*.env`, `**/*.key`, `**/*.secret`, `**/*.pem`, `**/*.crt`, `**/credentials*`, `**/*.api`, `**/creds*`)
- [ ] Dangerous commands denied (`sudo *`, `rm -rf /*`)
- [ ] Destructive operations ask (`rm -rf *`, `git push --force*`)
- [ ] Write-enabled agents declare explicit `read`, `grep`, `glob`, `list` permissions (do not rely on defaults)
- [ ] Task permissions appropriate for agent type
- [ ] Valid actions only (`"allow"`, `"ask"`, `"deny"`)

---

## Related

- **Permission Keys**: `permission-keys.md`
- **Agent Patterns**: `permission-agent-patterns.md`
- **Agent Frontmatter**: `agent-frontmatter.md`
- **Subagent Structure**: `subagent-structure.md`
- **Security Patterns (Core)**: `../../core/standards/security-patterns.md`
