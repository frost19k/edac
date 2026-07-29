<!-- Context: core/task-management/standards | Priority: critical | Version: 1.0 | Updated: 2026-07-28 -->

# Enhanced Task Schema — Migration Guide

Line-number precision, backward compatibility, and adoption guide. See `task-fields.md` for field definitions and `task-examples.md` for value examples.

---

## Line-Number Precision Format

Point agents to **exact sections** of large files instead of reading entire documents.

**Format**:
```json
{
  "path": "path/to/file.md",
  "lines": "10-50",
  "reason": "Why these lines matter"
}
```

**Line range syntax**:
- `"10-50"` — Lines 10 through 50 (inclusive)
- `"1-20,45-60"` — Multiple ranges (lines 1-20 AND 45-60)
- Omit `lines` — Read entire file (backward compatible)

**Examples**:
```json
{ "path": "standards/code-quality.md", "lines": "53-95", "reason": "Pure function patterns" }
{ "path": "standards/security.md", "lines": "1-25,120-145", "reason": "JWT and token refresh" }
```

Legacy string format is still supported: `".opencode/context/core/standards/code-quality.md"`

---

## Backward Compatibility Rules

1. **All new fields are optional** — existing task.json and subtask_NN.json files remain valid
2. **Mixed formats allowed** — string paths and object references can coexist in the same array
3. **Agents MUST handle both formats** — check `typeof ref === 'string'` to distinguish
4. **Gradual adoption** — add enhanced fields incrementally as needed

---

## Migration Guide

### For TaskManager Agents

When creating new tasks:

1. **Use line-number precision for large files** (>100 lines)
2. **Add domain modeling fields** (`bounded_context`, `module`, `vertical_slice`) when known
3. **Link design artifacts** (`design_components`) for UI tasks
4. **Reference ADRs** (`related_adrs`) for architectural decisions
5. **Add prioritization scores** (`rice_score` or `wsjf_score`) when planning releases
6. **Track contracts** when formalizing API/interface dependencies

### For Working Agents (CoderAgent, etc.)

When reading tasks:

1. **Handle both context file formats** — string = read entire file, object = read specified lines
2. **Use contract information** to understand dependencies before implementing
3. **Check ADRs** before making architectural decisions
4. **Respect line-number ranges** — don't read beyond specified lines unless needed

---

## Complete Example

### Enhanced task.json

```json
{
  "id": "user-authentication",
  "name": "User Authentication System",
  "status": "active",
  "objective": "Implement JWT-based authentication with refresh tokens and role-based access control",
  "context_files": [
    {
      "path": ".opencode/context/core/standards/code-quality.md",
      "lines": "53-95",
      "reason": "Pure function patterns for auth service"
    },
    {
      "path": ".opencode/context/core/standards/security-patterns.md",
      "lines": "120-145,200-220",
      "reason": "JWT validation and token refresh patterns"
    }
  ],
  "reference_files": [
    {
      "path": "src/middleware/auth.middleware.ts",
      "lines": "1-50",
      "reason": "Existing auth middleware to extend"
    },
    "package.json"
  ],
  "exit_criteria": [
    "All tests passing with >90% coverage",
    "JWT tokens signed with RS256",
    "Refresh token rotation implemented",
    "Role-based access control working"
  ],
  "subtask_count": 5,
  "completed_count": 0,
  "created_at": "2026-07-28T10:00:00Z",
  "bounded_context": "authentication",
  "module": "@app/auth",
  "vertical_slice": "user-login",
  "contracts": [
    {
      "type": "api",
      "name": "AuthAPI",
      "path": "src/api/auth.contract.ts",
      "status": "defined",
      "description": "REST endpoints for login, logout, refresh, verify"
    }
  ],
  "design_components": [
    {
      "type": "figma",
      "url": "https://figma.com/file/xyz789/Auth-Flows",
      "description": "Login and registration UI mockups"
    }
  ],
  "related_adrs": [
    {
      "id": "ADR-003",
      "path": "docs/adr/003-jwt-authentication.md",
      "title": "Use JWT for stateless authentication",
      "decision": "JWT with RS256, 15-min access tokens, 7-day refresh tokens"
    }
  ],
  "rice_score": {
    "reach": 10000,
    "impact": 3,
    "confidence": 90,
    "effort": 4,
    "score": 6750
  },
  "wsjf_score": {
    "business_value": 9,
    "time_criticality": 8,
    "risk_reduction": 7,
    "job_size": 4,
    "score": 6
  },
  "release_slice": "v1.0.0"
}
```

> For subtask examples, see `task-fields.md` (interface definitions) and `task-examples.md` (field values).

---

## Related

- `task-fields.md` — Field definitions and TypeScript interfaces
- `task-examples.md` — Field value examples and common patterns
- `task-schema.md` — Base schema (backward compatible foundation)
- `../guides/splitting-tasks.md` — How to decompose features
- `../lookup/task-commands.md` — CLI reference
