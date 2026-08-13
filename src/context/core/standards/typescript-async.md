---
description: Promise handling — parallel execution, sequential chains, and error handling patterns.
version: 1.0
updated: 2026-08-13
---

# TypeScript Async Patterns

---

## 4.1 Parallel Execution (Default Pattern)

**Rule: Use `Promise.all` for independent operations**

```typescript
// ✅ GOOD - Parallel independent operations
const [language, cfg, provider, auth] = await Promise.all([
  getLanguage(model),
  getConfig(),
  getProvider(model.providerID),
  getAuth(model.providerID),
])

// ✅ GOOD - Parallel array processing
const results = await Promise.all(
  items.map(async (item) => {
    return processItem(item)
  }),
)

// ❌ BAD - Sequential when independent
const language = await getLanguage(model)
const cfg = await getConfig()  // Could run in parallel!
const provider = await getProvider(model.providerID)
```

---

## 4.2 Sequential Operations

**Rule: Chain when operations depend on previous results**

```typescript
// ✅ GOOD - Sequential dependency chain
const session = await createSession({ title: "New" })
const message = await addMessage(session.id, { content: "Hello" })
const response = await processMessage(message.id)

// ✅ GOOD - Promise chain for clarity
const result = await createSession({ title: "New" })
  .then((session) => addMessage(session.id, { content: "Hello" }))
  .then((message) => processMessage(message.id))
```

---

## 4.3 Error Handling in Async

**Rule: Prefer `.catch()` over try/catch when possible**

```typescript
// ✅ GOOD - Catch at call site
const result = await operation().catch((error) => {
  console.error("Operation failed", error)
  return defaultValue
})

// ✅ GOOD - Promise.all with error handling
const results = await Promise.all(
  items.map(async (item) => {
    return processItem(item).catch((error) => {
      console.error("Item failed", { item, error })
      return null
    })
  }),
)

// ✅ ACCEPTABLE - try/catch for multiple operations
try {
  const session = await createSession(input)
  await addMessage(session.id, message)
  await publishEvent({ session })
  return session
} catch (error) {
  console.error("Session creation failed", error)
  throw error
}

// ❌ AVOID - try/catch for single operation
try {
  const result = await operation()
  return result
} catch (error) {
  console.error(error)
  throw error
}
// Better:
const result = await operation().catch((error) => {
  console.error(error)
  throw error
})
```

---

## Related Files

- [Function Patterns](./typescript-functions.md) — Naming, purity, composition
- [Type Safety](./typescript-type-safety.md) — Types, inference, and type guards
- [Array Operations](./typescript-arrays.md) — Functional array methods
- [Control Flow](./typescript-control-flow.md) — Early returns, guard clauses
- [Code Organization](./typescript-organization.md) — Imports, naming, file structure
- [Code Quality](./code-quality.md) — General quality standards
- [Test Coverage](./test-coverage.md) — Testing standards
