<!--
AUDIT.md — EDAC wiki scratchpad.

Ad-hoc capture buffer. Anyone may append a bullet (note) here when, mid-task, they
spot a flaw in the wiki. Do NOT fix it now — note it and move on. SystemBuilder
drains this file during Lint: it VERIFIES the problem and the proposed fix against
src/ or wiki/framework/src-structure.md, applies the fix, logs it to log.md,
and deletes the bullet. Items it cannot verify are retained for investigation.

Bullet format (recommended):
  <where>: <problem> → <fix>
  - <where>   : path (+ optional :line) within the wiki, e.g. framework/foo.md:42 — or "wiki-wide"
  - <problem> : one-line description of what is wrong
  - <fix>     : the proposed correction (SystemBuilder verifies before applying; not trusted blindly)

Example (this line is a comment — it is NOT processed):
  - framework/permission-model.md:17: lists 14 keys → fix: should be 15 (canonical set)
-->

- harness/permission-model.md:431: validation checklist item lists `cat`/`head`/`tail`/`grep`/`sed`/`awk`/`tee`/`patch`/`ls`/`find` as harness-tool duplicates to exclude from bash allow-lists → fix: stale — contradicts §c "Bash Allow-List Conventions" which permits the pipe-capable set (`grep`/`head`/`tail`/`sed`/`awk`/`tee`/`ls`) and excludes only `cat`/`find` (file-op duplicates). `patch` is not discussed in §c at all. Rewrite checklist item to match §c: exclude only `cat` and `find`-for-path-enumeration; list the permitted pipe-capable set. (Noted during wildcard-semantics wiki edit; deferred to the agent-defs round.)
