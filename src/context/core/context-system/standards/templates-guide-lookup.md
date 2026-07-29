<!-- Context: core/context-system/standards | Priority: high | Version: 1.0 | Updated: 2026-07-28 -->

# Context File Templates — Guide & Lookup

**Purpose**: Standard formats for guide and lookup context files

**Last Updated**: 2026-07-28

---

## 3. Guide Template

```markdown
<!-- Context: {category}/guides | Priority: {critical|high|medium} | Version: 1.0 | Updated: YYYY-MM-DD -->
# Guide: {Action}

**Purpose**: [1 sentence]
**Last Updated**: {YYYY-MM-DD}

## Prerequisites
- Requirement 1
- Requirement 2

**Estimated time**: X min

## Steps

### 1. {Step}
```bash
{command}
```
**Expected**: [result]

### 2. {Step}
[Repeat 4-7 steps]

## Verification
```bash
{verify command}
```

## Troubleshooting
| Issue | Solution |
|-------|----------|
| Problem | Fix |

## Related
- concepts/x.md
```

---

## 4. Lookup Template

```markdown
<!-- Context: {category}/lookup | Priority: {high|medium} | Version: 1.0 | Updated: YYYY-MM-DD -->
# Lookup: {Reference Type}

**Purpose**: Quick reference for {desc}
**Last Updated**: {YYYY-MM-DD}

## {Section}
| Item | Value | Desc | Code |
|------|-------|------|------|
| x | y | z | `path/to/file.ts` |

## Commands
```bash
# Description
{command}
```

## Paths
```
{path} - {desc}
```

## Related
- concepts/x.md
```

---

## Related

- [templates-concept-example.md](./templates-concept-example.md) — Concept & Example templates
- [templates-error-navigation.md](./templates-error-navigation.md) — Error, Navigation & Specialized templates
- [structure.md](./structure.md) — File organization standards
- [mvi.md](./mvi.md) — Minimal Viable Information principle
