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

The **definitive, complete set of valid OpenCode permission keys is 14**:

`read, edit, glob, grep, bash, task, external_directory, todowrite, webfetch, websearch, lsp, skill, question, doom_loop`

**Resolution of the disputed keys:**

| Key | Valid? | Verdict |
|---|---|---|
| `question` | ✅ Yes | Listed in both authoritative pages. |
| `list` | ❌ No | Listed in the Agents page permission table but has **no corresponding tool** on the Tools page and is absent from the Permissions page "Available Permissions" list. The key is inert — a permission for a tool that does not exist. Do not use it. |
| `todowrite` | ✅ Yes | Listed in the Agents page table; it gates **both** `todowrite` and `todoread`. |
| `todoread` | ❌ No | **Not a standalone key.** It is gated by `todowrite` (Agents page: "`todowrite` → `todowrite`, `todoread`"). Any OAC source listing `todoread` as its own key is wrong. |
| `codesearch` | ❌ No | **Not a valid OpenCode permission key.** It appears in **neither** authoritative OpenCode doc page. Any OAC source listing `codesearch` is wrong. |

### Evaluation order and actions

- **Three actions**, each rule resolves to one of: `"allow"` (run without approval), `"ask"` (prompt for approval), `"deny"` (block).
- **Evaluation order: last-match-wins.** Rules are evaluated by pattern match; the last matching rule wins. Canonical pattern is to put the catch-all `"*"` rule first and more specific rules after it (Permissions page, "Granular Rules" and "Task permissions").
- **Defaults:** most permissions default to `"allow"`; `doom_loop` and `external_directory` default to `"ask"`; `read` is `"allow"` but `*.env` / `*.env.*` are denied by default.
  - **Wildcards:** `*` matches zero-or-more of any character; `?` matches exactly one; all other characters match literally. Patterns are matched **full-string anchored** (`^pattern$`), so `"git status *"` does not match `xgit status foo`. Keys are matched as wildcard patterns against the underlying tool name, so the same syntax works for built-ins, custom tools, and MCP tools (e.g. `"mymcp_*": "deny"`).
  - **Trailing ` *` is optional-aware.** A pattern ending in ` *` (space + asterisk) matches both the bare command and the command with arguments: `"ls *"` matches both `ls` and `ls -la`; `"python *"` matches both `python` and `python -c foo`. This is a special case in the matcher — the trailing ` *` is rewritten to `( .*)?` — not a consequence of the base wildcard rule. A pattern ending in `*` without the preceding space (`"ls*"`) has no such handling and overmatches (`ls`, `lsfoo`, `lstmeval`). Verified in `packages/opencode/src/util/wildcard.ts` `match()`.
  - **`"cmd *"` vs `"cmd*"` — the space is a poka-yoke.** The space delimits the command from its arguments and triggers the optional-argument handling above; omitting it lets `*` absorb the boundary, so `"python*"` matches `python`, `python3`, and `pythonista` alike. Use `"cmd *"` (with space) for a single command binary; declare a separate entry per distinct binary (`"python *"` + `"python3 *"`) because `"python *"` does not match `python3 script.py`.
  - **Evaluation is sort-by-length, not declaration order.** The matcher (`wildcard.ts` `all()`) sorts patterns by length ascending (alphabetical tiebreak) and returns the last match. The catch-all `"*"` (length 1) always sorts first, so the "declare catch-all first" convention produces correct behavior, but the mechanism is length-sorted last-match-wins, not source-order last-match-wins.
  - **`grep` matches the search query, not the file path.** The `grep` permission pattern is compared against the content/regex the agent searches for, so path globs like `**/*.env` are inert under `grep:`; restrict `grep:` with search-term wildcards instead. Verified in-repo; see the canonical block in [../harness/permission-model.md](../harness/permission-model.md) §d.
- **Granular vs shorthand:** `read, edit, glob, grep, bash, task, external_directory, lsp, skill` accept either a shorthand action or an object of glob/pattern → action. The remaining keys (`webfetch, websearch, question, todowrite, doom_loop`) accept the shorthand action only.

### Keys valid upstream but absent from some OAC sources

