---
description: End-to-end application development
version: 1.0
updated: 2026-08-13
---

# Full-Stack Development Navigation

---

## Common Stacks

### MERN (MongoDB, Express, React, Node)
```
Frontend: dev/frontend/react/ [future]
Backend:  dev/backend/nodejs/express-patterns.md [future]
Data:     dev/data/nosql-patterns/mongodb.md [future]
API:      dev/backend/api-patterns/rest-design.md [future]
```

### T3 Stack (Next.js, tRPC, Prisma, Tailwind)
```
Frontend: dev/frontend/react/ + ui/web/ui-styling-standards.md [future]
Backend:  dev/backend/nodejs/ + api-patterns/trpc-patterns.md [future]
Data:     dev/data/orm-patterns/prisma.md [future]
```

### Python Full-Stack (FastAPI + React)
```
Frontend: dev/frontend/react/ [future]
Backend:  dev/backend/python/fastapi-patterns.md [future]
Data:     dev/data/sql-patterns/ or nosql-patterns/ [future]
API:      dev/backend/api-patterns/rest-design.md [future]
```

---

## Quick Routes

| Layer | Navigate To |
|-------|-------------|
| **Frontend** | `frontend/navigation.md` |
| **Backend** | `backend-navigation.md` |
| **Data** | `data/navigation.md` [future] |
| **Integration** | `integration/navigation.md` [future] |
| **Infrastructure** | `infrastructure/navigation.md` [future] |

---

## Common Workflows

**New API endpoint**:
1. `principles/api-design.md` (principles)
2. `backend/api-patterns/rest-design.md` (approach) [future]
3. `backend/nodejs/express-patterns.md` (implementation) [future]

**New React feature**:
1. `frontend/react/component-architecture.md` (structure) [future]
2. `frontend/react/hooks-patterns.md` (logic) [future]
3. `ui/web/ui-styling-standards.md` (styling)

**Database integration**:
1. `data/sql-patterns/` or `data/nosql-patterns/` (approach) [future]
2. `data/orm-patterns/` (if using ORM) [future]
3. `backend/nodejs/` or `backend/python/` (implementation) [future]

**Third-party service**:
1. `integration/third-party-services/` (patterns) [future]
2. `integration/api-integration/` (consuming APIs) [future]

---

## Related Files

- **Clean Code** → `principles/clean-code.md`
- **API Design** → `principles/api-design.md`
- **Core Standards** → `../core/standards/navigation.md`
