// SQLite Store — Persistence layer for holographic memory
// Uses Bun's built-in SQLite (bun:sqlite)
// Faithful port from Hermes Agent (NousResearch/hermes-agent)

import { Database } from 'bun:sqlite'
import { dirname } from 'path'
import { mkdirSync } from 'fs'
import * as hrr from './hrr'
import { extractEntities, normalizeEntityName } from './entities'
import type {
  Fact,
  Entity,
  MemoryBank,
  ScoredFact,
  AddFactResult,
  FeedbackResult,
  HolographicConfig,
} from './types'

/** Trust scoring constants (asymmetric: bad facts sink faster) */
const HELPFUL_DELTA = 0.05
const UNHELPFUL_DELTA = -0.10
const TRUST_MIN = 0.0
const TRUST_MAX = 1.0

/**
 * Holographic memory store backed by SQLite.
 * Manages facts, entities, memory banks, and FTS5 search.
 */
export class HolographicStore {
  private db: Database
  private dim: number
  private defaultTrust: number
  private dirtyBanks: Set<string> = new Set()

  constructor(config: HolographicConfig) {
    // Ensure directory exists
    const dir = dirname(config.db_path)
    mkdirSync(dir, { recursive: true })

    this.db = new Database(config.db_path)
    this.dim = config.hrr_dim
    this.defaultTrust = config.default_trust

    // Enable WAL mode for concurrent access
    this.db.exec('PRAGMA journal_mode = WAL')
    this.db.exec('PRAGMA foreign_keys = ON')

    this.initSchema()
  }

  /** Create tables, indexes, and triggers */
  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS facts (
        fact_id         INTEGER PRIMARY KEY AUTOINCREMENT,
        content         TEXT NOT NULL UNIQUE,
        category        TEXT DEFAULT 'general',
        tags            TEXT DEFAULT '',
        trust_score     REAL DEFAULT 0.5,
        retrieval_count INTEGER DEFAULT 0,
        helpful_count   INTEGER DEFAULT 0,
        created_at      TEXT DEFAULT (datetime('now')),
        updated_at      TEXT DEFAULT (datetime('now')),
        hrr_vector      BLOB
      );

      CREATE TABLE IF NOT EXISTS entities (
        entity_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        entity_type TEXT DEFAULT 'unknown',
        aliases     TEXT DEFAULT '',
        created_at  TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS fact_entities (
        fact_id   INTEGER REFERENCES facts(fact_id) ON DELETE CASCADE,
        entity_id INTEGER REFERENCES entities(entity_id) ON DELETE CASCADE,
        PRIMARY KEY (fact_id, entity_id)
      );

      CREATE TABLE IF NOT EXISTS memory_banks (
        bank_id    INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_name  TEXT NOT NULL UNIQUE,
        vector     BLOB NOT NULL,
        dim        INTEGER NOT NULL,
        fact_count INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS facts_fts
        USING fts5(content, tags, content=facts, content_rowid=fact_id);

      CREATE INDEX IF NOT EXISTS idx_facts_trust    ON facts(trust_score DESC);
      CREATE INDEX IF NOT EXISTS idx_facts_category ON facts(category);
      CREATE INDEX IF NOT EXISTS idx_entities_name  ON entities(name);
    `)

    // FTS5 sync triggers (match Hermes exactly)
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS facts_ai AFTER INSERT ON facts BEGIN
        INSERT INTO facts_fts(rowid, content, tags)
          VALUES (new.fact_id, new.content, new.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS facts_ad AFTER DELETE ON facts BEGIN
        INSERT INTO facts_fts(facts_fts, rowid, content, tags)
          VALUES ('delete', old.fact_id, old.content, old.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS facts_au AFTER UPDATE ON facts BEGIN
        INSERT INTO facts_fts(facts_fts, rowid, content, tags)
          VALUES ('delete', old.fact_id, old.content, old.tags);
        INSERT INTO facts_fts(rowid, content, tags)
          VALUES (new.fact_id, new.content, new.tags);
      END;
    `)
  }

  // ─── Fact CRUD ───────────────────────────────────────────────

