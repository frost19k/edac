/**
 * Optimization-fix validation suite for the Holographic Memory Plugin.
 *
 * Covers the P1/P2 fixes that are unit-testable WITHOUT the `execute` tool
 * boundary (which depends on a module singleton reading a fixed global config
 * path and has no DI seam — see the BLOCKED section at the bottom).
 *
 * All tests use isolated `:memory:` SQLite databases (or temp files for the
 * laziness check) and never touch the user's global config or on-disk store.
 */
import { test, expect, describe } from 'bun:test'
import { Database } from 'bun:sqlite'
import { rmSync } from 'fs'
import { HolographicStore } from './store'
import { FactRetriever } from './retrieval'
import { encodeAtom } from './hrr'
import { toPublicFact, toScoredPublicFact } from './serialize'
import type { HolographicConfig, Fact } from './types'

const TEST_CONFIG: HolographicConfig = {
  db_path: ':memory:',
  auto_extract: false,
  default_trust: 0.5,
  hrr_dim: 128,
  hrr_weight: 0.3,
  temporal_decay_half_life: 0,
  min_trust_threshold: 0.3,
}

function makeStore(): HolographicStore {
  return new HolographicStore({ ...TEST_CONFIG, db_path: ':memory:' })
}

function makeRetriever(store: HolographicStore): FactRetriever {
  return new FactRetriever(store, TEST_CONFIG)
}

// ─── P2.1 — Memoize encodeAtom ─────────────────────────────────────────────

describe('P2.1 encodeAtom memoization', () => {
  test('returns identical vectors for the same (word, dim)', async () => {
    // Arrange / Act
    const a = await encodeAtom('alice', 128)
    const b = await encodeAtom('alice', 128)
    // Assert
    expect(a.length).toBe(128)
    expect(b.length).toBe(128)
    expect(Array.from(a)).toEqual(Array.from(b))
  })

  test('returns clones — mutating one does not corrupt the cache or later calls', async () => {
    // Arrange
    const v1 = await encodeAtom('bob', 128)
    const v2 = await encodeAtom('bob', 128)
    const original0 = v1[0]
    // Act: mutate the first returned vector
    v1[0] = 999.0
    // Assert: the second (separate clone) is untouched
    expect(v2[0]).toBe(original0)
    // Assert: a fresh call returns the pristine cached value
    const v3 = await encodeAtom('bob', 128)
    expect(v3[0]).toBe(original0)
  })

  test('differs for different words and different dims', async () => {
    const a = await encodeAtom('x', 128)
    const b = await encodeAtom('y', 128)
    expect(Array.from(a)).not.toEqual(Array.from(b))
    const c = await encodeAtom('x', 64)
    expect(c.length).toBe(64)
    expect(a.length).toBe(128)
  })
})

// ─── P2.2 — Batch entity names ─────────────────────────────────────────────

describe('P2.2 getFactEntityNamesBatch', () => {
  test('returns grouped, lowercased entity names for many facts in one query', async () => {
    // Arrange
    const store = makeStore()
    const r1 = await store.addFact('Alice uses Postgres', 'project')
    const r2 = await store.addFact('Bob uses Mysql', 'project')
    // Act
    const batch = store.getFactEntityNamesBatch([r1.fact_id, r2.fact_id])
    // Assert
    expect(batch.size).toBe(2)
    expect(batch.get(r1.fact_id)!.sort()).toEqual(['alice', 'postgres'])
    expect(batch.get(r2.fact_id)!.sort()).toEqual(['bob', 'mysql'])
    store.close()
  })

  test('returns an empty map for empty input', () => {
    const store = makeStore()
    const batch = store.getFactEntityNamesBatch([])
    expect(batch.size).toBe(0)
    store.close()
  })

  test('includes an empty-array entry for facts that have no entities', async () => {
    const store = makeStore()
    const r = await store.addFact('x y z', 'project') // no capitalized/quoted tokens → no entities
    const batch = store.getFactEntityNamesBatch([r.fact_id])
    expect(batch.has(r.fact_id)).toBe(true)
    expect(batch.get(r.fact_id)).toEqual([])
    store.close()
  })
})

// ─── P2.3 — Lazy bank rebuild ──────────────────────────────────────────────

