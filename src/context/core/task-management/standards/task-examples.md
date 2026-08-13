---
description: DDD bounded context for domain modeling.
version: 1.0
updated: 2026-08-13
---

# Enhanced Task Schema — Field Examples

Practical examples for each enhanced field. See `task-fields.md` for interface definitions.

---

### bounded_context

```json
{ "bounded_context": "authentication" }
```

Common values: `"authentication"`, `"billing"`, `"inventory"`, `"notification"`, `"analytics"`

---

### module

**Purpose**: Module or package name for code organization.

```json
{ "module": "@app/auth" }
```

Common values: `"@app/auth"`, `"payment-service"`, `"ui-components"`, `"core/utils"`

---

### vertical_slice

**Purpose**: Feature slice identifier for vertical slice architecture.

```json
{ "vertical_slice": "user-registration" }
```

Common values: `"user-registration"`, `"checkout-flow"`, `"dashboard-overview"`, `"report-generation"`

---

### contracts

**Purpose**: Track API/interface dependencies and implementations.

```json
{
  "contracts": [
    {
      "type": "api",
      "name": "UserAPI",
      "path": "src/api/user.contract.ts",
      "status": "defined",
      "description": "REST API for user CRUD operations"
    }
  ]
}
```

**Types**: `"api"`, `"interface"`, `"event"`, `"schema"`
**Statuses**: `"draft"`, `"defined"`, `"implemented"`, `"verified"`

---

### design_components

**Purpose**: Link design artifacts to implementation tasks.

```json
{
  "design_components": [
    {
      "type": "figma",
      "url": "https://figma.com/file/abc123/Login-Flow",
      "description": "Login page mockups with responsive breakpoints"
    }
  ]
}
```

**Types**: `"figma"`, `"wireframe"`, `"mockup"`, `"prototype"`, `"sketch"`

---

### related_adrs

**Purpose**: Reference architectural decisions that govern implementation.

```json
{
  "related_adrs": [
    {
      "id": "ADR-003",
      "path": "docs/adr/003-jwt-authentication.md",
      "title": "Use JWT for stateless authentication",
      "decision": "JWT with RS256 signing and 15-minute expiry"
    }
  ]
}
```

---

### rice_score

**Purpose**: RICE prioritization framework (Reach x Impact x Confidence / Effort).

```json
{
  "rice_score": {
    "reach": 5000,
    "impact": 2,
    "confidence": 80,
    "effort": 3,
    "score": 2666.67
  }
}
```

**Calculation**: `(5000 x 2 x 0.80) / 3 = 2666.67`

- `reach`: Users affected per time period
- `impact`: 0.25=minimal, 0.5=low, 1=medium, 2=high, 3=massive
- `confidence`: 0-100 (how sure are you?)
- `effort`: Person-months of work

---

### wsjf_score

**Purpose**: WSJF prioritization (Weighted Shortest Job First) for SAFe/Agile.

```json
{
  "wsjf_score": {
    "business_value": 8,
    "time_criticality": 6,
    "risk_reduction": 5,
    "job_size": 3,
    "score": 6.33
  }
}
```

**Calculation**: `(8 + 6 + 5) / 3 = 6.33`

All fields on 1-10 scale: `business_value`, `time_criticality`, `risk_reduction`, `job_size`

---

### release_slice

**Purpose**: Group tasks into releases for planning.

```json
{ "release_slice": "v1.2.0" }
```

Common values: `"v1.2.0"` (semver), `"Q1-2026"` (quarterly), `"MVP"`, `"Phase-2"`, `"Sprint-15"`

---

## Related Files

- `task-fields.md` — Field definitions and TypeScript interfaces
- `task-migration.md` — Line-number precision, backward compatibility, and migration guide
- `task-schema.md` — Base schema (backward compatible foundation)
- `../guides/splitting-tasks.md` — How to decompose features
- `../lookup/task-commands.md` — CLI reference