  /**
   * Add a fact. Deduplicates by content (UNIQUE constraint).
   * Auto-extracts entities and computes HRR vector.
   */
  async addFact(
    content: string,
    category: string = 'general',
    tags: string = ''
  ): Promise<AddFactResult> {
    // Check for existing fact
    const existing = this.db.query(
      'SELECT fact_id FROM facts WHERE content = ?'
    ).get(content) as { fact_id: number } | undefined

    if (existing) {
      return { fact_id: existing.fact_id, status: 'exists' }
    }

    // Extract entities
    const extractedEntities = extractEntities(content)
    const entityNames = extractedEntities.map(e => e.name)

    // Compute HRR vector
    const hrrVector = await hrr.encodeFact(content, entityNames, this.dim)
    const vectorBytes = hrr.phasesToBytes(hrrVector)

    // Insert fact (guard against concurrent UNIQUE violation race)
    let factId: number
    try {
      const result = this.db.query(
        `INSERT INTO facts (content, category, tags, trust_score, hrr_vector)
         VALUES (?, ?, ?, ?, ?)`
      ).run(content, category, tags, this.defaultTrust, vectorBytes)
      factId = Number(result.lastInsertRowid)
    } catch {
      const existing = this.db.query(
        'SELECT fact_id FROM facts WHERE content = ?'
      ).get(content) as { fact_id: number } | undefined
      if (existing) {
        return { fact_id: existing.fact_id, status: 'exists' }
      }
      throw new Error('Failed to insert fact')
    }

    // Link entities
    for (const entity of extractedEntities) {
      await this.linkEntity(factId, entity.name, entity.type)
    }

    // Mark bank dirty; it will be rebuilt lazily on next read
    this.markBankDirty(category)

    return { fact_id: factId, status: 'added' }
  }

  /** Link a fact to an entity (create entity if needed) */
  private async linkEntity(
    factId: number,
    entityName: string,
    entityType: string
  ): Promise<void> {
    const normalized = normalizeEntityName(entityName)

    // Find or create entity
    let entity = this.db.query(
      'SELECT entity_id FROM entities WHERE LOWER(name) = ?'
    ).get(normalized) as { entity_id: number } | undefined

    if (!entity) {
      const result = this.db.query(
        'INSERT INTO entities (name, entity_type) VALUES (?, ?)'
      ).run(normalized, entityType)
      entity = { entity_id: Number(result.lastInsertRowid) }
    }

    // Link (ignore if already linked)
    this.db.query(
      'INSERT OR IGNORE INTO fact_entities (fact_id, entity_id) VALUES (?, ?)'
    ).run(factId, entity.entity_id)
  }

  /** Get a fact by ID */
  getFact(factId: number): Fact | null {
    const row = this.db.query(
      'SELECT * FROM facts WHERE fact_id = ?'
    ).get(factId) as Fact | undefined
    return row ?? null
  }

  /** Update a fact (partial update) */
  async updateFact(
    factId: number,
    updates: { content?: string; trust_delta?: number; tags?: string }
  ): Promise<Fact | null> {
    const fact = this.getFact(factId)
    if (!fact) return null

    const newContent = updates.content ?? fact.content
    const newTags = updates.tags ?? fact.tags
    let newTrust = fact.trust_score

    if (updates.trust_delta !== undefined) {
      newTrust = Math.max(TRUST_MIN, Math.min(TRUST_MAX, fact.trust_score + updates.trust_delta))
    }

    // Recompute HRR if content changed
    let vectorBytes = fact.hrr_vector
    if (updates.content && updates.content !== fact.content) {
      const entities = extractEntities(updates.content)
      const hrrVector = await hrr.encodeFact(updates.content, entities.map(e => e.name), this.dim)
      vectorBytes = hrr.phasesToBytes(hrrVector)
    }

    this.db.query(
      `UPDATE facts SET content = ?, tags = ?, trust_score = ?, hrr_vector = ?, updated_at = datetime('now')
       WHERE fact_id = ?`
    ).run(newContent, newTags, newTrust, vectorBytes, factId)

    // Re-link entities if content changed
    if (updates.content && updates.content !== fact.content) {
      this.db.query('DELETE FROM fact_entities WHERE fact_id = ?').run(factId)
      const entities = extractEntities(updates.content)
      for (const entity of entities) {
        await this.linkEntity(factId, entity.name, entity.type)
      }
    }

    // Mark bank dirty; it will be rebuilt lazily on next read
    this.markBankDirty(fact.category)

    return this.getFact(factId)
  }

  /** Remove a fact */
  async removeFact(factId: number): Promise<boolean> {
    const fact = this.getFact(factId)
    if (!fact) return false

    this.db.query('DELETE FROM facts WHERE fact_id = ?').run(factId)
    this.markBankDirty(fact.category)
    return true
  }

  /** List facts by category and minimum trust */
  listFacts(
    category?: string,
    minTrust: number = 0,
    limit: number = 20
  ): Fact[] {
    let query = 'SELECT * FROM facts WHERE trust_score >= ?'
    const params: unknown[] = [minTrust]

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    query += ' ORDER BY trust_score DESC LIMIT ?'
    params.push(limit)

    return this.db.query(query).all(...params) as Fact[]
  }

