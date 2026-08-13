---
description: JSON-driven task breakdown and tracking system
version: 1.0
updated: 2026-08-13
---

# Task Management Navigation

---

## Structure

```
core/task-management/
├── navigation.md
├── standards/
│   ├── task-schema.md           # Base JSON schema (v1.0)
│   ├── task-fields.md           # Field definitions
│   ├── task-examples.md          # Field-level examples and enhanced features
│   └── task-migration.md         # Schema migration guide
├── guides/
│   ├── splitting-tasks.md       # Task decomposition
│   └── managing-tasks.md        # Workflow guide
└── lookup/
    └── task-commands.md         # CLI script reference
```

---

## Quick Routes

| Task | Path | Priority |
|------|------|----------|
| **Understand base schema** | `standards/task-schema.md` | ⭐⭐⭐⭐⭐ |
| **See field examples** | `standards/task-examples.md` | ⭐⭐⭐⭐ |
| **Split a feature** | `guides/splitting-tasks.md` | ⭐⭐⭐⭐⭐ |
| **Manage task lifecycle** | `guides/managing-tasks.md` | ⭐⭐⭐⭐ |
| **Use CLI commands** | `lookup/task-commands.md` | ⭐⭐⭐⭐ |

---

## Loading Strategy

### For Creating Basic Tasks:
1. Load `standards/task-schema.md` (understand base structure)
2. Load `guides/splitting-tasks.md` (decomposition approach)
3. Reference `lookup/task-commands.md` (validate after creation)

### For Multi-Stage Orchestration:
1. Load `standards/task-schema.md` (advanced features)
2. Load `standards/task-examples.md` (field-level examples)
3. Load `guides/splitting-tasks.md` (decomposition approach)
4. Reference `../workflows/multi-stage-orchestration.md` (planning workflow)

### For Managing Tasks:
1. Load `guides/managing-tasks.md` (workflow)
2. Reference `lookup/task-commands.md` (CLI usage)

---

## Related Files

- **Active tasks** → `.tmp/tasks/{feature}/` (at project root)
- **Completed tasks** → `.tmp/tasks/completed/{feature}/`
- **TaskManager agent** → `.opencode/agents/subagents/core/task-manager.md`
- **Multi-stage workflow** → `../workflows/multi-stage-orchestration.md`
- **Core navigation** → `../navigation.md`
