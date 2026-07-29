---
title: OpenCode Permission Model (Consolidated)
type: reference
tags: [opencode, permissions, security, harness, oac-standards]
created: 2026-07-29
updated: 2026-07-29
sources: ["(removed) oac-standards/permission-keys.md", "(removed) oac-standards/permission-agent-patterns.md", "(removed) oac-standards/permission-security.md"]
status: stable
---

# OpenCode Permission Model (Consolidated)

This page consolidates three OAC source standards — `permission-keys.md`, `permission-agent-patterns.md`, and `permission-security.md` — into a single reference (Decision D2). It is the authoritative permission reference for EDAC's OpenCode agents. The verified key list below was confirmed against `opencode.ai/docs` by the research pass recorded in [../research/opencode-permission-model.md](../research/opencode-permission-model.md), which is the authority that verified the key list.

## (a) Core Principle, Evaluation Order, and Actions

OpenCode uses the singular `permission:` block (not `permissions:`) to grant granular control over tool access. Each entry maps a tool key to a set of glob patterns and an action.

**Evaluation order is last-match-wins.** Declare the catch-all `"*"` first to set the default, then list specific overrides afterward — the later, more specific rule takes precedence. This is the single most important structural rule: a deny placed *before* an allow will be overridden by that allow.

```yaml
permission:
  bash:
    "*": "deny"              # Catch-all: deny all bash by default
    "git status *": "allow"  # Specific override: allow git status
    "git diff *": "allow"    # Specific override: allow git diff
```

**Three valid actions:**

- `"allow"` — executes without approval.
- `"ask"` — prompts the user (options: once, always, reject).
- `"deny"` — blocks immediately.

## (b) Valid Permission Keys (Verified List)

The following 15 keys are the **verified canonical set**, confirmed against `opencode.ai/docs` (see [../research/opencode-permission-model.md](../research/opencode-permission-model.md)):

`read`, `edit`, `glob`, `grep`, `list`, `bash`, `task`, `external_directory`, `todowrite`, `webfetch`, `websearch`, `lsp`, `skill`, `question`, `doom_loop`

**This verified list supersedes the contradictory OAC source files.** Specific corrections:

- `permission-keys.md` **omitted** `question` and **falsely listed** `todoread` (not a standalone key — it is gated by `todowrite`) and `codesearch` (not a valid key).
- `agent-frontmatter.md` **omitted** `list` and `todowrite`.
- `agent-prompt-design.md` **omitted** `external_directory`.

Use the 15-key list above; do not reintroduce `todoread` or `codesearch`.

**Key notes:**

- `external_directory` is a valid key (default `"ask"`), but OAC/EDAC agents do not set it — they rely on OpenCode's default external-directory behaviour.
- There is **no `write` key.** The `edit` key covers both modifying existing files and creating new files. A `write:` entry in a `permission:` block is silently ignored by OpenCode — use `edit` instead.

## (c) Agent-Type Patterns

The four posture archetypes below are adapted from the OAC sources. All example frontmatter uses `temperature: 0.2` (EDAC convention, Decision D3) and only verified keys.

> **CRITICAL — read, edit, and grep are independent.** Blocking sensitive files (`.env`, `.key`, `.secret`, `.pem`, `.crt`, `credentials*`, `.api`, `creds*`) only under `edit` does **not** prevent them from being *read* — and `grep` returns matching lines, so it can *leak* secrets just as readily as `read`. Always declare explicit `read:`, `edit:`, **and `grep:`** denies for sensitive files. A secret that cannot be edited but can be read (or grepped) is still leaked.

### Read-Only Agents (Reviewers, Analyzers)

Use case: code review, analysis, security audits. No shell, no edits.

```yaml
---
name: CodeReviewer
description: Code review, security, and quality assurance agent
mode: subagent
temperature: 0.2
permission:
  bash: { "*": "deny" }
  edit: { "**/*": "deny" }
  task: { "*": "deny", ContextScout: "allow" }
---
```

### Write-Enabled Agents (Coders, Testers)

Use case: code implementation, test authoring, build verification. Bash is allow-listed per command; sensitive files denied under both `read` and `edit`.

