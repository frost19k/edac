---
title: Subagent File Structure
type: concept
tags: [opencode, subagent, structure, harness, oac-standards]
created: 2026-07-29
updated: 2026-07-31
sources: ["(removed) oac-standards/subagent-structure.md"]
status: stable
---

# Subagent File Structure

**Finding**: OpenAgentsControl (OAC) defines a canonical template for subagent files — a fixed frontmatter contract, a one-sentence mission, 3–5 uniquely-IDed critical rules, a structured `<context>` block, numbered execution tiers with explicit conflict resolution, a workflow, and an output format. This page preserves that standard verbatim from the OAC source so EDAC can adopt or adapt it. **Verification flag**: the source describes OAC's directory layout (`.opencode/agents/subagents/{code,core,system-builder}/`); EDAC's actual layout may differ and is **not** asserted here as fact — see the flag in [File Organization](#file-organization-flag).

Cross-links: the frontmatter contract is governed by [Agent Frontmatter](../harness/agent-frontmatter.md); the permission patterns referenced below are consolidated in [Permission Model](../harness/permission-model.md) (D2 — do **not** use the OAC `permission-agent-patterns.md` reference).

---

## File Template

```markdown
---
name: AgentName
description: Brief description
mode: subagent
temperature: 0.2-0.3
permission: {...}
---

# AgentName
> **Mission**: One-sentence mission

<rule id="rule_name">Rule description</rule>

<context>
  <system>Role in pipeline</system>
  <domain>Expertise area</domain>
  <task>What agent does</task>
  <constraints>Limitations</constraints>
</context>

<tier level="1" desc="Critical">
  - @rule_id: Description
</tier>

## Workflow
### Step 1: Preparation
### Step 2: Execution
### Step 3: Output

## Output Format
```yaml
status: "success" | "failure"
```
```

> **Note (D3)**: the OAC source specifies `temperature: 0.1` in its template. EDAC convention is `temperature: 0.2-0.3`; all example frontmatter blocks in this page use `0.2-0.3`.

---

## Section Details

### 1. Frontmatter
- ONLY valid OpenCode fields (see [Agent Frontmatter](../harness/agent-frontmatter.md)).
- No duplicate keys, orphaned items, or invalid fields.

### 2. Header + Mission
```markdown
# TestEngineer
> **Mission**: Author tests following TDD — grounded in project standards.
```

### 3. Critical Rules (3–5 max)
```markdown
<rule id="context_first">ALWAYS call ContextScout BEFORE writing tests.</rule>
<rule id="positive_and_negative">EVERY behavior needs positive AND negative tests.</rule>
```

### 4. Context
```markdown
<context>
  <system>Code quality gate</system>
  <domain>Code review, security, quality</domain>
  <task>Review code against standards</task>
  <constraints>Read-only, no modifications</constraints>
</context>
```

### 5. Execution Tiers
```markdown
<tier level="1" desc="Critical">
  - @context_first: Load context first
</tier>
<tier level="2" desc="Core">
  - Load standards
  - Analyze code
</tier>
<conflict_resolution>Tier 1 overrides Tier 2/3</conflict_resolution>
```

---

## Tool Permission Patterns

Refer to [Permission Model](../harness/permission-model.md) for complete agent-type permission patterns (Read-Only, Write-Enabled, Orchestrators, Restricted Bash). *(D2: the OAC source links to `permission-agent-patterns.md`; that page is consolidated into the EDAC `permission-model.md` above.)*

**Quick reference**: All agents deny sensitive files (`**/*.env`, `**/*.key`, `**/*.secret`, `**/*.pem`, `**/*.crt`, `**/credentials*`, `**/*.api`, `**/creds*`) under `read` and `edit` (path globs, which match file paths and work correctly). `grep` is a leak vector too, but its permission matches the **search query**, not the file path — so path globs are **inert** under `grep:`; restrict `grep:` with search-term denies instead (see [Permission Model](../harness/permission-model.md) §d). Read-Only agents additionally deny `edit` and `bash` wholesale; Write-Enabled agents restrict `bash` to specific commands.

---

## File Organization (FLAG)

> **⚠ Verification item — NOT asserted as EDAC fact.** The tree below is OAC's layout as written in the source. EDAC's actual subagent directory structure may differ (EDAC uses `src/agents/subagents/<tier>/` — `core/`, `code/`, `development/` — per `src-structure.md`, not OAC's `.opencode/agents/`). Treat this as a research note to confirm against EDAC's real tree before adopting.

```
.opencode/agents/subagents/
├── code/           # test-engineer, code-reviewer, coder-agent, build-agent
├── core/           # task-manager, context-scout, doc-writer
├── system-builder/ # agent-generator, command-creator
```

---

## Validation Checklist

- [ ] Valid OpenCode frontmatter (no extra fields)?
- [ ] Mission statement present?
- [ ] 3–5 critical rules with unique IDs?
- [ ] Context section complete?
- [ ] Execution tiers defined with conflict resolution?
- [ ] Workflow steps clear and actionable?
- [ ] Output format specified?
- [ ] Tool permissions appropriate for role?
- [ ] File in correct category directory?
- [ ] No YAML syntax errors?

---

## Common Patterns

**Context-First Pattern**:
```markdown
<rule id="context_first">
  ALWAYS call ContextScout BEFORE starting work. Load relevant standards first.
</rule>
```

**Read-Only Pattern**:
```markdown
<rule id="read_only">
  Read-only agent. NEVER use write, edit, or bash. Provide suggestions only.
</rule>
```
Sensitive files are denied under `read` and `edit` (path globs); `grep` is restricted by search-term denies (see [Permission Model](../harness/permission-model.md) §d) — `grep` CANNOT be scoped by file path.

**Security Pattern**:
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
    "*": "allow"
    # grep matches the SEARCH QUERY, not the file path — path globs (e.g. **/*.env) are INERT here.
    # Sensitive search-term denies: see Permission Model §d "Canonical grep search-term deny block".
```

---

## Examples

**See existing subagents** (EDAC paths per `src-structure.md`; verify against the live `src/agents/subagents/` tree):
- `src/agents/subagents/code/test-engineer.md` - Write-enabled with tests
- `src/agents/subagents/code/code-reviewer.md` - Read-only reviewer
- `src/agents/subagents/core/task-manager.md` - Restricted bash

---

## Related

- **Frontmatter**: [Agent Frontmatter](../harness/agent-frontmatter.md)
- **Permission Model**: [Permission Model](../harness/permission-model.md) (consolidated; replaces OAC `permission-agent-patterns.md`)
- **OpenCode Docs**: https://opencode.ai/docs/agents/

---

**Source**: OAC Standard v1.2.0 (source `oac-standards/subagent-structure.md` removed, 2026-07-28). Ingested 2026-07-29 under EDAC decisions D2 (permission consolidation) and D3 (`temperature: 0.2-0.3`).
