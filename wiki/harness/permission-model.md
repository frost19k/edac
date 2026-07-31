---
title: OpenCode Permission Model (Consolidated)
type: concept
tags: [opencode, permissions, security, harness, oac-standards]
created: 2026-07-29
updated: 2026-07-31
sources: ["(removed) oac-standards/permission-keys.md", "(removed) oac-standards/permission-agent-patterns.md", "(removed) oac-standards/permission-security.md"]
status: stable
---

# OpenCode Permission Model (Consolidated)

This page consolidates three OAC source standards — `permission-keys.md`, `permission-agent-patterns.md`, and `permission-security.md` — into a single reference (Decision D2). It is the authoritative permission reference for EDAC's OpenCode agents. The verified key list below was confirmed against `opencode.ai/docs` by the research pass recorded in [../research/opencode-permission-model.md](../research/opencode-permission-model.md), which is the authority that verified the key list.

## (a) Core Principle, Evaluation Order, and Actions

OpenCode uses the singular `permission:` block (not `permissions:`) to grant granular control over tool access. Each entry maps a tool key to a set of glob patterns and an action.

**Default behavior.** OpenCode's upstream default is `allow` for most tools (verified against `opencode.ai/docs` — see the research authority page). This EDAC deployment is configured to default to `ask` (a harder gate: the user must approve each tool call). The `permission:` block is therefore the deliberate calibration between two obligations: (1) give the agent the tools it needs to complete its mission, and (2) protect the user's CIA triad — Confidentiality, Integrity, Availability. Express that calibration as `allow` / `ask` / `deny` rules under last-match-wins.

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
- `question` is valid only on primary agents (those that interact with the user directly); subagents omit it from their frontmatter.

## (c) Agent-Type Patterns

The four posture archetypes below are adapted from the OAC sources. All example frontmatter uses `temperature: 0.2-0.3` (EDAC convention, Decision D3) and only verified keys.

> **CRITICAL — read, edit, and grep are independent.** Blocking sensitive files (`.env`, `.key`, `.secret`, `.pem`, `.crt`, `credentials*`, `.api`, `creds*`) only under `edit` does **not** prevent them from being *read* — declare explicit `read:` and `edit:` path denies (these match file paths and work correctly). `grep` is ALSO a leak vector, but its permission matches the **search query**, not the file path, so path globs like `**/*.env` are **inert** under `grep:`. Restrict `grep:` with search-term denies instead — the canonical set is in §d "Canonical grep search-term deny block". A secret that cannot be edited but can be read (or grepped) is still leaked.

**Primary vs subagent.** A primary agent interacts with the user directly — that is what makes it primary. An Orchestrator is a primary agent that spawns subagents and therefore requires workflow protocols for delegation. Spawning heuristic: (1) is there a specialist subagent for this task? (2) does parallel delegation speed the *authorised* execution plan? Subagents are narrow, focused specialists by convention and design choice, not enforcement.

### Read-Only Agents (Reviewers, Analyzers)

Use case: code review, analysis, security audits. No shell, no edits.

```yaml
---
name: CodeReviewer
description: Code review, security, and quality assurance agent
mode: subagent
temperature: 0.2-0.3
permission:
  bash: { "*": "deny" }
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
  edit: { "**/*": "deny" }
  grep:
    "*": "allow"
    # grep matches the SEARCH QUERY, not the file path — path globs (e.g. **/*.env) are INERT here.
    # Sensitive search-term denies: see §d "Canonical grep search-term deny block".
  task: { "*": "deny", ContextScout: "allow" }
---
```

### Write-Enabled Agents (Coders, Testers)

Use case: code implementation, test authoring, build verification. Bash is allow-listed per command; sensitive files denied under `read` and `edit` (path globs), and `grep` restricted by search-term denies (see §d).

```yaml
---
name: TestEngineer
description: Test authoring and TDD agent
mode: subagent
temperature: 0.2-0.3
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
    "*": "allow"
    # grep matches the SEARCH QUERY, not the file path — path globs (e.g. **/*.env) are INERT here.
    # Sensitive search-term denies: see §d "Canonical grep search-term deny block".
  task: { "*": "deny", ContextScout: "allow" }
---
```

### Orchestrators (Primary Agents)

Use case: workflow orchestration, task delegation. An Orchestrator is a **primary agent** (it interacts with the user directly) that spawns subagents — see the spawning heuristic in §c above: (1) is there a specialist subagent for this task? (2) does parallel delegation speed the *authorised* execution plan? Bash defaults to `ask` with `sudo` denied; can delegate to any subagent.

