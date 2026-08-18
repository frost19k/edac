// Holographic Memory — OpenCode Plugin
// Faithful port from Hermes Agent (NousResearch/hermes-agent)
// Compatible with @opencode-ai/plugin v1.14.x

import { tool, type Plugin, type Hooks } from '@opencode-ai/plugin'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { HolographicStore } from './store'
import { FactRetriever } from './retrieval'
import { toPublicFact, toScoredPublicFact } from './serialize'
import type { HolographicConfig } from './types'

// ─── Safety Limits ────────────────────────────────────────────

/** Maximum results returned by read actions (prevents tool-output bloat) */
const MAX_LIMIT = 200
/** Maximum fact content length stored or returned (prevents DB and payload bloat) */
const MAX_CONTENT_LENGTH = 8192

// ─── Configuration ────────────────────────────────────────────

const DEFAULT_CONFIG: HolographicConfig = {
  db_path: join(homedir(), '.config', 'opencode', 'memory', 'memory_store.db'),
  auto_extract: false,
  default_trust: 0.5,
  hrr_dim: 1024,
  hrr_weight: 0.3,
  temporal_decay_half_life: 0,
  min_trust_threshold: 0.3,
}

/**
 * Expand ~, ${HOME}, and $HOME in a path string to the user's home directory.
 * Node.js does not perform shell expansion, so paths from config files that
 * use these patterns must be expanded manually to avoid creating literal
 * "~" or "${HOME}" directories in the working directory.
 */
function expandPath(p: string): string {
  const home = homedir()
  if (p.startsWith('~')) {
    return join(home, p.slice(1))
  }
  return p.replace(/\$\{?HOME\}?/g, home)
}

function loadConfig(): HolographicConfig {
  const configPath = join(homedir(), '.config', 'opencode', 'holographic_memory.json')

  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, 'utf-8')
      const userConfig = JSON.parse(raw)
      const merged = { ...DEFAULT_CONFIG, ...userConfig }
      if (merged.db_path) {
        merged.db_path = expandPath(merged.db_path)
      }
      return merged
    } catch {
      // Fall back to defaults if config is malformed
    }
  }

  return { ...DEFAULT_CONFIG }
}

/** Cached config — avoids re-reading disk on every tool invocation */
let _config: HolographicConfig | null = null

function getConfig(): HolographicConfig {
  if (!_config) {
    _config = loadConfig()
  }
  return _config
}

// ─── Singleton Store ──────────────────────────────────────────

let _store: HolographicStore | null = null
let _retriever: FactRetriever | null = null

function getStore(): HolographicStore {
  if (!_store) {
    _store = new HolographicStore(getConfig())
  }
  return _store
}

function getRetriever(): FactRetriever {
  if (!_retriever) {
    _retriever = new FactRetriever(getStore(), getConfig())
  }
  return _retriever
}

// ─── Auto-Extraction Patterns ─────────────────────────────────

const PREFERENCE_PATTERNS = [
  /\bI\s+(?:prefer|like|love|use|want|need)\s+(.{10,200})/gi,
  /\bmy\s+(?:favorite|preferred|default)\s+\w+\s+is\s+(.{5,200})/gi,
  /\bI\s+(?:always|never|usually)\s+(.{10,200})/gi,
]

const DECISION_PATTERNS = [
  /\bwe\s+(?:decided|agreed|chose)\s+(?:to\s+)?(.{10,200})/gi,
  /\bthe\s+project\s+(?:uses|needs|requires)\s+(.{5,200})/gi,
]

function extractFactsFromText(text: string): string[] {
  const facts: string[] = []
  const seen = new Set<string>()

  const addFact = (match: RegExpExecArray) => {
    const content = match[1]?.trim()
    if (content && content.length >= 10 && content.length <= 400 && !seen.has(content)) {
      seen.add(content)
      facts.push(content)
    }
  }

  for (const pattern of PREFERENCE_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      addFact(match)
    }
  }

  for (const pattern of DECISION_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      addFact(match)
    }
  }

  return facts
}

// ─── System Prompt ────────────────────────────────────────────

const MEMORY_SYSTEM_PROMPT = `## Holographic Memory
Provides persistent cross-session memory via fact_store and fact_feedback tools.

Transient info degrades retrieval, so store only durable facts that a future session would need and which you cannot recover from persistent sources (repo, docs, configs, commits).

Store: user preferences, project decisions/conventions, tool behaviour, durable feedback.
Skip: current task progress, intermediate reasoning, session-scoped state.
Use compress for transient context; fact_store is for durable facts only.

Store only if a future session would need it; otherwise, omit.

Categories — user_pref: facts/preferences · project: decisions/conventions · tool: behaviour · general: misc.
Use specific entity names and tags; each fact must stand alone.
For advanced fact-structuring and retrieval guidance, load the holographic-memory skill.`

// ─── Plugin Entry Point ──────────────────────────────────────

