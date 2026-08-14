# Holographic Memory — OpenCode Plugin

A persistent cross-session memory system for OpenCode using **Holographic Reduced Representations (HRR)** — a vector symbolic architecture for compositional algebraic memory retrieval.

Ported from [Hermes Agent's Holographic Memory](https://github.com/NousResearch/hermes-agent/tree/main/plugins/memory/holographic) by Nous Research.

## Features

- **Local-first**: Everything in SQLite, no cloud, no API keys
- **Zero external deps**: Uses Bun's built-in SQLite and Web Crypto
- **5 retrieval strategies**: Hybrid search, entity probe, structural adjacency, compositional AND, contradiction detection
- **Trust scoring**: Asymmetric feedback (bad facts sink 2× faster than good facts rise)
- **HRR algebra**: Phase vectors for compositional structure (bind, unbind, bundle, similarity)

## Install

### 1. Clone to OpenCode plugins directory

```bash
git clone https://github.com/YOUR_USER/holographic-memory.git ~/.config/opencode/plugins/holographic-memory
```

### 2. Install dependencies

```bash
cd ~/.config/opencode/plugins/holographic-memory
bun install
```

### 3. Copy companion skill (optional but recommended)

```bash
cp -r skills/holographic-memory ~/.config/opencode/skills/holographic-memory
```

### 4. Configure (optional)

Copy the default config and customize:

```bash
mkdir -p ~/.config/opencode/memory
cp config/holographic_memory.json ~/.config/opencode/holographic_memory.json
```

Edit `~/.config/opencode/holographic_memory.json`:

```json
{
  "db_path": "~/.config/opencode/memory/memory_store.db",
  "auto_extract": false,
  "default_trust": 0.5,
  "hrr_dim": 1024,
  "hrr_weight": 0.3,
  "temporal_decay_half_life": 0,
  "min_trust_threshold": 0.3
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `db_path` | `~/.config/opencode/memory/memory_store.db` | SQLite database path |
| `auto_extract` | `false` | Auto-extract facts from conversation on session compaction |
| `default_trust` | `0.5` | Initial trust score for new facts (0-1) |
| `hrr_dim` | `1024` | HRR vector dimensionality |
| `hrr_weight` | `0.3` | Weight of HRR similarity in hybrid search |
| `temporal_decay_half_life` | `0` | Half-life in days (0 = disabled) |
| `min_trust_threshold` | `0.3` | Minimum trust for retrieval |

## Usage

### Tools

**`fact_store`** — 9 actions:

```bash
# Store a fact
fact_store({ action: "add", content: "User prefers dark mode", category: "user_pref" })

# Search (hybrid FTS5 + Jaccard + HRR)
fact_store({ action: "search", query: "editor config" })

# Entity-specific algebraic recall
fact_store({ action: "probe", entity: "Alice" })

# Structural adjacency
fact_store({ action: "related", entity: "backend" })

# Compositional AND (vector-space JOIN)
fact_store({ action: "reason", entities: ["peppi", "backend"] })

# Find contradictions
fact_store({ action: "contradict" })

# Update/remove/list
fact_store({ action: "update", fact_id: 42, content: "Updated" })
fact_store({ action: "remove", fact_id: 42 })
fact_store({ action: "list", category: "project" })
```

**`fact_feedback`** — 2 actions:

```bash
fact_feedback({ action: "helpful", fact_id: 7 })    # trust += 0.05
fact_feedback({ action: "unhelpful", fact_id: 7 })  # trust -= 0.10
```

### Categories

| Category | Use Case |
|----------|----------|
| `user_pref` | User preferences, communication style |
| `project` | Project facts, decisions, architecture |
| `tool` | Tool configurations, workflows |
| `general` | Everything else (default) |

### Trust Scoring

- Asymmetric: `+0.05` helpful, `-0.10` unhelpful (2× penalty)
- A fact needs ~20 helpful ratings to reach max trust (0.5 → 1.0)
- A fact needs only ~5 unhelpful ratings to sink to zero (0.5 → 0.0)
- Bad facts sink faster than good facts rise

## How It Works

### HRR Algebra (Phase Vectors)

Each concept is a vector of angles in `[0, 2π)`, seeded from SHA-256:

| Operation | Formula | Meaning |
|-----------|---------|---------|
| `bind(a, b)` | `(a + b) mod 2π` | Associate two concepts |
| `unbind(mem, key)` | `(mem - key) mod 2π` | Retrieve bound value |
| `bundle(*vs)` | `arg(Σ e^(jv)) mod 2π` | Superpose multiple concepts |
| `similarity(a, b)` | `mean(cos(a - b))` | Phase cosine similarity [-1, 1] |

### Retrieval Pipeline

1. **search** — FTS5 (40%) + Jaccard (30%) + HRR (30%) × trust × decay
2. **probe** — Unbind entity+role from memory bank (algebraic extraction)
3. **related** — Structural adjacency via shared context
4. **reason** — Vector-space JOIN across multiple entities
5. **contradict** — High entity overlap + low content similarity

### SQLite Schema

4 tables + FTS5 virtual table:

- `facts` — Content, category, tags, trust_score, hrr_vector (BLOB)
- `entities` — Name, aliases, entity_type
- `fact_entities` — Many-to-many junction
- `memory_banks` — Category-level superposed HRR vectors
- `facts_fts` — FTS5 (auto-synced via triggers)

## Architecture

```
src/
├── hrr.ts                  # HRR algebra (pure functions)
├── entities.ts             # Entity extraction (pure functions)
├── store.ts                # SQLite store (data layer)
├── retrieval.ts            # Retrieval pipeline (5 strategies)
├── holographic-memory.ts   # OpenCode plugin entry
└── types.ts                # TypeScript types
```

## Development

```bash
# Type check
bun run check

# Run tests
bun test
```

## License

MIT — Ported from [Hermes Agent](https://github.com/NousResearch/hermes-agent) by Nous Research.
