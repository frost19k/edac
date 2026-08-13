---
description: Quick reference for task-cli.ts commands
version: 1.0
updated: 2026-08-13
---

# Lookup: Task CLI Commands

---

## Usage

```bash
npx ts-node .opencode/context/tasks/scripts/task-cli.ts <command> [args]
```

Task files are stored in `.tmp/tasks/` at the project root.

---

## Commands

### status [feature]

Show task status summary for all features or specific feature.

```bash
task-cli.ts status
task-cli.ts status my-feature
```

**Output**:
```
[my-feature] My Feature Name
  Status: active | Progress: 40% (2/5)
  Pending: 2 | In Progress: 1 | Completed: 2 | Blocked: 0
```

---

### next [feature]

Show tasks ready to work on (deps satisfied).

```bash
task-cli.ts next
task-cli.ts next my-feature
```

**Output**:
```
=== Ready Tasks (deps satisfied) ===

[my-feature]
  02 - Create JWT service  [sequential]
  03 - Write unit tests    [parallel]
```

---

### parallel [feature]

Show only parallelizable tasks ready now.

```bash
task-cli.ts parallel
task-cli.ts parallel my-feature
```

**Use**: Batch multiple isolated tasks for parallel execution.

---

### deps \<feature\> \<seq\>

Show dependency tree for a specific task.

```bash
task-cli.ts deps my-feature 04
```

**Output**:
```
=== Dependency Tree: my-feature/04 ===

04 - Integration tests [pending]
  ├── ✓ 01 - Setup database [completed]
  └── ○ 02 - Create API [pending]
      └── ✓ 01 - Setup database [completed]
```

---

### blocked [feature]

Show blocked tasks and reasons.

```bash
task-cli.ts blocked
task-cli.ts blocked my-feature
```

**Output**:
```
=== Blocked Tasks ===

[my-feature]
  04 - Integration tests (waiting: 02, 03)
  05 - Deploy (explicitly blocked)
```

---

### complete \<feature\> \<seq\> "summary"

Mark task as completed with summary (max 200 chars).

```bash
task-cli.ts complete my-feature 02 "Created JWT service with RS256 signing"
```

**Effect**:
- Sets `status: "completed"`
- Sets `completed_at` timestamp
- Sets `completion_summary`
- Updates `task.json` counts

---

### validate [feature]

Check JSON validity, dependencies, circular refs.

```bash
task-cli.ts validate
task-cli.ts validate my-feature
```

**Checks**:
- task.json exists
- ID format correct
- Dependencies exist
- No circular dependencies
- Counts match

**Output**:
```
[my-feature]
  ✓ All checks passed

[broken-feature]
  ✗ ERROR: 03: depends on non-existent task 99
  ⚠ WARNING: 02: No acceptance criteria defined
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (validate found issues, missing args) |

---

## Enhanced Schema Support

The CLI fully supports the enhanced task schema (v2.0) with:
- **Line-number precision** - Context files with specific line ranges
- **Domain modeling** - bounded_context, module, vertical_slice fields
- **Contract tracking** - API/interface dependencies
- **Design artifacts** - Figma, wireframes, mockups
- **ADR references** - Architecture decision records
- **Prioritization** - RICE/WSJF scores

All enhanced fields are optional and backward compatible. See `../standards/task-examples.md` for details.

---

## Planning Workflow Integration

For multi-stage orchestration workflows, use TaskManager to decompose features into subtasks before task creation. ContextScout can discover relevant context files, and the orchestrator persists them into the task's context_files array.

See `../workflows/multi-stage-orchestration.md` for the complete workflow.

---

## Related Files

- `../standards/task-schema.md` - Base JSON schema reference
- `../standards/task-examples.md` - Field-level examples and enhanced features
- `../guides/managing-tasks.md` - Workflow guide
- `../workflows/multi-stage-orchestration.md` - Planning workflow
