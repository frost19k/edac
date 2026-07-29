<!-- Context: repo/standards | Priority: critical | Version: 1.0 | Updated: 2026-07-28 -->
# Agent Permission Patterns

**Purpose**: Permission patterns by agent type with condensed examples

---

## Agent Type Patterns

### Read-Only Agents (Reviewers, Analyzers)

**Use case**: Code review, analysis, security audits

```yaml
permission:
  bash: { "*": "deny" }
  edit: { "**/*": "deny" }
  task: { ContextScout: "allow", "*": "deny" }
```

**Examples**: CodeReviewer, SecurityAuditor

### Write-Enabled Agents (Coders, Testers)

**Use case**: Code implementation, test authoring, build verification

> **CRITICAL**: `read` and `edit` are independent permission keys. Blocking sensitive
> files (`.env`, `.key`, `.secret`) only under `edit` does **not** prevent them from
> being read. Always declare explicit `read:` denies for sensitive files.

```yaml
permission:
  bash:
    "*": "deny"
    "tsc *": "allow"
    "mypy *": "allow"
    "go build *": "allow"
    "cargo check *": "allow"
    "cargo build *": "allow"
    "npm run build *": "allow"
    "yarn build *": "allow"
    "pnpm build *": "allow"
    "bun run build *": "allow"
    "python -m build *": "allow"
    "bun run validate *": "allow"
    "bun run test *": "allow"
    "bun test *": "allow"
    "npm run test *": "allow"
    "go test *": "allow"
    "cargo test *": "allow"
    "pytest *": "allow"
    "vitest *": "allow"
    "jest *": "allow"
    "npm run lint *": "allow"
    "bun run lint *": "allow"
    "eslint *": "allow"
    "ruff *": "allow"
    "npm install *": "allow"
    "bun install *": "allow"
    "pip install *": "allow"
    "git status *": "allow"
    "git diff *": "allow"
    "git log *": "allow"
    "docker run *": "allow"
    "docker compose up *": "allow"
    "docker compose down": "allow"
    "docker logs *": "allow"
    "docker ps *": "allow"
  read:  # Catch-all FIRST, specific denies AFTER (last-match-wins → deny wins)
    "*": "allow"
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/credentials*": "deny"
  edit:
    "**/*.env": "deny"; "**/*.key": "deny"; "**/*.secret": "deny"
    "**/*.pem": "deny"; "**/credentials*": "deny"
    "node_modules/**": "deny"; ".git/**": "deny"
  grep: { "*": "allow" }
  glob: { "*": "allow" }
  list: { "*": "allow" }
  task: { ContextScout: "allow", ExternalScout: "allow", "*": "deny" }
```

**Examples**: CoderAgent, TestEngineer, BuildAgent

> **Note**: `task:` uses **Display Names** (frontmatter `name` field), NOT filenames.
> See `agent-frontmatter.md` for details.

### Orchestrators (Primary Agents)

**Use case**: Workflow orchestration, task delegation

```yaml
permission:
  bash: { "*": "ask", "sudo *": "deny" }
  edit:
    "**/*.env": "deny"; "**/*.key": "deny"; "**/*.secret": "deny"
    "node_modules/**": "deny"; ".git/**": "deny"
  task: { "*": "allow" }  # Can delegate to any subagent
```

**Examples**: OpenCoder, OpenAgent

> **Note**: Individual primary-agent postures vary widely (e.g., open-agent/open-coder are permissive; open-system-builder is deny-default; open-repo-manager is deny-secrets/default-allow). The block above is one representative example — always check the agent's own `permission:` block. TaskManager is a subagent, not a primary orchestrator, and is excluded from this list.

### Restricted Bash Agents (Specific Commands Only)

**Use case**: Agents that need only specific bash commands

```yaml
permission:
  bash: { "*": "deny", "git status *": "allow", "git diff *": "allow", "git log *": "allow", "ls *": "allow", "cat *": "allow" }
  edit: { "**/*.env": "deny" }
  task: { ContextScout: "allow", "*": "deny" }
```

**Examples**: ExternalScout, ContextScout

---

## Complete Examples

### Example 1: Code Reviewer (Read-Only)

```yaml
---
name: CodeReviewer
description: Code review, security, and quality assurance agent
mode: subagent
temperature: 0.1
permission:
  bash: { "*": "deny" }
  edit: { "**/*": "deny" }
  task: { ContextScout: "allow", "*": "deny" }
---
```

### Example 2: Test Engineer (Write-Enabled)

```yaml
---
name: TestEngineer
description: Test authoring and TDD agent
mode: subagent
temperature: 0.1
permission:
  bash: { "*": "deny", "npx vitest *": "allow", "npx jest *": "allow", "pytest *": "allow", "sudo *": "deny" }
  edit: { "**/*.env": "deny", "**/*.key": "deny", "**/*.secret": "deny" }
  task: { ContextScout: "allow", "*": "deny" }
---
```

### Example 3: Primary Orchestrator

```yaml
---
name: OpenCoder
description: Orchestration agent for complex coding
mode: primary
temperature: 0.1
permission:
  bash: { "*": "ask", "sudo *": "deny" }
  edit: { "**/*.env": "deny", "**/*.key": "deny", "**/*.secret": "deny", "node_modules/**": "deny", ".git/**": "deny" }
  task: { "*": "allow" }
---
```

---

## Related

- **Permission Keys**: `permission-keys.md`
- **Security Patterns**: `permission-security.md`
- **Agent Frontmatter**: `agent-frontmatter.md`
- **Subagent Structure**: `subagent-structure.md`
- **Security Patterns (Core)**: `../../core/standards/security-patterns.md`
