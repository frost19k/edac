<!-- Context: repo/standards/subagent-structure | Priority: critical | Version: 1.2 | Updated: 2026-07-28 -->
# Standard: Subagent File Structure

**Purpose**: Standard structure for subagent files  
**Priority**: CRITICAL - Load this before creating subagent files

---

## File Template

```markdown
---
name: AgentName
description: Brief description
mode: subagent
temperature: 0.1
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

---

## Section Details

### 1. Frontmatter
- ONLY valid OpenCode fields (see agent-frontmatter.md)
- No duplicate keys, orphaned items, or invalid fields

### 2. Header + Mission
```markdown
# TestEngineer
> **Mission**: Author tests following TDD — grounded in project standards.
```

### 3. Critical Rules (3-5 max)
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

Refer to [permission-agent-patterns.md](permission-agent-patterns.md) for complete agent-type permission patterns (Read-Only, Write-Enabled, Orchestrators, Restricted Bash).

**Quick reference**: Read-Only agents deny `edit` and `bash`. Write-Enabled agents deny `**/*.env` and `**/*.key` in `edit`, restrict `bash` to specific commands. Task Managers use restricted bash (only task-cli).

---

## File Organization

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
- [ ] 3-5 critical rules with unique IDs?
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

**Security Pattern**:
```yaml
permission:
  edit:
    "**/*.env": "deny"
    "**/*.key": "deny"
    "**/*.secret": "deny"
```

---

## Examples

**See existing subagents**:
- `.opencode/agents/subagents/code/test-engineer.md` - Write-enabled with tests
- `.opencode/agents/subagents/code/code-reviewer.md` - Read-only reviewer
- `.opencode/agents/subagents/core/task-manager.md` - Restricted bash

---

## Related

- **Frontmatter**: [agent-frontmatter.md](agent-frontmatter.md)
- **Permission Patterns**: [permission-agent-patterns.md](permission-agent-patterns.md)
- **OpenCode Docs**: https://opencode.ai/docs/agents/

---

**Last Updated**: 2026-07-28 | **Version**: 1.2.0
