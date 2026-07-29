<!-- Context: core/standards | Priority: high | Version: 1.0 | Updated: 2026-07-28 -->

# TypeScript Function Patterns

**Purpose**: Function naming, purity, and composition patterns for TypeScript projects.

---

## 1.1 Naming Convention

**Rule: Prefer single-word function names**

```typescript
// ✅ GOOD - Single-word names
export function create() {...}
export function fork() {...}
export function touch() {...}
export function get() {...}
export async function stream(input: StreamInput) {...}

// ✅ ACCEPTABLE - Multi-word only when necessary
export function isDefaultTitle(title: string) {...}      // Boolean predicate
export function assertNotBusy(sessionID: string) {...}   // Assertion pattern
export async function createNext(input) {...}            // Version disambiguation
export async function resolvePromptParts(template) {...} // Complex operation needs clarity

// ❌ AVOID - Unnecessary multi-word names
function prepareJournal(dir: string) {}  // Use: journal()
function getUserData(id: string) {}      // Use: user()
function processFileContent(path) {}     // Use: process()
```

---

## 1.2 Pure Functions

**Rule: Prefer pure functions when possible**

```typescript
// ✅ GOOD - Pure function
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ❌ AVOID - Side effects
let total = 0
function addToTotal(item: Item) {
  total += item.price  // Mutates external state
}
```

---

## 1.3 Function Composition

```typescript
// ✅ GOOD - Functional composition with pipes
const filtered = agents
  .filter((a) => a.mode !== "primary")
  .filter((a) => hasPermission(a, caller))
  .map((a) => a.name)

// ✅ GOOD - Higher-order functions
export function withRetry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
  return fn().catch((error) => {
    if (maxRetries > 0) {
      return withRetry(fn, maxRetries - 1)
    }
    throw error
  })
}
```

---

## Related

- [Type Safety](./typescript-type-safety.md) — Types, inference, and type guards
- [Array Operations](./typescript-arrays.md) — Functional array methods
- [Async Patterns](./typescript-async.md) — Promise handling and error patterns
- [Control Flow](./typescript-control-flow.md) — Early returns, guard clauses
- [Code Organization](./typescript-organization.md) — Imports, naming, file structure
- [Code Quality](./code-quality.md) — General quality standards
- [Test Coverage](./test-coverage.md) — Testing standards
