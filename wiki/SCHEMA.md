# Wiki Schema & Workflow

Conventions for maintaining EDAC's wiki — SystemBuilder's research/verification
knowledge base. This file is the contract every wiki actor follows: SystemBuilder
and the ResearchAgent / WikiJanitor / WikiLibrarian subagents.

> ## EDAC ↔ OAC relationship (read first)
> EDAC is **inspired by** OpenAgentsControl (OAC) but has **no obligation to follow OAC specifics** — especially the structure of the local `.opencode/`.
> - OAC patterns, where they exist, live **exclusively in `src/`**.
> - For the purposes of EDAC: **OAC ≈ `src/`**.
> - `src/` is a **focused derivation and enhancement** of OAC, not a mirror.
>
> Consequence for the wiki: pages derived from OAC sources describe OAC *lineage* and are generalized, not authoritative EDAC layout. Treat `src/` as the source of truth for EDAC structure (see [framework/src-structure.md](framework/src-structure.md)). Do **not** assume OAC directory layouts, file names, or metadata locations apply to EDAC's `.opencode/`.

## Purpose
The wiki is a persistent, compounding knowledge base used while developing `src/`.
It is not a user-facing browse tool. The user interacts only with SystemBuilder;
subagents are spawned by SystemBuilder, never directly.

Pattern reference: `llm-wiki.md` (the abstract LLM-wiki idea this repo instantiates).

## Layout
- `sources/` — raw, immutable primary data. ResearchAgent writes cited research docs here; the user may also drop sources. Never modified after creation.
- `framework/` — generated pages on EDAC's conceptual architecture (agentic-system design, the layered model, registry/install model, component taxonomy).
- `harness/` — generated pages on OpenCode harness specifics (agent frontmatter, permission model, tools, MCP, subagent spawning, context/`compress`).
- `research/` — generated pages on external references, findings, comparisons (OpenAgentsControl lineage, upstream OpenCode docs, related projects).
- `SCHEMA.md` — this file.
- `index.md` — content catalog (updated every ingest).
- `log.md` — chronological activity record (append-only).
- `TODO.md` — cross-session build plan for the wiki workflow itself.

## Page format
Every generated page (under `framework/` `harness/` `research/`) starts with YAML frontmatter:

```yaml
---
title: Short page title
type: entity | concept | comparison | summary | source-note
tags: [comma, separated]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [sources/stub.md, https://...]
status: draft | stable
---
```

Body: markdown. Lead with the finding, then evidence. Cross-link to sibling pages with relative links (`../harness/permissions.md`). Note contradictions explicitly rather than silently overwriting.

## Source format (in `sources/`)
One file per research stub, named `lower-case-stub.md`. Frontmatter:

```yaml
---
title: Source title
url: https://...   # or "local" if user-dropped
retrieved: YYYY-MM-DD
author: ...
---
```

Body: structured notes + verbatim quotes where useful, with inline citations. ResearchAgent works in `.tmp/{stub}/external-research/` and writes the final cited doc to `sources/{stub}.md`.

## Procedures
### Research (ResearchAgent)
Gather external data via web search / fetch / curl / wget. Produce a structured, cited doc in `sources/`. Scratch work stays in `.tmp/{stub}/external-research/` and is not committed.

### Ingest (WikiJanitor)
Given a source, create/update relevant pages across `framework/` `harness/` `research/`, add cross-references, then update `index.md` and append to `log.md`. A single source may touch many pages.

### Query (WikiLibrarian)
Read `index.md` to locate relevant pages, read them, synthesize an answer with citations. Good answers may be filed back as new pages.

### Lint (WikiJanitor)
Run after every ingest and on demand. Scope: only generated pages under `framework/`, `harness/`, `research/`. WikiJanitor may use **read-only** git (`git status`, `git log`, `git diff`, `git show`, `git ls-files`, `git rev-parse`) to inspect repo state for verification, but never commits, pushes, or modifies the working tree.

> **`sources/` is immutable OAC raw documentation — never lint it for OAC paths; those are upstream documents, not EDAC assertions.** Correction/explanation contexts (`wiki/TODO.md`, `wiki/log.md`, `wiki/framework/src-structure.md`) are exempt from the OAC-path checks below because they deliberately quote the wrong forms to explain the fix.

**1. OAC-path tyranny** — no generated page may assert an OAC `.opencode/` path or a wrong `src/` path as EDAC fact. The greps below must return **zero matches** (Lint passes when grep fails). Run from `wiki/`:

```bash
# 1a. OAC metadata path must be src/metadata.json, never .opencode/config/agent-metadata.json
rg -n '\.opencode/config/agent-metadata\.json' framework harness research --glob '!framework/src-structure.md'

# 1b. bare/unqualified agent-metadata.json must be src/metadata.json
#     (src/metadata.json does NOT contain this substring, so a clean page yields no match)
rg -n 'agent-metadata\.json' framework harness research --glob '!framework/src-structure.md'

# 1c. registry.json lives at repo root, never under src/
rg -n 'src/registry\.json' framework harness research --glob '!framework/src-structure.md'
```

