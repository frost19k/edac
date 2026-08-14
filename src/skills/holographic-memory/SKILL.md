---
name: holographic-memory
description: Persistent cross-session memory system using Holographic Reduced Representations (HRR). Provides the memory store and memory feedback tools for structured recall with entity-based probing, compositional reasoning, contradiction detection, and trust scoring.
---

# Holographic Memory — Agent Skill

You have access to **holographic memory**, a persistent cross-session memory system using Holographic Reduced Representations (HRR). This gives you deep structured recall beyond keyword search.

## When to Use Memory

- **Store facts**: User preferences, project decisions, architecture choices, tool configs
- **Recall context**: "What did the user prefer for X?" → `probe` or `search`
- **Find connections**: "What's related to X?" → `related`
- **Compositional reasoning**: "Facts about BOTH X and Y" → `reason`
- **Memory hygiene**: "Are there contradictions?" → `contradict`
- **Feedback**: Mark facts as helpful/unhelpful to improve trust scores

## Tools

### Memory Store — 9 Actions

| Action | Use When | Example |
|--------|----------|---------|
| `add` | Store new fact | `{ action: "add", content: "User prefers dark mode", category: "user_pref" }` |
| `search` | Keyword lookup | `{ action: "search", query: "editor config" }` |
| `probe` | Find facts ABOUT entity | `{ action: "probe", entity: "Alice" }` |
| `related` | Find facts CONNECTED to entity | `{ action: "related", entity: "backend" }` |
| `reason` | Facts about ALL entities | `{ action: "reason", entities: ["peppi", "backend"] }` |
| `contradict` | Find conflicting facts | `{ action: "contradict" }` |
| `update` | Modify existing fact | `{ action: "update", fact_id: 42, content: "Updated text" }` |
| `remove` | Delete a fact | `{ action: "remove", fact_id: 42 }` |
| `list` | Browse by category | `{ action: "list", category: "project" }` |

### Memory Feedback — 2 Actions

| Action | Effect |
|--------|--------|
| `helpful` | trust += 0.05 (small reward) |
| `unhelpful` | trust -= 0.10 (2× penalty — bad facts sink faster) |

## Categories

- `user_pref` — User preferences, communication style
- `project` — Project facts, decisions, architecture
- `tool` — Tool configurations, workflows
- `general` — Everything else (default)

## Retrieval Strategies

1. **search** — Hybrid: FTS5 (40%) + Jaccard (30%) + HRR (30%) × trust × decay
2. **probe** — Entity-specific algebraic recall (NOT keyword search)
3. **related** — Structural adjacency through shared context
4. **reason** — Compositional AND (vector-space JOIN)
5. **contradict** — Memory hygiene (high entity overlap + low content similarity)

## Trust Scoring

- Asymmetric: +0.05 helpful, -0.10 unhelpful (2× penalty)
- A fact needs ~20 helpful ratings to reach max trust (0.5 → 1.0)
- A fact needs only ~5 unhelpful ratings to sink to zero (0.5 → 0.0)
- Bad facts sink faster than good facts rise

## Best Practices

1. **Store proactively**: When user states a preference or decision, store it immediately
2. **Use categories**: Helps with retrieval precision
3. **Add tags**: Comma-separated, improves Jaccard matching
4. **Probe before search**: For entity-specific queries, `probe` is more precise than `search`
5. **Use `reason` for multi-entity**: When you need facts about MULTIPLE entities simultaneously
6. **Run `contradict` periodically**: Keep memory clean by detecting conflicting facts
7. **Record feedback**: When you use a fact and it helps (or doesn't), record it

## Example Workflow

```
# User says: "I prefer vim keybindings in VS Code"
# Store a fact via holographic memory:
fact_store({ action: "add", content: "User prefers vim keybindings in VS Code", category: "user_pref", tags: "editor,vim,vscode" })

# Later, need to recall editor preferences
# Search facts via holographic memory:
fact_store({ action: "search", query: "editor keybindings" })
# OR probe for a specific entity:
fact_store({ action: "probe", entity: "vim" })

# Used the fact and it was helpful — record feedback via holographic memory:
fact_feedback({ action: "helpful", fact_id: 7 })
```
