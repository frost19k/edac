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
> Consequence for the wiki: pages derived from OAC sources describe OAC *lineage* and are generalized, not authoritative EDAC layout. Treat `src/` as the source of truth for EDAC structure. Do **not** assume OAC directory layouts, file names, or metadata locations apply to EDAC's `.opencode/`.

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
Periodically health-check: contradictions between pages, stale claims, orphan pages (no inbound links), concepts mentioned but lacking a page, missing cross-references, data gaps fillable by web search.

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
