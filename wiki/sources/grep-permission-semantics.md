---
title: OpenCode grep permission — matched against search query, not file path
url: https://opencode.ai/docs/permissions/
retrieved: 2026-07-31
author: EDAC verification session (SystemBuilder prompt-evaluation, 2026-07-31)
---

## Finding

The `grep` permission key is matched against the **search query (the regex/content pattern)**, not the file path. Consequently, path-based grep permission rules — e.g. `grep: { "**/*.env": "deny" }` — are **inert**: the pattern is compared to the search string and never matches a file glob, so control falls through to the catch-all rule. This was established two ways: (1) the upstream OpenCode Permissions documentation, and (2) empirical tests in this repo.

Practical consequence: grep **cannot** be scoped by file type/extension via permissions. It **can** be restricted by search term using wildcard patterns.

## Primary source (verbatim)

From `opencode.ai/docs/permissions/` ("Available Permissions" list), quoted verbatim in `research/opencode-permission-model.md:47`:

> `read` — reading a file · `edit` — all file modifications · `glob` — file globbing · `grep` — content search · `bash` — running shell commands · `task` — launching subagents · `skill` — loading a skill · `lsp` — running LSP queries · `question` — asking the user questions during execution · `webfetch` — fetching a URL · `websearch` — web search · `external_directory` — triggered when a tool touches paths outside the project working directory · `doom_loop` — triggered when the same tool call repeats 3 times with identical input

The key signal is `grep` — **content search**. This is the asymmetry that breaks path-based grep rules: `read`/`edit` operate on files (so path globs like `**/*.env` deny correctly), whereas `grep` operates on *content queried*, so its permission pattern targets the query string.

Same page, evaluation-order and wildcard rules (`research/opencode-permission-model.md:29-32`):

> Rules are evaluated by pattern match; the **last matching rule wins**.
> Wildcards: `*` matches zero-or-more of any character; `?` matches exactly one.

## Empirical test protocol & results

Config under test (user global opencode config, `grep` block):

```yaml
grep:
    "*": "allow"
    "*password*": "deny"
    "*secret*": "deny"
    "*token*": "deny"
    "*api*key*": "deny"
    "*private*key*": "deny"
```

Broken form previously used (did NOT fire): a single blob
`"password|secret|token|api[_]?key|private[_]?key": "deny"`.
It never matched a single-term search — the matcher does not evaluate `|` as alternation (and/or matches the whole string), so control fell through to `*`: allow. Replacing it with per-term `*term*` wildcard denies fixed it.

Tests (performed 2026-07-31, repo root `test.file` then `**/*.md`):

1. `grep "password"` (test.file) — **DENIED** after the term-based deny was applied. Earlier, with the `|`-blob deny, it was **ALLOWED** (returned a `password=…` line), proving the blob did not match.
2. `grep "text"` (test.file) — **ALLOWED** (returned `some other text`).
3. `grep "EDAC"` (`**/*.md`) — **ALLOWED**, 65 matches across `AGENTS.md`, `wiki/**`, `.opencode/agents/**`.
4. `grep "secret"` (`**/*.md`) — **DENIED**, even though the target was a markdown file — confirming the deny is search-term scoped and path-agnostic.

## Conclusion

- Grep permissions cannot be scoped by file path/extension. The EDAC wiki's canonical "deny sensitive files under grep" block (`harness/permission-model.md`) is built on a false premise and currently provides **no** protection against grep surfacing secret content.
- Grep CAN be restricted by search term: `*password*`, `*secret*`, `*token*`, `*api*key*`, `*private*key*` → `deny`. These fire on the search string regardless of target file type.
- Residual coverage (unchanged, and the real backstops): (a) `read`/`edit` path denies, which *do* match paths, remain the primary secret-file guard; (b) agent output-sanitization (SystemBuilder's Sensitive Output Handling) is the backstop against echoed secrets. The grep term-deny is an outer tripwire, not the only wall.

## Affected wiki content (NOT modified in this pass)

- `harness/permission-model.md` — grep deny guidance should be corrected from path-based to search-term-based. Out of scope for this documentation pass; recorded as an AUDIT.md bullet for WikiJanitor drain.
