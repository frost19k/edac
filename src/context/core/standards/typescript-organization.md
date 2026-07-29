<!-- Context: core/standards | Priority: high | Version: 1.0 | Updated: 2026-07-28 -->

# TypeScript Code Organization

**Purpose**: Import ordering, naming conventions, file structure, testing principles, and variable naming.

---

## 6.1 Import Order

**Rule: Organize imports by source**

```typescript
// ✅ GOOD - Organized imports
// 1. Node built-ins
import path from "path"
import fs from "fs/promises"

// 2. External packages
import { z } from "zod"
import express from "express"

// 3. Internal modules
import { User } from "./types"
import { getConfig } from "./config"
```

---

## 6.2 Naming Conventions

```typescript
// ✅ GOOD - Clear naming
const session = await getSession(id)
const user = await getCurrentUser()
const messages = await getMessages({ sessionID })

// ❌ BAD - Unnecessary verbosity
const currentSession = await getSession(id)
const currentlyAuthenticatedUser = await getCurrentUser()
const sessionMessagesList = await getMessages({ sessionID })

// ✅ GOOD - Multi-word when single word is ambiguous
const sessionID = params.id
const userAgent = req.headers["user-agent"]
const maxRetries = config.retries
```

---

## 6.3 File Structure

**Rule: One primary export per file**

```typescript
// user.ts
export interface User {
  id: string
  name: string
}

export async function getUser(id: string): Promise<User> {
  // Implementation
}

export async function createUser(data: CreateUserInput): Promise<User> {
  // Implementation
}
```

---

## 7. Testing Principles

Follow Arrange-Act-Assert pattern, test both success and failure cases, and mock all external dependencies. For detailed testing guidance, see [Test Coverage](./test-coverage.md).

---

## 8. Variable Naming

### 8.1 Variable Declaration

**Rule: Prefer `const` over `let`**

```typescript
// ✅ GOOD - Immutable with ternary or early return
const foo = condition ? 1 : 2
function getValue(condition: boolean) {
  if (condition) return 1
  return 2
}

// ✅ ACCEPTABLE - let when mutation is necessary
let accumulator = 0
for (const item of items) {
  accumulator += item.value
}
```

### 8.2 Destructuring

**Rule: Avoid unnecessary destructuring, preserve context with dot notation**

```typescript
// ✅ GOOD - Preserve context with dot notation
function process(session: Session) {
  console.log("processing", { id: session.id, title: session.title })
  return { id: session.id, status: session.status, owner: session.owner }
}

// ✅ ACCEPTABLE - Destructuring when improving readability
function renderUser({ name, email, avatar }: User) {
  return `<div>${name} (${email})</div>`
}

// ✅ ACCEPTABLE - Destructuring array returns
const [language, cfg, provider] = await Promise.all([...])
```

---

## Related

- [Function Patterns](./typescript-functions.md) — Naming, purity, composition
- [Type Safety](./typescript-type-safety.md) — Types, inference, and type guards
- [Array Operations](./typescript-arrays.md) — Functional array methods
- [Async Patterns](./typescript-async.md) — Promise handling and error patterns
- [Control Flow](./typescript-control-flow.md) — Early returns, guard clauses
- [Code Quality](./code-quality.md) — General quality standards
- [Test Coverage](./test-coverage.md) — Testing standards