describe('P2.3 lazy bank rebuild', () => {
  test('bank reflects writes after read (add → getBank → add → getBank)', async () => {
    // Arrange / Act / Assert
    const store = makeStore()
    await store.addFact('Alice uses postgres', 'project') // marks 'project' dirty
    let bank = store.getBank('project')
    expect(bank).not.toBeNull()
    expect(bank!.fact_count).toBe(1)

    await store.addFact('Bob uses mysql', 'project') // marks 'project' dirty again
    bank = store.getBank('project')
    expect(bank!.fact_count).toBe(2)

    // A category with no facts yields no bank
    expect(store.getBank('nonexistent')).toBeNull()
    store.close()
  })

  test('addFact does NOT eagerly rebuild — getBank rebuilds lazily on first read', async () => {
    // Arrange: use a file DB so a second connection can inspect memory_banks
    const dbPath = `/tmp/opencode/hm_lazy_${process.pid}.db`
    try { rmSync(dbPath) } catch {}
    const store = new HolographicStore({ ...TEST_CONFIG, db_path: dbPath })

    await store.addFact('Alice uses postgres', 'project') // marks dirty, must NOT write memory_banks yet

    // Act: inspect the raw table via a second connection BEFORE any getBank call
    const inspector = new Database(dbPath)
    const before = (
      inspector.query('SELECT COUNT(*) as c FROM memory_banks WHERE bank_name = ?').get('cat:project') as {
        c: number
      }
    ).c
    // Assert: nothing was rebuilt eagerly
    expect(before).toBe(0)

    // Act: first read triggers the lazy rebuild
    const bank = store.getBank('project')
    const after = (
      inspector.query('SELECT COUNT(*) as c FROM memory_banks WHERE bank_name = ?').get('cat:project') as {
        c: number
      }
    ).c
    // Assert: getBank rebuilt it
    expect(bank).not.toBeNull()
    expect(bank!.fact_count).toBe(1)
    expect(after).toBe(1)

    inspector.close()
    store.close()
    try { rmSync(dbPath) } catch {}
  })
})

// ─── P2.4 — Thread min_trust through retrieval ─────────────────────────────

describe('P2.4 minTrust threading (probe/related/reason/contradict)', () => {
  async function twoFactsWithTrust(store: HolographicStore) {
    const a = await store.addFact('Alice prefers vim', 'project') // trust 0.5
    const b = await store.addFact('Alice prefers emacs', 'project') // lowered to 0.1
    await store.updateFact(b.fact_id, { trust_delta: -0.4 })
    return { a, b }
  }

  test('probe honors explicit minTrust — excludes facts below threshold', async () => {
    const store = makeStore()
    const { a, b } = await twoFactsWithTrust(store)
    const retr = makeRetriever(store)

    const high = await retr.probe('alice', undefined, 10, 0.3)
    expect(high.map(f => f.fact_id).sort()).toEqual([a.fact_id])

    const low = await retr.probe('alice', undefined, 10, 0.05)
    expect(low.map(f => f.fact_id).sort()).toEqual([a.fact_id, b.fact_id].sort())
    store.close()
  })

  test('probe uses config default minTrust when minTrust is omitted', async () => {
    const store = makeStore()
    const { a, b } = await twoFactsWithTrust(store)
    const retr = makeRetriever(store)

    const res = await retr.probe('alice', undefined, 10) // no minTrust → default 0.3
    expect(res.map(f => f.fact_id).sort()).toEqual([a.fact_id])
    store.close()
  })

  test('related honors explicit minTrust', async () => {
    const store = makeStore()
    const a = await store.addFact('Alice manages servers', 'project')
    const b = await store.addFact('Alice manages databases', 'project')
    await store.updateFact(b.fact_id, { trust_delta: -0.4 })
    const retr = makeRetriever(store)

    const high = await retr.related('alice', undefined, 10, 0.3)
    expect(high.map(f => f.fact_id).sort()).toEqual([a.fact_id])
    const low = await retr.related('alice', undefined, 10, 0.05)
    expect(low.map(f => f.fact_id).sort()).toEqual([a.fact_id, b.fact_id].sort())
    store.close()
  })

  test('reason honors explicit minTrust', async () => {
    const store = makeStore()
    const a = await store.addFact('Alice owns the api', 'project')
    const b = await store.addFact('Alice owns the cli', 'project')
    await store.updateFact(b.fact_id, { trust_delta: -0.4 })
    const retr = makeRetriever(store)

    const high = await retr.reason(['alice'], undefined, 10, 0.3)
    expect(high.map(f => f.fact_id).sort()).toEqual([a.fact_id])
    const low = await retr.reason(['alice'], undefined, 10, 0.05)
    expect(low.map(f => f.fact_id).sort()).toEqual([a.fact_id, b.fact_id].sort())
    store.close()
  })

  test('contradict honors explicit minTrust — excludes a low-trust contradicting fact', async () => {
    const store = makeStore()
    const a = await store.addFact('our "cache" "store" uses "redis" and is fast', 'project') // 0.5
    const b = await store.addFact('our "cache" "store" uses "memcached" and is slow', 'project') // 0.1
    await store.updateFact(b.fact_id, { trust_delta: -0.4 })
    const retr = makeRetriever(store)

    // High minTrust → only `a` is a candidate → no pair → no contradictions
    const high = await retr.contradict('project', 0.001, 10, 0.3)
    expect(high.length).toBe(0)

    // Low minTrust → both candidates → contradiction detected
    const low = await retr.contradict('project', 0.001, 10, 0.05)
    expect(low.length).toBeGreaterThan(0)
    store.close()
  })
})

// ─── P2.5 — Limit-aware candidate fetch ────────────────────────────────────

