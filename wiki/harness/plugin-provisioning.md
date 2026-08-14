---
title: Plugin Provisioning
type: concept
tags: [plugins, dcp, vibeguard, holographic-memory, pty, install, awareness-tiers]
created: 2026-08-14
updated: 2026-08-14
sources: []
status: stable
---

# Plugin Provisioning

EDAC provisions four plugins: two are **auto-managed** (transparent to agents, configured globally, no body-text changes) and two have **per-agent awareness** (agents are told how to use them). Three enter as package references in the `plugin:` array of [Global Config](../harness/global-config.md); one is built from source at install time and dropped in as a local plugin file. No per-agent permission entries are needed for any of them — the [Permission Model](../harness/permission-model.md) makes plugin tools available to all agents by default; awareness is a body-text concern, not a permission-block concern.

## Auto-Management vs Awareness

The distinction is structural:

- **Auto-managed** — the plugin operates at the plugin layer, configured globally via its own config file. Agents have no awareness of it; it does its work transparently (compression, redaction). No agent body text mentions it. DCP/compress and Vibeguard are auto-managed.
- **Per-agent awareness** — the plugin exposes tools agents must call deliberately. Agent body text tells the agent the tool exists and when to use it. Awareness is tiered per the [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) model: **minimal** for most agents (a capability-layer note: "store/retrieve facts via holographic memory" or "spawn a PTY session for long-running processes"), **comprehensive** for OpenCoder (a decision framework for when to persist project knowledge and when to use PTY for dev servers). Holographic-memory and PTY have per-agent awareness.

## The Four Plugins

| Plugin | Package / source | Config file | Awareness |
|---|---|---|---|
| **DCP/compress** | `@tarquinen/opencode-dcp@latest` (package ref in `plugin:` array) | `dcp.jsonc` | Auto-managed — none |
| **Vibeguard** | `opencode-vibeguard` (package ref in `plugin:` array) | `vibeguard.config.json` | Auto-managed — none |
| **PTY** | `opencode-pty` (package ref in `plugin:` array) | — | Per-agent — tiered (see [Tool Awareness Tiers](../framework/tool-awareness-tiers.md)) |
| **Holographic-memory** | built from `src/plugins/holographic-memory/` at install time | `holographic_memory.json` | Per-agent — tiered (see [Tool Awareness Tiers](../framework/tool-awareness-tiers.md)) |

### DCP/compress — context management

Dynamic context pruning and compression. Operates globally: when context approaches the configured limits, DCP compresses the conversation. Agents do not know about it — compression happens at the plugin layer, not via agent action. The `experimental.session.compacting` hook is the integration point.

### Vibeguard — secret redaction

Redacts secrets in command output before they reach the model. Operates globally: detected secrets are replaced with placeholders and held in a session-scoped mapping. Agents do not know about it — redaction is transparent. This is the structural guard behind the "sanitize command output" behavioural convention; the plugin enforces it so agents don't have to.

### Holographic-memory — cross-session fact persistence

Persistent cross-session memory using Holographic Reduced Representations (HRR). Registers two tools — the memory store and memory feedback — that agents call deliberately to store, search, and reason about facts. Unlike the auto-managed plugins, this one requires agent awareness: the agent must decide when a fact is worth persisting. The awareness tier varies by agent role — see [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) for the full matrix (holo-mem column). The plugin is built from source at install time; its config (`holographic_memory.json`) and skill (`holographic-memory/SKILL.md`) are registered as standalone EDAC components at canonical `src/` locations, not nested inside the plugin directory.

### PTY — long-running process management

Persistent pseudo-terminal sessions for long-running processes (dev servers, watch modes, docker builds, terraform plans). Registers tools for spawning, reading, and killing sessions. Unlike the auto-managed plugins, this one requires agent awareness: the agent must decide when a process warrants a PTY session vs. a direct bash call. The awareness tier varies by agent role — see [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) for the full matrix (PTY column).

## Plugin Configs

Each plugin is configured via its own config file, separate from `opencode.jsonc`. Install handling differs per file (see [Install Merge Logic](../harness/install-merge.md)).

### `dcp.jsonc` — compress config

Installed copy-or-skip. Keys:

| Key | Value | Purpose |
|---|---|---|
| `compress.minContextLimit` | `64000` | Lower bound that triggers compression |
| `compress.maxContextLimit` | `128000` | Upper bound for context size |
| `compress.iterationNudgeThreshold` | `15` | Iterations before a nudge |
| `compress.nudgeFrequency` | `5` | How often to nudge |
| `strategies.purgeErrors.turns` | `3` | Purge error turns older than this |

### `vibeguard.config.json` — secret detection

Installed with merge (target wins for existing keys). Keys:

- `enabled`, `debug`, `placeholder_prefix`, `session` (ttl, max_mappings) — operational settings.
- `patterns.keywords` — literal keyword matches (e.g. a placeholder API key).
- `patterns.regex` — regex detectors for known secret shapes (OpenAI, Anthropic, Google, GitHub, AWS, HuggingFace, Stripe, Slack, SendGrid, npm, PyPI, JWT, private-key blocks, DB connection strings, proxy auth URLs).
- `patterns.builtin` — built-in detectors (`email`, `china_phone`, `china_id`, `uuid`, `ipv4`, `mac`).
- `patterns.exclude` — false-positive suppressions (`example.com`, `localhost`, `127.0.0.1`, `0.0.0.0`).

### `holographic_memory.json` — HRR config

Installed copy-or-skip as a registered config component at `src/holographic_memory.json` (not nested inside the plugin directory). Keys:

| Key | Default | Purpose |
|---|---|---|
| `db_path` | `~/.config/opencode/memory/memory_store.db` | SQLite store location |
| `auto_extract` | `false` | Auto-extract facts from conversation (off by default) |
| `default_trust` | `0.5` | Initial trust score for new facts |
| `hrr_dim` | `1024` | HRR vector dimensionality |
| `hrr_weight` | `0.3` | HRR similarity weight in hybrid retrieval |
| `temporal_decay_half_life` | `0` | Temporal decay (0 = disabled) |
| `min_trust_threshold` | `0.3` | Minimum trust for retrieval |

## Install — Build-at-Install

Holographic-memory is the only plugin built from source. If `dist/` is missing at install time, `install.sh` runs `bun install && node scripts/build.cjs` in `src/plugins/holographic-memory/`, then copies the built `dist/holographic-memory.ts` to the target `plugins/` directory. The plugin directory contains only the build contract: `src/` (6 .ts sources), `package.json`, `tsconfig.json`, `scripts/build.cjs`. The config (`holographic_memory.json`) and skill (`holographic-memory/SKILL.md`) are standalone EDAC components at canonical `src/` locations, installed via the standard config and skill paths — not extracted from the plugin directory. DCP, vibeguard, and PTY are package references resolved by OpenCode's plugin loader at runtime — no build step. See [Install Merge Logic](../harness/install-merge.md) for the full install procedure.

## Related

- [Global Config](../harness/global-config.md) — the `opencode.jsonc` template where the `plugin:` block lives.
- [Tool Awareness Tiers](../framework/tool-awareness-tiers.md) — the two-tier awareness model; holographic-memory's per-agent awareness matrix.
- [Install Merge Logic](../harness/install-merge.md) — plugin build-at-install and config-file install handling.
- [Permission Model](../harness/permission-model.md) — why no per-agent permission entries are needed for plugins.