export const server: Plugin = async (_input) => {
  const z = tool.schema

  const hooks: Hooks = {
    // ── Tools ─────────────────────────────────────────────────
    tool: {
      fact_store: tool({
        description: `Holographic memory fact store. Use this to store, search, and reason about facts.
Actions:
- add: Store a new fact (content, category, tags)
- search: Hybrid keyword + semantic search (query, category, min_trust, limit)
- probe: Find all facts about a specific entity using algebraic recall (entity, category, limit)
- related: Find facts connected to an entity through shared context (entity, category, limit)
- reason: Compositional AND query — find facts about ALL listed entities (entities, category, limit)
- contradict: Find conflicting facts (category, threshold, limit)
- update: Modify an existing fact (fact_id, content, trust_delta, tags)
- remove: Delete a fact (fact_id)
- list: Browse facts by category (category, min_trust, limit)`,

        args: {
          action: z.enum(['add', 'search', 'probe', 'related', 'reason', 'contradict', 'update', 'remove', 'list']),
          content: z.string().optional().describe('Fact content (for add/update)'),
          category: z.string().optional().describe('Category: user_pref, project, tool, general'),
          tags: z.string().optional().describe('Comma-separated tags'),
          query: z.string().optional().describe('Search query (for search)'),
          entity: z.string().optional().describe('Entity name (for probe/related)'),
          entities: z.array(z.string()).optional().describe('Entity names (for reason — compositional AND)'),
          fact_id: z.number().optional().describe('Fact ID (for update/remove/feedback)'),
          trust_delta: z.number().optional().describe('Trust score adjustment (for update)'),
          min_trust: z.number().optional().describe('Minimum trust threshold'),
          limit: z.number().optional().describe('Max results to return'),
          threshold: z.number().optional().describe('Contradiction threshold (for contradict)'),
        },

        async execute(args) {
          try {
            const store = getStore()
            const retriever = getRetriever()

            const limit = args.limit == null ? undefined : Math.min(args.limit, MAX_LIMIT)
            const content = args.content ? args.content.slice(0, MAX_CONTENT_LENGTH) : undefined

            switch (args.action) {
              case 'add': {
                if (!content) return 'Error: content is required for add'
                const result = await store.addFact(content, args.category, args.tags)

                // Opportunistic stale-fact pruning: amortize cleanup across writes.
                // 10% chance per successful add; failures are non-fatal and silent.
                if (Math.random() < 0.1) {
                  try {
                    store.pruneStaleFacts(getConfig().min_trust_threshold)
                  } catch {
                    // Ignore pruning errors so they never break the add path.
                  }
                }

                return JSON.stringify(result)
              }

              case 'search': {
                if (!args.query) return 'Error: query is required for search'
                const results = await retriever.search(args.query, args.category, args.min_trust, limit)
                return JSON.stringify({ results: results.map(toScoredPublicFact), count: results.length })
              }

              case 'probe': {
                if (!args.entity) return 'Error: entity is required for probe'
                const results = await retriever.probe(args.entity, args.category, limit, args.min_trust)
                return JSON.stringify({ results: results.map(toScoredPublicFact), count: results.length })
              }

              case 'related': {
                if (!args.entity) return 'Error: entity is required for related'
                const results = await retriever.related(args.entity, args.category, limit, args.min_trust)
                return JSON.stringify({ results: results.map(toScoredPublicFact), count: results.length })
              }

              case 'reason': {
                if (!args.entities || args.entities.length === 0) return 'Error: entities array is required for reason'
                const results = await retriever.reason(args.entities, args.category, limit, args.min_trust)
                return JSON.stringify({ results: results.map(toScoredPublicFact), count: results.length })
              }

              case 'contradict': {
                const results = await retriever.contradict(args.category, args.threshold, limit, args.min_trust)
                return JSON.stringify({ results, count: results.length })
              }

              case 'update': {
                if (!args.fact_id) return 'Error: fact_id is required for update'
                const result = await store.updateFact(args.fact_id, {
                  content,
                  trust_delta: args.trust_delta,
                  tags: args.tags,
                })
                return result ? JSON.stringify(toPublicFact(result)) : 'Error: fact not found'
              }

              case 'remove': {
                if (!args.fact_id) return 'Error: fact_id is required for remove'
                const success = await store.removeFact(args.fact_id)
                return success ? JSON.stringify({ fact_id: args.fact_id, status: 'removed' }) : 'Error: fact not found'
              }

              case 'list': {
                const results = store.listFacts(args.category, args.min_trust, limit)
                return JSON.stringify({ results: results.map(toPublicFact), count: results.length })
              }

              default:
                return `Error: unknown action "${args.action}"`
            }
          } catch {
            // Sanitize: never leak db_path, SQL text, or stack traces across the tool boundary
            return 'Error: memory operation failed'
          }
        },
      }),

      fact_feedback: tool({
        description: `Record feedback on a fact to adjust its trust score.
Actions:
- helpful: Mark fact as helpful (trust += 0.05)
- unhelpful: Mark fact as unhelpful (trust -= 0.10, 2× penalty)`,

        args: {
          action: z.enum(['helpful', 'unhelpful']),
          fact_id: z.number().describe('Fact ID to provide feedback on'),
        },

        async execute(args) {
          const store = getStore()

          switch (args.action) {
            case 'helpful': {
              const result = store.recordHelpful(args.fact_id)
              return result ? JSON.stringify(result) : 'Error: fact not found'
            }

            case 'unhelpful': {
              const result = store.recordUnhelpful(args.fact_id)
              return result ? JSON.stringify(result) : 'Error: fact not found'
            }

            default:
              return `Error: unknown action "${args.action}"`
          }
        },
      }),
    },

    // ── System Prompt Injection ───────────────────────────────
    'experimental.chat.system.transform': async (_input, output) => {
      output.system.push(MEMORY_SYSTEM_PROMPT)
    },

    // ── Auto-Extract on Session Compaction ────────────────────
    'experimental.session.compacting': async (_input, output) => {
      const config = getConfig()
      if (!config.auto_extract) return

      output.context.push(
        'Holographic memory: auto-extract enabled. Facts mentioned in this conversation will be stored.'
      )
    },

    // ── Post-Compaction Extraction ────────────────────────────
    'experimental.compaction.autocontinue': async (_input, output) => {
      const config = getConfig()
      if (!config.auto_extract) return

      // Keep auto-continue enabled so the agent can process extracted facts
      output.enabled = true
    },
  }

  return hooks
}