```yaml
---
name: TestEngineer
description: Test authoring and TDD agent
mode: subagent
temperature: 0.2
permission:
  bash:
    "*": "deny"
    "npx vitest *": "allow"
    "npx jest *": "allow"
    "pytest *": "allow"
    "sudo *": "deny"
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
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
    "node_modules/**": "deny"
    ".git/**": "deny"
  grep:
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
  task: { "*": "deny", ContextScout: "allow" }
---
```

### Orchestrators (Primary Agents)

Use case: workflow orchestration, task delegation. Bash defaults to `ask` with `sudo` denied; can delegate to any subagent.

```yaml
---
name: OpenCoder
description: Orchestration agent for complex coding
mode: primary
temperature: 0.2
permission:
  bash: { "*": "ask", "sudo *": "deny" }
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
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
    "node_modules/**": "deny"
    ".git/**": "deny"
  grep:
    "*": "allow"
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
  task: { "*": "allow" }
---
```

> Note: individual primary-agent postures vary (some are permissive, some deny-default). The block above is one representative example — always check the agent's own `permission:` block. TaskManager is a subagent, not a primary orchestrator.

### Restricted-Bash Agents (Specific Commands Only)

Use case: agents that need only a narrow set of shell commands (e.g. discovery scouts).

```yaml
permission:
  bash: { "*": "deny", "git status *": "allow", "git diff *": "allow", "git log *": "allow", "ls *": "allow", "cat *": "allow" }
  read:
    "*": "allow"
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
  edit: { "**/*.env": "deny" }
  grep:
    "*": "allow"
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
  task: { "*": "deny", ContextScout: "allow" }
```

Examples: ExternalScout, ContextScout.

## (d) Security Patterns

### Always Deny Sensitive Files

Deny under **`read`, `edit`, AND `grep`** (see CRITICAL note in section (c)). `grep` is a leak vector because it returns matching lines — a secret inside a grepped file is surfaced in the output, so it needs the same sensitive-file denies as `read`:

```yaml
permission:
  read:
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
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
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
    "**/*.pem": "deny"
    "**/*.crt": "deny"
    "**/credentials*": "deny"
    "**/*.api": "deny"
    "**/creds*": "deny"
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

## (e) Task Permission Patterns

The `task:` key controls which subagents an agent may spawn. **`task:` uses Display Names (the frontmatter `name` field), NOT filenames** — see [../harness/agent-frontmatter.md](../harness/agent-frontmatter.md) and [../harness/subagent-structure.md](../harness/subagent-structure.md).

### Allow Specific Subagents Only

```yaml
permission:
  task:
    "*": "deny"
    ContextScout: "allow"
    ExternalScout: "allow"
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
    "*": "deny"
    ContextScout: "allow"   # Always allow context discovery
    "CoderAgent": "ask"     # Ask before code generation
    "BuildAgent": "ask"     # Ask before builds
```

## (f) Validation Checklist

- [ ] Using `permission:` (singular, not `permissions:`).
- [ ] Catch-all rules (`"*"`) come **first**; specific overrides come **after** (last-match-wins).
- [ ] Only verified keys used — no `todoread`, no `codesearch`, no `write`.
- [ ] Sensitive files denied under **`read`, `edit`, AND `grep`** (`**/*.env`, `**/*.key`, `**/*.secret`, `**/*.pem`, `**/*.crt`, `**/credentials*`, `**/*.api`, `**/creds*`).
- [ ] Dangerous commands denied (`sudo *`, `rm -rf /*`, `chmod 777 *`, `curl * | bash`, `wget * | sh`).
- [ ] Destructive operations set to `ask` (`rm -rf *`, `git push --force*`, `docker system prune*`, `npm publish*`).
- [ ] Write-enabled agents declare explicit `read`, `grep`, `glob`, `list` permissions rather than relying on defaults.
- [ ] `task:` permissions appropriate for agent type and use **Display Names**, not filenames.
- [ ] Only valid actions used (`"allow"`, `"ask"`, `"deny"`).

## Cross-References

- [Agent Frontmatter](../harness/agent-frontmatter.md) — `name` field is the Display Name used by `task:`.
- [Subagent Structure](../harness/subagent-structure.md) — subagent taxonomy and delegation.
- [OpenCode Permission Model (research)](../research/opencode-permission-model.md) — the authority that verified the 15-key list against `opencode.ai/docs`.