`external_directory` is a valid, upstream key (safety guard for paths outside the project worktree) that at least one OAC source omits. It must be retained in any EDAC permission schema.

---

## Evidence

Two authoritative OpenCode documentation pages were fetched on 2026-07-29 (both "Last updated: Jul 27, 2026"):

**1. Permissions page — "Available Permissions" section** (https://opencode.ai/docs/permissions/)
Lists, verbatim:
> `read` — reading a file · `edit` — all file modifications · `glob` — file globbing · `grep` — content search · `bash` — running shell commands · `task` — launching subagents · `skill` — loading a skill · `lsp` — running LSP queries · `question` — asking the user questions during execution · `webfetch` — fetching a URL · `websearch` — web search · `external_directory` — triggered when a tool touches paths outside the project working directory · `doom_loop` — triggered when the same tool call repeats 3 times with identical input

This page confirms `question`, `webfetch`, `websearch`, `external_directory`, `doom_loop` as valid. It **omits** `todowrite` (a documentation gap — see below).

**2. Agents page — "Permissions" section** (https://opencode.ai/docs/agents/)
Provides the explicit "available permission keys" table, verbatim:

| Key | Tools it gates |
|---|---|
| `read` | `read` |
| `edit` | `write`, `edit`, `apply_patch` |
| `glob` | `glob` |
| `grep` | `grep` |
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

This table is the authoritative enumeration of permission keys. It **adds `todowrite`** to the Permissions-page list, and it explicitly shows `todowrite` gating `todoread` (so `todoread` is not its own key). It contains **no `codesearch`** entry. It lists `list`, but no corresponding `list` tool exists on the Tools page — the key is inert and should not be used.

**Reconciliation:** The canonical set is 14 keys (the union of both pages, minus `list` which is inert). The Permissions page's "Available Permissions" prose list is incomplete (missing `todowrite`); the Agents page table is the definitive enumeration for key membership, but its `list` entry has no backing tool and is excluded. `codesearch` is absent from both and is therefore not a valid OpenCode permission key.

---

## Which OAC source was wrong, and about what

Three OAC internal standards disagreed. Against the upstream docs:

- **`agent-frontmatter.md`** — **WRONG by omission.** It lists `read, edit, glob, grep, bash, task, skill, lsp, question, webfetch, websearch, external_directory, doom_loop` and only *mentions* `todowrite` without listing it as a key. It **omits one valid key: `todowrite`**. It does not list `todoread` or `codesearch` (correct, since those are invalid). It correctly includes `question`, `external_directory`, `doom_loop`.
- **`agent-prompt-design.md`** — **MOSTLY CORRECT, one omission.** It lists `read, edit, glob, grep, list, bash, task, skill, lsp, question, webfetch, websearch, todowrite, doom_loop`. It correctly includes `todowrite` and `question`. Its errors are **omitting the valid key `external_directory`** and **including the inert key `list`**. It does not list `todoread` or `codesearch` (correct).
- **`permission-keys.md`** — **WRONG on multiple counts.** It lists `read, edit, glob, grep, list, bash, task, skill, lsp, todoread, todowrite, webfetch, websearch, codesearch, external_directory, doom_loop`. It **omits the valid key `question`**, and it **includes three invalid keys: `todoread`** (not a standalone key — gated by `todowrite`), **`codesearch`** (not a valid OpenCode permission key at all), and **`list`** (inert — no corresponding tool). It correctly includes `todowrite`, `external_directory`, `doom_loop`.

**Summary of errors:**
- `agent-frontmatter.md`: missing valid `todowrite`.
- `agent-prompt-design.md`: missing valid `external_directory`; includes inert `list`.
- `permission-keys.md`: missing valid `question`; falsely lists invalid `todoread`, `codesearch`, and inert `list`.

---

## Downstream guidance for EDAC

- The EDAC permission schema should use exactly the 14-key canonical set above.
- Drop `todoread`, `codesearch`, and `list` from any OAC-derived schema; if a "todo read" capability must be governed, use `todowrite` (it covers both write and read). `list` is inert — no corresponding tool exists.
- Retain `external_directory` and `question` even though some OAC sources dropped them.
- Encode the last-match-wins evaluation order and the allow/ask/deny action triad in any harness-page ingest that consumes this list.