  // ─── Feedback ────────────────────────────────────────────────

  /** Record positive feedback on a fact */
  recordHelpful(factId: number): FeedbackResult | null {
    const fact = this.getFact(factId)
    if (!fact) return null

    const newTrust = Math.min(TRUST_MAX, fact.trust_score + HELPFUL_DELTA)
    const newHelpfulCount = fact.helpful_count + 1

    this.db.query(
      `UPDATE facts SET trust_score = ?, helpful_count = ?, updated_at = datetime('now')
       WHERE fact_id = ?`
    ).run(newTrust, newHelpfulCount, factId)

    return {
      fact_id: factId,
      old_trust: fact.trust_score,
      new_trust: newTrust,
      helpful_count: newHelpfulCount,
    }
  }

  /** Record negative feedback on a fact */
  recordUnhelpful(factId: number): FeedbackResult | null {
    const fact = this.getFact(factId)
    if (!fact) return null

    const newTrust = Math.max(TRUST_MIN, fact.trust_score + UNHELPFUL_DELTA)
    const newHelpfulCount = Math.max(0, fact.helpful_count - 1)

    this.db.query(
      `UPDATE facts SET trust_score = ?, helpful_count = ?, updated_at = datetime('now')
       WHERE fact_id = ?`
    ).run(newTrust, newHelpfulCount, factId)

    return {
      fact_id: factId,
      old_trust: fact.trust_score,
      new_trust: newTrust,
      helpful_count: newHelpfulCount,
    }
  }

  // ─── Memory Banks ────────────────────────────────────────────

  /** Rebuild the superposed HRR vector for a category */
  rebuildBank(category: string): void {
    const bankName = `cat:${category}`
    const rows = this.db.query(
      'SELECT hrr_vector FROM facts WHERE category = ? AND hrr_vector IS NOT NULL'
    ).all(category) as { hrr_vector: Uint8Array }[]

    if (rows.length === 0) {
      this.db.query('DELETE FROM memory_banks WHERE bank_name = ?').run(bankName)
      return
    }

    const vectors = rows.map(r => hrr.bytesToPhases(new Uint8Array(r.hrr_vector)))
    const bankVector = hrr.bundle(vectors)
    const vectorBytes = hrr.phasesToBytes(bankVector)

    this.db.query(
      `INSERT INTO memory_banks (bank_name, vector, dim, fact_count, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(bank_name) DO UPDATE SET
         vector = excluded.vector,
         dim = excluded.dim,
         fact_count = excluded.fact_count,
         updated_at = excluded.updated_at`
    ).run(bankName, vectorBytes, this.dim, rows.length)
  }

  /** Mark a category bank as dirty so it is rebuilt lazily on next read */
  private markBankDirty(category: string): void {
    this.dirtyBanks.add(category)
  }

  /** Rebuild the bank if it has been marked dirty */
  private ensureBankFresh(category: string): void {
    if (this.dirtyBanks.has(category)) {
      this.rebuildBank(category)
      this.dirtyBanks.delete(category)
    }
  }

  /** Get memory bank vector for a category (rebuilds first if dirty) */
  getBank(category: string): MemoryBank | null {
    this.ensureBankFresh(category)
    const bankName = `cat:${category}`
    const row = this.db.query(
      'SELECT * FROM memory_banks WHERE bank_name = ?'
    ).get(bankName) as MemoryBank | undefined
    return row ?? null
  }

  // ─── Entity Queries ──────────────────────────────────────────

  /** Get all entities linked to a fact */
  getFactEntities(factId: number): Entity[] {
    return this.db.query(
      `SELECT e.* FROM entities e
       JOIN fact_entities fe ON e.entity_id = fe.entity_id
       WHERE fe.fact_id = ?`
    ).all(factId) as Entity[]
  }

  /** Get entity names for a fact (lowercased) */
  getFactEntityNames(factId: number): string[] {
    const entities = this.getFactEntities(factId)
    return entities.map(e => e.name.toLowerCase())
  }

  /** Get lowercased entity names for multiple facts in a single query */
  getFactEntityNamesBatch(factIds: number[]): Map<number, string[]> {
    const grouped = new Map<number, string[]>()
    if (factIds.length === 0) return grouped

    const placeholders = factIds.map(() => '?').join(', ')
    const rows = this.db.query(
      `SELECT fe.fact_id, e.name
       FROM fact_entities fe
       JOIN entities e ON e.entity_id = fe.entity_id
       WHERE fe.fact_id IN (${placeholders})`
    ).all(...factIds) as { fact_id: number; name: string }[]

    for (const row of rows) {
      const names = grouped.get(row.fact_id) ?? []
      names.push(row.name.toLowerCase())
      grouped.set(row.fact_id, names)
    }

    // Ensure every requested fact has an entry (empty array if no entities)
    for (const factId of factIds) {
      if (!grouped.has(factId)) {
        grouped.set(factId, [])
      }
    }

    return grouped
  }

