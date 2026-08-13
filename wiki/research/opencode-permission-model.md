---
title: OpenCode Permission Model — Verified Canonical Key Set
type: source-note
tags: [opencode, permissions, harness, upstream, verification]
created: 2026-07-29
updated: 2026-07-31
sources: [https://opencode.ai/docs/permissions/, https://opencode.ai/docs/agents/]
status: stable
---

## Finding (verified canonical set)

The **definitive, complete set of valid OpenCode permission keys is 15**:

`read, edit, glob, grep, list, bash, task, external_directory, todowrite, webfetch, websearch, lsp, skill, question, doom_loop`

**Resolution of the five disputed keys:**

| Key | Valid? | Verdict |
|---|---|---|
| `question` | ✅ Yes | Listed in both authoritative pages. |
| `list` | ✅ Yes | Listed in the Agents page permission table (`list` → `list`). |
| `todowrite` | ✅ Yes | Listed in the Agents page table; it gates **both** `todowrite` and `todoread`. |
| `todoread` | ❌ No | **Not a standalone key.** It is gated by `todowrite` (Agents page: "`todowrite` → `todowrite`, `todoread`"). Any OAC source listing `todoread` as its own key is wrong. |
| `codesearch` | ❌ No | **Not a valid OpenCode permission key.** It appears in **neither** authoritative OpenCode doc page. Any OAC source listing `codesearch` is wrong. |

### Evaluation order and actions

- **Three actions**, each rule resolves to one of: `"allow"` (run without approval), `"ask"` (prompt for approval), `"deny"` (block).
- **Evaluation order: last-match-wins.** Rules are evaluated by pattern match; the last matching rule wins. Canonical pattern is to put the catch-all `"*"` rule first and more specific rules after it (Permissions page, "Granular Rules" and "Task permissions").
- **Defaults:** most permissions default to `"allow"`; `doom_loop` and `external_directory` default to `"ask"`; `read` is `"allow"` but `*.env` / `*.env.*` are denied by default.
  - **Wildcards:** `*` matches zero-or-more of any character; `?` matches exactly one. Keys are matched as wildcard patterns against the underlying tool name, so the same syntax works for built-ins, custom tools, and MCP tools (e.g. `"mymcp_*": "deny"`).
  - **`grep` matches the search query, not the file path.** The `grep` permission pattern is compared against the content/regex the agent searches for, so path globs like `**/*.env` are inert under `grep:`; restrict `grep:` with search-term wildcards instead. Verified in-repo; see the canonical block in [../harness/permission-model.md](../harness/permission-model.md) §d.
- **Granular vs shorthand:** `read, edit, glob, grep, list, bash, task, external_directory, lsp, skill` accept either a shorthand action or an object of glob/pattern → action. The remaining keys (`webfetch, websearch, question, todowrite, doom_loop`) accept the shorthand action only.

### Keys valid upstream but absent from some OAC sources

`external_directory` is a valid, upstream key (safety guard for paths outside the project worktree) that at least one OAC source omits. It must be retained in any EDAC permission schema.

---

## Evidence

Two authoritative OpenCode documentation pages were fetched on 2026-07-29 (both "Last updated: Jul 27, 2026"):

**1. Permissions page — "Available Permissions" section** (https://opencode.ai/docs/permissions/)
Lists, verbatim:
> `read` — reading a file · `edit` — all file modifications · `glob` — file globbing · `grep` — content search · `bash` — running shell commands · `task` — launching subagents · `skill` — loading a skill · `lsp` — running LSP queries · `question` — asking the user questions during execution · `webfetch` — fetching a URL · `websearch` — web search · `external_directory` — triggered when a tool touches paths outside the project working directory · `doom_loop` — triggered when the same tool call repeats 3 times with identical input

This page confirms `question`, `webfetch`, `websearch`, `external_directory`, `doom_loop` as valid. It **omits** `list` and `todowrite` (a documentation gap — see below).

**2. Agents page — "Permissions" section** (https://opencode.ai/docs/agents/)
Provides the explicit "available permission keys" table, verbatim:

| Key | Tools it gates |
|---|---|
| `read` | `read` |
| `edit` | `write`, `edit`, `apply_patch` |
| `glob` | `glob` |
| `grep` | `grep` |
| `list` | `list` |
| `bash` | `bash` |
| `task` | `task` |
| `external_directory` | Any tool that reads or writes files outside the project worktree |
| `todowrite` | `todowrite`, `todoread` |
| `webfetch` | `webfetch` |
| `websearch` | `websearch` |
| `lsp` | `lsp` |
| `skill` | `skill` |
| `question` | `question` |
| `doom_loop` | Recovery prompts when an agent appears stuck |

This table is the authoritative enumeration of permission keys. It **adds `list` and `todowrite`** to the Permissions-page list, and it explicitly shows `todowrite` gating `todoread` (so `todoread` is not its own key). It contains **no `codesearch`** entry.

**Reconciliation:** The canonical set is the union of both pages (15 keys). The Permissions page's "Available Permissions" prose list is incomplete (missing `list` and `todowrite`); the Agents page table is the definitive enumeration and is treated as authoritative for key membership. `codesearch` is absent from both and is therefore not a valid OpenCode permission key.

---

## Which OAC source was wrong, and about what

Three OAC internal standards disagreed. Against the upstream docs:

- **`agent-frontmatter.md`** — **WRONG by omission.** It lists `read, edit, glob, grep, bash, task, skill, lsp, question, webfetch, websearch, external_directory, doom_loop` and only *mentions* `todowrite` without listing it as a key. It **omits two valid keys: `list` and `todowrite`**. It does not list `todoread` or `codesearch` (correct, since those are invalid). It correctly includes `question`, `external_directory`, `doom_loop`.
- **`agent-prompt-design.md`** — **MOSTLY CORRECT, one omission.** It lists `read, edit, glob, grep, list, bash, task, skill, lsp, question, webfetch, websearch, todowrite, doom_loop`. It correctly includes `list`, `todowrite`, and `question`. Its only error is **omitting the valid key `external_directory`**. It does not list `todoread` or `codesearch` (correct).
- **`permission-keys.md`** — **WRONG on multiple counts.** It lists `read, edit, glob, grep, list, bash, task, skill, lsp, todoread, todowrite, webfetch, websearch, codesearch, external_directory, doom_loop`. It **omits the valid key `question`**, and it **includes two INVALID keys: `todoread`** (not a standalone key — gated by `todowrite`) and **`codesearch`** (not a valid OpenCode permission key at all). It correctly includes `list`, `todowrite`, `external_directory`, `doom_loop`.

**Summary of errors:**
- `agent-frontmatter.md`: missing valid `list`, `todowrite`.
- `agent-prompt-design.md`: missing valid `external_directory`.
- `permission-keys.md`: missing valid `question`; falsely lists invalid `todoread` and `codesearch`.

---

## Downstream guidance for EDAC

- The EDAC permission schema should use exactly the 15-key canonical set above.
- Drop `todoread` and `codesearch` from any OAC-derived schema; if a "todo read" capability must be governed, use `todowrite` (it covers both write and read).
- Retain `external_directory` and `question` even though some OAC sources dropped them.
- Encode the last-match-wins evaluation order and the allow/ask/deny action triad in any harness-page ingest that consumes this list.
