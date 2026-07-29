<!-- Context: core/structure | Priority: critical | Version: 1.0 | Updated: 2026-07-28 -->

# Context Structure

**Purpose**: Function-based folder organization for easy discovery

**Last Updated**: 2026-07-28

---

## Core Structure

<rule id="function_structure" enforcement="strict">
  ALWAYS organize by function (what info does), not just by topic.
  
  Required folders:
  - concepts/  - Core ideas, definitions, "what is it?"
  - examples/  - Minimal working code
  - guides/    - Step-by-step workflows
  - lookup/    - Quick reference tables, commands, paths
  - errors/    - Common issues, gotchas, fixes
</rule>

```
.opencode/context/{category}/
├── navigation.md              # Navigation map (REQUIRED)
├── concepts/              # What it is
│   └── {topic}.md
├── examples/              # Working code
│   └── {example}.md
├── guides/                # How to do it
│   └── {guide}.md
├── lookup/                # Quick reference
│   └── {reference}.md
└── errors/                # Common issues
    └── {framework}.md
```

---

## Folder Purposes

### concepts/
**Purpose**: Core ideas, definitions, "what is it?"

**Contains**: Core concepts, design patterns, architecture decisions

**Examples**:
- `concepts/authentication.md`
- `concepts/state-management.md`

---

### examples/
**Purpose**: Minimal working code examples

**Contains**: Working code snippets, minimal reproductions, common patterns

**Examples**:
- `examples/jwt-auth-example.md`
- `examples/react-hooks-example.md`

**Rule**: Examples should be <30 lines of code, fully functional

---

### guides/
**Purpose**: Step-by-step workflows, "how to do X"

**Contains**: Numbered procedures, setup instructions, implementation workflows

**Examples**:
- `guides/setting-up-auth.md`
- `guides/deploying-api.md`

**Rule**: Steps should be actionable (not theoretical)

---

### lookup/
**Purpose**: Quick reference tables, commands, paths

**Contains**: Command lists, file locations, API endpoints, configuration options

**Examples**:
- `lookup/cli-commands.md`
- `lookup/file-locations.md`

**Rule**: Must be in table/list format (scannable)

---

### errors/
**Purpose**: Common errors, gotchas, edge cases

**Contains**: Error messages + fixes, common pitfalls, edge cases

**Examples**:
- `errors/react-errors.md`
- `errors/nextjs-build-errors.md`

**Rule**: Group by framework/topic, not one file per error

---

## navigation.md Requirement

<rule id="readme_required" enforcement="strict">
  Every context category MUST have navigation.md at its root with:
  1. Purpose (1-2 sentences)
  2. Navigation tables for each function folder
  3. Priority levels (critical/high/medium/low)
  4. Loading strategy (what to load for common tasks)
</rule>

**Example** (abbreviated):
```markdown
# Development Context
**Purpose**: Core development patterns, errors, and examples

## Quick Navigation
| File | Description | Priority |
|------|-------------|----------|
| concepts/auth.md | Authentication patterns | critical |
| examples/jwt.md | JWT auth example | high |
| errors/react.md | Common React errors | high |

## Loading Strategy
**For auth work**: Load concepts/auth.md → examples/jwt.md → guides/setup-auth.md if needed
```

---

## Categorization Rules

When organizing a file, ask:

| Question | Folder |
|----------|--------|
| Does it explain **what** something is? | `concepts/` |
| Does it show **working code**? | `examples/` |
| Does it explain **how to do** something? | `guides/` |
| Is it **quick reference** data? | `lookup/` |
| Does it document an **error/issue**? | `errors/` |

---

## Anti-Patterns ❌

### ❌ Flat Structure
```
development/
├── authentication.md
├── jwt-example.md
├── setting-up-auth.md
├── auth-errors.md
└── api-endpoints.md
```
**Problem**: Hard to discover. Is authentication.md a concept or guide?

### ✅ Function-Based
```
development/
├── navigation.md
├── concepts/authentication.md
├── examples/jwt-example.md
├── guides/setting-up-auth.md
├── lookup/api-endpoints.md
└── errors/auth-errors.md
```
**Benefit**: Instantly know file purpose by location

---

## Validation

Before committing context structure:

- [ ] All categories have navigation.md?
- [ ] Files are in function folders (not flat)?
- [ ] README has navigation tables?
- [ ] Priority levels assigned?
- [ ] Loading strategy documented?

---

## Related

- [mvi.md](./mvi.md) - What to extract
- [../guides/creation.md](../guides/creation.md) - How to create files