  /** Get all facts linked to an entity */
  getEntityFacts(entityName: string): Fact[] {
    const normalized = normalizeEntityName(entityName)
    return this.db.query(
      `SELECT f.* FROM facts f
       JOIN fact_entities fe ON f.fact_id = fe.fact_id
       JOIN entities e ON fe.entity_id = e.entity_id
       WHERE LOWER(e.name) = ?`
    ).all(normalized) as Fact[]
  }

  // ─── FTS5 Search ─────────────────────────────────────────────

  /** Raw FTS5 candidate retrieval */
  ftsCandidates(
    query: string,
    category?: string,
    minTrust: number = 0,
    limit: number = 30
  ): (Fact & { fts_rank: number })[] {
    // Sanitize FTS5 query (handle hyphens)
    const sanitized = sanitizeFts5Query(query)

    let sql = `
      SELECT f.*, fts.rank AS fts_rank
      FROM facts_fts fts
      JOIN facts f ON f.fact_id = fts.rowid
      WHERE facts_fts MATCH ?
        AND f.trust_score >= ?
    `
    const params: unknown[] = [sanitized, minTrust]

    if (category) {
      sql += ' AND f.category = ?'
      params.push(category)
    }

    sql += ' ORDER BY fts.rank LIMIT ?'
    params.push(limit)

    try {
      return this.db.query(sql).all(...params) as (Fact & { fts_rank: number })[]
    } catch {
      // FTS5 query parse error — fall back to empty
      return []
    }
  }

  // ─── Stats ───────────────────────────────────────────────────

  /** Get total fact count */
  factCount(): number {
    const row = this.db.query('SELECT COUNT(*) as count FROM facts').get() as { count: number }
    return row.count
  }

  /** Get fact count by category */
  factCountByCategory(category: string): number {
    const row = this.db.query(
      'SELECT COUNT(*) as count FROM facts WHERE category = ?'
    ).get(category) as { count: number }
    return row.count
  }

  /** Increment retrieval count for a fact */
  incrementRetrieval(factId: number): void {
    this.db.query(
      `UPDATE facts SET retrieval_count = retrieval_count + 1, updated_at = datetime('now')
       WHERE fact_id = ?`
    ).run(factId)
  }

  /** Batch increment retrieval count for multiple facts (single SQL write) */
  incrementRetrievals(factIds: number[]): void {
    if (factIds.length === 0) return
    const placeholders = factIds.map(() => '?').join(', ')
    this.db.query(
      `UPDATE facts SET retrieval_count = retrieval_count + 1, updated_at = datetime('now')
       WHERE fact_id IN (${placeholders})`
    ).run(...factIds)
  }

  /**
   * Hard-prune stale facts that are unlikely to be useful.
   *
   * A fact is considered stale only when ALL three criteria are met:
   * 1. Low trust — its trust score is below `minTrustThreshold`.
   * 2. Zero retrievals — it has never been retrieved (`retrieval_count = 0`).
   * 3. Long dormancy — it was last updated more than 90 days ago.
   *
   * The 90-day threshold corresponds to three half-lives of the default 30-day
   * temporal decay half-life, ensuring a fact has had ample time to demonstrate
   * value before removal. Each criterion alone is insufficient; together they
   * identify facts that are both untrusted and unused.
   *
   * @param minTrustThreshold — minimum trust score a fact must have to avoid pruning
   * @returns number of facts deleted
   */
  pruneStaleFacts(minTrustThreshold: number): number {
    this.db.query(
      `DELETE FROM facts
       WHERE trust_score < ?
         AND retrieval_count = 0
         AND updated_at < datetime('now', '-90 days')`
    ).run(minTrustThreshold)

    const row = this.db.query('SELECT changes() as count').get() as { count: number }
    return row.count
  }

  /** Close the database connection */
  close(): void {
    this.db.close()
  }
}

// ─── FTS5 Query Sanitization ──────────────────────────────────

/**
 * Sanitize FTS5 query to handle hyphens and special characters.
 * Wraps bare hyphenated/dotted tokens in double quotes.
 */
function sanitizeFts5Query(query: string): string {
  // Wrap entire query in double quotes to prevent FTS5 operator injection.
  // Escape any embedded double quotes by doubling them (FTS5 escape rule).
  return '"' + query.replace(/"/g, '""') + '"'
}
