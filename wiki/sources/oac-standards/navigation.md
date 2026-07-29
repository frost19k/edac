<!-- Context: repo/standards/navigation | Priority: critical | Version: 1.2 | Updated: 2026-07-28 -->
# Repo Standards Navigation

**Purpose**: Routing file for agent creation standards  
**Last Updated**: 2026-07-28

---

## Standards Files

| File | Description | Priority |
|------|-------------|----------|
| [agent-frontmatter.md](agent-frontmatter.md) | Valid OpenCode frontmatter fields and common mistakes | critical |
| [subagent-structure.md](subagent-structure.md) | Standard structure for subagent files | critical |
| permission-keys.md | Complete permission keys table and evaluation order | critical |
| permission-agent-patterns.md | Agent-type permission patterns (read-only, write, orchestrator) | high |
| permission-security.md | Security patterns for file/directory restrictions | high |
| versioning.md | Version management and changelog conventions | medium |

> See `agent-frontmatter.md` for valid OpenCode fields and common mistakes.

---

## Loading Strategy

### Creating New Agents
1. Load `agent-frontmatter.md` — valid fields and structure
2. Load `subagent-structure.md` — subagent file template
3. Reference existing agents in `.opencode/agents/subagents/`

### Fixing Existing Agents
1. Load `agent-frontmatter.md` — identify invalid fields
2. Move OAC metadata to `.opencode/config/agent-metadata.json`
3. Validate with YAML parser before committing

### Code Reviews
1. Check frontmatter validity (`agent-frontmatter.md`)
2. Verify structure compliance (`subagent-structure.md`)

---

## Related

- Agent metadata config: `.opencode/config/agent-metadata.json`
- Root agent overview: `AGENTS.md` (repo root)
- Install guide: `docs/getting-started/installation.md`
- Eval framework: `evals/framework/`
- OpenCode docs: https://opencode.ai/docs/agents/
