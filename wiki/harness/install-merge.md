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

The component list and dispatch routing come from `registry.json` (repo root), the sole source of truth for components, dependencies, and the Developer profile seed (see [Versioning](../framework/versioning.md)). `profiles.developer.components` has 31 entries; the config/plugin dispatch handles 4 of them — 1 plugin and 3 configs — while the remaining agents, subagents, commands, context, tools, and skills fall through to the generic copy path.

## Config Merge Strategy

Two helpers underpin the merge mode.

### JSONC comment stripping (`strip_jsonc`)

A perl one-liner normalizes JSONC to valid JSON before any jq operation:

- Strips `/* */` block comments (greedy, multiline).
- Strips `//` line comments — but the alternation `("(?:[^"\\]|\\.)*")|(//[^\n]*)` captures string literals first and re-emits them via `$1`, so `//` inside a string value (e.g. a URL like `"https://..."`) is preserved.
- Strips trailing commas before `]` or `}`.
- Pipes the result through `jq .` for validation — a parse failure surfaces as an error rather than silent corruption.

When the target is a `.jsonc` file, `install.sh` warns the user that comments will be stripped from the result. The installed file is plain JSON; JSONC comments do not survive the merge.

### Deep merge (`deep_merge_json`)

A jq function merges a base (template) with an override (existing target):

- **Scalars:** target (override) wins.
- **Objects:** recursive — `mergedeep` descends into keys present in both.
- **Arrays:** concatenated then deduped via `unique`.
- **Type mismatch (object vs non-object):** target wins outright.

The implementation uses `reduce (base + override | keys[]) as $k` rather than `with_entries`. The `with_entries` form had a context bug: `base | has(.key)` resolved `.key` to `base.key` instead of the entry key, producing wrong merge decisions. The `reduce`-over-keys form binds `$k` explicitly and avoids the ambiguity.

## Config Install Modes

### Merge-on-install (`install_config_merge`)

Applies to `opencode.jsonc` and `vibeguard.config.json` — the two config templates that users may have already customized (see [Global Config Template](../harness/global-config.md)).

- **Target absent:** copy the template verbatim, stripping JSONC comments for `.jsonc` files. Warns on comment stripping.
- **Target present:** strip both source and target to JSON, deep-merge with target winning, write the merged result. Warns that JSONC comments are stripped from the result.

The merge is non-destructive to user values: existing keys are preserved, template-only keys are added, and arrays (e.g. plugin lists, MCP server entries) union and dedupe.

### Copy-or-skip (`install_copy_or_skip`)

Applies to `dcp.jsonc` — a config that is EDAC-specific rather than user-extensible.

- **Target absent:** copy.
- **Target present:** skip unless `--overwrite`. No merge.

The distinction from merge-on-install is intentional: `dcp.jsonc` configures the DCP/compress plugin with EDAC-specific settings the user should not need to hand-edit, so clobbering a stale local copy with `--overwrite` is the correct repair, not a merge.

## Plugin Install (`install_plugin`)

Applies to `plugin:holographic-memory` (see [Plugin Provisioning](../harness/plugin-provisioning.md)).

### Build

If `dist/holographic-memory.ts` is missing from the plugin source, `install.sh` builds it in place:

```
cd "$plugin_src" && bun install && node scripts/build.cjs
```

A build failure is reported and counted but does not abort the install — the loop continues with remaining components. `--dry-run` detects a missing `dist/` ahead of time and warns that a build will be required (and that `bun` must be on PATH).

### Copy (three files)

Each file respects `--overwrite` independently — an existing file is skipped unless the flag is set:

| Source (under `src/plugins/holographic-memory/`) | Destination |
|---|---|
| `dist/holographic-memory.ts` | `$INSTALL_DIR/plugins/holographic-memory.ts` |
| `skills/holographic-memory/SKILL.md` | `$INSTALL_DIR/skills/holographic-memory/SKILL.md` |
| `config/holographic_memory.json` | `$INSTALL_DIR/holographic_memory.json` (install root) |

The plugin's config lands at the install root (not under `plugins/`) because OpenCode loads it from the top-level config location. The skill lands under `skills/` so the harness discovers it via the standard skill path.

## Type-Specific Dispatch (`install_components`)

The install loop resolves dependencies recursively, then iterates `RESOLVED_ORDER` and dispatches by component type:

| Component | Dispatch |
|---|---|
| `type:plugin` | `install_plugin` |
| `config:opencode`, `config:vibeguard` | `install_config_merge` |
| `config:dcp` | `install_copy_or_skip` |
| Everything else (agents, subagents, commands, context, tools, skills) | generic `cp` with `--overwrite` gate and global-install path rewriting |

The dispatch is a `case` on the config `id`, not the `path` — so adding a new merge-mode config means registering it with an `id` the case recognizes, not changing path-matching logic. An unknown config `id` hits the `*)` default and errors — every config must have an explicit handler.

## Registry as Source of Truth

`install.sh` reads the Developer profile seed from `registry.json` (repo root):

```
jq -r '.profiles.developer.components[]' registry.json
```

The 31 seed entries resolve through `resolve_dependencies` (recursive, with wildcard expansion for `context:core/*` etc.) into the final install order. The registry is the sole source of truth — `src/manifest.json` and `src/metadata.json` are deprecated and no script reads them (see [Versioning](../framework/versioning.md) and [src/ Package Structure](../framework/src-structure.md)).

The mirror source directory is defined in two places that must stay in sync: `install.sh` `SRC_ROOT` (`"src"`) and `scripts/registry/dependency-resolution.ts` `MIRROR_DIR` (`"src"`). Changing one without the other breaks path resolution.

## Related

- [Global Config Template](../harness/global-config.md) — the `opencode.jsonc` template that `install_config_merge` merges.
- [Plugin Provisioning](../harness/plugin-provisioning.md) — the plugin context for `install_plugin`.
- [src/ Package Structure](../framework/src-structure.md) — where components live in `src/` before mirroring.
- [Versioning](../framework/versioning.md) — `registry.json` as sole source of truth; the deprecated `manifest.json`/`metadata.json`.