```yaml
---
name: OpenCoder
description: Orchestration agent for complex coding
mode: primary
temperature: 0.2-0.3
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
    # grep matches the SEARCH QUERY, not the file path — path globs (e.g. **/*.env) are INERT here.
    # Sensitive search-term denies: see §d "Canonical grep search-term deny block".
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
    "*": "allow"
    # grep matches the SEARCH QUERY, not the file path — path globs (e.g. **/*.env) are INERT here.
    # Sensitive search-term denies: see §d "Canonical grep search-term deny block".
  task: { "*": "deny", ContextScout: "allow" }
```

Examples: ExternalScout, ContextScout.

## (d) Security Patterns

### Canonical sensitive-file deny block (Always Deny Sensitive Files)

Deny sensitive files under **`read` and `edit`** using path globs — these match file paths and work correctly. **`grep` is also a leak vector** (it returns matching lines, surfacing a secret in output), **but its permission matches the SEARCH QUERY, not the file path.** Path globs like `**/*.env` are therefore **inert** under `grep:`; restrict `grep:` with search-term denies instead (next subsection). Verified against `opencode.ai/docs` and an in-repo empirical test — see [../sources/grep-permission-semantics.md](../sources/grep-permission-semantics.md).

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
```

### Canonical grep search-term deny block

`grep` permission patterns are matched against the **search query** (the regex/content pattern the agent passes), not the file path. **Wrap every term in `*` on both sides** (`*AKIA*`, never `AKIA*`) so queries that embed the term mid-string are still caught. Matching is **case-sensitive on Linux/macOS** (case-insensitive only on Windows), so generic terms carry lower+upper variants. This block is a **tripwire, not the primary control**: `read`/`edit` path denies and output redaction (e.g. `vibeguard`) are the real walls. An agent aware of the patterns can evade query inspection by rephrasing (e.g. `sk[-]`, `AKI[A-Z]`), so treat this as defense-in-depth.

```yaml
permission:
  grep:
    "*": "allow"
    # Tier A — format-specific prefixes (high precision; mirrors vibeguard secret formats; case-stable)
    "*AKIA*": "deny"          # AWS access key
    "*ASIA*": "deny"          # AWS temporary credential
    "*sk-*": "deny"           # OpenAI / Stripe / Anthropic key (covers sk_live_, sk-proj-, sk-ant-)
    "*AIza*": "deny"          # Google API key
    "*hf_*": "deny"           # HuggingFace token
    "*gh?_*": "deny"          # GitHub token (ghp_/gho_/ghu_/ghs_/ghr_)
    "*github_pat_*": "deny"   # GitHub PAT
    "*xox*": "deny"           # Slack token
    "*eyJ*": "deny"           # JWT
    "*npm_*": "deny"          # npm token
    "*pypi-*": "deny"         # PyPI token
    "*-----BEGIN*": "deny"    # PEM armor header (private keys, certs)
    "*://*@*": "deny"         # credentialed connection / proxy URL
    # Tier B — generic secret-name terms (tripwire; CASE VARIANTS required on Linux/macOS)
    "*password*": "deny"
    "*PASSWORD*": "deny"
    "*secret*": "deny"
    "*SECRET*": "deny"
    "*token*": "deny"
    "*TOKEN*": "deny"
    "*api*key*": "deny"
    "*API*KEY*": "deny"
    "*private*key*": "deny"
    "*PRIVATE*KEY*": "deny"
    "*credential*": "deny"
    "*CREDENTIAL*": "deny"
```

### Always Deny Dangerous Commands

```yaml
permission:
  bash:
    "sudo *": "deny"
    "rm -rf /*": "deny"
    "> /dev/*": "deny"
    "chmod 777 *": "deny"
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
- [ ] Only verified keys used — no `todoread`, no `codesearch`, no `write`; `question` appears only on primary agents.
- [ ] Sensitive files denied under `read` and `edit` (path globs) for ALL agents; `grep` restricted by search-term denies (see §d "Canonical grep search-term deny block") — `grep` CANNOT be scoped by file path. Omit only for a tool denied wholesale via `"*": "deny"`.
- [ ] Dangerous commands denied (`sudo *`, `rm -rf /*`, `> /dev/*`, `chmod 777 *`); destructive operations set to `ask` (`rm -rf *`, `git push --force*`, `docker system prune*`, `npm publish*`).
- [ ] Write-enabled agents declare explicit `read`, `grep`, `glob`, `list` permissions rather than relying on defaults.
- [ ] `task:` permissions appropriate for agent type and use **Display Names**, not filenames.
- [ ] Only valid actions used (`"allow"`, `"ask"`, `"deny"`).

## Cross-References

- [Agent Frontmatter](../harness/agent-frontmatter.md) — `name` field is the Display Name used by `task:`.
- [Subagent Structure](../harness/subagent-structure.md) — subagent taxonomy and delegation.
- [OpenCode Permission Model (research)](../research/opencode-permission-model.md) — the authority that verified the 15-key list against `opencode.ai/docs`.
