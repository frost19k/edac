---
description: How to manage project intelligence files and folders
version: 1.0
updated: 2026-08-13
---

# Project Intelligence Management

> **What**: How to manage project intelligence files and folders.
> **When**: Use this guide when adding, updating, or removing intelligence files.
> **Related**: See `project-intelligence.md` for what and why.

## Quick Reference

| Action | Do This |
|--------|---------|
| Update existing file | Edit + bump frontmatter version |
| Add new file | Create `.md` + add to navigation.md |
| Add subfolder | Create folder + `navigation.md` + update parent nav |
| Remove file | Rename `.deprecated.md` + archive, don't delete |

---

## Update Existing Files

**When**:
- Business changes → Update `business-domain.md`
- New decision → Add to `decisions-log.md`
- New issues → Update `living-notes.md`
- Feature launch → Update `business-tech-bridge.md`
- Stack changes → Update `technical-domain.md`

**Process**:
1. Edit the file
2. Update frontmatter:
   ```yaml
   ---
   description: {one-line purpose}
   version: {X.Y}
   updated: {YYYY-MM-DD}
   ---
   ```
3. Keep under 200 lines
4. Commit with message like: `docs: Update business-domain.md with new market focus`

---

## Add New Files

**When**:
- New domain area needs dedicated docs
- Existing file exceeds 200 lines
- Specialized context requires separation

**Naming**:
- Kebab-case: `user-research.md`, `api-docs.md`
- Descriptive: filename tells you what's inside

**Template**:
```markdown
---
description: [one-line purpose]
version: 1.0
updated: YYYY-MM-DD
---

# File Title

## Quick Reference

- **Update When**: [Triggers]
- **Related Files**: [Links]

## Content

[Follow patterns from existing files]

## Related Files

- [File 1] - [Description]
```

**Process**:
1. Create file in `intl/`
2. Add YAML frontmatter
3. Follow existing file patterns
4. Keep under 200 lines
5. Add to `navigation.md`

---

## Create Subfolders

**When**:
- 5+ related files need grouping
- Subdomain warrants separation (e.g., `api/`, `mobile/`, `integrations/`)
- Improves navigation clarity

**Structure**:
```
intl/
├── navigation.md           # Root nav
├── [new-subfolder]/        # Create this
│   ├── navigation.md       # Subfolder nav required
│   ├── file-1.md
│   └── file-2.md
```

**Process**:
1. Create folder: `mkdir intl/{name}/`
2. Create `navigation.md` inside:
   ```markdown
   ---
   description: Index of {name} context files
   version: 1.0
   updated: YYYY-MM-DD
   ---

   # {Name} Navigation

   ## Files

   | File | Purpose |
   |------|---------|
   | `file-1.md` | [Desc] |
   ```
3. Add content files
4. Update root `navigation.md` with subfolder entry

**Rule**: Every subfolder MUST have `navigation.md`. Avoid nesting deeper than 2 levels (e.g., `intl/domain/subdomain/`) to prevent context fragmentation.

---

## Remove/Deprecate Files

**When**:
- Content moved elsewhere
- File no longer relevant
- Merged with another file

**Process**:
1. Rename: `filename.md` → `filename.deprecated.md`
2. Add deprecation frontmatter:
   ```yaml
   ---
   description: DEPRECATED — see {new-file.md}
   version: 1.0
   updated: YYYY-MM-DD
   ---
   ```
3. Add banner at top:
   > **DEPRECATED**: See `new-file.md` for current info
4. Mark as deprecated in `navigation.md`

**Never Delete**:
- Decision history (archive instead)
- Lessons learned (move to `living-notes.md`)
- Context that might be needed later

---

## Version Tracking

**Frontmatter**:
```yaml
---
description: {one-line purpose}
version: {MAJOR.MINOR}
updated: {YYYY-MM-DD}
---
```

**Version Rules**:
| Change | Version |
|--------|---------|
| New file | 1.0 |
| Content addition/update | MINOR |
| Structure change | MAJOR |
| Typo fix | PATCH |

**Date**: Always `YYYY-MM-DD`

---

## Quality Standards

See [mvi.md](../context-system/standards/mvi.md) for file size limits, required elements, and content standards.

---

## Governance

**Owner**: Repository maintainer. All responsibilities consolidated under a single owner.

**Review Cadence**:
| Activity | Frequency |
|----------|-----------|
| Quick review | Per change |
| Periodic review | Periodic |

---

## Checklist

### Add New Intelligence File
- [ ] Follow naming convention
- [ ] Add complete YAML frontmatter
- [ ] Include Quick Reference
- [ ] Keep under 200 lines
- [ ] Add to navigation.md
- [ ] Link from related files
- [ ] Version: 1.0

### Update Existing File
- [ ] Make targeted changes
- [ ] Update version/date in frontmatter
- [ ] Verify <200 lines
- [ ] Update navigation if needed
- [ ] Update related files

### Create Subfolder
- [ ] Verify warranted (5+ files)
- [ ] Create folder with kebab-case name
- [ ] Create `navigation.md` inside
- [ ] Add subfolder to parent navigation
- [ ] Create content files

### Deprecate File
- [ ] Rename with `.deprecated.md`
- [ ] Add deprecation frontmatter
- [ ] Add deprecation banner
- [ ] Mark deprecated in navigation
- [ ] Document replacement

---

## Related Files

- **Standard**: `project-intelligence.md`
- **Project Intelligence**: `../../intl/navigation.md`
- **Context System**: `../context-system.md`
