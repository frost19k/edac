# AGENTS.md — holographic-memory

## What This Is

OpenCode plugin providing persistent cross-session memory via Holographic Reduced Representations (HRR). Registers two tools: `fact_store` (9 actions) and `fact_feedback` (2 actions). Faithful port from NousResearch/hermes-agent.

## Runtime

- **Bun** (not Node). Uses `bun:sqlite` built-in — no install needed.
- `@opencode-ai/plugin` is a peer dependency, already present in OpenCode's `~/.config/opencode/node_modules/`.

## Architecture

```
src/
├── types.ts                # Interfaces only — no runtime code
├── hrr.ts                  # Pure HRR algebra (bind, unbind, bundle, similarity)
├── entities.ts             # Regex entity extraction
├── store.ts                # HolographicStore class — SQLite persistence
├── retrieval.ts            # FactRetriever class — 5 retrieval strategies
└── holographic-memory.ts   # Plugin entry — exports `server: Plugin`
```

`dist/holographic-memory.ts` — **single bundled file** (1500+ lines). This is what ships. Do NOT edit it directly.

## Build

```bash
node scripts/build.cjs    # Concatenates src/*.ts → dist/holographic-memory.ts
```

The build script does four critical things that are easy to get wrong:

1. **Strips all `export` except `export const server`** — OpenCode's loader iterates ALL module exports and calls each function. Exported classes (`HolographicStore`, `FactRetriever`) crash when called without `new`.

2. **Preserves `type` keyword on imports** — `Plugin` and `Hooks` are type-only exports from `@opencode-ai/plugin`. The build emits `import type { Hooks, Plugin }` separately from `import { tool }`.

3. **Strips `import * as hrr from './hrr'` then replaces `hrr.xxx(` with `xxx(`** — namespace calls resolve to standalone function exports in the bundle.

4. **Deduplicates imports** by source module, merging names from multiple source files.

After building, verify:
- Only ONE `export` line in dist: `export const server: Plugin`
- Type-only imports use `import type` (not value imports)
- No mid-file `import` statements

## Install (npm)

```bash
npm install holographic-memory
```

`postinstall` copies `dist/holographic-memory.ts` → `~/.config/opencode/plugins/` and `skills/holographic-memory/SKILL.md` → `~/.config/opencode/skills/`. Restart OpenCode after install.

## Local Development

```bash
# Edit src/*.ts, then:
node scripts/build.cjs
cp dist/holographic-memory.ts ~/.config/opencode/plugins/
# Restart OpenCode to load changes
```

Type check requires bun: `bun run check` (or `bunx tsc --noEmit`).

## Quirks

- `npm install .` hangs on npm 11.x (registry timeout). Use `npm install . --omit=dev` for local testing.
- No test files exist. `bun test` in package.json is aspirational.
- `scripts/build.cjs` is excluded from npm via `.npmignore` (dev-only). `scripts/postinstall.cjs` is included via `files[]` in package.json.
- Config is self-managed at `~/.config/opencode/holographic_memory.json` — NOT in `opencode.json`.
- DB path defaults to `~/.config/opencode/memory/memory_store.db`.
- SKILL.md MUST have YAML frontmatter (`name`, `description`) or OpenCode won't discover it.

## Plugin API Contract

The plugin function is an async function returning a `Hooks` object:

```typescript
export const server: Plugin = async (_input) => {
  return {
    tool: { fact_store: tool({...}), fact_feedback: tool({...}) },
    'experimental.chat.system.transform': async (_input, output) => { ... },
    'experimental.session.compacting': async (_input, output) => { ... },
  }
}
```

- Tools use `tool()` helper with raw Zod shape (NOT `z.object()` wrapper).
- Hooks mutate `output` in place — no return value.
- `experimental.chat.system.transform` pushes to `output.system` array.
- `experimental.session.compacting` pushes to `output.context` array.

## Files in npm package

| File | Included | Purpose |
|------|----------|---------|
| `dist/holographic-memory.ts` | Yes (`files[]`) | Bundled plugin |
| `scripts/postinstall.cjs` | Yes (`files[]`) | Copies plugin + skill to OpenCode dirs |
| `scripts/build.cjs` | No (`.npmignore`) | Dev-only build tool |
| `skills/holographic-memory/SKILL.md` | Yes (`files[]`) | Agent skill instructions |
| `config/holographic_memory.json` | Yes (`files[]`) | Default config template |
