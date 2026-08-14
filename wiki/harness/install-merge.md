---
title: Install Merge Logic
type: concept
tags: [install, merge, jsonc, plugin, registry, config]
created: 2026-08-14
updated: 2026-08-14
sources: [install.sh, registry.json]
status: stable
---

# Install Merge Logic

`install.sh` installs the Developer profile from `src/` into a target OpenCode environment. For the component types that need more than a flat copy — config templates and the plugin — it dispatches to one of **three install modes**: merge-on-install (config), copy-or-skip (config), and build-plus-copy (plugin). The generic `cp` path handles agents, subagents, commands, context, and tools; this page covers only the config and plugin logic.

The component list and dispatch routing come from `registry.json` (repo root), the sole source of truth for components, dependencies, and the Developer profile seed (see [Versioning](../framework/versioning.md)). `profiles.developer.components` has 33 entries; the config/plugin dispatch handles 5 of them — 1 plugin and 4 configs — while the remaining agents, subagents, commands, context, tools, and skills fall through to the generic copy path.

## Config Merge Strategy

Two helpers underpin the merge mode.

### JSONC / JSON reading (`read_config_json`)

Config reading is extension-gated to avoid corrupting plain JSON values:

- For `.jsonc` files, a perl one-liner normalizes JSONC to valid JSON before piping through `jq .`:
  - Block comments (`/* */`), line comments (`//`), and trailing commas are stripped.
  - All comment patterns and the trailing-comma rewrite are protected against string literals, so `//` inside a URL, `/*` inside a regex, and `{n,}` quantifiers are never corrupted.
- For `.json` files, the file is passed straight to `jq .` with no text rewriting. This is critical for `vibeguard.config.json`, whose regex patterns contain quantifiers like `{36,}` that the old trailing-comma rewrite would silently truncate.

When the target is a `.jsonc` file, `install.sh` warns the user that comments will be stripped from the result. The installed file is plain JSON; JSONC comments do not survive the merge.

### Config merge (`merge_config_json`)

A single-pass jq function merges a template with an existing user config:

- **Scalars:** target (user) wins.
- **Objects:** recursive — the function descends into keys present in the template, adding template-only keys and preserving user-overridden keys. `keys_unsorted` keeps the user's key order intact, minimizing diff churn.
- **Arrays:** by default, arrays are leaves (user wins). This preserves order-sensitive arrays such as `mcp.playwright.command` (`["npx", "-y", "@playwright/mcp@latest"]`) and the documented plugin hook order.
- **Set-arrays:** only arrays explicitly declared as set-arrays are unioned. The call site passes a JSON array of paths (e.g. `[["plugin"]]` for `opencode.jsonc`) and an order-preserving `reduce`-based dedupe is applied — never `unique`, which sorts.
- **Null handling:** if the user sets a key to `null`, the template value fills it.
- **Type mismatch (object vs non-object):** target wins outright.

The implementation uses `reduce (t | keys_unsorted[]) as $k` rather than `with_entries`. The `with_entries` form had a context bug: `base | has(.key)` resolved `.key` to `base.key` instead of the entry key, producing wrong merge decisions. The `reduce`-over-keys form binds `$k` explicitly and avoids the ambiguity.

## Config Install Modes

### Merge-on-install (`install_config_merge`)

Applies to `opencode.jsonc` and `vibeguard.config.json` — the two config templates that users may have already customized (see [Global Config Template](../harness/global-config.md)).

- **Target absent:** copy the template, stripping JSONC comments for `.jsonc` files. Warns on comment stripping.
- **Target present:** read both source and target as JSON, merge with target winning, and write the result atomically:
  1. Write the merged JSON to a temp file next to the destination (`mktemp "${dest}.XXXXXX"`).
  2. On success, copy the existing destination to `${dest}.edac-bak`, then `mv` the temp file into place.
  3. On failure, remove the temp file, report the error, and count the component as failed.

This guarantees that a jq or merge failure never leaves the user with a truncated or empty config. The `.edac-bak` backup also covers the irreversible JSONC comment loss case. Warns that JSONC comments are stripped from the result and names the backup path.

