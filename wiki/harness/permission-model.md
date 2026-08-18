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

The following 14 keys are the **verified canonical set**, confirmed against `opencode.ai/docs` (see [../research/opencode-permission-model.md](../research/opencode-permission-model.md)):

`read`, `edit`, `glob`, `grep`, `bash`, `task`, `external_directory`, `todowrite`, `webfetch`, `websearch`, `lsp`, `skill`, `question`, `doom_loop`

**This verified list supersedes the contradictory OAC source files.** Specific corrections:

- `permission-keys.md` **omitted** `question` and **falsely listed** `todoread` (not a standalone key — it is gated by `todowrite`) and `codesearch` (not a valid key).
- `agent-frontmatter.md` **omitted** `todowrite`.
- `agent-prompt-design.md` **omitted** `external_directory`.
- `list` was listed in the Agents page permission table but has no corresponding tool on the Tools page and is absent from the Permissions page "Available Permissions" list. It is inert — a permission key for a tool that does not exist. Do not use it.

Use the 14-key list above; do not reintroduce `todoread`, `codesearch`, or `list`.

**Key notes:**

- `external_directory` is a valid key (default `"ask"`), but OAC/EDAC agents do not set it — they rely on OpenCode's default external-directory behaviour.
- There is **no `write` key.** The `edit` key covers both modifying existing files and creating new files. A `write:` entry in a `permission:` block is silently ignored by OpenCode — use `edit` instead.
- `question` is valid only on primary agents (those that interact with the user directly); subagents omit it from their frontmatter.

**Global-only vs per-agent keys:**

EDAC's `opencode.jsonc` template (merged into the target config at install time) defines five permissions globally. Agent frontmatters should not repeat these unless overriding with a *more restrictive* value:

- **Global-only keys** (defined in `opencode.jsonc`): `webfetch`, `websearch`, `question`, `skill`, `external_directory`.
- **Per-agent keys** (defined in agent frontmatter): `bash`, `read`, `edit`, `grep`, `glob`, `task`.
- **Restrictive overrides**: an agent MAY declare a global-only key if it needs a more restrictive value than the global config (e.g., TaskManager declares `skill: {*: deny, task-management: allow}` to deny all skills except one). A declaration that merely duplicates the global value is noise — remove it.

**Canonical key ordering:**

Agent frontmatter permission blocks should declare keys in this order: `bash` → `read` → `edit` → `grep` → `glob` → `task`. This ordering reflects the security-criticality gradient (most dangerous first) and groups file-system keys together. Additional keys (e.g., a restrictive `skill` override) appear after `task`.

**Granular vs shorthand keys (format spec):**

Not all 14 keys accept the same value format. This distinction was verified against `opencode.ai/docs` (see [../research/opencode-permission-model.md](../research/opencode-permission-model.md) §"Granular vs shorthand") and is the authority on how each key must be declared.

- **Granular keys** — accept either a shorthand action (`"allow"`) or an object of glob/pattern → action (`{"*": "deny", "git status *": "allow"}`):
  `read`, `edit`, `glob`, `grep`, `bash`, `task`, `external_directory`, `lsp`, `skill`
- **Shorthand-only keys** — accept a single action string only (`"allow"`, `"ask"`, or `"deny"`). A glob-pattern object (`{"*": "allow"`) is **invalid** and causes a configuration error at load time:
  `webfetch`, `websearch`, `question`, `todowrite`, `doom_loop`

```yaml
# ✅ Correct — granular key with pattern object
bash:
  "*": "deny"
  "git status *": "allow"

# ✅ Correct — shorthand-only key with action string
webfetch: "allow"

# ❌ Invalid — shorthand-only key with pattern object (causes config error)
webfetch:
  "*": "allow"
```

### Wildcard Matching Semantics (bash and other granular keys)

Permission patterns for granular keys (`bash`, `read`, `edit`, `glob`, `grep`, `task`, etc.) use simple wildcard matching, verified against `packages/opencode/src/util/wildcard.ts` (`match()` and `all()`):

- **`*`** matches zero-or-more of any character; **`?`** matches exactly one; all other characters match literally.
- **Full-string anchored.** The pattern must match the entire input (`^pattern$`). `"git status *"` does not match `xgit status foo`. This is why every command pattern carries a trailing ` *` rather than relying on substring match.
- **Trailing ` *` matches the bare command too.** A pattern ending in ` *` (space + asterisk) is rewritten so the trailing part is optional: `"ls *"` matches both `ls` and `ls -la`; `"python *"` matches both `python` and `python -c foo`. A separate no-args entry is unnecessary.
- **`"cmd *"` vs `"cmd*"` — the space is a poka-yoke.** The space delimits command from arguments and triggers the optional-argument handling. Without it, `*` absorbs the boundary: `"python*"` matches `python`, `python3`, and `pythonista`. Always use `"cmd *"` (with space) for a single command binary.
- **One entry per distinct binary.** `"python *"` does not match `python3 script.py` (distinct command). Declare a separate entry per binary the agent may invoke (`"python *"` + `"python3 *"`, `"pip *"` + `"pip3 *"`).
- **Evaluation is sort-by-length, last-match-wins.** The matcher sorts patterns by length ascending (alphabetical tiebreak) and returns the last match. The catch-all `"*"` (length 1) always sorts first, so "declare catch-all first" produces correct behavior — but the mechanism is length-sorted, not source-order. Avoid relying on declaration order for tiebreaks between equal-length patterns.

