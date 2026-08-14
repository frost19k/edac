# EDAC — Enhanced DevAgents Control

An orchestration-first multi-agent development system for [OpenCode](https://github.com/sst/opencode). EDAC installs a curated agent roster, context system, MCP integrations, and plugins into your OpenCode environment — turning a single coding assistant into a coordinated team of specialists.

## What you get

| Component | Count | What it does |
|---|---|---|
| **Primary agents** | 2 | OpenCoder (coding, architecture, multi-file refactoring) and OpenAgent (universal coordination across any domain) |
| **Specialist subagents** | 12 | CoderAgent, TestEngineer, CodeReviewer, BuildAgent, DocWriter, TaskManager, BatchExecutor, ContextScout, ContextOrganizer, ExternalScout, FrontendSpecialist, DevopsSpecialist |
| **MCP servers** | 4 | Context7 (library docs), GrepApp (code-pattern search), DeepWiki (repo Q&A), Playwright (browser automation) |
| **Plugins** | 4 | DCP/compress (context management), Vibeguard (secret redaction), PTY (long-running processes), Holographic-memory (cross-session persistence) |
| **Commands** | 7 | commit, test, context, add-context, clean, optimize, analyze-patterns |
| **Skills** | 1 | task-management (CLI for tracking feature subtasks) |
| **Context system** | 4 domains | core, web, intl, dev — standards and workflows loaded into agent context |

## Prerequisites

- **[OpenCode](https://github.com/sst/opencode)** — the runtime EDAC installs into
- **[bun](https://bun.sh)** — JavaScript runtime (used by the holographic-memory plugin build)
- **[jq](https://stedolan.github.io/jq/)** — JSON processor (used by the installer for config merging)
- **[perl](https://www.perl.org/)** — preinstalled on most systems (used for JSONC comment stripping)
- **[chromium](https://www.chromium.org/)** — only if you use Playwright browser automation

## Installation

```bash
# Preview what would be installed
./install.sh --dry-run

# Install to ~/.config/opencode (default)
./install.sh

# Overwrite existing files
./install.sh --overwrite

# Install to a custom directory
./install.sh --install-dir /path/to/opencode
# or
EDAC_INSTALL_DIR=/path/to/opencode ./install.sh
```

### What the installer does

1. **Copies** agents, subagents, commands, context, skills, and tools from `src/` to your install directory.
2. **Merges** `opencode.jsonc` and `vibeguard.config.json` with any existing config (target wins, arrays dedupe, JSONC comments stripped with a warning).
3. **Copies** `dcp.jsonc` as-is (skip if already present unless `--overwrite`).
4. **Builds** the holographic-memory plugin from source if `dist/` is missing, then installs the plugin, its skill, and its config.
5. **Rewrites** context paths to absolute install-dir paths for global installs (not needed for local `.opencode` installs).

## Architecture

EDAC is orchestration-first. Two primary agents delegate to a pool of specialists:

```
OpenCoder ─┬─ CoderAgent ──── implementation
           ├─ TestEngineer ── test authoring
           ├─ CodeReviewer ── quality assurance
           ├─ BuildAgent ───── build validation
           ├─ FrontendSpecialist ─ UI design
           ├─ DevopsSpecialist ── infrastructure
           ├─ DocWriter ────── documentation
           ├─ TaskManager ──── task breakdown
           ├─ BatchExecutor ── parallel execution
           ├─ ContextScout ─── context discovery
           └─ ExternalScout ── external research

OpenAgent ─┬─ (same subagent pool, universal coordination)
```

**MCP servers** are provisioned globally — all agents can use them, no per-agent configuration needed. Comprehensive-tier agents (OpenCoder, CoderAgent, TestEngineer, FrontendSpecialist) use MCPs directly for quick lookups and delegate to ExternalScout for deep research.

**Plugins** auto-manage their concerns: DCP handles context compression, Vibeguard redacts secrets from output, PTY manages long-running processes, and Holographic-memory persists facts across sessions.

## Configuration

The installer merges these config templates with your existing files:

| File | Install behavior | Purpose |
|---|---|---|
| `opencode.jsonc` | **Merge** (target wins) | Permission floor, MCP servers, plugins, agent registry |
| `dcp.jsonc` | **Copy or skip** | DCP/compress plugin settings |
| `vibeguard.config.json` | **Merge** (target wins) | Secret-redaction patterns and rules |
| `holographic_memory.json` | **Copy or skip** | Holographic-memory plugin settings |

All configs land at your install root (default `~/.config/opencode/`).

## Project structure

```
EDAC/
├── src/                    # The EDAC system (what gets installed)
│   ├── agents/core/        # OpenCoder, OpenAgent
│   ├── agents/subagents/   # 12 specialist subagents
│   ├── commands/           # 7 slash commands
│   ├── context/            # Context files by domain (core, web, intl, dev)
│   ├── skills/             # task-management skill
│   ├── tools/              # env tool
│   ├── plugins/            # holographic-memory plugin (built from source)
│   ├── opencode.jsonc      # Global config template
│   ├── dcp.jsonc           # DCP/compress config
│   └── vibeguard.config.json  # Secret-redaction config
├── registry.json           # Sole source of truth for components and profiles
├── install.sh              # Installer
├── wiki/                   # Development documentation (not shipped)
├── scripts/                # Validation and registry tooling
└── AGENTS.md               # Compact guidance for repo contributors
```

`src/` is the product. Everything else (`wiki/`, `scripts/`, `AGENTS.md`, this README) supports development and is not installed.

## License

See [LICENSE](src/plugins/holographic-memory/LICENSE) for the holographic-memory plugin. EDAC itself is MIT-licensed.
