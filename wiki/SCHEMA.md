# Wiki Schema & Workflow

Conventions for maintaining EDAC's wiki — the research/verification knowledge base
used while developing `src/`. This file is the contract every wiki actor follows.
SystemBuilder is the sole wiki actor; for external research it spawns ExternalScout
and ingests the results inline (see Wiki Stewardship in SystemBuilder's constitution).

> ## EDAC ↔ OAC relationship (read first)
> EDAC is **inspired by** OpenAgentsControl (OAC) but has **no obligation to follow OAC specifics** — especially the structure of the local `.opencode/`.
> - OAC patterns, where they exist, live **exclusively in `src/`**.
> - For the purposes of EDAC: **OAC ≈ `src/`**.
> - `src/` is a **focused derivation and enhancement** of OAC, not a mirror.
>
> Consequence for the wiki: pages derived from OAC sources describe OAC *lineage* and are generalized, not authoritative EDAC layout. Treat `src/` as the source of truth for EDAC structure (see [framework/src-structure.md](framework/src-structure.md)). Do **not** assume OAC directory layouts, file names, or metadata locations apply to EDAC's `.opencode/`.

## Purpose
The wiki is a persistent, compounding knowledge base used while developing `src/`.
It is not a user-facing browse tool. The user interacts only with SystemBuilder.

Pattern reference: `llm-wiki.md` (the abstract LLM-wiki idea this repo instantiates).

## Authority & layering
This file is the **canonical procedure source** for the EDAC wiki. It defines what the wiki is, its structure, and what workflows are performed — the contract SystemBuilder follows.

The schema is **conceptual**: it says *what* to do. SystemBuilder's constitution encodes the agent-specific operating procedures and protocols — it says *how* to do it. A schema statement and SystemBuilder's procedure must never disagree; if they appear to, SCHEMA is authoritative and the procedure is corrected to mirror it.

Concretely:
- **SCHEMA.md** — structure, conventions, and the *what* of each workflow (Research, Ingest, Query, Lint, Audit). The single editable home for procedure intent.
- **SystemBuilder's constitution** — the *how*: operational steps, tool translations, and conflict handling for every wiki workflow, performed inline under Wiki Stewardship. ExternalScout is spawned for external research fetch only; SystemBuilder ingests and files the results.

## Layout
- `sources/` — raw, immutable primary data. SystemBuilder writes cited research docs here (from ExternalScout output or user-dropped material). Never modified after creation.
- `framework/` — generated pages on EDAC's conceptual architecture (agentic-system design, the layered model, registry/install model, component taxonomy).
- `harness/` — generated pages on OpenCode harness specifics (agent frontmatter, permission model, tools, MCP, subagent spawning, context/`compress`).
- `research/` — generated pages on external references, findings, comparisons (OpenAgentsControl lineage, upstream OpenCode docs, related projects).
- `SCHEMA.md` — this file.
- `index.md` — content catalog (updated every ingest).
- `log.md` — chronological activity record (append-only).
- `TODO.md` — cross-session build plan for the wiki workflow itself.
- `AUDIT.md` — ad-hoc scratchpad for wiki flaws spotted mid-task. Anyone may append a bullet; SystemBuilder drains it during Lint (verify problem + fix → apply → log → delete). Not a generated page; exempt from Lint's page checks.

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

Body: structured notes + verbatim quotes where useful, with inline citations. SystemBuilder works in `.tmp/{stub}/external-research/` and writes the final cited doc to `sources/{stub}.md`.

## Procedures
The workflows below are described conceptually — *what* each does. SystemBuilder performs all of them inline under Wiki Stewardship; the operational steps (*how*) live in SystemBuilder's constitution (see Authority & layering above).

### Research
Gather external data via ExternalScout (Context7, web search/fetch). SystemBuilder produces a structured, cited doc in `sources/` from the results. Scratch work stays in `.tmp/{stub}/external-research/` and is not committed.

### Ingest
Given a source, create/update relevant pages across `framework/` `harness/` `research/`, add cross-references, then update `index.md` and append to `log.md`. A single source may touch many pages.

### Query
Read `index.md` to locate relevant pages, read them, synthesize an answer with citations. Good answers may be filed back as new pages.

### Lint
Standalone health-check of the generated pages (`framework/`, `harness/`, `research/`). SystemBuilder verifies, against `src/` and `wiki/framework/src-structure.md`:
1. **OAC-path tyranny** — no generated page asserts an OAC `.opencode/` path or a wrong `src/` path as EDAC fact.
2. **Structural-claim traceability** — every EDAC path/directory/layout assertion traces to `src-structure.md`.
3. **Cross-link integrity** — inline + `## Related` links resolve; no orphan pages; gap detection for concepts lacking a page.
4. **Frontmatter compliance** — all seven required keys present; `type`/`status` enums valid.
5. **Contradictions** — pages (and `src-structure.md` / live `src/`) do not contradict.
6. **Stale claims** — version/file/path assertions match the live repo.
7. **Secret scan** — leaked secrets in ordinary files are flagged (never written into pages).

Exempt from these checks: `sources/` (immutable upstream docs), `SCHEMA.md`, `TODO.md`, `log.md`, `AUDIT.md` (scratchpad), and `framework/src-structure.md` (legitimately quotes wrong forms to explain the fix).

### Audit capture (anyone)
Ad-hoc, low-friction. While working on anything, if you spot a flaw in the wiki, append a bullet to `AUDIT.md` and return to the task — do not fix it inline. The recommended bullet shape is encoded as a comment in `AUDIT.md` itself:

  <where>: <problem> → <fix>

- `<where>` — path (+ optional `:line`) within the wiki, or `wiki-wide`.
- `<problem>` — one-line statement of what is wrong.
- `<fix>` — the proposed correction. SystemBuilder verifies it before applying; it is **not** trusted blindly.

The file is a scratchpad: it holds only unprocessed bullets. No structure beyond the bullet list is required.

### Audit drain (Step 0 of standalone Lint)
A standalone Lint begins by draining `AUDIT.md`: for each bullet, SystemBuilder **verifies the problem and the proposed fix** against `src/` or `src-structure.md`; if both verify it applies the fix, logs it, and deletes the bullet; if either fails it retains the bullet for investigation. No external research is performed during drain. When `AUDIT.md` is empty this step is a no-op.

### Cross-Reference Protocol
The wiki is a navigable graph, not standalone blobs. These are conventions (the *what*); SystemBuilder enforces them in Lint and traverses them in Query. Every page is responsible for linking its related concepts inline so Query can traverse and Lint can verify.

- **Inline links are mandatory.** Whenever a page mentions a concept that has (or should have) its own wiki page, embed an inline markdown link in the prose — e.g. `the [permission model](./permission-model.md) governs access`. A trailing `## Related` section is a supplement only; it does **not** substitute for inline links. Inline links are grep-discoverable, which is what Lint checks (Check 2) and what lets Query walk the graph.
- **Back-links.** When page A links to page B, SystemBuilder also ensures B's `## Related` (and, where natural, B's prose) acknowledges A — unless B is a deliberate hub. This keeps the graph bidirectional.
- **Lint enforces** (Check 2): inline + `## Related` links resolve; no orphan page (zero inbound links); gap detection — a concept mentioned but lacking a page is a candidate for the ingest queue; bidirectional-consistency warning on asymmetry (asymmetry is allowed for hubs, so warn, don't fail).
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
The research loop is not a fixed sequence. SystemBuilder may fan out multiple ExternalScout instances in parallel for independent research and may spawn itself (configured `mode: all`) for parallel independent units of wiki work. Ingest runs only when new research was produced; if a query is answered from existing pages, no research/ingest occurs.