---
description: Consistent naming across agents, context files, registry entries, and eval tests
version: 1.0
updated: 2026-08-13
---

# Naming Conventions

---

## General Rules

| Context | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case` | `agent-generator.md` |
| TypeScript types | `PascalCase` | `SessionContext` |
| Code identifiers | `camelCase` | `loadSession()` |
| Display names | `PascalCase` | `AgentGenerator` |
| Registry IDs | `{category}-{name}` | `standards-naming-conventions` |

---

## Agent Files

**Pattern**: `{category}/{agent-name}.md`

```
.opencode/agents/
  core/open-agent.md          # display: OpenAgent
  subagents/code/coder-agent.md  # display: CoderAgent
```

- **File name**: `kebab-case` — this is the agent's file path ID
- **Display name** (frontmatter `name`): `PascalCase` — used in OpenCode UI
- **These are different.** The file name `coder-agent.md` maps to display name `CoderAgent`

---

## Context Files

**Directory convention**: `.opencode/context/{profile}/{function}/`

**Type prefixes** in titles:

| Prefix | Type | Max Lines | Use |
|--------|------|-----------|-----|
| `Concept:` | Concept | 100 | Core ideas, definitions |
| `Guide:` | Guide | 150 | Step-by-step workflows |
| `Example:` | Example | 80 | Working code samples |
| `Lookup:` | Lookup | 100 | Quick reference tables |
| `Error:` | Error | 150 | Troubleshooting |

**Profile directories**: `core/`, `dev/`, `web/`, `intl/`

---

## Registry IDs

**Pattern**: `{category}-{component-name}`

```
standards-code-quality       # category: standards, component: code-quality
agents-open-agent            # category: agents, component: open-agent
guides-adding-agent-basics   # category: guides, component: adding-agent-basics
```

- All lowercase, hyphens only
- Category matches the registry section (agents, context, commands, etc.)

---

## Eval Test Files

**Pattern**: `{sequence}-{description}-{type}.yaml`

```
01-approval-before-bash-positive.yaml
02-context-loading-negative.yaml
smoke-test.yaml              # exception: no sequence number
```

- Sequence: zero-padded two digits
- Type: `positive` (expected pass) or `negative` (expected fail)
- Lives in: `evals/agents/{category}/{agent}/tests/`

---

## Quick Reference

```bash
# Agent file → display name mapping
coder-agent.md    → CoderAgent
context-scout.md  → ContextScout
open-agent.md     → OpenAgent

# Registry ID format
{category}-{name}  →  standards-naming-conventions
```

---

## Related Files

- `navigation.md` — Core standards index