*Why this matters:* an agent allow-listing only `"python *"` and reaching for `python3` will be blocked — not because the space is wrong, but because `python3` is a different binary. The fix is a second entry, not a spaceless wildcard (which would overmatch). See [../research/opencode-permission-model.md](../research/opencode-permission-model.md) for the source-verified detail.

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
  bash: { "*": "deny", "git status *": "allow", "git diff *": "allow", "git log *": "allow" }
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

### Bash Allow-List Conventions (File-Operation Duplicates Excluded)

Bash `allow` entries should exclude commands that duplicate harness tools for **file operations** — operations where the harness tool provides structured, permission-governed access that bash bypasses. The distinction is **pipeline participation**: harness tools (`read`, `edit`, `grep`, `glob`) operate on discrete file targets and cannot compose into stdin/stdout pipelines; some bash utilities duplicate harness tools for file use but also serve as pipeline stages, where no harness equivalent exists.

**File-operation duplicates to exclude from bash allow-lists** (no pipeline use case; pure file reads/writes the harness tools cover with permission granularity):
- `cat` → use `read`
- `find` → use `glob`

**Pipe-capable duplicates permitted in bash allow-lists** (participate in stdin/stdout pipelines harness tools structurally cannot; vibeguard redaction layer mitigates the credential-leak surface this re-opens):
- `grep`, `head`, `tail` — read streams in pipelines (`cmd | grep …`, `cmd | head -n`)
- `sed`, `awk` — transform streams in pipelines (`cmd | sed …`, `cmd | awk …`)
- `tee` — branch a pipeline while preserving stdout
- `ls` — pipe-capable and serves metadata use cases `glob` cannot: `ls | wc -l` (count), `ls -t | head -5` (most-recent), `ls -la | grep '.log'` (filter detailed listings), `ls -la` (permissions/sizes/dates). `glob` returns paths only; it cannot sort by time, display metadata, or compose into a counting pipeline.

*Why the split:* a blanket "exclude all harness-tool duplicates" rule (the prior convention) would deny `grep`/`head`/`tail`/`sed`/`awk`/`tee`/`ls` even though their pipeline and metadata roles have no harness equivalent — forcing the agent either to skip the pipeline or to re-implement stream processing through repeated `read`+`edit` calls. The file-operation duplicates (`cat`/`find`) have no such pipeline role: `cat` reads a file (use `read`), `find` enumerates paths (use `glob`). Source of truth: commit `85ee669` re-added the pipe-capable set to OpenCoder and OpenAgent with this rationale after a prior cleanup had removed them; `ls` was subsequently reclassified from file-op duplicate to pipe-capable on the same basis (pipeline participation + metadata use cases `glob` cannot serve).

**Valid bash allow-list categories:**
- Domain-specific commands (git, docker, bun, npm, terraform, kubectl)
- Pipe-capable harness duplicates (grep, head, tail, sed, awk, tee, ls) — see above
- Text-processing pipeline utilities that operate on stdin/stdout (sort, uniq, cut, tr, jq, yq, diff, base64)
- System-info commands (pwd, which, whoami, uname, date, env)
- Network fetch (curl, wget)
- Filesystem mutations without a harness equivalent (mkdir, touch, cp, mv, rm)

*Why file-operation exclusion holds:* the harness tools provide structured, permission-governed access to file operations. Allowing the same operations through bash bypasses the permission model's granularity — a `cat *.env` allow entry would read sensitive files that `read:` denies. The pipe-capable set does not bypass file permission in this way: they read from stdin (a prior pipeline stage) or enumerate the CWD, not from an agent-named path, so the path-based bypass argument does not extend to them. The residual leak surface — a pipeline stage surfacing a secret in its output — is mitigated by vibeguard output redaction, not by path denies.

**Permission calibration by knowledge tier.** How bash allow-lists and `task:` allows should be audited depends on the knowledge category of the entry — see [Instruction Knowledge Tiers](../framework/instruction-knowledge-tiers.md):
- **Ambient-knowledge** (Tier 1): bash allow-list entries for ambient utilities (`echo`, `wc`, `jq`, `sort`, `diff`) should NOT be audited against body prescription. These are part of the bash capability; the agent knows they exist and will reach for them as the situation demands. An `echo` entry is not an over-grant even when no body instruction names `echo`.
- **Framework-facts** (Tier 3): `task:` allows MUST match body-authorized delegations (see §e). A `task:` allow for a subagent the body never delegates to is an over-grant — the agent cannot discover the subagent from training, so the body's silence is authoritative. This is the one place where prescription-matching is the correct audit lens.