1d. **Structural-claim traceability** — every EDAC file path, directory, or layout assertion in a generated page must trace to `wiki/framework/src-structure.md`. For each path-like token a page asserts, confirm it appears in (or is consistent with) the tables in `src-structure.md`. If a claim cannot be traced, correct it against the live `src/` tree or flag it in `TODO.md`.

**2. Cross-link integrity**
- Every relative markdown link (`[text](path.md)`, `[text](../dir/page.md)`) must resolve to an existing file. Extract links, then verify each target exists relative to the referencing page:
  ```bash
  rg -no '\[[^\]]+\]\(([^)]+\.md)\)' framework harness research
  ```
  (Anchored links `path.md#sec` are rare here; re-check any that the pattern misses.)
- **Orphan pages** — flag any generated page with zero inbound links (no other page links to it). Cross-check against `index.md` and the link graph.
- **Missing pages** — flag concepts/entities named in pages (especially `tags`, `sources`, and "Related" sections) that are referenced but have no corresponding page.

**3. Frontmatter compliance** — every generated page must open with valid YAML frontmatter containing exactly these keys: `title`, `type`, `tags`, `created`, `updated`, `sources`, `status`. Verify:
```bash
for f in $(rg -l '^---$' framework harness research); do
  rg -q '^title:' "$f" && rg -q '^type:' "$f" && rg -q '^tags:' "$f" \
    && rg -q '^created:' "$f" && rg -q '^updated:' "$f" \
    && rg -q '^sources:' "$f" && rg -q '^status:' "$f" || echo "MISSING FRONTMATTER KEY: $f"
done
```
Also confirm `type` ∈ {entity, concept, comparison, summary, source-note} and `status` ∈ {draft, stable} per the Page format section.

**4. Contradictions** — pages must not contradict each other, nor contradict `wiki/framework/src-structure.md` or the actual `src/` tree. Reconcile any conflicting claims (differing paths, component lists, version facts) by re-reading `src-structure.md` and the live `src/` directory; record resolutions in `log.md` and fix the offending page. Note contradictions explicitly rather than silently overwriting (per Page format).

**5. Stale claims** — verify version/file assertions against the repo. Confirm these exist at the stated locations (paths relative to `wiki/`):
```bash
test -f ../VERSION && echo "VERSION ok" || echo "MISSING: ../VERSION"
test -f ../package.json && echo "package.json ok" || echo "MISSING: ../package.json"
test -f ../registry.json && echo "registry.json ok" || echo "MISSING: ../registry.json"
test -f ../src/metadata.json && echo "src/metadata.json ok" || echo "MISSING: ../src/metadata.json"
```
Any page asserting a version, file, or path that does not match the live repo is stale and must be corrected.

**6. Secret scan** — WikiJanitor may `grep` *any* directory (its `grep` permission is intentionally broad) to detect leaked secrets — API keys, tokens, credentials — that have landed in normal files. Sensitive-file paths (`.env`, `.key`, `.secret`, `.pem`, `.crt`, `credentials*`) are denied under `grep`, so known-secret files are never opened; only leaks into ordinary files are surfaced. Flag leaks to SystemBuilder; never write secret values into wiki pages.

### Cross-Reference Protocol
The wiki must be a navigable graph, not a set of standalone blobs. Every page is responsible for linking its related concepts inline so WikiLibrarian can traverse and Lint can verify.

- **Inline links are mandatory.** Whenever a page mentions a concept that has (or should have) its own wiki page, embed an inline markdown link in the prose — e.g. `the [permission model](./permission-model.md) governs access`. A trailing `## Related` section is a supplement only; it does **not** substitute for inline links. Inline links are grep-discoverable, which is what Lint checks (Check 2) and what lets WikiLibrarian walk the graph.
- **Back-links.** When page A links to page B, WikiJanitor also ensures B's `## Related` (and, where natural, B's prose) acknowledges A — unless B is a deliberate hub. This keeps the graph bidirectional.
- **Lint enforces** (Check 2): inline + `## Related` links resolve; no orphan page (zero inbound links); gap detection — a concept mentioned but lacking a page is a candidate for the ingest queue (fed to ResearchAgent / WikiLibrarian); bidirectional-consistency warning on asymmetry (asymmetry is allowed for hubs, so warn, don't fail).
- **Format.** Use relative markdown links to the target `.md` (`[label](./target.md)` or `[label](../dir/target.md)`). Keep the label human-readable; the link target is what Lint greps.

## index.md format
Catalog of all pages, grouped by directory, each with a one-line summary and optional metadata (date, source count). Updated on every ingest. Example:

```markdown
# Wiki Index
## framework/
- [Layered Architecture](framework/layered-architecture.md) — the 6-layer model.
## harness/
- [Permission Model](harness/permission-model.md) — frontmatter allow/deny/ask.
```

## log.md format
Append-only. Each entry begins with a consistent prefix so it is parseable:
`## [YYYY-MM-DD] <op> | <Title>` where `<op>` ∈ `init | research | ingest | query | lint`. Example:
`## [2026-07-29] init | Wiki scaffolding created`.

## Workflow is branching
The research loop is not a fixed sequence. SystemBuilder may fan out multiple subagents in parallel (e.g. several ResearchAgents, several WikiLibrarians) and may spawn itself (configured `mode: all`). WikiJanitor's ingest runs only when new research was produced; if a query is answered from existing pages, no research/ingest occurs.