The merge is non-destructive to user values: existing keys are preserved, template-only keys are added, and only declared set-arrays (e.g. `plugin`, `patterns.regex`, `patterns.builtin`) are unioned with order preserved.

### Copy-or-skip (`install_copy_or_skip`)

Applies to `dcp.jsonc` and `holographic_memory.json` — configs that are EDAC-specific rather than user-extensible.

- **Target absent:** copy.
- **Target present:** skip unless `--overwrite`. No merge.
- **Before overwriting:** the existing destination is copied to `${dest}.edac-bak`, matching the merge path's backup behavior.

The distinction from merge-on-install is intentional: `dcp.jsonc` configures the DCP/compress plugin with EDAC-specific settings the user should not need to hand-edit, so clobbering a stale local copy with `--overwrite` is the correct repair, not a merge.

## Plugin Install (`install_plugin`)

Applies to `plugin:holographic-memory` (see [Plugin Provisioning](../harness/plugin-provisioning.md)).

### Build

If `dist/holographic-memory.ts` is missing from the plugin source, `install.sh` builds it in place:

```
cd "$plugin_src" && bun install && node scripts/build.cjs
```

A build failure is reported and counted but does not abort the install — the loop continues with remaining components. `--dry-run` detects a missing `dist/` ahead of time and warns that a build will be required (and that `bun` must be on PATH).

### Copy (one file)

The plugin's built bundle is the only file `install_plugin` copies. The config (`holographic_memory.json`) and skill (`holographic-memory/SKILL.md`) are standalone registered components installed via the standard config and skill paths:

| Source (under `src/plugins/holographic-memory/`) | Destination |
|---|---|
| `dist/holographic-memory.ts` | `$INSTALL_DIR/plugins/holographic-memory.ts` |

The config lands at `$INSTALL_DIR/holographic_memory.json` (install root) via `install_copy_or_skip` — see [Copy-or-skip](#copy-or-skip-install_copy_or_skip) above. The skill lands at `$INSTALL_DIR/skills/holographic-memory/SKILL.md` via the generic `cp` path.

## Type-Specific Dispatch (`install_components`)

The install loop resolves dependencies recursively, then iterates `RESOLVED_ORDER` and dispatches by component type:

| Component | Dispatch |
|---|---|
| `type:plugin` | `install_plugin` |
| `config:opencode`, `config:vibeguard` | `install_config_merge` |
| `config:dcp`, `config:holographic_memory` | `install_copy_or_skip` |
| Everything else (agents, subagents, commands, context, tools, skills) | generic `cp` with `--overwrite` gate and global-install path rewriting |

The dispatch is a `case` on the config `id`, not the `path` — so adding a new merge-mode config means registering it with an `id` the case recognizes, not changing path-matching logic. An unknown config `id` hits the `*)` default and errors — every config must have an explicit handler.

## Registry as Source of Truth

`install.sh` reads the Developer profile seed from `registry.json` (repo root):

```
jq -r '.profiles.developer.components[]' registry.json
```

The 33 seed entries resolve through `resolve_dependencies` (recursive, with wildcard expansion for `context:core/*` etc.) into the final install order. The registry is the sole source of truth — `src/manifest.json` and `src/metadata.json` are deprecated and no script reads them (see [Versioning](../framework/versioning.md) and [src/ Package Structure](../framework/src-structure.md)).

The mirror source directory is defined in two places that must stay in sync: `install.sh` `SRC_ROOT` (`"src"`) and `scripts/registry/dependency-resolution.ts` `MIRROR_DIR` (`"src"`). Changing one without the other breaks path resolution.

## Related

- [Global Config Template](../harness/global-config.md) — the `opencode.jsonc` template that `install_config_merge` merges.
- [Plugin Provisioning](../harness/plugin-provisioning.md) — the plugin context for `install_plugin`.
- [src/ Package Structure](../framework/src-structure.md) — where components live in `src/` before mirroring.
- [Versioning](../framework/versioning.md) — `registry.json` as sole source of truth; the deprecated `manifest.json`/`metadata.json`.