### Bash Working-Directory Discipline (Bare Relative Paths from Session CWD)

EDAC agents operate in the project working directory by default. Bash commands should use **bare relative paths resolved from the session CWD** — not absolute paths, not the bash tool's `workdir` parameter, not `cd /abs && <cmd>` chaining, and not tool-specific directory flags (`git -C`, `npm --prefix`, etc.).

**The rule:**
- Use bare relative paths: `bun run validate`, `git status`, `ls scripts/install/` (where `ls` is permitted per the allow-list conventions above).
- Do NOT set the `workdir` parameter on the bash tool — the harness already resolves commands in the session CWD; setting `workdir` is redundant and obscures the CWD assumption.
- Do NOT prepend `cd /abs/path && <cmd>` — absolute-path chaining adds shell-quoting hazard without benefit when the CWD is already the project root.
- Do NOT use directory-flag forms (`git -C /abs`, `npm --prefix /abs`) — they fight the harness's CWD model for the same reason.

**Structural gate for paths outside the project:** the `external_directory` permission key (see `opencode.jsonc`) governs filesystem access outside the project root. The default is `*`: `ask`, with two allow entries: `/tmp/opencode/**` and `~/.config/opencode/context/**`. Any bash command (or `read`/`edit`/`glob`) targeting a path outside the project triggers the `ask` gate — this is the structural enforcement for out-of-project access, not a prose rule the agent must remember.

**Exception — ContextScout:** bash is fully denied for ContextScout (`"*": "deny"`), so the working-directory rule is vacuous for it. ContextScout's `read`/`glob` targets `~/.config/opencode/context/**` (per its `context_root` and `global_fallback` rules) — it is the designated consumer of the `external_directory` allow entry for the global context directory. No other EDAC agent has this profile.

*Why bare relative paths:* all EDAC agents except ContextScout operate in the project working directory; the harness auto-allows the CWD; `external_directory` is the structural gate for everything else. Layering absolute-path discipline (prepending `cd /abs &&`, setting `workdir`, or using `git -C`-style flags) duplicates the harness mechanism and adds shell-quoting hazard without closing a real failure mode — the `external_directory` `ask` gate already catches out-of-project access. The discipline is "trust the CWD; let `external_directory` gate the rest."

## (d) Security Patterns

### Canonical sensitive-file deny block (Always Deny Sensitive Files)

Deny sensitive files under **`read` and `edit`** using path globs — these match file paths and work correctly. **`grep` is also a leak vector** (it returns matching lines, surfacing a secret in output), **but its permission matches the SEARCH QUERY, not the file path.** Path globs like `**/*.env` are therefore **inert** under `grep:`; restrict `grep:` with search-term denies instead (next subsection). Verified against `opencode.ai/docs` and an in-repo empirical test.

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
- [ ] Shorthand-only keys (`webfetch`, `websearch`, `question`, `todowrite`, `doom_loop`) declared as action strings, not pattern objects — see §b "Granular vs shorthand keys".
- [ ] Sensitive files denied under `read` and `edit` (path globs) for ALL agents; `grep` restricted by search-term denies (see §d "Canonical grep search-term deny block") — `grep` CANNOT be scoped by file path. Omit only for a tool denied wholesale via `"*": "deny"`.
- [ ] Dangerous commands denied (`sudo *`, `rm -rf /*`, `> /dev/*`, `chmod 777 *`); destructive operations set to `ask` (`rm -rf *`, `git push --force*`, `docker system prune*`, `npm publish*`).
- [ ] Bash allow-lists contain no harness-tool duplicates (`cat`/`head`/`tail` = `read`; `grep`/`rg` = `grep`; `find`/`ls` = `glob`; `sed`/`awk`/`tee`/`patch` = `edit`/`write`) — see §c "Bash Allow-List Conventions".
- [ ] Write-enabled agents declare explicit `read`, `grep`, `glob` permissions rather than relying on defaults.
- [ ] `task:` permissions appropriate for agent type and use **Display Names**, not filenames.
- [ ] Only valid actions used (`"allow"`, `"ask"`, `"deny"`).

## Cross-References

- [Agent Frontmatter](../harness/agent-frontmatter.md) — `name` field is the Display Name used by `task:`.
- [Subagent Structure](../harness/subagent-structure.md) — subagent taxonomy and delegation.
- [Global Config Template](../harness/global-config.md) — the `opencode.jsonc` template that defines the permission floor (global-only keys).
- [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) — how agent body text handles globally-provisioned tools (MCPs, plugins) without per-agent permission entries.
- [Instruction Knowledge Tiers](../framework/instruction-knowledge-tiers.md) — the three knowledge categories (ambient-knowledge / preference-guidance / framework-facts) that govern permission calibration: ambient utilities not audited against body prescription (Tier 1), `task:` allows must match body-authorized delegations (Tier 3).
- [OpenCode Permission Model (research)](../research/opencode-permission-model.md) — the authority that verified the 14-key list against `opencode.ai/docs`.
