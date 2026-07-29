<!-- Context: core/standards | Priority: high | Version: 1.0 | Updated: 2026-07-28 -->

# TypeScript Array Operations

**Purpose**: Functional array methods, for-loop usage, and type guard patterns on filter.

---

## 3.1 Functional Methods (Preferred)

**Rule: Prefer map/filter/reduce over for-loops**

```typescript
// ✅ GOOD - Functional chain with type inference
const files = messages
  .flatMap((x) => x.parts)
  .filter((x): x is Patch => x.type === "patch")
  .flatMap((x) => x.files)
  .map((x) => path.relative(worktree, x))

// ✅ GOOD - Parallel async operations
const results = await Promise.all(
  toolCalls.map(async (call) => {
    return executeCall(call)
  }),
)

// ✅ GOOD - Reduce for aggregation
const totalAdditions = diffs.reduce((sum, x) => sum + x.additions, 0)

// ✅ GOOD - Unique values
const uniqueNames = Array.from(new Set(items.map((x) => x.name)))

// ✅ GOOD - Sorting
const sorted = items.toSorted((a, b) => a.timestamp - b.timestamp)
```

---

## 3.2 For-Loops (When Necessary)

**Rule: Use for-loops only for:**
1. Algorithm complexity (DP, graph traversal)
2. Early exit requirements
3. Sequential side effects
4. Performance-critical iteration

```typescript
// ✅ GOOD - Early exit
const patches = []
for (const msg of all) {
  if (msg.info.id === targetID) break
  for (const part of msg.parts) {
    if (part.type === "patch") {
      patches.push(part)
    }
  }
}

// ✅ GOOD - Sequential mutations
for (const key of Object.keys(tools)) {
  if (disabled.has(key)) {
    delete tools[key]
  }
}
```

---

## 3.3 Type Guards on Filter

**Rule: Use type guards to maintain type inference downstream**

```typescript
// ✅ GOOD - Type guard preserves type information
const patches = messages
  .flatMap((msg) => msg.parts)
  .filter((part): part is PatchPart => part.type === "patch")
// patches is now PatchPart[], not Part[]

// ❌ BAD - Loses type information
const patches = messages
  .flatMap((msg) => msg.parts)
  .filter((part) => part.type === "patch")
// patches is still Part[], requires casting later
```

---

## Related

- [Function Patterns](./typescript-functions.md) — Naming, purity, composition
- [Type Safety](./typescript-type-safety.md) — Types, inference, and type guards
- [Async Patterns](./typescript-async.md) — Promise handling and error patterns
- [Control Flow](./typescript-control-flow.md) — Early returns, guard clauses
- [Code Organization](./typescript-organization.md) — Imports, naming, file structure
- [Code Quality](./code-quality.md) — General quality standards
- [Test Coverage](./test-coverage.md) — Testing standards