describe('P2.5 limit-aware fetch (probe/related/reason)', () => {
  test('probe respects a small limit in the result count', async () => {
    const store = makeStore()
    for (let i = 0; i < 10; i++) await store.addFact(`Alice fact number ${i}`, 'project')
    const retr = makeRetriever(store)
    const res = await retr.probe('alice', undefined, 3, 0.0)
    expect(res.length).toBe(3)
    store.close()
  })

  test('related respects a small limit', async () => {
    const store = makeStore()
    for (let i = 0; i < 10; i++) await store.addFact(`Alice item ${i}`, 'project')
    const retr = makeRetriever(store)
    const res = await retr.related('alice', undefined, 4, 0.0)
    expect(res.length).toBe(4)
    store.close()
  })

  test('reason respects a small limit', async () => {
    const store = makeStore()
    for (let i = 0; i < 10; i++) await store.addFact(`Alice thing ${i}`, 'project')
    const retr = makeRetriever(store)
    const res = await retr.reason(['alice'], undefined, 5, 0.0)
    expect(res.length).toBe(5)
    store.close()
  })

  test('candidate fetch is capped at CANDIDATE_FETCH_CAP (500) even with a huge limit', async () => {
    const store = makeStore()
    const N = 520
    for (let i = 0; i < N; i++) await store.addFact(`Alice bulk fact ${i}`, 'project')
    const retr = makeRetriever(store)
    // limit 1000 > CANDIDATE_FETCH_CAP(500): fetchLimit = min(1000, 500) = 500
    const res = await retr.probe('alice', undefined, 1000, 0.0)
    expect(res.length).toBe(500)
    store.close()
  })
})

// ─── serialize.ts regression (hrr_vector / fts_rank stripping) ──────────────

describe('serialize regression — projection strips internal artifacts', () => {
  test('toPublicFact strips hrr_vector', () => {
    const fact: Fact = {
      fact_id: 1, content: 'c', category: 'project', tags: '', trust_score: 0.5,
      retrieval_count: 0, helpful_count: 0, created_at: '', updated_at: '',
      hrr_vector: new Uint8Array([1, 2, 3]),
    }
    const pub = toPublicFact(fact)
    expect('hrr_vector' in pub).toBe(false)
    expect(pub.content).toBe('c')
  })

  test('toScoredPublicFact strips both hrr_vector and fts_rank', () => {
    const sf = {
      fact_id: 2, content: 'c2', category: 'project', tags: '', trust_score: 0.5,
      retrieval_count: 0, helpful_count: 0, created_at: '', updated_at: '',
      hrr_vector: new Uint8Array([4, 5, 6]), fts_rank: -0.5, score: 0.9,
    }
    const pub = toScoredPublicFact(sf as any)
    expect('hrr_vector' in pub).toBe(false)
    expect('fts_rank' in pub).toBe(false)
    expect(pub.score).toBe(0.9)
  })

  test('retriever results mapped via toScoredPublicFact contain no hrr_vector/fts_rank', async () => {
    const store = makeStore()
    await store.addFact('Alice uses postgres', 'project')
    const retr = makeRetriever(store)
    const results = await retr.probe('alice', undefined, 10, 0.0)
    const mapped = results.map(toScoredPublicFact)
    expect(mapped.length).toBeGreaterThan(0)
    for (const m of mapped) {
      expect('hrr_vector' in m).toBe(false)
      expect('fts_rank' in m).toBe(false)
    }
    store.close()
  })
})

// ─── P1.2 — duplicate add returns { status: "exists" } ─────────────────────

describe('P1.2 duplicate-add dedup result', () => {
  test('adding identical content twice returns status "exists" with the original id', async () => {
    const store = makeStore()
    const first = await store.addFact('dedupe me content', 'project')
    expect(first.status).toBe('added')
    const second = await store.addFact('dedupe me content', 'project')
    expect(second.status).toBe('exists')
    expect(second.fact_id).toBe(first.fact_id)
    store.close()
  })
})

// ─── BLOCKED: P1.1 clamp & P1.2 sanitized error ─────────────────────────────
// These behaviours live ONLY at the `execute` boundary in holographic-memory.ts.
// `execute` depends on a module-level singleton (getStore/getRetriever) that
// reads its DB path from a FIXED global config path
// (~/.config/opencode/holographic_memory.json) with no dependency-injection
// seam. Hermetic testing would require either:
//   (a) redirecting the DB via that global config file — FORBIDDEN (must not
//       touch the user's global config), or
//   (b) refactoring the tool factory to accept an injected store/retriever, or
//   (c) exporting MAX_LIMIT / MAX_CONTENT_LENGTH for direct assertion.
// None are permissible without modifying plugin source. Verified by code
// inspection only; documented here as a testability gap.
test.skip('P1.1 limit is clamped to MAX_LIMIT (200) at the execute boundary', () => {})
test.skip('P1.1 content is truncated to MAX_CONTENT_LENGTH (8192) at the execute boundary', () => {})
test.skip('P1.2 error path returns the sanitized "Error: memory operation failed" string', () => {})
