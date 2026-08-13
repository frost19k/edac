---
description: Early returns, guard clauses, and exhaustive switch patterns.
version: 1.0
updated: 2026-08-13
---

# TypeScript Control Flow

---

## 5.1 Early Returns

**Rule: Avoid `else` statements, use early returns**

```typescript
// ✅ GOOD - Early returns
function getStatus(session: Session) {
  if (!session) return "not_found"
  if (session.busy) return "busy"
  if (session.error) return "error"
  return "ready"
}

async function process(id: string) {
  const session = await getSession(id)
  if (!session) return { error: "Not found" }

  const result = await execute(session)
  if (!result.success) return { error: result.message }

  return { data: result.data }
}

// ❌ BAD - Else statements
function getStatus(session: Session) {
  if (!session) {
    return "not_found"
  } else {
    if (session.busy) {
      return "busy"
    } else {
      if (session.error) {
        return "error"
      } else {
        return "ready"
      }
    }
  }
}
```

---

## 5.2 Guard Clauses

```typescript
// ✅ GOOD - Guard clauses at function start
async function updateSession(id: string, data: UpdateData) {
  if (!id) throw new Error("ID required")
  if (!data) throw new Error("Data required")
  if (data.title && data.title.length > 100) throw new Error("Title too long")

  // Main logic here
  const session = await getSession(id)
  await update(id, data)
  return session
}
```

---

## 5.3 Switch Statements

**Rule: Use exhaustive switch with default case**

```typescript
// ✅ GOOD - Exhaustive switch
function handleEvent(event: Event) {
  switch (event.type) {
    case "start":
      return handleStart(event)
    
    case "update":
      return handleUpdate(event)
    
    case "complete":
      return handleComplete(event)
    
    default:
      const _exhaustive: never = event
      throw new Error(`Unhandled event type: ${(event as any).type}`)
  }
}
```

---

## Related Files

- [Function Patterns](./typescript-functions.md) — Naming, purity, composition
- [Type Safety](./typescript-type-safety.md) — Types, inference, and type guards
- [Array Operations](./typescript-arrays.md) — Functional array methods
- [Async Patterns](./typescript-async.md) — Promise handling and error patterns
- [Code Organization](./typescript-organization.md) — Imports, naming, file structure
- [Code Quality](./code-quality.md) — General quality standards
- [Test Coverage](./test-coverage.md) — Testing standards
