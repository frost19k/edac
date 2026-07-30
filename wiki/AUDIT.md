<!--
AUDIT.md — EDAC wiki scratchpad.

Ad-hoc capture buffer. Anyone may append a bullet (note) here when, mid-task, they
spot a flaw in the wiki. Do NOT fix it now — note it and move on. WikiJanitor
drains this file later: it VERIFIES the problem and the proposed fix against
src/ or wiki/framework/src-structure.md, applies the fix, logs it to log.md,
and deletes the bullet. Items it cannot verify are escalated to SystemBuilder.

Bullet format (recommended):
  <where>: <problem> → <fix>
  - <where>   : path (+ optional :line) within the wiki, e.g. framework/foo.md:42 — or "wiki-wide"
  - <problem> : one-line description of what is wrong
  - <fix>     : the proposed correction (WikiJanitor verifies before applying; not trusted blindly)

Example (this line is a comment — it is NOT processed):
  - framework/permission-model.md:17: lists 14 keys → fix: should be 15 (canonical set)
-->

- wiki-wide: do the conventions (framework/prompt-design-principles.md) have clarity on prohibiting prompt files from restating harness-injected tool schema? → fix: if no standard exists there, add one so the redundancy state does not accumulate further
