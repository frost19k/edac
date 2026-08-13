---
description: Extended JSON schema for multi-stage orchestration with line-number precision, domain modeling, and prioritization. All enhanced fields are optional and backward compatible.
version: 1.0
updated: 2026-08-13
---

# Enhanced Task Schema — Field Definitions

Extended JSON schema for multi-stage orchestration with line-number precision, domain modeling, and prioritization. All enhanced fields are optional and backward compatible.

---

## Enhanced task.json — New Fields

| Field | Type | Description |
|-------|------|-------------|
| `bounded_context` | string | DDD bounded context (e.g., `"authentication"`, `"billing"`) |
| `module` | string | Module/package name (e.g., `"@app/auth"`, `"payment-service"`) |
| `vertical_slice` | string | Feature slice identifier (e.g., `"user-registration"`) |
| `contracts` | array | API/interface contracts this feature depends on or provides |
| `design_components` | array | Design artifacts (Figma URLs, wireframes, mockups) |
| `related_adrs` | array | Architecture Decision Records (file paths or IDs) |
| `rice_score` | object | RICE prioritization (Reach, Impact, Confidence, Effort) |
| `wsjf_score` | object | WSJF prioritization (Business Value, Time Criticality, Risk Reduction, Job Size) |
| `release_slice` | string | Release identifier (e.g., `"v1.2.0"`, `"Q1-2026"`) |

### context_files Format

Both formats are valid — agents must handle both:

**Legacy** (string paths):
```json
"context_files": [".opencode/context/core/standards/code-quality.md"]
```

**Enhanced** (line-number precision):
```json
"context_files": [
  {
    "path": ".opencode/context/core/standards/code-quality.md",
    "lines": "1-50",
    "reason": "Pure function patterns for service layer"
  }
]
```

---

## Enhanced subtask_NN.json — New Fields

| Field | Type | Description |
|-------|------|-------------|
| `bounded_context` | string | Inherited from task.json or subtask-specific override |
| `module` | string | Module this subtask modifies |
| `vertical_slice` | string | Feature slice this subtask belongs to |
| `contracts` | array | Contracts this subtask implements or depends on |
| `design_components` | array | Design artifacts relevant to this subtask |
| `related_adrs` | array | ADRs relevant to this subtask |

---

## TypeScript Interfaces

```typescript
interface ContextFileReference {
  path: string;
  lines?: string;       // "10-50", "1-20,45-60", or omit for entire file
  reason?: string;      // max 200 chars
}

interface Contract {
  type: 'api' | 'interface' | 'event' | 'schema';
  name: string;
  path?: string;
  status: 'draft' | 'defined' | 'implemented' | 'verified';
  description?: string;
}

interface DesignComponent {
  type: 'figma' | 'wireframe' | 'mockup' | 'prototype' | 'sketch';
  url?: string;
  path?: string;
  description?: string;
}

interface ADRReference {
  id: string;
  path?: string;
  title?: string;
  decision?: string;
}

interface RICEScore {
  reach: number;        // Users affected per time period
  impact: number;       // 0.25=minimal, 0.5=low, 1=medium, 2=high, 3=massive
  confidence: number;   // 0-100
  effort: number;       // Person-months
  score?: number;       // Calculated: (reach * impact * confidence) / effort
}

interface WSJFScore {
  business_value: number;     // 1-10
  time_criticality: number;   // 1-10
  risk_reduction: number;     // 1-10
  job_size: number;           // 1-10
  score?: number;             // Calculated: (bv + tc + rr) / job_size
}

interface EnhancedTask {
  // Base fields (from task-schema.md)
  id: string;
  name: string;
  status: 'active' | 'completed' | 'blocked' | 'archived';
  objective: string;
  context_files?: (string | ContextFileReference)[];
  reference_files?: (string | ContextFileReference)[];
  exit_criteria?: string[];
  subtask_count?: number;
  completed_count?: number;
  created_at: string;
  completed_at?: string;
  // Enhanced fields
  bounded_context?: string;
  module?: string;
  vertical_slice?: string;
  contracts?: Contract[];
  design_components?: DesignComponent[];
  related_adrs?: ADRReference[];
  rice_score?: RICEScore;
  wsjf_score?: WSJFScore;
  release_slice?: string;
}

interface EnhancedSubtask {
  // Base fields (from task-schema.md)
  id: string;
  seq: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  depends_on?: string[];
  parallel?: boolean;
  context_files?: (string | ContextFileReference)[];
  reference_files?: (string | ContextFileReference)[];
  suggested_agent?: string;
  acceptance_criteria?: string[];
  deliverables?: string[];
  agent_id?: string;
  started_at?: string;
  completed_at?: string;
  completion_summary?: string;
  // Enhanced fields
  bounded_context?: string;
  module?: string;
  vertical_slice?: string;
  contracts?: Contract[];
  design_components?: DesignComponent[];
  related_adrs?: ADRReference[];
}
```

---

## Related Files

- `task-examples.md` — Field value examples and common patterns
- `task-migration.md` — Line-number precision, backward compatibility, and migration guide
- `task-schema.md` — Base schema (backward compatible foundation)
- `../guides/splitting-tasks.md` — How to decompose features
- `../lookup/task-commands.md` — CLI reference
