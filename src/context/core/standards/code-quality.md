---
description: "Code quality standards: modular, functional, and maintainable patterns for all development"
version: 1.0
updated: 2026-08-13
---

# Code Standards

## Quick Reference

**Core Philosophy**: Modular, Functional, Maintainable
**Golden Rule**: If you can't easily test it, refactor it

**Critical Patterns** (use these):
- ✅ Pure functions (same input = same output, no side effects)
- ✅ Immutability (create new data, don't modify)
- ✅ Composition (build complex from simple)
- ✅ Small functions (< 50 lines)
- ✅ Explicit dependencies (dependency injection)
- ✅ Error handling, input validation, secure secrets

**Anti-Patterns** (avoid these):
- ❌ Mutation, side effects, deep nesting
- ❌ God modules, global state, large functions
- ❌ Hardcoded credentials, unvalidated input

---

## Core Philosophy

**Modular**: Everything is a component - small, focused, reusable
**Functional**: Pure functions, immutability, composition over inheritance
**Maintainable**: Self-documenting, testable, predictable

## Principles

### Modular Design
- Single responsibility per module
- Clear interfaces (explicit inputs/outputs)
- Independent and composable
- < 100 lines per component (ideally < 50)

### Functional Approach
- **Pure functions**: Same input = same output, no side effects
- **Immutability**: Create new data, don't modify existing
- **Composition**: Build complex from simple functions
- **Declarative**: Describe what, not how

### Component Structure
```
component/
├── index.js      # Public interface
├── core.js       # Core logic (pure functions)
├── utils.js      # Helpers
└── tests/        # Tests
```

## Patterns

### Pure Functions
```javascript
// ✅ Pure
const add = (a, b) => a + b;
const formatUser = (user) => ({ ...user, fullName: `${user.firstName} ${user.lastName}` });

// ❌ Impure (side effects)
let total = 0;
const addToTotal = (value) => { total += value; return total; };
```

### Immutability
```javascript
// ✅ Immutable
const addItem = (items, item) => [...items, item];
const updateUser = (user, changes) => ({ ...user, ...changes });

// ❌ Mutable
const addItem = (items, item) => { items.push(item); return items; };
```

### Composition
```javascript
// ✅ Compose small functions
const processUser = pipe(validateUser, enrichUserData, saveUser);
const isValidEmail = (email) => validateEmail(normalizeEmail(email));

// ❌ Deep inheritance
class ExtendedUserManagerWithValidation extends UserManager { }
```

### Declarative
```javascript
// ✅ Declarative
const activeUsers = users.filter(u => u.isActive).map(u => u.name);

// ❌ Imperative
const names = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) names.push(users[i].name);
}
```

## Naming

- **Files**: lowercase-with-dashes.js
- **Functions**: verbPhrases (getUser, validateEmail)
- **Predicates**: isValid, hasPermission, canAccess
- **Variables**: descriptive (userCount not uc), const by default
- **Constants**: UPPER_SNAKE_CASE

## Error Handling

```javascript
// ✅ Explicit error handling
function parseJSON(text) {
  try {
    return { success: true, data: JSON.parse(text) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ✅ Validate at boundaries
function createUser(userData) {
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  return { success: true, user: saveUser(userData) };
}
```

## Dependency Injection

```javascript
// ✅ Dependencies explicit
function createUserService(database, logger) {
  return {
    createUser: (userData) => {
      logger.info('Creating user');
      return database.insert('users', userData);
    }
  };
}

// ❌ Hidden dependencies
import db from './database.js';
function createUser(userData) { return db.insert('users', userData); }
```

## Anti-Patterns

❌ **Mutation**: Modifying data in place
❌ **Side effects**: console.log, API calls in pure functions
❌ **Deep nesting**: Use early returns instead
❌ **God modules**: Split into focused modules
❌ **Global state**: Pass dependencies explicitly
❌ **Large functions**: Keep < 50 lines

## Best Practices

✅ Pure functions whenever possible
✅ Immutable data structures
✅ Small, focused functions (< 50 lines)
✅ Compose small functions into larger ones
✅ Explicit dependencies (dependency injection)
✅ Validate at boundaries
✅ Self-documenting code
✅ Test in isolation

**Golden Rule**: If you can't easily test it, refactor it.

---

## Validation

**ALWAYS** validate input data:
- Check for null/nil/None values
- Validate data types and ranges
- Sanitize user input
- Return clear validation error messages

## Security

**NEVER** expose sensitive information:
- Don't log passwords, tokens, or API keys
- Don't expose internal error details to users
- Use environment variables for secrets
- Follow principle of least privilege
- Use parameterized queries (prevent SQL injection)
- Validate and escape output (prevent XSS)

## Logging

**USE** consistent logging levels:
- **Debug**: Detailed information (development only)
- **Info**: Important events and milestones
- **Warning**: Potential issues that don't stop execution
- **Error**: Failures and exceptions

## File System Safety

**ALWAYS** validate file paths:
- Prevent path traversal attacks
- Check file permissions before operations
- Use absolute paths when possible
- Handle file not found errors gracefully

## Configuration

**ALWAYS** use environment variables for configuration:
- Never hardcode secrets or credentials
- Provide sensible defaults
- Validate required configuration on startup
- Use different configs for dev/staging/production

## Performance

**AVOID** unnecessary operations:
- Don't repeat expensive calculations
- Cache results when appropriate
- Use efficient data structures
- Profile before optimizing

## Dependency Management

**MANAGE** dependencies carefully:
- Pin dependency versions for reproducibility
- Regularly update dependencies for security
- Minimize number of dependencies
- Audit dependencies for security vulnerabilities

## Version Control

**FOLLOW** git best practices:
- Write clear, descriptive commit messages
- Make atomic commits (one logical change per commit)
- Use feature branches for development
- Review code before merging

## Code Review Checklist

**REVIEW** for these common issues:
- [ ] Error handling is comprehensive
- [ ] Input validation is present
- [ ] No hardcoded secrets or credentials
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] No obvious security vulnerabilities

## Quick Checklist

Before committing code, verify:
- ✅ Pure functions (no side effects)
- ✅ Input validation
- ✅ Error handling
- ✅ No hardcoded secrets
- ✅ Tests written and passing
- ✅ Documentation updated
- ✅ No security vulnerabilities
- ✅ Code is modular and maintainable
